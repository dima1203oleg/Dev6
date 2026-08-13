/**
 * Registry Discovery Platform (RDP)
 * Automatic Resource Downloader
 * 
 * Automatically selects optimal download method and handles multiple formats
 */

import { Dataset, DatasetFormat, ScanResult, DownloadResult } from './types';
import { CKANAdapter } from './adapters/CKANAdapter';

export interface SafeBatchConfig {
  maxConcurrent: number;
  pageSize: number;
  timeout: number;
  rateLimit: number;
  enableCheckpoints: boolean;
  checkpointInterval: number;
  maxRetries: number;
  retryDelay: number;
  enableDuplicateDetection: boolean;
}

export class ResourceDownloader {
  private ckanAdapters: Map<string, CKANAdapter> = new Map();
  private downloadCache: Map<string, DownloadResult> = new Map();
  private safeBatchConfig: SafeBatchConfig = {
    maxConcurrent: 5,
    pageSize: 1000,
    timeout: 30000,
    rateLimit: 1000,
    enableCheckpoints: true,
    checkpointInterval: 100,
    maxRetries: 3,
    retryDelay: 1000,
    enableDuplicateDetection: true,
  };
  private checkpoints: Map<string, any> = new Map();
  private downloadedHashes: Set<string> = new Set();
  private lastRequestTime: number = 0;

  /**
   * Register CKAN adapter for a catalog
   */
  registerCKANAdapter(catalogId: string, adapter: CKANAdapter): void {
    this.ckanAdapters.set(catalogId, adapter);
  }

  /**
   * Configure safe batch ingestion
   */
  configureSafeBatch(config: Partial<SafeBatchConfig>): void {
    this.safeBatchConfig = { ...this.safeBatchConfig, ...config };
  }

  /**
   * Apply rate limiting before request
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.safeBatchConfig.rateLimit) {
      const delay = this.safeBatchConfig.rateLimit - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Check for duplicate content using hash
   */
  private isDuplicate(content: string): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    if (this.downloadedHashes.has(hash)) {
      console.log(`[Downloader] Duplicate content detected (hash: ${hash.substring(0, 16)}...)`);
      return true;
    }
    
    this.downloadedHashes.add(hash);
    return false;
  }

  /**
   * Save checkpoint for resume capability
   */
  private saveCheckpoint(datasetId: string, progress: any): void {
    if (!this.safeBatchConfig.enableCheckpoints) return;
    
    const checkpoint = {
      timestamp: Date.now(),
      progress,
    };
    
    this.checkpoints.set(datasetId, checkpoint);
    console.log(`[Downloader] Checkpoint saved for ${datasetId}: ${JSON.stringify(progress)}`);
  }

  /**
   * Load checkpoint for resume capability
   */
  private loadCheckpoint(datasetId: string): any | null {
    if (!this.safeBatchConfig.enableCheckpoints) return null;
    
    const checkpoint = this.checkpoints.get(datasetId);
    if (checkpoint) {
      console.log(`[Downloader] Checkpoint loaded for ${datasetId}: ${JSON.stringify(checkpoint.progress)}`);
      return checkpoint.progress;
    }
    
    return null;
  }

  /**
   * Clear checkpoint
   */
  private clearCheckpoint(datasetId: string): void {
    this.checkpoints.delete(datasetId);
    console.log(`[Downloader] Checkpoint cleared for ${datasetId}`);
  }

  /**
   * Download dataset using optimal method
   */
  async download(dataset: Dataset, scanResult?: ScanResult): Promise<DownloadResult> {
    console.log(`[Downloader] Downloading dataset: ${dataset.id}`);

    const startTime = Date.now();
    const method = scanResult?.recommendedMethod || this.determineMethod(dataset);

    let result: DownloadResult;

    try {
      switch (method) {
        case 'DATASTORE':
          result = await this.downloadFromDataStore(dataset);
          break;
        case 'DOWNLOAD':
          result = await this.downloadFromURL(dataset);
          break;
        case 'API':
          result = await this.downloadFromAPI(dataset);
          break;
        case 'DUMP':
          result = await this.downloadFromURL(dataset);
          break;
        default:
          throw new Error(`Unsupported download method: ${method}`);
      }

      result.method = method;
      result.downloadTime = Date.now() - startTime;

      // Cache successful downloads
      if (result.success) {
        this.downloadCache.set(dataset.id, result);
      }

      console.log(`[Downloader] Download complete: ${method}, ${result.size} bytes, ${result.downloadTime}ms`);
      return result;

    } catch (error) {
      const errorResult: DownloadResult = {
        dataset,
        method,
        success: false,
        format: dataset.format,
        size: 0,
        downloadTime: Date.now() - startTime,
        error: String(error),
      };
      console.error(`[Downloader] Download failed:`, error);
      return errorResult;
    }
  }

  /**
   * Determine optimal download method
   */
  private determineMethod(dataset: Dataset): 'DATASTORE' | 'DOWNLOAD' | 'API' | 'DUMP' {
    if (dataset.datastoreActive) return 'DATASTORE';
    if (dataset.resourceType === 'api') return 'API';
    if (dataset.format === 'DUMP') return 'DUMP';
    return 'DOWNLOAD';
  }

  /**
   * Download from CKAN DataStore
   * 
   * PRODUCTION LOGIC: Probe DataStore availability before attempting ingestion
   * Flow:
   * 1. Probe DataStore availability
   * 2. If available → DataStore ingestion with pagination
   * 3. If not available → Classify error → Fallback to file download
   * 4. Verify downloaded content
   */
  private async downloadFromDataStore(dataset: Dataset): Promise<DownloadResult> {
    console.log(`[Downloader] Attempting DataStore ingestion for: ${dataset.id}`);

    const adapter = this.ckanAdapters.get(dataset.catalogId);
    if (!adapter) {
      throw new Error(`No CKAN adapter for catalog: ${dataset.catalogId}`);
    }

    // Step 1: Probe DataStore availability
    console.log(`[Downloader] Step 1: Probing DataStore availability`);
    await this.applyRateLimit();
    const probeResult = await adapter.probeDataStoreAvailability(dataset.id);
    
    if (!probeResult.available) {
      console.log(`[Downloader] DataStore probe failed: ${probeResult.error} (${probeResult.probeTime}ms)`);
      console.log(`[Downloader] Step 2: Fallback to file download`);
      return await this.downloadFromURL(dataset);
    }

    // Step 2: DataStore is available, proceed with ingestion with pagination
    console.log(`[Downloader] DataStore available (${probeResult.probeTime}ms), proceeding with DataStore ingestion`);
    
    try {
      const allRecords: any[] = [];
      let offset = 0;
      let pageCount = 0;
      let hasMore = true;
      const pageSize = this.safeBatchConfig.pageSize;

      // Check for existing checkpoint
      const checkpoint = this.loadCheckpoint(dataset.id);
      if (checkpoint) {
        offset = checkpoint.offset || 0;
        pageCount = checkpoint.pageCount || 0;
        console.log(`[Downloader] Resuming from checkpoint: offset=${offset}, pageCount=${pageCount}`);
      }

      while (hasMore) {
        pageCount++;
        console.log(`[Downloader] Fetching page ${pageCount} (offset=${offset}, limit=${pageSize})`);
        
        await this.applyRateLimit();
        
        const response = await adapter.searchDataStore({
          resource_id: dataset.id,
          limit: pageSize,
          offset: offset,
          retryAttempts: this.safeBatchConfig.maxRetries,
        });

        const records = response.result.records;
        allRecords.push(...records);
        
        console.log(`[Downloader] Page ${pageCount}: ${records.length} records (total: ${allRecords.length})`);
        
        // Check if we got fewer records than requested (end of data)
        hasMore = records.length === pageSize;
        offset += pageSize;

        // Save checkpoint periodically
        if (this.safeBatchConfig.enableCheckpoints && pageCount % this.safeBatchConfig.checkpointInterval === 0) {
          this.saveCheckpoint(dataset.id, { offset, pageCount, totalRecords: allRecords.length });
        }

        // Safety: prevent infinite loops
        if (pageCount > 1000) {
          console.warn(`[Downloader] Safety limit reached (1000 pages), stopping pagination`);
          hasMore = false;
        }
      }

      const size = JSON.stringify(allRecords).length;

      console.log(`[Downloader] DataStore ingestion successful: ${allRecords.length} records, ${pageCount} pages, ${size} bytes`);
      
      // Clear checkpoint after successful completion
      this.clearCheckpoint(dataset.id);
      
      return {
        dataset,
        method: 'DATASTORE',
        success: true,
        records: allRecords,
        format: 'JSON',
        size,
        downloadTime: probeResult.probeTime,
        paginated: pageCount > 1,
        pages: pageCount,
      };
    } catch (error: any) {
      // DataStore was available but ingestion failed
      console.error(`[Downloader] DataStore ingestion failed despite probe success: ${error.message}`);
      console.log(`[Downloader] Step 3: Fallback to file download due to ingestion error`);
      return await this.downloadFromURL(dataset);
    }
  }

  /**
   * Download from URL
   */
  private async downloadFromURL(dataset: Dataset): Promise<DownloadResult> {
    console.log(`[Downloader] Downloading from URL: ${dataset.url}`);

    await this.applyRateLimit();

    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const size = buffer.length;

    // Check for duplicate content
    if (this.safeBatchConfig.enableDuplicateDetection) {
      const content = buffer.toString('utf-8');
      if (this.isDuplicate(content)) {
        console.log(`[Downloader] Duplicate content detected, skipping parsing`);
        return {
          dataset,
          method: 'DOWNLOAD',
          success: true,
          records: [],
          rawData: buffer,
          format: dataset.format,
          size,
          downloadTime: 0,
        };
      }
    }

    // Parse based on format
    let records: any[] | undefined;
    let format = dataset.format;

    if (dataset.format === 'CSV') {
      records = await this.parseCSV(buffer);
    } else if (dataset.format === 'JSON') {
      records = await this.parseJSON(buffer);
    } else if (dataset.format === 'XML') {
      records = await this.parseXML(buffer);
    } else if (dataset.format === 'ZIP') {
      const extracted = await this.extractZIP(buffer);
      records = extracted.records;
      format = extracted.format;
    }

    return {
      dataset,
      method: 'DOWNLOAD',
      success: true,
      records,
      rawData: buffer,
      format,
      size,
      downloadTime: 0,
    };
  }

  /**
   * Download from API
   */
  private async downloadFromAPI(dataset: Dataset): Promise<DownloadResult> {
    console.log(`[Downloader] Downloading from API: ${dataset.url}`);

    const response = await fetch(dataset.url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const records = Array.isArray(data) ? data : [data];
    const size = JSON.stringify(records).length;

    return {
      dataset,
      method: 'API',
      success: true,
      records,
      format: 'JSON',
      size,
      downloadTime: 0,
    };
  }

  /**
   * Parse CSV buffer
   */
  private async parseCSV(buffer: Buffer): Promise<any[]> {
    // Simple CSV parser (in production, use papaparse or similar)
    const text = buffer.toString('utf-8');
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return [];

    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]?.split(',').map(v => v.trim().replace(/"/g, '')) || [];
      const record: any = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      records.push(record);
    }

    return records;
  }

  /**
   * Parse JSON buffer
   */
  private async parseJSON(buffer: Buffer): Promise<any[]> {
    const text = buffer.toString('utf-8');
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [data];
  }

  /**
   * Parse XML buffer
   */
  private async parseXML(buffer: Buffer): Promise<any[]> {
    // Simple XML parser (in production, use xml2js or similar)
    const text = buffer.toString('utf-8');
    // TODO: Implement proper XML parsing
    return [{ raw: text }];
  }

  /**
   * Extract ZIP archive
   */
  private async extractZIP(_buffer: Buffer): Promise<{ records: any[]; format: DatasetFormat }> {
    // Simple ZIP extraction (in production, use adm-zip or similar)
    // TODO: Implement proper ZIP extraction
    return {
      records: [],
      format: 'UNKNOWN',
    };
  }

  /**
   * Batch download multiple datasets with concurrency control
   */
  async downloadBatch(datasets: Dataset[], scanResults?: ScanResult[]): Promise<DownloadResult[]> {
    console.log(`[Downloader] Batch downloading ${datasets.length} datasets (max concurrent: ${this.safeBatchConfig.maxConcurrent})`);

    const results: DownloadResult[] = [];
    const scanMap = new Map(scanResults?.map(s => [s.dataset.id, s]) || []);
    const maxConcurrent = this.safeBatchConfig.maxConcurrent;

    // Process datasets in batches
    for (let i = 0; i < datasets.length; i += maxConcurrent) {
      const batch = datasets.slice(i, i + maxConcurrent);
      console.log(`[Downloader] Processing batch ${Math.floor(i / maxConcurrent) + 1}: ${batch.length} datasets`);

      const batchPromises = batch.map(async (dataset) => {
        const scanResult = scanMap.get(dataset.id);
        try {
          const result = await this.download(dataset, scanResult);
          return result;
        } catch (error) {
          console.error(`[Downloader] Failed to download dataset ${dataset.id}:`, error);
          return {
            dataset,
            method: 'DOWNLOAD' as const,
            success: false,
            format: dataset.format,
            size: 0,
            downloadTime: 0,
            error: String(error),
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      const successful = batchResults.filter(r => r.success).length;
      console.log(`[Downloader] Batch complete: ${successful}/${batch.length} successful`);
    }

    const totalSuccessful = results.filter(r => r.success).length;
    console.log(`[Downloader] Batch download complete: ${totalSuccessful}/${datasets.length} successful`);
    return results;
  }

  /**
   * Get cached download result
   */
  getCached(datasetId: string): DownloadResult | undefined {
    return this.downloadCache.get(datasetId);
  }

  /**
   * Clear download cache
   */
  clearCache(): void {
    this.downloadCache.clear();
  }

  /**
   * Clear duplicate detection cache
   */
  clearDuplicateCache(): void {
    this.downloadedHashes.clear();
    console.log(`[Downloader] Duplicate detection cache cleared`);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.downloadCache.clear();
    this.checkpoints.clear();
    this.downloadedHashes.clear();
    console.log(`[Downloader] All caches cleared`);
  }

  /**
   * Get download statistics
   */
  getDownloadStatistics(results: DownloadResult[]): {
    total: number;
    successful: number;
    failed: number;
    byMethod: Record<string, number>;
    totalSize: number;
    averageTime: number;
  } {
    const byMethod: Record<string, number> = {};
    let totalSize = 0;
    let totalTime = 0;

    for (const result of results) {
      byMethod[result.method] = (byMethod[result.method] || 0) + 1;
      if (result.success) {
        totalSize += result.size;
        totalTime += result.downloadTime;
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const averageTime = successful > 0 ? totalTime / successful : 0;

    return {
      total: results.length,
      successful,
      failed,
      byMethod,
      totalSize,
      averageTime,
    };
  }
}

// Singleton instance
export const resourceDownloader = new ResourceDownloader();
