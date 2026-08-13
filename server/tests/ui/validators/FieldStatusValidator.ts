/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Field Status Validation Tests
 */

import { BaseUITest } from '../BaseUITest';
import { ValidationResult, UICardStructure } from '../types';

export class FieldStatusValidator extends BaseUITest {
  async validateAllFieldStatuses(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of uiCard.profile_fields) {
      const fieldValidation = this.validateSingleFieldStatus(field);
      if (!fieldValidation.valid) {
        errors.push(...fieldValidation.errors.map(e => `${field.field_name}: ${e}`));
      }
      if (fieldValidation.warnings.length > 0) {
        warnings.push(...fieldValidation.warnings.map(w => `${field.field_name}: ${w}`));
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateSingleFieldStatus(field: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate status is one of the allowed values
    const statusValidation = this.validateFieldStatus(field.status);
    if (!statusValidation.valid) {
      errors.push(...statusValidation.errors);
    }

    // Validate status matches value presence
    const absenceValidation = this.validateAbsenceHonesty(field.value, field.status);
    if (!absenceValidation.valid) {
      errors.push(...absenceValidation.errors);
    }

    // Validate provenance matches status
    if (field.status === 'VERIFIED' || field.status === 'CONFLICT' || field.status === 'CACHED') {
      if (!field.provenance || field.provenance.length === 0) {
        errors.push(`Status is ${field.status} but no provenance provided`);
      }
    }

    if (field.status === 'NOT_FOUND' || field.status === 'RESTRICTED' || field.status === 'BLOCKED') {
      if (field.provenance && field.provenance.length > 0) {
        warnings.push(`Status is ${field.status} but provenance is provided`);
      }
    }

    // Validate conflict status has conflicts array
    if (field.status === 'CONFLICT') {
      if (!field.conflicts || field.conflicts.length === 0) {
        errors.push('Status is CONFLICT but no conflicts array provided');
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateVerifiedField(field: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (field.status !== 'VERIFIED') {
      errors.push(`Expected VERIFIED status, got ${field.status}`);
    }

    if (!field.value || field.value === '' || field.value === null || field.value === undefined) {
      errors.push('VERIFIED field has no value');
    }

    if (!field.provenance || field.provenance.length === 0) {
      errors.push('VERIFIED field has no provenance');
    }

    // Validate provenance quality
    if (field.provenance) {
      for (const prov of field.provenance) {
        const provCheck = this.validateProvenance(prov);
        if (!provCheck.valid) {
          errors.push(...provCheck.errors);
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateConflictField(field: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (field.status !== 'CONFLICT') {
      errors.push(`Expected CONFLICT status, got ${field.status}`);
    }

    if (!field.conflicts || field.conflicts.length < 2) {
      errors.push('CONFLICT field should have at least 2 conflicting values');
    }

    // Validate each conflict has proper provenance
    if (field.conflicts) {
      for (const conflict of field.conflicts) {
        const provCheck = this.validateProvenance(conflict);
        if (!provCheck.valid) {
          errors.push(`Conflict missing proper provenance: ${provCheck.errors.join(', ')}`);
        }
      }
    }

    // Check that conflicts are actually different
    if (field.conflicts && field.conflicts.length >= 2) {
      const values = field.conflicts.map((c: any) => JSON.stringify(c.normalized_value));
      const uniqueValues = new Set(values);
      if (uniqueValues.size < 2) {
        errors.push('Conflicts are not actually different values');
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateNotFoundField(field: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (field.status !== 'NOT_FOUND') {
      errors.push(`Expected NOT_FOUND status, got ${field.status}`);
    }

    if (field.value !== undefined && field.value !== null && field.value !== '') {
      errors.push('NOT_FOUND field has a value');
    }

    if (field.provenance && field.provenance.length > 0) {
      errors.push('NOT_FOUND field has provenance');
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateRestrictedField(field: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (field.status !== 'RESTRICTED') {
      errors.push(`Expected RESTRICTED status, got ${field.status}`);
    }

    if (field.value !== undefined && field.value !== null && field.value !== '') {
      errors.push('RESTRICTED field has a value');
    }

    if (field.provenance && field.provenance.length > 0) {
      warnings.push('RESTRICTED field has provenance (may indicate partial access)');
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateCachedField(field: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (field.status !== 'CACHED') {
      errors.push(`Expected CACHED status, got ${field.status}`);
    }

    if (!field.value) {
      errors.push('CACHED field has no value');
    }

    if (!field.provenance || field.provenance.length === 0) {
      errors.push('CACHED field has no provenance');
    }

    // Check that cache timestamp is recent enough
    if (field.provenance) {
      for (const prov of field.provenance) {
        if (prov.timestamp) {
          const age = Date.now() - prov.timestamp.getTime();
          const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
          if (age > maxCacheAge) {
            warnings.push(`Cached data is old: ${Math.round(age / 1000 / 60)} minutes`);
          }
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateBlockedField(field: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (field.status !== 'BLOCKED') {
      errors.push(`Expected BLOCKED status, got ${field.status}`);
    }

    if (field.value !== undefined && field.value !== null && field.value !== '') {
      errors.push('BLOCKED field has a value');
    }

    if (field.provenance && field.provenance.length > 0) {
      errors.push('BLOCKED field has provenance');
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateStatusConsistency(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const verifiedCount = uiCard.profile_fields.filter(f => f.status === 'VERIFIED').length;
    const conflictCount = uiCard.profile_fields.filter(f => f.status === 'CONFLICT').length;
    const notFoundCount = uiCard.profile_fields.filter(f => f.status === 'NOT_FOUND').length;
    const restrictedCount = uiCard.profile_fields.filter(f => f.status === 'RESTRICTED').length;

    // Check that overall status reflects field statuses
    if (conflictCount > 0 && uiCard.header.overall_status !== 'CONFLICT') {
      errors.push(`Has ${conflictCount} conflicts but overall status is ${uiCard.header.overall_status}`);
    }

    if (verifiedCount === 0 && notFoundCount === 0 && restrictedCount === 0) {
      if (uiCard.header.overall_status !== 'NO_DATA' && uiCard.header.overall_status !== 'BLOCKED') {
        errors.push(`No verified fields but overall status is ${uiCard.header.overall_status}`);
      }
    }

    // Check that header conflicts count matches field conflicts
    const actualConflicts = uiCard.profile_fields.filter(f => f.status === 'CONFLICT').length;
    if (actualConflicts !== uiCard.header.conflicts_count) {
      errors.push(`Header shows ${uiCard.header.conflicts_count} conflicts but ${actualConflicts} fields have CONFLICT status`);
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}
