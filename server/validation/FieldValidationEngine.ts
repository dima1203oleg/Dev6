/**
 * Field Level Validation Engine
 * 
 * Validates individual data fields for type, format, range, and business logic
 */

export interface FieldValidationRule {
  field: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  format?: RegExp;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  allowedValues?: any[];
  required: boolean;
}

export interface FieldValidationResult {
  field: string;
  value: any;
  status: 'PASS' | 'FAIL' | 'MISSING' | 'EMPTY';
  type_validation: 'PASS' | 'FAIL' | 'SKIP';
  format_validation: 'PASS' | 'FAIL' | 'SKIP';
  range_validation: 'PASS' | 'FAIL' | 'SKIP';
  business_validation: 'PASS' | 'FAIL' | 'SKIP';
  errors: string[];
  warnings: string[];
}

export class FieldValidationEngine {
  private rules: Map<string, FieldValidationRule[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default field validation rules
   */
  private initializeDefaultRules(): void {
    // Company field rules
    this.rules.set('company', [
      {
        field: 'company_name',
        type: 'string',
        minLength: 2,
        maxLength: 500,
        required: true,
      },
      {
        field: 'edrpou',
        type: 'string',
        format: /^\d{8}$/,
        required: true,
      },
      {
        field: 'legal_form',
        type: 'string',
        allowedValues: ['ПАТ', 'ТОВ', 'ПП', 'ФОП', 'КП'],
        required: false,
      },
    ]);

    // Person field rules
    this.rules.set('person', [
      {
        field: 'name',
        type: 'string',
        minLength: 2,
        maxLength: 200,
        required: true,
      },
      {
        field: 'ipn',
        type: 'string',
        format: /^\d{10}$/,
        required: true,
      },
      {
        field: 'passport',
        type: 'string',
        minLength: 6,
        maxLength: 20,
        required: false,
      },
    ]);

    // FOP field rules
    this.rules.set('fop', [
      {
        field: 'name',
        type: 'string',
        minLength: 2,
        maxLength: 200,
        required: true,
      },
      {
        field: 'ipn',
        type: 'string',
        format: /^\d{10}$/,
        required: true,
      },
    ]);
  }

  /**
   * Validate all fields in an entity
   */
  validateEntity(entityType: string, data: Record<string, any>): FieldValidationResult[] {
    const rules = this.rules.get(entityType);
    if (!rules) {
      console.log(`[FieldValidationEngine] No rules found for entity type: ${entityType}`);
      return [];
    }

    console.log(`[FieldValidationEngine] Validating ${rules.length} fields for ${entityType}`);

    const results: FieldValidationResult[] = [];

    for (const rule of rules) {
      const result = this.validateField(rule, data[rule.field]);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate a single field
   */
  private validateField(rule: FieldValidationRule, value: any): FieldValidationResult {
    const result: FieldValidationResult = {
      field: rule.field,
      value,
      status: 'PASS',
      type_validation: 'SKIP',
      format_validation: 'SKIP',
      range_validation: 'SKIP',
      business_validation: 'SKIP',
      errors: [],
      warnings: [],
    };

    // Check if missing
    if (value === null || value === undefined) {
      if (rule.required) {
        result.status = 'MISSING';
        result.errors.push(`Required field is missing`);
      } else {
        result.status = 'PASS';
      }
      return result;
    }

    // Check if empty
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      if (rule.required) {
        result.status = 'EMPTY';
        result.errors.push(`Required field is empty`);
      } else {
        result.status = 'PASS';
      }
      return result;
    }

    // Type validation
    result.type_validation = this.validateType(rule.type, value);
    if (result.type_validation === 'FAIL') {
      result.status = 'FAIL';
      result.errors.push(`Type mismatch: expected ${rule.type}, got ${typeof	value}`);
    }

    // Format validation
    if (rule.format) {
      result.format_validation = this.validateFormat(rule.format, value);
      if (result.format_validation === 'FAIL') {
        result.status = 'FAIL';
        result.errors.push(`Format validation failed`);
      }
    }

    // Range validation (string length)
    if (rule.type === 'string') {
      if (rule.minLength && String(value).length < rule.minLength) {
        result.range_validation = 'FAIL';
        result.status = 'FAIL';
        result.errors.push(`Value too short: minimum ${rule.minLength} characters`);
      }
      if (rule.maxLength && String(value).length > rule.maxLength) {
        result.range_validation = 'FAIL';
        result.status = 'FAIL';
        result.errors.push(`Value too long: maximum ${rule.maxLength} characters`);
      }
    }

    // Range validation (numeric)
    if (rule.type === 'number') {
      if (rule.minValue !== undefined && Number(value) < rule.minValue) {
        result.range_validation = 'FAIL';
        result.status = 'FAIL';
        result.errors.push(`Value too small: minimum ${rule.minValue}`);
      }
      if (rule.maxValue !== undefined && Number(value) > rule.maxValue) {
        result.range_validation = 'FAIL';
        result.status = 'FAIL';
        result.errors.push(`Value too large: maximum ${rule.maxValue}`);
      }
    }

    // Business validation (allowed values)
    if (rule.allowedValues) {
      result.business_validation = this.validateAllowedValues(rule.allowedValues, value);
      if (result.business_validation === 'FAIL') {
        result.status = 'FAIL';
        result.errors.push(`Value not in allowed list: ${rule.allowedValues.join(', ')}`);
      }
    }

    return result;
  }

  /**
   * Validate type
   */
  private validateType(expectedType: string, value: any): 'PASS' | 'FAIL' | 'SKIP' {
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (expectedType === 'string' && actualType === 'string') return 'PASS';
    if (expectedType === 'number' && (actualType === 'number' || !isNaN(Number(value)))) return 'PASS';
    if (expectedType === 'boolean' && actualType === 'boolean') return 'PASS';
    if (expectedType === 'array' && actualType === 'array') return 'PASS';
    if (expectedType === 'object' && actualType === 'object') return 'PASS';
    if (expectedType === 'date' && !isNaN(Date.parse(value))) return 'PASS';

    return 'FAIL';
  }

  /**
   * Validate format
   */
  private validateFormat(format: RegExp, value: string): 'PASS' | 'FAIL' | 'SKIP' {
    if (typeof value !== 'string') return 'FAIL';
    return format.test(value) ? 'PASS' : 'FAIL';
  }

  /**
   * Validate allowed values
   */
  private validateAllowedValues(allowedValues: any[], value: any): 'PASS' | 'FAIL' | 'SKIP' {
    return allowedValues.includes(value) ? 'PASS' : 'FAIL';
  }

  /**
   * Register custom validation rules
   */
  registerRules(entityType: string, rules: FieldValidationRule[]): void {
    this.rules.set(entityType, rules);
    console.log(`[FieldValidationEngine] Registered ${rules.length} rules for ${entityType}`);
  }

  /**
   * Get validation summary
   */
  getSummary(results: FieldValidationResult[]): {
    total: number;
    passed: number;
    failed: number;
    missing: number;
    empty: number;
    overall_status: 'PASS' | 'FAIL';
  } {
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const missing = results.filter(r => r.status === 'MISSING').length;
    const empty = results.filter(r => r.status === 'EMPTY').length;

    return {
      total,
      passed,
      failed,
      missing,
      empty,
      overall_status: failed > 0 || missing > 0 ? 'FAIL' : 'PASS',
    };
  }
}
