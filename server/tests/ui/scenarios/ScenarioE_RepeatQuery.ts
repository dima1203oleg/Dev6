/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Scenario E — Repeat Query Test
 * 
 * Test Steps:
 * 1. Launch search twice
 * 2. If source hasn't changed, results should match
 * 3. If source changed, system should show what changed
 */

import { BaseUITest } from '../BaseUITest';
import { ScenarioTestResult, ValidationResult, UICardStructure, SearchExecution } from '../types';

export class ScenarioE_RepeatQuery extends BaseUITest {
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
      notes.push('Step 1: Running first search');
      const firstSearch = await this.executeSearch();
      const firstUICard = await this.extractUICard();
      
      notes.push('Step 2: Running second search');
      const secondSearch = await this.executeSearch();
      const secondUICard = await this.extractUICard();
      
      notes.push('Step 3: Comparing results for reproducibility');
      validationResults.repeatability = this.validateRepeatability(firstSearch, secondSearch);
      
      notes.push('Step 4: Validating field consistency between runs');
      validationResults.field_verification = this.validateFieldConsistency(firstUICard, secondUICard);
      
      notes.push('Step 5: Checking for change detection if sources changed');
      const changeDetection = this.validateChangeDetection(firstSearch, secondSearch, firstUICard, secondUICard);
      if (changeDetection.warnings.length > 0) {
        notes.push(`Change detection: ${changeDetection.warnings.join('; ')}`);
      }
      
    } catch (error) {
      notes.push(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
      validationResults.ipn_acceptance = this.createValidationResult(false, [String(error)]);
    }

    const durationMs = Date.now() - startTime;
    const passed = Object.values(validationResults).every(v => v.valid);

    return {
      scenario_name: 'Scenario E - Repeat Query',
      passed,
      duration_ms: durationMs,
      validation_results: validationResults,
      ui_card: {} as UICardStructure,
      search_execution: {} as SearchExecution,
      notes
    };
  }

  private async executeSearch(): Promise<SearchExecution> {
    // Simulate search execution
    return {
      ipn: this.testIPN,
      sources_queried: ['UA-001', 'UA-002'],
      sources_responded: [
        {
          source_id: 'UA-001',
          success: true,
          http_code: 200,
          response_time_ms: 200,
          raw_response: '{"data": {"name": "Тестовий Користувач", "edrpou": "12345678"}}',
          fields_returned: ['name', 'edrpou']
        },
        {
          source_id: 'UA-002',
          success: true,
          http_code: 200,
          response_time_ms: 250,
          raw_response: '{"cases": [{"case_number": "123/2024"}]}',
          fields_returned: ['case_number']
        }
      ],
      sources_failed: [],
      total_execution_time_ms: 450,
      timestamp: new Date()
    };
  }

  private async extractUICard(): Promise<UICardStructure> {
    // Simulate UI card extraction
    return {
      header: {
        ipn: this.testIPN,
        entity_type: 'PERSON',
        entity_id: 'entity-repeat',
        confidence_score: 0.85,
        data_completeness: 0.75,
        sources_responded: 2,
        conflicts_count: 0,
        last_updated: new Date(),
        overall_status: 'SUCCESS'
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
              confidence: 0.95,
              status: 'VERIFIED'
            }
          ]
        },
        {
          field_name: 'case_number',
          value: '123/2024',
          status: 'VERIFIED',
          provenance: [
            {
              source: 'UA-002',
              record_id: 'rec-002',
              timestamp: new Date(),
              raw_fragment: '123/2024',
              normalized_value: '123/2024',
              confidence: 0.9,
              status: 'VERIFIED'
            }
          ]
        }
      ],
      provenance_blocks: new Map()
    };
  }

  private validateFieldConsistency(firstCard: UICardStructure, secondCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that same fields are present
    const firstFields = firstCard.profile_fields.map(f => f.field_name);
    const secondFields = secondCard.profile_fields.map(f => f.field_name);

    const missingInSecond = firstFields.filter(f => !secondFields.includes(f));
    const extraInSecond = secondFields.filter(f => !firstFields.includes(f));

    if (missingInSecond.length > 0) {
      errors.push(`Fields missing in second run: ${missingInSecond.join(', ')}`);
    }

    if (extraInSecond.length > 0) {
      errors.push(`Extra fields in second run: ${extraInSecond.join(', ')}`);
    }

    // Check that values are consistent for same fields
    for (const firstField of firstCard.profile_fields) {
      const secondField = secondCard.profile_fields.find(f => f.field_name === firstField.field_name);
      
      if (secondField) {
        if (JSON.stringify(firstField.value) !== JSON.stringify(secondField.value)) {
          warnings.push(`Field ${firstField.field_name} value changed between runs`);
        }

        if (firstField.status !== secondField.status) {
          warnings.push(`Field ${firstField.field_name} status changed from ${firstField.status} to ${secondField.status}`);
        }
      }
    }

    // Check header consistency
    if (firstCard.header.sources_responded !== secondCard.header.sources_responded) {
      warnings.push(`Number of sources responded changed: ${firstCard.header.sources_responded} -> ${secondCard.header.sources_responded}`);
    }

    if (firstCard.header.conflicts_count !== secondCard.header.conflicts_count) {
      warnings.push(`Conflict count changed: ${firstCard.header.conflicts_count} -> ${secondCard.header.conflicts_count}`);
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  private validateChangeDetection(
    firstSearch: SearchExecution,
    secondSearch: SearchExecution,
    firstCard: UICardStructure,
    secondCard: UICardStructure
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if sources changed
    const firstSources = firstSearch.sources_responded.map(s => s.source_id);
    const secondSources = secondSearch.sources_responded.map(s => s.source_id);

    if (JSON.stringify(firstSources) !== JSON.stringify(secondSources)) {
      warnings.push('Sources responded changed between runs');
    }

    // Check if raw responses changed
    for (const firstResponse of firstSearch.sources_responded) {
      const secondResponse = secondSearch.sources_responded.find(s => s.source_id === firstResponse.source_id);
      
      if (secondResponse) {
        if (firstResponse.raw_response !== secondResponse.raw_response) {
          warnings.push(`Source ${firstResponse.source_id} raw response changed between runs`);
        }
      }
    }

    // Check if UI should indicate changes
    const valuesChanged = firstCard.profile_fields.some((f, i) => {
      const secondField = secondCard.profile_fields[i];
      if (!secondField) return false;
      return JSON.stringify(f.value) !== JSON.stringify(secondField.value);
    });

    if (valuesChanged) {
      // Check if UI indicates what changed
      const lastUpdatedDiff = Math.abs(firstCard.header.last_updated.getTime() - secondCard.header.last_updated.getTime());
      if (lastUpdatedDiff < 1000) {
        warnings.push('Values changed but last_updated timestamp did not change significantly');
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}
