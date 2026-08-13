/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Evidence Coverage Calculator
 * BLOCK 10
 */

import { EvidenceCoverage, FieldAudit } from './types';

export class EvidenceCoverageCalculator {
  /**
   * Calculate evidence coverage for a card
   */
  static calculateCoverage(fields: FieldAudit[]): EvidenceCoverage {
    const totalFields = fields.length;
    
    if (totalFields === 0) {
      return {
        totalFields: 0,
        fieldsWithEvidence: 0,
        fieldsWithMultipleSources: 0,
        coveragePercentage: 0,
        multiSourcePercentage: 0,
        byRegistry: {},
      };
    }

    const fieldsWithEvidence = fields.filter(f =>
      f.status === 'VERIFIED' &&
      f.sourceId !== 'unknown' &&
      f.sourceId !== 'card_data'
    );

    const fieldsWithMultipleSources = this.calculateMultiSourceFields(fields);

    const coveragePercentage = Math.round((fieldsWithEvidence.length / totalFields) * 100);
    const multiSourcePercentage = Math.round((fieldsWithMultipleSources.length / totalFields) * 100);

    const byRegistry = this.groupByRegistry(fieldsWithEvidence);

    return {
      totalFields,
      fieldsWithEvidence: fieldsWithEvidence.length,
      fieldsWithMultipleSources: fieldsWithMultipleSources.length,
      coveragePercentage,
      multiSourcePercentage,
      byRegistry,
    };
  }

  /**
   * Calculate fields with multiple sources
   */
  private static calculateMultiSourceFields(fields: FieldAudit[]): FieldAudit[] {
    // Group by field name
    const fieldGroups = new Map<string, FieldAudit[]>();
    
    fields.forEach(field => {
      if (!fieldGroups.has(field.fieldName)) {
        fieldGroups.set(field.fieldName, []);
      }
      fieldGroups.get(field.fieldName)!.push(field);
    });

    // Find fields with multiple distinct sources
    const multiSourceFields: FieldAudit[] = [];
    
    fieldGroups.forEach((group, _fieldName) => {
      const uniqueSources = new Set(group.map(f => f.sourceId));
      if (uniqueSources.size >= 2) {
        // Return the field with highest confidence
        const bestField = group.reduce((prev, current) => 
          prev.confidenceScore > current.confidenceScore ? prev : current
        );
        multiSourceFields.push(bestField);
      }
    });

    return multiSourceFields;
  }

  /**
   * Group fields by registry
   */
  private static groupByRegistry(fields: FieldAudit[]): Record<string, number> {
    const byRegistry: Record<string, number> = {};

    fields.forEach(field => {
      const registry = field.registry || 'UNKNOWN';
      byRegistry[registry] = (byRegistry[registry] || 0) + 1;
    });

    return byRegistry;
  }

  /**
   * Calculate coverage across multiple cards
   */
  static calculateAggregateCoverage(
    cardCoverages: EvidenceCoverage[]
  ): EvidenceCoverage {
    const totalFields = cardCoverages.reduce((sum, c) => sum + c.totalFields, 0);
    const fieldsWithEvidence = cardCoverages.reduce((sum, c) => sum + c.fieldsWithEvidence, 0);
    const fieldsWithMultipleSources = cardCoverages.reduce((sum, c) => sum + c.fieldsWithMultipleSources, 0);

    const coveragePercentage = totalFields > 0 
      ? Math.round((fieldsWithEvidence / totalFields) * 100) 
      : 0;
    const multiSourcePercentage = totalFields > 0 
      ? Math.round((fieldsWithMultipleSources / totalFields) * 100) 
      : 0;

    const byRegistry: Record<string, number> = {};
    cardCoverages.forEach(coverage => {
      Object.entries(coverage.byRegistry).forEach(([registry, count]) => {
        byRegistry[registry] = (byRegistry[registry] || 0) + count;
      });
    });

    return {
      totalFields,
      fieldsWithEvidence,
      fieldsWithMultipleSources,
      coveragePercentage,
      multiSourcePercentage,
      byRegistry,
    };
  }

  /**
   * Check if coverage meets enterprise criteria
   */
  static meetsEnterpriseCriteria(coverage: EvidenceCoverage): {
    passes: boolean;
    details: {
      evidenceCoverage: boolean;
      multiSourceCoverage: boolean;
    };
  } {
    const evidenceCoverage = coverage.coveragePercentage >= 99;
    const multiSourceCoverage = coverage.multiSourcePercentage >= 95;

    return {
      passes: evidenceCoverage && multiSourceCoverage,
      details: {
        evidenceCoverage,
        multiSourceCoverage,
      },
    };
  }
}
