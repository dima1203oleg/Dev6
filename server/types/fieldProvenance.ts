/**
 * Field-Level Provenance System
 * 
 * Tracks the complete provenance chain for each field value in an entity.
 * Every field value must have traceable evidence from source to final field.
 */

export interface FieldProvenance {
  fieldId: string;
  entityId: string;
  fieldName: string;
  value: any;
  normalizedValue: any;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  retrievedAt: string;
  sourceTimestamp?: string;
  validationStatus: ValidationStatus;
  confidence: number;
  evidenceId: string;
  rawResponseHash: string;
  provenanceChain: ProvenanceStep[];
}

export type SourceType = 
  | 'AUTHORITATIVE_PUBLIC'
  | 'AUTHORITATIVE_PRIVATE'
  | 'OFFICIAL_GOVERNMENT'
  | 'COMMERCIAL_API'
  | 'CROWDSOURCED'
  | 'USER_PROVIDED'
  | 'INFERRED';

export type ValidationStatus = 
  | 'VERIFIED'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'UNVERIFIED'
  | 'RESTRICTED'
  | 'INVALID';

export interface ProvenanceStep {
  step: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details?: string;
  hash?: string;
}

export interface FieldEvidence {
  evidenceId: string;
  fieldId: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  httpStatus: number;
  retrievedAt: string;
  rawResponse: any;
  rawResponseHash: string;
  schemaValidation: SchemaValidation;
  normalization: NormalizationResult;
}

export interface SchemaValidation {
  status: 'PASS' | 'FAIL' | 'WARNING';
  errors: string[];
  warnings: string[];
}

export interface NormalizationResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  originalValue: any;
  normalizedValue: any;
  transformations: Transformation[];
}

export interface Transformation {
  type: string;
  description: string;
  from: any;
  to: any;
}

export interface FieldConflict {
  fieldId: string;
  fieldName: string;
  conflictingValues: ConflictingValue[];
  resolutionStrategy?: 'MOST_RECENT' | 'HIGHEST_AUTHORITY' | 'MANUAL' | 'UNRESOLVED';
  resolvedValue?: any;
}

export interface ConflictingValue {
  value: any;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  retrievedAt: string;
  authority: number;
  confidence: number;
}

export interface ConfidenceFactors {
  sourceAuthority: number; // 0-100
  sourceFreshness: number; // 0-100
  crossSourceAgreement: number; // 0-100
  identifierMatch: number; // 0-100
  validationStatus: number; // 0-100
  conflictPenalty: number; // 0-100
  dataCompleteness: number; // 0-100
}

export interface FieldProvenanceQuery {
  entityId: string;
  fieldName?: string;
  sourceId?: string;
  validationStatus?: ValidationStatus;
  minConfidence?: number;
}

/**
 * Field Provenance Service
 * 
 * Manages the complete lifecycle of field provenance tracking.
 */
export class FieldProvenanceService {
  /**
   * Calculate confidence score based on multiple factors
   */
  static calculateConfidence(factors: ConfidenceFactors): number {
    const weights = {
      sourceAuthority: 0.3,
      sourceFreshness: 0.15,
      crossSourceAgreement: 0.2,
      identifierMatch: 0.15,
      validationStatus: 0.1,
      conflictPenalty: -0.1,
      dataCompleteness: 0.2,
    };

    let confidence = 0;
    confidence += factors.sourceAuthority * weights.sourceAuthority;
    confidence += factors.sourceFreshness * weights.sourceFreshness;
    confidence += factors.crossSourceAgreement * weights.crossSourceAgreement;
    confidence += factors.identifierMatch * weights.identifierMatch;
    confidence += factors.validationStatus * weights.validationStatus;
    confidence += factors.dataCompleteness * weights.dataCompleteness;
    confidence -= factors.conflictPenalty * Math.abs(weights.conflictPenalty);

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Build provenance chain from evidence to field
   */
  static buildProvenanceChain(evidence: FieldEvidence, field: string): ProvenanceStep[] {
    const chain: ProvenanceStep[] = [];
    const timestamp = new Date().toISOString();

    chain.push({
      step: 'SOURCE',
      timestamp,
      status: 'SUCCESS',
      details: `Data retrieved from ${evidence.sourceName}`,
    });

    chain.push({
      step: 'RAW_RESPONSE',
      timestamp,
      status: 'SUCCESS',
      details: `HTTP ${evidence.httpStatus} response received`,
      hash: evidence.rawResponseHash,
    });

    chain.push({
      step: 'SHA_256',
      timestamp,
      status: 'SUCCESS',
      details: 'Response hash calculated',
      hash: evidence.rawResponseHash,
    });

    chain.push({
      step: 'SCHEMA_VALIDATION',
      timestamp,
      status: evidence.schemaValidation.status === 'PASS' ? 'SUCCESS' : 'FAILURE',
      details: evidence.schemaValidation.errors.length > 0 
        ? `Errors: ${evidence.schemaValidation.errors.join(', ')}`
        : 'Schema validation passed',
    });

    chain.push({
      step: 'NORMALIZATION',
      timestamp,
      status: evidence.normalization.status === 'SUCCESS' ? 'SUCCESS' : 'WARNING',
      details: `${evidence.normalization.transformations.length} transformations applied`,
    });

    chain.push({
      step: 'ENTITY_RESOLUTION',
      timestamp,
      status: 'SUCCESS',
      details: 'Field mapped to entity',
    });

    chain.push({
      step: 'FIELD_ASSIGNMENT',
      timestamp,
      status: 'SUCCESS',
      details: `Value assigned to field: ${field}`,
    });

    return chain;
  }

  /**
   * Detect conflicts between multiple sources for the same field
   */
  static detectConflicts(provenanceRecords: FieldProvenance[]): FieldConflict[] {
    const fieldMap = new Map<string, FieldProvenance[]>();

    // Group by field name
    provenanceRecords.forEach(record => {
      const existing = fieldMap.get(record.fieldName) || [];
      existing.push(record);
      fieldMap.set(record.fieldName, existing);
    });

    const conflicts: FieldConflict[] = [];

    // Check each field for conflicts
    fieldMap.forEach((records, fieldName) => {
      if (records.length < 2) return; // No conflict with single source

      const uniqueValues = new Set(records.map(r => JSON.stringify(r.normalizedValue)));
      
      if (uniqueValues.size > 1) {
        const conflictingValues: ConflictingValue[] = records.map(record => ({
          value: record.normalizedValue,
          sourceId: record.sourceId,
          sourceName: record.sourceName,
          sourceType: record.sourceType,
          retrievedAt: record.retrievedAt,
          authority: this.getSourceAuthority(record.sourceType),
          confidence: record.confidence,
        }));

        if (conflictingValues.length === 0) {
          return;
        }

        const firstRecord = records[0];
        if (!firstRecord) return;

        conflicts.push({
          fieldId: firstRecord.fieldId,
          fieldName,
          conflictingValues,
          resolutionStrategy: 'UNRESOLVED',
        });
      }
    });

    return conflicts;
  }

  /**
   * Get authority score for source type
   */
  private static getSourceAuthority(sourceType: SourceType): number {
    const authorityMap: Record<SourceType, number> = {
      'AUTHORITATIVE_PUBLIC': 100,
      'AUTHORITATIVE_PRIVATE': 95,
      'OFFICIAL_GOVERNMENT': 90,
      'COMMERCIAL_API': 70,
      'CROWDSOURCED': 40,
      'USER_PROVIDED': 20,
      'INFERRED': 10,
    };
    return authorityMap[sourceType] || 50;
  }

  /**
   * Resolve conflict using specified strategy
   */
  static resolveConflict(
    conflict: FieldConflict,
    strategy: 'MOST_RECENT' | 'HIGHEST_AUTHORITY' | 'MANUAL'
  ): any {
    switch (strategy) {
      case 'MOST_RECENT':
        const mostRecent = conflict.conflictingValues.sort((a, b) => 
          new Date(b.retrievedAt).getTime() - new Date(a.retrievedAt).getTime()
        )[0];
        return mostRecent?.value;

      case 'HIGHEST_AUTHORITY':
        const highestAuthority = conflict.conflictingValues.sort((a, b) => 
          b.authority - a.authority
        )[0];
        return highestAuthority?.value;

      case 'MANUAL':
        return conflict.resolvedValue ?? null; // Must be set manually

      default:
        return null;
    }
  }
}
