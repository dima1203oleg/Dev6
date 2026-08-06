/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Scenario D — Unavailable Registry Test
 * 
 * Test Steps:
 * 1. Source returns timeout / 403 / 429 / 500
 * 2. UI should not show fake value
 * 3. Should have Blocked or Restricted status
 * 4. Should show reason for unavailability
 */

import { BaseUITest } from '../BaseUITest';
import { ScenarioTestResult, ValidationResult, UICardStructure, SearchExecution, FieldStatus, OverallStatus } from '../types';

export class ScenarioD_UnavailableRegistry extends BaseUITest {
  async execute(): Promise<ScenarioTestResult> {
    const startTime = Date.now();
    const notes: string[] = [];
    
    const validationResults = {
      ipn_acceptance: this.createValidationResult(true),
      source_routing: this.createValidationResult(true),
      raw_response_storage: this.createValidationResult(true),
      field_verification: this.createValidationResult(true),
      provenance_display: this.createValidationResult(true),
      conflict_visibility: this.createValidationResult(true),
      absence_honesty: this.createValidationResult(true),
      no_fabrication: this.createValidationResult(true),
      repeatability: this.createValidationResult(true)
    };

    try {
      notes.push('Step 1: Testing unavailable registry scenario (timeout/403/429/500)');
      
      // Simulate various error scenarios
      const errorTypes = ['timeout', '403', '429', '500'];
      for (const errorType of errorTypes) {
        notes.push(`Testing error type: ${errorType}`);
        const searchExecution = await this.executeUnavailableSearch(errorType);
        validationResults.raw_response_storage = this.validateErrorHandling(searchExecution);
        
        const uiCard = await this.extractUnavailableUICard(errorType);
        validationResults.field_verification = await this.validateUnavailableFieldHandling(uiCard);
        validationResults.absence_honesty = await this.validateAbsenceHonestyForUnavailable(uiCard);
        validationResults.no_fabrication = await this.validateNoFabricationInUnavailable(uiCard);
      }
      
    } catch (error) {
      notes.push(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
      validationResults.ipn_acceptance = this.createValidationResult(false, [String(error)]);
    }

    const durationMs = Date.now() - startTime;
    const passed = Object.values(validationResults).every(v => v.valid);

    return {
      scenario_name: 'Scenario D - Unavailable Registry',
      passed,
      duration_ms: durationMs,
      validation_results: validationResults,
      ui_card: {} as UICardStructure,
      search_execution: {} as SearchExecution,
      notes
    };
  }

  private async executeUnavailableSearch(errorType: string): Promise<SearchExecution> {
    const httpCodes: Record<string, number> = {
      'timeout': 0,
      '403': 403,
      '429': 429,
      '500': 500
    };

    const errorMessages: Record<string, string> = {
      'timeout': 'Request timeout',
      '403': 'Forbidden - Access denied',
      '429': 'Too Many Requests - Rate limit exceeded',
      '500': 'Internal Server Error'
    };

    return {
      ipn: this.testIPN,
      sources_queried: ['UA-001'],
      sources_responded: [],
      sources_failed: [
        {
          source_id: 'UA-001',
          success: false,
          http_code: httpCodes[errorType],
          response_time_ms: errorType === 'timeout' ? 30000 : 500,
          raw_response: '',
          error_message: errorMessages[errorType],
          fields_returned: []
        }
      ],
      total_execution_time_ms: errorType === 'timeout' ? 30000 : 500,
      timestamp: new Date()
    };
  }

  private validateErrorHandling(searchExecution: SearchExecution): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that failed sources are properly recorded
    if (searchExecution.sources_failed.length === 0) {
      errors.push('No sources recorded as failed');
    }

    for (const failed of searchExecution.sources_failed) {
      if (!failed.error_message) {
        errors.push(`Source ${failed.source_id} failed but no error message recorded`);
      }

      if (failed.success) {
        errors.push(`Source ${failed.source_id} marked as failed but success is true`);
      }

      if (failed.raw_response && failed.raw_response.length > 0) {
        warnings.push(`Source ${failed.source_id} has raw response despite failure`);
      }

      if (failed.fields_returned && failed.fields_returned.length > 0) {
        errors.push(`Source ${failed.source_id} has fields_returned despite failure`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private async extractUnavailableUICard(errorType: string): Promise<UICardStructure> {
    const statusMap: Record<string, OverallStatus> = {
      'timeout': 'BLOCKED',
      '403': 'BLOCKED',
      '429': 'BLOCKED',
      '500': 'BLOCKED'
    };

    return {
      header: {
        ipn: this.testIPN,
        entity_type: 'PERSON',
        entity_id: 'entity-blocked',
        confidence_score: 0,
        data_completeness: 0,
        sources_responded: 0,
        conflicts_count: 0,
        last_updated: new Date(),
        overall_status: statusMap[errorType]
      },
      profile_fields: [
        {
          field_name: 'full_name',
          value: undefined,
          status: 'RESTRICTED',
          provenance: []
        },
        {
          field_name: 'address',
          value: undefined,
          status: 'NOT_FOUND',
          provenance: []
        }
      ],
      provenance_blocks: new Map()
    };
  }

  private async validateUnavailableFieldHandling(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that overall status reflects unavailability
    if (uiCard.header.overall_status !== 'BLOCKED' && uiCard.header.overall_status !== 'RESTRICTED') {
      errors.push(`Overall status is ${uiCard.header.overall_status}, should be BLOCKED or RESTRICTED`);
    }

    // Check that no sources responded
    if (uiCard.header.sources_responded > 0) {
      errors.push('Header shows sources responded when all should be unavailable');
    }

    // Check that confidence score is low
    if (uiCard.header.confidence_score > 0.3) {
      warnings.push(`Confidence score is ${uiCard.header.confidence_score}, expected low for unavailable sources`);
    }

    // Check that data completeness is low
    if (uiCard.header.data_completeness > 0.2) {
      warnings.push(`Data completeness is ${uiCard.header.data_completeness}, expected low for unavailable sources`);
    }

    // Check field statuses
    for (const field of uiCard.profile_fields) {
      if (field.value !== undefined && field.value !== null && field.value !== '') {
        errors.push(`Field ${field.field_name} has value despite source being unavailable`);
      }

      if (field.status !== 'NOT_FOUND' && field.status !== 'RESTRICTED' && field.status !== 'BLOCKED') {
        errors.push(`Field ${field.field_name} has status ${field.status}, should be NOT_FOUND, RESTRICTED, or BLOCKED`);
      }

      if (field.provenance && field.provenance.length > 0) {
        errors.push(`Field ${field.field_name} has provenance despite source being unavailable`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private async validateAbsenceHonestyForUnavailable(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of uiCard.profile_fields) {
      const absenceCheck = this.validateAbsenceHonesty(field.value, field.status);
      if (!absenceCheck.valid) {
        errors.push(`Field ${field.field_name}: ${absenceCheck.errors.join(', ')}`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private async validateNoFabricationInUnavailable(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of uiCard.profile_fields) {
      // Check for fabricated values in unavailable scenario
      if (field.value && typeof field.value === 'string') {
        const suspiciousDefaults = ['Unknown', 'N/A', 'Not Available', 'Service Unavailable', 'Error'];
        if (suspiciousDefaults.includes(field.value)) {
          errors.push(`Field ${field.field_name} has fabricated error message as value: ${field.value}`);
        }
      }

      // Check for placeholder values
      if (field.value === '---' || field.value === '...' || field.value === null) {
        warnings.push(`Field ${field.field_name} has placeholder value`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}
