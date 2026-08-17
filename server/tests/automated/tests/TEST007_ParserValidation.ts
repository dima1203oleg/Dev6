/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-007 — Parser Validation
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, ParsedData } from '../types';

export class TEST007_ParserValidation extends BaseTest {
  constructor() {
    super('TEST-007', 'Parser Validation');
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
          errors.push('Cannot validate parser - raw data is not valid JSON');
          return { details, errors, warnings };
        }
        
        // Simulate parsing
        const parsedData = this.parseData(jsonData, context.source_config);
        
        details['parser_version'] = parsedData.parser_version;
        details['parse_errors_count'] = parsedData.parse_errors.length;
        details['parse_warnings_count'] = parsedData.parse_warnings.length;
        details['fields_parsed'] = Object.keys(parsedData.data).length;
        
        // Validate types
        const typeValidation = this.validateTypes(parsedData.data);
        details['type_validation'] = typeValidation;
        
        if (!typeValidation.valid) {
          errors.push(`Type validation failed: ${typeValidation.errors.join(', ')}`);
        }
        
        // Check UTF-8 encoding
        details['utf8_valid'] = this.validateUTF8(body);
        if (!details['utf8_valid']) {
          warnings.push('Response may not be valid UTF-8');
        }
        
        // Check null handling
        const nullHandling = this.checkNullHandling(parsedData.data);
        details['null_fields'] = nullHandling.nullFields;
        details['null_handling_valid'] = nullHandling.valid;
        
        // Check required fields
        const requiredFieldsCheck = this.checkRequiredFields(parsedData.data, context.source_config);
        details['required_fields_present'] = requiredFieldsCheck.present;
        details['missing_required_fields'] = requiredFieldsCheck.missing;
        
        if (requiredFieldsCheck.missing.length > 0) {
          errors.push(`Missing required fields: ${requiredFieldsCheck.missing.join(', ')}`);
        }
        
        // Check optional fields
        const optionalFieldsCheck = this.checkOptionalFields(parsedData.data, context.source_config);
        details['optional_fields_present'] = optionalFieldsCheck.present;
        
      } catch (error) {
        errors.push(`Parser validation failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private parseData(rawData: any, _config: any): ParsedData {
    const parseErrors: string[] = [];
    const parseWarnings: string[] = [];
    
    // Extract relevant data based on source configuration
    let parsedData: any = {};
    
    try {
      if (rawData.data) {
        parsedData = rawData.data;
      } else if (rawData.result) {
        parsedData = rawData.result;
      } else if (rawData.response) {
        parsedData = rawData.response;
      } else {
        parsedData = rawData;
        parseWarnings.push('Using raw data as parsed data - no standard wrapper found');
      }
      
      // Normalize field names
      parsedData = this.normalizeFieldNames(parsedData);
      
    } catch (error) {
      parseErrors.push(`Parsing error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return {
      data: parsedData,
      parser_version: '1.0.0',
      parse_errors: parseErrors,
      parse_warnings: parseWarnings
    };
  }

  private normalizeFieldNames(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeFieldNames(item));
    }
    
    const normalized: any = {};
    for (const key of Object.keys(data)) {
      // Convert to camelCase
      const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
      normalized[normalizedKey] = this.normalizeFieldNames(data[key]);
    }
    
    return normalized;
  }

  private validateTypes(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const typeChecks = this.getTypeChecks(data);
    
    for (const [field, check] of Object.entries(typeChecks)) {
      if (!check.valid) {
        errors.push(`${field}: expected ${check.expectedType}, got ${check.actualType}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  private getTypeChecks(data: any): Record<string, { valid: boolean; expectedType: string; actualType: string }> {
    const checks: Record<string, { valid: boolean; expectedType: string; actualType: string }> = {};
    
    if (typeof data !== 'object' || data === null) {
      return checks;
    }
    
    for (const [key, value] of Object.entries(data)) {
      const actualType = typeof value;
      let expectedType = 'string';
      
      // Infer expected type from field name
      if (key.includes('date') || key.includes('time')) {
        expectedType = 'string';
      } else if (key.includes('count') || key.includes('amount') || key.includes('total')) {
        expectedType = 'number';
      } else if (key.includes('is_') || key.includes('has_') || key.includes('active')) {
        expectedType = 'boolean';
      }
      
      checks[key] = {
        valid: actualType === expectedType || value === null,
        expectedType,
        actualType
      };
    }
    
    return checks;
  }

  private validateUTF8(text: string): boolean {
    try {
      // Try to encode and decode
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8').decode(encoded);
      return decoded === text;
    } catch {
      return false;
    }
  }

  private checkNullHandling(data: any): { valid: boolean; nullFields: string[] } {
    const nullFields: string[] = [];
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        
        if (value === null) {
          nullFields.push(fieldPath);
        } else if (typeof value === 'object') {
          traverse(value, fieldPath);
        }
      }
    };
    
    traverse(data);
    
    return {
      valid: true, // Null values are acceptable
      nullFields
    };
  }

  private checkRequiredFields(data: any, _config: any): { present: string[]; missing: string[] } {
    const requiredFields = ['name', 'id'];
    const present: string[] = [];
    const missing: string[] = [];
    
    for (const field of requiredFields) {
      if (field in data && data[field] !== null && data[field] !== undefined) {
        present.push(field);
      } else {
        missing.push(field);
      }
    }
    
    return { present, missing };
  }

  private checkOptionalFields(data: any, _config: any): { present: string[] } {
    const optionalFields = ['address', 'phone', 'email', 'status'];
    const present: string[] = [];
    
    for (const field of optionalFields) {
      if (field in data && data[field] !== null && data[field] !== undefined) {
        present.push(field);
      }
    }
    
    return { present };
  }

}
