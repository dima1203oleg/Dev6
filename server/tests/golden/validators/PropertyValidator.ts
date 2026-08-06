/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Property Validator
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult } from '../types';

export class PropertyValidator extends BaseGoldenValidator {
  async validateProperty(actualProperty: any): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];
    const goldenProperty = this.goldenDataset.property;

    if (!actualProperty) {
      results.push(this.createValidationResult(
        'property',
        'property_object',
        goldenProperty,
        null,
        'MISSING_DATA',
        'Property object is missing from actual data'
      ));
      return results;
    }

    // Validate real estate
    if (actualProperty.real_estate) {
      results.push(...await this.validateRealEstate(goldenProperty.real_estate, actualProperty.real_estate));
    }

    // Validate vehicles
    if (actualProperty.vehicles) {
      results.push(...await this.validateVehicles(goldenProperty.vehicles, actualProperty.vehicles));
    }

    // Validate land plots
    if (actualProperty.land_plots) {
      results.push(...await this.validateLandPlots(goldenProperty.land_plots, actualProperty.land_plots));
    }

    // Validate licenses
    if (actualProperty.licenses) {
      results.push(...await this.validateLicenses(goldenProperty.licenses, actualProperty.licenses));
    }

    // Validate customs profile
    if (actualProperty.customs_profile) {
      results.push(...await this.validateCustomsProfile(goldenProperty.customs_profile, actualProperty.customs_profile));
    }

    return results;
  }

  private async validateRealEstate(golden: any[], actual: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];

    if (!actual) {
      results.push(this.createValidationResult(
        'property',
        'real_estate_array',
        golden,
        null,
        'MISSING_DATA',
        'Real estate array is missing'
      ));
      return results;
    }

    for (const goldenItem of golden) {
      const actualItem = actual.find(a => a.record_id === goldenItem.record_id || a.address === goldenItem.address);
      
      if (!actualItem) {
        results.push(this.createValidationResult(
          'property',
          `real_estate_${goldenItem.record_id}`,
          goldenItem,
          null,
          'MISSING_DATA',
          `Real estate property missing: ${goldenItem.address}`,
          goldenItem.source
        ));
      } else {
        results.push(...this.validateSingleRealEstate(goldenItem, actualItem));
      }
    }

    return results;
  }

  private validateSingleRealEstate(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validateRealEstateType(golden.type, actual.type));
    results.push(this.validateRealEstateAddress(golden.address, actual.address));
    results.push(this.validateRealEstateArea(golden.area, actual.area));
    results.push(this.validateOwnershipType(golden.ownership_type, actual.ownership_type));
    results.push(this.validateSource(golden.source, actual.source));
    results.push(this.validateRecordId(golden.record_id, actual.record_id));

    return results;
  }

  private validateRealEstateType(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'real_estate.type', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'real_estate.type', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'real_estate.type', expected, actual);
  }

  private validateRealEstateAddress(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'real_estate.address', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'real_estate.address', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'real_estate.address', expected, actual);
  }

  private validateRealEstateArea(expected: number | undefined, actual: number | undefined): GoldenValidationResult {
    if (expected !== undefined && (actual === undefined || actual === null)) {
      return this.createValidationResult('property', 'real_estate.area', expected, actual, 'MISSING_DATA');
    }
    if (expected !== undefined && actual !== undefined && Math.abs(expected - actual) > 0.1) {
      return this.createValidationResult('property', 'real_estate.area', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('property', 'real_estate.area', expected, actual);
  }

  private validateOwnershipType(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'ownership_type', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'ownership_type', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'ownership_type', expected, actual);
  }

  private async validateVehicles(golden: any[], actual: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];

    if (!actual) {
      results.push(this.createValidationResult('property', 'vehicles_array', golden, null, 'MISSING_DATA'));
      return results;
    }

    for (const goldenItem of golden) {
      const actualItem = actual.find(a => a.record_id === goldenItem.record_id || a.license_plate === goldenItem.license_plate);
      
      if (!actualItem) {
        results.push(this.createValidationResult(
          'property',
          `vehicle_${goldenItem.license_plate}`,
          goldenItem,
          null,
          'MISSING_DATA',
          `Vehicle missing: ${goldenItem.license_plate}`,
          goldenItem.source
        ));
      } else {
        results.push(...this.validateSingleVehicle(goldenItem, actualItem));
      }
    }

    return results;
  }

  private validateSingleVehicle(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validateVehicleType(golden.type, actual.type));
    results.push(this.validateVehicleMake(golden.make, actual.make));
    results.push(this.validateVehicleModel(golden.model, actual.model));
    results.push(this.validateVehicleYear(golden.year, actual.year));
    results.push(this.validateLicensePlate(golden.license_plate, actual.license_plate));
    results.push(this.validateVIN(golden.vin, actual.vin));
    results.push(this.validateSource(golden.source, actual.source));
    results.push(this.validateRecordId(golden.record_id, actual.record_id));

    return results;
  }

  private validateVehicleType(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'vehicle.type', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'vehicle.type', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'vehicle.type', expected, actual);
  }

  private validateVehicleMake(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'vehicle.make', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'vehicle.make', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'vehicle.make', expected, actual);
  }

  private validateVehicleModel(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'vehicle.model', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'vehicle.model', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'vehicle.model', expected, actual);
  }

  private validateVehicleYear(expected: number, actual: number): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'vehicle.year', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'vehicle.year', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'vehicle.year', expected, actual);
  }

  private validateLicensePlate(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'vehicle.license_plate', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'vehicle.license_plate', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'vehicle.license_plate', expected, actual);
  }

  private validateVIN(expected: string | undefined, actual: string | undefined): GoldenValidationResult {
    if (expected && !actual) return this.createValidationResult('property', 'vehicle.vin', expected, actual, 'MISSING_DATA');
    if (expected && actual && expected !== actual) return this.createValidationResult('property', 'vehicle.vin', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'vehicle.vin', expected, actual);
  }

  private async validateLandPlots(golden: any[], actual: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];

    if (!actual) {
      results.push(this.createValidationResult('property', 'land_plots_array', golden, null, 'MISSING_DATA'));
      return results;
    }

    for (const goldenItem of golden) {
      const actualItem = actual.find(a => a.record_id === goldenItem.record_id || a.cadastral_number === goldenItem.cadastral_number);
      
      if (!actualItem) {
        results.push(this.createValidationResult(
          'property',
          `land_plot_${goldenItem.cadastral_number}`,
          goldenItem,
          null,
          'MISSING_DATA',
          `Land plot missing: ${goldenItem.cadastral_number}`,
          goldenItem.source
        ));
      } else {
        results.push(...this.validateSingleLandPlot(goldenItem, actualItem));
      }
    }

    return results;
  }

  private validateSingleLandPlot(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validateCadastralNumber(golden.cadastral_number, actual.cadastral_number));
    results.push(this.validateLandArea(golden.area, actual.area));
    results.push(this.validateLandAddress(golden.address, actual.address));
    results.push(this.validateLandCategory(golden.category, actual.category));
    results.push(this.validateSource(golden.source, actual.source));
    results.push(this.validateRecordId(golden.record_id, actual.record_id));

    return results;
  }

  private validateCadastralNumber(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'land_plot.cadastral_number', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'land_plot.cadastral_number', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'land_plot.cadastral_number', expected, actual);
  }

  private validateLandArea(expected: number, actual: number): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'land_plot.area', expected, actual, 'MISSING_DATA');
    if (Math.abs(expected - actual) > 0.01) return this.createValidationResult('property', 'land_plot.area', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'land_plot.area', expected, actual);
  }

  private validateLandAddress(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'land_plot.address', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'land_plot.address', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'land_plot.address', expected, actual);
  }

  private validateLandCategory(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'land_plot.category', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'land_plot.category', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'land_plot.category', expected, actual);
  }

  private async validateLicenses(golden: any[], actual: any[]): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];

    if (!actual) {
      results.push(this.createValidationResult('property', 'licenses_array', golden, null, 'MISSING_DATA'));
      return results;
    }

    for (const goldenItem of golden) {
      const actualItem = actual.find(a => a.record_id === goldenItem.record_id || a.number === goldenItem.number);
      
      if (!actualItem) {
        results.push(this.createValidationResult(
          'property',
          `license_${goldenItem.number}`,
          goldenItem,
          null,
          'MISSING_DATA',
          `License missing: ${goldenItem.number}`,
          goldenItem.source
        ));
      } else {
        results.push(...this.validateSingleLicense(goldenItem, actualItem));
      }
    }

    return results;
  }

  private validateSingleLicense(golden: any, actual: any): GoldenValidationResult[] {
    const results: GoldenValidationResult[] = [];

    results.push(this.validateLicenseType(golden.type, actual.type));
    results.push(this.validateLicenseNumber(golden.number, actual.number));
    results.push(this.validateIssuedDate(golden.issued_date, actual.issued_date));
    results.push(this.validateExpiryDate(golden.expiry_date, actual.expiry_date));
    results.push(this.validateIssuingAuthority(golden.issuing_authority, actual.issuing_authority));
    results.push(this.validateSource(golden.source, actual.source));
    results.push(this.validateRecordId(golden.record_id, actual.record_id));

    return results;
  }

  private validateLicenseType(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'license.type', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'license.type', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'license.type', expected, actual);
  }

  private validateLicenseNumber(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'license.number', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'license.number', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'license.number', expected, actual);
  }

  private validateIssuedDate(expected: Date, actual: Date | string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'license.issued_date', expected, actual, 'MISSING_DATA');
    const actualDate = actual instanceof Date ? actual : new Date(actual);
    if (Math.abs(expected.getTime() - actualDate.getTime()) > 86400000) {
      return this.createValidationResult('property', 'license.issued_date', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('property', 'license.issued_date', expected, actual);
  }

  private validateExpiryDate(expected: Date | undefined, actual: Date | string | undefined): GoldenValidationResult {
    if (expected && !actual) return this.createValidationResult('property', 'license.expiry_date', expected, actual, 'MISSING_DATA');
    if (expected && actual) {
      const actualDate = actual instanceof Date ? actual : new Date(actual);
      if (Math.abs(expected.getTime() - actualDate.getTime()) > 86400000) {
        return this.createValidationResult('property', 'license.expiry_date', expected, actual, 'DATA_MISMATCH');
      }
    }
    return this.createValidationResult('property', 'license.expiry_date', expected, actual);
  }

  private validateIssuingAuthority(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'license.issuing_authority', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'license.issuing_authority', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'license.issuing_authority', expected, actual);
  }

  private async validateCustomsProfile(golden: any, actual: any): Promise<GoldenValidationResult[]> {
    const results: GoldenValidationResult[] = [];

    if (!actual) {
      results.push(this.createValidationResult('property', 'customs_profile', golden, null, 'MISSING_DATA'));
      return results;
    }

    results.push(this.validateRiskLevel(golden.risk_level, actual.risk_level));
    results.push(this.validateLastActivity(golden.last_activity, actual.last_activity));
    results.push(this.validateTotalImports(golden.total_imports, actual.total_imports));
    results.push(this.validateTotalExports(golden.total_exports, actual.total_exports));
    results.push(this.validateSource(golden.source, actual.source));
    results.push(this.validateRecordId(golden.record_id, actual.record_id));

    return results;
  }

  private validateRiskLevel(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'customs_profile.risk_level', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'customs_profile.risk_level', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'customs_profile.risk_level', expected, actual);
  }

  private validateLastActivity(expected: Date, actual: Date | string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'customs_profile.last_activity', expected, actual, 'MISSING_DATA');
    const actualDate = actual instanceof Date ? actual : new Date(actual);
    if (Math.abs(expected.getTime() - actualDate.getTime()) > 86400000) {
      return this.createValidationResult('property', 'customs_profile.last_activity', expected, actual, 'DATA_MISMATCH');
    }
    return this.createValidationResult('property', 'customs_profile.last_activity', expected, actual);
  }

  private validateTotalImports(expected: number | undefined, actual: number | undefined): GoldenValidationResult {
    if (expected !== undefined && actual === undefined) return this.createValidationResult('property', 'customs_profile.total_imports', expected, actual, 'MISSING_DATA');
    if (expected !== undefined && actual !== undefined && expected !== actual) return this.createValidationResult('property', 'customs_profile.total_imports', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'customs_profile.total_imports', expected, actual);
  }

  private validateTotalExports(expected: number | undefined, actual: number | undefined): GoldenValidationResult {
    if (expected !== undefined && actual === undefined) return this.createValidationResult('property', 'customs_profile.total_exports', expected, actual, 'MISSING_DATA');
    if (expected !== undefined && actual !== undefined && expected !== actual) return this.createValidationResult('property', 'customs_profile.total_exports', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'customs_profile.total_exports', expected, actual);
  }

  private validateSource(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'source', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'source', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'source', expected, actual);
  }

  private validateRecordId(expected: string, actual: string): GoldenValidationResult {
    if (!actual) return this.createValidationResult('property', 'record_id', expected, actual, 'MISSING_DATA');
    if (expected !== actual) return this.createValidationResult('property', 'record_id', expected, actual, 'DATA_MISMATCH');
    return this.createValidationResult('property', 'record_id', expected, actual);
  }
}
