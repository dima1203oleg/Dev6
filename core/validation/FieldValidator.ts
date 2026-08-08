/**
 * Field Validator
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Per-field validation with PASS/WARNING/NO_DATA/FAIL status
 */

export type ValidationStatus = 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL';

export interface FieldValidationRule {
  name: string;
  type: 'required' | 'format' | 'range' | 'length' | 'pattern' | 'custom';
  validator: (value: any) => boolean;
  errorMessage: string;
}

export interface FieldValidationResult {
  field_name: string;
  field_value: any;
  status: ValidationStatus;
  confidence?: number;
  errors: string[];
  warnings: string[];
  applied_rules: string[];
}

export interface FieldValidationConfig {
  field_name: string;
  field_type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required: boolean;
  minimum_confidence?: number;
  rules: FieldValidationRule[];
}

export class FieldValidator {
  private configs: Map<string, FieldValidationConfig> = new Map();

  /**
   * Register a field validation configuration
   */
  registerConfig(config: FieldValidationConfig): void {
    this.configs.set(config.field_name, config);
  }

  /**
   * Validate a single field
   */
  validateField(field_name: string, field_value: any, field_confidence?: number): FieldValidationResult {
    const config = this.configs.get(field_name);
    
    if (!config) {
      // No config - perform basic validation
      return this.basicValidation(field_name, field_value, field_confidence);
    }

    const result: FieldValidationResult = {
      field_name,
      field_value,
      status: 'PASS',
      confidence: field_confidence,
      errors: [],
      warnings: [],
      applied_rules: []
    };

    // Check if field is required
    if (config.required && (field_value === undefined || field_value === null || field_value === '')) {
      result.status = 'FAIL';
      result.errors.push('Field is required but empty');
      return result;
    }

    // Check if field is empty (not required)
    if (!config.required && (field_value === undefined || field_value === null || field_value === '')) {
      result.status = 'NO_DATA';
      result.warnings.push('Field is empty (not required)');
      return result;
    }

    // Check type
    if (!this.validateType(field_value, config.field_type)) {
      result.status = 'FAIL';
      result.errors.push(`Field type mismatch: expected ${config.field_type}`);
      return result;
    }

    // Check minimum confidence
    if (config.minimum_confidence && field_confidence !== undefined && field_confidence < config.minimum_confidence) {
      result.status = 'WARNING';
      result.warnings.push(`Field confidence ${field_confidence} below minimum ${config.minimum_confidence}`);
    }

    // Apply custom rules
    for (const rule of config.rules) {
      result.applied_rules.push(rule.name);
      
      if (!rule.validator(field_value)) {
        if (rule.type === 'required') {
          result.status = 'FAIL';
          result.errors.push(rule.errorMessage);
        } else {
          if (result.status === 'PASS') {
            result.status = 'WARNING';
          }
          result.warnings.push(rule.errorMessage);
        }
      }
    }

    return result;
  }

  /**
   * Validate multiple fields
   */
  validateFields(fields: Record<string, any>, confidences?: Record<string, number>): FieldValidationResult[] {
    const results: FieldValidationResult[] = [];

    for (const [field_name, field_value] of Object.entries(fields)) {
      const field_confidence = confidences?.[field_name];
      const result = this.validateField(field_name, field_value, field_confidence);
      results.push(result);
    }

    return results;
  }

  /**
   * Basic validation for fields without config
   */
  private basicValidation(field_name: string, field_value: any, field_confidence?: number): FieldValidationResult {
    const result: FieldValidationResult = {
      field_name,
      field_value,
      status: 'PASS',
      confidence: field_confidence,
      errors: [],
      warnings: [],
      applied_rules: []
    };

    if (field_value === undefined || field_value === null || field_value === '') {
      result.status = 'NO_DATA';
      result.warnings.push('Field is empty (no validation config)');
    }

    return result;
  }

  /**
   * Validate field type
   */
  private validateType(value: any, expectedType: string): boolean {
    if (value === null || value === undefined) {
      return true; // Type check passes for null/undefined (handled by required check)
    }

    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return !isNaN(Date.parse(value));
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Get common validation rules
   */
  static getCommonRules(): Record<string, FieldValidationRule[]> {
    return {
      // EDRPOU validation
      edrpou: [
        {
          name: 'edrpou_format',
          type: 'pattern',
          validator: (value: string) => /^\d{8}$/.test(value),
          errorMessage: 'EDRPOU must be exactly 8 digits'
        }
      ],

      // IPN validation
      ipn: [
        {
          name: 'ipn_format',
          type: 'pattern',
          validator: (value: string) => /^\d{10}$/.test(value),
          errorMessage: 'IPN must be exactly 10 digits'
        }
      ],

      // Email validation
      email: [
        {
          name: 'email_format',
          type: 'pattern',
          validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          errorMessage: 'Invalid email format'
        }
      ],

      // Phone validation
      phone: [
        {
          name: 'phone_length',
          type: 'length',
          validator: (value: string) => value.length >= 5,
          errorMessage: 'Phone number too short'
        }
      ],

      // Date validation
      date: [
        {
          name: 'date_format',
          type: 'format',
          validator: (value: string) => !isNaN(Date.parse(value)),
          errorMessage: 'Invalid date format'
        }
      ],

      // Year validation
      year: [
        {
          name: 'year_range',
          type: 'range',
          validator: (value: number) => value >= 1900 && value <= 2100,
          errorMessage: 'Year must be between 1900 and 2100'
        }
      ],

      // Amount validation
      amount: [
        {
          name: 'amount_positive',
          type: 'range',
          validator: (value: number) => value >= 0,
          errorMessage: 'Amount cannot be negative'
        }
      ],

      // Percentage validation
      percentage: [
        {
          name: 'percentage_range',
          type: 'range',
          validator: (value: number) => value >= 0 && value <= 100,
          errorMessage: 'Percentage must be between 0 and 100'
        }
      ],

      // URL validation
      url: [
        {
          name: 'url_format',
          type: 'pattern',
          validator: (value: string) => /^https?:\/\/.+/.test(value),
          errorMessage: 'Invalid URL format'
        }
      ]
    };
  }

  /**
   * Register common field configurations
   */
  registerCommonConfigs(): void {
    const commonRules = FieldValidator.getCommonRules();

    // EDRPOU
    this.registerConfig({
      field_name: 'edrpou',
      field_type: 'string',
      required: true,
      minimum_confidence: 0.95,
      rules: commonRules.edrpou
    });

    // IPN
    this.registerConfig({
      field_name: 'ipn',
      field_type: 'string',
      required: false,
      minimum_confidence: 0.95,
      rules: commonRules.ipn
    });

    // Email
    this.registerConfig({
      field_name: 'email',
      field_type: 'string',
      required: false,
      minimum_confidence: 0.85,
      rules: commonRules.email
    });

    // Phone
    this.registerConfig({
      field_name: 'phone',
      field_type: 'string',
      required: false,
      minimum_confidence: 0.80,
      rules: commonRules.phone
    });

    // Date
    this.registerConfig({
      field_name: 'date',
      field_type: 'date',
      required: false,
      minimum_confidence: 0.85,
      rules: commonRules.date
    });

    // Year
    this.registerConfig({
      field_name: 'year',
      field_type: 'number',
      required: true,
      minimum_confidence: 0.90,
      rules: commonRules.year
    });

    // Amount
    this.registerConfig({
      field_name: 'amount',
      field_type: 'number',
      required: true,
      minimum_confidence: 0.85,
      rules: commonRules.amount
    });

    // Percentage
    this.registerConfig({
      field_name: 'percentage',
      field_type: 'number',
      required: false,
      minimum_confidence: 0.80,
      rules: commonRules.percentage
    });

    // URL
    this.registerConfig({
      field_name: 'url',
      field_type: 'string',
      required: true,
      minimum_confidence: 0.90,
      rules: commonRules.url
    });
  }

  /**
   * Get validation summary
   */
  getSummary(results: FieldValidationResult[]): {
    total: number;
    pass: number;
    warning: number;
    no_data: number;
    fail: number;
    overall_status: ValidationStatus;
  } {
    const total = results.length;
    const pass = results.filter(r => r.status === 'PASS').length;
    const warning = results.filter(r => r.status === 'WARNING').length;
    const no_data = results.filter(r => r.status === 'NO_DATA').length;
    const fail = results.filter(r => r.status === 'FAIL').length;

    let overall_status: ValidationStatus = 'PASS';
    if (fail > 0) {
      overall_status = 'FAIL';
    } else if (warning > 0) {
      overall_status = 'WARNING';
    } else if (no_data === total) {
      overall_status = 'NO_DATA';
    }

    return {
      total,
      pass,
      warning,
      no_data,
      fail,
      overall_status
    };
  }

  /**
   * Clear all configurations
   */
  clearConfigs(): void {
    this.configs.clear();
  }
}

// Singleton instance with common configs registered
export const fieldValidator = new FieldValidator();
fieldValidator.registerCommonConfigs();
