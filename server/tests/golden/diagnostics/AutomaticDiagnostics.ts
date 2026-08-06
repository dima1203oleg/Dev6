/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Automatic Diagnostics System
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult, GoldenDiagnostics } from '../types';

export class AutomaticDiagnostics extends BaseGoldenValidator {
  async diagnoseValidationResults(validationResults: GoldenValidationResult[]): Promise<GoldenDiagnostics[]> {
    const diagnostics: GoldenDiagnostics[] = [];

    for (const result of validationResults) {
      if (!result.match) {
        const diagnosis = await this.diagnoseSingleResult(result);
        if (diagnosis) {
          diagnostics.push(diagnosis);
        }
      }
    }

    return diagnostics;
  }

  private async diagnoseSingleResult(result: GoldenValidationResult): Promise<GoldenDiagnostics | null> {
    const category = result.category;
    const fieldName = result.field_name;
    const discrepancyType = result.discrepancy_type;

    // Diagnose based on discrepancy type
    switch (discrepancyType) {
      case 'MISSING_DATA':
        return this.diagnoseMissingData(category, fieldName, result);
      case 'EXTRA_DATA':
        return this.diagnoseExtraData(category, fieldName, result);
      case 'DATA_MISMATCH':
        return this.diagnoseDataMismatch(category, fieldName, result);
      case 'TECHNICAL_ERROR':
        return this.diagnoseTechnicalError(category, fieldName, result);
      case 'REGISTRY_CHANGE':
        return this.diagnoseRegistryChange(category, fieldName, result);
      default:
        return null;
    }
  }

  private diagnoseMissingData(category: string, fieldName: string, result: GoldenValidationResult): GoldenDiagnostics {
    const source = result.source;
    
    // Determine likely cause based on category and field
    if (category === 'identification') {
      return this.createDiagnostics(
        category,
        'API_ERROR',
        'HIGH',
        `Missing identification field ${fieldName} - likely API or connector error`,
        [fieldName],
        ['Retry request', 'Check connector status', 'Verify API endpoint'],
        true
      );
    }

    if (category === 'addresses' || category === 'contacts') {
      return this.createDiagnostics(
        category,
        'UNAVAILABLE_REGISTRY',
        'MEDIUM',
        `Missing ${category} field ${fieldName} - registry may be temporarily unavailable`,
        [fieldName],
        ['Retry request', 'Check registry availability', 'Update cache'],
        true
      );
    }

    if (category === 'business_relationships') {
      return this.createDiagnostics(
        category,
        'ENTITY_RESOLUTION_ERROR',
        'HIGH',
        `Missing business relationship ${fieldName} - entity resolution may have failed`,
        [fieldName],
        ['Rebuild entity card', 'Check entity resolution logic', 'Verify source data'],
        true
      );
    }

    if (category === 'court_cases' || category === 'enforcement_proceedings') {
      return this.createDiagnostics(
        category,
        'PARSER_ERROR',
        'MEDIUM',
        `Missing ${category} field ${fieldName} - parsing may have failed`,
        [fieldName],
        ['Check parser configuration', 'Verify registry structure', 'Rebuild mapping'],
        true
      );
    }

    if (category === 'sanctions' || category === 'pep_records') {
      return this.createDiagnostics(
        category,
        'UNAVAILABLE_REGISTRY',
        'LOW',
        `Missing ${category} field ${fieldName} - external list may be unavailable`,
        [fieldName],
        ['Check external list availability', 'Retry request'],
        true
      );
    }

    if (category === 'property') {
      return this.createDiagnostics(
        category,
        'NORMALIZATION_ERROR',
        'MEDIUM',
        `Missing property field ${fieldName} - normalization may have failed`,
        [fieldName],
        ['Check normalization logic', 'Verify source data format', 'Rebuild mapping'],
        true
      );
    }

    if (category === 'ui_interface') {
      return this.createDiagnostics(
        category,
        'UI_DISPLAY_ERROR',
        'HIGH',
        `Missing UI field ${fieldName} - frontend display error`,
        [fieldName],
        ['Check frontend rendering', 'Verify data binding', 'Repeat UI test'],
        true
      );
    }

    return this.createDiagnostics(
      category,
      'BACKEND_ERROR',
      'HIGH',
      `Missing field ${fieldName} - general backend error`,
      [fieldName],
      ['Check backend logs', 'Verify data flow', 'Retry request'],
      true
    );
  }

  private diagnoseExtraData(category: string, fieldName: string, result: GoldenValidationResult): GoldenDiagnostics {
    if (category === 'ui_interface') {
      return this.createDiagnostics(
        category,
        'UI_DISPLAY_ERROR',
        'MEDIUM',
        `Extra UI field ${fieldName} - frontend showing fields not in backend`,
        [fieldName],
        ['Check frontend rendering', 'Verify data binding', 'Remove extra fields'],
        true
      );
    }

    if (category === 'identification' || category === 'addresses' || category === 'contacts') {
      return this.createDiagnostics(
        category,
        'DEDUPLICATION_ERROR',
        'MEDIUM',
        `Extra field ${fieldName} - deduplication may have failed`,
        [fieldName],
        ['Check deduplication logic', 'Verify source data', 'Rebuild entity card'],
        true
      );
    }

    return this.createDiagnostics(
      category,
      'NORMALIZATION_ERROR',
      'LOW',
      `Extra field ${fieldName} - may be normalization artifact`,
      [fieldName],
        ['Check normalization logic', 'Verify mapping configuration'],
      true
    );
  }

  private diagnoseDataMismatch(category: string, fieldName: string, result: GoldenValidationResult): GoldenDiagnostics {
    const expected = result.expected;
    const actual = result.actual;

    // Check if it's a format difference (technical) vs value difference (registry change)
    if (this.isFormatDifference(expected, actual)) {
      return this.createDiagnostics(
        category,
        'NORMALIZATION_ERROR',
        'MEDIUM',
        `Format mismatch in ${fieldName} - normalization may have changed`,
        [fieldName],
        ['Check normalization logic', 'Verify format standards', 'Rebuild mapping'],
        true
      );
    }

    if (this.isRegistryChangeLikely(category, fieldName)) {
      return this.createDiagnostics(
        category,
        'REGISTRY_STRUCTURE_CHANGE',
        'LOW',
        `Value mismatch in ${fieldName} - possible registry data change`,
        [fieldName],
        ['Verify registry data', 'Check for official updates', 'Update golden dataset if confirmed'],
        false
      );
    }

    if (category === 'ui_interface') {
      return this.createDiagnostics(
        category,
        'UI_DISPLAY_ERROR',
        'HIGH',
        `UI value mismatch in ${fieldName} - frontend display error`,
        [fieldName],
        ['Check frontend rendering', 'Verify data binding', 'Repeat UI test'],
        true
      );
    }

    return this.createDiagnostics(
      category,
      'BACKEND_ERROR',
      'HIGH',
      `Value mismatch in ${fieldName} - backend processing error`,
      [fieldName],
      ['Check backend logs', 'Verify data transformation', 'Retry request'],
      true
    );
  }

  private diagnoseTechnicalError(category: string, fieldName: string, result: GoldenValidationResult): GoldenDiagnostics {
    const errorDescription = result.discrepancy_reason || 'Unknown technical error';

    if (errorDescription.includes('format') || errorDescription.includes('invalid')) {
      return this.createDiagnostics(
        category,
        'PARSER_ERROR',
        'HIGH',
        `Format error in ${fieldName}: ${errorDescription}`,
        [fieldName],
        ['Check parser configuration', 'Verify input format', 'Rebuild mapping'],
        true
      );
    }

    if (errorDescription.includes('timeout') || errorDescription.includes('network')) {
      return this.createDiagnostics(
        category,
        'API_ERROR',
        'HIGH',
        `Network error in ${fieldName}: ${errorDescription}`,
        [fieldName],
        ['Retry request', 'Check network connectivity', 'Verify API endpoint'],
        true
      );
    }

    if (errorDescription.includes('cache')) {
      return this.createDiagnostics(
        category,
        'CACHE_ERROR',
        'MEDIUM',
        `Cache error in ${fieldName}: ${errorDescription}`,
        [fieldName],
        ['Update cache', 'Clear cache', 'Retry request'],
        true
      );
    }

    return this.createDiagnostics(
      category,
      'BACKEND_ERROR',
      'HIGH',
      `Technical error in ${fieldName}: ${errorDescription}`,
      [fieldName],
      ['Check backend logs', 'Verify error handling', 'Retry request'],
      true
    );
  }

  private diagnoseRegistryChange(category: string, fieldName: string, result: GoldenValidationResult): GoldenDiagnostics {
    return this.createDiagnostics(
      category,
      'REGISTRY_STRUCTURE_CHANGE',
      'LOW',
      `Registry data change detected in ${fieldName}`,
      [fieldName],
      ['Verify registry data', 'Check for official updates', 'Update golden dataset if confirmed'],
      false
    );
  }

  private isFormatDifference(expected: any, actual: any): boolean {
    // Check if the difference is just format (e.g., date format, number precision)
    if (expected instanceof Date && actual instanceof Date) {
      return false; // Dates already normalized
    }

    if (typeof expected === 'string' && typeof actual === 'string') {
      // Check for case differences
      if (expected.toLowerCase() === actual.toLowerCase()) {
        return true;
      }

      // Check for whitespace differences
      if (expected.trim() === actual.trim()) {
        return true;
      }

      // Check for phone number format differences
      const expectedPhone = expected.replace(/[\s\-\(\)]/g, '');
      const actualPhone = actual.replace(/[\s\-\(\)]/g, '');
      if (expectedPhone === actualPhone && expectedPhone.length >= 10) {
        return true;
      }
    }

    if (typeof expected === 'number' && typeof actual === 'number') {
      // Check for precision differences
      return Math.abs(expected - actual) < 0.01;
    }

    return false;
  }

  private isRegistryChangeLikely(category: string, fieldName: string): boolean {
    // Certain fields are more likely to change due to registry updates
    const changeProneFields = [
      'court_case', 'enforcement_proceeding', 'sanction', 'pep_record',
      'debt_amount', 'status', 'effective_date'
    ];

    return changeProneFields.some(field => fieldName.includes(field));
  }

  async diagnoseSystemHealth(): Promise<GoldenDiagnostics[]> {
    const diagnostics: GoldenDiagnostics[] = [];

    // Check registry availability
    const registryStatus = await this.checkRegistryAvailability();
    if (!registryStatus.allAvailable) {
      diagnostics.push(this.createDiagnostics(
        'system',
        'UNAVAILABLE_REGISTRY',
        'HIGH',
        `Registries unavailable: ${registryStatus.unavailable.join(', ')}`,
        registryStatus.unavailable,
        ['Retry request', 'Check registry status', 'Update cache'],
        true
      ));
    }

    // Check connector health
    const connectorHealth = await this.checkConnectorHealth();
    if (!connectorHealth.allHealthy) {
      diagnostics.push(this.createDiagnostics(
        'system',
        'CONNECTOR_ERROR',
        'HIGH',
        `Connectors unhealthy: ${connectorHealth.unhealthy.join(', ')}`,
        connectorHealth.unhealthy,
        ['Check connector status', 'Restart connectors', 'Verify configuration'],
        true
      ));
    }

    // Check cache health
    const cacheHealth = await this.checkCacheHealth();
    if (!cacheHealth.healthy) {
      diagnostics.push(this.createDiagnostics(
        'system',
        'CACHE_ERROR',
        'MEDIUM',
        'Cache health check failed',
        ['cache'],
        ['Update cache', 'Clear cache', 'Check cache configuration'],
        true
      ));
    }

    return diagnostics;
  }

  private async checkRegistryAvailability(): Promise<{ allAvailable: boolean; unavailable: string[] }> {
    // Simulate registry availability check
    // In real implementation, this would check actual registry endpoints
    return {
      allAvailable: true,
      unavailable: []
    };
  }

  private async checkConnectorHealth(): Promise<{ allHealthy: boolean; unhealthy: string[] }> {
    // Simulate connector health check
    // In real implementation, this would check actual connector status
    return {
      allHealthy: true,
      unhealthy: []
    };
  }

  private async checkCacheHealth(): Promise<{ healthy: boolean }> {
    // Simulate cache health check
    // In real implementation, this would check actual cache status
    return {
      healthy: true
    };
  }
}
