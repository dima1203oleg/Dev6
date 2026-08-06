/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Contact Validator
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult } from '../types';

export class ContactValidator extends BaseGoldenValidator {
  async validateContacts(actualContacts: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];
    const goldenContacts = this.goldenDataset.contacts;

    if (!actualContacts) {
      results.push(this.createValidationResult(
        'contacts',
        'contacts_array',
        goldenContacts,
        null,
        'MISSING_DATA',
        'Contacts array is missing from actual data'
      ));
      return results;
    }

    // Check for missing contacts
    for (const goldenContact of goldenContacts) {
      const actualContact = actualContacts.find(c => 
        c.record_id === goldenContact.record_id || 
        (c.value === goldenContact.value && c.type === goldenContact.type)
      );

      if (!actualContact) {
        results.push(this.createValidationResult(
          'contacts',
          `contact_${goldenContact.type}_${goldenContact.record_id}`,
          goldenContact,
          null,
          'MISSING_DATA',
          `Contact of type ${goldenContact.type} is missing from actual data`,
          goldenContact.source
        ));
      } else {
        results.push(...this.validateSingleContact(goldenContact, actualContact));
      }
    }

    // Check for extra contacts
    for (const actualContact of actualContacts) {
      const goldenContact = goldenContacts.find(g => 
        g.record_id === actualContact.record_id || 
        (g.value === actualContact.value && g.type === actualContact.type)
      );

      if (!goldenContact) {
        results.push(this.createValidationResult(
          'contacts',
          `contact_${actualContact.type}_${actualContact.record_id || 'unknown'}`,
          null,
          actualContact,
          'EXTRA_DATA',
          `Extra contact found in actual data: ${actualContact.type}`,
          actualContact.source
        ));
      }
    }

    return results;
  }

  private validateSingleContact(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validateContactType(golden.type, actual.type));
    results.push(this.validateContactValue(golden.value, actual.value));
    results.push(this.validateContactSource(golden.source, actual.source));
    results.push(this.validateContactRecordId(golden.record_id, actual.record_id));
    results.push(this.validateVerificationStatus(golden.verification_status, actual.verification_status));
    results.push(this.validateLastVerified(golden.last_verified, actual.last_verified));

    return results;
  }

  private validateContactType(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('contacts', 'type', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('contacts', 'type', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('contacts', 'type', expected, actual);
  }

  private validateContactValue(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('contacts', 'value', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('contacts', 'value', expected, actual, 'DATA_MISMATCH');
    }

    // Validate format based on type
    if (expected.startsWith('+380') || expected.startsWith('0')) {
      const phonePattern = /^\+?380\d{9}$|^0\d{9}$/;
      if (!phonePattern.test(actual)) {
        return this.createValidationResult('contacts', 'value', expected, actual, 'TECHNICAL_ERROR', 'Invalid phone format');
      }
    }

    if (expected.includes('@')) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(actual)) {
        return this.createValidationResult('contacts', 'value', expected, actual, 'TECHNICAL_ERROR', 'Invalid email format');
      }
    }

    return this.createValidationResult('contacts', 'value', expected, actual);
  }

  private validateContactSource(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('contacts', 'source', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('contacts', 'source', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('contacts', 'source', expected, actual);
  }

  private validateContactRecordId(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('contacts', 'record_id', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('contacts', 'record_id', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('contacts', 'record_id', expected, actual);
  }

  private validateVerificationStatus(expected: string, actual: string): GoldenValidationResult {
    if (actual === undefined || actual === null) {
      return this.createValidationResult('contacts', 'verification_status', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('contacts', 'verification_status', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('contacts', 'verification_status', expected, actual);
  }

  private validateLastVerified(expected: Date, actual: Date | string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('contacts', 'last_verified', expected, actual, 'MISSING_DATA');
    }

    const actualDate = actual instanceof Date ? actual : new Date(actual);
    
    if (isNaN(actualDate.getTime())) {
      return this.createValidationResult('contacts', 'last_verified', expected, actual, 'TECHNICAL_ERROR');
    }

    const expectedTime = expected.getTime();
    const actualTime = actualDate.getTime();

    if (Math.abs(expectedTime - actualTime) > 86400000) {
      return this.createValidationResult('contacts', 'last_verified', expected, actual, 'DATA_MISMATCH');
    }

    return this.createValidationResult('contacts', 'last_verified', expected, actual);
  }
}
