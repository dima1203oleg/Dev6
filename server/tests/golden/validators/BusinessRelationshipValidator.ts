/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Business Relationship Validator
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult } from '../types';

export class BusinessRelationshipValidator extends BaseGoldenValidator {
  async validateBusinessRelationships(actualRelationships: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];
    const goldenRelationships = this.goldenDataset.business_relationships;

    if (!actualRelationships) {
      results.push(this.createValidationResult(
        'business_relationships',
        'relationships_array',
        goldenRelationships,
        null,
        'MISSING_DATA',
        'Business relationships array is missing from actual data'
      ));
      return results;
    }

    // Check for missing relationships
    for (const goldenRel of goldenRelationships) {
      const actualRel = actualRelationships.find(r => 
        r.record_id === goldenRel.record_id || 
        (r.company_edrpou === goldenRel.company_edrpou && r.role === goldenRel.role)
      );

      if (!actualRel) {
        results.push(this.createValidationResult(
          'business_relationships',
          `relationship_${goldenRel.company_edrpou}_${goldenRel.role}`,
          goldenRel,
          null,
          'MISSING_DATA',
          `Business relationship with ${goldenRel.company_name} as ${goldenRel.role} is missing`,
          goldenRel.source
        ));
      } else {
        results.push(...this.validateSingleRelationship(goldenRel, actualRel));
      }
    }

    // Check for extra relationships
    for (const actualRel of actualRelationships) {
      const goldenRel = goldenRelationships.find(g => 
        g.record_id === actualRel.record_id || 
        (g.company_edrpou === actualRel.company_edrpou && g.role === actualRel.role)
      );

      if (!goldenRel) {
        results.push(this.createValidationResult(
          'business_relationships',
          `relationship_${actualRel.company_edrpou}_${actualRel.role}`,
          null,
          actualRel,
          'EXTRA_DATA',
          `Extra business relationship found: ${actualRel.company_name} as ${actualRel.role}`,
          actualRel.source
        ));
      }
    }

    return results;
  }

  private validateSingleRelationship(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validateCompanyEdrpou(golden.company_edrpou, actual.company_edrpou));
    results.push(this.validateCompanyName(golden.company_name, actual.company_name));
    results.push(this.validateRole(golden.role, actual.role));
    results.push(this.validatePeriod(golden.period, actual.period));
    results.push(this.validateSource(golden.source, actual.source));
    results.push(this.validateRecordId(golden.record_id, actual.record_id));
    results.push(this.validateVerified(golden.verified, actual.verified));

    return results;
  }

  private validateCompanyEdrpou(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('business_relationships', 'company_edrpou', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('business_relationships', 'company_edrpou', expected, actual, 'DATA_MISMATCH');
    }

    // Validate EDRPOU format
    const edrpouPattern = /^\d{8}$/;
    if (!edrpouPattern.test(actual)) {
      return this.createValidationResult('business_relationships', 'company_edrpou', expected, actual, 'TECHNICAL_ERROR', 'Invalid EDRPOU format');
    }

    return this.createValidationResult('business_relationships', 'company_edrpou', expected, actual);
  }

  private validateCompanyName(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('business_relationships', 'company_name', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('business_relationships', 'company_name', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('business_relationships', 'company_name', expected, actual);
  }

  private validateRole(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('business_relationships', 'role', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('business_relationships', 'role', expected, actual, 'DATA_MISMATCH');
    }

    const validRoles = ['DIRECTOR', 'FOUNDER', 'UBO', 'OWNER', 'SIGNATORY', 'FORMER_ROLE'];
    if (!validRoles.includes(actual)) {
      return this.createValidationResult('business_relationships', 'role', expected, actual, 'TECHNICAL_ERROR', 'Invalid role value');
    }

    return this.createValidationResult('business_relationships', 'role', expected, actual);
  }

  private validatePeriod(expected: any, actual: any): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('business_relationships', 'period', expected, actual, 'MISSING_DATA');
    }

    const expectedFrom = new Date(expected.from).getTime();
    const actualFrom = new Date(actual.from).getTime();

    if (Math.abs(expectedFrom - actualFrom) > 86400000) {
      return this.createValidationResult('business_relationships', 'period.from', expected.from, actual.from, 'DATA_MISMATCH');
    }

    if (expected.to && actual.to) {
      const expectedTo = new Date(expected.to).getTime();
      const actualTo = new Date(actual.to).getTime();
      if (Math.abs(expectedTo - actualTo) > 86400000) {
        return this.createValidationResult('business_relationships', 'period.to', expected.to, actual.to, 'DATA_MISMATCH');
      }
    }

    return this.createValidationResult('business_relationships', 'period', expected, actual);
  }

  private validateSource(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('business_relationships', 'source', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('business_relationships', 'source', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('business_relationships', 'source', expected, actual);
  }

  private validateRecordId(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('business_relationships', 'record_id', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('business_relationships', 'record_id', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('business_relationships', 'record_id', expected, actual);
  }

  private validateVerified(expected: boolean, actual: boolean): GoldenValidationResult {
    if (actual === undefined || actual === null) {
      return this.createValidationResult('business_relationships', 'verified', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('business_relationships', 'verified', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('business_relationships', 'verified', expected, actual);
  }
}
