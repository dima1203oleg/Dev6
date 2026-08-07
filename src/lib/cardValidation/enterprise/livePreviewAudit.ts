/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Live Preview Audit with real-time metrics
 * BLOCK 4
 */

import { LiveCardAudit, CardValidationResult } from './types';

export class LivePreviewAuditEngine {
  private static auditCache: Map<string, LiveCardAudit> = new Map();
  private static auditHistory: Map<string, Array<{ timestamp: string; score: number }>> = new Map();

  /**
   * Generate live audit for a card
   */
  static generateLiveAudit(
    validationResult: CardValidationResult,
    additionalMetrics?: {
      latency?: number;
      aiScore?: number;
    }
  ): LiveCardAudit {
    const cardId = validationResult.cardId;
    
    const audit: LiveCardAudit = {
      cardId,
      name: validationResult.cardName,
      health: validationResult.confidenceScore,
      coverage: validationResult.completionPercentage,
      evidence: this.calculateEvidenceScore(validationResult),
      sources: validationResult.sourceCount,
      latency: additionalMetrics?.latency || this.estimateLatency(),
      freshness: this.calculateFreshness(validationResult.lastUpdated),
      aiScore: additionalMetrics?.aiScore || this.calculateAIScore(validationResult),
      lastAudit: new Date().toISOString(),
      trend: this.calculateTrend(cardId, validationResult.confidenceScore),
    };

    // Cache the audit
    this.auditCache.set(cardId, audit);

    // Store in history
    if (!this.auditHistory.has(cardId)) {
      this.auditHistory.set(cardId, []);
    }
    this.auditHistory.get(cardId)!.push({
      timestamp: audit.lastAudit,
      score: audit.health,
    });

    // Keep only last 100 records
    const history = this.auditHistory.get(cardId)!;
    if (history.length > 100) {
      this.auditHistory.set(cardId, history.slice(-100));
    }

    return audit;
  }

  /**
   * Calculate evidence score
   */
  private static calculateEvidenceScore(result: CardValidationResult): number {
    const verifiedFields = result.fields.filter(f => f.status === 'VERIFIED').length;
    const totalFields = result.fields.length;
    
    if (totalFields === 0) return 0;
    
    return Math.round((verifiedFields / totalFields) * 100);
  }

  /**
   * Estimate latency (placeholder)
   */
  private static estimateLatency(): number {
    // In production, this would measure actual latency
    return 150; // ms
  }

  /**
   * Calculate freshness score
   */
  private static calculateFreshness(lastUpdated: string): number {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const ageInHours = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
    
    // Decay over time: 100% at 0 hours, 0% at 168 hours (1 week)
    const freshness = Math.max(0, 100 - (ageInHours / 168) * 100);
    return Math.round(freshness);
  }

  /**
   * Calculate AI score
   */
  private static calculateAIScore(result: CardValidationResult): number {
    // In production, this would come from actual AI analysis
    // For now, base it on confidence score
    return Math.min(100, result.confidenceScore + 10);
  }

  /**
   * Calculate trend based on historical data
   */
  private static calculateTrend(cardId: string, currentScore: number): 'IMPROVING' | 'STABLE' | 'DEGRADING' {
    const history = this.auditHistory.get(cardId);
    
    if (!history || history.length < 5) {
      return 'STABLE';
    }

    const recent = history.slice(-5);
    const avgScore = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;

    if (currentScore > avgScore + 5) {
      return 'IMPROVING';
    }
    if (currentScore < avgScore - 5) {
      return 'DEGRADING';
    }
    return 'STABLE';
  }

  /**
   * Get live audit for a card
   */
  static getLiveAudit(cardId: string): LiveCardAudit | undefined {
    return this.auditCache.get(cardId);
  }

  /**
   * Get all live audits
   */
  static getAllLiveAudits(): LiveCardAudit[] {
    return Array.from(this.auditCache.values());
  }

  /**
   * Get audit history for a card
   */
  static getAuditHistory(cardId: string): Array<{ timestamp: string; score: number }> {
    return this.auditHistory.get(cardId) || [];
  }

  /**
   * Get cards by health status
   */
  static getCardsByHealthStatus(): {
    healthy: LiveCardAudit[];
    degraded: LiveCardAudit[];
    unhealthy: LiveCardAudit[];
  } {
    const audits = this.getAllLiveAudits();
    
    return {
      healthy: audits.filter(a => a.health >= 80),
      degraded: audits.filter(a => a.health >= 60 && a.health < 80),
      unhealthy: audits.filter(a => a.health < 60),
    };
  }

  /**
   * Get overall system health
   */
  static getSystemHealth(): {
    overallHealth: number;
    totalCards: number;
    healthyCards: number;
    degradedCards: number;
    unhealthyCards: number;
    avgLatency: number;
    avgFreshness: number;
  } {
    const audits = this.getAllLiveAudits();
    
    if (audits.length === 0) {
      return {
        overallHealth: 0,
        totalCards: 0,
        healthyCards: 0,
        degradedCards: 0,
        unhealthyCards: 0,
        avgLatency: 0,
        avgFreshness: 0,
      };
    }

    const overallHealth = audits.reduce((sum, a) => sum + a.health, 0) / audits.length;
    const avgLatency = audits.reduce((sum, a) => sum + a.latency, 0) / audits.length;
    const avgFreshness = audits.reduce((sum, a) => sum + a.freshness, 0) / audits.length;

    return {
      overallHealth: Math.round(overallHealth),
      totalCards: audits.length,
      healthyCards: audits.filter(a => a.health >= 80).length,
      degradedCards: audits.filter(a => a.health >= 60 && a.health < 80).length,
      unhealthyCards: audits.filter(a => a.health < 60).length,
      avgLatency: Math.round(avgLatency),
      avgFreshness: Math.round(avgFreshness),
    };
  }

  /**
   * Clear audit cache
   */
  static clearCache(): void {
    this.auditCache.clear();
    this.auditHistory.clear();
  }

  /**
   * Export audit data
   */
  static exportAuditData(): string {
    return JSON.stringify({
      audits: Array.from(this.auditCache.values()),
      history: Object.fromEntries(this.auditHistory),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}
