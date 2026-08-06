/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Identification Field Validator
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult } from '../types';

export class IdentificationValidator extends BaseGoldenValidator {
  async validateIdentification(actualData: any): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];
    const golden = this.goldenDataset.identification;

    // Validate full name
    results.push(this.validateFullName(golden.full_name, actualData.full_name));
    
    // Validate IPN
    results.push(this.validateIPN(golden.ipn, actualData.ipn));
    
    // Validate birth date
    results.push(this.validateBirthDate(golden.birth_date, actualData.birth_date));
    
    // Validate gender
    results.push(this.validateGender(golden.gender, actualData.gender));
    
    // Validate citizenship
    results.push(this.validateCitizenship(golden.citizenship, actualData.citizenship));
    
    // Validate sources
    results.push(this.validateSources(golden.sources, actualData.sources));

    // Check for extra fields
    this.checkForExtraFields(golden, actualData, results);

    return results;
  }

  private validateFullName(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult(
        'identification',
        'full_name',
        expected,
        actual,
        'MISSING_DATA',
        'Full name is missing from actual data'
      );
    }

    if (expected !== actual) {
      return this.createValidationResult(
        'identification',
        'full_name',
        expected,
        actual,
        'DATA_MISMATCH',
        'Full name does not match golden dataset'
      );
    }

    return this.createValidationResult('identification', 'full_name', expected, actual);
  }

  private validateIPN(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult(
        'identification',
        'ipn',
        expected,
        actual,
        'MISSING_DATA',
        'IPN is missing from actual data',
        'CRITICAL'
      );
    }

    if (expected !== actual) {
      return this.createValidationResult(
        'identification',
        'ipn',
        expected,
        actual,
        'DATA_MISMATCH',
        'IPN does not match golden dataset',
        'CRITICAL'
      );
    }

    // Validate IPN format
    const ipnPattern = /^\d{10}$/;
    if (!ipnPattern.test(actual)) {
      return this.createValidationResult(
        'identification',
        'ipn',
        expected,
        actual,
        'TECHNICAL_ERROR',
        'IPN format is invalid'
      );
    }

    return this.createValidationResult('identification', 'ipn', expected, actual);
  }

  private validateBirthDate(expected: Date, actual: Date | string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult(
        'identification',
        'birth_date',
        expected,
        actual,
        'MISSING_DATA',
        'Birth date is missing from actual data'
      );
    }

    const actualDate = actual instanceof Date ? actual : new Date(actual);
    
    if (isNaN(actualDate.getTime())) {
      return this.createValidationResult(
        'identification',
        'birth_date',
        expected,
        actual,
        'TECHNICAL_ERROR',
        'Birth date is not a valid date'
      );
    }

    const expectedTime = expected.getTime();
    const actualTime = actualDate.getTime();

    if (Math.abs(expectedTime - actualTime) > 86400000) { // 1 day tolerance
      return this.createValidationResult(
        'identification',
        'birth_date',
        expected,
        actual,
        'DATA_MISMATCH',
        'Birth date does not match golden dataset'
      );
    }

    return this.createValidationResult('identification', 'birth_date', expected, actual);
  }

  private validateGender(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult(
        'identification',
        'gender',
        expected,
        actual,
        'MISSING_DATA',
        'Gender is missing from actual data'
      );
    }

    if (expected !== actual) {
      return this.createValidationResult(
        'identification',
        'gender',
        expected,
        actual,
        'DATA_MISMATCH',
        'Gender does not match golden dataset'
      );
    }

    return this.createValidationResult('identification', 'gender', expected, actual);
  }

  private validateCitizenship(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult(
        'identification',
        'citizenship',
        expected,
        actual,
        'MISSING_DATA',
        'Citizenship is missing from actual data'
      );
    }

    if (expected !== actual) {
      return this.createValidationResult(
        'identification',
        'citizenship',
        expected,
        actual,
        'DATA_MISMATCH',
        'Citizenship does not match golden dataset'
      );
    }

    return this.createValidationResult('identification', 'citizenship', expected, actual);
  }

  private validateSources(expected: string[], actual: string[]): GoldenValidationResult {
    if (!actual || actual.length === 0) {
      return this.createValidationResult(
        'identification',
        'sources',
        expected,
        actual,
        'MISSING_DATA',
        'Sources are missing from actual data'
      );
    }

    const missingSources = expected.filter(s => !actual.includes(s));
    const extraSources = actual.filter(s => !expected.includes(s));

    if (missingSources.length > 0) {
      return this.createValidationResult(
        'identification',
        'sources',
        expected,
        actual,
        'MISSING_DATA',
        `Missing sources: ${missingSources.join(', ')}`
      );
    }

    if (extraSources.length > 0) {
      return this.createValidationResult(
        'identification',
        'sources',
        expected,
        actual,
        'EXTRA_DATA',
        `Extra sources found: ${extraSources.join(', ')}`
      );
    }

    return this.createValidationResult('identification', 'sources', expected, actual);
  }

  private checkForExtraFields(golden: any, actual: any, results: GoldenValidationResult[]): void {
    const goldenFields = Object.keys(golden);
    const actualFields = Object.keys(actual);
    const extraFields = actualFields.filter(f => !goldenFields.includes(f));

    for (const field of extraFields) {
      results.push(this.createValidationResult(
        'identification',
        field,
        undefined,
        actual[field],
        'EXTRA_DATA',
        `Extra field found in actual data: ${field}`
      ));
    }
  }
}
