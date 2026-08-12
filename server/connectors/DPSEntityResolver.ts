/**
 * DPS Entity Resolver
 * 
 * Integrates DPS data with PREDATOR Entity Resolution Engine
 * 
 * Responsibilities:
 * - Normalize DPS identifiers (EDRPOU/TIN)
 * - Map DPS data to EntityNode format
 * - Use EntityResolutionEngine for deterministic/probabilistic matching
 * - Handle cross-registry correlation
 * - Resolve conflicts between DPS and other sources
 */

import { EntityNode, EntityMatchCandidate } from '../../src/types/mlip';

export interface DPSEntityResolutionResult {
  entityId: string;
  matchType: 'DETERMINISTIC' | 'PROBABILISTIC' | 'FUZZY' | 'NO_MATCH';
  confidence: number;
  matchedFields: string[];
  isNewEntity: boolean;
  contradictions?: string[];
}

export class DPSEntityResolver {
  /**
   * Resolve entity from DPS data
   */
  async resolveEntity(
    dpsData: any,
    _registryType: string
  ): Promise<DPSEntityResolutionResult> {
    // Extract primary identifier
    const identifier = this.extractIdentifier(dpsData, _registryType);
    if (!identifier) {
      throw new Error('NO_IDENTIFIER: Cannot resolve entity without EDRPOU/TIN');
    }

    // Create EntityNode from DPS data
    const entityNode = this.createEntityNode(dpsData, _registryType, identifier);

    // Try deterministic match first
    const deterministicMatch = this.tryDeterministicMatch(entityNode);
    if (deterministicMatch) {
      return {
        entityId: deterministicMatch.nodeId,
        matchType: 'DETERMINISTIC',
        confidence: 1.0,
        matchedFields: deterministicMatch.matchedFields,
        isNewEntity: false
      };
    }

    // Try probabilistic match
    const probabilisticMatch = this.tryProbabilisticMatch(entityNode);
    if (probabilisticMatch) {
      return {
        entityId: probabilisticMatch.nodeId,
        matchType: 'PROBABILISTIC',
        confidence: probabilisticMatch.matchScore,
        matchedFields: probabilisticMatch.matchedFields,
        isNewEntity: false
      };
    }

    // No match - create new entity
    const newEntityId = this.generateEntityId(identifier, _registryType);
    return {
      entityId: newEntityId,
      matchType: 'NO_MATCH',
      confidence: 0.95, // High confidence from official source
      matchedFields: ['edrpou'],
      isNewEntity: true
    };
  }

  /**
   * Extract primary identifier from DPS data
   */
  private extractIdentifier(dpsData: any, _registryType: string): string | null {
    // Try various field names for EDRPOU/TIN
    const possibleFields = [
      'rnokpp',
      'TIN_S',
      'tin',
      'TIN',
      'edrpou',
      'EDRPOU'
    ];

    for (const field of possibleFields) {
      if (dpsData[field] && typeof dpsData[field] === 'string') {
        return dpsData[field].trim();
      }
    }

    return null;
  }

  /**
   * Create EntityNode from DPS data
   */
  private createEntityNode(
    dpsData: any,
    registryType: string,
    identifier: string
  ): EntityNode {
    const attributes: Record<string, any> = {
      edrpou: identifier
    };

    // Extract name
    if (dpsData.fullName || dpsData.FULL_NAME) {
      attributes['fullName'] = dpsData.fullName || dpsData.FULL_NAME;
      attributes['name'] = dpsData.fullName || dpsData.FULL_NAME;
    }

    // Extract address
    if (dpsData.address || dpsData.ADRESS) {
      attributes['address'] = dpsData.address || dpsData.ADRESS;
    }

    // Extract tax status
    if (dpsData.taxStatus || dpsData.C_STAN) {
      attributes['taxStatus'] = dpsData.taxStatus || dpsData.C_STAN;
    }

    // Extract registration date
    if (dpsData.taxRegistrationDate || dpsData.D_REG_STI) {
      attributes['registrationDate'] = dpsData.taxRegistrationDate || dpsData.D_REG_STI;
    }

    // Extract VAT status for VAT registry
    if (registryType === 'vat') {
      if (dpsData.vatStatus || dpsData.kodPid) {
        attributes['vatStatus'] = dpsData.vatStatus || dpsData.kodPid;
      }
    }

    // Determine entity type
    const entityType = this.determineEntityType(dpsData, registryType);

    return {
      id: `dps-${registryType}-${identifier}`,
      type: entityType,
      label: attributes['fullName'] || identifier,
      attributes,
      confidence: {
        value: 0.95, // High confidence from official DPS source
        level: 'HIGH' as any,
        sources: ['ua.dps']
      },
      sources: [{
        id: 'ua.dps',
        name: 'Державна податкова служба України',
        credibility: 1.0,
        layer: 'GOVERNMENT' as any,
        retrievedAt: new Date().toISOString(),
        isLive: true
      }],
      layer: 'GOVERNMENT' as any,
      accessLevel: 'PUBLIC' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Determine entity type from DPS data
   */
  private determineEntityType(dpsData: any, _registryType: string): 'COMPANY' | 'PERSON' {
    // Check for FOP indicators
    const fullName = dpsData.fullName || dpsData.FULL_NAME || '';
    const entityType = dpsData.entityType || dpsData.FACE_MODE;

    // FOP typically has FACE_MODE = 3
    if (entityType === 3 || fullName.toLowerCase().includes('фоп')) {
      return 'PERSON';
    }

    // Default to COMPANY for legal entities
    return 'COMPANY';
  }

  /**
   * Try deterministic match using existing entities
   */
  private tryDeterministicMatch(_entityNode: EntityNode): EntityMatchCandidate | null {
    // In a real implementation, this would query the database for existing entities
    // For now, we'll use the resolution engine's deterministic match logic

    // This is a placeholder - in production, you would:
    // 1. Query the entities table for matching edrpou
    // 2. If found, return a match candidate
    // 3. If not found, return null

    return null;
  }

  /**
   * Try probabilistic match using existing entities
   */
  private tryProbabilisticMatch(_entityNode: EntityNode): EntityMatchCandidate | null {
    // In a real implementation, this would:
    // 1. Query the database for entities with similar names
    // 2. Use the resolution engine's probabilistic match logic
    // 3. Return a match candidate if confidence threshold is met

    return null;
  }

  /**
   * Generate new entity ID
   */
  private generateEntityId(_identifier: string, _registryType: string): string {
    return `entity-dps-${_registryType}-${_identifier}`;
  }

  /**
   * Normalize identifier (EDRPOU/TIN)
   */
  normalizeIdentifier(identifier: string): string {
    // Remove whitespace and leading zeros
    return identifier.trim().replace(/^0+/, '');
  }

  /**
   * Validate identifier format
   */
  validateIdentifier(identifier: string): boolean {
    // EDRPOU: 8 digits
    const edrpouPattern = /^\d{8}$/;
    // TIN/RNOKPP: 10 digits
    const tinPattern = /^\d{10}$/;

    return edrpouPattern.test(identifier) || tinPattern.test(identifier);
  }

  /**
   * Cross-registry correlation
   */
  async correlateWithOtherSources(
    _entityId: string,
    _identifier: string
  ): Promise<{
    sources: string[];
    conflicts: string[];
    corroborated: string[];
  }> {
    // In a real implementation, this would:
    // 1. Query other data sources (EDR, court, sanctions, etc.)
    // 2. Compare data for contradictions
    // 3. Return correlation results

    return {
      sources: ['ua.dps'],
      conflicts: [],
      corroborated: []
    };
  }

  /**
   * Merge DPS data with existing entity
   */
  mergeWithExistingEntity(
    existingEntity: EntityNode,
    dpsData: any
  ): EntityNode {
    const merged = { ...existingEntity };

    // Merge attributes (prefer DPS for tax-related fields)
    const dpsAttributes = this.createEntityNode(dpsData, 'registration', this.extractIdentifier(dpsData, 'registration') || '').attributes;
    
    for (const [key, value] of Object.entries(dpsAttributes)) {
      if (value !== null && value !== undefined) {
        merged.attributes[key] = value;
      }
    }

    // Add DPS as a source if not already present
    const hasDpsSource = merged.sources.some(s => s.id === 'ua.dps');
    if (!hasDpsSource) {
      merged.sources.push({
        id: 'ua.dps',
        name: 'Державна податкова служба України',
        credibility: 1.0,
        layer: 'GOVERNMENT' as any,
        retrievedAt: new Date().toISOString(),
        isLive: true
      });
    }

    // Update confidence
    merged.confidence.value = Math.min((merged.confidence.value || 0) + 0.05, 1.0);

    merged.updatedAt = new Date().toISOString();

    return merged;
  }
}

// Singleton instance
let entityResolverInstance: DPSEntityResolver | null = null;

export function getDPSEntityResolver(): DPSEntityResolver {
  if (!entityResolverInstance) {
    entityResolverInstance = new DPSEntityResolver();
  }
  return entityResolverInstance;
}

export function resetDPSEntityResolver(): void {
  entityResolverInstance = null;
}
