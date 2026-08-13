/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Main UI Integration Test Orchestrator
 */

import { ScenarioA_DirectSearch } from './scenarios/ScenarioA_DirectSearch';
import { ScenarioB_PartialMatch } from './scenarios/ScenarioB_PartialMatch';
import { ScenarioC_ConflictDetection } from './scenarios/ScenarioC_ConflictDetection';
import { ScenarioD_UnavailableRegistry } from './scenarios/ScenarioD_UnavailableRegistry';
import { ScenarioE_RepeatQuery } from './scenarios/ScenarioE_RepeatQuery';
import { FieldStatusValidator } from './validators/FieldStatusValidator';
import { ProvenanceValidator } from './validators/ProvenanceValidator';
import { UICardStructureValidator } from './validators/UICardStructureValidator';
import { BaseUITest } from './BaseUITest';

import { ScenarioTestResult, UIIntegrationTestReport, UICardStructure } from './types';

export class UIIntegrationTestOrchestrator extends BaseUITest {
  constructor(testIPN: string = '3111724753', baseURL: string = 'http://localhost:3000') {
    super(testIPN, baseURL);
  }

  async runAllScenarios(): Promise<UIIntegrationTestReport> {
    const scenarios: ScenarioTestResult[] = [];
    const criticalFailures: string[] = [];

    // Run Scenario A - Direct Search
    console.log('Running Scenario A - Direct Search...');
    const scenarioA = new ScenarioA_DirectSearch(this.testIPN, this.baseURL);
    const resultA = await scenarioA.execute();
    scenarios.push(resultA);
    if (!resultA.passed) {
      criticalFailures.push(...resultA.validation_results.ipn_acceptance.errors);
    }

    // Run Scenario B - Partial Match
    console.log('Running Scenario B - Partial Match...');
    const scenarioB = new ScenarioB_PartialMatch(this.testIPN, this.baseURL);
    const resultB = await scenarioB.execute();
    scenarios.push(resultB);
    if (!resultB.passed) {
      criticalFailures.push(...resultB.validation_results.no_fabrication.errors);
    }

    // Run Scenario C - Conflict Detection
    console.log('Running Scenario C - Conflict Detection...');
    const scenarioC = new ScenarioC_ConflictDetection(this.testIPN, this.baseURL);
    const resultC = await scenarioC.execute();
    scenarios.push(resultC);
    if (!resultC.passed) {
      criticalFailures.push(...resultC.validation_results.conflict_visibility.errors);
    }

    // Run Scenario D - Unavailable Registry
    console.log('Running Scenario D - Unavailable Registry...');
    const scenarioD = new ScenarioD_UnavailableRegistry(this.testIPN, this.baseURL);
    const resultD = await scenarioD.execute();
    scenarios.push(resultD);
    if (!resultD.passed) {
      criticalFailures.push(...resultD.validation_results.no_fabrication.errors);
    }

    // Run Scenario E - Repeat Query
    console.log('Running Scenario E - Repeat Query...');
    const scenarioE = new ScenarioE_RepeatQuery(this.testIPN, this.baseURL);
    const resultE = await scenarioE.execute();
    scenarios.push(resultE);
    if (!resultE.passed) {
      criticalFailures.push(...resultE.validation_results.repeatability.errors);
    }

    // Generate summary
    const summary = {
      total_scenarios: scenarios.length,
      passed: scenarios.filter(s => s.passed).length,
      failed: scenarios.filter(s => !s.passed).length,
      overall_passed: scenarios.every(s => s.passed)
    };

    return {
      test_ipn: this.testIPN,
      timestamp: new Date(),
      scenarios,
      summary,
      critical_failures: criticalFailures
    };
  }

  async runFieldStatusValidation(uiCard: UICardStructure): Promise<ScenarioTestResult> {
    const fieldValidator = new FieldStatusValidator(this.testIPN, this.baseURL);
    const startTime = Date.now();
    const notes: string[] = [];

    const validationResults = {
      ipn_acceptance: fieldValidator.createValidationResult(true),
      source_routing: fieldValidator.createValidationResult(true),
      raw_response_storage: fieldValidator.createValidationResult(true),
      field_verification: await fieldValidator.validateAllFieldStatuses(uiCard),
      provenance_display: fieldValidator.createValidationResult(true),
      conflict_visibility: fieldValidator.createValidationResult(true),
      absence_honesty: fieldValidator.createValidationResult(true),
      no_fabrication: fieldValidator.createValidationResult(true),
      repeatability: fieldValidator.createValidationResult(true)
    };

    const durationMs = Date.now() - startTime;
    const passed = Object.values(validationResults).every(v => v.valid);

    return {
      scenario_name: 'Field Status Validation',
      passed,
      duration_ms: durationMs,
      validation_results: validationResults,
      ui_card: uiCard,
      search_execution: {} as any,
      notes
    };
  }

  async runProvenanceValidation(uiCard: UICardStructure): Promise<ScenarioTestResult> {
    const provenanceValidator = new ProvenanceValidator(this.testIPN, this.baseURL);
    const startTime = Date.now();
    const notes: string[] = [];

    const validationResults = {
      ipn_acceptance: provenanceValidator.createValidationResult(true),
      source_routing: provenanceValidator.createValidationResult(true),
      raw_response_storage: provenanceValidator.createValidationResult(true),
      field_verification: provenanceValidator.createValidationResult(true),
      provenance_display: await provenanceValidator.validateAllProvenance(uiCard),
      conflict_visibility: provenanceValidator.createValidationResult(true),
      absence_honesty: await provenanceValidator.validateProvenanceCompleteness(uiCard),
      no_fabrication: await provenanceValidator.validateProvenanceConfidenceScores(uiCard),
      repeatability: provenanceValidator.createValidationResult(true)
    };

    const durationMs = Date.now() - startTime;
    const passed = Object.values(validationResults).every(v => v.valid);

    return {
      scenario_name: 'Provenance Validation',
      passed,
      duration_ms: durationMs,
      validation_results: validationResults,
      ui_card: uiCard,
      search_execution: {} as any,
      notes
    };
  }

  async runStructureValidation(uiCard: UICardStructure): Promise<ScenarioTestResult> {
    const structureValidator = new UICardStructureValidator(this.testIPN, this.baseURL);
    const startTime = Date.now();
    const notes: string[] = [];

    const headerValidation = await structureValidator.validateHeaderStructure(uiCard.header);
    const fieldsValidation = await structureValidator.validateProfileFieldsStructure(uiCard.profile_fields);
    const consistencyValidation = structureValidator.validateHeaderFieldConsistency(uiCard);
    const statusValidation = structureValidator.validateOverallStatusLogic(uiCard);
    const visualValidation = structureValidator.validateVisualElements(uiCard);
    const timestampValidation = structureValidator.validateTimestampConsistency(uiCard);

    const validationResults = {
      ipn_acceptance: structureValidator.createValidationResult(true),
      source_routing: structureValidator.createValidationResult(true),
      raw_response_storage: structureValidator.createValidationResult(true),
      field_verification: fieldsValidation,
      provenance_display: headerValidation,
      conflict_visibility: statusValidation,
      absence_honesty: consistencyValidation,
      no_fabrication: visualValidation,
      repeatability: timestampValidation
    };

    const durationMs = Date.now() - startTime;
    const passed = Object.values(validationResults).every(v => v.valid);

    return {
      scenario_name: 'UI Card Structure Validation',
      passed,
      duration_ms: durationMs,
      validation_results: validationResults,
      ui_card: uiCard,
      search_execution: {} as any,
      notes
    };
  }

  async runCompleteValidation(uiCard: UICardStructure): Promise<UIIntegrationTestReport> {
    const scenarios: ScenarioTestResult[] = [];
    const criticalFailures: string[] = [];

    // Run field status validation
    const fieldResult = await this.runFieldStatusValidation(uiCard);
    scenarios.push(fieldResult);
    if (!fieldResult.passed) {
      criticalFailures.push(...fieldResult.validation_results.field_verification.errors);
    }

    // Run provenance validation
    const provenanceResult = await this.runProvenanceValidation(uiCard);
    scenarios.push(provenanceResult);
    if (!provenanceResult.passed) {
      criticalFailures.push(...provenanceResult.validation_results.provenance_display.errors);
    }

    // Run structure validation
    const structureResult = await this.runStructureValidation(uiCard);
    scenarios.push(structureResult);
    if (!structureResult.passed) {
      criticalFailures.push(...structureResult.validation_results.field_verification.errors);
    }

    const summary = {
      total_scenarios: scenarios.length,
      passed: scenarios.filter(s => s.passed).length,
      failed: scenarios.filter(s => !s.passed).length,
      overall_passed: scenarios.every(s => s.passed)
    };

    return {
      test_ipn: this.testIPN,
      timestamp: new Date(),
      scenarios,
      summary,
      critical_failures: criticalFailures
    };
  }
}
