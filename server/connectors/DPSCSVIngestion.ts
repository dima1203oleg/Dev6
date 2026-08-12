/**
 * DPS CSV Ingestion Pipeline
 * 
 * Implements bulk ingestion for DPS CSV export endpoints:
 * - /export/pdv (VAT Payers)
 * - /export/reestr_edpod (Single Tax)
 * - /export/reestr_searpse (Excise Tax)
 * - /export/reestr_operac_z_tov (Goods Operations)
 * - /export/reestr_nuo (Non-Profit)
 * - /export/rro_cso (CSO)
 * 
 * Pipeline:
 * HTTP Download → SHA-256 → Raw File Storage → CSV Parser → 
 * Encoding Detection → Header Detection → Schema Validation → 
 * Column Normalization → Data Quality → Entity Resolution → PostgreSQL
 */

import crypto from 'crypto';
import { DPSCSVExportType, DPSCSVExportResponse, DPSCSVExportNormalized } from './types/dps';
import { hydraEngine } from '../services/hydraEngine';
import { getDPSTokenManager } from './DPSTokenManager';
import { getDPSRateLimiter } from './DPSRateLimiter';
import { DPSTokenManager } from './DPSTokenManager';

export class DPSCSVIngestion {
  private readonly baseUrl = 'https://cabinet.tax.gov.ua/export';
  private readonly tokenManager = getDPSTokenManager();
  private readonly rateLimiter = getDPSRateLimiter();

  /**
   * Download CSV export from DPS
   */
  async downloadCSV(exportType: DPSCSVExportType): Promise<DPSCSVExportResponse> {
    const token = await this.tokenManager.getToken();
    const tokenHash = DPSTokenManager.hashToken(token || '');

    // Check rate limit
    const rateLimitStatus = await this.rateLimiter.checkLimit();
    if (!rateLimitStatus.allowed) {
      throw new Error(`RATE_LIMITED: ${rateLimitStatus.reason}`);
    }

    const response = await fetch(`${this.baseUrl}/${exportType}?token=${token}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv'
      }
    });

    const httpStatus = response.status;
    this.rateLimiter.recordRequest();

    if (httpStatus !== 200) {
      this.tokenManager.recordFailure(tokenHash, new Error(`HTTP ${httpStatus}`));
      throw new Error(`DPS_CSV_DOWNLOAD_ERROR: HTTP ${httpStatus}`);
    }

    const csvData = await response.text();
    const sha256 = crypto.createHash('sha256').update(csvData).digest('hex');
    const rowCount = this.countCSVRows(csvData);
    const fileSize = Buffer.byteLength(csvData, 'utf8');

    this.tokenManager.recordSuccess(tokenHash);

    return {
      csvData,
      rowCount,
      fileSize,
      sha256,
      downloadedAt: new Date().toISOString()
    };
  }

  /**
   * Parse CSV data
   */
  parseCSV(csvData: string): any[] {
    if (!csvData) return [];
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Detect delimiter (comma, semicolon, tab)
    const firstLine = lines[0];
    const delimiter = this.detectDelimiter(firstLine || '');

    // Parse headers
    const headers = this.parseCSVLine(firstLine || '', delimiter);

    // Parse data rows
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i] || '', delimiter);
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || null;
        });
        rows.push(row);
      }
    }

    return rows;
  }

  /**
   * Detect CSV delimiter
   */
  private detectDelimiter(line: string): string {
    if (!line) return ',';
    const commaCount = (line.match(/,/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;
    const tabCount = (line.match(/\t/g) || []).length;

    if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
    if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
    return ',';
  }

  /**
   * Parse a single CSV line
   */
  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Count CSV rows (excluding header)
   */
  private countCSVRows(csvData: string): number {
    if (!csvData) return 0;
    const lines = csvData.split('\n').filter(line => line.trim());
    return Math.max(0, lines.length - 1); // Exclude header
  }

  /**
   * Validate CSV data quality
   */
  validateCSVData(records: any[], exportType: DPSCSVExportType): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (records.length === 0) {
      errors.push('CSV_EMPTY: No data rows found');
      return { valid: false, errors, warnings };
    }

    // Check for required fields based on export type
    const requiredFields = this.getRequiredFields(exportType);
    const firstRecord = records[0];

    for (const field of requiredFields) {
      if (!(field in firstRecord) || firstRecord[field] === null || firstRecord[field] === '') {
        errors.push(`MISSING_REQUIRED_FIELD: ${field}`);
      }
    }

    // Check for empty records
    const emptyRecords = records.filter(r => Object.values(r).every(v => v === null || v === ''));
    if (emptyRecords.length > 0) {
      warnings.push(`EMPTY_RECORDS: ${emptyRecords.length} records with no data`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get required fields for each export type
   */
  private getRequiredFields(exportType: DPSCSVExportType): string[] {
    switch (exportType) {
      case 'pdv':
        return ['kodPdv', 'tin', 'name'];
      case 'reestr_edpod':
        return ['tin', 'fullName'];
      case 'reestr_searpse':
        return ['tin', 'fullName'];
      case 'reestr_operac_z_tov':
        return ['tin'];
      case 'reestr_nuo':
        return ['tin', 'fullName'];
      case 'rro_cso':
        return ['tin'];
      default:
        return [];
    }
  }

  /**
   * Normalize CSV records
   */
  normalizeCSVRecords(records: any[], exportType: DPSCSVExportType): any[] {
    return records.map(record => {
      const normalized: any = {
        source: 'ua.dps',
        exportType,
        ingestedAt: new Date().toISOString()
      };

      // Normalize common fields
      if (record.tin) normalized.rnokpp = record.tin;
      if (record.fullName) normalized.fullName = record.fullName;
      if (record.name) normalized.fullName = record.name;
      if (record.kved) normalized.kved = record.kved;
      if (record.address) normalized.address = record.address;

      // Export-specific normalization
      switch (exportType) {
        case 'pdv':
          if (record.kodPdv) normalized.vatCode = record.kodPdv;
          if (record.datReestr) normalized.vatRegistrationDate = record.datReestr;
          break;
        case 'reestr_edpod':
          if (record.groupPay) normalized.taxGroup = record.groupPay;
          break;
        case 'reestr_searpse':
          if (record.nReg) normalized.registrationNumber = record.nReg;
          break;
      }

      return normalized;
    });
  }

  /**
   * Full ingestion pipeline
   */
  async ingestCSV(exportType: DPSCSVExportType): Promise<DPSCSVExportNormalized> {
    // Step 1: Download CSV
    const downloadResult = await this.downloadCSV(exportType);

    // Step 2: Generate evidence
    hydraEngine.verifyAndIngestRawEvidence({
      sourceId: 'ua.dps.csv',
      query: exportType,
      endpointUrl: `${this.baseUrl}/${exportType}`,
      rawPayload: downloadResult.csvData,
      httpStatus: 200,
      connectorVersion: 'v1.0.0'
    });

    // Step 3: Parse CSV
    const records = this.parseCSV(downloadResult.csvData);

    // Step 4: Validate data quality
    const validation = this.validateCSVData(records, exportType);

    if (!validation.valid) {
      throw new Error(`CSV_VALIDATION_FAILED: ${validation.errors.join(', ')}`);
    }

    // Step 5: Normalize records
    const normalizedRecords = this.normalizeCSVRecords(records, exportType);

    return {
      exportType,
      records: normalizedRecords,
      rowCount: downloadResult.rowCount,
      sha256: downloadResult.sha256,
      downloadedAt: downloadResult.downloadedAt,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Store raw CSV file (placeholder for MinIO/S3 integration)
   */
  async storeRawFile(exportType: DPSCSVExportType, _csvData: string, sha256: string): Promise<string> {
    // TODO: Integrate with MinIO or S3-compatible storage
    // For now, return a placeholder path
    const storagePath = `dps-raw/${exportType}/${sha256}.csv`;
    console.log(`[DPSCSVIngestion] Raw file would be stored at: ${storagePath}`);
    return storagePath;
  }

  /**
   * Get ingestion status
   */
  getIngestionStatus(): {
    supportedExports: DPSCSVExportType[];
    baseUrl: string;
  } {
    return {
      supportedExports: ['pdv', 'reestr_edpod', 'reestr_searpse', 'reestr_operac_z_tov', 'reestr_nuo', 'rro_cso'],
      baseUrl: this.baseUrl
    };
  }
}

// Singleton instance
let csvIngestionInstance: DPSCSVIngestion | null = null;

export function getDPSCSVIngestion(): DPSCSVIngestion {
  if (!csvIngestionInstance) {
    csvIngestionInstance = new DPSCSVIngestion();
  }
  return csvIngestionInstance;
}

export function resetDPSCSVIngestion(): void {
  csvIngestionInstance = null;
}
