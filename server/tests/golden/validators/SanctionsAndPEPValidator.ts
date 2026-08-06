/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Sanctions and PEP Validator
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult } from '../types';

export class SanctionsAndPEPValidator extends BaseGoldenValidator {
  async validateSanctions(actualSanctions: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];
    const goldenSanctions = this.goldenDataset.sanctions;

    if (!actualSanctions) {
      results.push(this.createValidationResult(
        'sanctions',
        'sanctions_array',
        goldenSanctions,
        null,
        'MISSING_DATA',
        'Sanctions array is missing from actual data'
      ));
      return results;
    }

    // Check for missing sanctions
    for (const goldenSanction of goldenSanctions) {
      const actualSanction = actualSanctions.find(s => 
        s.record_id === goldenSanction.record_id || 
        (s.sanction_list === goldenSanction.sanction_list && s.sanction_type === goldenSanction.sanction_type)
      );

      if (!actualSanction) {
        results.push(this.createValidationResult(
          'sanctions',
          `sanction_${goldenSanction.sanction_list}_${goldenSanction.sanction_type}`,
          goldenSanction,
          null,
          'MISSING_DATA',
          `Sanction from ${goldenSanction.sanction_list} is missing from actual data`,
          goldenSanction.source
        ));
      } else {
        results.push(...this.validateSingleSanction(goldenSanction, actualSanction));
      }
    }

    // Check for extra sanctions
    for (const actualSanction of actualSanctions) {
      const goldenSanction = goldenSanctions.find(g => 
        g.record_id === actualSanction.record_id || 
        (g.sanction_list === actualSanction.sanction_list && g.sanction_type === actualSanction.sanction_type)
      );

      if (!goldenSanction) {
        results.push(this.createValidationResult(
          'sanctions',
          `sanction_${actualSanction.sanction_list}_${actualSanction.sanction_type}`,
          null,
          actualSanction,
          'EXTRA_DATA',
          `Extra sanction found: ${actualSanction.sanction_list}`,
          actualSanction.source
        ));
      }
    }

    return results;
  }

  private validateSingleSanction(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validateSanctionList(golden.sanction_list, actual.sanction_list));
    results.push(this.validateSanctionType(golden.sanction_type, actual.sanction_type));
    results.push(this.validateEffectiveDate(golden.effective_date, actual.effective_date));
    results.push(this.validateSource(golden.source, actual.source));
    results.push(this.validateRecordId(golden.record_id, actual.record_id));
    results.push(this.validateNotes(golden.notes, actual.notes));

    return results;
  }

  private validateSanctionList(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('sanctions', 'sanction_list', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('sanctions', 'sanction_list', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('sanctions', 'sanction_list', expected, actual);
  }

  private validateSanctionType(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('sanctions', 'sanction_type', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('sanctions', 'sanction_type', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('sanctions', 'sanction_type', expected, actual);
  }

  private validateEffectiveDate(expected: Date, actual: Date | string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('sanctions', 'effective_date', expected, actual, 'MISSING_DATA');
    }

    const actualDate = actual instanceof Date ? actual : new Date(actual);
    
    if (isNaN(actualDate.getTime())) {
      return this.createValidationResult('sanctions', 'effective_date', expected, actual, 'TECHNICAL_ERROR');
    }

    const expectedTime = expected.getTime();
    const actualTime = actualDate.getTime();

    if (Math.abs(expectedTime - actualTime) > 86400000) {
      return this.createValidationResult('sanctions', 'effective_date', expected, actual, 'DATA_MISMATCH');
    }

    return this.createValidationResult('sanctions', 'effective_date', expected, actual);
  }

  private validateSource(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('sanctions', 'source', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('sanctions', 'source', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('sanctions', 'source', expected, actual);
  }

  private validateRecordId(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('sanctions', 'record_id', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('sanctions', 'record_id', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('sanctions', 'record_id', expected, actual);
  }

  private validateNotes(expected: string | undefined, actual: string | undefined): GoldenValidationResult {
    if (expected && !actual) {
      return this.createValidationResult('sanctions', 'notes', expected, actual, 'MISSING_DATA');
    }
    if (expected && actual && expected !== actual) {
      return this.createValidationResult('sanctions', 'notes', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('sanctions', 'notes', expected, actual);
  }

  async validatePEPRecords(actualPEPRecords: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];
    const goldenPEPRecords = this.goldenDataset.pep_records;

    if (!actualPEPRecords) {
      results.push(this.createValidationResult(
        'pep_records',
        'pep_records_array',
        goldenPEPRecords,
        null,
        'MISSING_DATA',
        'PEP records array is missing from actual data'
      ));
      return results;
    }

    // Check for missing PEP records
    for (const goldenPEP of goldenPEPRecords) {
      const actualPEP = actualPEPRecords.find(p => 
        p.record_id === goldenPEP.record_id || 
        (p.pep_list === goldenPEP.pep_list && p.position === goldenPEP.position)
      );

      if (!actualPEP) {
        results.push(this.createValidationResult(
          'pep_records',
          `pep_${goldenPEP.pep_list}_${goldenPEP.position}`,
          goldenPEP,
          null,
          'MISSING_DATA',
          `PEP record from ${goldenPEP.pep_list} is missing from actual data`,
          goldenPEP.source
        ));
      } else {
        results.push(...this.validateSinglePEPRecord(goldenPEP, actualPEP));
      }
    }

    // Check for extra PEP records
    for (const actualPEP of actualPEPRecords) {
      const goldenPEP = goldenPEPRecords.find(g => 
        g.record_id === actualPEP.record_id || 
        (g.pep_list === actualPEP.pep_list && g.position === actualPEP.position)
      );

      if (!goldenPEP) {
        results.push(this.createValidationResult(
          'pep_records',
          `pep_${actualPEP.pep_list}_${actualPEP.position}`,
          null,
          actualPEP,
          'EXTRA_DATA',
          `Extra PEP record found: ${actualPEP.pep_list}`,
          actualPEP.source
        ));
      }
    }

    return results;
  }

  private validateSinglePEPRecord(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validatePEPList(golden.pep_list, actual.pep_list));
    results.push(this.validatePosition(golden.position, actual.position));
    results.push(this.validateCountry(golden.country, actual.country));
    results.push(this.validatePEPEffectiveDate(golden.effective_date, actual.effective_date));
    results.push(this.validatePEPSource(golden.source, actual.source));
    results.push(this.validatePEPRecordId(golden.record_id, actual.record_id));

    return results;
  }

  private validatePEPList(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('pep_records', 'pep_list', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('pep_records', 'pep_list', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('pep_records', 'pep_list', expected, actual);
  }

  private validatePosition(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('pep_records', 'position', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('pep_records', 'position', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('pep_records', 'position', expected, actual);
  }

  private validateCountry(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('pep_records', 'country', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('pep_records', 'country', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('pep_records', 'country', expected, actual);
  }

  private validatePEPEffectiveDate(expected: Date, actual: Date | string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('pep_records', 'effective_date', expected, actual, 'MISSING_DATA');
    }

    const actualDate = actual instanceof Date ? actual : new Date(actual);
    
    if (isNaN(actualDate.getTime())) {
      return this.createValidationResult('pep_records', 'effective_date', expected, actual, 'TECHNICAL_ERROR');
    }

    const expectedTime = expected.getTime();
    const actualTime = actualDate.getTime();

    if (Math.abs(expectedTime - actualTime) > 86400000) {
      return this.createValidationResult('pep_records', 'effective_date', expected, actual, 'DATA_MISMATCH');
    }

    return this.createValidationResult('pep_records', 'effective_date', expected, actual);
  }

  private validatePEPSource(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('pep_records', 'source', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('pep_records', 'source', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('pep_records', 'source', expected, actual);
  }

  private validatePEPRecordId(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('pep_records', 'record_id', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('pep_records', 'record_id', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('pep_records', 'record_id', expected, actual);
  }
}
