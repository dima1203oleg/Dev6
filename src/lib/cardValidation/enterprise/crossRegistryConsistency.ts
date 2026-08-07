/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Cross Registry Consistency Validator
 * BLOCK 6 - Most Critical
 */

import { ConflictDetection, ConflictResolution, RegistrySource } from './types';

export class CrossRegistryConsistencyValidator {
  /**
   * Validate consistency across multiple registries for a field
   */
  static validateFieldConsistency(
    fieldName: string,
    sources: RegistrySource[]
  ): ConflictDetection {
    if (sources.length === 0) {
      return {
        fieldName,
        sources: [],
        hasConflict: false,
        conflictType: 'MISSING_FIELD',
        resolution: {
          winner: '',
          reason: 'No data available',
          priority: 0,
          confidence: 0,
          requiresManualReview: true,
        },
      };
    }

    if (sources.length === 1) {
      return {
        fieldName,
        sources,
        hasConflict: false,
        conflictType: 'VALUE_MISMATCH',
        resolution: {
          winner: sources[0].registry,
          reason: 'Single source - no conflict',
          priority: 1,
          confidence: sources[0].confidence,
          requiresManualReview: false,
        },
      };
    }

    // Check for value conflicts
    const uniqueValues = new Set(sources.map(s => JSON.stringify(s.value)));
    const hasValueConflict = uniqueValues.size > 1;

    if (!hasValueConflict) {
      // All sources agree - calculate combined confidence
      const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
      const highestConfidenceSource = sources.reduce((prev, current) => 
        prev.confidence > current.confidence ? prev : current
      );

      return {
        fieldName,
        sources,
        hasConflict: false,
        conflictType: 'VALUE_MISMATCH',
        resolution: {
          winner: highestConfidenceSource.registry,
          reason: `All ${sources.length} sources agree on value`,
          priority: 1,
          confidence: avgConfidence,
          requiresManualReview: false,
        },
      };
    }

    // Conflict detected - resolve based on priority
    const resolution = this.resolveConflict(fieldName, sources);

    return {
      fieldName,
      sources,
      hasConflict: true,
      conflictType: this.detectConflictType(sources),
      resolution,
    };
  }

  /**
   * Detect type of conflict
   */
  private static detectConflictType(sources: RegistrySource[]): 'VALUE_MISMATCH' | 'TIMESTAMP_MISMATCH' | 'STRUCTURE_MISMATCH' | 'MISSING_FIELD' {
    const values = sources.map(s => s.value);
    
    // Check for timestamp conflicts
    const allDates = values.every(v => this.isDate(v));
    if (allDates) {
      const dateStrings = values.map(v => new Date(v as string).toISOString().split('T')[0]);
      if (new Set(dateStrings).size > 1) {
        return 'TIMESTAMP_MISMATCH';
      }
    }

    // Check for structure conflicts
    const allObjects = values.every(v => typeof v === 'object');
    if (allObjects) {
      const keys = values.map(v => Object.keys(v as object).sort().join(','));
      if (new Set(keys).size > 1) {
        return 'STRUCTURE_MISMATCH';
      }
    }

    return 'VALUE_MISMATCH';
  }

  /**
   * Resolve conflict using priority rules
   */
  private static resolveConflict(
    fieldName: string,
    sources: RegistrySource[]
  ): ConflictResolution {
    // Registry priority order (higher = more trusted)
    const registryPriority: Record<string, number> = {
      'EDR': 10,
      'COURT': 9,
      'TAX': 8,
      'SANCTIONS': 8,
      'PASSPORT': 9,
      'NOTARY': 7,
      'CKAN': 6,
      'OSINT': 5,
      'UNKNOWN': 1,
    };

    // Sort sources by priority and confidence
    const sortedSources = [...sources].sort((a, b) => {
      const priorityA = registryPriority[a.registry] || 1;
      const priorityB = registryPriority[b.registry] || 1;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      return b.confidence - a.confidence; // Higher confidence first
    });

    const winner = sortedSources[0];
    const requiresManualReview = this.requiresManualReview(fieldName, sources);

    return {
      winner: winner.registry,
      reason: this.generateResolutionReason(sortedSources),
      priority: registryPriority[winner.registry] || 1,
      confidence: winner.confidence,
      requiresManualReview,
    };
  }

  /**
   * Generate resolution reason
   */
  private static generateResolutionReason(sortedSources: RegistrySource[]): string {
    const winner = sortedSources[0];
    const totalSources = sortedSources.length;
    
    return `Selected ${winner.registry} (confidence: ${winner.confidence}%) from ${totalSources} sources based on registry priority and confidence score`;
  }

  /**
   * Determine if manual review is required
   */
  private static requiresManualReview(fieldName: string, sources: RegistrySource[]): boolean {
    // Critical fields always require manual review on conflict
    const criticalFields = ['fullName', 'rnokpp', 'edrpou', 'passport'];
    if (criticalFields.includes(fieldName)) {
      return true;
    }

    // High confidence difference requires review
    const confidences = sources.map(s => s.confidence);
    const maxConf = Math.max(...confidences);
    const minConf = Math.min(...confidences);
    
    if (maxConf - minConf > 30) {
      return true;
    }

    // Large number of conflicting sources requires review
    if (sources.length > 3) {
      return true;
    }

    return false;
  }

  /**
   * Check if value is a date
   */
  private static isDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * Validate all fields across registries
   */
  static validateAllFields(
    fieldData: Map<string, RegistrySource[]>
  ): ConflictDetection[] {
    const results: ConflictDetection[] = [];

    fieldData.forEach((sources, fieldName) => {
      const result = this.validateFieldConsistency(fieldName, sources);
      results.push(result);
    });

    return results;
  }

  /**
   * Get summary of conflicts
   */
  static getConflictSummary(conflicts: ConflictDetection[]): {
    totalFields: number;
    conflicts: number;
    manualReviewRequired: number;
    byType: Record<string, number>;
  } {
    const summary = {
      totalFields: conflicts.length,
      conflicts: 0,
      manualReviewRequired: 0,
      byType: {} as Record<string, number>,
    };

    conflicts.forEach(conflict => {
      if (conflict.hasConflict) {
        summary.conflicts++;
        
        if (conflict.resolution.requiresManualReview) {
          summary.manualReviewRequired++;
        }

        summary.byType[conflict.conflictType] = 
          (summary.byType[conflict.conflictType] || 0) + 1;
      }
    });

    return summary;
  }
}
