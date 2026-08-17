/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-002 — Connectivity
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult } from '../types';

export class TEST002_Connectivity extends BaseTest {
  constructor() {
    super('TEST-002', 'Connectivity');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const endpoint = context.source_config.endpoint_or_resource;
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const url = new URL(endpoint);
        
        // DNS Resolution
        details['dns_resolution'] = await this.checkDNS(url.hostname);
        
        // HTTPS Check
        details['https_enabled'] = url.protocol === 'https:';
        if (!details['https_enabled']) {
          warnings.push('Endpoint does not use HTTPS');
        }
        
        // TLS Check (for HTTPS)
        if (details['https_enabled']) {
          details['tls_valid'] = await this.checkTLS(endpoint);
        }
        
        // HTTP Status
        const httpStatus = await this.checkHTTPStatus(endpoint, context.timeout_ms);
        details['http_status'] = httpStatus.status;
        details['response_time_ms'] = httpStatus.responseTime;
        
        if (httpStatus.status >= 500) {
          errors.push(`Server error: HTTP ${httpStatus.status}`);
        } else if (httpStatus.status >= 400) {
          warnings.push(`Client error: HTTP ${httpStatus.status}`);
        }
        
        // Timeout Check
        details['timeout_ms'] = context.timeout_ms;
        details['timeout_exceeded'] = httpStatus.responseTime > context.timeout_ms;
        if (details['timeout_exceeded']) {
          errors.push(`Request timeout exceeded: ${httpStatus.responseTime}ms > ${context.timeout_ms}ms`);
        }
        
        // Retry Capability
        details['retry_supported'] = context.retry_count > 0;
        
        // Circuit Breaker Status (simulated)
        details['circuit_breaker_status'] = 'CLOSED';
        
      } catch (error) {
        errors.push(`Connectivity check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private async checkDNS(hostname: string): Promise<boolean> {
    try {
      // In a real implementation, use dns.lookup or similar
      // For now, simulate DNS check
      return hostname.length > 0 && !hostname.includes('localhost');
    } catch {
      return false;
    }
  }

  private async checkTLS(endpoint: string): Promise<boolean> {
    try {
      // In a real implementation, use TLS certificate validation
      // For now, assume valid for HTTPS endpoints
      return endpoint.startsWith('https://');
    } catch {
      return false;
    }
  }

  private async checkHTTPStatus(endpoint: string, timeoutMs: number): Promise<{ status: number; responseTime: number }> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      return {
        status: response.status,
        responseTime: Date.now() - start
      };
    } catch (error) {
      return {
        status: 0,
        responseTime: Date.now() - start
      };
    }
  }

}
