/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Relationship Validation for graph edges
 * BLOCK 8
 */

import { RelationshipValidation, RelationshipEdge, EntityRelationship } from './types';

export class RelationshipValidator {
  /**
   * Validate all relationships for an entity
   */
  static validateRelationships(
    entityId: string,
    relationships: EntityRelationship[]
  ): RelationshipValidation {
    const edges = this.buildEdges(relationships);
    const totalEdges = edges.length;
    const validEdges = edges.filter(e => e.valid).length;
    const invalidEdges = totalEdges - validEdges;
    const overallValid = invalidEdges === 0;

    return {
      entityId,
      edges,
      totalEdges,
      validEdges,
      invalidEdges,
      overallValid,
    };
  }

  /**
   * Build relationship edges from entity relationships
   */
  private static buildEdges(relationships: EntityRelationship[]): RelationshipEdge[] {
    return relationships.map(rel => {
      const validationErrors = this.validateEdge(rel);
      
      return {
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        type: rel.type,
        evidence: rel.evidenceIds,
        hash: this.generateEdgeHash(rel),
        confidence: rel.confidence,
        valid: validationErrors.length === 0,
        validationErrors,
      };
    });
  }

  /**
   * Validate a single relationship edge
   */
  private static validateEdge(rel: EntityRelationship): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!rel.sourceId) errors.push('Missing source ID');
    if (!rel.targetId) errors.push('Missing target ID');
    if (!rel.type) errors.push('Missing relationship type');

    // Check evidence
    if (!rel.evidenceIds || rel.evidenceIds.length === 0) {
      errors.push('No evidence provided for relationship');
    }

    // Check confidence
    if (rel.confidence < 50) {
      errors.push(`Low confidence score: ${rel.confidence}%`);
    }

    // Check temporal validity
    if (rel.validTo && new Date(rel.validTo) < new Date()) {
      errors.push('Relationship has expired');
    }

    // Check for self-referential relationships (usually invalid)
    if (rel.sourceId === rel.targetId) {
      errors.push('Self-referential relationship detected');
    }

    return errors;
  }

  /**
   * Generate hash for relationship edge
   */
  private static generateEdgeHash(rel: EntityRelationship): string {
    const data = `${rel.sourceId}-${rel.targetId}-${rel.type}-${rel.validFrom || ''}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }

  /**
   * Validate relationship type consistency
   */
  static validateRelationshipTypeConsistency(
    relationships: EntityRelationship[]
  ): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for duplicate relationships
    const relationshipMap = new Map<string, EntityRelationship[]>();
    
    relationships.forEach(rel => {
      const key = `${rel.sourceId}-${rel.targetId}-${rel.type}`;
      if (!relationshipMap.has(key)) {
        relationshipMap.set(key, []);
      }
      relationshipMap.get(key)!.push(rel);
    });

    relationshipMap.forEach((rels, key) => {
      if (rels.length > 1) {
        issues.push(`Duplicate relationship detected: ${key}`);
      }
    });

    // Check for invalid relationship types
    const validTypes = [
      'DIRECTOR', 'FOUNDER', 'BENEFICIARY', 'OWNER', 'SHAREHOLDER',
      'SPOUSE', 'PARENT', 'CHILD', 'SIBLING', 'RELATIVE',
      'EMPLOYEE', 'CONTRACTOR', 'PARTNER', 'COUNTERPARTY',
      'TRANSACTION', 'ADDRESS', 'PHONE', 'EMAIL'
    ];

    relationships.forEach(rel => {
      if (!validTypes.includes(rel.type)) {
        issues.push(`Unknown relationship type: ${rel.type}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validate relationship graph integrity
   */
  static validateGraphIntegrity(
    relationshipValidations: RelationshipValidation[]
  ): {
    valid: boolean;
    totalNodes: number;
    totalEdges: number;
    invalidEdges: number;
    isolatedNodes: string[];
    issues: string[];
  } {
    const issues: string[] = [];
    const nodeSet = new Set<string>();
    let totalEdges = 0;
    let invalidEdges = 0;

    relationshipValidations.forEach(validation => {
      nodeSet.add(validation.entityId);
      
      validation.edges.forEach(edge => {
        nodeSet.add(edge.source);
        nodeSet.add(edge.target);
        totalEdges++;
        
        if (!edge.valid) {
          invalidEdges++;
        }
      });
    });

    // Find isolated nodes (nodes with no valid edges)
    const nodeEdgeCount = new Map<string, number>();
    relationshipValidations.forEach(validation => {
      validation.edges.forEach(edge => {
        if (edge.valid) {
          nodeEdgeCount.set(edge.source, (nodeEdgeCount.get(edge.source) || 0) + 1);
          nodeEdgeCount.set(edge.target, (nodeEdgeCount.get(edge.target) || 0) + 1);
        }
      });
    });

    const isolatedNodes: string[] = [];
    nodeSet.forEach(node => {
      if ((nodeEdgeCount.get(node) || 0) === 0) {
        isolatedNodes.push(node);
      }
    });

    if (isolatedNodes.length > 0) {
      issues.push(`${isolatedNodes.length} isolated nodes detected in graph`);
    }

    if (invalidEdges > 0) {
      issues.push(`${invalidEdges} invalid relationship edges detected`);
    }

    return {
      valid: issues.length === 0,
      totalNodes: nodeSet.size,
      totalEdges,
      invalidEdges,
      isolatedNodes,
      issues,
    };
  }
}
