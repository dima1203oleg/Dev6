/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Enforcement Proceeding Validator
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult } from '../types';

export class EnforcementProceedingValidator extends BaseGoldenValidator {
  async validateEnforcementProceedings(actualProceedings: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];
    const goldenProceedings = this.goldenDataset.enforcement_proceedings;

    if (!actualProceedings) {
      results.push(this.createValidationResult(
        'enforcement_proceedings',
        'proceedings_array',
        goldenProceedings,
        null,
        'MISSING_DATA',
        'Enforcement proceedings array is missing from actual data'
      ));
      return results;
    }

    // Check for missing proceedings
    for (const goldenProc of goldenProceedings) {
      const actualProc = actualProceedings.find(p => 
        p.record_id === goldenProc.record_id || 
        p.proceeding_number === goldenProc.proceeding_number
      );

      if (!actualProc) {
        results.push(this.createValidationResult(
          'enforcement_proceedings',
          `proceeding_${goldenProc.proceeding_number}`,
          goldenProc,
          null,
          'MISSING_DATA',
          `Enforcement proceeding ${goldenProc.proceeding_number} is missing from actual data`,
          goldenProc.source
        ));
      } else {
        results.push(...this.validateSingleProceeding(goldenProc, actualProc));
      }
    }

    // Check for extra proceedings
    for (const actualProc of actualProceedings) {
      const goldenProc = goldenProceedings.find(g => 
        g.record_id === actualProc.record_id || 
        g.proceeding_number === actualProc.proceeding_number
      );

      if (!goldenProc) {
        results.push(this.createValidationResult(
          'enforcement_proceedings',
          `proceeding_${actualProc.proceeding_number}`,
          null,
          actualProc,
          'EXTRA_DATA',
          `Extra enforcement proceeding found: ${actualProc.proceeding_number}`,
          actualProc.source
        ));
      }
    }

    return results;
  }

  private validateSingleProceeding(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validateProceedingNumber(golden.proceeding_number, actual.proceeding_number));
    results.push(this.validateStatus(golden.status, actual.status));
    results.push(this.validateDebtAmount(golden.debt_amount, actual.debt_amount));
    results.push(this.validateCreditor(golden.creditor, actual.creditor));
    results.push(this.validateSource(golden.source, actual.source));
    results.push(this.validateRecordId(golden.record_id, actual.record_id));
    results.push(this.validateLastUpdated(golden.last_updated, actual.last_updated));

    return results;
  }

  private validateProceedingNumber(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('enforcement_proceedings', 'proceeding_number', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('enforcement_proceedings', 'proceeding_number', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('enforcement_proceedings', 'proceeding_number', expected, actual);
  }

  private validateStatus(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('enforcement_proceedings', 'status', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('enforcement_proceedings', 'status', expected, actual, 'DATA_MISMATCH');
    }

    const validStatuses = ['OPEN', 'CLOSED', 'ARCHIVED'];
    if (!validStatuses.includes(actual)) {
      return this.createValidationResult('enforcement_proceedings', 'status', expected, actual, 'TECHNICAL_ERROR', 'Invalid status value');
    }

    return this.createValidationResult('enforcement_proceedings', 'status', expected, actual);
  }

  private validateDebtAmount(expected: number | undefined, actual: number | undefined): GoldenValidationResult {
    if (expected !== undefined && (actual === undefined || actual === null)) {
      return this.createValidationResult('enforcement_proceedings', 'debt_amount', expected, actual, 'MISSING_DATA');
    }
    if (expected !== undefined && actual !== undefined && expected !== actual) {
      return this.createValidationResult('enforcement_proceedings', 'debt_amount', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('enforcement_proceedings', 'debt_amount', expected, actual);
  }

  private validateCreditor(expected: string | undefined, actual: string | undefined): GoldenValidationResult {
    if (expected && !actual) {
      return this.createValidationResult('enforcement_proceedings', 'creditor', expected, actual, 'MISSING_DATA');
    }
    if (expected && actual && expected !== actual) {
      return this.createValidationResult('enforcement_proceedings', 'creditor', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('enforcement_proceedings', 'creditor', expected, actual);
  }

  private validateSource(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('enforcement_proceedings', 'source', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('enforcement_proceedings', 'source', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('enforcement_proceedings', 'source', expected, actual);
  }

  private validateRecordId(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('enforcement_proceedings', 'record_id', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('enforcement_proceedings', 'record_id', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('enforcement_proceedings', 'record_id', expected, actual);
  }

  private validateLastUpdated(expected: Date, actual: Date | string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('enforcement_proceedings', 'last_updated', expected, actual, 'MISSING_DATA');
    }

    const actualDate = actual instanceof Date ? actual : new Date(actual);
    
    if (isNaN(actualDate.getTime())) {
      return this.createValidationResult('enforcement_proceedings', 'last_updated', expected, actual, 'TECHNICAL_ERROR');
    }

    const expectedTime = expected.getTime();
    const actualTime = actualDate.getTime();

    if (Math.abs(expectedTime - actualTime) > 86400000) {
      return this.createValidationResult('enforcement_proceedings', 'last_updated', expected, actual, 'DATA_MISMATCH');
    }

    return this.createValidationResult('enforcement_proceedings', 'last_updated', expected, actual);
  }
}
