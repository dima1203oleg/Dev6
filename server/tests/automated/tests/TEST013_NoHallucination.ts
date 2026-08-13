/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-013 — No Hallucination
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus } from '../types';

export class TEST013_NoHallucination extends BaseTest {
  constructor() {
    super('TEST-013', 'No Hallucination');
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
          errors.push('Cannot check for hallucination - raw data is not valid JSON');
          return { details, errors, warnings };
        }
        
        // Check for hallucinated values
        const hallucinationCheck = this.checkForHallucination(jsonData);
        
        details['fields_checked'] = hallucinationCheck.fieldsChecked;
        details['hallucinated_fields'] = hallucinationCheck.hallucinatedFields;
        details['not_found_fields'] = hallucinationCheck.notFoundFields;
        details['unknown_fields'] = hallucinationCheck.unknownFields;
        details['not_applicable_fields'] = hallucinationCheck.notApplicableFields;
        
        if (hallucinationCheck.hallucinatedFields.length > 0) {
          errors.push(`Hallucinated values detected: ${hallucinationCheck.hallucinatedFields.join(', ')}`);
          details['hallucination_detected'] = true;
        } else {
          details['hallucination_detected'] = false;
        }
        
        // Check for default/generic values that might indicate hallucination
        const genericValueCheck = this.checkForGenericValues(jsonData);
        details['generic_values_found'] = genericValueCheck.found;
        details['generic_value_fields'] = genericValueCheck.fields;
        
        if (genericValueCheck.found) {
          warnings.push(`Generic values found: ${genericValueCheck.fields.join(', ')}`);
        }
        
        // Check for data that looks like placeholders
        const placeholderCheck = this.checkForPlaceholders(jsonData);
        details['placeholders_found'] = placeholderCheck.found;
        details['placeholder_fields'] = placeholderCheck.fields;
        
        if (placeholderCheck.found) {
          warnings.push(`Placeholder values found: ${placeholderCheck.fields.join(', ')}`);
        }
        
        // Verify all values have provenance
        const provenanceCheck = this.checkProvenance(jsonData);
        details['fields_with_provenance'] = provenanceCheck.withProvenance;
        details['fields_without_provenance'] = provenanceCheck.withoutProvenance;
        
        if (provenanceCheck.withoutProvenance.length > 0) {
          errors.push(`Fields without provenance: ${provenanceCheck.withoutProvenance.join(', ')}`);
        }
        
        // Check for AI-generated patterns
        const aiPatternCheck = this.checkForAIPatterns(jsonData);
        details['ai_patterns_detected'] = aiPatternCheck.detected;
        details['ai_pattern_fields'] = aiPatternCheck.fields;
        
        if (aiPatternCheck.detected) {
          warnings.push(`AI-like patterns detected: ${aiPatternCheck.fields.join(', ')}`);
        }
        
      } catch (error) {
        errors.push(`Hallucination check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private checkForHallucination(data: any): {
    fieldsChecked: number;
    hallucinatedFields: string[];
    notFoundFields: string[];
    unknownFields: string[];
    notApplicableFields: string[];
  } {
    const result = {
      fieldsChecked: 0,
      hallucinatedFields: [] as string[],
      notFoundFields: [] as string[],
      unknownFields: [] as string[],
      notApplicableFields: [] as string[]
    };
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, path));
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        result.fieldsChecked++;
        
        if (value === null || value === undefined) {
          // Check if null is appropriate or should be NOT_FOUND
          if (this.shouldHaveValue(key)) {
            result.notFoundFields.push(fieldPath);
          }
        } else if (typeof value === 'string') {
          const upperValue = value.toUpperCase();
          
          // Check for proper null indicators
          if (upperValue === 'NOT_FOUND' || upperValue === 'NOT FOUND') {
            result.notFoundFields.push(fieldPath);
          } else if (upperValue === 'UNKNOWN') {
            result.unknownFields.push(fieldPath);
          } else if (upperValue === 'NOT_APPLICABLE' || upperValue === 'N/A') {
            result.notApplicableFields.push(fieldPath);
          } else if (this.looksLikeHallucination(value, key)) {
            result.hallucinatedFields.push(fieldPath);
          }
        }
        
        if (typeof value === 'object') {
          traverse(value, fieldPath);
        }
      }
    };
    
    traverse(data);
    
    return result;
  }

  private shouldHaveValue(fieldName: string): boolean {
    const importantFields = ['id', 'name', 'edrpou', 'ipn', 'status', 'date'];
    return importantFields.some(field => fieldName.toLowerCase().includes(field));
  }

  private looksLikeHallucination(value: string, fieldName: string): boolean {
    // Check for suspicious patterns
    const hallucinationPatterns = [
      /^example\d+$/i,           // example123
      /^test\d+$/i,              // test123
      /^sample\d+$/i,            // sample123
      /^placeholder$/i,          // placeholder
      /^temp$/i,                 // temp
      /^xxx+$/i,                 // xxx, xxxx
      /^aaa+$/i,                 // aaa, aaaa
      /^\d{3}-\d{3}-\d{4}$/      // Generic phone format without context
    ];
    
    for (const pattern of hallucinationPatterns) {
      if (pattern.test(value)) {
        return true;
      }
    }
    
    // Check for unrealistic values in specific fields
    if (fieldName.toLowerCase().includes('name') && value.length < 2) {
      return true;
    }
    
    if (fieldName.toLowerCase().includes('edrpou') && !/^\d{8}$/.test(value)) {
      return true;
    }
    
    if (fieldName.toLowerCase().includes('ipn') && !/^\d{10}$/.test(value)) {
      return true;
    }
    
    return false;
  }

  private checkForGenericValues(data: any): { found: boolean; fields: string[] } {
    const fields: string[] = [];
    
    const genericValues = [
      'unknown', 'n/a', 'not specified', 'not available',
      'none', 'null', 'undefined', 'empty'
    ];
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, path));
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          if (genericValues.includes(lowerValue) && this.shouldHaveValue(key)) {
            fields.push(fieldPath);
          }
        }
        
        if (typeof value === 'object') {
          traverse(value, fieldPath);
        }
      }
    };
    
    traverse(data);
    
    return {
      found: fields.length > 0,
      fields
    };
  }

  private checkForPlaceholders(data: any): { found: boolean; fields: string[] } {
    const fields: string[] = [];
    
    const placeholderPatterns = [
      /\[.*\]/,           // [placeholder]
      /\{.*\}/,           // {placeholder}
      /<.*>/,             // <placeholder>
      /^\.\.\.$/,         // ...
      /^---$/,            // ---
      /^___+$/            // ___
    ];
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, path));
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string') {
          for (const pattern of placeholderPatterns) {
            if (pattern.test(value)) {
              fields.push(fieldPath);
              break;
            }
          }
        }
        
        if (typeof value === 'object') {
          traverse(value, fieldPath);
        }
      }
    };
    
    traverse(data);
    
    return {
      found: fields.length > 0,
      fields
    };
  }

  private checkProvenance(data: any): { withProvenance: string[]; withoutProvenance: string[] } {
    const withProvenance: string[] = [];
    const withoutProvenance: string[] = [];
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, path));
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        
        // Check if the object has provenance metadata
        const hasProvenance = 
          obj.source_id !== undefined ||
          obj.timestamp !== undefined ||
          obj.provenance !== undefined ||
          obj.raw !== undefined;
        
        if (hasProvenance) {
          withProvenance.push(fieldPath);
        } else if (typeof value !== 'object') {
          withoutProvenance.push(fieldPath);
        }
        
        if (typeof value === 'object') {
          traverse(value, fieldPath);
        }
      }
    };
    
    traverse(data);
    
    return {
      withProvenance: [...new Set(withProvenance)],
      withoutProvenance: [...new Set(withoutProvenance)]
    };
  }

  private checkForAIPatterns(data: any): { detected: boolean; fields: string[] } {
    const fields: string[] = [];
    
    const aiPatterns = [
      /^(As an AI|I believe|It seems that|Based on my)/i,
      /^(Please note|Keep in mind|It's important to)/i,
      /^(Lorem ipsum|Dolor sit amet)/i
    ];
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, path));
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && value.length > 50) {
          for (const pattern of aiPatterns) {
            if (pattern.test(value)) {
              fields.push(fieldPath);
              break;
            }
          }
        }
        
        if (typeof value === 'object') {
          traverse(value, fieldPath);
        }
      }
    };
    
    traverse(data);
    
    return {
      detected: fields.length > 0,
      fields
    };
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
