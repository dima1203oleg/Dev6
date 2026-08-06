/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-010 — Freshness
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus, FreshnessInfo } from '../types';

export class TEST010_Freshness extends BaseTest {
  constructor() {
    super('TEST-010', 'Freshness');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const endpoint = context.source_config.endpoint_or_resource;
        
        // Fetch response
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PREDATOR-Analytics-Test/1.0'
          }
        });
        
        const body = await response.text();
        
        // Parse JSON
        let jsonData: any;
        try {
          jsonData = JSON.parse(body);
        } catch (parseError) {
          errors.push('Cannot check freshness - raw data is not valid JSON');
          return { details, errors, warnings };
        }
        
        // Extract freshness information
        const freshness = this.extractFreshnessInfo(jsonData, response, context);
        
        details.last_updated = freshness.last_updated?.toISOString() || null;
        details.age_seconds = freshness.age_seconds;
        details.ttl_seconds = freshness.ttl_seconds;
        details.cache_status = freshness.cache_status;
        
        // Check if data is fresh enough
        const maxAge = this.getMaxAge(context.source_config.update_frequency);
        details.max_age_seconds = maxAge;
        details.freshness_acceptable = freshness.age_seconds !== null && freshness.age_seconds <= maxAge;
        
        if (freshness.age_seconds === null) {
          warnings.push('Could not determine data age - no timestamp found');
        } else if (!details.freshness_acceptable) {
          warnings.push(`Data is stale: ${freshness.age_seconds}s old (max: ${maxAge}s)`);
        }
        
        // Check cache headers
        const cacheInfo = this.checkCacheHeaders(response);
        details.cache_control = cacheInfo.cacheControl;
        details.etag = cacheInfo.etag;
        details.last_modified = cacheInfo.lastModified;
        
        if (cacheInfo.cacheControl) {
          const maxAgeHeader = this.extractMaxAge(cacheInfo.cacheControl);
          if (maxAgeHeader) {
            details.max_age_header = maxAgeHeader;
          }
        }
        
      } catch (error) {
        errors.push(`Freshness check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private extractFreshnessInfo(data: any, response: Response, context: TestContext): FreshnessInfo {
    const freshness: FreshnessInfo = {
      last_updated: null,
      age_seconds: null,
      ttl_seconds: null,
      cache_status: 'UNKNOWN'
    };
    
    // Try to extract timestamp from data
    const timestampFields = ['updated_at', 'last_updated', 'timestamp', 'date', 'created_at', 'modified_at'];
    
    for (const field of timestampFields) {
      if (data[field]) {
        try {
          const date = new Date(data[field]);
          if (!isNaN(date.getTime())) {
            freshness.last_updated = date;
            freshness.age_seconds = (Date.now() - date.getTime()) / 1000;
            break;
          }
        } catch {
          // Continue to next field
        }
      }
    }
    
    // Check response headers
    const lastModified = response.headers.get('last-modified');
    if (lastModified && !freshness.last_updated) {
      try {
        const date = new Date(lastModified);
        if (!isNaN(date.getTime())) {
          freshness.last_updated = date;
          freshness.age_seconds = (Date.now() - date.getTime()) / 1000;
        }
      } catch {
        // Ignore parsing errors
      }
    }
    
    // Determine cache status
    const cacheControl = response.headers.get('cache-control');
    if (cacheControl) {
      if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
        freshness.cache_status = 'MISS';
      } else if (cacheControl.includes('max-age')) {
        freshness.cache_status = 'HIT';
        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
          freshness.ttl_seconds = parseInt(maxAgeMatch[1], 10);
        }
      }
    }
    
    return freshness;
  }

  private getMaxAge(updateFrequency: string): number {
    switch (updateFrequency.toUpperCase()) {
      case 'REALTIME':
        return 60; // 1 minute
      case 'HOURLY':
        return 3600; // 1 hour
      case 'DAILY':
        return 86400; // 24 hours
      case 'WEEKLY':
        return 604800; // 7 days
      case 'MONTHLY':
        return 2592000; // 30 days
      default:
        return 86400; // Default to daily
    }
  }

  private checkCacheHeaders(response: Response): {
    cacheControl: string | null;
    etag: string | null;
    lastModified: string | null;
  } {
    return {
      cacheControl: response.headers.get('cache-control'),
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified')
    };
  }

  private extractMaxAge(cacheControl: string): number | null {
    const match = cacheControl.match(/max-age=(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
