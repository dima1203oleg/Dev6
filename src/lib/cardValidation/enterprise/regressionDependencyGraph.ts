/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Regression Dependency Graph
 * BLOCK 13
 */

import { DependencyNode, RegressionImpact } from './types';

export class RegressionDependencyGraph {
  private static dependencyGraph: Map<string, DependencyNode> = new Map();

  /**
   * Build dependency graph from system components
   */
  static buildDependencyGraph(components: DependencyNode[]): void {
    components.forEach(node => {
      this.dependencyGraph.set(node.id, node);
    });

    // Build reverse dependencies (affectedBy)
    this.dependencyGraph.forEach(node => {
      node.dependsOn.forEach(depId => {
        const depNode = this.dependencyGraph.get(depId);
        if (depNode) {
          depNode.affectedBy = depNode.affectedBy || [];
          depNode.affectedBy.push(node.id);
        }
      });
    });
  }

  /**
   * Calculate regression impact when a component changes
   */
  static calculateRegressionImpact(changedNodeId: string): RegressionImpact {
    const changedNode = this.dependencyGraph.get(changedNodeId);
    
    if (!changedNode) {
      return {
        changedNode: changedNodeId,
        affectedNodes: [],
        impactLevel: 'LOW',
        requiresRevalidation: false,
        estimatedRisk: 0,
      };
    }

    // Find all affected nodes using BFS
    const affectedNodes = this.findAffectedNodes(changedNodeId);
    
    // Calculate impact level
    const impactLevel = this.calculateImpactLevel(changedNode, affectedNodes);
    
    // Determine if revalidation is required
    const requiresRevalidation = this.requiresRevalidation(changedNode, affectedNodes);
    
    // Estimate risk
    const estimatedRisk = this.estimateRisk(changedNode, affectedNodes);

    return {
      changedNode: changedNodeId,
      affectedNodes,
      impactLevel,
      requiresRevalidation,
      estimatedRisk,
    };
  }

  /**
   * Find all nodes affected by a change using BFS
   */
  private static findAffectedNodes(startNodeId: string): string[] {
    const affected: string[] = [];
    const visited = new Set<string>();
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this.dependencyGraph.get(nodeId);
      if (!node) continue;

      // Add all nodes that depend on this node
      if (node.affectedBy) {
        node.affectedBy.forEach(affectedId => {
          if (!visited.has(affectedId)) {
            affected.push(affectedId);
            queue.push(affectedId);
          }
        });
      }
    }

    return affected;
  }

  /**
   * Calculate impact level based on node type and affected nodes
   */
  private static calculateImpactLevel(
    changedNode: DependencyNode,
    affectedNodes: string[]
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // Critical components always have high impact
    if (changedNode.type === 'REGISTRY' || changedNode.type === 'CONNECTOR') {
      if (affectedNodes.length > 5) return 'CRITICAL';
      return 'HIGH';
    }

    // Risk engine changes are critical
    if (changedNode.type === 'RISK_ENGINE') {
      return 'HIGH';
    }

    // AI changes affect many components
    if (changedNode.type === 'AI') {
      if (affectedNodes.length > 3) return 'HIGH';
      return 'MEDIUM';
    }

    // Card changes
    if (changedNode.type === 'CARD') {
      if (affectedNodes.length > 10) return 'HIGH';
      if (affectedNodes.length > 5) return 'MEDIUM';
      return 'LOW';
    }

    // Export changes
    if (changedNode.type === 'EXPORT') {
      return 'LOW';
    }

    // Default based on number of affected nodes
    if (affectedNodes.length > 10) return 'CRITICAL';
    if (affectedNodes.length > 5) return 'HIGH';
    if (affectedNodes.length > 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Determine if revalidation is required
   */
  private static requiresRevalidation(
    changedNode: DependencyNode,
    affectedNodes: string[]
  ): boolean {
    // Always revalidate for critical changes
    if (changedNode.type === 'REGISTRY' || changedNode.type === 'CONNECTOR') {
      return true;
    }

    // Revalidate if critical cards are affected
    const criticalCards = affectedNodes.filter(nodeId => {
      const node = this.dependencyGraph.get(nodeId);
      return node?.type === 'CARD' && nodeId.includes('critical');
    });

    if (criticalCards.length > 0) {
      return true;
    }

    // Revalidate if risk engine is affected
    if (affectedNodes.some(nodeId => {
      const node = this.dependencyGraph.get(nodeId);
      return node?.type === 'RISK_ENGINE';
    })) {
      return true;
    }

    // Revalidate if many components are affected
    if (affectedNodes.length > 5) {
      return true;
    }

    return false;
  }

  /**
   * Estimate risk score (0-100)
   */
  private static estimateRisk(
    changedNode: DependencyNode,
    affectedNodes: string[]
  ): number {
    let risk = 0;

    // Base risk based on node type
    const typeRisk: Record<string, number> = {
      'REGISTRY': 80,
      'CONNECTOR': 70,
      'RISK_ENGINE': 75,
      'AI': 60,
      'CARD': 40,
      'EXPORT': 20,
    };
    risk += typeRisk[changedNode.type] || 30;

    // Add risk based on number of affected nodes
    risk += Math.min(affectedNodes.length * 5, 30);

    // Add risk if critical components are affected
    const criticalAffected = affectedNodes.filter(nodeId => {
      const node = this.dependencyGraph.get(nodeId);
      return node?.type === 'CARD' && nodeId.includes('critical');
    });
    risk += criticalAffected.length * 10;

    // Cap at 100
    return Math.min(risk, 100);
  }

  /**
   * Get full dependency path between two nodes
   */
  static getDependencyPath(fromNodeId: string, toNodeId: string): string[] {
    const path: string[] = [];
    const visited = new Set<string>();
    
    if (this.findPathDFS(fromNodeId, toNodeId, path, visited)) {
      return path;
    }

    return [];
  }

  /**
   * DFS to find path between nodes
   */
  private static findPathDFS(
    currentId: string,
    targetId: string,
    path: string[],
    visited: Set<string>
  ): boolean {
    visited.add(currentId);
    path.push(currentId);

    if (currentId === targetId) {
      return true;
    }

    const node = this.dependencyGraph.get(currentId);
    if (!node) {
      path.pop();
      return false;
    }

    for (const depId of node.dependsOn) {
      if (!visited.has(depId)) {
        if (this.findPathDFS(depId, targetId, path, visited)) {
          return true;
        }
      }
    }

    path.pop();
    return false;
  }

  /**
   * Get all critical paths in the graph
   */
  static getCriticalPaths(): Array<{ from: string; to: string; path: string[] }> {
    const criticalPaths: Array<{ from: string; to: string; path: string[] }> = [];
    const criticalNodes = Array.from(this.dependencyGraph.values()).filter(
      node => node.type === 'REGISTRY' || node.type === 'RISK_ENGINE'
    );

    // Find paths from critical nodes to all cards
    criticalNodes.forEach(criticalNode => {
      this.dependencyGraph.forEach((node, nodeId) => {
        if (node.type === 'CARD') {
          const path = this.getDependencyPath(nodeId, criticalNode.id);
          if (path.length > 0) {
            criticalPaths.push({
              from: nodeId,
              to: criticalNode.id,
              path,
            });
          }
        }
      });
    });

    return criticalPaths;
  }

  /**
   * Visualize dependency graph as DOT format
   */
  static visualizeAsDOT(): string {
    let dot = 'digraph DependencyGraph {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';

    // Add nodes
    this.dependencyGraph.forEach((node, id) => {
      const color = this.getNodeColor(node.type);
      dot += `  "${id}" [label="${node.name}", fillcolor="${color}", style="filled"];\n`;
    });

    // Add edges
    this.dependencyGraph.forEach((node, id) => {
      node.dependsOn.forEach(depId => {
        dot += `  "${id}" -> "${depId}";\n`;
      });
    });

    dot += '}';
    return dot;
  }

  /**
   * Get color for node type
   */
  private static getNodeColor(type: string): string {
    const colors: Record<string, string> = {
      'REGISTRY': '#ff6b6b',
      'CONNECTOR': '#feca57',
      'RISK_ENGINE': '#ff9ff3',
      'AI': '#54a0ff',
      'CARD': '#5f27cd',
      'EXPORT': '#00d2d3',
    };
    return colors[type] || '#c8d6e5';
  }

  /**
   * Get graph statistics
   */
  static getGraphStats(): {
    totalNodes: number;
    totalEdges: number;
    byType: Record<string, number>;
    criticalPaths: number;
  } {
    let totalEdges = 0;
    const byType: Record<string, number> = {};

    this.dependencyGraph.forEach(node => {
      totalEdges += node.dependsOn.length;
      byType[node.type] = (byType[node.type] || 0) + 1;
    });

    const criticalPaths = this.getCriticalPaths().length;

    return {
      totalNodes: this.dependencyGraph.size,
      totalEdges,
      byType,
      criticalPaths,
    };
  }

  /**
   * Clear dependency graph
   */
  static clearGraph(): void {
    this.dependencyGraph.clear();
  }
}
