/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * UI Web Interface Validator
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult } from '../types';

export class UIWebInterfaceValidator extends BaseGoldenValidator {
  async validateWebInterface(backendData: any, uiData: any): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];

    // Validate that correct card opened
    results.push(this.validateCorrectCardOpened(backendData, uiData));

    // Validate header matches backend
    results.push(this.validateHeaderMatchesBackend(backendData, uiData));

    // Validate PIB matches
    results.push(this.validatePIBMatches(backendData, uiData));

    // Validate IPN displayed correctly
    results.push(this.validateIPNDisplayedCorrectly(backendData, uiData));

    // Validate all companies present
    results.push(this.validateAllCompaniesPresent(backendData, uiData));

    // Validate roles displayed correctly
    results.push(this.validateRolesDisplayedCorrectly(backendData, uiData));

    // Validate court cases displayed
    results.push(this.validateCourtCasesDisplayed(backendData, uiData));

    // Validate conflicts marked
    results.push(this.validateConflictsMarked(backendData, uiData));

    // Validate Restricted badge
    results.push(this.validateRestrictedBadge(backendData, uiData));

    // Validate User Provided not elevated to Verified
    results.push(this.validateUserProvidedNotElevated(backendData, uiData));

    // Validate each field has source
    results.push(this.validateEachFieldHasSource(backendData, uiData));

    // Validate each field has Provenance
    results.push(this.validateEachFieldHasProvenance(backendData, uiData));

    // Validate Confidence reflects formula
    results.push(this.validateConfidenceReflectsFormula(backendData, uiData));

    // Validate Data Completeness matches backend
    results.push(this.validateDataCompletenessMatchesBackend(backendData, uiData));

    // Validate Relationship Graph contains all confirmed connections
    results.push(this.validateRelationshipGraph(backendData, uiData));

    // Validate Timeline formed only from confirmed events
    results.push(this.validateTimeline(backendData, uiData));

    // Validate UI does not show fields not in API response
    results.push(this.validateNoExtraFields(backendData, uiData));

    return results;
  }

  private validateCorrectCardOpened(backendData: any, uiData: any): GoldenValidationResult {
    if (!uiData || !uiData.header) {
      return this.createValidationResult(
        'ui_interface',
        'correct_card_opened',
        true,
        false,
        'TECHNICAL_ERROR',
        'UI card did not open or header is missing'
      );
    }

    if (uiData.header.ipn !== this.testIPN) {
      return this.createValidationResult(
        'ui_interface',
        'correct_card_opened',
        this.testIPN,
        uiData.header.ipn,
        'DATA_MISMATCH',
        'Wrong card opened - IPN mismatch'
      );
    }

    return this.createValidationResult('ui_interface', 'correct_card_opened', true, true);
  }

  private validateHeaderMatchesBackend(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData || !uiData.header) {
      return this.createValidationResult(
        'ui_interface',
        'header_matches_backend',
        backendData,
        uiData,
        'MISSING_DATA',
        'Missing data for comparison'
      );
    }

    const backendHeader = backendData.header;
    const uiHeader = uiData.header;

    const fieldsToCheck = ['entity_type', 'entity_id', 'confidence_score', 'data_completeness', 'sources_responded', 'conflicts_count'];
    const mismatches: string[] = [];

    for (const field of fieldsToCheck) {
      if (backendHeader[field] !== uiHeader[field]) {
        mismatches.push(field);
      }
    }

    if (mismatches.length > 0) {
      return this.createValidationResult(
        'ui_interface',
        'header_matches_backend',
        backendHeader,
        uiHeader,
        'DATA_MISMATCH',
        `Header fields mismatch: ${mismatches.join(', ')}`
      );
    }

    return this.createValidationResult('ui_interface', 'header_matches_backend', backendHeader, uiHeader);
  }

  private validatePIBMatches(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'pib_matches', backendData, uiData, 'MISSING_DATA');
    }

    const backendPIB = backendData.identification?.full_name;
    const uiPIB = uiData.profile_fields?.find((f: any) => f.field_name === 'full_name')?.value;

    if (backendPIB !== uiPIB) {
      return this.createValidationResult(
        'ui_interface',
        'pib_matches',
        backendPIB,
        uiPIB,
        'DATA_MISMATCH',
        'PIB does not match between backend and UI'
      );
    }

    return this.createValidationResult('ui_interface', 'pib_matches', backendPIB, uiPIB);
  }

  private validateIPNDisplayedCorrectly(backendData: any, uiData: any): GoldenValidationResult {
    if (!uiData || !uiData.header) {
      return this.createValidationResult('ui_interface', 'ipn_displayed', this.testIPN, null, 'MISSING_DATA');
    }

    if (uiData.header.ipn !== this.testIPN) {
      return this.createValidationResult(
        'ui_interface',
        'ipn_displayed',
        this.testIPN,
        uiData.header.ipn,
        'DATA_MISMATCH',
        'IPN displayed incorrectly in UI'
      );
    }

    return this.createValidationResult('ui_interface', 'ipn_displayed', this.testIPN, uiData.header.ipn);
  }

  private validateAllCompaniesPresent(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'companies_present', backendData, uiData, 'MISSING_DATA');
    }

    const backendCompanies = backendData.business_relationships || [];
    const uiCompanies = uiData.business_relationships || [];

    if (backendCompanies.length !== uiCompanies.length) {
      return this.createValidationResult(
        'ui_interface',
        'companies_present',
        backendCompanies.length,
        uiCompanies.length,
        'DATA_MISMATCH',
        `Company count mismatch: backend has ${backendCompanies.length}, UI has ${uiCompanies.length}`
      );
    }

    const backendCompanyEDRPOUs = new Set(backendCompanies.map((c: any) => c.company_edrpou));
    const uiCompanyEDRPOUs = new Set(uiCompanies.map((c: any) => c.company_edrpou));

    const missingInUI = [...backendCompanyEDRPOUs].filter(edrpou => !uiCompanyEDRPOUs.has(edrpou));
    const extraInUI = [...uiCompanyEDRPOUs].filter(edrpou => !backendCompanyEDRPOUs.has(edrpou));

    if (missingInUI.length > 0 || extraInUI.length > 0) {
      return this.createValidationResult(
        'ui_interface',
        'companies_present',
        [...backendCompanyEDRPOUs],
        [...uiCompanyEDRPOUs],
        'DATA_MISMATCH',
        `Missing in UI: ${missingInUI.join(', ')}, Extra in UI: ${extraInUI.join(', ')}`
      );
    }

    return this.createValidationResult('ui_interface', 'companies_present', [...backendCompanyEDRPOUs], [...uiCompanyEDRPOUs]);
  }

  private validateRolesDisplayedCorrectly(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'roles_displayed', backendData, uiData, 'MISSING_DATA');
    }

    const backendRelationships = backendData.business_relationships || [];
    const uiRelationships = uiData.business_relationships || [];

    for (const backendRel of backendRelationships) {
      const uiRel = uiRelationships.find((u: any) => u.company_edrpou === backendRel.company_edrpou);
      
      if (!uiRel) {
        continue; // Already caught by companies_present validation
      }

      if (backendRel.role !== uiRel.role) {
        return this.createValidationResult(
          'ui_interface',
          'roles_displayed',
          `${backendRel.company_edrpou}: ${backendRel.role}`,
          `${uiRel.company_edrpou}: ${uiRel.role}`,
          'DATA_MISMATCH',
          `Role mismatch for company ${backendRel.company_edrpou}`
        );
      }
    }

    return this.createValidationResult('ui_interface', 'roles_displayed', true, true);
  }

  private validateCourtCasesDisplayed(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'court_cases_displayed', backendData, uiData, 'MISSING_DATA');
    }

    const backendCases = backendData.court_cases || [];
    const uiCases = uiData.court_cases || [];

    if (backendCases.length !== uiCases.length) {
      return this.createValidationResult(
        'ui_interface',
        'court_cases_displayed',
        backendCases.length,
        uiCases.length,
        'DATA_MISMATCH',
        `Court case count mismatch: backend has ${backendCases.length}, UI has ${uiCases.length}`
      );
    }

    return this.createValidationResult('ui_interface', 'court_cases_displayed', backendCases.length, uiCases.length);
  }

  private validateConflictsMarked(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'conflicts_marked', backendData, uiData, 'MISSING_DATA');
    }

    const backendConflicts = backendData.conflicts_count || 0;
    const uiConflicts = uiData.header?.conflicts_count || 0;

    if (backendConflicts !== uiConflicts) {
      return this.createValidationResult(
        'ui_interface',
        'conflicts_marked',
        backendConflicts,
        uiConflicts,
        'DATA_MISMATCH',
        `Conflict count mismatch: backend has ${backendConflicts}, UI has ${uiConflicts}`
      );
    }

    // Check that conflict fields have CONFLICT status
    const conflictFields = uiData.profile_fields?.filter((f: any) => f.status === 'CONFLICT') || [];
    if (backendConflicts > 0 && conflictFields.length === 0) {
      return this.createValidationResult(
        'ui_interface',
        'conflicts_marked',
        'CONFLICT status expected',
        'No CONFLICT status fields found',
        'DATA_MISMATCH',
        'Conflicts exist in backend but not marked in UI'
      );
    }

    return this.createValidationResult('ui_interface', 'conflicts_marked', backendConflicts, uiConflicts);
  }

  private validateRestrictedBadge(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'restricted_badge', backendData, uiData, 'MISSING_DATA');
    }

    const restrictedFields = uiData.profile_fields?.filter((f: any) => f.status === 'RESTRICTED' || f.status === 'BLOCKED') || [];
    const hasRestrictedBadge = uiData.header?.overall_status === 'RESTRICTED' || uiData.header?.overall_status === 'BLOCKED';

    if (restrictedFields.length > 0 && !hasRestrictedBadge) {
      return this.createValidationResult(
        'ui_interface',
        'restricted_badge',
        'RESTRICTED/BLOCKED badge expected',
        'No RESTRICTED/BLOCKED badge in header',
        'DATA_MISMATCH',
        'Restricted fields exist but badge not shown'
      );
    }

    return this.createValidationResult('ui_interface', 'restricted_badge', true, true);
  }

  private validateUserProvidedNotElevated(backendData: any, uiData: any): GoldenValidationResult {
    if (!uiData) {
      return this.createValidationResult('ui_interface', 'user_provided_not_elevated', backendData, uiData, 'MISSING_DATA');
    }

    const userProvidedFields = uiData.profile_fields?.filter((f: any) => {
      return f.provenance?.some((p: any) => p.source === 'USER_PROVIDED' && p.status === 'VERIFIED');
    }) || [];

    if (userProvidedFields.length > 0) {
      return this.createValidationResult(
        'ui_interface',
        'user_provided_not_elevated',
        'USER_PROVIDED should not be VERIFIED',
        userProvidedFields.map((f: any) => f.field_name),
        'DATA_MISMATCH',
        `User Provided fields elevated to Verified: ${userProvidedFields.map((f: any) => f.field_name).join(', ')}`
      );
    }

    return this.createValidationResult('ui_interface', 'user_provided_not_elevated', true, true);
  }

  private validateEachFieldHasSource(backendData: any, uiData: any): GoldenValidationResult {
    if (!uiData) {
      return this.createValidationResult('ui_interface', 'field_has_source', backendData, uiData, 'MISSING_DATA');
    }

    const fieldsWithoutSource = uiData.profile_fields?.filter((f: any) => {
      if (!f.value || f.value === '' || f.value === null || f.value === undefined) {
        return false; // Empty fields don't need source
      }
      return !f.provenance || f.provenance.length === 0;
    }) || [];

    if (fieldsWithoutSource.length > 0) {
      return this.createValidationResult(
        'ui_interface',
        'field_has_source',
        'All fields should have source',
        fieldsWithoutSource.map((f: any) => f.field_name),
        'DATA_MISMATCH',
        `Fields without source: ${fieldsWithoutSource.map((f: any) => f.field_name).join(', ')}`
      );
    }

    return this.createValidationResult('ui_interface', 'field_has_source', true, true);
  }

  private validateEachFieldHasProvenance(backendData: any, uiData: any): GoldenValidationResult {
    if (!uiData) {
      return this.createValidationResult('ui_interface', 'field_has_provenance', backendData, uiData, 'MISSING_DATA');
    }

    const fieldsWithoutProvenance = uiData.profile_fields?.filter((f: any) => {
      if (!f.value || f.value === '' || f.value === null || f.value === undefined) {
        return false;
      }
      return !f.provenance || f.provenance.length === 0 || 
             !f.provenance.every((p: any) => p.source && p.timestamp && p.record_id);
    }) || [];

    if (fieldsWithoutProvenance.length > 0) {
      return this.createValidationResult(
        'ui_interface',
        'field_has_provenance',
        'All fields should have complete provenance',
        fieldsWithoutProvenance.map((f: any) => f.field_name),
        'DATA_MISMATCH',
        `Fields without complete provenance: ${fieldsWithoutProvenance.map((f: any) => f.field_name).join(', ')}`
      );
    }

    return this.createValidationResult('ui_interface', 'field_has_provenance', true, true);
  }

  private validateConfidenceReflectsFormula(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'confidence_formula', backendData, uiData, 'MISSING_DATA');
    }

    const backendConfidence = backendData.header?.confidence_score;
    const uiConfidence = uiData.header?.confidence_score;

    if (backendConfidence !== uiConfidence) {
      return this.createValidationResult(
        'ui_interface',
        'confidence_formula',
        backendConfidence,
        uiConfidence,
        'DATA_MISMATCH',
        'Confidence score does not match backend calculation'
      );
    }

    return this.createValidationResult('ui_interface', 'confidence_formula', backendConfidence, uiConfidence);
  }

  private validateDataCompletenessMatchesBackend(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'data_completeness', backendData, uiData, 'MISSING_DATA');
    }

    const backendCompleteness = backendData.header?.data_completeness;
    const uiCompleteness = uiData.header?.data_completeness;

    if (backendCompleteness !== uiCompleteness) {
      return this.createValidationResult(
        'ui_interface',
        'data_completeness',
        backendCompleteness,
        uiCompleteness,
        'DATA_MISMATCH',
        'Data completeness does not match backend'
      );
    }

    return this.createValidationResult('ui_interface', 'data_completeness', backendCompleteness, uiCompleteness);
  }

  private validateRelationshipGraph(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'relationship_graph', backendData, uiData, 'MISSING_DATA');
    }

    const backendRelationships = backendData.business_relationships || [];
    const uiGraph = uiData.relationship_graph || [];

    // Check that all confirmed relationships are in graph
    const confirmedRelationships = backendRelationships.filter((r: any) => r.verified);
    const graphRelationships = uiGraph.map((g: any) => g.company_edrpou);

    const missingInGraph = confirmedRelationships
      .filter((r: any) => !graphRelationships.includes(r.company_edrpou))
      .map((r: any) => r.company_edrpou);

    if (missingInGraph.length > 0) {
      return this.createValidationResult(
        'ui_interface',
        'relationship_graph',
        confirmedRelationships.map((r: any) => r.company_edrpou),
        graphRelationships,
        'DATA_MISMATCH',
        `Missing in relationship graph: ${missingInGraph.join(', ')}`
      );
    }

    return this.createValidationResult('ui_interface', 'relationship_graph', confirmedRelationships.map((r: any) => r.company_edrpou), graphRelationships);
  }

  private validateTimeline(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'timeline', backendData, uiData, 'MISSING_DATA');
    }

    const uiTimeline = uiData.timeline || [];

    // Check that timeline only contains confirmed events
    const unverifiedEvents = uiTimeline.filter((e: any) => !e.verified);
    
    if (unverifiedEvents.length > 0) {
      return this.createValidationResult(
        'ui_interface',
        'timeline',
        'Only confirmed events',
        unverifiedEvents.map((e: any) => e.event_type),
        'DATA_MISMATCH',
        `Timeline contains unverified events: ${unverifiedEvents.map((e: any) => e.event_type).join(', ')}`
      );
    }

    return this.createValidationResult('ui_interface', 'timeline', true, true);
  }

  private validateNoExtraFields(backendData: any, uiData: any): GoldenValidationResult {
    if (!backendData || !uiData) {
      return this.createValidationResult('ui_interface', 'no_extra_fields', backendData, uiData, 'MISSING_DATA');
    }

    const backendFields = new Set<string>(
      Object.keys(backendData.identification || {})
        .concat(Object.keys(backendData.addresses || {}))
        .concat(Object.keys(backendData.contacts || {}))
    );

    const uiFields = new Set<string>(uiData.profile_fields?.map((f: any) => f.field_name) || []);

    const extraFields = [...uiFields].filter((f) => !backendFields.has(f));

    if (extraFields.length > 0) {
      return this.createValidationResult(
        'ui_interface',
        'no_extra_fields',
        [...backendFields],
        extraFields,
        'EXTRA_DATA',
        `UI shows fields not in API response: ${extraFields.join(', ')}`
      );
    }

    return this.createValidationResult('ui_interface', 'no_extra_fields', [...backendFields], [...uiFields]);
  }
}
