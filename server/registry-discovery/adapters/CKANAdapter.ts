/**
 * Registry Discovery Platform (RDP)
 * CKAN Discovery Adapter
 * 
 * Full CKAN API support for data.gov.ua and other CKAN portals
 */

import { CatalogConfig, Dataset, DatasetFormat, CKANPackage, CKANResource, CKANDataStoreResponse } from '../types';

export class CKANAdapter {
  private config: CatalogConfig;
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: CatalogConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  /**
   * Get CKAN API base URL
   */
  private get apiUrl(): string {
    return `${this.baseUrl}/api/3/action`;
  }

  /**
   * Make authenticated request to CKAN API
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.apiKey) {
      headers['Authorization'] = this.apiKey;
    }

    const response = await fetch(url, {
      ...options,
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`CKAN API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.result;
  }

  /**
   * Get all package IDs (package_list)
   */
  async getPackageList(): Promise<string[]> {
    console.log('[CKAN] Getting package list');
    return await this.request('/package_list');
  }

  /**
   * Search packages (package_search)
   */
  async searchPackages(params: {
    q?: string;
    fq?: string;
    rows?: number;
    start?: number;
    sort?: string;
    fields?: string[];
  } = {}): Promise<{ count: number; results: CKANPackage[] }> {
    console.log('[CKAN] Searching packages', params);
    
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.fq) queryParams.append('fq', params.fq);
    if (params.rows) queryParams.append('rows', params.rows.toString());
    if (params.start) queryParams.append('start', params.start.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.fields) queryParams.append('fl', params.fields.join(','));

    return await this.request(`/package_search?${queryParams.toString()}`);
  }

  /**
   * Get package details (package_show)
   */
  async getPackage(packageId: string): Promise<CKANPackage> {
    console.log(`[CKAN] Getting package: ${packageId}`);
    return await this.request(`/package_show?id=${packageId}`);
  }

  /**
   * Get resource details (resource_show)
   */
  async getResource(resourceId: string): Promise<CKANResource> {
    console.log(`[CKAN] Getting resource: ${resourceId}`);
    return await this.request(`/resource_show?id=${resourceId}`);
  }

  /**
   * Probe DataStore availability before attempting ingestion
   * This is a production health check to determine if DataStore is actually available
   * regardless of the advertised datastore_active flag
   */
  async probeDataStoreAvailability(resourceId: string): Promise<{
    available: boolean;
    error?: string;
    probeTime: number;
  }> {
    const startTime = Date.now();
    console.log(`[CKAN] Probing DataStore availability for resource: ${resourceId}`);
    
    try {
      // Try a minimal DataStore query to check availability
      await this.request(`/datastore_search?resource_id=${resourceId}&limit=1`);
      const probeTime = Date.now() - startTime;
      
      console.log(`[CKAN] DataStore available for resource ${resourceId} (${probeTime}ms)`);
      return {
        available: true,
        probeTime,
      };
    } catch (error: any) {
      const probeTime = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';
      
      console.log(`[CKAN] DataStore NOT available for resource ${resourceId}: ${errorMessage} (${probeTime}ms)`);
      
      // Classify the error
      if (errorMessage.includes('not found') || errorMessage.includes('Не знайдено')) {
        return {
          available: false,
          error: 'DATASTORE_RESOURCE_NOT_FOUND',
          probeTime,
        };
      }
      
      return {
        available: false,
        error: errorMessage,
        probeTime,
      };
    }
  }

  /**
   * Search DataStore records (datastore_search)
   * Note: On data.gov.ua, DataStore may not be available even if datastore_active=true
   * This method will throw an error if DataStore is not available
   * 
   * PRODUCTION LOGIC: Always probe DataStore availability before attempting ingestion
   */
  async searchDataStore(params: {
    resource_id: string;
    limit?: number;
    offset?: number;
    filters?: Record<string, any>;
    sort?: string;
    fields?: string[];
    q?: string;
    retryAttempts?: number;
  }): Promise<CKANDataStoreResponse> {
    console.log('[CKAN] Searching DataStore', params);
    
    const retryAttempts = params.retryAttempts || 3;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('resource_id', params.resource_id);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());
        if (params.filters) queryParams.append('filters', JSON.stringify(params.filters));
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.fields) queryParams.append('fields', JSON.stringify(params.fields));
        if (params.q) queryParams.append('q', params.q);

        return await this.request(`/datastore_search?${queryParams.toString()}`);
      } catch (error: any) {
        // Check if error is "Resource not found" - DataStore not actually available
        if (error.message?.includes('not found') || error.message?.includes('Не знайдено')) {
          console.warn(`[CKAN] DataStore not available for resource ${params.resource_id} (attempt ${attempt}/${retryAttempts})`);
          
          // Don't retry for "not found" errors - DataStore is definitively unavailable
          throw new Error('DATASTORE_NOT_AVAILABLE');
        }
        
        // Retry for transient errors
        if (attempt < retryAttempts) {
          console.warn(`[CKAN] DataStore request failed for resource ${params.resource_id} (attempt ${attempt}/${retryAttempts}): ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
        
        // Final attempt failed
        console.error(`[CKAN] DataStore request failed after ${retryAttempts} attempts for resource ${params.resource_id}`);
        throw error;
      }
    }
    
    throw new Error('DATASTORE_REQUEST_FAILED');
  }

  /**
   * Execute SQL query on DataStore (datastore_search_sql)
   */
  async searchDataStoreSQL(sql: string): Promise<CKANDataStoreResponse> {
    console.log('[CKAN] Executing DataStore SQL:', sql);
    return await this.request(`/datastore_search_sql?sql=${encodeURIComponent(sql)}`);
  }

  /**
   * Create DataStore (datastore_create)
   * Note: Not for use on data.gov.ua, but supported for other CKAN portals
   */
  async createDataStore(resourceId: string, fields: any[], force?: boolean): Promise<any> {
    console.log(`[CKAN] Creating DataStore for resource: ${resourceId}`);
    return await this.request('/datastore_create', {
      method: 'POST',
      body: JSON.stringify({
        resource_id: resourceId,
        fields,
        force: force || false,
      }),
    });
  }

  /**
   * Upsert DataStore records (datastore_upsert)
   * Note: Not for use on data.gov.ua, but supported architecturally
   */
  async upsertDataStore(resourceId: string, records: any[], method?: 'upsert' | 'insert' | 'update'): Promise<any> {
    console.log(`[CKAN] Upserting DataStore for resource: ${resourceId}`);
    return await this.request('/datastore_upsert', {
      method: 'POST',
      body: JSON.stringify({
        resource_id: resourceId,
        records,
        method: method || 'upsert',
      }),
    });
  }

  /**
   * Discover all datasets from the catalog - FULL DISCOVERY
   * Enumerates complete catalog without limit
   */
  async discoverAll(): Promise<Dataset[]> {
    console.log('[CKAN] Starting FULL DISCOVERY (complete catalog enumeration)');
    
    const datasets: Dataset[] = [];
    
    try {
      // Get all packages (no limit)
      const packageIds = await this.getPackageList();
      console.log(`[CKAN] Found ${packageIds.length} packages in catalog`);

      // Process each package
      let processed = 0;
      for (const packageId of packageIds) {
        try {
          const packageDatasets = await this.discoverPackage(packageId);
          datasets.push(...packageDatasets);
          processed++;
          
          if (processed % 100 === 0) {
            console.log(`[CKAN] Progress: ${processed}/${packageIds.length} packages processed`);
          }
        } catch (error) {
          console.error(`[CKAN] Failed to discover package ${packageId}:`, error);
        }
      }

      console.log(`[CKAN] FULL DISCOVERY complete: ${datasets.length} datasets from ${processed} packages`);

    } catch (error) {
      console.error('[CKAN] FULL DISCOVERY failed:', error);
    }

    return datasets;
  }

  /**
   * Discover datasets from a specific package
   */
  async discoverPackage(packageId: string): Promise<Dataset[]> {
    const pkg = await this.getPackage(packageId);
    const datasets: Dataset[] = [];

    for (const resource of pkg.resources) {
      const dataset = await this.discoverResource(pkg, resource);
      if (dataset) {
        datasets.push(dataset);
      }
    }

    return datasets;
  }

  /**
   * Discover dataset from a resource
   */
  private async discoverResource(pkg: CKANPackage, resource: CKANResource): Promise<Dataset | null> {
    const format = this.detectFormat(resource.format, resource.mimetype);
    
    const dataset: Dataset = {
      id: resource.id,
      catalogId: this.config.id,
      packageId: pkg.id,
      name: resource.name,
      title: pkg.title,
      description: resource.description || pkg.notes,
      format,
      url: resource.url,
      size: resource.size,
      created: new Date(resource.created),
      modified: new Date(resource.last_modified),
      license: pkg.license_title,
      tags: pkg.tags.map(t => t.name),
      organization: pkg.owner_org,
      datastoreActive: resource.datastore_active,
      resourceType: resource.resource_type || 'file',
      downloadUrl: resource.url,
      hash: resource.hash,
      metadata: {
        package: pkg,
        resource,
      },
    };

    return dataset;
  }

  /**
   * Detect dataset format from resource metadata
   */
  private detectFormat(format?: string, mimetype?: string): DatasetFormat {
    if (!format && !mimetype) return 'UNKNOWN';

    const formatLower = (format || '').toLowerCase();
    const mimeLower = (mimetype || '').toLowerCase();

    // Check by format string
    if (formatLower.includes('csv')) return 'CSV';
    if (formatLower.includes('json')) return 'JSON';
    if (formatLower.includes('xml')) return 'XML';
    if (formatLower.includes('zip')) return 'ZIP';
    if (formatLower.includes('gzip') || formatLower.includes('gz')) return 'GZIP';
    if (formatLower.includes('rar')) return 'RAR';
    if (formatLower.includes('7z')) return '7Z';
    if (formatLower.includes('xls') && !formatLower.includes('xlsx')) return 'XLS';
    if (formatLower.includes('xlsx')) return 'XLSX';
    if (formatLower.includes('ods')) return 'ODS';
    if (formatLower.includes('parquet')) return 'PARQUET';

    // Check by MIME type
    if (mimeLower.includes('csv')) return 'CSV';
    if (mimeLower.includes('json')) return 'JSON';
    if (mimeLower.includes('xml')) return 'XML';
    if (mimeLower.includes('zip')) return 'ZIP';
    if (mimeLower.includes('gzip')) return 'GZIP';
    if (mimeLower.includes('excel') || mimeLower.includes('spreadsheet')) return 'XLSX';
    if (mimeLower.includes('parquet')) return 'PARQUET';

    return 'UNKNOWN';
  }

  /**
   * Test connection to CKAN API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/package_list', { headers: { 'Range': '0-0' } });
      return true;
    } catch (error) {
      console.error('[CKAN] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get catalog statistics
   */
  async getStatistics(): Promise<{
    totalPackages: number;
    totalResources: number;
    datastoreActive: number;
    byFormat: Record<string, number>;
  }> {
    const packages = await this.searchPackages({ rows: 0 });
    const totalPackages = packages.count;
    
    // Sample first 100 packages to estimate
    const sample = await this.searchPackages({ rows: 100 });
    let totalResources = 0;
    let datastoreActive = 0;
    const byFormat: Record<string, number> = {};

    for (const pkg of sample.results) {
      totalResources += pkg.resources.length;
      for (const resource of pkg.resources) {
        if (resource.datastore_active) datastoreActive++;
        const format = this.detectFormat(resource.format, resource.mimetype);
        byFormat[format] = (byFormat[format] || 0) + 1;
      }
    }

    // Estimate totals
    const multiplier = totalPackages / sample.results.length;
    
    return {
      totalPackages,
      totalResources: Math.round(totalResources * multiplier),
      datastoreActive: Math.round(datastoreActive * multiplier),
      byFormat,
    };
  }
}
