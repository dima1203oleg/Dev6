/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-006 — Schema Validation
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus } from '../types';

export class TEST006_SchemaValidation extends BaseTest {
  constructor() {
    super('TEST-006', 'Schema Validation');
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
          details['json_parseable'] = true;
        } catch (parseError) {
          errors.push('Response is not valid JSON');
          details['json_parseable'] = false;
          return { details, errors, warnings };
        }
        
        // Validate against expected schema based on source type
        const schemaValidation = this.validateSchema(context.source_config, jsonData);
        
        details['schema_version'] = context.source_config.schema_version;
        details['schema_valid'] = schemaValidation.valid;
        details['missing_fields'] = schemaValidation.missingFields;
        details['extra_fields'] = schemaValidation.extraFields;
        details['type_mismatches'] = schemaValidation.typeMismatches;
        
        if (!schemaValidation.valid) {
          errors.push(`Schema validation failed: ${schemaValidation.missingFields.join(', ')}`);
        }
        
        // Check for required top-level fields
        const requiredTopLevelFields = ['result', 'data', 'response', 'items'];
        const hasRequiredField = requiredTopLevelFields.some(field => field in jsonData);
        
        if (!hasRequiredField && Object.keys(jsonData).length === 0) {
          warnings.push('Response may be missing standard top-level fields');
        }
        
      } catch (error) {
        errors.push(`Schema validation failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private validateSchema(config: any, data: any): {
    valid: boolean;
    missingFields: string[];
    extraFields: string[];
    typeMismatches: string[];
  } {
    const result = {
      valid: true,
      missingFields: [] as string[],
      extraFields: [] as string[],
      typeMismatches: [] as string[]
    };

    // Define expected fields based on source category
    const expectedFields = this.getExpectedFields(config.category, config.supported_entities);
    
    // Check for missing fields
    for (const field of expectedFields.required) {
      if (!this.hasField(data, field)) {
        result.missingFields.push(field);
        result.valid = false;
      }
    }
    
    // Check for extra fields (informational)
    const allFields = this.getAllFields(data);
    for (const field of allFields) {
      if (!expectedFields.required.includes(field) && !expectedFields.optional.includes(field)) {
        result.extraFields.push(field);
      }
    }
    
    // Check type mismatches
    for (const [field, expectedType] of Object.entries(expectedFields.types)) {
      const value = this.getFieldValue(data, field);
      if (value !== null && value !== undefined) {
        const actualType = typeof value;
        if (actualType !== expectedType) {
          result.typeMismatches.push(`${field} (expected ${expectedType}, got ${actualType})`);
        }
      }
    }
    
    return result;
  }

  private getExpectedFields(category: string, _entities: string[]): {
    required: string[];
    optional: string[];
    types: Record<string, string>;
  } {
    // Basic schema expectations based on category
    const baseSchema = {
      required: ['data'],
      optional: ['metadata', 'timestamp', 'total', 'page', 'limit'],
      types: {
        data: 'object'
      }
    };

    switch (category) {
      case 'Державний реєстр':
        return {
          required: ['data', 'edrpou', 'name'],
          optional: ['status', 'address', 'registration_date'],
          types: { data: 'object', edrpou: 'string', name: 'string' }
        };

      case 'Судові рішення':
        return {
          required: ['case_number', 'court_name'],
          optional: ['case_date', 'participants', 'decision'],
          types: { case_number: 'string', court_name: 'string' }
        };

      case 'Санкції':
        return {
          required: ['sanction_type', 'subject'],
          optional: ['date_imposed', 'reason', 'duration'],
          types: { sanction_type: 'string', subject: 'string' }
        };

      default:
        return baseSchema;
    }
  }

  private hasField(data: any, fieldPath: string): boolean {
    const parts = fieldPath.split('.');
    let current = data;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return false;
      }
      if (Array.isArray(current)) {
        return current.some((item: any) => item && item[part] !== undefined);
      }
      current = current[part];
    }
    
    return current !== undefined;
  }

  private getFieldValue(data: any, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let current = data;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  private getAllFields(data: any, prefix: string = ''): string[] {
    const fields: string[] = [];
    
    if (typeof data !== 'object' || data === null) {
      return fields;
    }
    
    for (const key of Object.keys(data)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      fields.push(fieldPath);
      
      if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
        fields.push(...this.getAllFields(data[key], fieldPath));
      }
    }
    
    return fields;
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
