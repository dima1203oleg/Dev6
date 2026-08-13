/**
 * Registry Discovery Platform (RDP)
 * Discovery Engine
 * 
 * Automatically discovers datasets from multiple catalog types
 * Integrates with RelevanceEngine for priority queue creation
 */

import { CatalogConfig, Dataset, DiscoveryReport } from './types';
import { RelevanceEngine } from './RelevanceEngine';

export class DiscoveryEngine {
  private catalogs: Map<string, CatalogConfig> = new Map();
  private discoveryHistory: DiscoveryReport[] = [];
  private relevanceEngine: RelevanceEngine;

  constructor() {
    this.relevanceEngine = new RelevanceEngine();
  }

  /**
   * Register a new catalog for discovery
   */
  registerCatalog(config: CatalogConfig): void {
    this.catalogs.set(config.id, config);
    console.log(`[Discovery] Registered catalog: ${config.name} (${config.type})`);
  }

  /**
   * Get all registered catalogs
   */
  getCatalogs(): CatalogConfig[] {
    return Array.from(this.catalogs.values());
  }

  /**
   * Get catalog by ID
   */
  getCatalog(id: string): CatalogConfig | undefined {
    return this.catalogs.get(id);
  }

  /**
   * Enable/disable catalog
   */
  setCatalogEnabled(id: string, enabled: boolean): void {
    const catalog = this.catalogs.get(id);
    if (catalog) {
      catalog.enabled = enabled;
      console.log(`[Discovery] Catalog ${id} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Run discovery process
   */
  async runDiscovery(): Promise<DiscoveryReport> {
    console.log('[Discovery] Starting discovery process');
    
    const startTime = Date.now();
    const allDatasets: Dataset[] = [];
    const allErrors: any[] = [];
    
    for (const catalog of this.catalogs.values()) {
      try {
        const report = await this.discoverCatalog(catalog);
        allDatasets.push(...report.datasets);
        allErrors.push(...report.errors);
      } catch (error) {
        console.error(`[Discovery] Failed to discover catalog ${catalog.id}:`, error);
      }
    }
    
    const report: DiscoveryReport = {
      runId: crypto.randomUUID(),
      timestamp: new Date(),
      catalogId: 'all',
      totalDatasets: allDatasets.length,
      newDatasets: allDatasets.length,
      updatedDatasets: 0,
      failedDatasets: 0,
      processingTime: Date.now() - startTime,
      datasets: allDatasets,
      errors: allErrors,
      summary: `Discovered ${allDatasets.length} datasets from all catalogs`,
    };
    
    this.discoveryHistory.push(report);
    console.log(`[Discovery] Discovery complete: ${allDatasets.length} datasets`);
    
    return report;
  }

  /**
   * Run FULL DISCOVERY with Relevance Engine priority queue
   * Enumerates complete catalog and creates priority queue for ingestion
   */
  async runFullDiscoveryWithRelevance(): Promise<{
    report: DiscoveryReport;
    priorityQueue: {
      high: Dataset[];
      medium: Dataset[];
      low: Dataset[];
      statistics: any;
    };
  }> {
    console.log('[Discovery] Starting FULL DISCOVERY with Relevance Engine');
    
    const startTime = Date.now();
    const allDatasets: Dataset[] = [];
    const allErrors: any[] = [];
    
    for (const catalog of this.catalogs.values()) {
      try {
        const report = await this.discoverCatalog(catalog);
        allDatasets.push(...report.datasets);
        allErrors.push(...report.errors);
      } catch (error) {
        console.error(`[Discovery] Failed to discover catalog ${catalog.id}:`, error);
      }
    }
    
    // Create priority queue using Relevance Engine
    const priorityQueue = this.relevanceEngine.createPriorityQueue(allDatasets);
    const statistics = this.relevanceEngine.getStatistics(allDatasets);
    
    const report: DiscoveryReport = {
      runId: crypto.randomUUID(),
      timestamp: new Date(),
      catalogId: 'all',
      totalDatasets: allDatasets.length,
      newDatasets: allDatasets.length,
      updatedDatasets: 0,
      failedDatasets: 0,
      processingTime: Date.now() - startTime,
      datasets: allDatasets,
      errors: allErrors,
      summary: `Discovered ${allDatasets.length} datasets from all catalogs`,
    };
    
    this.discoveryHistory.push(report);
    
    console.log(`[Discovery] FULL DISCOVERY complete:`);
    console.log(`  Total datasets: ${allDatasets.length}`);
    console.log(`  HIGH priority: ${priorityQueue.high.length}`);
    console.log(`  MEDIUM priority: ${priorityQueue.medium.length}`);
    console.log(`  LOW priority: ${priorityQueue.low.length}`);
    
    return {
      report,
      priorityQueue: {
        high: priorityQueue.high.map(s => s.dataset),
        medium: priorityQueue.medium.map(s => s.dataset),
        low: priorityQueue.low.map(s => s.dataset),
        statistics,
      },
    };
  }

  /**
   * Discover datasets from a specific catalog
   */
  private async discoverCatalog(catalog: CatalogConfig): Promise<DiscoveryReport> {
    const runId = `${catalog.id}-${Date.now()}`;
    const startTime = Date.now();

    console.log(`[Discovery] Discovering catalog: ${catalog.name}`);

    let datasets: Dataset[] = [];
    let errors: any[] = [];

    try {
      switch (catalog.type) {
        case 'CKAN':
          datasets = await this.discoverCKAN(catalog);
          break;
        case 'SOCRATA':
          datasets = await this.discoverSocrata(catalog);
          break;
        case 'ARCGIS_HUB':
          datasets = await this.discoverArcGIS(catalog);
          break;
        case 'OPENDATASOFT':
          datasets = await this.discoverOpenDataSoft(catalog);
          break;
        case 'GITHUB':
          datasets = await this.discoverGitHub(catalog);
          break;
        case 'REST_API':
          datasets = await this.discoverREST(catalog);
          break;
        default:
          throw new Error(`Unsupported catalog type: ${catalog.type}`);
      }

      // Update catalog metadata
      catalog.lastDiscovery = new Date();
      catalog.totalDatasets = datasets.length;

    } catch (error) {
      errors.push({
        datasetId: catalog.id,
        error: String(error),
        timestamp: new Date(),
      });
    }

    const processingTime = Date.now() - startTime;

    const report: DiscoveryReport = {
      runId,
      timestamp: new Date(),
      catalogId: catalog.id,
      totalDatasets: datasets.length,
      newDatasets: datasets.filter(d => this.isNewDataset(d)).length,
      updatedDatasets: datasets.filter(d => this.isUpdatedDataset(d)).length,
      failedDatasets: errors.length,
      processingTime,
      datasets,
      errors,
      summary: this.generateSummary(datasets, errors),
    };

    return report;
  }

  /**
   * Discover datasets from CKAN catalog
   */
  private async discoverCKAN(catalog: CatalogConfig): Promise<Dataset[]> {
    console.log(`[Discovery] Discovering CKAN catalog: ${catalog.baseUrl}`);
    
    const CKANAdapter = require('./adapters/CKANAdapter');
    const adapter = new CKANAdapter(catalog);
    
    return await adapter.discoverAll();
  }

  /**
   * Discover datasets from Socrata catalog
   */
  private async discoverSocrata(catalog: CatalogConfig): Promise<Dataset[]> {
    console.log(`[Discovery] Discovering Socrata catalog: ${catalog.baseUrl}`);
    // TODO: Implement Socrata adapter
    return [];
  }

  /**
   * Discover datasets from ArcGIS Hub catalog
   */
  private async discoverArcGIS(catalog: CatalogConfig): Promise<Dataset[]> {
    console.log(`[Discovery] Discovering ArcGIS Hub catalog: ${catalog.baseUrl}`);
    // TODO: Implement ArcGIS adapter
    return [];
  }

  /**
   * Discover datasets from OpenDataSoft catalog
   */
  private async discoverOpenDataSoft(catalog: CatalogConfig): Promise<Dataset[]> {
    console.log(`[Discovery] Discovering OpenDataSoft catalog: ${catalog.baseUrl}`);
    // TODO: Implement OpenDataSoft adapter
    return [];
  }

  /**
   * Discover datasets from GitHub
   */
  private async discoverGitHub(catalog: CatalogConfig): Promise<Dataset[]> {
    console.log(`[Discovery] Discovering GitHub: ${catalog.baseUrl}`);
    // TODO: Implement GitHub adapter
    return [];
  }

  /**
   * Discover datasets from REST API
   */
  private async discoverREST(catalog: CatalogConfig): Promise<Dataset[]> {
    console.log(`[Discovery] Discovering REST API: ${catalog.baseUrl}`);
    // TODO: Implement REST adapter
    return [];
  }

  /**
   * Check if dataset is new
   */
  private isNewDataset(_dataset: Dataset): boolean {
    // TODO: Implement check against existing catalog
    return true;
  }

  /**
   * Check if dataset has been updated
   */
  private isUpdatedDataset(_dataset: Dataset): boolean {
    // TODO: Implement check against existing catalog
    return false;
  }

  /**
   * Generate discovery summary
   */
  private generateSummary(datasets: Dataset[], errors: any[]): string {
    const summary = [];
    summary.push(`Discovered ${datasets.length} datasets`);
    
    if (errors.length > 0) {
      summary.push(`${errors.length} errors encountered`);
    }

    const byFormat = this.groupByFormat(datasets);
    if (Object.keys(byFormat).length > 0) {
      summary.push('Formats: ' + Object.entries(byFormat)
        .map(([format, count]) => `${format} (${count})`)
        .join(', '));
    }

    return summary.join('. ');
  }

  /**
   * Group datasets by format
   */
  private groupByFormat(datasets: Dataset[]): Record<string, number> {
    return datasets.reduce((acc, dataset) => {
      acc[dataset.format] = (acc[dataset.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get discovery history
   */
  getDiscoveryHistory(): DiscoveryReport[] {
    return this.discoveryHistory;
  }

  /**
   * Get latest discovery report for catalog
   */
  getLatestReport(catalogId: string): DiscoveryReport | undefined {
    return this.discoveryHistory
      .filter(r => r.catalogId === catalogId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  /**
   * Clear discovery history
   */
  clearHistory(): void {
    this.discoveryHistory = [];
  }
}

// Singleton instance
export const discoveryEngine = new DiscoveryEngine();
