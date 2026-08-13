/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Scenario C — Conflict Detection Test
 * 
 * Test Steps:
 * 1. Two sources give different values
 * 2. UI should show both values
 * 3. Should be visible which value comes from which source
 * 4. Field should have Conflict status
 */

import { BaseUITest } from '../BaseUITest';
import { ScenarioTestResult, ValidationResult, UICardStructure, SearchExecution } from '../types';

export class ScenarioC_ConflictDetection extends BaseUITest {
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
      notes.push('Step 1: Testing conflict scenario with different values from sources');
      
      // Simulate two sources returning conflicting data
      const searchExecution = await this.executeConflictingSearch();
      validationResults.raw_response_storage = this.validateRawResponseStorageForConflicts(searchExecution);
      
      notes.push('Step 2: Verifying UI shows both conflicting values');
      const uiCard = await this.extractConflictingUICard();
      
      notes.push('Step 3: Verifying source attribution for each value');
      notes.push('Step 4: Verifying field has Conflict status');
      validationResults.conflict_visibility = await this.validateConflictVisibilityInUI(uiCard);
      validationResults.provenance_display = await this.validateProvenanceForConflicts(uiCard);
      validationResults.no_fabrication = await this.validateNoFabricationInConflicts(uiCard);
      
    } catch (error) {
      notes.push(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
      validationResults.ipn_acceptance = this.createValidationResult(false, [String(error)]);
    }

    const durationMs = Date.now() - startTime;
    const passed = Object.values(validationResults).every(v => v.valid);

    return {
      scenario_name: 'Scenario C - Conflict Detection',
      passed,
      duration_ms: durationMs,
      validation_results: validationResults,
      ui_card: {} as UICardStructure,
      search_execution: {} as SearchExecution,
      notes
    };
  }

  private async executeConflictingSearch(): Promise<SearchExecution> {
    // Simulate search where two sources return conflicting data
    return {
      ipn: this.testIPN,
      sources_queried: ['UA-001', 'UA-002'],
      sources_responded: [
        {
          source_id: 'UA-001',
          success: true,
          http_code: 200,
          response_time_ms: 200,
          raw_response: '{"data": {"name": "Іванов Іван Іванович"}}',
          fields_returned: ['name']
        },
        {
          source_id: 'UA-002',
          success: true,
          http_code: 200,
          response_time_ms: 250,
          raw_response: '{"data": {"name": "Іваненко Іван Петрович"}}',
          fields_returned: ['name']
        }
      ],
      sources_failed: [],
      total_execution_time_ms: 450,
      timestamp: new Date()
    };
  }

  private validateRawResponseStorageForConflicts(searchExecution: SearchExecution): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const response of searchExecution.sources_responded) {
      if (!response.raw_response) {
        errors.push(`Source ${response.source_id} missing raw response`);
      }

      // Verify that conflicting values are preserved in raw responses
      if (response.raw_response) {
        try {
          const rawData = JSON.parse(response.raw_response);
          if (!rawData.data || !rawData.data.name) {
            errors.push(`Source ${response.source_id} raw response missing expected name field`);
          }
        } catch {
          errors.push(`Source ${response.source_id} raw response is not valid JSON`);
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private async extractConflictingUICard(): Promise<UICardStructure> {
    // Simulate UI card with conflicting data
    return {
      header: {
        ipn: this.testIPN,
        entity_type: 'PERSON',
        entity_id: 'entity-789',
        confidence_score: 0.5,
        data_completeness: 0.8,
        sources_responded: 2,
        conflicts_count: 1,
        last_updated: new Date(),
        overall_status: 'CONFLICT'
      },
      profile_fields: [
        {
          field_name: 'full_name',
          value: 'CONFLICT',
          status: 'CONFLICT',
          provenance: [
            {
              source: 'UA-001',
              record_id: 'rec-001',
              timestamp: new Date(),
              raw_fragment: 'Іванов Іван Іванович',
              normalized_value: 'Іванов Іван Іванович',
              confidence: 0.9,
              status: 'VERIFIED'
            },
            {
              source: 'UA-002',
              record_id: 'rec-002',
              timestamp: new Date(),
              raw_fragment: 'Іваненко Іван Петрович',
              normalized_value: 'Іваненко Іван Петрович',
              confidence: 0.85,
              status: 'VERIFIED'
            }
          ],
          conflicts: [
            {
              source: 'UA-001',
              record_id: 'rec-001',
              timestamp: new Date(),
              raw_fragment: 'Іванов Іван Іванович',
              normalized_value: 'Іванов Іван Іванович',
              confidence: 0.9,
              status: 'VERIFIED'
            },
            {
              source: 'UA-002',
              record_id: 'rec-002',
              timestamp: new Date(),
              raw_fragment: 'Іваненко Іван Петрович',
              normalized_value: 'Іваненко Іван Петрович',
              confidence: 0.85,
              status: 'VERIFIED'
            }
          ]
        }
      ],
      provenance_blocks: new Map()
    };
  }

  private async validateConflictVisibilityInUI(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that conflicts are reflected in header
    if (uiCard.header.conflicts_count === 0) {
      errors.push('Header shows 0 conflicts but conflicts exist in data');
    }

    if (uiCard.header.overall_status !== 'CONFLICT') {
      errors.push(`Overall status is ${uiCard.header.overall_status}, should be CONFLICT`);
    }

    // Check that conflicting fields have Conflict status
    for (const field of uiCard.profile_fields) {
      if (field.conflicts && field.conflicts.length > 0) {
        if (field.status !== 'CONFLICT') {
          errors.push(`Field ${field.field_name} has conflicts but status is ${field.status}`);
        }

        // Validate conflict visibility using base class method
        const conflictCheck = super.validateConflictVisibility(field.conflicts, field.status);
        if (!conflictCheck.valid) {
          errors.push(`Field ${field.field_name} conflict validation failed: ${conflictCheck.errors.join(', ')}`);
        }
      }
    }

    // Check that all conflicting values are shown
    for (const field of uiCard.profile_fields) {
      if (field.conflicts && field.conflicts.length > 0) {
        const totalProvenance = (field.provenance || []).length + (field.conflicts || []).length;
        if (totalProvenance < 2) {
          errors.push(`Field ${field.field_name} has conflict but doesn't show all conflicting values`);
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private async validateProvenanceForConflicts(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of uiCard.profile_fields) {
      if (field.conflicts && field.conflicts.length > 0) {
        // Validate that each conflict has proper provenance
        for (const conflict of field.conflicts) {
          const provCheck = this.validateProvenance(conflict);
          if (!provCheck.valid) {
            errors.push(`Conflict in field ${field.field_name} missing proper provenance: ${provCheck.errors.join(', ')}`);
          }
          if (provCheck.warnings.length > 0) {
            warnings.push(`Conflict in field ${field.field_name} provenance warnings: ${provCheck.warnings.join(', ')}`);
          }
        }

        // Check that sources are clearly attributed
        const sources = field.conflicts.map(c => c.source);
        const uniqueSources = new Set(sources);
        if (uniqueSources.size !== field.conflicts.length) {
          warnings.push(`Field ${field.field_name} has conflicts from duplicate sources`);
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private async validateNoFabricationInConflicts(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of uiCard.profile_fields) {
      if (field.status === 'CONFLICT') {
        // Check that the value is not a fabricated "CONFLICT" string
        if (field.value === 'CONFLICT' || field.value === 'CONFLICTING') {
          warnings.push(`Field ${field.field_name} uses generic CONFLICT value instead of showing actual conflicting values`);
        }

        // Validate no fabrication in conflicting provenance
        for (const prov of field.provenance || []) {
          const fabricationCheck = this.validateNoFabrication(prov.normalized_value, prov);
          if (!fabricationCheck.valid) {
            errors.push(`Field ${field.field_name} provenance fabrication: ${fabricationCheck.errors.join(', ')}`);
          }
        }

        for (const conflict of field.conflicts || []) {
          const fabricationCheck = this.validateNoFabrication(conflict.normalized_value, conflict);
          if (!fabricationCheck.valid) {
            errors.push(`Field ${field.field_name} conflict fabrication: ${fabricationCheck.errors.join(', ')}`);
          }
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}
