/**
 * MASTER PRODUCTION BATTLEFIELD SPECIFICATION v5.0
 * PREDATOR Analytics - Autonomous Production Certification & Continuous Validation Framework
 * 
 * Production Evidence Graph
 * 
 * Upgrades Evidence Vault to graph model.
 * 
 * Each fact is a node:
 * 
 * Person
 *     │
 *     │
 * Registry
 *     │
 *     │
 * Connector
 *     │
 *     │
 * Raw JSON
 *     │
 *     │
 * Evidence
 *     │
 *     │
 * Risk
 *     │
 *     │
 * AI Report
 * 
 * This enables explaining the origin of any conclusion.
 */

export interface EvidenceNode {
  nodeId: string;
  nodeType: 'PERSON' | 'ENTITY' | 'REGISTRY' | 'CONNECTOR' | 'RAW_DATA' | 'EVIDENCE' | 'TRANSFORMATION' | 'NORMALIZED' | 'ANALYTICS' | 'RISK' | 'AI_REPORT' | 'UI_VALUE';
  data: any;
  hash: string;
  timestamp: string;
  sourceId?: string;
}

export interface EvidenceEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: 'QUERIED' | 'FETCHED' | 'PROCESSED' | 'TRANSFORMED' | 'NORMALIZED' | 'ANALYZED' | 'CALCULATED' | 'GENERATED' | 'DISPLAYED';
  timestamp: string;
  metadata?: any;
}

export interface EvidencePath {
  pathId: string;
  startNodeId: string;
  endNodeId: string;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
  complete: boolean;
  integrityVerified: boolean;
}

export class ProductionEvidenceGraph {
  private nodes: Map<string, EvidenceNode> = new Map();
  private edges: Map<string, EvidenceEdge> = new Map();
  private adjacencyList: Map<string, string[]> = new Map();

  /**
   * Add a node to the graph
   */
  addNode(node: EvidenceNode): void {
    const nodeHash = this.computeHash(node.data);
    node.hash = nodeHash;
    this.nodes.set(node.nodeId, node);
    this.adjacencyList.set(node.nodeId, []);
    console.log(`[EVIDENCE GRAPH] Added node: ${node.nodeId} (${node.nodeType})`);
  }

  /**
   * Add an edge between nodes
   */
  addEdge(edge: EvidenceEdge): void {
    this.edges.set(edge.edgeId, edge);
    
    // Update adjacency list
    const fromAdj = this.adjacencyList.get(edge.fromNodeId) || [];
    fromAdj.push(edge.toNodeId);
    this.adjacencyList.set(edge.fromNodeId, fromAdj);
    
    console.log(`[EVIDENCE GRAPH] Added edge: ${edge.fromNodeId} -> ${edge.toNodeId} (${edge.edgeType})`);
  }

  /**
   * Build complete evidence chain for a UI value
   */
  buildEvidenceChain(uiValueNodeId: string): EvidencePath {
    const pathId = this.generatePathId();
    const nodes: EvidenceNode[] = [];
    const edges: EvidenceEdge[] = [];
    
    // Traverse backwards from UI value to source
    const visited = new Set<string>();
    const queue = [uiValueNodeId];
    
    while (queue.length > 0 && visited.size < 100) { // Prevent infinite loops
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const node = this.nodes.get(currentId);
      if (node) {
        nodes.push(node);
      }
      
      // Find incoming edges
      const incomingEdges = this.getIncomingEdges(currentId);
      for (const edge of incomingEdges) {
        edges.push(edge);
        queue.push(edge.fromNodeId);
      }
    }
    
    // Sort nodes by timestamp (oldest first)
    nodes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Sort edges by timestamp
    edges.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Verify integrity
    const integrityVerified = this.verifyPathIntegrity(nodes, edges);
    
    const path: EvidencePath = {
      pathId,
      startNodeId: nodes.length > 0 ? nodes[0]?.nodeId || '' : '',
      endNodeId: uiValueNodeId,
      nodes,
      edges,
      complete: this.isPathComplete(nodes),
      integrityVerified
    };
    
    return path;
  }

  /**
   * Get incoming edges for a node
   */
  private getIncomingEdges(nodeId: string): EvidenceEdge[] {
    const incoming: EvidenceEdge[] = [];
    
    for (const edge of this.edges.values()) {
      if (edge.toNodeId === nodeId) {
        incoming.push(edge);
      }
    }
    
    return incoming;
  }

  /**
   * Verify path integrity
   */
  private verifyPathIntegrity(nodes: EvidenceNode[], edges: EvidenceEdge[]): boolean {
    // Verify each edge connects valid nodes
    for (const edge of edges) {
      const fromExists = nodes.some(n => n.nodeId === edge.fromNodeId);
      const toExists = nodes.some(n => n.nodeId === edge.toNodeId);
      
      if (!fromExists || !toExists) {
        return false;
      }
    }
    
    // Verify hash integrity for each node
    for (const node of nodes) {
      const computedHash = this.computeHash(node.data);
      if (computedHash !== node.hash) {
        console.warn(`[EVIDENCE GRAPH] Hash mismatch for node: ${node.nodeId}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if path is complete (has all required node types)
   */
  private isPathComplete(nodes: EvidenceNode[]): boolean {
    const requiredTypes: Array<'REGISTRY' | 'CONNECTOR' | 'RAW_DATA' | 'EVIDENCE' | 'UI_VALUE'> = ['REGISTRY', 'CONNECTOR', 'RAW_DATA', 'EVIDENCE', 'UI_VALUE'];
    const presentTypes = new Set(nodes.map(n => n.nodeType));
    
    return requiredTypes.every(type => presentTypes.has(type));
  }

  /**
   * Create evidence chain for a data point
   */
  async createEvidenceChain(
    identifier: string,
    registryId: string,
    connectorId: string,
    rawData: any,
    normalizedData: any,
    analyticsResult: any,
    uiValue: any
  ): Promise<EvidencePath> {
    const timestamp = new Date().toISOString();
    
    // Create nodes
    const registryNode: EvidenceNode = {
      nodeId: this.generateNodeId('REGISTRY'),
      nodeType: 'REGISTRY',
      data: { registryId, identifier },
      hash: '',
      timestamp,
      sourceId: registryId
    };
    
    const connectorNode: EvidenceNode = {
      nodeId: this.generateNodeId('CONNECTOR'),
      nodeType: 'CONNECTOR',
      data: { connectorId, registryId },
      hash: '',
      timestamp,
      sourceId: connectorId
    };
    
    const rawDataNode: EvidenceNode = {
      nodeId: this.generateNodeId('RAW_DATA'),
      nodeType: 'RAW_DATA',
      data: rawData,
      hash: '',
      timestamp
    };
    
    const evidenceNode: EvidenceNode = {
      nodeId: this.generateNodeId('EVIDENCE'),
      nodeType: 'EVIDENCE',
      data: { ...rawData, provenance: true },
      hash: '',
      timestamp
    };
    
    const normalizedNode: EvidenceNode = {
      nodeId: this.generateNodeId('NORMALIZED'),
      nodeType: 'NORMALIZED',
      data: normalizedData,
      hash: '',
      timestamp
    };
    
    const analyticsNode: EvidenceNode = {
      nodeId: this.generateNodeId('ANALYTICS'),
      nodeType: 'ANALYTICS',
      data: analyticsResult,
      hash: '',
      timestamp
    };
    
    const uiNode: EvidenceNode = {
      nodeId: this.generateNodeId('UI_VALUE'),
      nodeType: 'UI_VALUE',
      data: uiValue,
      hash: '',
      timestamp
    };
    
    // Add nodes
    this.addNode(registryNode);
    this.addNode(connectorNode);
    this.addNode(rawDataNode);
    this.addNode(evidenceNode);
    this.addNode(normalizedNode);
    this.addNode(analyticsNode);
    this.addNode(uiNode);
    
    // Create edges
    this.addEdge({
      edgeId: this.generateEdgeId(),
      fromNodeId: registryNode.nodeId,
      toNodeId: connectorNode.nodeId,
      edgeType: 'QUERIED',
      timestamp
    });
    
    this.addEdge({
      edgeId: this.generateEdgeId(),
      fromNodeId: connectorNode.nodeId,
      toNodeId: rawDataNode.nodeId,
      edgeType: 'FETCHED',
      timestamp
    });
    
    this.addEdge({
      edgeId: this.generateEdgeId(),
      fromNodeId: rawDataNode.nodeId,
      toNodeId: evidenceNode.nodeId,
      edgeType: 'PROCESSED',
      timestamp
    });
    
    this.addEdge({
      edgeId: this.generateEdgeId(),
      fromNodeId: evidenceNode.nodeId,
      toNodeId: normalizedNode.nodeId,
      edgeType: 'NORMALIZED',
      timestamp
    });
    
    this.addEdge({
      edgeId: this.generateEdgeId(),
      fromNodeId: normalizedNode.nodeId,
      toNodeId: analyticsNode.nodeId,
      edgeType: 'ANALYZED',
      timestamp
    });
    
    this.addEdge({
      edgeId: this.generateEdgeId(),
      fromNodeId: analyticsNode.nodeId,
      toNodeId: uiNode.nodeId,
      edgeType: 'DISPLAYED',
      timestamp
    });
    
    // Build and return the path
    return this.buildEvidenceChain(uiNode.nodeId);
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): EvidenceNode | null {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Get edge by ID
   */
  getEdge(edgeId: string): EvidenceEdge | null {
    return this.edges.get(edgeId) || null;
  }

  /**
   * Get all nodes
   */
  getAllNodes(): EvidenceNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges
   */
  getAllEdges(): EvidenceEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Get nodes by type
   */
  getNodesByType(nodeType: EvidenceNode['nodeType']): EvidenceNode[] {
    return Array.from(this.nodes.values()).filter(n => n.nodeType === nodeType);
  }

  /**
   * Get graph statistics
   */
  getStatistics(): {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
    edgesByType: Record<string, number>;
    averagePathLength: number;
  } {
    const nodesByType: Record<string, number> = {};
    for (const node of this.nodes.values()) {
      nodesByType[node.nodeType] = (nodesByType[node.nodeType] || 0) + 1;
    }
    
    const edgesByType: Record<string, number> = {};
    for (const edge of this.edges.values()) {
      edgesByType[edge.edgeType] = (edgesByType[edge.edgeType] || 0) + 1;
    }
    
    // Calculate average path length
    let totalPathLength = 0;
    let pathCount = 0;
    
    for (const nodeId of this.nodes.keys()) {
      const path = this.buildEvidenceChain(nodeId);
      if (path.nodes.length > 0) {
        totalPathLength += path.nodes.length;
        pathCount++;
      }
    }
    
    const averagePathLength = pathCount > 0 ? totalPathLength / pathCount : 0;
    
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodesByType,
      edgesByType,
      averagePathLength
    };
  }

  /**
   * Visualize graph structure
   */
  visualizeGraph(): string {
    let visualization = 'Evidence Graph Structure:\n\n';
    
    visualization += 'Nodes:\n';
    for (const [nodeId, node] of this.nodes) {
      visualization += `  ${nodeId} [${node.nodeType}]\n`;
    }
    
    visualization += '\nEdges:\n';
    for (const edge of this.edges.values()) {
      visualization += `  ${edge.fromNodeId} -> ${edge.toNodeId} [${edge.edgeType}]\n`;
    }
    
    return visualization;
  }

  /**
   * Compute hash of data
   */
  private computeHash(data: any): string {
    const crypto = require('crypto');
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generate node ID
   */
  private generateNodeId(nodeType: EvidenceNode['nodeType']): string {
    return `NODE-${nodeType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate edge ID
   */
  private generateEdgeId(): string {
    return `EDGE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate path ID
   */
  private generatePathId(): string {
    return `PATH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
  }
}
