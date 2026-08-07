/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Temporal Validation for historical data
 * BLOCK 7
 */

import { TemporalValidation, TemporalRecord } from './types';

export class TemporalValidator {
  /**
   * Validate temporal consistency of a field
   */
  static validateTemporalConsistency(
    fieldName: string,
    history: TemporalRecord[]
  ): TemporalValidation {
    if (history.length === 0) {
      return {
        fieldName,
        history: [],
        hasGaps: false,
        hasInconsistencies: false,
        trend: 'STABLE',
      };
    }

    // Sort by timestamp
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const hasGaps = this.detectGaps(sortedHistory);
    const hasInconsistencies = this.detectInconsistencies(fieldName, sortedHistory);
    const trend = this.calculateTrend(sortedHistory);

    return {
      fieldName,
      history: sortedHistory,
      hasGaps,
      hasInconsistencies,
      trend,
    };
  }

  /**
   * Detect gaps in temporal history
   */
  private static detectGaps(history: TemporalRecord[]): boolean {
    if (history.length < 2) return false;

    const gaps: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const prev = new Date(history[i - 1].timestamp);
      const curr = new Date(history[i].timestamp);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      
      // Gap if more than 30 days between records
      if (diffDays > 30) {
        gaps.push(diffDays);
      }
    }

    return gaps.length > 0;
  }

  /**
   * Detect inconsistencies in temporal history
   */
  private static detectInconsistencies(fieldName: string, history: TemporalRecord[]): boolean {
    if (history.length < 2) return false;

    // Check for value inconsistencies
    const values = history.map(h => h.value);
    const uniqueValues = new Set(values.map(v => JSON.stringify(v)));

    // For some fields, value changes are expected
    const expectedToChange = ['status', 'position', 'address', 'phone'];
    if (expectedToChange.includes(fieldName)) {
      return false;
    }

    // For other fields, significant changes may indicate inconsistency
    if (uniqueValues.size > 2) {
      return true;
    }

    return false;
  }

  /**
   * Calculate trend in temporal data
   */
  private static calculateTrend(history: TemporalRecord[]): 'STABLE' | 'INCREASING' | 'DECREASING' | 'FLUCTUATING' {
    if (history.length < 2) return 'STABLE';

    const numericValues = history
      .map(h => typeof h.value === 'number' ? h.value : NaN)
      .filter(v => !isNaN(v));

    if (numericValues.length < 2) return 'STABLE';

    const changes: number[] = [];
    for (let i = 1; i < numericValues.length; i++) {
      changes.push(numericValues[i] - numericValues[i - 1]);
    }

    const positiveChanges = changes.filter(c => c > 0).length;
    const negativeChanges = changes.filter(c => c < 0).length;
    const zeroChanges = changes.filter(c => c === 0).length;

    if (zeroChanges / changes.length > 0.8) return 'STABLE';
    if (positiveChanges / changes.length > 0.7) return 'INCREASING';
    if (negativeChanges / changes.length > 0.7) return 'DECREASING';
    return 'FLUCTUATING';
  }

  /**
   * Build temporal history from field audits
   */
  static buildTemporalHistory(
    fieldName: string,
    fieldAudits: FieldAudit[]
  ): TemporalRecord[] {
    return fieldAudits.map(audit => ({
      timestamp: audit.retrievedAt,
      value: audit.value,
      source: audit.source,
      valid: audit.status === 'VERIFIED',
    }));
  }

  /**
   * Validate temporal integrity across multiple fields
   */
  static validateTemporalIntegrity(
    temporalValidations: TemporalValidation[]
  ): {
    valid: boolean;
    issues: string[];
    fieldsWithGaps: string[];
    fieldsWithInconsistencies: string[];
  } {
    const issues: string[] = [];
    const fieldsWithGaps: string[] = [];
    const fieldsWithInconsistencies: string[] = [];

    temporalValidations.forEach(validation => {
      if (validation.hasGaps) {
        fieldsWithGaps.push(validation.fieldName);
        issues.push(`Field "${validation.fieldName}" has temporal gaps`);
      }
      if (validation.hasInconsistencies) {
        fieldsWithInconsistencies.push(validation.fieldName);
        issues.push(`Field "${validation.fieldName}" has temporal inconsistencies`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      fieldsWithGaps,
      fieldsWithInconsistencies,
    };
  }
}
