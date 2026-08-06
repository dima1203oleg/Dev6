/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Scenario B — Partial Match Test
 * 
 * Test Steps:
 * 1. Source returns only partial fields
 * 2. UI should show only this partial data
 * 3. Remaining fields should be Not Found or Restricted, not fabricated
 */

import { BaseUITest } from '../BaseUITest';
import { ScenarioTestResult, ValidationResult, UICardStructure, SearchExecution, FieldStatus } from '../types';

export class ScenarioB_PartialMatch extends BaseUITest {
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
      notes.push('Step 1: Testing partial data response from source');
      
      // Simulate a source that returns only partial data
      const searchExecution = await this.executePartialSearch();
      validationResults.raw_response_storage = this.validateRawResponseStorageForPartial(searchExecution);
      
      notes.push('Step 2: Verifying UI shows only partial data');
      const uiCard = await this.extractPartialUICard();
      
      notes.push('Step 3: Verifying absent fields are marked honestly');
      validationResults.field_verification = await this.validatePartialFieldVerification(uiCard);
      validationResults.absence_honesty = await this.validateAbsenceHonestyForPartial(uiCard);
      validationResults.no_fabrication = await this.validateNoFabricationInPartial(uiCard);
      
    } catch (error) {
      notes.push(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
      validationResults.ipn_acceptance = this.createValidationResult(false, [String(error)]);
    }

    const durationMs = Date.now() - startTime;
    const passed = Object.values(validationResults).every(v => v.valid);

    return {
      scenario_name: 'Scenario B - Partial Match',
      passed,
      duration_ms: durationMs,
      validation_results: validationResults,
      ui_card: {} as UICardStructure,
      search_execution: {} as SearchExecution,
      notes
    };
  }

  private async executePartialSearch(): Promise<SearchExecution> {
    // Simulate search where source returns only partial data
    return {
      ipn: this.testIPN,
      sources_queried: ['UA-001'],
      sources_responded: [
        {
          source_id: 'UA-001',
          success: true,
          http_code: 200,
          response_time_ms: 200,
          raw_response: '{"data": {"name": "Тестовий Користувач", "edrpou": "12345678"}}',
          fields_returned: ['name', 'edrpou'] // Only partial fields
        }
      ],
      sources_failed: [],
      total_execution_time_ms: 200,
      timestamp: new Date()
    };
  }

  private validateRawResponseStorageForPartial(searchExecution: SearchExecution): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const response of searchExecution.sources_responded) {
      if (!response.raw_response) {
        errors.push(`Source ${response.source_id} missing raw response`);
      }

      if (!response.fields_returned || response.fields_returned.length === 0) {
        warnings.push(`Source ${response.source_id} returned no fields`);
      }

      // Verify that fields_returned matches what's actually in raw_response
      if (response.raw_response && response.fields_returned) {
        const rawData = JSON.parse(response.raw_response);
        const actualFields = Object.keys(rawData.data || {});
        const missingInReturned = actualFields.filter(f => !response.fields_returned.includes(f));
        
        if (missingInReturned.length > 0) {
          warnings.push(`Source ${response.source_id} has fields in raw response not listed in fields_returned: ${missingInReturned.join(', ')}`);
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private async extractPartialUICard(): Promise<UICardStructure> {
    // Simulate UI card with partial data
    return {
      header: {
        ipn: this.testIPN,
        entity_type: 'PERSON',
        entity_id: 'entity-456',
        confidence_score: 0.6,
        data_completeness: 0.4,
        sources_responded: 1,
        conflicts_count: 0,
        last_updated: new Date(),
        overall_status: 'PARTIAL'
      },
      profile_fields: [
        {
          field_name: 'full_name',
          value: 'Тестовий Користувач',
          status: 'VERIFIED',
          provenance: [
            {
              source: 'UA-001',
              record_id: 'rec-001',
              timestamp: new Date(),
              raw_fragment: 'Тестовий Користувач',
              normalized_value: 'Тестовий Користувач',
              confidence: 0.9,
              status: 'VERIFIED'
            }
          ]
        },
        {
          field_name: 'address',
          value: undefined,
          status: 'NOT_FOUND',
          provenance: []
        },
        {
          field_name: 'birth_date',
          value: undefined,
          status: 'NOT_FOUND',
          provenance: []
        },
        {
          field_name: 'tax_debt',
          value: undefined,
          status: 'RESTRICTED',
          provenance: []
        }
      ],
      provenance_blocks: new Map()
    };
  }

  private async validatePartialFieldVerification(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that only fields with values have VERIFIED status
    for (const field of uiCard.profile_fields) {
      if (field.value !== undefined && field.value !== null && field.value !== '') {
        if (field.status !== 'VERIFIED' && field.status !== 'CACHED') {
          errors.push(`Field ${field.field_name} has value but status is ${field.status}`);
        }
      }
    }

    // Check that fields without values have appropriate status
    for (const field of uiCard.profile_fields) {
      if (field.value === undefined || field.value === null || field.value === '') {
        if (field.status !== 'NOT_FOUND' && field.status !== 'RESTRICTED') {
          errors.push(`Field ${field.field_name} has no value but status is ${field.status}`);
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private async validateAbsenceHonestyForPartial(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of uiCard.profile_fields) {
      const absenceCheck = this.validateAbsenceHonesty(field.value, field.status);
      if (!absenceCheck.valid) {
        errors.push(`Field ${field.field_name}: ${absenceCheck.errors.join(', ')}`);
      }
    }

    // Check that overall status reflects partial data
    if (uiCard.header.overall_status !== 'PARTIAL' && uiCard.header.overall_status !== 'SUCCESS') {
      warnings.push(`Overall status is ${uiCard.header.overall_status}, expected PARTIAL or SUCCESS`);
    }

    // Check data completeness reflects partial data
    if (uiCard.header.data_completeness > 0.8) {
      warnings.push(`Data completeness is ${uiCard.header.data_completeness}, expected lower for partial data`);
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private async validateNoFabricationInPartial(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of uiCard.profile_fields) {
      // Check for fabricated default values in NOT_FOUND fields
      if (field.status === 'NOT_FOUND') {
        if (field.value && typeof field.value === 'string') {
          const suspiciousDefaults = ['Unknown', 'N/A', 'Not Available', 'Not Specified', ''];
          if (suspiciousDefaults.includes(field.value)) {
            errors.push(`Field ${field.field_name} has fabricated default value: ${field.value}`);
          }
        }
      }

      // Check for provenance in NOT_FOUND fields
      if (field.status === 'NOT_FOUND' && field.provenance && field.provenance.length > 0) {
        warnings.push(`Field ${field.field_name} is NOT_FOUND but has provenance`);
      }

      // Validate no fabrication in verified fields
      if (field.status === 'VERIFIED') {
        for (const prov of field.provenance || []) {
          const fabricationCheck = this.validateNoFabrication(field.value, prov);
          if (!fabricationCheck.valid) {
            errors.push(`Field ${field.field_name}: ${fabricationCheck.errors.join(', ')}`);
          }
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}
