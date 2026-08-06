/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-004 — Query Execution
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus } from '../types';

export class TEST004_QueryExecution extends BaseTest {
  constructor() {
    super('TEST-004', 'Query Execution');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      const startTime = new Date();
      details.start_time = startTime.toISOString();
      details.test_ipn = context.test_ipn;

      try {
        const endpoint = context.source_config.endpoint_or_resource;
        const authType = context.source_config.auth_type;
        
        // Prepare headers based on auth type
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'PREDATOR-Analytics-Test/1.0'
        };

        // Add authentication headers
        this.addAuthHeaders(context, headers);

        // Prepare query parameters
        const queryParams = this.buildQueryParams(context);
        
        // Execute query
        const queryUrl = this.buildQueryUrl(endpoint, queryParams);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout_ms);
        
        const response = await fetch(queryUrl, {
          method: 'GET',
          headers,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const endTime = new Date();
        details.end_time = endTime.toISOString();
        details.execution_time_ms = endTime.getTime() - startTime.getTime();
        details.http_code = response.status;
        details.http_status_text = response.statusText;
        
        // Get response body
        const responseBody = await response.text();
        details.response_size_bytes = responseBody.length;
        details.response_preview = responseBody.substring(0, 200);
        
        if (!response.ok) {
          errors.push(`Query failed with HTTP ${response.status}: ${response.statusText}`);
          details.error_message = responseBody;
        } else {
          details.query_status = 'SUCCESS';
          
          // Check if response contains data
          if (responseBody.length === 0) {
            warnings.push('Query returned empty response');
            details.query_status = 'EMPTY_RESPONSE';
          }
        }
        
      } catch (error) {
        const endTime = new Date();
        details.end_time = endTime.toISOString();
        details.execution_time_ms = endTime.getTime() - startTime.getTime();
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errors.push(`Query timed out after ${context.timeout_ms}ms`);
          } else {
            errors.push(`Query execution failed: ${error.message}`);
          }
        } else {
          errors.push(`Query execution failed: ${String(error)}`);
        }
        details.error_message = error instanceof Error ? error.message : String(error);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private addAuthHeaders(context: TestContext, headers: Record<string, string>): void {
    const authType = context.source_config.auth_type.toUpperCase();
    const sourceId = context.source_config.source_id;
    const connectorId = context.source_config.connector_id.toUpperCase();

    switch (authType) {
      case 'API_KEY':
        const apiKey = process.env[`${sourceId}_API_KEY`] || process.env[`${connectorId}_API_KEY`];
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        break;

      case 'BEARER_TOKEN':
        const bearerToken = process.env[`${sourceId}_BEARER_TOKEN`] || process.env[`${connectorId}_BEARER_TOKEN`];
        if (bearerToken) {
          headers['Authorization'] = `Bearer ${bearerToken}`;
        }
        break;

      case 'JWT':
        const jwt = process.env[`${sourceId}_JWT_TOKEN`] || process.env[`${connectorId}_JWT_TOKEN`];
        if (jwt) {
          headers['Authorization'] = `Bearer ${jwt}`;
        }
        break;
    }
  }

  private buildQueryParams(context: TestContext): Record<string, string> {
    const params: Record<string, string> = {};
    
    // Add IPN parameter
    params.ipn = context.test_ipn;
    
    // Add source-specific parameters based on supported identifiers
    const supportedIdentifiers = context.source_config.supported_identifiers;
    if (supportedIdentifiers.includes('ipn')) {
      params.ipn = context.test_ipn;
    }
    
    return params;
  }

  private buildQueryUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(endpoint);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
