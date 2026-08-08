/**
 * Entity Resolution Engine
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Real matching on real records with confidence and evidence
 */

export interface EntityIdentifier {
  type: 'EDRPOU' | 'IPN' | 'PASSPORT' | 'NAME' | 'EMAIL' | 'PHONE' | 'ADDRESS';
  value: string;
  confidence: number;
}

export interface EntityMatch {
  entity_id: string;
  confidence: number;
  match_reason: string;
  matched_identifiers: EntityIdentifier[];
  evidence: {
    source: string;
    dataset_id: string;
    resource_id: string;
    record_id: string;
  }[];
}

export interface CanonicalEntity {
  entity_id: string;
  entity_type: 'PERSON' | 'COMPANY' | 'FOP';
  identifiers: EntityIdentifier[];
  attributes: Record<string, any>;
  confidence: number;
}

export class EntityResolutionEngine {
  private entities: Map<string, CanonicalEntity> = new Map();
  private identifierIndex: Map<string, Set<string>> = new Map(); // identifier value -> entity_ids

  /**
   * Add an entity to the resolution engine
   */
  addEntity(entity: CanonicalEntity): void {
    this.entities.set(entity.entity_id, entity);

    // Index identifiers for fast lookup
    for (const identifier of entity.identifiers) {
      const key = `${identifier.type}:${identifier.value.toLowerCase()}`;
      if (!this.identifierIndex.has(key)) {
        this.identifierIndex.set(key, new Set());
      }
      this.identifierIndex.get(key)!.add(entity.entity_id);
    }
  }

  /**
   * Resolve an entity from raw record data
   */
  resolveEntity(record: any, entityType: 'PERSON' | 'COMPANY' | 'FOP'): EntityMatch | null {
    const identifiers = this.extractIdentifiers(record, entityType);
    
    if (identifiers.length === 0) {
      return null;
    }

    // Prioritize official identifiers (EDRPOU, IPN, Passport)
    const officialIdentifiers = identifiers.filter(id => 
      ['EDRPOU', 'IPN', 'PASSPORT'].includes(id.type)
    );

    if (officialIdentifiers.length > 0) {
      // Try exact match on official identifiers first
      for (const identifier of officialIdentifiers) {
        const match = this.findByIdentifier(identifier);
        if (match) {
          return {
            entity_id: match.entity_id,
            confidence: 0.95,
            match_reason: `Exact match on ${identifier.type}`,
            matched_identifiers: [identifier],
            evidence: [{
              source: record.source || 'unknown',
              dataset_id: record.dataset_id || 'unknown',
              resource_id: record.resource_id || 'unknown',
              record_id: record.id || 'unknown'
            }]
          };
        }
      }
    }

    // Try fuzzy matching on names
    const nameIdentifiers = identifiers.filter(id => id.type === 'NAME');
    if (nameIdentifiers.length > 0) {
      for (const identifier of nameIdentifiers) {
        const matches = this.findByName(identifier.value, entityType);
        if (matches.length > 0) {
          const bestMatch = matches[0];
          return {
            entity_id: bestMatch.entity_id,
            confidence: bestMatch.confidence,
            match_reason: `Fuzzy match on name: ${identifier.value}`,
            matched_identifiers: [identifier],
            evidence: [{
              source: record.source || 'unknown',
              dataset_id: record.dataset_id || 'unknown',
              resource_id: record.resource_id || 'unknown',
              record_id: record.id || 'unknown'
            }]
          };
        }
      }
    }

    // Try matching on other identifiers
    for (const identifier of identifiers) {
      const match = this.findByIdentifier(identifier);
      if (match) {
        return {
          entity_id: match.entity_id,
          confidence: 0.85,
          match_reason: `Match on ${identifier.type}`,
          matched_identifiers: [identifier],
          evidence: [{
            source: record.source || 'unknown',
            dataset_id: record.dataset_id || 'unknown',
            resource_id: record.resource_id || 'unknown',
            record_id: record.id || 'unknown'
          }]
        };
      }
    }

    // No match found - create new entity
    return null;
  }

  /**
   * Extract identifiers from a raw record
   */
  private extractIdentifiers(record: any, entityType: 'PERSON' | 'COMPANY' | 'FOP'): EntityIdentifier[] {
    const identifiers: EntityIdentifier[] = [];

    if (entityType === 'COMPANY' || entityType === 'FOP') {
      // EDRPOU
      if (record.edrpou || record.EDRPOU || record.code) {
        const edrpou = (record.edrpou || record.EDRPOU || record.code).toString().trim();
        if (/^\d{8}$/.test(edrpou)) {
          identifiers.push({
            type: 'EDRPOU',
            value: edrpou,
            confidence: 0.98
          });
        }
      }
    }

    if (entityType === 'PERSON' || entityType === 'FOP') {
      // IPN
      if (record.ipn || record.IPN || record.rnokpp || record.tax_id) {
        const ipn = (record.ipn || record.IPN || record.rnokpp || record.tax_id).toString().trim();
        if (/^\d{10}$/.test(ipn)) {
          identifiers.push({
            type: 'IPN',
            value: ipn,
            confidence: 0.98
          });
        }
      }

      // Passport
      if (record.passport || record.passport_number || record.document_number) {
        const passport = (record.passport || record.passport_number || record.document_number).toString().trim();
        if (passport.length > 0) {
          identifiers.push({
            type: 'PASSPORT',
            value: passport,
            confidence: 0.90
          });
        }
      }

      // Name
      const name = this.extractName(record);
      if (name) {
        identifiers.push({
          type: 'NAME',
          value: name,
          confidence: 0.75
        });
      }
    }

    // Email
    if (record.email || record.email_address) {
      const email = (record.email || record.email_address).toString().trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        identifiers.push({
          type: 'EMAIL',
          value: email,
          confidence: 0.85
        });
      }
    }

    // Phone
    if (record.phone || record.phone_number || record.telephone) {
      const phone = (record.phone || record.phone_number || record.telephone).toString().trim();
      if (phone.length > 5) {
        identifiers.push({
          type: 'PHONE',
          value: phone,
          confidence: 0.80
        });
      }
    }

    // Address
    const address = this.extractAddress(record);
    if (address) {
      identifiers.push({
        type: 'ADDRESS',
        value: address,
        confidence: 0.70
      });
    }

    return identifiers;
  }

  /**
   * Extract name from record
   */
  private extractName(record: any): string | null {
    const parts: string[] = [];

    if (record.first_name || record.firstName || record.name) {
      parts.push((record.first_name || record.firstName || record.name).toString().trim());
    }

    if (record.last_name || record.lastName || record.surname) {
      parts.push((record.last_name || record.lastName || record.surname).toString().trim());
    }

    if (record.middle_name || record.middleName || record.patronymic) {
      parts.push((record.middle_name || record.middleName || record.patronymic).toString().trim());
    }

    if (record.full_name || record.fullName || record.name_full) {
      return (record.full_name || record.fullName || record.name_full).toString().trim();
    }

    return parts.length > 0 ? parts.join(' ') : null;
  }

  /**
   * Extract address from record
   */
  private extractAddress(record: any): string | null {
    const parts: string[] = [];

    if (record.address || record.full_address) {
      return (record.address || record.full_address).toString().trim();
    }

    if (record.street) parts.push(record.street);
    if (record.city || record.town || record.misto) parts.push(record.city || record.town || record.misto);
    if (record.region || record.oblast) parts.push(record.region || record.oblast);
    if (record.country || record.kraina) parts.push(record.country || record.kraina);

    return parts.length > 0 ? parts.join(', ') : null;
  }

  /**
   * Find entity by exact identifier match
   */
  private findByIdentifier(identifier: EntityIdentifier): { entity_id: string; confidence: number } | null {
    const key = `${identifier.type}:${identifier.value.toLowerCase()}`;
    const entityIds = this.identifierIndex.get(key);

    if (entityIds && entityIds.size > 0) {
      const entityId = entityIds.values().next().value;
      return {
        entity_id: entityId,
        confidence: identifier.confidence
      };
    }

    return null;
  }

  /**
   * Find entities by fuzzy name match
   */
  private findByName(name: string, entityType: 'PERSON' | 'COMPANY' | 'FOP'): Array<{ entity_id: string; confidence: number }> {
    const matches: Array<{ entity_id: string; confidence: number }> = [];
    const nameLower = name.toLowerCase();
    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2);

    for (const [entityId, entity] of this.entities) {
      if (entity.entity_type !== entityType) continue;

      for (const identifier of entity.identifiers) {
        if (identifier.type === 'NAME') {
          const identifierLower = identifier.value.toLowerCase();
          const identifierWords = identifierLower.split(/\s+/).filter(w => w.length > 2);

          // Calculate similarity based on word overlap
          const intersection = nameWords.filter(w => identifierWords.includes(w));
          const union = [...new Set([...nameWords, ...identifierWords])];
          const similarity = intersection.length / union.length;

          if (similarity > 0.5) {
            matches.push({
              entity_id: entityId,
              confidence: similarity * identifier.confidence
            });
          }
        }
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    return matches;
  }

  /**
   * Create a new entity from a record
   */
  createEntity(record: any, entityType: 'PERSON' | 'COMPANY' | 'FOP'): CanonicalEntity {
    const identifiers = this.extractIdentifiers(record, entityType);
    const entityId = this.generateEntityId(identifiers, entityType);

    const entity: CanonicalEntity = {
      entity_id: entityId,
      entity_type: entityType,
      identifiers,
      attributes: this.extractAttributes(record, entityType),
      confidence: this.calculateEntityConfidence(identifiers)
    };

    this.addEntity(entity);

    return entity;
  }

  /**
   * Generate entity ID from identifiers
   */
  private generateEntityId(identifiers: EntityIdentifier[], entityType: 'PERSON' | 'COMPANY' | 'FOP'): string {
    // Use official identifier if available
    const official = identifiers.find(id => ['EDRPOU', 'IPN', 'PASSPORT'].includes(id.type));
    if (official) {
      return `${entityType.toLowerCase()}-${official.type.toLowerCase()}-${official.value}`;
    }

    // Use name if available
    const name = identifiers.find(id => id.type === 'NAME');
    if (name) {
      const hash = this.simpleHash(name.value);
      return `${entityType.toLowerCase()}-name-${hash}`;
    }

    // Fallback to random
    return `${entityType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate entity confidence based on identifiers
   */
  private calculateEntityConfidence(identifiers: EntityIdentifier[]): number {
    if (identifiers.length === 0) return 0;

    const officialCount = identifiers.filter(id => ['EDRPOU', 'IPN', 'PASSPORT'].includes(id.type)).length;
    const totalConfidence = identifiers.reduce((sum, id) => sum + id.confidence, 0);

    // Boost confidence if official identifiers present
    if (officialCount > 0) {
      return Math.min(0.98, totalConfidence / identifiers.length + 0.1);
    }

    return totalConfidence / identifiers.length;
  }

  /**
   * Extract attributes from record
   */
  private extractAttributes(record: any, entityType: 'PERSON' | 'COMPANY' | 'FOP'): Record<string, any> {
    const attributes: Record<string, any> = {};

    // Copy all fields except known identifier fields
    const skipFields = ['edrpou', 'EDRPOU', 'code', 'ipn', 'IPN', 'rnokpp', 'tax_id', 
                       'passport', 'passport_number', 'document_number',
                       'email', 'email_address', 'phone', 'phone_number', 'telephone',
                       'first_name', 'firstName', 'last_name', 'lastName', 'middle_name', 'middleName',
                       'full_name', 'fullName', 'address', 'full_address'];

    for (const [key, value] of Object.entries(record)) {
      if (!skipFields.includes(key) && value !== null && value !== undefined) {
        attributes[key] = value;
      }
    }

    return attributes;
  }

  /**
   * Simple hash function for entity ID generation
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get all entities
   */
  getAllEntities(): CanonicalEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entity by ID
   */
  getEntity(entityId: string): CanonicalEntity | null {
    return this.entities.get(entityId) || null;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalEntities: number;
    byType: Record<string, number>;
    averageConfidence: number;
  } {
    const entities = this.getAllEntities();
    const byType: Record<string, number> = {};
    let totalConfidence = 0;

    for (const entity of entities) {
      byType[entity.entity_type] = (byType[entity.entity_type] || 0) + 1;
      totalConfidence += entity.confidence;
    }

    return {
      totalEntities: entities.length,
      byType,
      averageConfidence: entities.length > 0 ? totalConfidence / entities.length : 0
    };
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
    this.identifierIndex.clear();
  }
}

// Singleton instance
export const entityResolutionEngine = new EntityResolutionEngine();
