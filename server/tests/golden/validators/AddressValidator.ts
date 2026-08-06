/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Address Validator
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult } from '../types';

export class AddressValidator extends BaseGoldenValidator {
  async validateAddresses(actualAddresses: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];
    const goldenAddresses = this.goldenDataset.addresses;

    // Check if addresses array exists
    if (!actualAddresses) {
      results.push(this.createValidationResult(
        'addresses',
        'addresses_array',
        goldenAddresses,
        null,
        'MISSING_DATA',
        'Addresses array is missing from actual data'
      ));
      return results;
    }

    // Check for missing addresses
    for (const goldenAddr of goldenAddresses) {
      const actualAddr = actualAddresses.find(a => 
        a.record_id === goldenAddr.record_id || 
        (a.full_address === goldenAddr.full_address && a.type === goldenAddr.type)
      );

      if (!actualAddr) {
        results.push(this.createValidationResult(
          'addresses',
          `address_${goldenAddr.type}_${goldenAddr.record_id}`,
          goldenAddr,
          null,
          'MISSING_DATA',
          `Address of type ${goldenAddr.type} is missing from actual data`,
          goldenAddr.source
        ));
      } else {
        // Validate address fields
        results.push(...this.validateSingleAddress(goldenAddr, actualAddr));
      }
    }

    // Check for extra addresses
    for (const actualAddr of actualAddresses) {
      const goldenAddr = goldenAddresses.find(g => 
        g.record_id === actualAddr.record_id || 
        (g.full_address === actualAddr.full_address && g.type === actualAddr.type)
      );

      if (!goldenAddr) {
        results.push(this.createValidationResult(
          'addresses',
          `address_${actualAddr.type}_${actualAddr.record_id || 'unknown'}`,
          null,
          actualAddr,
          'EXTRA_DATA',
          `Extra address found in actual data: ${actualAddr.type}`,
          actualAddr.source
        ));
      }
    }

    return results;
  }

  private validateSingleAddress(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    // Validate address type
    results.push(this.validateAddressType(golden.type, actual.type));

    // Validate full address
    results.push(this.validateFullAddress(golden.full_address, actual.full_address));

    // Validate postal code
    results.push(this.validatePostalCode(golden.postal_code, actual.postal_code));

    // Validate region
    results.push(this.validateRegion(golden.region, actual.region));

    // Validate city
    results.push(this.validateCity(golden.city, actual.city));

    // Validate street
    results.push(this.validateStreet(golden.street, actual.street));

    // Validate house number
    results.push(this.validateHouseNumber(golden.house_number, actual.house_number));

    // Validate apartment
    if (golden.apartment) {
      results.push(this.validateApartment(golden.apartment, actual.apartment));
    }

    // Validate period
    if (golden.period) {
      results.push(this.validatePeriod(golden.period, actual.period));
    }

    // Validate source
    results.push(this.validateSource(golden.source, actual.source));

    // Validate record_id
    results.push(this.validateRecordId(golden.record_id, actual.record_id));

    // Validate verified status
    results.push(this.validateVerified(golden.verified, actual.verified));

    return results;
  }

  private validateAddressType(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'type', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'type', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'type', expected, actual);
  }

  private validateFullAddress(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'full_address', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'full_address', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'full_address', expected, actual);
  }

  private validatePostalCode(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'postal_code', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'postal_code', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'postal_code', expected, actual);
  }

  private validateRegion(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'region', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'region', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'region', expected, actual);
  }

  private validateCity(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'city', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'city', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'city', expected, actual);
  }

  private validateStreet(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'street', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'street', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'street', expected, actual);
  }

  private validateHouseNumber(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'house_number', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'house_number', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'house_number', expected, actual);
  }

  private validateApartment(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'apartment', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'apartment', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'apartment', expected, actual);
  }

  private validatePeriod(expected: any, actual: any): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'period', expected, actual, 'MISSING_DATA');
    }
    
    const expectedFrom = new Date(expected.from).getTime();
    const actualFrom = new Date(actual.from).getTime();
    
    if (Math.abs(expectedFrom - actualFrom) > 86400000) {
      return this.createValidationResult('addresses', 'period.from', expected.from, actual.from, 'DATA_MISMATCH');
    }

    if (expected.to && actual.to) {
      const expectedTo = new Date(expected.to).getTime();
      const actualTo = new Date(actual.to).getTime();
      if (Math.abs(expectedTo - actualTo) > 86400000) {
        return this.createValidationResult('addresses', 'period.to', expected.to, actual.to, 'DATA_MISMATCH');
      }
    }

    return this.createValidationResult('addresses', 'period', expected, actual);
  }

  private validateSource(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'source', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'source', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'source', expected, actual);
  }

  private validateRecordId(expected: string, actual: string): GoldenValidationResult {
    if (!actual) {
      return this.createValidationResult('addresses', 'record_id', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'record_id', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'record_id', expected, actual);
  }

  private validateVerified(expected: boolean, actual: boolean): GoldenValidationResult {
    if (actual === undefined || actual === null) {
      return this.createValidationResult('addresses', 'verified', expected, actual, 'MISSING_DATA');
    }
    if (expected !== actual) {
      return this.createValidationResult('addresses', 'verified', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('addresses', 'verified', expected, actual);
  }

  async validateAddressConflicts(actualAddresses: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];

    // Check for address conflicts in actual data
    const addressMap = new Map<string, any[]>();
    
    for (const addr of actualAddresses) {
      const key = addr.full_address;
      if (!addressMap.has(key)) {
        addressMap.set(key, []);
      }
      addressMap.get(key)!.push(addr);
    }

    for (const [address, addresses] of addressMap) {
      if (addresses.length > 1) {
        results.push(this.createValidationResult(
          'addresses',
          'address_conflict',
          null,
          { address, count: addresses.length },
          'DATA_MISMATCH',
          `Address conflict detected: ${address} appears ${addresses.length} times`
        ));
      }
    }

    return results;
  }
}
