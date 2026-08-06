/**
 * PREDATOR Analytics - UI Integration Test Framework
 * UI Card Structure Validation Tests
 */

import { BaseUITest } from '../BaseUITest';
import { ValidationResult, UICardStructure, OverallStatus } from '../types';

export class UICardStructureValidator extends BaseUITest {
  async validateHeaderStructure(header: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required header fields
    if (!header.ipn) {
      errors.push('Header missing IPN');
    }

    if (!header.entity_type) {
      errors.push('Header missing entity_type');
    }

    if (!header.entity_id) {
      warnings.push('Header missing entity_id');
    }

    if (header.confidence_score === undefined || header.confidence_score === null) {
      errors.push('Header missing confidence_score');
    } else if (header.confidence_score < 0 || header.confidence_score > 1) {
      errors.push(`Invalid confidence_score: ${header.confidence_score}`);
    }

    if (header.data_completeness === undefined || header.data_completeness === null) {
      errors.push('Header missing data_completeness');
    } else if (header.data_completeness < 0 || header.data_completeness > 1) {
      errors.push(`Invalid data_completeness: ${header.data_completeness}`);
    }

    if (header.sources_responded === undefined || header.sources_responded === null) {
      errors.push('Header missing sources_responded');
    }

    if (header.conflicts_count === undefined || header.conflicts_count === null) {
      errors.push('Header missing conflicts_count');
    }

    if (!header.last_updated) {
      errors.push('Header missing last_updated');
    } else if (!(header.last_updated instanceof Date) || isNaN(header.last_updated.getTime())) {
      errors.push('Header last_updated is not a valid Date');
    }

    if (!header.overall_status) {
      errors.push('Header missing overall_status');
    } else {
      const statusValidation = this.validateOverallStatus(header.overall_status);
      if (!statusValidation.valid) {
        errors.push(...statusValidation.errors);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  async validateProfileFieldsStructure(fields: any[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!fields || !Array.isArray(fields)) {
      errors.push('Profile fields is not an array');
      return this.createValidationResult(false, errors, warnings);
    }

    for (const field of fields) {
      if (!field.field_name) {
        errors.push('Field missing field_name');
      }

      if (field.status === undefined || field.status === null) {
        errors.push(`Field ${field.field_name || 'unknown'} missing status`);
      } else {
        const statusValidation = this.validateFieldStatus(field.status);
        if (!statusValidation.valid) {
          errors.push(`Field ${field.field_name || 'unknown'} has invalid status: ${statusValidation.errors.join(', ')}`);
        }
      }

      // Validate provenance structure
      if (field.provenance && Array.isArray(field.provenance)) {
        for (const prov of field.provenance) {
          const provValidation = this.validateProvenance(prov);
          if (!provValidation.valid) {
            errors.push(`Field ${field.field_name || 'unknown'} provenance invalid: ${provValidation.errors.join(', ')}`);
          }
        }
      }

      // Validate conflicts structure
      if (field.conflicts && Array.isArray(field.conflicts)) {
        for (const conflict of field.conflicts) {
          const provValidation = this.validateProvenance(conflict);
          if (!provValidation.valid) {
            errors.push(`Field ${field.field_name || 'unknown'} conflict invalid: ${provValidation.errors.join(', ')}`);
          }
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateRequiredFieldsPresence(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const requiredFields = ['full_name', 'ipn'];
    const presentFields = uiCard.profile_fields.map(f => f.field_name);

    for (const required of requiredFields) {
      if (!presentFields.includes(required)) {
        warnings.push(`Required field ${required} is missing from profile`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateHeaderFieldConsistency(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const verifiedFields = uiCard.profile_fields.filter(f => f.status === 'VERIFIED').length;
    const totalFields = uiCard.profile_fields.length;

    if (totalFields > 0) {
      const expectedCompleteness = verifiedFields / totalFields;
      const completenessDiff = Math.abs(expectedCompleteness - uiCard.header.data_completeness);
      
      if (completenessDiff > 0.2) {
        warnings.push(`Header data_completeness (${uiCard.header.data_completeness}) doesn't match verified field ratio (${expectedCompleteness.toFixed(2)})`);
      }
    }

    const conflictFields = uiCard.profile_fields.filter(f => f.status === 'CONFLICT').length;
    if (conflictFields !== uiCard.header.conflicts_count) {
      errors.push(`Header conflicts_count (${uiCard.header.conflicts_count}) doesn't match actual conflict fields (${conflictFields})`);
    }

    const sourcesInProvenance = new Set<string>();
    for (const field of uiCard.profile_fields) {
      if (field.provenance) {
        for (const prov of field.provenance) {
          if (prov.source) sourcesInProvenance.add(prov.source);
        }
      }
    }

    if (sourcesInProvenance.size !== uiCard.header.sources_responded) {
      warnings.push(`Header sources_responded (${uiCard.header.sources_responded}) doesn't match unique sources in provenance (${sourcesInProvenance.size})`);
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateOverallStatusLogic(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const hasConflicts = uiCard.header.conflicts_count > 0;
    const hasVerifiedData = uiCard.profile_fields.some(f => f.status === 'VERIFIED');
    const hasNoData = !hasVerifiedData && uiCard.profile_fields.every(f => f.status === 'NOT_FOUND' || f.status === 'RESTRICTED' || f.status === 'BLOCKED');

    if (hasConflicts && uiCard.header.overall_status !== 'CONFLICT') {
      errors.push(`Has conflicts but overall status is ${uiCard.header.overall_status}, should be CONFLICT`);
    }

    if (hasNoData && uiCard.header.overall_status !== 'NO_DATA' && uiCard.header.overall_status !== 'BLOCKED') {
      errors.push(`Has no data but overall status is ${uiCard.header.overall_status}, should be NO_DATA or BLOCKED`);
    }

    if (!hasConflicts && hasVerifiedData && uiCard.header.data_completeness < 1 && uiCard.header.overall_status !== 'PARTIAL') {
      warnings.push(`Has partial data but overall status is ${uiCard.header.overall_status}, should be PARTIAL`);
    }

    if (!hasConflicts && hasVerifiedData && uiCard.header.data_completeness === 1 && uiCard.header.overall_status !== 'SUCCESS') {
      warnings.push(`Has complete data but overall status is ${uiCard.header.overall_status}, should be SUCCESS`);
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateVisualElements(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that fields have visual indicators for their status
    for (const field of uiCard.profile_fields) {
      if (field.status === 'CONFLICT') {
        // Should have conflict visual indicator
        if (!field.conflicts || field.conflicts.length === 0) {
          errors.push(`Field ${field.field_name} is CONFLICT but has no conflicts array for visual display`);
        }
      }

      if (field.status === 'CACHED') {
        // Should have cache indicator
        warnings.push(`Field ${field.field_name} is CACHED - should have cache visual indicator`);
      }

      if (field.status === 'RESTRICTED' || field.status === 'BLOCKED') {
        // Should have restriction indicator
        warnings.push(`Field ${field.field_name} is ${field.status} - should have restriction visual indicator`);
      }
    }

    // Check header has required visual elements
    if (uiCard.header.conflicts_count > 0) {
      warnings.push('Header should show conflict warning indicator');
    }

    if (uiCard.header.data_completeness < 0.5) {
      warnings.push('Header should show low completeness indicator');
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateProvenanceBlocksStructure(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!uiCard.provenance_blocks || uiCard.provenance_blocks.size === 0) {
      warnings.push('No provenance blocks found in UI card');
      return this.createValidationResult(true, errors, warnings);
    }

    // Validate each provenance block
    for (const [fieldName, provenanceArray] of uiCard.provenance_blocks.entries()) {
      if (!Array.isArray(provenanceArray)) {
        errors.push(`Provenance block for ${fieldName} is not an array`);
      }

      for (const prov of provenanceArray) {
        const provValidation = this.validateProvenance(prov);
        if (!provValidation.valid) {
          errors.push(`Provenance block ${fieldName} invalid: ${provValidation.errors.join(', ')}`);
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateTimestampConsistency(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const now = Date.now();
    const headerAge = now - uiCard.header.last_updated.getTime();

    if (headerAge < 0) {
      errors.push('Header last_updated is in the future');
    }

    if (headerAge > 365 * 24 * 60 * 60 * 1000) {
      warnings.push('Header last_updated is more than a year old');
    }

    // Check field timestamps are not newer than header timestamp
    for (const field of uiCard.profile_fields) {
      if (field.provenance) {
        for (const prov of field.provenance) {
          if (prov.timestamp) {
            const fieldAge = now - prov.timestamp.getTime();
            if (fieldAge < 0) {
              errors.push(`Field ${field.field_name} provenance timestamp is in the future`);
            }
            if (prov.timestamp.getTime() > uiCard.header.last_updated.getTime()) {
              warnings.push(`Field ${field.field_name} provenance timestamp is newer than header last_updated`);
            }
          }
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateDataTypes(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate IPN format
    if (uiCard.header.ipn && typeof uiCard.header.ipn === 'string') {
      const ipnPattern = /^\d{10}$/;
      if (!ipnPattern.test(uiCard.header.ipn)) {
        errors.push(`Invalid IPN format: ${uiCard.header.ipn}`);
      }
    }

    // Validate entity type
    const validEntityTypes = ['PERSON', 'COMPANY', 'FOP'];
    if (uiCard.header.entity_type && !validEntityTypes.includes(uiCard.header.entity_type)) {
      warnings.push(`Unusual entity type: ${uiCard.header.entity_type}`);
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}
