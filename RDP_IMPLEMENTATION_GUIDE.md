# Registry Discovery Platform (RDP) - Implementation Guide

## Overview

The Registry Discovery Platform (RDP) is an autonomous system that automatically discovers, analyzes, classifies, connects, and maintains all open government registries without manual intervention.

## Core Principle

**Don't build connectors. Build a system that builds connectors.**

## Architecture

```
Registry Discovery Platform
         Scheduler
             │
┌────────────┼────────────┐
│            │            │
Discovery   Registry    API Analyzer
Engine      Scanner
│            │            │
└────────────┴────────────┘
             │
    Connector Generator
             │
    Schema Analyzer
             │
   Mapping Generator
             │
   Validation Engine
             │
  Data Quality Engine
             │
  Entity Resolution
             │
  Graph Integration
             │
 Production Registry
```

## Modules

### 1. Registry Discovery Engine
**File:** `DiscoveryEngine.ts`

Universal catalog discovery supporting multiple catalog types:
- CKAN
- Socrata
- ArcGIS Hub
- OpenDataSoft
- GitHub
- FTP
- S3
- REST API
- SOAP
- XML Feed
- RSS
- HTML Catalog

**Key Methods:**
- `registerCatalog(config)` - Register a new catalog
- `runDiscovery()` - Discover all enabled catalogs
- `getCatalogs()` - Get all registered catalogs

### 2. CKAN Discovery Adapter
**File:** `adapters/CKANAdapter.ts`

Full CKAN API support for data.gov.ua and other CKAN portals.

**Supported Methods:**
- `package_list` - Get all package IDs
- `package_search` - Search by keywords, tags, organizations, formats, licenses
- `package_show` - Get full package information
- `resource_show` - Analyze each resource
- `datastore_search` - Search DataStore with pagination, filters, sorting
- `datastore_search_sql` - Execute SQL queries
- `datastore_create` - Create DataStore (for other CKAN portals)
- `datastore_upsert` - Upsert DataStore records (architectural support)

**Key Methods:**
- `getPackageList()` - Get all packages
- `searchPackages(params)` - Search packages
- `getPackage(packageId)` - Get package details
- `getResource(resourceId)` - Get resource details
- `searchDataStore(params)` - Search DataStore
- `searchDataStoreSQL(sql)` - Execute SQL query
- `discoverAll()` - Discover all datasets

### 3. Intelligent Dataset Scanner
**File:** `DatasetScanner.ts`

Automatically analyzes dataset structure and determines optimal access method.

**Detection Capabilities:**
- DataStore availability
- CSV, JSON, XML, ZIP, XLSX formats
- API, dump, streaming types
- Schema inference
- Record count estimation
- Quality scoring

**Key Methods:**
- `scanDataset(dataset)` - Scan single dataset
- `scanBatch(datasets)` - Batch scan
- `getScanStatistics(results)` - Get scan statistics

### 4. Automatic Resource Downloader
**File:** `ResourceDownloader.ts`

Automatically selects optimal download method and handles multiple formats.

**Supported Formats:**
- CSV, JSON, XML
- ZIP, GZIP, RAR, 7Z
- XLS, XLSX, ODS
- Parquet

**Key Methods:**
- `download(dataset, scanResult)` - Download dataset
- `downloadBatch(datasets, scanResults)` - Batch download
- `getCached(datasetId)` - Get cached download

### 5. Automatic Connector Generator
**File:** `ConnectorGenerator.ts`

Automatically builds connectors, transformers, normalizers, and mappings without manual programming.

**Generated Artifacts:**
- Connector configuration
- Transformer code
- Normalizer code
- Field mappings
- Validation rules

**Key Methods:**
- `generateConnector(dataset, scanResult)` - Generate connector
- `generateBatch(datasets, scanResults)` - Batch generate
- `exportConnector(connectorId)` - Export to file
- `importConnector(data)` - Import from file

### 6. Smart Schema Analyzer
**File:** `SchemaAnalyzer.ts`

Detects schema drift and automatically corrects it.

**Detection Capabilities:**
- Renamed fields (fuzzy matching)
- Type changes
- New fields
- Removed fields
- Structure changes
- Severity assessment

**Auto-Correction:**
- Low/Medium severity: Auto-fix
- High/Critical severity: Create Pull Request

**Key Methods:**
- `analyzeSchema(dataset, currentSchema)` - Analyze schema
- `autoFixSchemaDrift(dataset, comparison)` - Auto-fix drift
- `runRegressionTest(dataset, oldSchema, newSchema)` - Run regression

### 7. Registry Intelligence
**File:** `RegistryIntelligence.ts`

Creates and maintains registry passports with comprehensive metadata.

**Passport Fields:**
- Registry ID, name, owner
- URL, API, type, format
- License, update frequency
- Record count, DataStore status
- Health, quality, coverage scores
- Confidence, schema version
- Connector version, status

**Key Methods:**
- `createPassport(dataset, scanResult, downloadResult)` - Create passport
- `updatePassport(datasetId, updates)` - Update passport
- `getPassport(datasetId)` - Get passport
- `getPassportStatistics()` - Get statistics

### 8. Registry Quality Engine
**File:** `QualityEngine.ts`

Calculates and tracks quality metrics for all registries.

**Quality Metrics:**
- Availability
- Completeness
- Freshness
- Integrity
- Consistency
- API Stability
- Average Response Time
- Error Rate
- Metadata Quality
- Field Coverage

**Key Methods:**
- `runQualityCheck(dataset, scanResult, downloadResult)` - Run quality check
- `runBatchQualityCheck(datasets, scanResults, downloadResults)` - Batch check
- `getQualityTrend(datasetId)` - Get quality trend
- `getQualityStatistics()` - Get statistics

### 9. Autonomous Scheduler
**File:** `Scheduler.ts`

Manages automated cycles for all platform operations.

**Scheduled Tasks:**
- Discovery - Every 24 hours
- Health Check - Every hour
- Schema Drift Detection - Every 6 hours
- Metadata Refresh - Every day
- Full Validation - Every week

**Key Methods:**
- `start()` - Start scheduler
- `stop()` - Stop scheduler
- `runTaskManually(taskId)` - Run task manually
- `getStatus()` - Get scheduler status

### 10. Data Storage Architecture
**File:** `StorageManager.ts`

Manages structured storage for all platform data.

**Directory Structure:**
```
/catalog
/raw
/processed
/normalized
/evidence
/logs
/registry-passports
/schema-history
/connectors
/mappings
```

**Key Methods:**
- `storeCatalog(catalogId, data)` - Store catalog
- `storeRawData(datasetId, data)` - Store raw data
- `storeProcessedData(datasetId, data)` - Store processed data
- `storeRegistryPassport(passport)` - Store passport
- `storeSchema(datasetId, schema)` - Store schema
- `getStorageStatistics()` - Get statistics

### 11. Production Artifacts Generator
**File:** `ProductionArtifacts.ts`

Generates all production artifacts after each cycle.

**Generated Artifacts:**
- catalog.json
- registry_passports.json
- download_queue.json
- connector_registry.json
- schema_history.json
- health_report.json
- quality_report.json
- discovery_report.md
- production_status.json

**Key Methods:**
- `generateArtifacts(datasets, reports, passports, metrics)` - Generate artifacts
- `exportArtifactsJSON(artifacts)` - Export as JSON
- `loadArtifacts()` - Load from storage

### 12. Main Orchestrator
**File:** `Orchestrator.ts`

Coordinates all modules to execute the complete discovery pipeline.

**Pipeline Phases:**
1. Discovery
2. Scanning
3. Downloading
4. Connector Generation
5. Schema Analysis
6. Registry Intelligence
7. Quality Assessment
8. Production Artifacts

**Key Methods:**
- `initialize()` - Initialize platform
- `runPipeline()` - Run complete pipeline
- `runQuickDiscovery()` - Run quick discovery
- `runHealthCheck()` - Run health check
- `getStatus()` - Get platform status
- `shutdown()` - Shutdown platform

## Usage Examples

### Basic Usage

```typescript
import { createOrchestrator } from './server/registry-discovery/Orchestrator';

// Create orchestrator with default config
const orchestrator = createOrchestrator();

// Initialize
await orchestrator.initialize();

// Run complete pipeline
const result = await orchestrator.runPipeline();

console.log(`Discovered ${result.datasets.length} datasets`);
console.log(`Generated ${result.connectors.length} connectors`);
console.log(`Created ${result.passports.length} passports`);

// Shutdown
await orchestrator.shutdown();
```

### Custom Configuration

```typescript
import { createOrchestrator, CatalogConfig } from './server/registry-discovery/Orchestrator';

const customConfig = {
  catalogs: [
    {
      id: 'data-gov-ua',
      name: 'data.gov.ua',
      type: 'CKAN',
      baseUrl: 'https://data.gov.ua',
      enabled: true,
    },
    {
      id: 'custom-catalog',
      name: 'Custom Catalog',
      type: 'REST_API',
      baseUrl: 'https://api.example.com',
      enabled: true,
    },
  ],
  autoStartScheduler: true,
  storagePath: './data/registry-discovery',
};

const orchestrator = createOrchestrator(customConfig);
```

### Manual Module Usage

```typescript
import { discoveryEngine } from './server/registry-discovery';
import { CKANAdapter } from './server/registry-discovery/adapters/CKANAdapter';

// Register catalog
const catalog: CatalogConfig = {
  id: 'data-gov-ua',
  name: 'data.gov.ua',
  type: 'CKAN',
  baseUrl: 'https://data.gov.ua',
  enabled: true,
};
discoveryEngine.registerCatalog(catalog);

// Create CKAN adapter
const adapter = new CKANAdapter(catalog);

// Get all packages
const packages = await adapter.getPackageList();

// Search packages
const results = await adapter.searchPackages({
  q: 'sanctions',
  rows: 100,
});

// Get package details
const pkg = await adapter.getPackage('package-id');

// Search DataStore
const data = await adapter.searchDataStore({
  resource_id: 'resource-id',
  limit: 1000,
});

// Execute SQL query
const sqlData = await adapter.searchDataStoreSQL(
  'SELECT * FROM "resource-id" LIMIT 1000'
);
```

### Quick Discovery

```typescript
import { createOrchestrator } from './server/registry-discovery/Orchestrator';

const orchestrator = createOrchestrator();
await orchestrator.initialize();

// Run quick discovery (discovery + scan only)
const result = await orchestrator.runQuickDiscovery();

console.log(`Discovered ${result.datasets.length} datasets`);
console.log(`Scanned ${result.scanResults.length} datasets`);

// Analyze results
for (const scanResult of result.scanResults) {
  console.log(`${scanResult.dataset.name}: ${scanResult.recommendedMethod}`);
  console.log(`Quality score: ${scanResult.qualityScore}`);
}
```

### Health Check

```typescript
import { createOrchestrator } from './server/registry-discovery/Orchestrator';

const orchestrator = createOrchestrator();
await orchestrator.initialize();

// Run health check
const health = await orchestrator.runHealthCheck();

console.log(`Total: ${health.total}`);
console.log(`Healthy: ${health.healthy}`);
console.log(`Unhealthy: ${health.unhealthy}`);
```

### Platform Status

```typescript
import { createOrchestrator } from './server/registry-discovery/Orchestrator';

const orchestrator = createOrchestrator();
await orchestrator.initialize();

// Get platform status
const status = orchestrator.getStatus();

console.log(`Initialized: ${status.initialized}`);
console.log(`Catalogs: ${status.catalogs.length}`);
console.log(`Datasets: ${status.datasets}`);
console.log(`Passports: ${status.passports}`);
console.log(`Connectors: ${status.connectors}`);
console.log(`Scheduler Running: ${status.schedulerRunning}`);
```

## Production Acceptance Criteria

The system is production-ready when:

- ✅ Automatically discovers new government datasets without human intervention
- ✅ Fully supports official CKAN Data API (package_list, package_search, package_show, resource_show, datastore_search, datastore_search_sql)
- ✅ Automatically detects datastore_active and selects optimal data retrieval method
- ✅ Supports pagination (limit/offset), filtering, and SQL queries to DataStore
- ✅ Automatically generates connectors and mappings
- ✅ Detects schema drift and self-corrects
- ✅ Performs automatic regression after each change
- ✅ Stores raw data, normalized data, metadata, and change history
- ✅ Integrates new sources into PREDATOR Analytics without manual programming
- ✅ Maintains continuous Discover → Analyze → Generate → Validate → Integrate → Monitor cycle

## File Structure

```
server/registry-discovery/
├── README.md
├── types.ts
├── index.ts
├── DiscoveryEngine.ts
├── DatasetScanner.ts
├── ResourceDownloader.ts
├── ConnectorGenerator.ts
├── SchemaAnalyzer.ts
├── RegistryIntelligence.ts
├── QualityEngine.ts
├── Scheduler.ts
├── StorageManager.ts
├── ProductionArtifacts.ts
├── Orchestrator.ts
└── adapters/
    └── CKANAdapter.ts
```

## Next Steps

1. **Integration with PREDATOR Analytics**
   - Connect RDP to main application
   - Add RDP dashboard UI
   - Integrate discovered registries

2. **Additional Catalog Adapters**
   - Implement Socrata adapter
   - Implement ArcGIS Hub adapter
   - Implement OpenDataSoft adapter

3. **Advanced Features**
   - Machine learning for schema inference
   - Anomaly detection
   - Predictive quality scoring
   - Automated issue resolution

4. **Monitoring & Alerting**
   - Real-time monitoring dashboard
   - Alert configuration
   - Performance metrics
   - Error tracking

## Support

For issues or questions, refer to the main README.md or contact the development team.
