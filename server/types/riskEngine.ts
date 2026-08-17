/**
 * Risk Engine - Evidence-Based Risk Computation
 * 
 * Computes entity risk scores based on real evidence from authoritative sources.
 * No hardcoded risk values - all risk is derived from actual evidence.
 */

export interface RiskAssessment {
  entityId: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskStatus: RiskStatus;
  riskFactors: RiskFactor[];
  supportingEvidence: EvidenceReference[];
  confidence: number;
  computedAt: string;
}

export type RiskLevel = 
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'MINIMAL'
  | 'UNKNOWN';

export type RiskStatus = 
  | 'COMPUTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNABLE_TO_ASSESS';

export interface RiskFactor {
  category: RiskCategory;
  severity: number; // 0-100
  description: string;
  evidenceCount: number;
  sourceIds: string[];
  weight: number; // 0-1
}

export type RiskCategory = 
  | 'LEGAL'
  | 'SANCTIONS'
  | 'PEP'
  | 'TAX'
  | 'OWNERSHIP'
  | 'CORPORATE_COMPLEXITY'
  | 'ENFORCEMENT'
  | 'PROCUREMENT'
  | 'DATA_CONFLICTS'
  | 'SOURCE_RELIABILITY';

export interface EvidenceReference {
  evidenceId: string;
  sourceId: string;
  sourceName: string;
  category: RiskCategory;
  severity: number;
  description: string;
  retrievedAt: string;
}

export interface RiskComputationInput {
  entityId: string;
  evidence: EvidenceRecord[];
  fieldProvenance: FieldProvenanceRecord[];
  conflicts: FieldConflict[];
  sources: SourceInfo[];
}

export interface EvidenceRecord {
  evidenceId: string;
  sourceId: string;
  category: string;
  severity?: number;
  retrievedAt: string;
  validationStatus: string;
}

export interface FieldProvenanceRecord {
  fieldId: string;
  fieldName: string;
  confidence: number;
  validationStatus: string;
  sourceId: string;
}

export interface FieldConflict {
  fieldId: string;
  fieldName: string;
  conflictingValues: number;
}

export interface SourceInfo {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  authority: number;
  reliability: number;
}

/**
 * Risk Engine Service
 * 
 * Computes evidence-based risk scores without hardcoded values.
 */
export class RiskEngine {
  private static readonly RISK_CATEGORY_WEIGHTS: Record<RiskCategory, number> = {
    LEGAL: 0.25,
    SANCTIONS: 0.30,
    PEP: 0.20,
    TAX: 0.15,
    OWNERSHIP: 0.10,
    CORPORATE_COMPLEXITY: 0.05,
    ENFORCEMENT: 0.20,
    PROCUREMENT: 0.10,
    DATA_CONFLICTS: 0.15,
    SOURCE_RELIABILITY: 0.10,
  };

  /**
   * Compute risk assessment from evidence
   */
  static computeRisk(input: RiskComputationInput): RiskAssessment {
    const { entityId, evidence, fieldProvenance, conflicts, sources } = input;

    // Check if we have sufficient evidence
    if (evidence.length === 0 && fieldProvenance.length === 0) {
      return this.createInsufficientEvidenceAssessment(entityId);
    }

    const riskFactors: RiskFactor[] = [];
    const supportingEvidence: EvidenceReference[] = [];

    // Compute risk by category
    riskFactors.push(this.computeLegalRisk(evidence, sources, supportingEvidence));
    riskFactors.push(this.computeSanctionsRisk(evidence, sources, supportingEvidence));
    riskFactors.push(this.computePEPRisk(evidence, sources, supportingEvidence));
    riskFactors.push(this.computeTaxRisk(evidence, sources, supportingEvidence));
    riskFactors.push(this.computeOwnershipRisk(fieldProvenance, sources, supportingEvidence));
    riskFactors.push(this.computeCorporateComplexityRisk(fieldProvenance, supportingEvidence));
    riskFactors.push(this.computeEnforcementRisk(evidence, sources, supportingEvidence));
    riskFactors.push(this.computeProcurementRisk(evidence, sources, supportingEvidence));
    riskFactors.push(this.computeDataConflictRisk(conflicts, supportingEvidence));
    riskFactors.push(this.computeSourceReliabilityRisk(sources, supportingEvidence));

    // Filter out zero-severity factors
    const activeFactors = riskFactors.filter(f => f.severity > 0);

    if (activeFactors.length === 0) {
      return this.createMinimalRiskAssessment(entityId, supportingEvidence);
    }

    // Calculate weighted risk score
    let totalRisk = 0;
    let totalWeight = 0;

    for (const factor of activeFactors) {
      const weight = this.RISK_CATEGORY_WEIGHTS[factor.category];
      totalRisk += factor.severity * weight;
      totalWeight += weight;
    }

    const riskScore = totalWeight > 0 ? Math.round(totalRisk / totalWeight) : 0;
    const riskLevel = this.determineRiskLevel(riskScore);
    const confidence = this.computeConfidence(activeFactors, evidence.length);

    return {
      entityId,
      riskScore,
      riskLevel,
      riskStatus: 'COMPUTED',
      riskFactors: activeFactors,
      supportingEvidence,
      confidence,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Compute legal risk from court records and legal proceedings
   */
  private static computeLegalRisk(
    evidence: EvidenceRecord[],
    sources: SourceInfo[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    const legalEvidence = evidence.filter(e => 
      e.category === 'court' || e.category === 'legal' || e.category === 'enforcement'
    );

    if (legalEvidence.length === 0) {
      return this.createZeroFactor('LEGAL');
    }

    let severity = 0;
    const sourceIds = new Set<string>();

    for (const record of legalEvidence) {
      const source = sources.find(s => s.sourceId === record.sourceId);
      const authority = source?.authority || 50;
      
      // Base severity from evidence
      const evidenceSeverity = record.severity || 50;
      
      // Adjust by source authority
      severity += (evidenceSeverity * authority) / 100;
      sourceIds.add(record.sourceId);

      supportingEvidence.push({
        evidenceId: record.evidenceId,
        sourceId: record.sourceId,
        sourceName: source?.sourceName || 'Unknown',
        category: 'LEGAL',
        severity: evidenceSeverity,
        description: 'Legal proceeding or court record found',
        retrievedAt: record.retrievedAt,
      });
    }

    // Average severity
    severity = Math.min(100, Math.round(severity / legalEvidence.length));

    return {
      category: 'LEGAL',
      severity,
      description: `${legalEvidence.length} legal proceeding(s) found`,
      evidenceCount: legalEvidence.length,
      sourceIds: Array.from(sourceIds),
      weight: this.RISK_CATEGORY_WEIGHTS.LEGAL,
    };
  }

  /**
   * Compute sanctions risk from sanctions lists
   */
  private static computeSanctionsRisk(
    evidence: EvidenceRecord[],
    sources: SourceInfo[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    const sanctionsEvidence = evidence.filter(e => 
      e.category === 'sanctions' || e.category === 'rnbo' || e.category === 'ofac' || e.category === 'eu_sanctions'
    );

    if (sanctionsEvidence.length === 0) {
      return this.createZeroFactor('SANCTIONS');
    }

    let severity = 0;
    const sourceIds = new Set<string>();

    for (const record of sanctionsEvidence) {
      const source = sources.find(s => s.sourceId === record.sourceId);
      const authority = source?.authority || 50;
      
      // Sanctions are high severity by default
      const evidenceSeverity = record.severity || 80;
      
      severity += (evidenceSeverity * authority) / 100;
      sourceIds.add(record.sourceId);

      supportingEvidence.push({
        evidenceId: record.evidenceId,
        sourceId: record.sourceId,
        sourceName: source?.sourceName || 'Unknown',
        category: 'SANCTIONS',
        severity: evidenceSeverity,
        description: 'Entity appears on sanctions list',
        retrievedAt: record.retrievedAt,
      });
    }

    severity = Math.min(100, Math.round(severity / sanctionsEvidence.length));

    return {
      category: 'SANCTIONS',
      severity,
      description: `${sanctionsEvidence.length} sanctions record(s) found`,
      evidenceCount: sanctionsEvidence.length,
      sourceIds: Array.from(sourceIds),
      weight: this.RISK_CATEGORY_WEIGHTS.SANCTIONS,
    };
  }

  /**
   * Compute PEP (Politically Exposed Person) risk
   */
  private static computePEPRisk(
    evidence: EvidenceRecord[],
    sources: SourceInfo[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    const pepEvidence = evidence.filter(e => 
      e.category === 'pep' || e.category === 'politically_exposed'
    );

    if (pepEvidence.length === 0) {
      return this.createZeroFactor('PEP');
    }

    let severity = 0;
    const sourceIds = new Set<string>();

    for (const record of pepEvidence) {
      const source = sources.find(s => s.sourceId === record.sourceId);
      const authority = source?.authority || 50;
      
      const evidenceSeverity = record.severity || 60;
      
      severity += (evidenceSeverity * authority) / 100;
      sourceIds.add(record.sourceId);

      supportingEvidence.push({
        evidenceId: record.evidenceId,
        sourceId: record.sourceId,
        sourceName: source?.sourceName || 'Unknown',
        category: 'PEP',
        severity: evidenceSeverity,
        description: 'Politically exposed person identified',
        retrievedAt: record.retrievedAt,
      });
    }

    severity = Math.min(100, Math.round(severity / pepEvidence.length));

    return {
      category: 'PEP',
      severity,
      description: `${pepEvidence.length} PEP record(s) found`,
      evidenceCount: pepEvidence.length,
      sourceIds: Array.from(sourceIds),
      weight: this.RISK_CATEGORY_WEIGHTS.PEP,
    };
  }

  /**
   * Compute tax risk from tax records
   */
  private static computeTaxRisk(
    evidence: EvidenceRecord[],
    sources: SourceInfo[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    const taxEvidence = evidence.filter(e => 
      e.category === 'tax' || e.category === 'dps' || e.category === 'tax_debt'
    );

    if (taxEvidence.length === 0) {
      return this.createZeroFactor('TAX');
    }

    let severity = 0;
    const sourceIds = new Set<string>();

    for (const record of taxEvidence) {
      const source = sources.find(s => s.sourceId === record.sourceId);
      const authority = source?.authority || 50;
      
      const evidenceSeverity = record.severity || 40;
      
      severity += (evidenceSeverity * authority) / 100;
      sourceIds.add(record.sourceId);

      supportingEvidence.push({
        evidenceId: record.evidenceId,
        sourceId: record.sourceId,
        sourceName: source?.sourceName || 'Unknown',
        category: 'TAX',
        severity: evidenceSeverity,
        description: 'Tax record or debt identified',
        retrievedAt: record.retrievedAt,
      });
    }

    severity = Math.min(100, Math.round(severity / taxEvidence.length));

    return {
      category: 'TAX',
      severity,
      description: `${taxEvidence.length} tax record(s) found`,
      evidenceCount: taxEvidence.length,
      sourceIds: Array.from(sourceIds),
      weight: this.RISK_CATEGORY_WEIGHTS.TAX,
    };
  }

  /**
   * Compute ownership risk from beneficial ownership structure
   */
  private static computeOwnershipRisk(
    fieldProvenance: FieldProvenanceRecord[],
    sources: SourceInfo[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    const ownershipFields = fieldProvenance.filter(f => 
      f.fieldName === 'beneficiaries' || f.fieldName === 'founders' || f.fieldName === 'shareholders'
    );

    if (ownershipFields.length === 0) {
      return this.createZeroFactor('OWNERSHIP');
    }

    // Risk based on number of ownership changes and complexity
    let severity = 0;
    const sourceIds = new Set<string>();

    for (const field of ownershipFields) {
      sourceIds.add(field.sourceId);

      // More ownership records = higher complexity
      severity += 10;
    }

    severity = Math.min(100, Math.round(severity));

    if (severity > 0 && ownershipFields.length > 0) {
      const firstField = ownershipFields[0]!;
      const sourceName = sources.find(s => s.sourceId === firstField.sourceId)?.sourceName || 'Unknown';
      
      supportingEvidence.push({
        evidenceId: firstField.fieldId,
        sourceId: firstField.sourceId,
        sourceName,
        category: 'OWNERSHIP',
        severity,
        description: `${ownershipFields.length} ownership record(s) found`,
        retrievedAt: new Date().toISOString(),
      });
    }

    return {
      category: 'OWNERSHIP',
      severity,
      description: `${ownershipFields.length} ownership record(s) indicate structure complexity`,
      evidenceCount: ownershipFields.length,
      sourceIds: Array.from(sourceIds),
      weight: this.RISK_CATEGORY_WEIGHTS.OWNERSHIP,
    };
  }

  /**
   * Compute corporate complexity risk
   */
  private static computeCorporateComplexityRisk(
    fieldProvenance: FieldProvenanceRecord[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    // Count number of related entities, subsidiaries, etc.
    const complexityFields = fieldProvenance.filter(f => 
      f.fieldName === 'related_entities' || f.fieldName === 'subsidiaries' || f.fieldName === 'branches'
    );

    if (complexityFields.length === 0) {
      return this.createZeroFactor('CORPORATE_COMPLEXITY');
    }

    let severity = 0;

    for (const _field of complexityFields) {
      severity += 5; // Low severity per complexity indicator
    }

    severity = Math.min(100, Math.round(severity));

    if (severity > 0 && fieldProvenance.length > 0) {
      const firstField = fieldProvenance[0]!;
      supportingEvidence.push({
        evidenceId: firstField.fieldId,
        sourceId: firstField.sourceId,
        sourceName: 'Unknown',
        category: 'CORPORATE_COMPLEXITY',
        severity,
        description: `${complexityFields.length} complexity indicator(s) found`,
        retrievedAt: new Date().toISOString(),
      });
    }

    return {
      category: 'CORPORATE_COMPLEXITY',
      severity,
      description: `${complexityFields.length} complexity indicator(s) suggest complex structure`,
      evidenceCount: complexityFields.length,
      sourceIds: fieldProvenance.length > 0 ? [fieldProvenance[0]!.sourceId] : [],
      weight: this.RISK_CATEGORY_WEIGHTS.CORPORATE_COMPLEXITY,
    };
  }

  /**
   * Compute enforcement risk from enforcement actions
   */
  private static computeEnforcementRisk(
    evidence: EvidenceRecord[],
    sources: SourceInfo[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    const enforcementEvidence = evidence.filter(e => 
      e.category === 'enforcement' || e.category === 'executive_proceedings'
    );

    if (enforcementEvidence.length === 0) {
      return this.createZeroFactor('ENFORCEMENT');
    }

    let severity = 0;
    const sourceIds = new Set<string>();

    for (const record of enforcementEvidence) {
      const source = sources.find(s => s.sourceId === record.sourceId);
      const authority = source?.authority || 50;
      
      const evidenceSeverity = record.severity || 70;
      
      severity += (evidenceSeverity * authority) / 100;
      sourceIds.add(record.sourceId);

      supportingEvidence.push({
        evidenceId: record.evidenceId,
        sourceId: record.sourceId,
        sourceName: source?.sourceName || 'Unknown',
        category: 'ENFORCEMENT',
        severity: evidenceSeverity,
        description: 'Enforcement action identified',
        retrievedAt: record.retrievedAt,
      });
    }

    severity = Math.min(100, Math.round(severity / enforcementEvidence.length));

    return {
      category: 'ENFORCEMENT',
      severity,
      description: `${enforcementEvidence.length} enforcement action(s) found`,
      evidenceCount: enforcementEvidence.length,
      sourceIds: Array.from(sourceIds),
      weight: this.RISK_CATEGORY_WEIGHTS.ENFORCEMENT,
    };
  }

  /**
   * Compute procurement risk from government contracts
   */
  private static computeProcurementRisk(
    evidence: EvidenceRecord[],
    sources: SourceInfo[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    const procurementEvidence = evidence.filter(e => 
      e.category === 'procurement' || e.category === 'government_contracts'
    );

    if (procurementEvidence.length === 0) {
      return this.createZeroFactor('PROCUREMENT');
    }

    let severity = 0;
    const sourceIds = new Set<string>();

    for (const record of procurementEvidence) {
      const source = sources.find(s => s.sourceId === record.sourceId);
      sourceIds.add(record.sourceId);

      // Procurement risk is generally low unless there are issues
      const evidenceSeverity = record.severity || 20;
      
      severity += evidenceSeverity;

      supportingEvidence.push({
        evidenceId: record.evidenceId,
        sourceId: record.sourceId,
        sourceName: source?.sourceName || 'Unknown',
        category: 'PROCUREMENT',
        severity: evidenceSeverity,
        description: 'Government procurement record found',
        retrievedAt: record.retrievedAt,
      });
    }

    severity = Math.min(100, Math.round(severity / procurementEvidence.length));

    return {
      category: 'PROCUREMENT',
      severity,
      description: `${procurementEvidence.length} procurement record(s) found`,
      evidenceCount: procurementEvidence.length,
      sourceIds: Array.from(sourceIds),
      weight: this.RISK_CATEGORY_WEIGHTS.PROCUREMENT,
    };
  }

  /**
   * Compute data conflict risk
   */
  private static computeDataConflictRisk(
    conflicts: FieldConflict[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    if (conflicts.length === 0) {
      return this.createZeroFactor('DATA_CONFLICTS');
    }

    // Each conflict adds to risk
    const severity = Math.min(100, conflicts.length * 15);

    for (const conflict of conflicts) {
      supportingEvidence.push({
        evidenceId: conflict.fieldId,
        sourceId: 'conflict_detection',
        sourceName: 'Internal',
        category: 'DATA_CONFLICTS',
        severity: 15,
        description: `Conflict in field: ${conflict.fieldName} (${conflict.conflictingValues} values)`,
        retrievedAt: new Date().toISOString(),
      });
    }

    return {
      category: 'DATA_CONFLICTS',
      severity,
      description: `${conflicts.length} data conflict(s) detected`,
      evidenceCount: conflicts.length,
      sourceIds: ['conflict_detection'],
      weight: this.RISK_CATEGORY_WEIGHTS.DATA_CONFLICTS,
    };
  }

  /**
   * Compute source reliability risk
   */
  private static computeSourceReliabilityRisk(
    sources: SourceInfo[],
    supportingEvidence: EvidenceReference[]
  ): RiskFactor {
    if (sources.length === 0) {
      return this.createZeroFactor('SOURCE_RELIABILITY');
    }

    // Calculate average source reliability
    let totalReliability = 0;
    const sourceIds: string[] = [];

    for (const source of sources) {
      totalReliability += source.reliability;
      sourceIds.push(source.sourceId);
    }

    const avgReliability = totalReliability / sources.length;

    // Lower reliability = higher risk
    const severity = Math.round((100 - avgReliability) * 0.5);

    if (severity > 0) {
      supportingEvidence.push({
        evidenceId: 'source_reliability',
        sourceId: 'source_analysis',
        sourceName: 'Internal',
        category: 'SOURCE_RELIABILITY',
        severity,
        description: `Average source reliability: ${avgReliability.toFixed(1)}%`,
        retrievedAt: new Date().toISOString(),
      });
    }

    return {
      category: 'SOURCE_RELIABILITY',
      severity,
      description: `Source reliability analysis: ${avgReliability.toFixed(1)}% average`,
      evidenceCount: sources.length,
      sourceIds,
      weight: this.RISK_CATEGORY_WEIGHTS.SOURCE_RELIABILITY,
    };
  }

  /**
   * Determine risk level from score
   */
  private static determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    if (score >= 5) return 'MINIMAL';
    return 'UNKNOWN';
  }

  /**
   * Compute confidence in risk assessment
   */
  private static computeConfidence(factors: RiskFactor[], evidenceCount: number): number {
    if (factors.length === 0) return 0;

    // Confidence based on:
    // - Number of evidence records (more = higher confidence)
    // - Number of risk factors (more factors = higher confidence)
    // - Average severity of factors (higher severity = higher confidence in risk assessment)
    
    const evidenceScore = Math.min(100, evidenceCount * 5);
    const factorScore = Math.min(100, factors.length * 10);
    const avgSeverity = factors.reduce((sum, f) => sum + f.severity, 0) / factors.length;
    const severityScore = avgSeverity;

    const confidence = (evidenceScore * 0.4) + (factorScore * 0.3) + (severityScore * 0.3);
    
    return Math.round(Math.min(100, confidence));
  }

  /**
   * Create zero-severity factor
   */
  private static createZeroFactor(category: RiskCategory): RiskFactor {
    return {
      category,
      severity: 0,
      description: 'No evidence found',
      evidenceCount: 0,
      sourceIds: [],
      weight: this.RISK_CATEGORY_WEIGHTS[category],
    };
  }

  /**
   * Create insufficient evidence assessment
   */
  private static createInsufficientEvidenceAssessment(entityId: string): RiskAssessment {
    return {
      entityId,
      riskScore: 0,
      riskLevel: 'UNKNOWN',
      riskStatus: 'INSUFFICIENT_EVIDENCE',
      riskFactors: [],
      supportingEvidence: [],
      confidence: 0,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Create minimal risk assessment
   */
  private static createMinimalRiskAssessment(
    entityId: string,
    supportingEvidence: EvidenceReference[]
  ): RiskAssessment {
    return {
      entityId,
      riskScore: 0,
      riskLevel: 'MINIMAL',
      riskStatus: 'COMPUTED',
      riskFactors: [],
      supportingEvidence,
      confidence: 50,
      computedAt: new Date().toISOString(),
    };
  }
}
