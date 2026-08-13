/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Registry Data Change Handler
 */

import { BaseGoldenValidator } from '../BaseGoldenValidator';
import { GoldenValidationResult, RegistryChange } from '../types';

export class RegistryChangeHandler extends BaseGoldenValidator {
  async detectRegistryChanges(
    validationResults: GoldenValidationResult[]
  ): Promise<RegistryChange[]> {
    const changes: RegistryChange[] = [];

    for (const result of validationResults) {
      if (!result.match && this.isLikelyRegistryChange(result)) {
        const change = this.createRegistryChange(result);
        if (change) {
          changes.push(change);
        }
      }
    }

    return changes;
  }

  private isLikelyRegistryChange(result: GoldenValidationResult): boolean {
    // Determine if a mismatch is likely due to registry data change vs technical error
    const category = result.category;
    const fieldName = result.field_name;
    const discrepancyType = result.discrepancy_type;

    // Technical errors are not registry changes
    if (discrepancyType === 'TECHNICAL_ERROR') {
      return false;
    }

    // Missing data is not a registry change (unless previously existed)
    if (discrepancyType === 'MISSING_DATA') {
      return false;
    }

    // Extra data is not a registry change
    if (discrepancyType === 'EXTRA_DATA') {
      return false;
    }

    // Data mismatches in certain categories are more likely to be registry changes
    const changeProneCategories = [
      'court_cases',
      'enforcement_proceedings',
      'sanctions',
      'pep_records',
      'business_relationships'
    ];

    if (changeProneCategories.includes(category)) {
      return true;
    }

    // Specific field names that are prone to change
    const changeProneFields = [
      'status',
      'effective_date',
      'expiry_date',
      'debt_amount',
      'case_number',
      'proceeding_number',
      'role',
      'period'
    ];

    if (changeProneFields.some(field => fieldName.includes(field))) {
      return true;
    }

    // Check if the difference is significant (not just format)
    if (this.isSignificantValueChange(result.expected, result.actual)) {
      return true;
    }

    return false;
  }

  private isSignificantValueChange(expected: any, actual: any): boolean {
    // Check if the change is significant enough to be a registry change
    if (expected === actual) {
      return false;
    }

    // Format differences are not significant changes
    if (this.isFormatDifference(expected, actual)) {
      return false;
    }

    // Small numeric differences might be rounding errors
    if (typeof expected === 'number' && typeof actual === 'number') {
      const relativeDiff = Math.abs(expected - actual) / Math.max(Math.abs(expected), 1);
      if (relativeDiff < 0.01) {
        return false; // Less than 1% difference
      }
    }

    // Date differences within a day might be timezone issues
    if (expected instanceof Date && actual instanceof Date) {
      const diffMs = Math.abs(expected.getTime() - actual.getTime());
      if (diffMs < 86400000) {
        return false;
      }
    }

    return true;
  }

  private isFormatDifference(expected: any, actual: any): boolean {
    // Check if difference is just format
    if (typeof expected === 'string' && typeof actual === 'string') {
      if (expected.toLowerCase() === actual.toLowerCase()) {
        return true;
      }
      if (expected.trim() === actual.trim()) {
        return true;
      }
    }

    return false;
  }

  private createRegistryChange(result: GoldenValidationResult): RegistryChange | null {
    if (!result.source) {
      return null;
    }

    return {
      registry: result.source,
      field: result.field_name,
      previous_value: result.expected,
      new_value: result.actual,
      change_date: new Date(),
      verified: false
    };
  }

  async verifyRegistryChange(change: RegistryChange): Promise<boolean> {
    console.log(`[Registry Change Handler] Verifying change in ${change.registry} for field ${change.field}`);

    // Simulate verification process
    // In real implementation, this would:
    // 1. Query the registry directly
    // 2. Compare with current value
    // 3. Check official change logs
    // 4. Verify with registry officials if needed

    try {
      await this.delay(2000);

      // Simulate verification (in real implementation, actual verification would happen)
      const verified = await this.queryRegistryForVerification(change);

      if (verified) {
        this.recordRegistryChange(
          change.registry,
          change.field,
          change.previous_value,
          change.new_value,
          true
        );
      }

      return verified;
    } catch (error) {
      console.log(`[Registry Change Handler] Verification failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private async queryRegistryForVerification(_change: RegistryChange): Promise<boolean> {
    // Simulate registry query
    // In real implementation, this would query the actual registry
    return false; // Default to not verified
  }

  async updateGoldenDatasetForChange(_change: RegistryChange): Promise<boolean> {
    console.log(`[Registry Change Handler] Updating golden dataset for verified change`);

    // In real implementation, this would:
    // 1. Update the golden dataset file
    // 2. Add change metadata
    // 3. Version the dataset
    // 4. Notify stakeholders

    try {
      await this.delay(1000);
      console.log(`[Registry Change Handler] Golden dataset updated`);
      return true;
    } catch (error) {
      console.log(`[Registry Change Handler] Dataset update failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  async handleAllRegistryChanges(changes: RegistryChange[]): Promise<{
    verified: RegistryChange[];
    unverified: RegistryChange[];
    datasetUpdates: number;
  }> {
    const verified: RegistryChange[] = [];
    const unverified: RegistryChange[] = [];
    let datasetUpdates = 0;

    for (const change of changes) {
      const isVerified = await this.verifyRegistryChange(change);

      if (isVerified) {
        verified.push(change);
        const updated = await this.updateGoldenDatasetForChange(change);
        if (updated) {
          datasetUpdates++;
        }
      } else {
        unverified.push(change);
      }
    }

    return {
      verified,
      unverified,
      datasetUpdates
    };
  }

  async trackChangeHistory(_ipn: string): Promise<RegistryChange[]> {
    // In real implementation, this would load change history from storage
    return this.getRegistryChanges();
  }

  async generateChangeReport(changes: RegistryChange[]): Promise<string> {
    let report = '# Registry Data Change Report\n\n';
    report += `IPN: ${this.testIPN}\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    if (changes.length === 0) {
      report += 'No registry changes detected.\n';
      return report;
    }

    report += `Total Changes Detected: ${changes.length}\n\n`;

    for (const change of changes) {
      report += `## Registry: ${change.registry}\n`;
      report += `- Field: ${change.field}\n`;
      report += `- Previous Value: ${JSON.stringify(change.previous_value)}\n`;
      report += `- New Value: ${JSON.stringify(change.new_value)}\n`;
      report += `- Change Date: ${change.change_date.toISOString()}\n`;
      report += `- Verified: ${change.verified ? 'Yes' : 'No'}\n\n`;
    }

    return report;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
