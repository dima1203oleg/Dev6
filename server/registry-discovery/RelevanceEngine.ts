/**
 * Registry Discovery Platform (RDP)
 * Relevance Engine
 * 
 * Ranks datasets by relevance based on keywords, organization, and metadata
 * Creates priority queue for ingestion (HIGH/MEDIUM/LOW)
 */

import { Dataset } from './types';

export interface RelevanceScore {
  dataset: Dataset;
  score: number;
  reasons: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class RelevanceEngine {
  private keywords: string[];
  private organizations: string[];
  private formats: string[];

  constructor(config: {
    keywords?: string[];
    organizations?: string[];
    formats?: string[];
  } = {}) {
    this.keywords = config.keywords || [
      'registry', 'register', 'реєстр', 'registry',
      'legal', 'entity', 'company', 'person', 'юридична', 'особа',
      'tax', 'court', 'sanction', 'license', 'податок', 'суд', 'санкція',
      'edr', 'edrpou', 'rnokpp', 'ipn', 'inn',
    ];
    
    this.organizations = config.organizations || [
      'justice', 'tax', 'court', 'nabu', 'nazk', 'procurement',
      'юстиція', 'податкова', 'суд', 'закупівлі',
    ];
    
    this.formats = config.formats || ['CSV', 'JSON', 'XLSX'];
  }

  /**
   * Score a single dataset for relevance
   */
  scoreDataset(dataset: Dataset): RelevanceScore {
    const reasons: string[] = [];
    let score = 0;

    // Check title for keywords
    const titleLower = dataset.title.toLowerCase();
    for (const keyword of this.keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        score += 10;
        reasons.push(`Keyword match: ${keyword}`);
      }
    }

    // Check description for keywords
    if (dataset.description) {
      const descLower = dataset.description.toLowerCase();
      for (const keyword of this.keywords) {
        if (descLower.includes(keyword.toLowerCase())) {
          score += 5;
          reasons.push(`Description keyword: ${keyword}`);
        }
      }
    }

    // Check organization (CKAN returns organization as object or string)
    if (dataset.organization) {
      const orgValue = typeof dataset.organization === 'string' 
        ? dataset.organization 
        : (dataset.organization.name || dataset.organization.id || '');
      const orgLower = orgValue.toLowerCase();
      for (const org of this.organizations) {
        if (orgLower.includes(org.toLowerCase())) {
          score += 15;
          reasons.push(`Organization match: ${org}`);
        }
      }
    }

    // Check format
    if (this.formats.includes(dataset.format)) {
      score += 5;
      reasons.push(`Format match: ${dataset.format}`);
    }

    // Check tags (CKAN returns tags as objects with name property)
    for (const tag of dataset.tags) {
      const tagValue = typeof tag === 'string' ? tag : (tag.name || tag.display_name || '');
      const tagLower = tagValue.toLowerCase();
      for (const keyword of this.keywords) {
        if (tagLower.includes(keyword.toLowerCase())) {
          score += 8;
          reasons.push(`Tag match: ${tagValue}`);
        }
      }
    }

    // Determine priority
    let priority: 'HIGH' | 'MEDIUM' | 'LOW';
    if (score >= 30) {
      priority = 'HIGH';
    } else if (score >= 15) {
      priority = 'MEDIUM';
    } else {
      priority = 'LOW';
    }

    return {
      dataset,
      score,
      reasons,
      priority,
    };
  }

  /**
   * Score multiple datasets and create priority queue
   */
  createPriorityQueue(datasets: Dataset[]): {
    high: RelevanceScore[];
    medium: RelevanceScore[];
    low: RelevanceScore[];
    total: number;
  } {
    console.log(`[RelevanceEngine] Scoring ${datasets.length} datasets`);

    const scores = datasets.map(dataset => this.scoreDataset(dataset));

    const high = scores.filter(s => s.priority === 'HIGH').sort((a, b) => b.score - a.score);
    const medium = scores.filter(s => s.priority === 'MEDIUM').sort((a, b) => b.score - a.score);
    const low = scores.filter(s => s.priority === 'LOW').sort((a, b) => b.score - a.score);

    console.log(`[RelevanceEngine] Priority queue: HIGH=${high.length}, MEDIUM=${medium.length}, LOW=${low.length}`);

    return {
      high,
      medium,
      low,
      total: datasets.length,
    };
  }

  /**
   * Get high priority datasets for ingestion
   */
  getHighPriorityDatasets(datasets: Dataset[], limit?: number): Dataset[] {
    const priorityQueue = this.createPriorityQueue(datasets);
    const highPriority = priorityQueue.high.map(s => s.dataset);
    
    if (limit) {
      return highPriority.slice(0, limit);
    }
    
    return highPriority;
  }

  /**
   * Update relevance configuration
   */
  updateConfig(config: {
    keywords?: string[];
    organizations?: string[];
    formats?: string[];
  }): void {
    if (config.keywords) this.keywords = config.keywords;
    if (config.organizations) this.organizations = config.organizations;
    if (config.formats) this.formats = config.formats;
  }

  /**
   * Get relevance statistics
   */
  getStatistics(datasets: Dataset[]): {
    total: number;
    high: number;
    medium: number;
    low: number;
    averageScore: number;
  } {
    const priorityQueue = this.createPriorityQueue(datasets);
    const totalScore = priorityQueue.high.reduce((sum, s) => sum + s.score, 0) +
                      priorityQueue.medium.reduce((sum, s) => sum + s.score, 0) +
                      priorityQueue.low.reduce((sum, s) => sum + s.score, 0);
    
    return {
      total: datasets.length,
      high: priorityQueue.high.length,
      medium: priorityQueue.medium.length,
      low: priorityQueue.low.length,
      averageScore: datasets.length > 0 ? totalScore / datasets.length : 0,
    };
  }
}

// Singleton instance
export const relevanceEngine = new RelevanceEngine();
