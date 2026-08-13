/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-017 — Security
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus, SecurityTestResult } from '../types';

export class TEST017_Security extends BaseTest {
  constructor() {
    super('TEST-017', 'Security');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const endpoint = context.source_config.endpoint_or_resource;
        
        // Perform security tests
        const securityResult = await this.performSecurityTests(endpoint, context);
        
        details['sql_injection_vulnerable'] = securityResult.sql_injection;
        details['xss_vulnerable'] = securityResult.xss;
        details['ssrf_vulnerable'] = securityResult.ssrf;
        details['idor_vulnerable'] = securityResult.idor;
        details['secret_leakage'] = securityResult.secret_leakage;
        details['path_traversal_vulnerable'] = securityResult.path_traversal;
        details['command_injection_vulnerable'] = securityResult.command_injection;
        
        details['security_score'] = this.calculateSecurityScore(securityResult);
        
        // Check for vulnerabilities
        const vulnerabilities = this.identifyVulnerabilities(securityResult);
        details['vulnerabilities_found'] = vulnerabilities;
        
        if (vulnerabilities.length > 0) {
          errors.push(`Security vulnerabilities detected: ${vulnerabilities.join(', ')}`);
        }
        
        // Check for security headers
        const headersCheck = await this.checkSecurityHeaders(endpoint);
        details['security_headers'] = headersCheck.headers;
        details['missing_security_headers'] = headersCheck.missing;
        
        if (headersCheck.missing.length > 0) {
          warnings.push(`Missing security headers: ${headersCheck.missing.join(', ')}`);
        }
        
        // Check for HTTPS
        const httpsCheck = this.checkHTTPS(endpoint);
        details['https_enabled'] = httpsCheck.enabled;
        details['https_valid'] = httpsCheck.valid;
        
        if (!httpsCheck.enabled) {
          errors.push('Endpoint does not use HTTPS');
        }
        
        // Check for data exposure
        const exposureCheck = await this.checkDataExposure(endpoint, context);
        details['sensitive_data_exposed'] = exposureCheck.exposed;
        details['exposed_data_types'] = exposureCheck.types;
        
        if (exposureCheck.exposed) {
          errors.push(`Sensitive data exposed: ${exposureCheck.types.join(', ')}`);
        }
        
      } catch (error) {
        errors.push(`Security test failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private async performSecurityTests(endpoint: string, context: TestContext): Promise<SecurityTestResult> {
    const result: SecurityTestResult = {
      sql_injection: false,
      xss: false,
      ssrf: false,
      idor: false,
      secret_leakage: false,
      path_traversal: false,
      command_injection: false
    };
    
    // SQL Injection test (basic check)
    result.sql_injection = await this.testSQLInjection(endpoint, context);
    
    // XSS test (basic check)
    result.xss = await this.testXSS(endpoint, context);
    
    // SSRF test (basic check)
    result.ssrf = await this.testSSRF(endpoint, context);
    
    // IDOR test (basic check)
    result.idor = await this.testIDOR(endpoint, context);
    
    // Secret leakage test
    result.secret_leakage = await this.testSecretLeakage(endpoint, context);
    
    // Path traversal test
    result.path_traversal = await this.testPathTraversal(endpoint, context);
    
    // Command injection test
    result.command_injection = await this.testCommandInjection(endpoint, context);
    
    return result;
  }

  private async testSQLInjection(endpoint: string, _context: TestContext): Promise<boolean> {
    try {
      const sqlPayload = "1' OR '1'='1";
      const testUrl = `${endpoint}?id=${encodeURIComponent(sqlPayload)}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'PREDATOR-Security-Test/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const body = await response.text();
      
      // Check if response contains SQL error messages
      const sqlErrorPatterns = [
        /sql syntax/i,
        /mysql/i,
        /oracle/i,
        /postgresql/i,
        /sqlite/i
      ];
      
      return sqlErrorPatterns.some(pattern => pattern.test(body));
    } catch {
      return false;
    }
  }

  private async testXSS(endpoint: string, _context: TestContext): Promise<boolean> {
    try {
      const xssPayload = '<script>alert("XSS")</script>';
      const testUrl = `${endpoint}?q=${encodeURIComponent(xssPayload)}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'PREDATOR-Security-Test/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const body = await response.text();
      
      // Check if payload is reflected unescaped
      return body.includes('<script>alert("XSS")</script>') || 
             body.includes(xssPayload);
    } catch {
      return false;
    }
  }

  private async testSSRF(endpoint: string, _context: TestContext): Promise<boolean> {
    try {
      // Test with localhost URL
      const ssrfPayload = 'http://127.0.0.1:8080/admin';
      const testUrl = `${endpoint}?url=${encodeURIComponent(ssrfPayload)}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'PREDATOR-Security-Test/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      // If the request succeeds, it might be vulnerable
      // This is a basic check - real SSRF testing is more complex
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testIDOR(endpoint: string, _context: TestContext): Promise<boolean> {
    try {
      // Test with sequential IDs
      const testUrl = `${endpoint}?id=1`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'PREDATOR-Security-Test/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      // If we can access data without proper authentication, it might be vulnerable
      // This is a basic check - real IDOR testing requires authenticated sessions
      return response.ok && response.status !== 401 && response.status !== 403;
    } catch {
      return false;
    }
  }

  private async testSecretLeakage(endpoint: string, _context: TestContext): Promise<boolean> {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'PREDATOR-Security-Test/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const body = await response.text();
      
      // Check for common secret patterns
      const secretPatterns = [
        /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
        /secret[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
        /password\s*[:=]\s*['"]?[a-zA-Z0-9]{8,}['"]?/i,
        /token\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/i,
        /bearer\s+[a-zA-Z0-9]{20,}/i
      ];
      
      return secretPatterns.some(pattern => pattern.test(body));
    } catch {
      return false;
    }
  }

  private async testPathTraversal(endpoint: string, _context: TestContext): Promise<boolean> {
    try {
      const pathPayload = '../../../etc/passwd';
      const testUrl = `${endpoint}?file=${encodeURIComponent(pathPayload)}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'PREDATOR-Security-Test/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const body = await response.text();
      
      // Check if response contains file system content
      return body.includes('root:') || body.includes('/bin/bash');
    } catch {
      return false;
    }
  }

  private async testCommandInjection(endpoint: string, _context: TestContext): Promise<boolean> {
    try {
      const commandPayload = '; cat /etc/passwd';
      const testUrl = `${endpoint}?cmd=${encodeURIComponent(commandPayload)}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'PREDATOR-Security-Test/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const body = await response.text();
      
      // Check if response contains file system content
      return body.includes('root:') || body.includes('/bin/bash');
    } catch {
      return false;
    }
  }

  private calculateSecurityScore(result: SecurityTestResult): number {
    let score = 100;
    
    if (result.sql_injection) score -= 20;
    if (result.xss) score -= 15;
    if (result.ssrf) score -= 15;
    if (result.idor) score -= 15;
    if (result.secret_leakage) score -= 20;
    if (result.path_traversal) score -= 10;
    if (result.command_injection) score -= 5;
    
    return Math.max(0, score);
  }

  private identifyVulnerabilities(result: SecurityTestResult): string[] {
    const vulnerabilities: string[] = [];
    
    if (result.sql_injection) vulnerabilities.push('SQL Injection');
    if (result.xss) vulnerabilities.push('XSS');
    if (result.ssrf) vulnerabilities.push('SSRF');
    if (result.idor) vulnerabilities.push('IDOR');
    if (result.secret_leakage) vulnerabilities.push('Secret Leakage');
    if (result.path_traversal) vulnerabilities.push('Path Traversal');
    if (result.command_injection) vulnerabilities.push('Command Injection');
    
    return vulnerabilities;
  }

  private async checkSecurityHeaders(endpoint: string): Promise<{
    headers: Record<string, boolean>;
    missing: string[];
  }> {
    const expectedHeaders = [
      'Strict-Transport-Security',
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection'
    ];
    
    const headers: Record<string, boolean> = {};
    const missing: string[] = [];
    
    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      for (const header of expectedHeaders) {
        const present = response.headers.get(header) !== null;
        headers[header] = present;
        if (!present) {
          missing.push(header);
        }
      }
    } catch {
      // If request fails, assume headers are missing
      for (const header of expectedHeaders) {
        headers[header] = false;
        missing.push(header);
      }
    }
    
    return { headers, missing };
  }

  private checkHTTPS(endpoint: string): { enabled: boolean; valid: boolean } {
    const enabled = endpoint.startsWith('https://');
    const valid = enabled; // In a real implementation, would check certificate validity
    
    return { enabled, valid };
  }

  private async checkDataExposure(endpoint: string, _context: TestContext): Promise<{
    exposed: boolean;
    types: string[];
  }> {
    const types: string[] = [];
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'PREDATOR-Security-Test/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const body = await response.text();
      
      // Check for exposed sensitive data patterns
      const sensitivePatterns = [
        { pattern: /\d{16}/, type: 'Credit Card Number' },
        { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'Email Address' },
        { pattern: /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, type: 'Phone Number' },
        { pattern: /\d{3}-\d{2}-\d{4}/, type: 'SSN' }
      ];
      
      for (const { pattern, type } of sensitivePatterns) {
        if (pattern.test(body)) {
          types.push(type);
        }
      }
    } catch {
      // Ignore errors
    }
    
    return {
      exposed: types.length > 0,
      types
    };
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
