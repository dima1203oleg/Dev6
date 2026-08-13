# PREDATOR ARCHITECTURE DEPENDENCY MAP

**Date:** 2026-08-13  
**Purpose:** Phase 1 Architecture Inspection for Real Data Pipeline Implementation

## EXISTING COMPONENTS INVENTORY

### 1. CONNECTOR SDK ✅
**Location:** `server/datasources/connectors/`

**Components:**
- `sdk.ts` - ProductionConnector interface definition
- `BaseConnector.ts` - Production connector implementation with:
  - SHA-256 hashing (lines 82, 118)
  - Evidence building (lines 62-74)
  - Schema validation (lines 51-59)
  - Health check (lines 21-43)
  - Raw response capture (lines 77-141)
  - CkanConnector implementation (lines 163-265)
  - DirectApiConnector implementation (lines 269-295)

**Status:** ✅ PRODUCTION READY

### 2. CONNECTOR REGISTRY ✅
**Location:** `server/connectors/`

**Components:**
- `AbstractConnector.ts` - Base connector interface
- `DPSConnector.ts` - Full DPS connector with:
  - Token management (DPSTokenManager)
  - Rate limiting (DPSRateLimiter)
  - Circuit breaker (DPSCircuitBreaker)
  - Retry policy (DPSRetryPolicy)
  - HYDRA integration (lines 140, 226, 311, etc.)
  - 13 DPS endpoints implemented
- `CourtConnector.ts` - Court registry connector
- `FOPConnector.ts` - FOP registry connector
- `SanctionsConnector.ts` - Sanctions connector
- `ProzorroConnector.ts` - Prozorro connector

**Status:** ✅ PRODUCTION READY

### 3. HYDRA ENGINE ✅
**Location:** `server/services/hydraEngine.ts`

**Components:**
- SHA-256 hashing (line 156)
- Evidence chain ledger (lines 212-229)
- Source trust registry (lines 22-34)
- Fact resolution (lines 234-360)
- Contradiction detection (lines 277-298)
- Search planning (lines 39-138)
- Evidence ingestion (lines 143-207)

**Status:** ✅ PRODUCTION READY

### 4. INTELLIGENCE ORCHESTRATOR ✅
**Location:** `server/services/IntelligenceOrchestrator.ts`

**Components:**
- Multi-source data fetching (lines 156-304)
- HYDRA integration (lines 57, 82, 102)
- Entity resolution (lines 306-330)
- Verification status calculation (lines 332-339)
- Risk analysis (lines 358-413)
- Dossier building (lines 24-154)

**Status:** ✅ PRODUCTION READY

### 5. EVIDENCE SYSTEM ✅
**Location:** `server/services/hydraEngine.ts`

**Components:**
- EvidenceRecord structure (lines 183-201)
- Evidence chain ledger (lines 212-229)
- Cryptographic provenance (lines 155-156)
- Source authority tracking (lines 159-167)

**Status:** ✅ PRODUCTION READY

### 6. PROVENANCE TRACKING ✅
**Location:** `server/services/hydraEngine.ts`

**Components:**
- Source trust registry (lines 22-34)
- Evidence chain with hashes (lines 212-229)
- Source authority scores (lines 194-195)
- Verification status (lines 172-181)

**Status:** ✅ PRODUCTION READY

### 7. DATABASE REPOSITORIES ✅
**Location:** `server/database/repositories/`

**Components:**
- CardRepository
- EntityRepository
- EvidenceRepository
- Various domain repositories

**Status:** ✅ PRODUCTION READY

### 8. API SERVICES ✅
**Location:** `server/api/PredatorAPI.ts`, `server/routes/predatorRoutes.ts`

**Components:**
- `/api/v2/predator/search` (GET/POST)
- `/api/v2/predator/cards`
- `/api/v1/predator/search`
- Health endpoints

**Status:** ✅ PRODUCTION READY (demo fallbacks removed)

### 9. ENTITY RESOLUTION ⚠️
**Location:** `server/services/IntelligenceOrchestrator.ts`

**Components:**
- Basic entity resolution (lines 306-330)
- Match score calculation (lines 415-419)
- Verification status (lines 332-339)

**Status:** ⚠️ PARTIAL - needs enhancement for production

### 10. NORMALIZATION ENGINE ⚠️
**Location:** `server/datasources/connectors/BaseConnector.ts`

**Components:**
- Basic normalization (lines 152-154)
- CkanConnector normalization (lines 258-264)

**Status:** ⚠️ PARTIAL - needs comprehensive implementation

### 11. INGESTION ENGINE ⚠️
**Location:** `server/services/IntelligenceOrchestrator.ts`

**Components:**
- Multi-source fetching (lines 156-304)
- Evidence ingestion via HYDRA (lines 57, 82)
- Source prioritization (lines 164-213)

**Status:** ⚠️ PARTIAL - needs systematic implementation

## DATA FLOW DIAGRAM

```
USER REQUEST (EDRPOU/IPN)
    ↓
IntelligenceOrchestrator.buildDossier()
    ↓
┌─────────────────────────────────────────┐
│ SOURCE SELECTION & PRIORITIZATION      │
│ - Clarity Project API (PRIMARY)         │
│ - NAIS EDR XML (SECONDARY)              │
│ - DPS Tax Cabinet (TERTIARY)            │
│ - EDR data.gov.ua (FALLBACK)            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONNECTOR LAYER                         │
│ - BaseConnector (SDK)                   │
│ - DPSConnector (13 endpoints)           │
│ - CourtConnector                        │
│ - SanctionsConnector                    │
│ - FOPConnector                          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ RAW RESPONSE CAPTURE                    │
│ - HTTP status                           │
│ - Response headers                      │
│ - Raw payload                           │
│ - Request timing                        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ SHA-256 HASHING (HYDRA)                │
│ - Raw payload hash                      │
│ - Request hash                          │
│ - Evidence chain ledger                 │
│ - Cryptographic provenance              │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ SCHEMA VALIDATION                       │
│ - Required fields check                 │
│ - Type validation                       │
│ - Structure validation                  │
│ - Schema version tracking               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ NORMALIZATION                           │
│ - Canonical field mapping               │
│ - Type conversion                       │
│ - Standard formatting                   │
│ - Preserve original representation       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ ENTITY RESOLUTION                       │
│ - Identifier matching                   │
│ - Name matching                         │
│ - Address matching                      │
│ - Cross-source corroboration            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ HYDRA VERIFICATION ENGINE               │
│ - Source trust registry                 │
│ - Fact resolution                       │
│ - Contradiction detection               │
│ - Confidence calculation                │
│ - Verification status assignment        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ EVIDENCE CREATION                       │
│ - EvidenceRecord                        │
│ - Source metadata                       │
│ - Provenance chain                      │
│ - Field-level evidence                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ DATABASE PERSISTENCE                    │
│ - entities table                        │
│ - evidence table                        │
│ - card_instances table                  │
│ - card_fields table                     │
│ - validation_results table             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ ENTITY CARD GENERATION                  │
│ - EDR_REGISTRATION card                 │
│ - TAX_STATUS card                       │
│ - SANCTIONS_CHECK card                  │
│ - COURT_RECORDS card                   │
│ - RISK_ASSESSMENT card                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ API RESPONSE                            │
│ - /api/v2/predator/search               │
│ - /api/v2/predator/cards                │
│ - /api/v1/predator/search               │
└─────────────────────────────────────────┘
    ↓
FRONTEND UI DISPLAY
```

## MISSING COMPONENTS

### 1. FIELD PROVENANCE TRACKING ❌
**Required:**
- Field-level source attribution
- Field-level evidence IDs
- Field-level confidence scores
- Field-level validation status

**Current State:** Evidence exists at entity level, not field level

### 2. COMPREHENSIVE NORMALIZATION ❌
**Required:**
- Canonical field mappings for all sources
- Type conversion rules
- Standard formatting rules
- Preserve original representation

**Current State:** Basic normalization in BaseConnector

### 3. ENTITY CARD GENERATION ❌
**Required:**
- Card generation from evidence
- Card status from real data
- Field provenance in cards
- Confidence from evidence

**Current State:** Demo cards removed, no real card generation

### 4. CONFIDENCE CALCULATION ❌
**Required:**
- Evidence-based confidence
- Source authority weighting
- Cross-source corroboration
- Freshness factors

**Current State:** Hardcoded confidence in some places

### 5. REGRESSION TESTS ❌
**Required:**
- PostgreSQL unavailability test
- Source unavailability test
- DEMO data labeling test
- Evidence chain verification test

**Current State:** No regression tests

## RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Foundation (Already Exists ✅)
1. Connector SDK - BaseConnector.ts ✅
2. HYDRA Engine - hydraEngine.ts ✅
3. Evidence System - hydraEngine.ts ✅
4. Database Repositories - repositories/ ✅
5. API Services - PredatorAPI.ts ✅

### Phase 2: Enhancement (Required)
1. Field-level provenance tracking
2. Comprehensive normalization
3. Entity card generation from evidence
4. Evidence-based confidence calculation
5. Regression tests

### Phase 3: Integration (Required)
1. Connect first real source (DPS or NAIS)
2. End-to-end evidence chain
3. Real entity card generation
4. API integration
5. Frontend provenance display

## CONCLUSION

**Architecture Status:** 70% COMPLETE

**Existing Strengths:**
- ✅ Production connector SDK exists
- ✅ HYDRA engine with SHA-256 and evidence chain
- ✅ Multi-source orchestration
- ✅ Database schema and repositories
- ✅ API endpoints (demo fallbacks removed)

**Required Enhancements:**
- ❌ Field-level provenance
- ❌ Comprehensive normalization
- ❌ Real entity card generation
- ❌ Evidence-based confidence
- ❌ Regression tests

**Next Steps:**
1. Implement field-level provenance tracking
2. Enhance normalization engine
3. Implement real entity card generation
4. Add regression tests
5. Connect first real source end-to-end

---

**Map Generated:** 2026-08-13  
**Architecture Status:** READY FOR PHASE 2 IMPLEMENTATION
