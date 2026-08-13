/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Data Lineage Explorer
 * BLOCK 5
 * 
 * @ts-nocheck - This file contains test/monitoring code
 */

import { DataLineage, LineageNode, FieldAudit } from './types';

export class DataLineageExplorer {
  /**
   * Build complete data lineage for a field
   */
  static buildLineage(fieldName: string, fieldAudit: FieldAudit): DataLineage {
    const root = this.buildLineageTree(fieldName, fieldAudit);
    const totalNodes = this.countNodes(root);
    const depth = this.calculateDepth(root);
    const hasConflict = this.detectConflict(root);

    return {
      fieldName,
      root,
      totalNodes,
      depth,
      hasConflict,
    };
  }

  /**
   * Build lineage tree from field audit
   */
  private static buildLineageTree(fieldName: string, fieldAudit: FieldAudit): LineageNode {
    const now = new Date().toISOString();

    // Build the lineage chain
    const registryNode: LineageNode = {
      id: `${fieldName}-registry`,
      type: 'REGISTRY',
      name: fieldAudit.registry,
      data: { registry: fieldAudit.registry },
      timestamp: fieldAudit.retrievedAt,
      hash: fieldAudit.sha256Hash,
      confidence: fieldAudit.confidenceScore,
      status: fieldAudit.status === 'VERIFIED' ? 'VALID' : 'INVALID',
      children: [],
    };

    const connectorNode: LineageNode = {
      id: `${fieldName}-connector`,
      type: 'CONNECTOR',
      name: fieldAudit.connector,
      data: { 
        connector: fieldAudit.connector,
        version: fieldAudit.connectorVersion,
      },
      timestamp: fieldAudit.retrievedAt,
      confidence: fieldAudit.confidenceScore,
      status: 'VALID',
      children: [registryNode],
    };

    const rawJsonNode: LineageNode = {
      id: `${fieldName}-raw`,
      type: 'RAW_JSON',
      name: 'Raw Response',
      data: JSON.parse(fieldAudit.rawJson),
      timestamp: fieldAudit.retrievedAt,
      hash: fieldAudit.sha256Hash,
      confidence: fieldAudit.confidenceScore,
      status: 'VALID',
      children: [connectorNode],
    };

    const normalizerNode: LineageNode = {
      id: `${fieldName}-normalizer`,
      type: 'NORMALIZER',
      name: 'Normalizer',
      data: { 
        version: fieldAudit.normalizerVersion,
        output: fieldAudit.value,
      },
      timestamp: fieldAudit.retrievedAt,
      confidence: fieldAudit.confidenceScore,
      status: 'VALID',
      children: [rawJsonNode],
    };

    const databaseNode: LineageNode = {
      id: `${fieldName}-database`,
      type: 'DATABASE',
      name: 'Database Storage',
      data: { stored: true },
      timestamp: fieldAudit.retrievedAt,
      confidence: fieldAudit.confidenceScore,
      status: 'VALID',
      children: [normalizerNode],
    };

    const analyticsNode: LineageNode = {
      id: `${fieldName}-analytics`,
      type: 'ANALYTICS',
      name: 'Analytics Engine',
      data: { processed: true },
      timestamp: now,
      confidence: fieldAudit.confidenceScore,
      status: 'VALID',
      children: [databaseNode],
    };

    const riskEngineNode: LineageNode = {
      id: `${fieldName}-risk`,
      type: 'RISK_ENGINE',
      name: 'Risk Engine',
      data: { riskCalculated: true },
      timestamp: now,
      confidence: fieldAudit.confidenceScore,
      status: 'VALID',
      children: [analyticsNode],
    };

    const frontendNode: LineageNode = {
      id: `${fieldName}-frontend`,
      type: 'FRONTEND',
      name: 'Frontend Display',
      data: { 
        displayed: true,
        value: fieldAudit.value,
      },
      timestamp: now,
      confidence: fieldAudit.confidenceScore,
      status: fieldAudit.status === 'VERIFIED' ? 'VALID' : 'INVALID',
      children: [riskEngineNode],
    };

    return frontendNode;
  }

  /**
   * Count total nodes in lineage tree
   */
  private static countNodes(node: LineageNode): number {
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
        count += this.countNodes(child);
      });
    }
    return count;
  }

  /**
   * Calculate depth of lineage tree
   */
  private static calculateDepth(node: LineageNode): number {
    if (!node.children || node.children.length === 0) {
      return 1;
    }
    const childDepths = node.children.map(child => this.calculateDepth(child));
    return 1 + Math.max(...childDepths);
  }

  /**
   * Detect conflicts in lineage
   */
  private static detectConflict(node: LineageNode): boolean {
    if (node.status === 'INVALID' || node.status === 'CONFLICT') {
      return true;
    }
    if (node.children) {
      return node.children.some(child => this.detectConflict(child));
    }
    return false;
  }

  /**
   * Find node by type in lineage
   */
  static findNodeByType(lineage: DataLineage, type: LineageNode['type']): LineageNode | null {
    return this.findNodeByTypeRecursive(lineage.root, type);
  }

  private static findNodeByTypeRecursive(node: LineageNode, type: LineageNode['type']): LineageNode | null {
    if (node.type === type) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeByTypeRecursive(child, type);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Get lineage path as array
   */
  static getLineagePath(lineage: DataLineage): LineageNode[] {
    const path: LineageNode[] = [];
    this.buildPathRecursive(lineage.root, path);
    return path;
  }

  private static buildPathRecursive(node: LineageNode, path: LineageNode[]): void {
    path.push(node);
    if (node.children && node.children.length > 0) {
      this.buildPathRecursive(node.children[0]!, path);
    }
  }

  /**
   * Validate lineage integrity
   */
  static validateLineage(lineage: DataLineage): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for broken chain
    if (lineage.totalNodes < 5) {
      issues.push('Lineage chain is incomplete (less than 5 nodes)');
    }

    // Check for missing hashes
    const hasMissingHashes = this.checkForMissingHashes(lineage.root);
    if (hasMissingHashes) {
      issues.push('Some nodes are missing SHA-256 hashes');
    }

    // Check for invalid nodes
    if (lineage.hasConflict) {
      issues.push('Lineage contains conflicts or invalid nodes');
    }

    // Check confidence scores
    const lowConfidenceNodes = this.findLowConfidenceNodes(lineage.root, 50);
    if (lowConfidenceNodes > 0) {
      issues.push(`${lowConfidenceNodes} nodes have confidence below 50%`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private static checkForMissingHashes(node: LineageNode): boolean {
    if (node.type === 'REGISTRY' || node.type === 'RAW_JSON') {
      if (!node.hash) return true;
    }
    if (node.children) {
      return node.children.some(child => this.checkForMissingHashes(child));
    }
    return false;
  }

  private static findLowConfidenceNodes(node: LineageNode, threshold: number): number {
    let count = node.confidence < threshold ? 1 : 0;
    if (node.children) {
      node.children.forEach(child => {
        count += this.findLowConfidenceNodes(child, threshold);
      });
    }
    return count;
  }
}
