# DEVIN DEPENDENCY GRAPH

**Date:** 2026-08-08T04:00:00Z  
**Objective:** Visual dependency mapping of RDP pipeline

---

## PIPELINE FLOW

```
EXTERNAL SOURCE (data.gov.ua)
    ↓
CKANAdapter
    ↓
DiscoveryEngine
    ↓
RelevanceEngine
    ↓
DatasetScanner
    ↓
ResourceDownloader
    ↓
StorageManager (FILE-BASED - BLOCKER)
    ↓
SchemaAnalyzer
    ↓
RDP Integration
    ↓
Entity Resolution Engine
    ↓
Evidence Engine
    ↓
Provenance Engine
    ↓
[MISSING] Database Integration (BLOCKER)
    ↓
[MISSING] PREDATOR API Integration (BLOCKER)
    ↓
[MISSING] PREDATOR UI Integration (BLOCKER)
```

---

## CRITICAL BLOCKING POINTS

### BLOCKER 1: StorageManager → Database
**Current:** File-based storage  
**Required:** PostgreSQL integration  
**Impact:** Cannot persist entities/facts/cards  
**Blocks:** All downstream pipeline stages

### BLOCKER 2: Database → PREDATOR API
**Current:** API exists but not connected to RDP  
**Required:** RDP → Database → API integration  
**Impact:** Cannot serve cards to UI  
**Blocks:** UI integration and truth validation

### BLOCKER 3: PREDATOR API → PREDATOR UI
**Current:** UI components exist but not connected to real API  
**Required:** UI → Real API → Database  
**Impact:** Cannot display real cards  
**Blocks:** Final user-facing verification

---

## COMPONENT DEPENDENCIES

### CKANAdapter
**Dependencies:** None (external API)  
**Dependents:** DiscoveryEngine  
**Status:** ✅ Functional

### DiscoveryEngine
**Dependencies:** CKANAdapter, RelevanceEngine  
**Dependents:** Orchestrator  
**Status:** ✅ Functional

### RelevanceEngine
**Dependencies:** None  
**Dependents:** DiscoveryEngine  
**Status:** ✅ Functional

### DatasetScanner
**Dependencies:** CKANAdapter  
**Dependents:** DiscoveryEngine  
**Status:** ✅ Functional

### ResourceDownloader
**Dependencies:** CKANAdapter, StorageManager  
**Dependents:** DiscoveryEngine  
**Status:** ⚠️ Partial (missing production features)

### StorageManager
**Dependencies:** None  
**Dependents:** ResourceDownloader, RDP Integration  
**Status:** ❌ BLOCKER (file-based, not production-grade)

### SchemaAnalyzer
**Dependencies:** StorageManager  
**Dependents:** DiscoveryEngine  
**Status:** ✅ Functional

### RDP Integration
**Dependencies:** StorageManager, Entity Resolution, Evidence, Provenance  
**Dependents:** PREDATOR API (missing)  
**Status:** ⚠️ Partial (not connected to DB/API/UI)

### Entity Resolution Engine
**Dependencies:** None  
**Dependents:** RDP Integration  
**Status:** ✅ Functional

### Evidence Engine
**Dependencies:** None  
**Dependents:** RDP Integration  
**Status:** ✅ Functional

### Provenance Engine
**Dependencies:** None  
**Dependents:** RDP Integration  
**Status:** ⚠️ Partial (missing version fields)

### Database Integration
**Dependencies:** None  
**Dependents:** PREDATOR API  
**Status:** ❌ MISSING (CRITICAL BLOCKER)

### PREDATOR API
**Dependencies:** Database  
**Dependents:** PREDATOR UI  
**Status:** ❌ MISSING (CRITICAL BLOCKER)

### PREDATOR UI
**Dependencies:** PREDATOR API  
**Dependents:** None (user-facing)  
**Status:** ❌ MISSING (CRITICAL BLOCKER)

---

## CANONICAL MODEL DEPENDENCIES

### Implemented Entity Types (9/19)
- PERSON ✅
- COMPANY ✅
- FOP ✅
- VEHICLE ✅
- UNKNOWN ✅
- ADDRESS ✅
- PHONE ✅
- EMAIL ✅
- DOCUMENT ✅

### Missing Entity Types (10/19)
- RELATIVE ❌
- COURT_CASE ❌
- SANCTION ❌
- LICENSE ❌
- DECLARATION ❌
- TAX_STATUS ❌
- DEBT ❌
- ASSET ❌
- TENDER ❌
- EXECUTIVE_CASE ❌

**Impact:** Cannot create cards for missing entity types

---

## PROVENANCE CHAIN DEPENDENCIES

### Current Provenance Fields
- fact_id ✅
- entity_id ✅
- source ✅
- dataset_id ✅
- resource_id ✅
- raw_record_id ✅
- raw_hash ✅
- timestamp ✅
- confidence ✅

### Missing Version Fields
- parser_version ❌
- mapping_version ❌
- normalizer_version ❌
- entity_resolution_version ❌

**Impact:** Cannot track pipeline component versions for reproducibility

---

## SUMMARY

**Total Components:** 13  
**Functional:** 8  
**Partial:** 3  
**Missing:** 2  
**Critical Blockers:** 3

**The pipeline is functional up to StorageManager, but cannot proceed to production without database, API, and UI integration.**
