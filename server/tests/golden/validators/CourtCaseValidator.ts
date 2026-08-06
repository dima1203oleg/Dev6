/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Court Case Validator
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult } from '../types';

export class CourtCaseValidator extends BaseGoldenValidator {
  async validateCourtCases(actualCases: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];
    const goldenCases = this.goldenDataset.court_cases;

    if (!actualCases) {
      results.push(this.createValidationResult(
        'court_cases',
        'cases_array',
        goldenCases,
        null,
        'MISSING_DATA',
        'Court cases array is missing from actual data'
      ));
      return results;
    }

    // Check for missing cases
    for (const goldenCase of goldenCases) {
      const actualCase = actualCases.find(c => 
        c.record_id === goldenCase.record_id || 
        (c.case_number === goldenCase.case_number && c.court === goldenCase.court)
      );

      if (!actualCase) {
        results.push(this.createValidationResult(
          'court_cases',
          `case_${goldenCase.case_number}`,
          goldenCase,
          null,
          'MISSING_DATA',
          `Court case ${goldenCase.case_number} is missing from actual data`,
          goldenCase.source
        ));
      } else {
        results.push(...this.validateSingleCase(goldenCase, actualCase));
      }
    }

    // Check for extra cases
    for (const actualCase of actualCases) {
      const goldenCase = goldenCases.find(g => 
        g.record_id === actualCase.record_id || 
        (g.case_number === actualCase.case_number && g.court === actualCase.court)
      );

      if (!goldenCase) {
        results.push(this.createValidationResult(
          'court_cases',
          `case_${actualCase.case_number}`,
          null,
          actualCase,
          'EXTRA_DATA',
          `Extra court case found: ${actualCase.case_number}`,
          actualCase.source
        ));
      }
    }

    return results;
  }

  private validateSingleCase(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validateCaseNumber(golden.case_number, actual.case_number));
    results.push(this.validateCaseDate(golden.case_date, actual.case_date));
    results.push(this.validateCourt(golden.court, actual.court));
    results.push(this.validateRole(golden.role, actual.role));
    results.push(this.validateCaseType(golden.case_type, actual.case_type));
    results.push(this.validateStatus(golden.status, actual.status));
    results.push(this.validateSource(golden.source, actual.source));
    results.push(this.validateRecordId(golden.record_id, actual.record_id));

    return results;
  }

  private validateCaseNumber(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('court_cases', 'case_number', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('court_cases', 'case_number', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('court_cases', 'case_number', expected, actual);
  }

  private validateCaseDate(expected: Date, actual: Date | string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('court_cases', 'case_date', expected, actual, 'MISSING_DATA');
    }

    const actualDate = actual instanceof Date ? actual : new Date(actual);
    
    if (isNaN(actualDate.getTime())) {
      return this.createValidationResult('court_cases', 'case_date', expected, actual, 'TECHNICAL_ERROR');
    }

    const expectedTime = expected.getTime();
    const actualTime = actualDate.getTime();

    if (Math.abs(expectedTime - actualTime) > 86400000) {
      return this.createValidationResult('court_cases', 'case_date', expected, actual, 'DATA_MISMATCH');
    }

    return this.createValidationResult('court_cases', 'case_date', expected, actual);
  }

  private validateCourt(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('court_cases', 'court', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('court_cases', 'court', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('court_cases', 'court', expected, actual);
  }

  private validateRole(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('court_cases', 'role', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('court_cases', 'role', expected, actual, 'DATA_MISMATCH');
    }

    const validRoles = ['PLAINTIFF', 'DEFENDANT', 'WITNESS', 'OTHER'];
    if (!validRoles.includes(actual)) {
      return this.createValidationResult('court_cases', 'role', expected, actual, 'TECHNICAL_ERROR', 'Invalid role value');
    }

    return this.createValidationResult('court_cases', 'role', expected, actual);
  }

  private validateCaseType(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('court_cases', 'case_type', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('court_cases', 'case_type', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('court_cases', 'case_type', expected, actual);
  }

  private validateStatus(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('court_cases', 'status', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('court_cases', 'status', expected, actual, 'DATA_MISMATCH');
    }

    const validStatuses = ['OPEN', 'CLOSED', 'ARCHIVED'];
    if (!validStatuses.includes(actual)) {
      return this.createValidationResult('court_cases', 'status', expected, actual, 'TECHNICAL_ERROR', 'Invalid status value');
    }

    return this.createValidationResult('court_cases', 'status', expected, actual);
  }

  private validateSource(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('court_cases', 'source', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('court_cases', 'source', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('court_cases', 'source', expected, actual);
  }

  private validateRecordId(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('court_cases', 'record_id', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('court_cases', 'record_id', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('court_cases', 'record_id', expected, actual);
  }
}
