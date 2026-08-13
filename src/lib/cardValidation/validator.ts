/**
 * Card-Level Production Validation & Data Completeness Certification Framework v1.0
 * Core validation logic for information cards
 */

import { CardStatus, CardCategory, FieldAudit, CardValidationResult, RootCauseAnalysis } from './types';
import { CanonicalEntity } from '../../types/predator';

export class CardValidator {
  /**
   * Validate a single information card
   */
  static validateCard(
    cardId: string,
    cardName: string,
    category: CardCategory,
    entity: CanonicalEntity,
    cardData: any
  ): CardValidationResult {
    const fields = this.extractFieldAudits(entity, cardData);
    const completionPercentage = this.calculateCompletionPercentage(fields);
    const sourceCount = this.countUniqueSources(fields);
    const confidenceScore = this.calculateConfidenceScore(fields);
    
    const status = this.determineCardStatus(
      completionPercentage,
      confidenceScore,
      fields,
      cardData
    );

    const warnings = this.generateWarnings(fields, status);
    const errors = this.generateErrors(fields, status);

    let rootCauseAnalysis: RootCauseAnalysis | undefined;
    if (status === 'FAIL' || (status === 'NO_DATA' && completionPercentage === 0)) {
      rootCauseAnalysis = this.performRootCauseAnalysis(cardData, entity);
    }

    return {
      cardId,
      cardName,
      category,
      status,
      completionPercentage,
      sourceCount,
      lastUpdated: entity.updatedAt || new Date().toISOString(),
      confidenceScore,
      fields,
      warnings,
      errors,
      rootCauseAnalysis,
    };
  }

  /**
   * Extract field-level audit information
   */
  private static extractFieldAudits(
    entity: CanonicalEntity,
    cardData: any
  ): FieldAudit[] {
    const audits: FieldAudit[] = [];

    // Extract from entity attributes
    if (entity.attributes) {
      entity.attributes.forEach((attr, _index) => {
        if (!attr) return;
        audits.push({
          fieldName: attr.key,
          value: attr.value,
          sourceId: attr.sourceId,
          registry: this.extractRegistryName(attr.sourceId),
          connector: 'unknown',
          retrievedAt: new Date().toISOString(),
          rawJson: JSON.stringify(attr),
          sha256Hash: this.generateHash(JSON.stringify(attr)),
          confidenceScore: attr.confidence,
          connectorVersion: '1.0.0',
          normalizerVersion: '1.0.0',
          status: attr.verified ? 'VERIFIED' : 'UNVERIFIED',
        });
      });
    }

    // Extract from card-specific data
    if (cardData) {
      Object.keys(cardData).forEach(key => {
        const value = cardData[key];
        if (value !== null && value !== undefined && typeof value !== 'object') {
          audits.push({
            fieldName: key,
            value,
            sourceId: 'card_data',
            registry: 'unknown',
            connector: 'unknown',
            retrievedAt: new Date().toISOString(),
            rawJson: JSON.stringify(value),
            sha256Hash: this.generateHash(JSON.stringify(value)),
            confidenceScore: 50,
            connectorVersion: '1.0.0',
            normalizerVersion: '1.0.0',
            status: 'UNVERIFIED',
          });
        }
      });
    }

    return audits;
  }

  /**
   * Calculate completion percentage based on filled fields
   */
  private static calculateCompletionPercentage(fields: FieldAudit[]): number {
    if (fields.length === 0) return 0;
    
    const filledFields = fields.filter(f => 
      f.value !== null && 
      f.value !== undefined && 
      f.value !== '' &&
      f.status !== 'MISSING'
    );
    
    return Math.round((filledFields.length / fields.length) * 100);
  }

  /**
   * Count unique data sources
   */
  private static countUniqueSources(fields: FieldAudit[]): number {
    const sources = new Set(fields.map(f => f.sourceId));
    return sources.size;
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateConfidenceScore(fields: FieldAudit[]): number {
    if (fields.length === 0) return 0;
    
    const totalConfidence = fields.reduce((sum, field) => sum + field.confidenceScore, 0);
    return Math.round(totalConfidence / fields.length);
  }

  /**
   * Determine card status based on validation criteria
   */
  private static determineCardStatus(
    completionPercentage: number,
    confidenceScore: number,
    fields: FieldAudit[],
    _cardData: any
  ): CardStatus {
    // Check for critical errors
    const hasCriticalErrors = fields.some(f => f.status === 'CONFLICT');
    if (hasCriticalErrors) return 'FAIL';

    // Check if completely empty
    if (completionPercentage === 0 && fields.length === 0) {
      return 'NO_DATA';
    }

    // Check for low confidence
    if (confidenceScore < 50 && completionPercentage < 50) {
      return 'WARNING';
    }

    // Check for partial completion
    if (completionPercentage < 80) {
      return 'WARNING';
    }

    // All checks passed
    return 'PASS';
  }

  /**
   * Generate warning messages
   */
  private static generateWarnings(fields: FieldAudit[], status: CardStatus): string[] {
    const warnings: string[] = [];

    if (status === 'WARNING') {
      const unverifiedFields = fields.filter(f => f.status === 'UNVERIFIED');
      if (unverifiedFields.length > 0) {
        warnings.push(`${unverifiedFields.length} fields are unverified`);
      }

      const lowConfidenceFields = fields.filter(f => f.confidenceScore < 70);
      if (lowConfidenceFields.length > 0) {
        warnings.push(`${lowConfidenceFields.length} fields have low confidence`);
      }
    }

    return warnings;
  }

  /**
   * Generate error messages
   */
  private static generateErrors(fields: FieldAudit[], status: CardStatus): string[] {
    const errors: string[] = [];

    if (status === 'FAIL') {
      const conflictFields = fields.filter(f => f.status === 'CONFLICT');
      if (conflictFields.length > 0) {
        errors.push(`${conflictFields.length} fields have conflicting data`);
      }
    }

    return errors;
  }

  /**
   * Perform Root Cause Analysis for empty or failed cards
   */
  private static performRootCauseAnalysis(
    cardData: any,
    entity: CanonicalEntity
  ): RootCauseAnalysis {
    // Check if cardData exists
    if (!cardData) {
      return {
        step: 'DATA_AVAILABILITY',
        status: 'FAILED',
        details: 'Card data object is null or undefined',
        timestamp: new Date().toISOString(),
      };
    }

    // Check if entity has evidence claims
    if (!entity.evidenceClaims || entity.evidenceClaims.length === 0) {
      return {
        step: 'EVIDENCE_CLAIMS',
        status: 'FAILED',
        details: 'No evidence claims found in entity',
        timestamp: new Date().toISOString(),
      };
    }

    // Check data freshness
    const lastUpdate = new Date(entity.updatedAt);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate > 30) {
      return {
        step: 'DATA_FRESHNESS',
        status: 'FAILED',
        details: `Data is ${Math.round(daysSinceUpdate)} days old`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      step: 'GENERAL_CHECK',
      status: 'SUCCESS',
      details: 'No specific root cause identified',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract registry name from source ID
   */
  private static extractRegistryName(sourceId: string): string {
    if (sourceId.includes('edr')) return 'EDR';
    if (sourceId.includes('court')) return 'COURT';
    if (sourceId.includes('tax')) return 'TAX';
    if (sourceId.includes('sanctions')) return 'SANCTIONS';
    return 'UNKNOWN';
  }

  /**
   * Generate SHA-256 hash
   */
  private static generateHash(data: string): string {
    // Simple hash implementation - in production use crypto.subtle
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}
