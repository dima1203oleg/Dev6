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
export { DatasetScanner, datasetScanner } from './DatasetScanner';

// Downloaders
export { ResourceDownloader, resourceDownloader } from './ResourceDownloader';

// Connector Generator
export { ConnectorGenerator, connectorGenerator } from './ConnectorGenerator';
export type { GeneratedConnector } from './ConnectorGenerator';

// Schema Analyzer
export { SchemaAnalyzer, schemaAnalyzer } from './SchemaAnalyzer';
export type { SchemaComparison } from './SchemaAnalyzer';

// Registry Intelligence
export { RegistryIntelligence, registryIntelligence } from './RegistryIntelligence';

// Quality Engine
export { QualityEngine, qualityEngine } from './QualityEngine';
export type { QualityCheck } from './QualityEngine';

// Scheduler
export { AutonomousScheduler, autonomousScheduler } from './Scheduler';
export type { ScheduleConfig, ScheduledTask } from './Scheduler';

// Storage Manager
export { StorageManager, storageManager } from './StorageManager';

// Production Artifacts
export { ProductionArtifactsGenerator, productionArtifactsGenerator } from './ProductionArtifacts';
export type { ProductionArtifacts } from './types';

// Orchestrator
export { RDPOrchestrator, createOrchestrator, defaultConfig } from './Orchestrator';
export type { OrchestratorConfig, PipelineResult } from './Orchestrator';
