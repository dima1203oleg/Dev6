// core/resolution/EntityResolutionEngine.ts

export type ResolutionMatch = 'VERIFIED' | 'CORROBORATED' | 'CONFLICT' | 'UNVERIFIED' | 'POSSIBLE' | 'NOT_FOUND';

export interface EntityMatch {
  entity_id: string;
  match_score: number;
  match_reasons: string[];
  confidence: number;
  evidence_ids: string[];
}

export interface ResolutionResult {
  status: ResolutionMatch;
  matches: EntityMatch[];
  conflicts: any[];
}

export class EntityResolutionEngine {
  private matches: Map<string, EntityMatch[]> = new Map();

  /**
   * Resolve entities from facts
   * Priority: exact government identifier > exact source identifier > name + date > name + address > name + organization relationship > other corroborating attributes
   */
  async resolve(facts: any[]): Promise<ResolutionResult> {
    console.log(`[RESOLUTION ENGINE] Resolving ${facts.length} facts`);

    const matches: EntityMatch[] = [];
    const conflicts: any[] = [];

    for (const fact of facts) {
      const match = this.resolveFact(fact, facts);
      if (match) {
        matches.push(match);
      }
    }

    // Detect conflicts
    const entityGroups = new Map<string, EntityMatch[]>();
    for (const match of matches) {
      if (!entityGroups.has(match.entity_id)) {
        entityGroups.set(match.entity_id, []);
      }
      entityGroups.get(match.entity_id)!.push(match);
    }

    for (const [entityId, entityMatches] of entityGroups) {
      if (entityMatches.length > 1) {
        const conflictingMatches = entityMatches.filter(m => m.match_score < 0.95);
        if (conflictingMatches.length > 0) {
          conflicts.push({
            entity_id: entityId,
            matches: conflictingMatches,
            reason: 'Multiple matches with different confidence levels'
          });
        }
      }
    }

    const status = this.determineResolutionStatus(matches, conflicts);

    console.log(`[RESOLUTION ENGINE] Resolution complete: ${status} (${matches.length} matches, ${conflicts.length} conflicts)`);

    return {
      status,
      matches,
      conflicts
    };
  }

  /**
   * Resolve a single fact
   */
  private resolveFact(fact: any, allFacts: any[]): EntityMatch | null {
    const entityId = this.generateEntityId(fact);
    const matchReasons: string[] = [];
    let matchScore = 0;
    let confidence = 0;

    // Priority 1: Exact government identifier (EDRPOU, RNOKPP, etc.)
    if (fact.edrpou && this.isValidEDRPOU(fact.edrpou)) {
      matchScore += 0.4;
      matchReasons.push('exact EDRPOU');
      confidence += 0.3;
    }
    if (fact.rnokpp && this.isValidRNOKPP(fact.rnokpp)) {
      matchScore += 0.4;
      matchReasons.push('exact RNOKPP');
      confidence += 0.3;
    }
    if (fact.passport && this.isValidPassport(fact.passport)) {
      matchScore += 0.4;
      matchReasons.push('exact passport');
      confidence += 0.3;
    }

    // Priority 2: Exact source identifier
    if (fact.source_id && this.isValidSourceId(fact.source_id)) {
      matchScore += 0.3;
      matchReasons.push('exact source identifier');
      confidence += 0.2;
    }

    // Priority 3: Name + date
    if (fact.name && fact.registration_date) {
      const nameMatches = this.findByNameAndDate(fact.name, fact.registration_date, allFacts);
      if (nameMatches.length > 0) {
        matchScore += 0.25;
        matchReasons.push('name + date match');
        confidence += 0.15;
      }
    }

    // Priority 4: Name + address
    if (fact.name && fact.address) {
      const addressMatches = this.findByNameAndAddress(fact.name, fact.address, allFacts);
      if (addressMatches.length > 0) {
        matchScore += 0.2;
        matchReasons.push('name + address match');
        confidence += 0.1;
      }
    }

    // Priority 5: Name + organization relationship
    if (fact.name && fact.organization) {
      const orgMatches = this.findByNameAndOrganization(fact.name, fact.organization, allFacts);
      if (orgMatches.length > 0) {
        matchScore += 0.15;
        matchReasons.push('name + organization relationship');
        confidence += 0.1;
      }
    }

    // Priority 6: Other corroborating attributes
    if (fact.phone && this.isValidPhone(fact.phone)) {
      matchScore += 0.05;
      matchReasons.push('phone match');
      confidence += 0.05;
    }
    if (fact.email && this.isValidEmail(fact.email)) {
      matchScore += 0.05;
      matchReasons.push('email match');
      confidence += 0.05;
    }

    // Cap match score at 1.0
    matchScore = Math.min(matchScore, 1.0);
    confidence = Math.min(confidence, 1.0);

    // FORBIDDEN: name == name → automatic match
    // Only return match if we have at least one strong signal (government identifier or source identifier)
    if (matchScore < 0.3) {
      console.log(`[RESOLUTION ENGINE] Fact rejected: insufficient match score (${matchScore.toFixed(2)})`);
      return null;
    }

    const evidenceIds = this.generateEvidenceIds(fact);

    return {
      entity_id: entityId,
      match_score: matchScore,
      match_reasons: matchReasons,
      confidence,
      evidence_ids: evidenceIds
    };
  }

  /**
   * Determine resolution status
   */
  private determineResolutionStatus(matches: EntityMatch[], conflicts: any[]): ResolutionMatch {
    if (matches.length === 0) {
      return 'NOT_FOUND';
    }

    if (conflicts.length > 0) {
      return 'CONFLICT';
    }

    const hasHighConfidence = matches.some(m => m.confidence >= 0.95);
    if (hasHighConfidence) {
      return 'VERIFIED';
    }

    const hasMediumConfidence = matches.some(m => m.confidence >= 0.8);
    if (hasMediumConfidence) {
      return 'CORROBORATED';
    }

    const hasLowConfidence = matches.some(m => m.confidence >= 0.5);
    if (hasLowConfidence) {
      return 'POSSIBLE';
    }

    return 'UNVERIFIED';
  }

  /**
   * Generate entity ID from fact
   */
  private generateEntityId(fact: any): string {
    if (fact.edrpou) return `company_${fact.edrpou}`;
    if (fact.rnokpp) return `person_${fact.rnokpp}`;
    if (fact.passport) return `person_${fact.passport}`;
    if (fact.source_id) return `entity_${fact.source_id}`;
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate evidence IDs from fact
   */
  private generateEvidenceIds(fact: any): string[] {
    const ids: string[] = [];
    if (fact.id) ids.push(fact.id);
    if (fact.record_id) ids.push(fact.record_id);
    if (fact.source_id) ids.push(fact.source_id);
    if (ids.length === 0) {
      ids.push(`evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    return ids;
  }

  /**
   * Validation helpers
   */
  private isValidEDRPOU(edrpou: string): boolean {
    return /^\d{8}$/.test(edrpou);
  }

  private isValidRNOKPP(rnokpp: string): boolean {
    return /^\d{10}$/.test(rnokpp);
  }

  private isValidPassport(passport: string): boolean {
    return passport && passport.length >= 6;
  }

  private isValidSourceId(sourceId: string): boolean {
    return sourceId && sourceId.length > 0;
  }

  private isValidPhone(phone: string): boolean {
    return phone && phone.length >= 10;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Find by name and date
   */
  private findByNameAndDate(name: string, date: string, facts: any[]): any[] {
    return facts.filter(f => 
      f.name === name && 
      f.registration_date === date
    );
  }

  /**
   * Find by name and address
   */
  private findByNameAndAddress(name: string, address: string, facts: any[]): any[] {
    return facts.filter(f => 
      f.name === name && 
      f.address === address
    );
  }

  /**
   * Find by name and organization
   */
  private findByNameAndOrganization(name: string, organization: string, facts: any[]): any[] {
    return facts.filter(f => 
      f.name === name && 
      f.organization === organization
    );
  }
}
