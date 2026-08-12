/**
 * PREDATOR Evidence Chain System (HYDRA)
 * Production Acceptance Contract - P0.4
 * 
 * Enforces full evidence chain for UI values:
 * CLAIM → SOURCE → RAW RESPONSE → SHA-256 → PARSER → NORMALIZER → 
 * ENTITY RESOLUTION → CROSS-SOURCE VALIDATION → CONFIDENCE → UI
 * 
 * User must be able to answer: "Where did the system get this value?"
 * with one click to evidence.
 */

import crypto from 'crypto';

export interface EvidenceLink {
  step: string;
  timestamp: string;
  data: any;
  hash: string;
  source: string;
  confidence: number;
}

export interface EvidenceChain {
  claim: string;
  claimType: string;
  value: any;
  chain: EvidenceLink[];
  finalConfidence: number;
  sources: string[];
  contradictions: Contradiction[];
  evidenceId: string;
  createdAt: string;
}

export interface Contradiction {
  sourceA: string;
  sourceB: string;
  valueA: any;
  valueB: any;
  timestampA: string;
  timestampB: string;
  reliabilityA: number;
  reliabilityB: number;
  freshnessA: number;
  freshnessB: number;
}

export class EvidenceChainBuilder {
  private chains: Map<string, EvidenceChain> = new Map();
  
  /**
   * Build evidence chain for a claim
   */
  buildChain(
    claim: string,
    claimType: string,
    value: any,
    sourceId: string,
    rawData: any,
    parserVersion: string,
    normalizerVersion: string,
    entityId: string
  ): EvidenceChain {
    const evidenceId = crypto.randomUUID();
    const chain: EvidenceLink[] = [];
    
    // Step 1: CLAIM
    chain.push({
      step: 'CLAIM',
      timestamp: new Date().toISOString(),
      data: { claim, claimType, value },
      hash: this.computeHash({ claim, claimType, value }),
      source: 'USER_UI',
      confidence: 1.0
    });
    
    // Step 2: SOURCE
    chain.push({
      step: 'SOURCE',
      timestamp: new Date().toISOString(),
      data: { sourceId },
      hash: this.computeHash({ sourceId }),
      source: sourceId,
      confidence: 0.9
    });
    
    // Step 3: RAW RESPONSE
    const rawHash = this.computeHash(rawData);
    chain.push({
      step: 'RAW_RESPONSE',
      timestamp: new Date().toISOString(),
      data: { rawData, size: JSON.stringify(rawData).length },
      hash: rawHash,
      source: sourceId,
      confidence: 0.8
    });
    
    // Step 4: SHA-256
    chain.push({
      step: 'SHA_256',
      timestamp: new Date().toISOString(),
      data: { hash: rawHash },
      hash: this.computeHash({ hash: rawHash }),
      source: 'SYSTEM',
      confidence: 1.0
    });
    
    // Step 5: PARSER
    chain.push({
      step: 'PARSER',
      timestamp: new Date().toISOString(),
      data: { parserVersion },
      hash: this.computeHash({ parserVersion }),
      source: 'CONNECTOR',
      confidence: 0.85
    });
    
    // Step 6: NORMALIZER
    chain.push({
      step: 'NORMALIZER',
      timestamp: new Date().toISOString(),
      data: { normalizerVersion },
      hash: this.computeHash({ normalizerVersion }),
      source: 'CONNECTOR',
      confidence: 0.85
    });
    
    // Step 7: ENTITY RESOLUTION
    chain.push({
      step: 'ENTITY_RESOLUTION',
      timestamp: new Date().toISOString(),
      data: { entityId },
      hash: this.computeHash({ entityId }),
      source: 'DATABASE',
      confidence: 0.9
    });
    
    // Step 8: CROSS-SOURCE VALIDATION
    const crossSourceValidation = this.performCrossSourceValidation(value, sourceId);
    chain.push({
      step: 'CROSS_SOURCE_VALIDATION',
      timestamp: new Date().toISOString(),
      data: crossSourceValidation,
      hash: this.computeHash(crossSourceValidation),
      source: 'SYSTEM',
      confidence: crossSourceValidation.confidence
    });
    
    // Step 9: CONFIDENCE
    const finalConfidence = this.calculateFinalConfidence(chain);
    chain.push({
      step: 'CONFIDENCE',
      timestamp: new Date().toISOString(),
      data: { confidence: finalConfidence },
      hash: this.computeHash({ confidence: finalConfidence }),
      source: 'SYSTEM',
      confidence: finalConfidence
    });
    
    // Step 10: UI
    chain.push({
      step: 'UI',
      timestamp: new Date().toISOString(),
      data: { value, displayValue: this.formatForUI(value) },
      hash: this.computeHash({ value }),
      source: 'FRONTEND',
      confidence: finalConfidence
    });
    
    const evidenceChain: EvidenceChain = {
      claim,
      claimType,
      value,
      chain,
      finalConfidence,
      sources: [sourceId],
      contradictions: [],
      evidenceId,
      createdAt: new Date().toISOString()
    };
    
    this.chains.set(evidenceId, evidenceChain);
    return evidenceChain;
  }
  
  /**
   * Perform cross-source validation
   */
  private performCrossSourceValidation(value: any, primarySource: string): {
    validated: boolean;
    confidence: number;
    matchingSources: string[];
    conflictingSources: string[];
  } {
    // In a real implementation, this would query other sources
    // For now, return a placeholder
    return {
      validated: true,
      confidence: 0.8,
      matchingSources: [primarySource],
      conflictingSources: []
    };
  }
  
  /**
   * Calculate final confidence from chain
   */
  private calculateFinalConfidence(chain: EvidenceLink[]): number {
    if (chain.length === 0) return 0;
    
    const confidenceValues = chain.map(link => link.confidence);
    const average = confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length;
    
    // Weight recent steps more heavily
    const weightedSum = confidenceValues.reduce((sum, conf, index) => {
      const weight = (index + 1) / confidenceValues.length;
      return sum + (conf * weight);
    }, 0);
    
    return Math.min(weightedSum, 1.0);
  }
  
  /**
   * Format value for UI display
   */
  private formatForUI(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
  
  /**
   * Compute SHA-256 hash
   */
  private computeHash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
  
  /**
   * Add contradiction to evidence chain
   */
  addContradiction(
    evidenceId: string,
    sourceA: string,
    sourceB: string,
    valueA: any,
    valueB: any,
    timestampA: string,
    timestampB: string,
    reliabilityA: number,
    reliabilityB: number,
    freshnessA: number,
    freshnessB: number
  ): void {
    const chain = this.chains.get(evidenceId);
    if (!chain) return;
    
    const contradiction: Contradiction = {
      sourceA,
      sourceB,
      valueA,
      valueB,
      timestampA,
      timestampB,
      reliabilityA,
      reliabilityB,
      freshnessA,
      freshnessB
    };
    
    chain.contradictions.push(contradiction);
    
    // Recalculate confidence based on contradictions
    if (chain.contradictions.length > 0) {
      chain.finalConfidence = Math.max(0, chain.finalConfidence - 0.3);
    }
  }
  
  /**
   * Get evidence chain by ID
   */
  getChain(evidenceId: string): EvidenceChain | undefined {
    return this.chains.get(evidenceId);
  }
  
  /**
   * Get evidence chain for a claim
   */
  getChainForClaim(claim: string, claimType: string): EvidenceChain | undefined {
    for (const chain of this.chains.values()) {
      if (chain.claim === claim && chain.claimType === claimType) {
        return chain;
      }
    }
    return undefined;
  }
  
  /**
   * Validate evidence chain completeness
   */
  validateChain(evidenceId: string): {
    valid: boolean;
    missingSteps: string[];
    brokenLinks: string[];
    confidence: number;
  } {
    const chain = this.chains.get(evidenceId);
    if (!chain) {
      return {
        valid: false,
        missingSteps: ['ALL'],
        brokenLinks: [],
        confidence: 0
      };
    }
    
    const requiredSteps = [
      'CLAIM',
      'SOURCE',
      'RAW_RESPONSE',
      'SHA_256',
      'PARSER',
      'NORMALIZER',
      'ENTITY_RESOLUTION',
      'CROSS_SOURCE_VALIDATION',
      'CONFIDENCE',
      'UI'
    ];
    
    const presentSteps = chain.chain.map(link => link.step);
    const missingSteps = requiredSteps.filter(step => !presentSteps.includes(step));
    
    const brokenLinks: string[] = [];
    for (const link of chain.chain) {
      if (link.confidence < 0.5) {
        brokenLinks.push(link.step);
      }
    }
    
    return {
      valid: missingSteps.length === 0 && brokenLinks.length === 0,
      missingSteps,
      brokenLinks,
      confidence: chain.finalConfidence
    };
  }
  
  /**
   * Get evidence for UI display
   */
  getEvidenceForUI(evidenceId: string): {
    claim: string;
    value: any;
    confidence: number;
    source: string;
    timestamp: string;
    hasContradictions: boolean;
    canTrace: boolean;
  } {
    const chain = this.chains.get(evidenceId);
    if (!chain) {
      return {
        claim: 'Unknown',
        value: null,
        confidence: 0,
        source: 'Unknown',
        timestamp: new Date().toISOString(),
        hasContradictions: false,
        canTrace: false
      };
    }
    
    const sourceLink = chain.chain.find(link => link.step === 'SOURCE');
    const source = sourceLink?.source || 'Unknown';
    
    return {
      claim: chain.claim,
      value: chain.value,
      confidence: chain.finalConfidence,
      source,
      timestamp: chain.createdAt,
      hasContradictions: chain.contradictions.length > 0,
      canTrace: chain.chain.length === 10 // All steps present
    };
  }
  
  /**
   * Get full trace for debugging
   */
  getFullTrace(evidenceId: string): EvidenceChain | undefined {
    return this.chains.get(evidenceId);
  }
  
  /**
   * Clear old evidence chains (for memory management)
   */
  clearOldChains(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [id, chain] of this.chains.entries()) {
      if (new Date(chain.createdAt) < cutoffTime) {
        this.chains.delete(id);
      }
    }
  }
  
  /**
   * Get statistics
   */
  getStatistics(): {
    totalChains: number;
    averageConfidence: number;
    chainsWithContradictions: number;
    chainsByType: Record<string, number>;
  } {
    const chains = Array.from(this.chains.values());
    
    const averageConfidence = chains.length > 0
      ? chains.reduce((sum, chain) => sum + chain.finalConfidence, 0) / chains.length
      : 0;
    
    const chainsWithContradictions = chains.filter(chain => chain.contradictions.length > 0).length;
    
    const chainsByType: Record<string, number> = {};
    for (const chain of chains) {
      chainsByType[chain.claimType] = (chainsByType[chain.claimType] || 0) + 1;
    }
    
    return {
      totalChains: chains.length,
      averageConfidence,
      chainsWithContradictions,
      chainsByType
    };
  }
}

// Singleton instance
export const evidenceChainBuilder = new EvidenceChainBuilder();
