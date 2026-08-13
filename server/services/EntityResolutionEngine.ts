/**
 * PREDATOR MLIP — Entity Resolution Engine (ERE)
 * §3.2 — Deterministic, Probabilistic, Fuzzy, Graph-based clustering
 */
import {
  EntityNode, EntityEdge, EntityMatchCandidate,
  ConfidenceScore, MLIPGraph, getConfidenceLevel, IntelLayer
} from '../../src/types/mlip';
import crypto from 'crypto';

export class EntityResolutionEngine {

  // ─── Jaro-Winkler Similarity ──────────────────────────────────────────
  private jaroWinkler(s1: string, s2: string): number {
    s1 = s1.toLowerCase().trim();
    s2 = s2.toLowerCase().trim();
    if (s1 === s2) return 1.0;
    if (!s1 || !s2) return 0.0;

    const maxDist = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);
    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - maxDist);
      const end = Math.min(i + maxDist + 1, s2.length);
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
    const prefix = Math.min(4, [...s1].findIndex((c, i) => c !== s2[i]) === -1 ? Math.min(s1.length, s2.length) : [...s1].findIndex((c, i) => c !== s2[i]));
    return jaro + prefix * 0.1 * (1 - jaro);
  }

  // ─── Levenshtein Distance ─────────────────────────────────────────────
  private levenshtein(s1: string, s2: string): number {
    const m = s1.length, n = s2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i-1] === s2[j-1] ? 0 : 1;
        dp[i]![j] = Math.min(
          dp[i-1]![j]! + 1,
          dp[i]![j-1]! + 1,
          dp[i-1]![j-1]! + cost
        );
      }
    }
    return dp[m]![n]!;
  }

  private normalizedEditSimilarity(s1: string, s2: string): number {
    const dist = this.levenshtein(s1.toLowerCase(), s2.toLowerCase());
    const maxLen = Math.max(s1.length, s2.length);
    return maxLen === 0 ? 1 : 1 - dist / maxLen;
  }

  // ─── Deterministic Match ──────────────────────────────────────────────
  deterministicMatch(node1: EntityNode, node2: EntityNode): EntityMatchCandidate | null {
    if (node1.type !== node2.type) return null;
    const a = node1.attributes;
    const b = node2.attributes;

    // Exact matches on unique identifiers
    const exactFields = ['edrpou', 'taxId', 'email', 'address', 'ip', 'hash', 'telegramId', 'number'];
    for (const field of exactFields) {
      if (a[field] && b[field] && a[field] === b[field]) {
        return {
          nodeId: node2.id,
          matchScore: 1.0,
          matchType: 'DETERMINISTIC',
          matchedFields: [field],
        };
      }
    }
    return null;
  }

  // ─── Probabilistic Match ──────────────────────────────────────────────
  probabilisticMatch(node1: EntityNode, node2: EntityNode): EntityMatchCandidate | null {
    if (node1.type !== node2.type) return null;
    const a = node1.attributes;
    const b = node2.attributes;
    let score = 0;
    const matchedFields: string[] = [];

    // Name similarity (weighted 0.4)
    const n1 = (a['fullName'] || a['name'] || node1.label || '').toLowerCase();
    const n2 = (b['fullName'] || b['name'] || node2.label || '').toLowerCase();
    if (n1 && n2) {
      const nameSim = this.jaroWinkler(n1, n2);
      if (nameSim > 0.85) { score += nameSim * 0.4; matchedFields.push('name'); }
    }

    // Date of birth (weighted 0.3)
    if (a['dateOfBirth'] && b['dateOfBirth'] && a['dateOfBirth'] === b['dateOfBirth']) {
      score += 0.3; matchedFields.push('dateOfBirth');
    }

    // Country/nationality (weighted 0.1)
    if (a['country'] && b['country'] && a['country'] === b['country']) {
      score += 0.1; matchedFields.push('country');
    }

    // Photo hash (weighted 0.3)
    if (a['faceHash'] && b['faceHash'] && a['faceHash'] === b['faceHash']) {
      score += 0.3; matchedFields.push('faceHash');
    }

    if (score >= 0.6 && matchedFields.length > 0) {
      return {
        nodeId: node2.id,
        matchScore: Math.min(score, 0.95),
        matchType: 'PROBABILISTIC',
        matchedFields,
      };
    }
    return null;
  }

  // ─── Fuzzy Match ──────────────────────────────────────────────────────
  fuzzyMatch(node1: EntityNode, candidates: EntityNode[]): EntityMatchCandidate[] {
    const results: EntityMatchCandidate[] = [];
    const label1 = (node1.attributes?.['fullName'] || node1.attributes?.['name'] || node1.label || '');

    for (const candidate of candidates) {
      if (candidate.id === node1.id || candidate.type !== node1.type) continue;
      const label2 = (candidate.attributes?.['fullName'] || candidate.attributes?.['name'] || candidate.label || '');

      const jw = this.jaroWinkler(label1, label2);
      const ed = this.normalizedEditSimilarity(label1, label2);
      const sim = (jw * 0.6 + ed * 0.4);

      if (sim >= 0.75) {
        results.push({
          nodeId: candidate.id,
          matchScore: sim,
          matchType: 'FUZZY',
          matchedFields: ['label'],
        });
      }
    }
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  // ─── Build Graph from Query Results ──────────────────────────────────
  buildGraph(
    primaryNode: EntityNode,
    relatedNodes: EntityNode[],
    queryLayers: IntelLayer[]
  ): MLIPGraph {
    const allNodes = [primaryNode, ...relatedNodes];
    const edges: EntityEdge[] = [];

    // Auto-create edges from shared attributes
    for (let i = 0; i < relatedNodes.length; i++) {
      const node = relatedNodes[i];
      if (!node) continue;

      // Determine edge type based on node types
      let edgeType: EntityEdge['type'] = 'REFERENCES';
      if (node.type === 'PERSON') edgeType = 'MEMBER_OF';
      if (node.type === 'COMPANY') edgeType = 'OWNS';
      if (node.type === 'PHONE' || node.type === 'EMAIL') edgeType = 'COMMUNICATES_WITH';
      if (node.type === 'DOMAIN' || node.type === 'IP_ADDRESS') edgeType = 'REFERENCES';
      if (node.type === 'CRYPTO_WALLET') edgeType = 'TRANSACTION';

      const confidence: ConfidenceScore = {
        level: getConfidenceLevel(node.confidence.value),
        value: node.confidence.value,
        sources: node.sources.map(s => s.id),
      };

      edges.push({
        id: crypto.randomUUID(),
        fromNodeId: primaryNode.id,
        toNodeId: node.id,
        type: edgeType,
        weight: node.confidence.value,
        weightType: 'structural',
        confidence,
        sources: node.sources,
        firstSeen: node.createdAt,
        lastSeen: node.updatedAt,
      });
    }

    const layerCoverage: Partial<Record<IntelLayer, number>> = {};
    for (const layer of queryLayers) {
      layerCoverage[layer] = allNodes.filter(n => n.layer === layer).length;
    }

    return {
      nodes: allNodes,
      edges,
      generatedAt: new Date().toISOString(),
      totalNodes: allNodes.length,
      totalEdges: edges.length,
      layerCoverage,
    };
  }

  // ─── Calculate Confidence Score ────────────────────────────────────────
  calculateConfidence(evidenceSources: string[], hasOfficialSource: boolean, sourcesCount: number): ConfidenceScore {
    let score = 0;
    if (hasOfficialSource) score += 0.5;
    score += Math.min(sourcesCount * 0.1, 0.4);
    if (evidenceSources.some(s => s.includes('court') || s.includes('edr'))) score += 0.1;
    score = Math.min(score, 1.0);

    return {
      level: getConfidenceLevel(score),
      value: score,
      sources: evidenceSources,
    };
  }

  // ─── Merge duplicate nodes ────────────────────────────────────────────
  mergeNodes(primary: EntityNode, duplicate: EntityNode): EntityNode {
    const merged = { ...primary };
    // Merge attributes (prefer non-null values from duplicate)
    for (const [key, val] of Object.entries(duplicate.attributes)) {
      if (val !== null && val !== undefined && !merged.attributes[key]) {
        merged.attributes[key] = val;
      }
    }
    // Merge sources
    const sourceIds = new Set(primary.sources.map(s => s.id));
    for (const src of duplicate.sources) {
      if (!sourceIds.has(src.id)) merged.sources.push(src);
    }
    // Merge aliases
    if (duplicate.label && duplicate.label !== primary.label) {
      merged.aliases = [...(merged.aliases || []), duplicate.label];
    }
    merged.updatedAt = new Date().toISOString();
    return merged;
  }
}

export const entityResolutionEngine = new EntityResolutionEngine();
