/**
 * MASTER PRODUCTION BATTLEFIELD SPECIFICATION v3.0
 * PREDATOR Analytics - Autonomous Production Validation & Remediation Framework
 * 
 * Evidence Vault
 * 
 * Implements Zero Hallucination Protocol:
 * Every fact must have: CLAIM -> SOURCE -> RAW EVIDENCE -> CONFIDENCE
 * 
 * Stores evidence with SHA-256 hashing and complete provenance tracking
 */

import crypto from 'crypto';

export interface EvidenceRecord {
  factId: string;
  claim: string;
  source: string;
  sourceType: 'REGISTRY' | 'AI' | 'CALCULATED' | 'MANUAL';
  rawEvidence: any;
  rawResponseHash: string;
  timestamp: string;
  parserVersion: string;
  confidence: number;
  provenance: ProvenanceChain;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

export interface ProvenanceChain {
  uiPath?: string;
  analyticsPath?: string;
  databasePath?: string;
  normalizerPath?: string;
  connectorPath?: string;
  externalSource?: string;
  rawEvidence: string;
}

export class EvidenceVault {
  private evidence: Map<string, EvidenceRecord> = new Map();
  private parserVersion: string = '1.0.0';

  /**
   * Store evidence with complete provenance tracking
   */
  async storeEvidence(
    claim: string,
    source: string,
    sourceType: EvidenceRecord['sourceType'],
    rawEvidence: any,
    provenance: ProvenanceChain,
    confidence: number = 0.95
  ): Promise<string> {
    // Generate SHA-256 hash of raw evidence
    const rawResponseHash = this.computeHash(rawEvidence);
    
    // Generate unique fact ID
    const factId = this.generateFactId(claim, source);
    
    const record: EvidenceRecord = {
      factId,
      claim,
      source,
      sourceType,
      rawEvidence,
      rawResponseHash,
      timestamp: new Date().toISOString(),
      parserVersion: this.parserVersion,
      confidence,
      provenance,
      status: 'VERIFIED'
    };
    
    this.evidence.set(factId, record);
    
    console.log(`[EVIDENCE VAULT] Stored evidence: ${factId} (confidence: ${confidence})`);
    
    return factId;
  }

  /**
   * Retrieve evidence by fact ID
   */
  async retrieveEvidence(factId: string): Promise<EvidenceRecord | null> {
    return this.evidence.get(factId) || null;
  }

  /**
   * Verify evidence chain for a specific claim
   * Returns true if complete provenance exists
   */
  async verifyEvidenceChain(factId: string): Promise<boolean> {
    const record = this.evidence.get(factId);
    if (!record) return false;

    // Verify complete provenance chain
    const provenance = record.provenance;
    
    // For registry sources, verify: External Source -> Connector -> Normalizer -> Database -> Analytics -> UI
    if (record.sourceType === 'REGISTRY') {
      return !!(
        provenance.externalSource &&
        provenance.connectorPath &&
        provenance.normalizerPath &&
        provenance.databasePath &&
        provenance.analyticsPath &&
        provenance.uiPath
      );
    }
    
    // For AI sources, verify: AI Model -> Database -> Analytics -> UI
    if (record.sourceType === 'AI') {
      return !!(
        provenance.externalSource &&
        provenance.databasePath &&
        provenance.analyticsPath &&
        provenance.uiPath
      );
    }
    
    return true;
  }

  /**
   * Validate that a claim has sufficient evidence
   * Zero Hallucination Protocol: AI can only make claims with evidence
   */
  async validateClaim(claim: string, source: string): Promise<boolean> {
    const factId = this.generateFactId(claim, source);
    const record = this.evidence.get(factId);
    
    if (!record) {
      console.warn(`[EVIDENCE VAULT] Claim without evidence: "${claim}"`);
      return false;
    }
    
    // Verify evidence chain
    const chainValid = await this.verifyEvidenceChain(factId);
    
    // Verify confidence threshold
    const confidenceValid = record.confidence >= 0.80;
    
    // Verify evidence is recent (within 24h for production)
    const evidenceAge = Date.now() - new Date(record.timestamp).getTime();
    const freshnessValid = evidenceAge < (24 * 60 * 60 * 1000);
    
    const isValid = chainValid && confidenceValid && freshnessValid;
    
    if (!isValid) {
      console.warn(`[EVIDENCE VAULT] Claim validation failed: "${claim}"`, {
        chainValid,
        confidenceValid,
        freshnessValid
      });
    }
    
    return isValid;
  }

  /**
   * Get all evidence for a specific source
   */
  async getEvidenceBySource(source: string): Promise<EvidenceRecord[]> {
    const results: EvidenceRecord[] = [];
    
    for (const record of this.evidence.values()) {
      if (record.source === source) {
        results.push(record);
      }
    }
    
    return results;
  }

  /**
   * Get evidence statistics
   */
  async getStatistics(): Promise<{
    total: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
    averageConfidence: number;
  }> {
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalConfidence = 0;
    
    for (const record of this.evidence.values()) {
      bySource[record.source] = (bySource[record.source] || 0) + 1;
      byType[record.sourceType] = (byType[record.sourceType] || 0) + 1;
      totalConfidence += record.confidence;
    }
    
    const averageConfidence = this.evidence.size > 0 
      ? totalConfidence / this.evidence.size 
      : 0;
    
    return {
      total: this.evidence.size,
      bySource,
      byType,
      averageConfidence
    };
  }

  /**
   * Export evidence for audit
   */
  async exportEvidence(): Promise<EvidenceRecord[]> {
    return Array.from(this.evidence.values());
  }

  /**
   * Compute SHA-256 hash of data
   */
  private computeHash(data: any): string {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generate unique fact ID
   */
  private generateFactId(claim: string, source: string): string {
    const combined = `${claim}|${source}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    return hash.substring(0, 16);
  }

  /**
   * Clear all evidence (for testing)
   */
  async clear(): Promise<void> {
    this.evidence.clear();
  }
}

/**
 * Zero Hallucination Protocol Enforcement
 * 
 * Ensures AI responses are grounded in evidence
 */
export class ZeroHallucinationProtocol {
  private vault: EvidenceVault;

  constructor(vault: EvidenceVault) {
    this.vault = vault;
  }

  /**
   * Validate AI response before returning to user
   */
  async validateAIResponse(
    _response: any,
    claims: Array<{ claim: string; source: string }>
  ): Promise<{ valid: boolean; invalidClaims: string[] }> {
    const invalidClaims: string[] = [];
    
    for (const { claim, source } of claims) {
      const isValid = await this.vault.validateClaim(claim, source);
      if (!isValid) {
        invalidClaims.push(claim);
      }
    }
    
    return {
      valid: invalidClaims.length === 0,
      invalidClaims
    };
  }

  /**
   * Enforce evidence requirement for AI claims
   * If evidence is missing, return appropriate fallback message
   */
  async enforceEvidenceRequirement(
    claim: string,
    source: string,
    fallbackMessage: string
  ): Promise<string> {
    const hasEvidence = await this.vault.validateClaim(claim, source);
    
    if (hasEvidence) {
      return claim;
    }
    
    // Return fallback message instead of hallucinated claim
    console.warn(`[ZERO HALLUCINATION] Claim rejected due to missing evidence: "${claim}"`);
    return fallbackMessage;
  }

  /**
   * Build evidence chain for a data point
   */
  async buildEvidenceChain(
    dataPoint: any,
    source: string,
    sourceType: EvidenceRecord['sourceType'],
    provenance: ProvenanceChain
  ): Promise<string> {
    const claim = this.extractClaim(dataPoint);
    const factId = await this.vault.storeEvidence(
      claim,
      source,
      sourceType,
      dataPoint,
      provenance
    );
    
    return factId;
  }

  /**
   * Extract claim from data point
   */
  private extractClaim(dataPoint: any): string {
    if (typeof dataPoint === 'string') {
      return dataPoint;
    }
    
    if (typeof dataPoint === 'object' && dataPoint !== null) {
      // For objects, create a descriptive claim
      const keys = Object.keys(dataPoint).slice(0, 3);
      return `Data point with fields: ${keys.join(', ')}`;
    }
    
    return String(dataPoint);
  }
}
