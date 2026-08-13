/**
 * Registry Discovery Platform (RDP)
 * Main Orchestrator
 * 
 * Coordinates all modules to execute the complete discovery pipeline
 */

import {
  CatalogConfig,
  Dataset,
  RegistryPassport,
  ProductionArtifacts,
  DownloadResult,
  ScanResult,
} from './types';
import {
  discoveryEngine,
} from './DiscoveryEngine';
import {
  CKANAdapter,
} from './adapters/CKANAdapter';
import {
  datasetScanner,
} from './DatasetScanner';
import {
  resourceDownloader,
} from './ResourceDownloader';
import {
  connectorGenerator,
  GeneratedConnector,
} from './ConnectorGenerator';
import {
  schemaAnalyzer,
} from './SchemaAnalyzer';
import {
  registryIntelligence,
} from './RegistryIntelligence';
import {
  qualityEngine,
} from './QualityEngine';
import {
  autonomousScheduler,
} from './Scheduler';
import {
  storageManager,
} from './StorageManager';
import {
  productionArtifactsGenerator,
} from './ProductionArtifacts';

export interface OrchestratorConfig {
  catalogs: CatalogConfig[];
  autoStartScheduler: boolean;
  storagePath: string;
}

export interface PipelineResult {
  success: boolean;
  datasets: Dataset[];
  scanResults: ScanResult[];
  downloadResults: DownloadResult[];
  connectors: GeneratedConnector[];
  passports: RegistryPassport[];
  artifacts: ProductionArtifacts;
  errors: string[];
  processingTime: number;
}

export class RDPOrchestrator {
  private config: OrchestratorConfig;
  private initialized: boolean = false;

  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  /**
   * Initialize the platform
   */
  async initialize(): Promise<void> {
    console.log('[RDP] Initializing Registry Discovery Platform');

    // Register catalogs
    for (const catalog of this.config.catalogs) {
      discoveryEngine.registerCatalog(catalog);
      
      // Register CKAN adapters for CKAN catalogs
      if (catalog.type === 'CKAN') {
        const adapter = new CKANAdapter(catalog);
        datasetScanner.registerCKANAdapter(catalog.id, adapter);
        resourceDownloader.registerCKANAdapter(catalog.id, adapter);
      }
    }

    // Initialize storage
    if (this.config.storagePath) {
      // Custom storage path configured
      new (require('./StorageManager')).StorageManager(this.config.storagePath);
    }

    // Start scheduler if configured
    if (this.config.autoStartScheduler) {
      autonomousScheduler.start();
    }

    this.initialized = true;
    console.log('[RDP] Platform initialized successfully');
  }

  /**
   * Run complete discovery pipeline
   */
  async runPipeline(): Promise<PipelineResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const errors: string[] = [];

    console.log('[RDP] Starting discovery pipeline');
    await storageManager.storeLog('INFO', 'Discovery pipeline started');

    try {
      // Phase 1: Discovery
      console.log('[RDP] Phase 1: Discovery');
      const discoveryReport = await discoveryEngine.runDiscovery();
      const datasets = discoveryReport.datasets;
      console.log(`[RDP] Discovered ${datasets.length} datasets`);

      // Phase 2: Scanning
      console.log('[RDP] Phase 2: Scanning');
      const scanResults = await datasetScanner.scanBatch(datasets);
      console.log(`[RDP] Scanned ${scanResults.length} datasets`);

      // Phase 3: Downloading
      console.log('[RDP] Phase 3: Downloading');
      const downloadResults = await resourceDownloader.downloadBatch(datasets, scanResults);
      console.log(`[RDP] Downloaded ${downloadResults.filter(r => r.success).length} datasets`);

      // Phase 4: Connector Generation
      console.log('[RDP] Phase 4: Connector Generation');
      const connectors = await connectorGenerator.generateBatch(datasets, scanResults);
      console.log(`[RDP] Generated ${connectors.length} connectors`);

      // Phase 5: Schema Analysis
      console.log('[RDP] Phase 5: Schema Analysis');
      for (const scanResult of scanResults) {
        if (scanResult.schema) {
          try {
            await schemaAnalyzer.analyzeSchema(scanResult.dataset, scanResult.schema);
          } catch (error) {
            errors.push(`Schema analysis failed for ${scanResult.dataset.id}: ${error}`);
          }
        }
      }
      console.log('[RDP] Schema analysis complete');

      // Phase 6: Registry Intelligence
      console.log('[RDP] Phase 6: Registry Intelligence');
      const passports: RegistryPassport[] = [];
      const scanMap = new Map(scanResults.map(s => [s.dataset.id, s]));
      const downloadMap = new Map(downloadResults.map(d => [d.dataset.id, d]));

      for (const dataset of datasets) {
        try {
          const passport = await registryIntelligence.createPassport(
            dataset,
            scanMap.get(dataset.id),
            downloadMap.get(dataset.id)
          );
          passports.push(passport);
        } catch (error) {
          errors.push(`Passport creation failed for ${dataset.id}: ${error}`);
        }
      }
      console.log(`[RDP] Created ${passports.length} passports`);

      // Phase 7: Quality Assessment
      console.log('[RDP] Phase 7: Quality Assessment');
      const qualityChecks = await qualityEngine.runBatchQualityCheck(
        datasets,
        scanResults,
        downloadResults
      );
      console.log(`[RDP] Quality checks: ${qualityChecks.filter(c => c.passed).length}/${qualityChecks.length} passed`);

      // Phase 8: Production Artifacts
      console.log('[RDP] Phase 8: Production Artifacts');
      const qualityMetrics = new Map();
      for (const check of qualityChecks) {
        qualityMetrics.set(check.registryId, check.metrics);
      }

      const artifacts = await productionArtifactsGenerator.generateArtifacts(
        datasets,
        [discoveryReport],
        passports,
        qualityMetrics
      );
      console.log('[RDP] Production artifacts generated');

      const processingTime = Date.now() - startTime;

      const result: PipelineResult = {
        success: errors.length === 0,
        datasets,
        scanResults,
        downloadResults,
        connectors,
        passports,
        artifacts,
        errors,
        processingTime,
      };

      await storageManager.storeLog('INFO', `Pipeline completed in ${processingTime}ms with ${errors.length} errors`);

      console.log(`[RDP] Pipeline complete: ${result.success ? 'SUCCESS' : 'PARTIAL'} (${processingTime}ms)`);
      return result;

    } catch (error) {
      const errorMessage = `Pipeline failed: ${error}`;
      console.error('[RDP]', errorMessage);
      await storageManager.storeLog('ERROR', errorMessage);

      return {
        success: false,
        datasets: [],
        scanResults: [],
        downloadResults: [],
        connectors: [],
        passports: [],
        artifacts: {} as any,
        errors: [errorMessage, ...errors],
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Run quick discovery (discovery + scan only)
   */
  async runQuickDiscovery(): Promise<{
    datasets: Dataset[];
    scanResults: ScanResult[];
    processingTime: number;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    console.log('[RDP] Running quick discovery');
    await storageManager.storeLog('INFO', 'Quick discovery started');

    const discoveryReport = await discoveryEngine.runDiscovery();
    const datasets = discoveryReport.datasets;
    const scanResults = await datasetScanner.scanBatch(datasets);

    await storageManager.storeLog('INFO', `Quick discovery complete: ${datasets.length} datasets`);

    return {
      datasets,
      scanResults,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Run health check on all registries
   */
  async runHealthCheck(): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    processingTime: number;
  }> {
    const startTime = Date.now();

    console.log('[RDP] Running health check');
    await storageManager.storeLog('INFO', 'Health check started');

    const passports = registryIntelligence.getAllPassports();
    const checks = [];

    for (const passport of passports) {
      try {
        const check = await qualityEngine.runQualityCheck(passport as any);
        checks.push(check);
      } catch (error) {
        console.error(`[RDP] Health check failed for ${passport.registryId}:`, error);
      }
    }

    const healthy = checks.filter(c => c.passed).length;
    const unhealthy = checks.filter(c => !c.passed).length;

    await storageManager.storeLog('INFO', `Health check complete: ${healthy}/${checks.length} healthy`);

    return {
      total: checks.length,
      healthy,
      unhealthy,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Get platform status
   */
  getStatus(): {
    initialized: boolean;
    catalogs: CatalogConfig[];
    datasets: number;
    passports: number;
    connectors: number;
    schedulerRunning: boolean;
    storageStats: any;
  } {
    const catalogs = discoveryEngine.getCatalogs();
    const passports = registryIntelligence.getAllPassports();
    const connectors = connectorGenerator.getAllConnectors();
    const schedulerStatus = autonomousScheduler.getStatus();
    const storageStats = storageManager.getStorageStatistics();

    return {
      initialized: this.initialized,
      catalogs,
      datasets: catalogs.reduce((sum, c) => sum + (c.totalDatasets || 0), 0),
      passports: passports.length,
      connectors: connectors.length,
      schedulerRunning: schedulerStatus.running,
      storageStats,
    };
  }

  /**
   * Shutdown platform
   */
  async shutdown(): Promise<void> {
    console.log('[RDP] Shutting down platform');

    autonomousScheduler.stop();
    await storageManager.storeLog('INFO', 'Platform shutdown');

    console.log('[RDP] Platform shutdown complete');
  }

  /**
   * Export platform state
   */
  async exportState(): Promise<string> {
    const status = this.getStatus();
    const artifacts = await productionArtifactsGenerator.loadArtifacts();

    const _state = {
      timestamp: new Date(),
      status,
      artifacts,
    };

    return JSON.stringify(_state, null, 2);
  }

  /**
   * Import platform state
   */
  async importState(data: string): Promise<void> {
    JSON.parse(data);

    // TODO: Implement state restoration logic
    console.log('[RDP] State import not yet implemented');
  }
}

/**
 * Default configuration for data.gov.ua
 */
export const defaultConfig: OrchestratorConfig = {
  catalogs: [
    {
      id: 'data-gov-ua',
      name: 'data.gov.ua',
      type: 'CKAN',
      baseUrl: 'https://data.gov.ua',
      enabled: true,
    },
  ],
  autoStartScheduler: true,
  storagePath: './data/registry-discovery',
};

/**
 * Create default orchestrator instance
 */
export const createOrchestrator = (config?: Partial<OrchestratorConfig>): RDPOrchestrator => {
  return new RDPOrchestrator({
    ...defaultConfig,
    ...config,
  });
};
