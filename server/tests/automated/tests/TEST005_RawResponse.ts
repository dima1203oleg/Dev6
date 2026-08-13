/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-005 — Raw Response
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus, RawResponse } from '../types';
import { createHash } from 'crypto';

export class TEST005_RawResponse extends BaseTest {
  private previousResponse: RawResponse | null = null;

  constructor() {
    super('TEST-005', 'Raw Response');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const endpoint = context.source_config.endpoint_or_resource;
        
        // Execute query to get raw response
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
        
        // Build raw response object
        const rawResponse: RawResponse = {
          body,
          headers: this.extractHeaders(response),
          content_type: response.headers.get('content-type') || 'unknown',
          size_bytes: body.length,
          checksum: this.calculateChecksum(body),
          sha256_hash: this.calculateSHA256(body),
          http_code: response.status
        };
        
        // Store for potential later use
        this.previousResponse = rawResponse;
        
        // Validate raw response
        details['response_size'] = rawResponse.size_bytes;
        details['content_type'] = rawResponse.content_type;
        details['http_code'] = rawResponse.http_code;
        details['checksum'] = rawResponse.checksum;
        details['sha256_hash'] = rawResponse.sha256_hash;
        details['headers_count'] = Object.keys(rawResponse.headers).length;
        
        // Check for empty response
        if (rawResponse.size_bytes === 0) {
          warnings.push('Response body is empty');
        }
        
        // Check content type
        if (rawResponse.content_type.includes('application/json')) {
          details['content_type_valid'] = true;
        } else {
          warnings.push(`Unexpected content type: ${rawResponse.content_type}`);
          details['content_type_valid'] = false;
        }
        
        // Check response size
        if (rawResponse.size_bytes > 10 * 1024 * 1024) { // 10MB
          warnings.push(`Response size is large: ${rawResponse.size_bytes} bytes`);
        }
        
      } catch (error) {
        errors.push(`Failed to capture raw response: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  private calculateChecksum(data: string): string {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum = (sum + data.charCodeAt(i)) % 0xFFFFFFFF;
    }
    return sum.toString(16).padStart(8, '0');
  }

  private calculateSHA256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  public getRawResponse(): RawResponse | null {
    return this.previousResponse;
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
