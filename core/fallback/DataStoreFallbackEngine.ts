/**
 * DataStore Fallback Engine
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * DataStore→API→Direct→Archive chain
 */

import { logger } from '../observability/StructuredLogger';
import { FailureHandler, ClassifiedFailure } from '../failure/FailureHandler';

export type FallbackSource = 'DATASTORE' | 'API' | 'DIRECT' | 'ARCHIVE';

export interface FallbackConfig {
  enableDataStore: boolean;
  enableAPI: boolean;
  enableDirect: boolean;
  enableArchive: boolean;
  datastoreUrl?: string;
  archiveUrl?: string;
  timeoutMs: number;
}

export interface FallbackResult {
  source: FallbackSource;
  data: any;
  success: boolean;
  latencyMs: number;
  attempts: number;
  errors: string[];
}

export class DataStoreFallbackEngine {
  private config: FallbackConfig;
  private cache: Map<string, { data: any; timestamp: number; source: FallbackSource }> = new Map();
  private cacheTtlMs: number = 300000; // 5 minutes

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      enableDataStore: config.enableDataStore !== false,
      enableAPI: config.enableAPI !== false,
      enableDirect: config.enableDirect !== false,
      enableArchive: config.enableArchive !== false,
      datastoreUrl: config.datastoreUrl,
      archiveUrl: config.archiveUrl,
      timeoutMs: config.timeoutMs || 30000
    };
  }

  /**
   * Fetch data with fallback chain: DataStore → API → Direct → Archive
   */
  async fetchWithFallback(
    runId: string,
    datasetId: string,
    resourceId: string,
    url: string,
    identifier?: string
  ): Promise<FallbackResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let attempts = 0;

    logger.info({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
      'Starting fallback chain', { url, identifier });

    // Check cache first
    const cacheKey = this.getCacheKey(url, identifier);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logger.info({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
        'Data served from cache', { source: cached.source, age: Date.now() - cached.timestamp });
      return {
        source: cached.source,
        data: cached.data,
        success: true,
        latencyMs: Date.now() - startTime,
        attempts: 1,
        errors: []
      };
    }

    // Try DataStore first
    if (this.config.enableDataStore && this.config.datastoreUrl) {
      attempts++;
      try {
        const result = await this.fetchFromDataStore(runId, datasetId, resourceId, url, identifier);
        this.saveToCache(cacheKey, result.data, 'DATASTORE');
        logger.info({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
          'Data fetched from DataStore', { latencyMs: Date.now() - startTime });
        return {
          source: 'DATASTORE',
          data: result,
          success: true,
          latencyMs: Date.now() - startTime,
          attempts,
          errors
        };
      } catch (error) {
        const failure = FailureHandler.classifyError(error, { run_id: runId, dataset_id: datasetId, resource_id: resourceId });
        errors.push(`DataStore failed: ${failure.rca}`);
        logger.warn({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
          `DataStore fallback failed: ${failure.rca}`);
      }
    }

    // Try API
    if (this.config.enableAPI) {
      attempts++;
      try {
        const result = await this.fetchFromAPI(runId, datasetId, resourceId, url);
        this.saveToCache(cacheKey, result, 'API');
        logger.info({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
          'Data fetched from API', { latencyMs: Date.now() - startTime });
        return {
          source: 'API',
          data: result,
          success: true,
          latencyMs: Date.now() - startTime,
          attempts,
          errors
        };
      } catch (error) {
        const failure = FailureHandler.classifyError(error, { run_id: runId, dataset_id: datasetId, resource_id: resourceId });
        errors.push(`API failed: ${failure.rca}`);
        logger.warn({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
          `API fallback failed: ${failure.rca}`);
      }
    }

    // Try Direct fetch
    if (this.config.enableDirect) {
      attempts++;
      try {
        const result = await this.fetchDirect(runId, datasetId, resourceId, url);
        this.saveToCache(cacheKey, result, 'DIRECT');
        logger.info({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
          'Data fetched directly', { latencyMs: Date.now() - startTime });
        return {
          source: 'DIRECT',
          data: result,
          success: true,
          latencyMs: Date.now() - startTime,
          attempts,
          errors
        };
      } catch (error) {
        const failure = FailureHandler.classifyError(error, { run_id: runId, dataset_id: datasetId, resource_id: resourceId });
        errors.push(`Direct fetch failed: ${failure.rca}`);
        logger.warn({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
          `Direct fallback failed: ${failure.rca}`);
      }
    }

    // Try Archive
    if (this.config.enableArchive && this.config.archiveUrl) {
      attempts++;
      try {
        const result = await this.fetchFromArchive(runId, datasetId, resourceId, url, identifier);
        this.saveToCache(cacheKey, result, 'ARCHIVE');
        logger.info({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
          'Data fetched from Archive', { latencyMs: Date.now() - startTime });
        return {
          source: 'ARCHIVE',
          data: result,
          success: true,
          latencyMs: Date.now() - startTime,
          attempts,
          errors
        };
      } catch (error) {
        const failure = FailureHandler.classifyError(error, { run_id: runId, dataset_id: datasetId, resource_id: resourceId });
        errors.push(`Archive failed: ${failure.rca}`);
        logger.warn({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
          `Archive fallback failed: ${failure.rca}`);
      }
    }

    // All fallbacks failed
    logger.error({ run_id: runId, dataset_id: datasetId, resource_id: resourceId, stage: 'fallback' },
      'All fallback sources failed', { errors });
    return {
      source: 'DATASTORE',
      data: null,
      success: false,
      latencyMs: Date.now() - startTime,
      attempts,
      errors
    };
  }

  /**
   * Fetch from DataStore
   */
  private async fetchFromDataStore(
    runId: string,
    datasetId: string,
    resourceId: string,
    url: string,
    identifier?: string
  ): Promise<any> {
    const datastoreUrl = this.config.datastoreUrl!;
    const queryUrl = identifier 
      ? `${datastoreUrl}/api/v1/datastore?identifier=${encodeURIComponent(identifier)}`
      : `${datastoreUrl}/api/v1/datastore?url=${encodeURIComponent(url)}`;

    const response = await fetch(queryUrl, {
      signal: AbortSignal.timeout(this.config.timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`DataStore returned ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Fetch from API
   */
  private async fetchFromAPI(
    runId: string,
    datasetId: string,
    resourceId: string,
    url: string
  ): Promise<any> {
    const apiUrl = url.replace('https://data.gov.ua/api/3/action/', 'https://data.gov.ua/api/3/action/');
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(this.config.timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Fetch directly from source
   */
  private async fetchDirect(
    runId: string,
    datasetId: string,
    resourceId: string,
    url: string
  ): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(this.config.timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Direct fetch returned ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Fetch from Archive
   */
  private async fetchFromArchive(
    runId: string,
    datasetId: string,
    resourceId: string,
    url: string,
    identifier?: string
  ): Promise<any> {
    const archiveUrl = this.config.archiveUrl!;
    const queryUrl = identifier 
      ? `${archiveUrl}/api/v1/archive?identifier=${encodeURIComponent(identifier)}`
      : `${archiveUrl}/api/v1/archive?url=${encodeURIComponent(url)}`;

    const response = await fetch(queryUrl, {
      signal: AbortSignal.timeout(this.config.timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Archive returned ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get cache key
   */
  private getCacheKey(url: string, identifier?: string): string {
    return identifier ? `archive:${identifier}` : `url:${url}`;
  }

  /**
   * Save to cache
   */
  private saveToCache(key: string, data: any, source: FallbackSource): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      source
    });
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): { data: any; timestamp: number; source: FallbackSource } | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTtlMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    bySource: Record<FallbackSource, number>;
  } {
    const now = Date.now();
    let expiredEntries = 0;
    const bySource: Record<FallbackSource, number> = {
      DATASTORE: 0,
      API: 0,
      DIRECT: 0,
      ARCHIVE: 0
    };

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTtlMs) {
        expiredEntries++;
      }
      bySource[value.source]++;
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      bySource
    };
  }

  /**
   * Get configuration
   */
  getConfig(): FallbackConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set cache TTL
   */
  setCacheTtl(ttlMs: number): void {
    this.cacheTtlMs = ttlMs;
  }
}

// Singleton instance
export const dataStoreFallbackEngine = new DataStoreFallbackEngine();
