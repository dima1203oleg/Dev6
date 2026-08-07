/**
 * Registry Discovery Platform (RDP)
 * Main exports
 */

// Core types
export * from './types';

// Discovery Engine
export { DiscoveryEngine, discoveryEngine } from './DiscoveryEngine';

// Adapters
export { CKANAdapter } from './adapters/CKANAdapter';

// Scanners
export { DatasetScanner, datasetScanner, ScanResult } from './DatasetScanner';

// Downloaders
export { ResourceDownloader, resourceDownloader, DownloadResult } from './ResourceDownloader';

// Connector Generator
export { ConnectorGenerator, connectorGenerator, GeneratedConnector } from './ConnectorGenerator';

// Schema Analyzer
export { SchemaAnalyzer, schemaAnalyzer, SchemaComparison, SchemaDrift } from './SchemaAnalyzer';

// Registry Intelligence
export { RegistryIntelligence, registryIntelligence } from './RegistryIntelligence';

// Quality Engine
export { QualityEngine, qualityEngine, QualityCheck } from './QualityEngine';

// Scheduler
export { AutonomousScheduler, autonomousScheduler, ScheduleConfig, ScheduledTask } from './Scheduler';

// Storage Manager
export { StorageManager, storageManager } from './StorageManager';

// Production Artifacts
export { ProductionArtifactsGenerator, productionArtifactsGenerator, ProductionArtifacts } from './ProductionArtifacts';

// Orchestrator
export { RDPOrchestrator, createOrchestrator, defaultConfig, OrchestratorConfig, PipelineResult } from './Orchestrator';
