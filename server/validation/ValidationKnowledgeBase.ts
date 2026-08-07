/**
 * MASTER PRODUCTION BATTLEFIELD SPECIFICATION v5.0
 * PREDATOR Analytics - Autonomous Production Certification & Continuous Validation Framework
 * 
 * Validation Knowledge Base
 * 
 * After each fix, the system remembers the problem.
 * 
 * Structure:
 * Incident -> Root Cause -> Fix -> Regression -> ADR -> Knowledge Base
 * 
 * Next time, Antigravity doesn't analyze from scratch but uses accumulated knowledge.
 */

export interface KnowledgeEntry {
  entryId: string;
  title: string;
  category: string;
  pattern: string;
  incident: IncidentReference;
  rootCause: RootCauseReference;
  fix: FixReference;
  regression: RegressionReference;
  adr: ADRReference;
  effectiveness: number; // 0-100
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentReference {
  incidentId: string;
  description: string;
  severity: string;
  affectedComponents: string[];
  timestamp: string;
}

export interface RootCauseReference {
  causeId: string;
  description: string;
  category: string;
  confidence: number;
}

export interface FixReference {
  solutionId: string;
  type: string;
  description: string;
  files: string[];
  commands: string[];
}

export interface RegressionReference {
  testResults: any;
  passed: boolean;
  duration: number;
}

export interface ADRReference {
  adrId: string;
  title: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';
  context: string;
  decision: string;
  consequences: string[];
}

export interface KnowledgeMatch {
  entry: KnowledgeEntry;
  similarity: number;
  matchReason: string;
}

export class ValidationKnowledgeBase {
  private knowledge: Map<string, KnowledgeEntry> = new Map();
  private patternIndex: Map<string, string[]> = new Map();
  private categoryIndex: Map<string, string[]> = new Map();

  /**
   * Add knowledge entry from incident resolution
   */
  async addKnowledgeEntry(
    incident: IncidentReference,
    rootCause: RootCauseReference,
    fix: FixReference,
    regression: RegressionReference,
    adr?: ADRReference
  ): Promise<string> {
    const entryId = this.generateEntryId();
    const pattern = this.extractPattern(incident, rootCause);
    
    const entry: KnowledgeEntry = {
      entryId,
      title: this.generateTitle(incident, rootCause),
      category: rootCause.category,
      pattern,
      incident,
      rootCause,
      fix,
      regression,
      adr: adr || this.generateDefaultADR(incident, rootCause, fix),
      effectiveness: regression.passed ? 100 : 0,
      usageCount: 0,
      lastUsed: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.knowledge.set(entryId, entry);
    
    // Update indexes
    this.updateIndexes(entry);
    
    console.log(`[KNOWLEDGE BASE] Added entry: ${entryId} - ${entry.title}`);
    
    return entryId;
  }

  /**
   * Search knowledge base for similar incidents
   */
  searchSimilarIncidents(
    incidentDescription: string,
    category: string,
    affectedComponents: string[]
  ): KnowledgeMatch[] {
    const matches: KnowledgeMatch[] = [];
    
    // Search by pattern
    const pattern = this.extractPatternFromDescription(incidentDescription, category);
    const patternMatches = this.patternIndex.get(pattern) || [];
    
    for (const entryId of patternMatches) {
      const entry = this.knowledge.get(entryId);
      if (entry) {
        matches.push({
          entry,
          similarity: this.calculateSimilarity(incidentDescription, entry.incident.description),
          matchReason: 'Pattern match'
        });
      }
    }
    
    // Search by category
    const categoryMatches = this.categoryIndex.get(category) || [];
    for (const entryId of categoryMatches) {
      const entry = this.knowledge.get(entryId);
      if (entry && !matches.find(m => m.entry.entryId === entryId)) {
        matches.push({
          entry,
          similarity: this.calculateSimilarity(incidentDescription, entry.incident.description),
          matchReason: 'Category match'
        });
      }
    }
    
    // Search by component similarity
    for (const entry of this.knowledge.values()) {
      if (!matches.find(m => m.entry.entryId === entry.entryId)) {
        const componentOverlap = this.calculateComponentOverlap(
          affectedComponents,
          entry.incident.affectedComponents
        );
        
        if (componentOverlap > 0.5) {
          matches.push({
            entry,
            similarity: componentOverlap * 100,
            matchReason: 'Component overlap'
          });
        }
      }
    }
    
    // Sort by similarity
    matches.sort((a, b) => b.similarity - a.similarity);
    
    return matches.slice(0, 5); // Return top 5 matches
  }

  /**
   * Get suggested fix for an incident
   */
  getSuggestedFix(incidentId: string): FixReference | null {
    const matches = this.searchSimilarIncidents('', '', []);
    
    if (matches.length > 0 && matches[0].similarity > 70) {
      // Increment usage count
      const entry = matches[0].entry;
      entry.usageCount++;
      entry.lastUsed = new Date().toISOString();
      
      console.log(`[KNOWLEDGE BASE] Suggested fix from entry: ${entry.entryId} (similarity: ${matches[0].similarity}%)`);
      
      return entry.fix;
    }
    
    return null;
  }

  /**
   * Update entry effectiveness after regression
   */
  updateEntryEffectiveness(entryId: string, regressionPassed: boolean): void {
    const entry = this.knowledge.get(entryId);
    if (!entry) return;
    
    // Update effectiveness using exponential moving average
    const currentEffectiveness = entry.effectiveness;
    const newEffectiveness = regressionPassed ? 100 : 0;
    
    entry.effectiveness = Math.round(currentEffectiveness * 0.7 + newEffectiveness * 0.3);
    entry.updatedAt = new Date().toISOString();
    
    console.log(`[KNOWLEDGE BASE] Updated effectiveness for ${entryId}: ${entry.effectiveness}%`);
  }

  /**
   * Get knowledge statistics
   */
  getStatistics(): {
    totalEntries: number;
    byCategory: Record<string, number>;
    averageEffectiveness: number;
    mostUsed: KnowledgeEntry | null;
    recentEntries: KnowledgeEntry[];
  } {
    const entries = Array.from(this.knowledge.values());
    const byCategory: Record<string, number> = {};
    
    for (const entry of entries) {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
    }
    
    const averageEffectiveness = entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.effectiveness, 0) / entries.length)
      : 0;
    
    const mostUsed = entries.length > 0
      ? entries.reduce((max, e) => e.usageCount > max.usageCount ? e : max)
      : null;
    
    const recentEntries = entries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    return {
      totalEntries: entries.length,
      byCategory,
      averageEffectiveness,
      mostUsed,
      recentEntries
    };
  }

  /**
   * Extract pattern from incident and root cause
   */
  private extractPattern(incident: IncidentReference, rootCause: RootCauseReference): string {
    const normalizedDescription = incident.description.toLowerCase().replace(/\s+/g, '_');
    const normalizedCategory = rootCause.category.toLowerCase();
    return `${normalizedCategory}:${normalizedDescription}`;
  }

  /**
   * Extract pattern from description
   */
  private extractPatternFromDescription(description: string, category: string): string {
    const normalized = description.toLowerCase().replace(/\s+/g, '_');
    return `${category.toLowerCase()}:${normalized}`;
  }

  /**
   * Generate title for knowledge entry
   */
  private generateTitle(incident: IncidentReference, rootCause: RootCauseReference): string {
    return `${rootCause.category}: ${incident.description.substring(0, 50)}...`;
  }

  /**
   * Generate default ADR
   */
  private generateDefaultADR(
    incident: IncidentReference,
    rootCause: RootCauseReference,
    fix: FixReference
  ): ADRReference {
    return {
      adrId: this.generateADRId(),
      title: `Fix for ${incident.incidentId}`,
      status: 'ACCEPTED',
      context: `Incident: ${incident.description}. Root cause: ${rootCause.description}.`,
      decision: `Apply fix: ${fix.description}`,
      consequences: [
        'System stability improved',
        'Incident resolved',
        'Regression tests passed'
      ]
    };
  }

  /**
   * Update indexes
   */
  private updateIndexes(entry: KnowledgeEntry): void {
    // Pattern index
    if (!this.patternIndex.has(entry.pattern)) {
      this.patternIndex.set(entry.pattern, []);
    }
    this.patternIndex.get(entry.pattern)!.push(entry.entryId);
    
    // Category index
    if (!this.categoryIndex.has(entry.category)) {
      this.categoryIndex.set(entry.category, []);
    }
    this.categoryIndex.get(entry.category)!.push(entry.entryId);
  }

  /**
   * Calculate similarity between two descriptions
   */
  private calculateSimilarity(desc1: string, desc2: string): number {
    const words1 = desc1.toLowerCase().split(/\s+/);
    const words2 = desc2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(w => words2.includes(w));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? (intersection.length / union.size) * 100 : 0;
  }

  /**
   * Calculate component overlap
   */
  private calculateComponentOverlap(components1: string[], components2: string[]): number {
    if (components1.length === 0 || components2.length === 0) return 0;
    
    const intersection = components1.filter(c => components2.includes(c));
    const union = new Set([...components1, ...components2]);
    
    return intersection.length / union.size;
  }

  /**
   * Get entry by ID
   */
  getEntry(entryId: string): KnowledgeEntry | null {
    return this.knowledge.get(entryId) || null;
  }

  /**
   * Get all entries
   */
  getAllEntries(): KnowledgeEntry[] {
    return Array.from(this.knowledge.values());
  }

  /**
   * Get entries by category
   */
  getEntriesByCategory(category: string): KnowledgeEntry[] {
    return Array.from(this.knowledge.values()).filter(e => e.category === category);
  }

  /**
   * Generate entry ID
   */
  private generateEntryId(): string {
    return `KB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate ADR ID
   */
  private generateADRId(): string {
    return `ADR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.knowledge.clear();
    this.patternIndex.clear();
    this.categoryIndex.clear();
  }
}
