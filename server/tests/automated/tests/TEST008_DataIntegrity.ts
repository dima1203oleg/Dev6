/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-008 — Data Integrity
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus } from '../types';

export class TEST008_DataIntegrity extends BaseTest {
  constructor() {
    super('TEST-008', 'Data Integrity');
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
        
        const rawBody = await response.text();
        
        // Parse JSON
        let jsonData: any;
        try {
          jsonData = JSON.parse(rawBody);
        } catch (parseError) {
          errors.push('Cannot check data integrity - raw data is not valid JSON');
          return { details, errors, warnings };
        }
        
        // Check for character loss
        const integrityCheck = this.checkDataIntegrity(rawBody, jsonData);
        
        details.raw_length = rawBody.length;
        details.parsed_length = JSON.stringify(jsonData).length;
        details.character_loss = integrityCheck.characterLoss;
        details.data_corruption = integrityCheck.corruptionDetected;
        details.unicode_issues = integrityCheck.unicodeIssues;
        
        if (integrityCheck.characterLoss > 0) {
          errors.push(`Character loss detected: ${integrityCheck.characterLoss} characters`);
        }
        
        if (integrityCheck.corruptionDetected) {
          errors.push('Data corruption detected during parsing');
        }
        
        if (integrityCheck.unicodeIssues.length > 0) {
          warnings.push(`Unicode issues detected: ${integrityCheck.unicodeIssues.join(', ')}`);
        }
        
        // Check for data truncation
        const truncationCheck = this.checkTruncation(rawBody);
        details.truncation_detected = truncationCheck.detected;
        details.truncation_location = truncationCheck.location;
        
        if (truncationCheck.detected) {
          errors.push(`Data truncation detected at ${truncationCheck.location}`);
        }
        
        // Check for encoding issues
        const encodingCheck = this.checkEncoding(rawBody);
        details.encoding_valid = encodingCheck.valid;
        details.encoding_detected = encodingCheck.detected;
        
        if (!encodingCheck.valid) {
          warnings.push(`Encoding issue detected: ${encodingCheck.detected}`);
        }
        
        // Verify data consistency
        const consistencyCheck = this.checkConsistency(jsonData);
        details.consistency_valid = consistencyCheck.valid;
        details.consistency_issues = consistencyCheck.issues;
        
        if (!consistencyCheck.valid) {
          warnings.push(`Consistency issues: ${consistencyCheck.issues.join(', ')}`);
        }
        
      } catch (error) {
        errors.push(`Data integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private checkDataIntegrity(rawBody: string, parsedData: any): {
    characterLoss: number;
    corruptionDetected: boolean;
    unicodeIssues: string[];
  } {
    const result = {
      characterLoss: 0,
      corruptionDetected: false,
      unicodeIssues: [] as string[]
    };
    
    // Re-serialize parsed data and compare
    const serialized = JSON.stringify(parsedData);
    
    // Check for character loss (round-trip)
    if (serialized.length !== rawBody.length) {
      result.characterLoss = Math.abs(rawBody.length - serialized.length);
    }
    
    // Check for Unicode issues
    const unicodeRegex = /[\u0000-\u001F\uFFFD]/g;
    const unicodeMatches = rawBody.match(unicodeRegex);
    if (unicodeMatches) {
      result.unicodeIssues = unicodeMatches.map(char => `U+${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
    }
    
    // Check for replacement characters
    if (rawBody.includes('\uFFFD')) {
      result.unicodeIssues.push('Replacement character (U+FFFD) found');
      result.corruptionDetected = true;
    }
    
    return result;
  }

  private checkTruncation(data: string): { detected: boolean; location: string } {
    const result = { detected: false, location: 'none' };
    
    // Check for incomplete JSON structures
    const openBraces = (data.match(/{/g) || []).length;
    const closeBraces = (data.match(/}/g) || []).length;
    const openBrackets = (data.match(/\[/g) || []).length;
    const closeBrackets = (data.match(/\]/g) || []).length;
    
    if (openBraces !== closeBraces) {
      result.detected = true;
      result.location = 'unmatched braces';
    }
    
    if (openBrackets !== closeBrackets) {
      result.detected = true;
      result.location = 'unmatched brackets';
    }
    
    // Check for abrupt endings
    if (data.endsWith(',') || data.endsWith(':')) {
      result.detected = true;
      result.location = 'abrupt ending';
    }
    
    return result;
  }

  private checkEncoding(data: string): { valid: boolean; detected: string } {
    try {
      // Try to detect encoding
      const encoder = new TextEncoder();
      const encoded = encoder.encode(data);
      const decoder = new TextDecoder('utf-8', { fatal: true });
      decoder.decode(encoded);
      
      return { valid: true, detected: 'UTF-8' };
    } catch {
      return { valid: false, detected: 'Unknown or invalid encoding' };
    }
  }

  private checkConsistency(data: any): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        
        // Check for inconsistent types in arrays
        if (Array.isArray(value) && value.length > 1) {
          const firstType = typeof value[0];
          const hasMixedTypes = value.some((item: any) => typeof item !== firstType && item !== null);
          
          if (hasMixedTypes) {
            issues.push(`Mixed types in array at ${fieldPath}`);
          }
        }
        
        // Check for empty strings that should have data
        if (typeof value === 'string' && value.trim() === '' && 
            (key.includes('name') || key.includes('id') || key.includes('address'))) {
          issues.push(`Empty critical field at ${fieldPath}`);
        }
        
        if (typeof value === 'object') {
          traverse(value, fieldPath);
        }
      }
    };
    
    traverse(data);
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
