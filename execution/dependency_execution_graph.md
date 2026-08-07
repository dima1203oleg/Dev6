# Dependency Execution Graph

**Generated**: 2026-08-08  
**Repository**: /Users/dima1203/Downloads/predator8  
**Scope**: Registry Discovery Platform (RDP)  

## Overview

This document describes the actual execution path of the RDP pipeline from source to cards, showing all dependencies and data flow.

---

## Complete Execution Path

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SOURCE                               │
│                    https://data.gov.ua                                │
│                    CKAN API v3                                        │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CKANAdapter                                   │
│  File: /server/registry-discovery/adapters/CKANAdapter.ts            │
│                                                                      │
│  Methods:                                                            │
│  - testConnection()                                                  │
│  - getPackageList()                                                  │
│  - searchPackages(params)                                            │
│  - getPackage(packageId)                                             │
│  - getResource(resourceId)                                           │
│  - probeDataStoreAvailability(datasetId) ← NEW                      │
│  - searchDataStore(params)                                          │
│  - searchDataStoreSQL(sql)                                           │
│                                                                      │
│  Endpoints:                                                          │
│  - /api/3/action/package_list                                       │
│  - /api/3/action/package_search                                      │
│  - /api/3/action/package_show                                        │
│  - /api/3/action/resource_show                                       │
│  - /api/3/action/datastore_search                                   │
│  - /api/3/action/datastore_search_sql                               │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DiscoveryEngine                                 │
│  File: /server/registry-discovery/DiscoveryEngine.ts                │
│                                                                      │
│  Methods:                                                            │
│  - registerCatalog(config)                                          │
│  - getCatalogs()                                                    │
│  - discoverCatalog(catalogId)                                       │
│  - runDiscovery()                                                   │
│  - runFullDiscoveryWithRelevance() ← NEW                            │
│                                                                      │
│  Dependencies:                                                       │
│  - CKANAdapter (for CKAN catalogs)                                 │
│  - RelevanceEngine (for priority queue) ← NEW                       │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       RelevanceEngine                                 │
│  File: /server/registry-discovery/RelevanceEngine.ts ← NEW         │
│                                                                      │
│  Methods:                                                            │
│  - scoreDataset(dataset)                                            │
│  - createPriorityQueue(datasets)                                    │
│  - updateConfig(config)                                             │
│                                                                      │
│  Scoring Factors:                                                    │
│  - Keywords (ЄДР, РНОКПП, ФОП, etc.)                                 │
│  - Organization                                                      │
│  - Format (CSV, JSON)                                               │
│  - Tags                                                              │
│  - Field names                                                       │
│                                                                      │
│  Output:                                                             │
│  - Priority queue (HIGH/MEDIUM/LOW)                                  │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DatasetScanner                                 │
│  File: /server/registry-discovery/DatasetScanner.ts                 │
│                                                                      │
│  Methods:                                                            │
│  - scanDataset(dataset)                                             │
│  - scanBatch(datasets)                                               │
│  - analyzeDataStoreSchema(dataset, adapter)                          │
│  - estimateRecordCount(dataset, adapter)                             │
│  - determineAccessMethod(dataset)                                    │
│  - calculateQualityScore(dataset, scanResult)                        │
│                                                                      │
│  Dependencies:                                                       │
│  - CKANAdapter (for DataStore schema analysis)                       │
│                                                                      │
│  Output: ScanResult                                                  │
│  - recommendedMethod (DATASTORE/DOWNLOAD/API/DUMP)                   │
│  - schema (fields, types)                                            │
│  - estimatedRecordCount                                             │
│  - qualityScore                                                      │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ResourceDownloader                               │
│  File: /server/registry-discovery/ResourceDownloader.ts              │
│                                                                      │
│  Methods:                                                            │
│  - download(dataset, scanResult)                                    │
│  - downloadBatch(datasets, scanResults)                             │
│  - downloadFromDataStore(dataset) ← UPDATED                         │
│  - downloadFromURL(dataset)                                         │
│  - downloadFromAPI(dataset)                                         │
│  - downloadFromDump(dataset)                                        │
│                                                                      │
│  Dependencies:                                                       │
│  - CKANAdapter (for DataStore download)                             │
│                                                                      │
│  DataStore Flow (NEW):                                              │
│  1. probeDataStoreAvailability(datasetId)                           │
│  2. If available → searchDataStore()                               │
│  3. If not available → classify error → fallback to downloadFromURL│
│                                                                      │
│  Output: DownloadResult                                             │
│  - method (DATASTORE/DOWNLOAD/API/DUMP)                              │
│  - success (boolean)                                                │
│  - records (array)                                                  │
│  - rawData (Buffer)                                                 │
│  - format (CSV/JSON)                                                 │
│  - size (bytes)                                                      │
│  - downloadTime (ms)                                                │
│  - error (string)                                                    │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         RAW DATA                                     │
│  Storage: /data/registry-discovery/raw/                             │
│                                                                      │
│  Formats:                                                            │
│  - CSV files                                                        │
│  - JSON files                                                       │
│  - DataStore records (JSON)                                         │
│                                                                      │
│  Metadata:                                                           │
│  - dataset_id                                                       │
│  - resource_id                                                      │
│  - download_timestamp                                               │
│  - source_url                                                       │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│            RDP Integration (integration.ts)                          │
│  File: /src/lib/registryDiscovery/integration.ts                    │
│                                                                      │
│  Methods:                                                            │
│  - initialize()                                                      │
│  - loadDiscoveryArtifacts()                                         │
│  - getRelevantRegistries(ipn)                                       │
│  - fetchAndIntegrate(dataset)                                       │
│  - fetchRawData(dataset) ← UPDATED (CSV parsing)                    │
│  - normalizeData(rawData, dataset)                                  │
│  - resolveEntities(normalizedData, ipn) ← UPDATED (real IPN search) │
│  - generateEvidence(entities, dataset) ← UPDATED (SHA-256)         │
│  - generateCards(entities, evidence) ← UPDATED (real cards)         │
│  - validateCardTruth(cards) ← NEW                                    │
│  - runFullPipeline(config) ← NEW                                    │
│                                                                      │
│  Dependencies:                                                       │
│  - RDP artifacts (catalog.json)                                     │
│  - External source URLs (from catalog)                              │
│                                                                      │
│  NO MOCK DATA - All implementations use real data                    │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NORMALIZED DATA                                │
│  Storage: /data/registry-discovery/normalized/                      │
│                                                                      │
│  Fields:                                                            │
│  - All original fields from raw data                                │
│  - _normalized (true)                                               │
│  - _source (dataset_id)                                              │
│  - _index (record index)                                             │
│  - _timestamp (normalization timestamp)                             │
│                                                                      │
│  IPN Fields Extracted:                                              │
│  - ipn, rnokpp, tax_id, edrpou, inn, kod, code                      │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ENTITIES                                      │
│  Storage: /data/registry-discovery/evidence/                         │
│                                                                      │
│  Entity Types:                                                       │
│  - PERSON                                                           │
│  - COMPANY                                                          │
│  - FOP (Individual Entrepreneur)                                    │
│                                                                      │
│  Entity Structure:                                                   │
│  - id (entity_type-ipn-index)                                        │
│  - type (PERSON/COMPANY/FOP)                                        │
│  - ipn (searched IPN)                                                │
│  - match_score (0.0-1.0)                                             │
│  - match_reasons (array of strings)                                 │
│  - confidence (0.0-1.0)                                             │
│  - source (dataset_id)                                               │
│  - raw_record_id (record index)                                     │
│  - raw_data (original record)                                       │
│  - normalized_data (normalized record)                             │
│  - match_timestamp (ISO timestamp)                                  │
│                                                                      │
│  Match Reasons:                                                      │
│  - EXACT_IPN_MATCH                                                  │
│  - NAME_MATCH                                                       │
│  - ADDRESS_MATCH                                                    │
│                                                                      │
│  NO MOCK ENTITIES - All entities from real IPN matches              │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EVIDENCE                                      │
│  Storage: /data/registry-discovery/evidence/                         │
│                                                                      │
│  Evidence Structure:                                                 │
│  - fact_id (unique identifier)                                      │
│  - entity_id (entity reference)                                     │
│  - source (data.gov.ua)                                              │
│  - dataset_id (CKAN package ID)                                     │
│  - resource_id (CKAN resource ID)                                   │
│  - timestamp (ISO timestamp)                                        │
│  - raw_record_id (record index)                                     │
│  - raw_hash (SHA-256 of raw record)                                 │
│  - parser_version (version string)                                  │
│  - mapping_version (version string)                                 │
│  - normalizer_version (version string)                              │
│  - confidence (0.0-1.0)                                             │
│                                                                      │
│  NO MOCK EVIDENCE - All evidence linked to real source records      │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CARDS                                        │
│  Storage: /execution/card_snapshots/                                 │
│                                                                      │
│  Card Types:                                                         │
│  - Person Card                                                       │
│  - Companies Card                                                   │
│  - FOP Card                                                         │
│                                                                      │
│  Card Structure:                                                     │
│  - card_id (unique identifier)                                      │
│  - entity_id (entity reference)                                     │
│  - card_type (PERSON/COMPANY/FOP)                                   │
│  - fields (object with field values)                                │
│  - source_linkage (object with provenance)                           │
│    - source (data.gov.ua)                                           │
│    - dataset_id (CKAN package ID)                                  │
│    - resource_id (CKAN resource ID)                                 │
│    - raw_record_id (record index)                                   │
│    - raw_hash (SHA-256)                                             │
│  - status (PASS/WARNING/NO_DATA/FAIL)                               │
│  - validation_errors (array)                                        │
│  - created_at (ISO timestamp)                                       │
│                                                                      │
│  NO MOCK CARDS - All cards generated from real entities             │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TRUTH VALIDATION                                  │
│  File: /src/lib/registryDiscovery/integration.ts                    │
│  Method: validateCardTruth() ← NEW                                 │
│                                                                      │
│  Validation Stages:                                                  │
│  - RAW (original source record)                                     │
│  - NORMALIZED (after normalization)                                 │
│  - CANONICAL (after entity resolution)                              │
│  - DATABASE (after persistence) ← NOT IMPLEMENTED                   │
│  - API (after API response) ← NOT IMPLEMENTED                       │
│  - UI (after UI display) ← NOT IMPLEMENTED                          │
│                                                                      │
│  Validation Result:                                                  │
│  - field_name                                                       │
│  - raw_value                                                        │
│  - normalized_value                                                 │
│  - canonical_value                                                  │
│  - database_value ← PENDING                                         │
│  - api_value ← PENDING                                              │
│  - ui_value ← PENDING                                               │
│  - status (PASS/DATA_TRUTH_FAILURE)                                 │
│                                                                      │
│  PARTIAL IMPLEMENTATION - Only RAW/NORMALIZED/CANONICAL validated   │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              ❌ BLOCKING: DATABASE INTEGRATION                       │
│              ❌ BLOCKING: PREDATOR API INTEGRATION                    │
│              ❌ BLOCKING: PREDATOR UI INTEGRATION                     │
│                                                                      │
│  Required for Production:                                            │
│  - PostgreSQL database connection                                   │
│  - PREDATOR API endpoints                                           │
│  - PREDATOR UI components                                           │
│  - Field provenance display in UI                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Module Dependencies

### Core Discovery Path

```
CKANAdapter
  ↓
DiscoveryEngine
  ↓ (uses)
RelevanceEngine
  ↓
DatasetScanner
  ↓ (uses)
CKANAdapter
  ↓
ResourceDownloader
  ↓ (uses)
CKANAdapter
  ↓
RAW DATA
```

### Integration Path

```
RAW DATA
  ↓
RDP Integration (integration.ts)
  ↓
NORMALIZED DATA
  ↓
ENTITIES
  ↓
EVIDENCE
  ↓
CARDS
  ↓
TRUTH VALIDATION
  ↓
❌ DATABASE (BLOCKING)
  ↓
❌ PREDATOR API (BLOCKING)
  ↓
❌ PREDATOR UI (BLOCKING)
```

### Supporting Modules

```
StorageManager
  ← used by all modules for file storage

SchemaAnalyzer
  ← used by Orchestrator for schema drift detection

RegistryIntelligence
  ← used by Orchestrator for passport creation

QualityEngine
  ← used by Orchestrator for quality checks

Scheduler
  ← used by Orchestrator for automated cycles

ProductionArtifacts
  ← used by Orchestrator for artifact generation

Orchestrator
  ← coordinates all modules
```

---

## Data Flow Summary

### Input
- **Source**: https://data.gov.ua (CKAN API)
- **Control IPN**: 3111724753 (negative control)
- **Positive Control**: TBD (needs to be found in real data)

### Processing Stages
1. **Discovery**: Enumerate CKAN catalog
2. **Scanning**: Analyze dataset structure
3. **Downloading**: Fetch raw data (with DataStore probing)
4. **Normalization**: Add metadata, extract IPN fields
5. **Entity Resolution**: Search for IPN, create entities
6. **Evidence Generation**: Link facts to source records with SHA-256
7. **Card Generation**: Create cards from entities with provenance
8. **Truth Validation**: Verify data integrity across stages

### Output
- **Cards**: Person/Companies/FOP cards with field provenance
- **Evidence**: Full lineage from source to card
- **Validation**: Truth validation reports

### Blocking Points
- ❌ Database integration (PostgreSQL)
- ❌ PREDATOR API integration
- ❌ PREDATOR UI integration
- ❌ Positive control test (IPN found in real data)

---

## Critical Dependencies

### Must Have for Production
1. ✅ CKAN API connectivity
2. ✅ Data retrieval
3. ✅ CSV/JSON parsing
4. ✅ IPN search
5. ✅ Entity resolution
6. ✅ Evidence generation
7. ✅ Card generation
8. ❌ Database persistence
9. ❌ API endpoints
10. ❌ UI components

### Nice to Have
1. ⚠️ Full catalog enumeration (partial)
2. ⚠️ Safe batch ingestion (not implemented)
3. ⚠️ Schema drift detection (not tested)
4. ⚠️ Quality metrics (not tested)
5. ⚠️ Automated scheduling (not tested)

---

## Mock Data Status

### Previous State (Before Remediation)
- ❌ Mock entities in integration.ts
- ❌ Mock evidence in integration.ts
- ❌ Mock cards in integration.ts
- ❌ Hardcoded control profile results

### Current State (After Remediation)
- ✅ **NO MOCK DATA** in integration.ts
- ✅ Real IPN search implementation
- ✅ Real entity resolution implementation
- ✅ Real evidence generation with SHA-256
- ✅ Real card generation from entities
- ✅ Source-to-card lineage tracking

### Verification
- Grep search for "mock|fixture|fake|synthetic|demo|hardcoded.*data|sample.*data|placeholder.*data": **NO RESULTS**
- Grep search for "TODO.*mock|TODO.*fake|TODO.*synthetic|TODO.*fixture": **NO RESULTS**

---

## Production Readiness

### Current Status: 6/10

**Implemented (6/10)**:
1. ✅ Source discovery
2. ✅ Data retrieval
3. ✅ Data parsing
4. ✅ Entity resolution
5. ✅ Evidence generation
6. ✅ Card generation

**Missing (4/10)**:
1. ❌ Database integration
2. ❌ API integration
3. ❌ UI integration
4. ❌ Safe batch ingestion

### Path to Production
1. Find positive control IPN in real data
2. Execute full CKAN catalog enumeration
3. Implement safe batch ingestion
4. Connect to PostgreSQL database
5. Connect to PREDATOR API
6. Connect to PREDATOR UI
7. Implement field provenance in UI
8. Execute full end-to-end test
9. Generate production certification report

---

## Conclusion

The RDP has a well-defined execution path from source to cards. All core modules are implemented and integrated. Mock data has been completely removed from the integration layer. However, the pipeline is blocked at the card stage due to missing database, API, and UI integrations.

**Next Critical Step**: Execute full CKAN discovery and find a positive control IPN to verify the complete pipeline from raw data to card.
