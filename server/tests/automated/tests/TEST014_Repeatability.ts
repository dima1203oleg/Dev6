/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-014 — Repeatability
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus } from '../types';

export class TEST014_Repeatability extends BaseTest {
  constructor() {
    super('TEST-014', 'Repeatability');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const endpoint = context.source_config.endpoint_or_resource;
        
        // Execute the same query twice
        const firstRun = await this.executeQuery(endpoint, context);
        const secondRun = await this.executeQuery(endpoint, context);
        
        details.first_run = {
          http_code: firstRun.httpCode,
          response_time_ms: firstRun.responseTime,
          response_size: firstRun.responseSize,
          checksum: firstRun.checksum
        };
        
        details.second_run = {
          http_code: secondRun.httpCode,
          response_time_ms: secondRun.responseTime,
          response_size: secondRun.responseSize,
          checksum: secondRun.checksum
        };
        
        // Compare results
        const comparison = this.compareResults(firstRun, secondRun);
        details.http_code_match = comparison.httpCodeMatch;
        details.response_identical = comparison.responseIdentical;
        details.checksum_match = comparison.checksumMatch;
        details.response_time_variance = comparison.responseTimeVariance;
        
        if (!comparison.httpCodeMatch) {
          errors.push(`HTTP codes differ: ${firstRun.httpCode} vs ${secondRun.httpCode}`);
        }
        
        if (!comparison.responseIdentical) {
          warnings.push('Responses differ between runs');
          details.differences = comparison.differences;
        }
        
        if (!comparison.checksumMatch) {
          warnings.push('Checksums differ between runs');
        }
        
        // Check response time variance
        if (comparison.responseTimeVariance > 0.5) { // 50% variance
          warnings.push(`High response time variance: ${comparison.responseTimeVariance.toFixed(2)}%`);
        }
        
        // Determine if results are repeatable
        details.repeatable = comparison.httpCodeMatch && comparison.checksumMatch;
        
        if (!details.repeatable) {
          errors.push('Results are not repeatable');
        }
        
      } catch (error) {
        errors.push(`Repeatability check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private async executeQuery(endpoint: string, context: TestContext): Promise<{
    httpCode: number;
    responseTime: number;
    responseSize: number;
    checksum: string;
    body: string;
  }> {
    const start = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), context.timeout_ms);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PREDATOR-Analytics-Test/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const body = await response.text();
    
    return {
      httpCode: response.status,
      responseTime: Date.now() - start,
      responseSize: body.length,
      checksum: this.calculateChecksum(body),
      body
    };
  }

  private calculateChecksum(data: string): string {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum = (sum + data.charCodeAt(i)) % 0xFFFFFFFF;
    }
    return sum.toString(16).padStart(8, '0');
  }

  private compareResults(first: any, second: any): {
    httpCodeMatch: boolean;
    responseIdentical: boolean;
    checksumMatch: boolean;
    responseTimeVariance: number;
    differences: string[];
  } {
    const httpCodeMatch = first.httpCode === second.httpCode;
    const checksumMatch = first.checksum === second.checksum;
    const responseIdentical = first.body === second.body;
    
    const responseTimeVariance = first.responseTime > 0 
      ? Math.abs((first.responseTime - second.responseTime) / first.responseTime) * 100
      : 0;
    
    const differences: string[] = [];
    
    if (!responseIdentical) {
      differences.push('Response bodies differ');
      
      // Try to find specific differences
      try {
        const firstJson = JSON.parse(first.body);
        const secondJson = JSON.parse(second.body);
        const jsonDifferences = this.findJsonDifferences(firstJson, secondJson);
        differences.push(...jsonDifferences);
      } catch {
        differences.push('Could not parse JSON for detailed comparison');
      }
    }
    
    return {
      httpCodeMatch,
      responseIdentical,
      checksumMatch,
      responseTimeVariance,
      differences
    };
  }

  private findJsonDifferences(obj1: any, obj2: any, path: string = ''): string[] {
    const differences: string[] = [];
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
      const fieldPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj1)) {
        differences.push(`Field only in second response: ${fieldPath}`);
        continue;
      }
      
      if (!(key in obj2)) {
        differences.push(`Field only in first response: ${fieldPath}`);
        continue;
      }
      
      const value1 = obj1[key];
      const value2 = obj2[key];
      
      if (typeof value1 !== typeof value2) {
        differences.push(`Type mismatch at ${fieldPath}: ${typeof value1} vs ${typeof value2}`);
        continue;
      }
      
      if (typeof value1 === 'object' && value1 !== null && value2 !== null) {
        if (Array.isArray(value1) && Array.isArray(value2)) {
          if (value1.length !== value2.length) {
            differences.push(`Array length mismatch at ${fieldPath}: ${value1.length} vs ${value2.length}`);
          }
        } else {
          differences.push(...this.findJsonDifferences(value1, value2, fieldPath));
        }
      } else if (value1 !== value2) {
        differences.push(`Value mismatch at ${fieldPath}: ${JSON.stringify(value1)} vs ${JSON.stringify(value2)}`);
      }
    }
    
    return differences;
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
