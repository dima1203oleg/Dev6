/**
 * Registry Discovery Platform (RDP)
 * Intelligent Dataset Scanner
 * 
 * Automatically analyzes dataset structure and determines optimal access method
 */

import { Dataset, Schema, SchemaField, ScanResult } from './types';
import { CKANAdapter } from './adapters/CKANAdapter';

export class DatasetScanner {
  private ckanAdapters: Map<string, CKANAdapter> = new Map();

  /**
   * Register CKAN adapter for a catalog
   */
  registerCKANAdapter(catalogId: string, adapter: CKANAdapter): void {
    this.ckanAdapters.set(catalogId, adapter);
  }

  /**
   * Scan a dataset to determine its characteristics
   */
  async scanDataset(dataset: Dataset): Promise<ScanResult> {
    console.log(`[Scanner] Scanning dataset: ${dataset.id}`);

    const result: ScanResult = {
      dataset,
      hasDataStore: dataset.datastoreActive,
      hasCSV: dataset.format === 'CSV',
      hasJSON: dataset.format === 'JSON',
      hasXML: dataset.format === 'XML',
      hasZIP: dataset.format === 'ZIP',
      hasXLSX: dataset.format === 'XLSX',
      hasAPI: dataset.resourceType === 'api',
      hasDump: dataset.format === 'DUMP',
      hasStreaming: dataset.format === 'STREAMING',
      recommendedMethod: this.determineRecommendedMethod(dataset),
      estimatedSize: dataset.size || 0,
      estimatedRecords: 0,
      qualityScore: 0,
    };

    // Analyze schema if DataStore is available
    if (result.hasDataStore && this.ckanAdapters.has(dataset.catalogId)) {
      try {
        const adapter = this.ckanAdapters.get(dataset.catalogId)!;
        const schema = await this.analyzeDataStoreSchema(adapter, dataset);
        result.schema = schema;
        result.estimatedRecords = await this.estimateRecordCount(adapter, dataset);
      } catch (error) {
        console.error(`[Scanner] Failed to analyze DataStore schema:`, error);
      }
    }

    // Calculate quality score
    result.qualityScore = this.calculateQualityScore(result);

    console.log(`[Scanner] Scan complete: ${result.recommendedMethod}, quality: ${result.qualityScore}`);
    return result;
  }

  /**
   * Determine recommended access method
   */
  private determineRecommendedMethod(dataset: Dataset): 'DATASTORE' | 'DOWNLOAD' | 'API' | 'DUMP' {
    // Priority: DataStore > API > Download > Dump
    
    if (dataset.datastoreActive) {
      return 'DATASTORE';
    }

    if (dataset.resourceType === 'api') {
      return 'API';
    }

    if (dataset.format === 'DUMP') {
      return 'DUMP';
    }

    return 'DOWNLOAD';
  }

  /**
   * Analyze DataStore schema
   */
  private async analyzeDataStoreSchema(adapter: CKANAdapter, dataset: Dataset): Promise<Schema> {
    console.log(`[Scanner] Analyzing DataStore schema for: ${dataset.id}`);

    // Get first few records to infer schema
    const response = await adapter.searchDataStore({
      resource_id: dataset.id,
      limit: 100,
    });

    const fields: SchemaField[] = response.result.fields.map(field => ({
      name: field.id,
      type: this.mapCKANTypeToSchemaType(field.type),
      nullable: true,
      description: field.info?.description,
      sampleValues: this.extractSampleValues(response.result.records, field.id),
    }));

    const schema: Schema = {
      version: '1.0',
      fields,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return schema;
  }

  /**
   * Map CKAN field type to schema type
   */
  private mapCKANTypeToSchemaType(ckanType: string): string {
    const typeMap: Record<string, string> = {
      'text': 'string',
      'int': 'integer',
      'int4': 'integer',
      'int8': 'bigint',
      'float': 'float',
      'numeric': 'decimal',
      'timestamp': 'datetime',
      'timestamptz': 'datetime',
      'date': 'date',
      'bool': 'boolean',
      'json': 'json',
      'jsonb': 'json',
      'uuid': 'uuid',
    };

    return typeMap[ckanType] || 'string';
  }

  /**
   * Extract sample values from records
   */
  private extractSampleValues(records: any[], fieldName: string): any[] {
    const values = records
      .map(r => r[fieldName])
      .filter(v => v !== null && v !== undefined && v !== '')
      .slice(0, 5);

    return [...new Set(values)]; // Unique values
  }

  /**
   * Estimate record count
   */
  private async estimateRecordCount(adapter: CKANAdapter, dataset: Dataset): Promise<number> {
    try {
      const response = await adapter.searchDataStore({
        resource_id: dataset.id,
        limit: 0,
      });
      return response.result.total;
    } catch (error) {
      console.error(`[Scanner] Failed to estimate record count:`, error);
      return 0;
    }
  }

  /**
   * Calculate quality score for dataset
   */
  private calculateQualityScore(result: ScanResult): number {
    let score = 0;

    // DataStore availability (30 points)
    if (result.hasDataStore) score += 30;

    // Schema availability (20 points)
    if (result.schema && result.schema.fields.length > 0) score += 20;

    // Format preference (15 points)
    if (result.hasCSV || result.hasJSON) score += 15;
    else if (result.hasXLSX) score += 10;
    else if (result.hasXML) score += 5;

    // Size estimation (10 points)
    if (result.estimatedSize > 0 && result.estimatedSize < 100_000_000) score += 10;
    else if (result.estimatedSize > 0) score += 5;

    // Record count (10 points)
    if (result.estimatedRecords > 1000) score += 10;
    else if (result.estimatedRecords > 100) score += 5;

    // Metadata quality (15 points)
    if (result.dataset.description) score += 5;
    if (result.dataset.tags.length > 0) score += 5;
    if (result.dataset.organization) score += 5;

    return score;
  }

  /**
   * Batch scan multiple datasets
   */
  async scanBatch(datasets: Dataset[]): Promise<ScanResult[]> {
    console.log(`[Scanner] Batch scanning ${datasets.length} datasets`);

    const results: ScanResult[] = [];
    
    for (const dataset of datasets) {
      try {
        const result = await this.scanDataset(dataset);
        results.push(result);
      } catch (error) {
        console.error(`[Scanner] Failed to scan dataset ${dataset.id}:`, error);
      }
    }

    console.log(`[Scanner] Batch scan complete: ${results.length}/${datasets.length} successful`);
    return results;
  }

  /**
   * Get scan statistics
   */
  getScanStatistics(results: ScanResult[]): {
    total: number;
    byMethod: Record<string, number>;
    byFormat: Record<string, number>;
    averageQuality: number;
    highQualityCount: number;
  } {
    const byMethod: Record<string, number> = {};
    const byFormat: Record<string, number> = {};
    let totalQuality = 0;

    for (const result of results) {
      byMethod[result.recommendedMethod] = (byMethod[result.recommendedMethod] || 0) + 1;
      byFormat[result.dataset.format] = (byFormat[result.dataset.format] || 0) + 1;
      totalQuality += result.qualityScore;
    }

    const averageQuality = results.length > 0 ? totalQuality / results.length : 0;
    const highQualityCount = results.filter(r => r.qualityScore >= 70).length;

    return {
      total: results.length,
      byMethod,
      byFormat,
      averageQuality,
      highQualityCount,
    };
  }
}

// Singleton instance
export const datasetScanner = new DatasetScanner();