/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Enterprise Card Passport System
 * BLOCK 15
 */

import { EnterpriseCardPassport, FieldAudit, DataLineage } from './types';
import { DataLineageExplorer } from './dataLineage';

export class EnterpriseCardPassportGenerator {
  /**
   * Generate comprehensive passport for a card
   */
  static generatePassport(
    cardId: string,
    cardName: string,
    componentPath: string,
    route: string,
    fields: FieldAudit[],
    lineage?: DataLineage
  ): EnterpriseCardPassport {
    const now = new Date().toISOString();
    
    return {
      card: {
        id: cardId,
        name: cardName,
        owner: 'PREDATOR Analytics Team',
        version: '2.0.0',
        build: this.getBuildNumber(),
        route,
        component: componentPath,
      },
      health: {
        status: this.calculateHealthStatus(fields),
        score: this.calculateHealthScore(fields),
        latency: this.estimateLatency(),
        freshness: this.calculateFreshness(fields),
      },
      quality: {
        completeness: this.calculateCompleteness(fields),
        accuracy: this.calculateAccuracy(fields),
        consistency: this.calculateConsistency(fields),
      },
      security: {
        pii: this.containsPII(fields),
        encryption: 'AES-256',
        permissions: this.getRequiredPermissions(cardId),
      },
      performance: {
        render: this.estimateRenderTime(),
        api: this.estimateAPITime(),
        db: this.estimateDBTime(),
        graph: this.estimateGraphTime(),
      },
      evidence: {
        sources: this.extractSources(fields),
        hashes: this.extractHashes(fields),
        lineage: lineage || this.generateDefaultLineage(fields),
        confidence: this.calculateOverallConfidence(fields),
      },
      certification: {
        lastPass: this.getLastPassDate(),
        regression: this.getLastRegressionDate(),
        chaos: this.getLastChaosTestDate(),
        production: this.isProductionReady(fields),
      },
    };
  }

  /**
   * Calculate health status
   */
  private static calculateHealthStatus(fields: FieldAudit[]): 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' {
    const score = this.calculateHealthScore(fields);
    
    if (score >= 90) return 'HEALTHY';
    if (score >= 70) return 'DEGRADED';
    return 'UNHEALTHY';
  }

  /**
   * Calculate health score
   */
  private static calculateHealthScore(fields: FieldAudit[]): number {
    if (fields.length === 0) return 0;

    const verifiedFields = fields.filter(f => f.status === 'VERIFIED').length;
    const avgConfidence = fields.reduce((sum, f) => sum + f.confidenceScore, 0) / fields.length;

    const healthScore = (verifiedFields / fields.length) * 50 + (avgConfidence / 100) * 50;
    return Math.round(healthScore);
  }

  /**
   * Estimate latency (placeholder)
   */
  private static estimateLatency(): number {
    // In production, this would measure actual latency
    return 150; // ms
  }

  /**
   * Calculate freshness
   */
  private static calculateFreshness(fields: FieldAudit[]): number {
    if (fields.length === 0) return 0;

    const now = new Date();
    const ages = fields.map(f => {
      const retrieved = new Date(f.retrievedAt);
      const ageInHours = (now.getTime() - retrieved.getTime()) / (1000 * 60 * 60);
      return Math.max(0, 100 - ageInHours); // Decay over time
    });

    return Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
  }

  /**
   * Calculate completeness
   */
  private static calculateCompleteness(fields: FieldAudit[]): number {
    if (fields.length === 0) return 0;

    const filledFields = fields.filter(f => 
      f.value !== null && 
      f.value !== undefined && 
      f.value !== '' &&
      f.status !== 'MISSING'
    ).length;

    return Math.round((filledFields / fields.length) * 100);
  }

  /**
   * Calculate accuracy
   */
  private static calculateAccuracy(fields: FieldAudit[]): number {
    if (fields.length === 0) return 0;

    const verifiedFields = fields.filter(f => f.status === 'VERIFIED').length;
    return Math.round((verifiedFields / fields.length) * 100);
  }

  /**
   * Calculate consistency
   */
  private static calculateConsistency(fields: FieldAudit[]): number {
    if (fields.length === 0) return 0;

    const conflictFields = fields.filter(f => f.status === 'CONFLICT').length;
    const consistencyScore = 100 - (conflictFields / fields.length) * 100;
    return Math.round(Math.max(0, consistencyScore));
  }

  /**
   * Check if card contains PII
   */
  private static containsPII(fields: FieldAudit[]): boolean {
    const piiFields = ['fullName', 'rnokpp', 'passport', 'address', 'phone', 'email'];
    return fields.some(f => piiFields.includes(f.fieldName));
  }

  /**
   * Get required permissions for card
   */
  private static getRequiredPermissions(cardId: string): string[] {
    const basePermissions = ['entity.read'];
    
    const cardPermissions: Record<string, string[]> = {
      'sanctions': ['entity.read', 'source.read'],
      'tax': ['entity.read', 'source.read'],
      'court': ['entity.read', 'source.read'],
      'passport': ['entity.read'],
    };

    return cardPermissions[cardId] || basePermissions;
  }

  /**
   * Estimate render time
   */
  private static estimateRenderTime(): number {
    return 50; // ms
  }

  /**
   * Estimate API time
   */
  private static estimateAPITime(): number {
    return 80; // ms
  }

  /**
   * Estimate DB time
   */
  private static estimateDBTime(): number {
    return 20; // ms
  }

  /**
   * Estimate graph time
   */
  private static estimateGraphTime(): number {
    return 30; // ms
  }

  /**
   * Extract sources from fields
   */
  private static extractSources(fields: FieldAudit[]): string[] {
    const sources = new Set<string>();
    fields.forEach(f => {
      if (f.source && f.source !== 'unknown') {
        sources.add(f.source);
      }
      if (f.registry && f.registry !== 'UNKNOWN') {
        sources.add(f.registry);
      }
    });
    return Array.from(sources);
  }

  /**
   * Extract hashes from fields
   */
  private static extractHashes(fields: FieldAudit[]): Record<string, string> {
    const hashes: Record<string, string> = {};
    fields.forEach(f => {
      if (f.sha256Hash) {
        hashes[f.fieldName] = f.sha256Hash;
      }
    });
    return hashes;
  }

  /**
   * Generate default lineage
   */
  private static generateDefaultLineage(fields: FieldAudit[]): DataLineage {
    if (fields.length === 0) {
      return {
        fieldName: 'N/A',
        root: {
          id: 'empty',
          type: 'FIELD',
          name: 'Empty',
          data: null,
          timestamp: new Date().toISOString(),
          confidence: 0,
          status: 'INVALID',
        },
        totalNodes: 0,
        depth: 0,
        hasConflict: false,
      };
    }

    // Use first field as representative
    return DataLineageExplorer.buildLineage(fields[0].fieldName, fields[0]);
  }

  /**
   * Calculate overall confidence
   */
  private static calculateOverallConfidence(fields: FieldAudit[]): number {
    if (fields.length === 0) return 0;
    
    const totalConfidence = fields.reduce((sum, f) => sum + f.confidenceScore, 0);
    return Math.round(totalConfidence / fields.length);
  }

  /**
   * Get last pass date
   */
  private static getLastPassDate(): string {
    // In production, this would query actual certification history
    return new Date().toISOString();
  }

  /**
   * Get last regression date
   */
  private static getLastRegressionDate(): string {
    // In production, this would query actual regression history
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  /**
   * Get last chaos test date
   */
  private static getLastChaosTestDate(): string {
    // In production, this would query actual chaos test history
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  /**
   * Check if card is production ready
   */
  private static isProductionReady(fields: FieldAudit[]): boolean {
    const healthScore = this.calculateHealthScore(fields);
    const completeness = this.calculateCompleteness(fields);
    const accuracy = this.calculateAccuracy(fields);

    return (
      healthScore >= 80 &&
      completeness >= 95 &&
      accuracy >= 99
    );
  }

  /**
   * Get build number
   */
  private static getBuildNumber(): string {
    // In production, this would come from build system
    return `BUILD-${Date.now()}`;
  }

  /**
   * Generate passport for multiple cards
   */
  static generatePassports(
    cards: Array<{
      id: string;
      name: string;
      componentPath: string;
      route: string;
      fields: FieldAudit[];
    }>
  ): EnterpriseCardPassport[] {
    return cards.map(card => 
      this.generatePassport(
        card.id,
        card.name,
        card.componentPath,
        card.route,
        card.fields
      )
    );
  }

  /**
   * Validate passport completeness
   */
  static validatePassport(passport: EnterpriseCardPassport): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!passport.card.id) issues.push('Missing card ID');
    if (!passport.card.name) issues.push('Missing card name');
    if (!passport.card.version) issues.push('Missing card version');
    if (passport.health.score < 70) issues.push(`Low health score: ${passport.health.score}%`);
    if (passport.quality.completeness < 95) issues.push(`Low completeness: ${passport.quality.completeness}%`);
    if (passport.quality.accuracy < 99) issues.push(`Low accuracy: ${passport.quality.accuracy}%`);
    if (!passport.certification.production) issues.push('Card not production ready');

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
