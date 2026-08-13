/**
 * Registry Discovery Platform (RDP)
 * Production Artifacts Generator
 * 
 * Generates all production artifacts after each cycle
 */

import { Dataset, RegistryPassport, QualityMetrics, HealthReport, ProductionStatus, DiscoveryReport, ProductionArtifacts } from './types';
import { storageManager } from './StorageManager';

export class ProductionArtifactsGenerator {
  /**
   * Generate all production artifacts
   */
  async generateArtifacts(
    datasets: Dataset[],
    discoveryReports: DiscoveryReport[],
    passports: RegistryPassport[],
    qualityMetrics: Map<string, QualityMetrics>
  ): Promise<ProductionArtifacts> {
    console.log('[Artifacts] Generating production artifacts');

    const artifacts: ProductionArtifacts = {
      catalog: await this.generateCatalog(datasets),
      registryPassports: passports,
      downloadQueue: await this.generateDownloadQueue(datasets),
      connectorRegistry: await this.generateConnectorRegistry(passports),
      schemaHistory: await this.generateSchemaHistory(datasets),
      healthReport: await this.generateHealthReport(passports, qualityMetrics),
      qualityReport: await this.generateQualityReport(qualityMetrics),
      discoveryReport: await this.generateDiscoveryReport(discoveryReports),
      productionStatus: await this.generateProductionStatus(datasets, passports),
    };

    // Store artifacts
    await this.storeArtifacts(artifacts);

    console.log('[Artifacts] Production artifacts generated and stored');
    return artifacts;
  }

  /**
   * Generate catalog.json
   */
  private async generateCatalog(datasets: Dataset[]): Promise<any> {
    const catalog = {
      version: '2.0',
      generatedAt: new Date().toISOString(),
      totalDatasets: datasets.length,
      datasets: datasets.map(dataset => ({
        id: dataset.id,
        catalogId: dataset.catalogId,
        packageId: dataset.packageId,
        name: dataset.name,
        title: dataset.title,
        description: dataset.description,
        format: dataset.format,
        url: dataset.url,
        size: dataset.size,
        created: dataset.created,
        modified: dataset.modified,
        license: dataset.license,
        tags: dataset.tags,
        organization: dataset.organization,
        datastoreActive: dataset.datastoreActive,
        downloadUrl: dataset.downloadUrl,
      })),
      byFormat: this.groupByFormat(datasets),
      byOrganization: this.groupByOrganization(datasets),
      byCatalog: this.groupByCatalog(datasets),
    };

    return catalog;
  }

  /**
   * Generate download queue
   */
  private async generateDownloadQueue(datasets: Dataset[]): Promise<any[]> {
    const queue = datasets
      .filter(d => !d.datastoreActive) // Only non-DataStore datasets need download
      .map(dataset => ({
        datasetId: dataset.id,
        url: dataset.downloadUrl,
        format: dataset.format,
        priority: this.calculateDownloadPriority(dataset),
        status: 'PENDING',
        addedAt: new Date().toISOString(),
        estimatedSize: dataset.size,
      }))
      .sort((a, b) => b.priority - a.priority);

    return queue;
  }

  /**
   * Calculate download priority
   */
  private calculateDownloadPriority(dataset: Dataset): number {
    let priority = 50;

    // Prefer smaller files
    if (dataset.size && dataset.size < 10_000_000) priority += 20;
    else if (dataset.size && dataset.size < 100_000_000) priority += 10;

    // Prefer CSV and JSON
    if (dataset.format === 'CSV' || dataset.format === 'JSON') priority += 15;

    // Prefer recently updated
    const daysSinceUpdate = (Date.now() - dataset.modified.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) priority += 10;

    return priority;
  }

  /**
   * Generate connector registry
   */
  private async generateConnectorRegistry(passports: RegistryPassport[]): Promise<any[]> {
    const registry = passports.map(passport => ({
      registryId: passport.registryId,
      name: passport.name,
      connectorId: `connector-${passport.registryId}`,
      type: passport.type,
      baseUrl: passport.url,
      api: passport.api,
      status: passport.status,
      version: passport.connectorVersion,
      lastUpdated: passport.lastCheck,
      integratedAt: passport.integratedAt,
    }));

    return registry;
  }

  /**
   * Generate schema history
   */
  private async generateSchemaHistory(datasets: Dataset[]): Promise<any> {
    const history = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      totalRegistries: datasets.length,
      registries: datasets.map(dataset => ({
        registryId: dataset.id,
        name: dataset.title,
        currentSchemaVersion: '1.0',
        lastSchemaUpdate: dataset.modified,
        schemaHistory: [],
      })),
    };

    return history;
  }

  /**
   * Generate health report
   */
  private async generateHealthReport(
    passports: RegistryPassport[],
    qualityMetrics: Map<string, QualityMetrics>
  ): Promise<HealthReport> {
    const totalRegistries = passports.length;
    const healthyRegistries = passports.filter(p => p.status === 'ACTIVE').length;
    const degradedRegistries = passports.filter(p => p.status === 'DEGRADED').length;
    const unhealthyRegistries = passports.filter(p => p.status === 'INACTIVE' || p.status === 'ERROR').length;

    const overallHealth = totalRegistries > 0 
      ? Math.round((healthyRegistries / totalRegistries) * 100)
      : 0;

    const registries = passports.map(passport => {
      const metrics = qualityMetrics.get(passport.registryId);
      return {
        registryId: passport.registryId,
        health: passport.healthScore,
        status: passport.status,
        lastCheck: passport.lastCheck,
        qualityScore: metrics?.overallScore || 0,
      };
    });

    const report: HealthReport = {
      timestamp: new Date(),
      totalRegistries,
      healthyRegistries,
      degradedRegistries,
      unhealthyRegistries,
      overallHealth,
      registries,
    };

    return report;
  }

  /**
   * Generate quality report
   */
  private async generateQualityReport(qualityMetrics: Map<string, QualityMetrics>): Promise<any> {
    const metricsArray = Array.from(qualityMetrics.values());

    const report = {
      version: '2.0',
      generatedAt: new Date().toISOString(),
      totalRegistries: metricsArray.length,
      summary: {
        averageAvailability: this.average(metricsArray, m => m.availability),
        averageCompleteness: this.average(metricsArray, m => m.completeness),
        averageFreshness: this.average(metricsArray, m => m.freshness),
        averageIntegrity: this.average(metricsArray, m => m.integrity),
        averageConsistency: this.average(metricsArray, m => m.consistency),
        averageAPIStability: this.average(metricsArray, m => m.apiStability),
        averageResponseTime: this.average(metricsArray, m => m.avgResponseTime),
        averageErrorRate: this.average(metricsArray, m => m.errorRate),
        averageMetadataQuality: this.average(metricsArray, m => m.metadataQuality),
        averageFieldCoverage: this.average(metricsArray, m => m.fieldCoverage),
        averageOverallScore: this.average(metricsArray, m => m.overallScore),
      },
      byRegistry: Array.from(qualityMetrics.entries()).map(([registryId, metrics]) => ({
        registryId,
        metrics,
      })),
      distribution: {
        byAvailability: this.distribute(metricsArray, m => m.availability, 10),
        byOverallScore: this.distribute(metricsArray, m => m.overallScore, 10),
      },
    };

    return report;
  }

  /**
   * Generate discovery report (Markdown)
   */
  private async generateDiscoveryReport(reports: DiscoveryReport[]): Promise<string> {
    const lines: string[] = [];

    lines.push('# Registry Discovery Report');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    lines.push('## Summary');
    lines.push('');
    const totalDatasets = reports.reduce((sum, r) => sum + r.totalDatasets, 0);
    const newDatasets = reports.reduce((sum, r) => sum + r.newDatasets, 0);
    const updatedDatasets = reports.reduce((sum, r) => sum + r.updatedDatasets, 0);
    const failedDatasets = reports.reduce((sum, r) => sum + r.failedDatasets, 0);

    lines.push(`- Total Catalogs: ${reports.length}`);
    lines.push(`- Total Datasets: ${totalDatasets}`);
    lines.push(`- New Datasets: ${newDatasets}`);
    lines.push(`- Updated Datasets: ${updatedDatasets}`);
    lines.push(`- Failed Datasets: ${failedDatasets}`);
    lines.push('');

    lines.push('## Catalog Details');
    lines.push('');

    for (const report of reports) {
      lines.push(`### ${report.catalogId}`);
      lines.push('');
      lines.push(`- Total: ${report.totalDatasets}`);
      lines.push(`- New: ${report.newDatasets}`);
      lines.push(`- Updated: ${report.updatedDatasets}`);
      lines.push(`- Failed: ${report.failedDatasets}`);
      lines.push(`- Processing Time: ${report.processingTime}ms`);
      lines.push(`- Summary: ${report.summary}`);
      lines.push('');

      if (report.errors.length > 0) {
        lines.push('#### Errors');
        lines.push('');
        for (const error of report.errors) {
          lines.push(`- ${error.datasetId}: ${error.error}`);
        }
        lines.push('');
      }
    }

    lines.push('## Format Distribution');
    lines.push('');

    const formatCounts: Record<string, number> = {};
    for (const report of reports) {
      for (const dataset of report.datasets) {
        formatCounts[dataset.format] = (formatCounts[dataset.format] || 0) + 1;
      }
    }

    for (const [format, count] of Object.entries(formatCounts)) {
      lines.push(`- ${format}: ${count}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate production status
   */
  private async generateProductionStatus(datasets: Dataset[], passports: RegistryPassport[]): Promise<ProductionStatus> {
    const integratedRegistries = passports.filter(p => p.integratedAt).length;
    const pendingRegistries = passports.filter(p => !p.integratedAt).length;
    const failedRegistries = passports.filter(p => p.status === 'ERROR').length;

    const status: ProductionStatus = {
      timestamp: new Date(),
      phase: 'MONITORING',
      currentOperation: 'Continuous monitoring active',
      progress: Math.round((integratedRegistries / datasets.length) * 100),
      totalRegistries: datasets.length,
      integratedRegistries,
      pendingRegistries,
      failedRegistries,
      lastUpdate: new Date(),
      nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
    };

    return status;
  }

  /**
   * Store all artifacts
   */
  private async storeArtifacts(artifacts: ProductionArtifacts): Promise<void> {
    await storageManager.storeCatalog('catalog', artifacts.catalog);
    await storageManager.storeAllPassports(artifacts.registryPassports);
    await storageManager.storeProcessedData('download_queue', artifacts.downloadQueue);
    await storageManager.storeProcessedData('connector_registry', artifacts.connectorRegistry);
    await storageManager.storeProcessedData('schema_history', artifacts.schemaHistory);
    await storageManager.storeHealthReport(artifacts.healthReport);
    await storageManager.storeProcessedData('quality_report', artifacts.qualityReport);
    await storageManager.storeEvidence('discovery_report', { content: artifacts.discoveryReport });
    await storageManager.storeProductionStatus(artifacts.productionStatus);
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
   * Group datasets by organization
   */
  private groupByOrganization(datasets: Dataset[]): Record<string, number> {
    return datasets.reduce((acc, dataset) => {
      const org = typeof dataset.organization === 'string' 
        ? dataset.organization 
        : (dataset.organization?.name || 'Unknown');
      acc[org] = (acc[org] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Group datasets by catalog
   */
  private groupByCatalog(datasets: Dataset[]): Record<string, number> {
    return datasets.reduce((acc, dataset) => {
      acc[dataset.catalogId] = (acc[dataset.catalogId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Calculate average
   */
  private average<T>(array: T[], selector: (item: T) => number): number {
    if (array.length === 0) return 0;
    const sum = array.reduce((acc, item) => acc + selector(item), 0);
    return Math.round(sum / array.length);
  }

  /**
   * Distribute values into buckets
   */
  private distribute<T>(array: T[], selector: (item: T) => number, bucketCount: number): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (let i = 0; i < bucketCount; i++) {
      const min = i * (100 / bucketCount);
      const max = (i + 1) * (100 / bucketCount);
      const key = `${Math.round(min)}-${Math.round(max)}`;
      distribution[key] = 0;
    }

    for (const item of array) {
      const value = selector(item);
      const bucketIndex = Math.min(Math.floor(value / (100 / bucketCount)), bucketCount - 1);
      const min = bucketIndex * (100 / bucketCount);
      const max = (bucketIndex + 1) * (100 / bucketCount);
      const key = `${Math.round(min)}-${Math.round(max)}`;
      distribution[key] = (distribution[key] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Export artifacts as JSON
   */
  exportArtifactsJSON(artifacts: ProductionArtifacts): string {
    return JSON.stringify(artifacts, null, 2);
  }

  /**
   * Load artifacts from storage
   */
  async loadArtifacts(): Promise<ProductionArtifacts | null> {
    try {
      const catalog = await storageManager.loadCatalog('catalog');
      const passports = await storageManager.loadAllPassports();
      const downloadQueue = await storageManager.loadProcessedData('download_queue');
      const connectorRegistry = await storageManager.loadProcessedData('connector_registry');
      const schemaHistory = await storageManager.loadProcessedData('schema_history');
      const healthReport = await storageManager.loadHealthReport();
      const qualityReport = await storageManager.loadProcessedData('quality_report');
      const discoveryReportData = await storageManager.loadEvidence('discovery_report');
      const productionStatus = await storageManager.loadProductionStatus();

      return {
        catalog,
        registryPassports: passports,
        downloadQueue: downloadQueue || [],
        connectorRegistry: connectorRegistry || [],
        schemaHistory,
        healthReport,
        qualityReport,
        discoveryReport: discoveryReportData?.content || '',
        productionStatus,
      };
    } catch (error) {
      console.error('[Artifacts] Failed to load artifacts:', error);
      return null;
    }
  }
}

// Singleton instance
export const productionArtifactsGenerator = new ProductionArtifactsGenerator();
