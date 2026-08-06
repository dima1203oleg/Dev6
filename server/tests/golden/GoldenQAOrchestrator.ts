/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Golden QA Orchestrator
 */

import { BaseGoldenValidator } from './BaseGoldenValidator';
import { GoldenDataset, GoldenValidationReport, ValidationResultSummary } from './types';

import { IdentificationValidator } from './validators/IdentificationValidator';
import { AddressValidator } from './validators/AddressValidator';
import { ContactValidator } from './validators/ContactValidator';
import { BusinessRelationshipValidator } from './validators/BusinessRelationshipValidator';
import { CourtCaseValidator } from './validators/CourtCaseValidator';
import { EnforcementProceedingValidator } from './validators/EnforcementProceedingValidator';
import { SanctionsAndPEPValidator } from './validators/SanctionsAndPEPValidator';
import { PropertyValidator } from './validators/PropertyValidator';
import { UIWebInterfaceValidator } from './validators/UIWebInterfaceValidator';

import { AutomaticDiagnostics } from './diagnostics/AutomaticDiagnostics';
import { SelfHealing } from './diagnostics/SelfHealing';
import { RegistryChangeHandler } from './diagnostics/RegistryChangeHandler';

export class GoldenQAOrchestrator extends BaseGoldenValidator {
  private identificationValidator: IdentificationValidator;
  private addressValidator: AddressValidator;
  private contactValidator: ContactValidator;
  private businessRelationshipValidator: BusinessRelationshipValidator;
  private courtCaseValidator: CourtCaseValidator;
  private enforcementProceedingValidator: EnforcementProceedingValidator;
  private sanctionsAndPEPValidator: SanctionsAndPEPValidator;
  private propertyValidator: PropertyValidator;
  private uiWebInterfaceValidator: UIWebInterfaceValidator;

  private automaticDiagnostics: AutomaticDiagnostics;
  private selfHealing: SelfHealing;
  private registryChangeHandler: RegistryChangeHandler;

  constructor(goldenDataset: GoldenDataset, baseURL: string = 'http://localhost:3000') {
    super(goldenDataset, baseURL);

    this.identificationValidator = new IdentificationValidator(goldenDataset, baseURL);
    this.addressValidator = new AddressValidator(goldenDataset, baseURL);
    this.contactValidator = new ContactValidator(goldenDataset, baseURL);
    this.businessRelationshipValidator = new BusinessRelationshipValidator(goldenDataset, baseURL);
    this.courtCaseValidator = new CourtCaseValidator(goldenDataset, baseURL);
    this.enforcementProceedingValidator = new EnforcementProceedingValidator(goldenDataset, baseURL);
    this.sanctionsAndPEPValidator = new SanctionsAndPEPValidator(goldenDataset, baseURL);
    this.propertyValidator = new PropertyValidator(goldenDataset, baseURL);
    this.uiWebInterfaceValidator = new UIWebInterfaceValidator(goldenDataset, baseURL);

    this.automaticDiagnostics = new AutomaticDiagnostics(goldenDataset, baseURL);
    this.selfHealing = new SelfHealing(goldenDataset, baseURL);
    this.registryChangeHandler = new RegistryChangeHandler(goldenDataset, baseURL);
  }

  async runGoldenValidation(backendData: any, uiData: any): Promise<GoldenValidationReport> {
    console.log(`[Golden QA] Starting validation for IPN ${this.testIPN}`);
    const startTime = Date.now();

    const allValidationResults: any[] = [];
    const criticalFailures: string[] = [];

    // Run all validators
    console.log('[Golden QA] Running identification validation...');
    const identificationResults = await this.identificationValidator.validateIdentification(backendData.identification);
    allValidationResults.push(...identificationResults);

    console.log('[Golden QA] Running address validation...');
    const addressResults = await this.addressValidator.validateAddresses(backendData.addresses);
    allValidationResults.push(...addressResults);

    console.log('[Golden QA] Running contact validation...');
    const contactResults = await this.contactValidator.validateContacts(backendData.contacts);
    allValidationResults.push(...contactResults);

    console.log('[Golden QA] Running business relationship validation...');
    const businessResults = await this.businessRelationshipValidator.validateBusinessRelationships(backendData.business_relationships);
    allValidationResults.push(...businessResults);

    console.log('[Golden QA] Running court case validation...');
    const courtResults = await this.courtCaseValidator.validateCourtCases(backendData.court_cases);
    allValidationResults.push(...courtResults);

    console.log('[Golden QA] Running enforcement proceeding validation...');
    const enforcementResults = await this.enforcementProceedingValidator.validateEnforcementProceedings(backendData.enforcement_proceedings);
    allValidationResults.push(...enforcementResults);

    console.log('[Golden QA] Running sanctions and PEP validation...');
    const sanctionsResults = await this.sanctionsAndPEPValidator.validateSanctions(backendData.sanctions);
    allValidationResults.push(...sanctionsResults);
    const pepResults = await this.sanctionsAndPEPValidator.validatePEPRecords(backendData.pep_records);
    allValidationResults.push(...pepResults);

    console.log('[Golden QA] Running property validation...');
    const propertyResults = await this.propertyValidator.validateProperty(backendData.property);
    allValidationResults.push(...propertyResults);

    console.log('[Golden QA] Running UI web interface validation...');
    const uiResults = await this.uiWebInterfaceValidator.validateWebInterface(backendData, uiData);
    allValidationResults.push(...uiResults);

    // Check for critical failures
    const criticalErrors = allValidationResults.filter(r => !r.match && r.discrepancy_type === 'MISSING_DATA');
    for (const error of criticalErrors) {
      if (error.field_name === 'ipn' || error.field_name === 'full_name') {
        criticalFailures.push(`Critical field missing: ${error.field_name}`);
      }
    }

    // Run automatic diagnostics
    console.log('[Golden QA] Running automatic diagnostics...');
    const diagnostics = await this.automaticDiagnostics.diagnoseValidationResults(allValidationResults);

    // Detect registry changes
    console.log('[Golden QA] Detecting registry changes...');
    const registryChanges = await this.registryChangeHandler.detectRegistryChanges(allValidationResults);

    // Attempt self-healing if enabled
    const selfHealingActions: any[] = [];
    if (diagnostics.length > 0) {
      console.log('[Golden QA] Attempting self-healing...');
      const healingResult = await this.selfHealing.executeFullSelfHealingCycle(diagnostics);
      selfHealingActions.push(...healingResult.actions);
    }

    // Build category summaries
    const categoryResults = {
      identification: this.buildCategorySummary(identificationResults),
      addresses: this.buildCategorySummary(addressResults),
      contacts: this.buildCategorySummary(contactResults),
      business_relationships: this.buildCategorySummary(businessResults),
      court_cases: this.buildCategorySummary(courtResults),
      enforcement_proceedings: this.buildCategorySummary(enforcementResults),
      sanctions: this.buildCategorySummary(sanctionsResults),
      pep_records: this.buildCategorySummary(pepResults),
      property: this.buildCategorySummary(propertyResults)
    };

    const uiSummary = this.buildCategorySummary(uiResults);

    // Calculate overall summary
    const summary = {
      total_fields_checked: allValidationResults.length,
      fields_matched: allValidationResults.filter(r => r.match).length,
      fields_mismatched: allValidationResults.filter(r => !r.match && r.discrepancy_type === 'DATA_MISMATCH').length,
      fields_missing: allValidationResults.filter(r => !r.match && r.discrepancy_type === 'MISSING_DATA').length,
      fields_extra: allValidationResults.filter(r => !r.match && r.discrepancy_type === 'EXTRA_DATA').length,
      technical_errors: allValidationResults.filter(r => !r.match && r.discrepancy_type === 'TECHNICAL_ERROR').length,
      registry_changes: registryChanges.length
    };

    // Determine overall status
    let overallStatus: GoldenValidationReport['overall_status'];
    if (registryChanges.length > 0) {
      overallStatus = 'REGISTRY_CHANGE_DETECTED';
    } else if (criticalFailures.length > 0 || summary.technical_errors > 0) {
      overallStatus = 'FAIL';
    } else if (summary.fields_mismatched > 0 || summary.fields_missing > 0) {
      overallStatus = 'PARTIAL';
    } else {
      overallStatus = 'PASS';
    }

    const duration = Date.now() - startTime;

    console.log(`[Golden QA] Validation completed in ${duration}ms`);

    return {
      test_ipn: this.testIPN,
      test_timestamp: new Date(),
      golden_dataset_version: this.goldenDataset.registry_version,
      overall_status: overallStatus,
      category_results: categoryResults,
      ui_validation: uiSummary,
      diagnostics,
      self_healing_actions: selfHealingActions,
      registry_changes_detected: registryChanges,
      summary
    };
  }

  private buildCategorySummary(results: any[]): ValidationResultSummary {
    const total = results.length;
    const matched = results.filter(r => r.match).length;
    const mismatched = results.filter(r => !r.match && r.discrepancy_type === 'DATA_MISMATCH').length;
    const missing = results.filter(r => !r.match && r.discrepancy_type === 'MISSING_DATA').length;
    const extra = results.filter(r => !r.match && r.discrepancy_type === 'EXTRA_DATA').length;

    const status = matched === total ? 'PASS' : 
                  (matched + mismatched) === total ? 'PARTIAL' : 'FAIL';

    return { total, matched, mismatched, missing, extra, status };
  }

  async runSystemHealthCheck(): Promise<GoldenValidationReport> {
    console.log('[Golden QA] Running system health check');

    const diagnostics = await this.automaticDiagnostics.diagnoseSystemHealth();

    return {
      test_ipn: this.testIPN,
      test_timestamp: new Date(),
      golden_dataset_version: this.goldenDataset.registry_version,
      overall_status: diagnostics.length > 0 ? 'FAIL' : 'PASS',
      category_results: {
        identification: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' },
        addresses: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' },
        contacts: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' },
        business_relationships: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' },
        court_cases: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' },
        enforcement_proceedings: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' },
        sanctions: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' },
        pep_records: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' },
        property: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' }
      },
      ui_validation: { total: 0, matched: 0, mismatched: 0, missing: 0, extra: 0, status: 'PASS' },
      diagnostics,
      self_healing_actions: [],
      registry_changes_detected: [],
      summary: {
        total_fields_checked: 0,
        fields_matched: 0,
        fields_mismatched: 0,
        fields_missing: 0,
        fields_extra: 0,
        technical_errors: diagnostics.length,
        registry_changes: 0
      }
    };
  }

  async handleRegistryChanges(): Promise<{
    verified: any[];
    unverified: any[];
    datasetUpdates: number;
  }> {
    const changes = this.getRegistryChanges();
    return await this.registryChangeHandler.handleAllRegistryChanges(changes);
  }
}
