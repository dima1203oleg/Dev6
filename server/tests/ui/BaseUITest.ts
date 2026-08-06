/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Base UI Test Class using Playwright
 */

import { ValidationResult, FieldStatus, OverallStatus } from './types';

export class BaseUITest {
  protected testIPN: string = '3111724753';
  protected baseURL: string = 'http://localhost:3000'; // Default dev server

  constructor(testIPN?: string, baseURL?: string) {
    if (testIPN) this.testIPN = testIPN;
    if (baseURL) this.baseURL = baseURL;
  }

  public createValidationResult(
    valid: boolean,
    errors: string[] = [],
    warnings: string[] = []
  ): ValidationResult {
    return { valid, errors, warnings };
  }

  protected validateFieldStatus(status: string): ValidationResult {
    const validStatuses: FieldStatus[] = ['VERIFIED', 'CONFLICT', 'NOT_FOUND', 'RESTRICTED', 'CACHED'];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!validStatuses.includes(status as FieldStatus)) {
      errors.push(`Invalid field status: ${status}`);
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  protected validateOverallStatus(status: string): ValidationResult {
    const validStatuses: OverallStatus[] = ['SUCCESS', 'PARTIAL', 'CONFLICT', 'BLOCKED', 'NO_DATA'];
    const errors: string[] = [];

    if (!validStatuses.includes(status as OverallStatus)) {
      errors.push(`Invalid overall status: ${status}`);
    }

    return this.createValidationResult(errors.length === 0, errors);
  }

  protected validateProvenance(provenance: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!provenance) {
      errors.push('Provenance is missing');
      return this.createValidationResult(false, errors, warnings);
    }

    if (!provenance.source) {
      errors.push('Provenance missing source');
    }

    if (!provenance.timestamp) {
      errors.push('Provenance missing timestamp');
    }

    if (!provenance.record_id) {
      warnings.push('Provenance missing record_id');
    }

    if (provenance.confidence === undefined || provenance.confidence === null) {
      warnings.push('Provenance missing confidence score');
    } else if (provenance.confidence < 0 || provenance.confidence > 1) {
      errors.push(`Invalid confidence score: ${provenance.confidence}`);
    }

    if (!provenance.raw_fragment) {
      warnings.push('Provenance missing raw fragment');
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  protected validateNoFabrication(value: any, provenance: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if value exists but provenance is missing
    if (value !== undefined && value !== null && value !== '' && !provenance) {
      errors.push('Value exists without provenance - potential fabrication');
    }

    // Check for suspicious default values
    if (value === 'Unknown' || value === 'N/A' || value === 'Not specified') {
      if (!provenance || provenance.status !== 'NOT_FOUND') {
        warnings.push('Generic value without NOT_FOUND status');
      }
    }

    // Check for placeholder patterns
    if (typeof value === 'string') {
      const placeholderPatterns = [
        /^placeholder$/i,
        /^example\d+$/i,
        /^test\d+$/i,
        /^xxx+$/i,
        /^---$/
      ];

      for (const pattern of placeholderPatterns) {
        if (pattern.test(value)) {
          errors.push(`Suspicious placeholder value detected: ${value}`);
          break;
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  protected validateConflictVisibility(conflicts: any[], fieldStatus: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (conflicts && conflicts.length > 0) {
      if (fieldStatus !== 'CONFLICT') {
        errors.push(`Conflicts exist but field status is ${fieldStatus}, should be CONFLICT`);
      }

      // Validate each conflict has provenance
      for (const conflict of conflicts) {
        const provenanceCheck = this.validateProvenance(conflict);
        if (!provenanceCheck.valid) {
          errors.push(`Conflict missing proper provenance: ${provenanceCheck.errors.join(', ')}`);
        }
      }
    } else if (fieldStatus === 'CONFLICT') {
      errors.push('Field status is CONFLICT but no conflicts are visible');
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  protected validateAbsenceHonesty(value: any, status: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (value === undefined || value === null || value === '') {
      // Value is absent - check if status reflects this
      if (status !== 'NOT_FOUND' && status !== 'RESTRICTED') {
        errors.push(`Value is absent but status is ${status}, should be NOT_FOUND or RESTRICTED`);
      }
    } else {
      // Value is present - check if status reflects this
      if (status === 'NOT_FOUND' || status === 'RESTRICTED') {
        errors.push(`Value is present but status is ${status}`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  protected validateSourceRouting(sourcesQuoted: string[], sourcesResponded: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (sourcesResponded.length > sourcesQuoted.length) {
      errors.push('More sources responded than were queried');
    }

    if (sourcesResponded.length === 0 && sourcesQuoted.length > 0) {
      errors.push('No sources responded despite being queried');
    }

    // Check if all responded sources were actually quoted
    for (const responded of sourcesResponded) {
      if (!sourcesQuoted.includes(responded)) {
        errors.push(`Source ${responded} responded but was not in quoted sources`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  protected validateRepeatability(firstResult: any, secondResult: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Compare overall structure
    if (JSON.stringify(firstResult) === JSON.stringify(secondResult)) {
      return this.createValidationResult(true);
    }

    // If different, check if sources actually changed
    const firstSources = firstResult.sources_responded || [];
    const secondSources = secondResult.sources_responded || [];

    if (firstSources.length !== secondSources.length) {
      warnings.push('Different number of sources responded between runs');
    }

    // Check for field differences
    const firstFields = firstResult.profile_fields || [];
    const secondFields = secondResult.profile_fields || [];

    if (firstFields.length !== secondFields.length) {
      warnings.push('Different number of fields returned between runs');
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}
