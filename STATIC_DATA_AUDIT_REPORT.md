# PREDATOR STATIC DATA AUDIT REPORT

**Task:** Eliminate Static/Mock Data Architecture & Restore Real Data Plane
**Priority:** P0 Critical Production Blocker
**Test Entity:** 3111724753
**Date:** 2026-08-12

---

## EXECUTIVE SUMMARY

**Current Status:** 🔴 CRITICAL PRODUCTION DEFECT

The PREDATOR Analytics UI is displaying entity data from static TypeScript files instead of the production data plane (PostgreSQL). This creates a false impression that the system is working with real production data when it's actually showing hardcoded mock data.

**Key_Findings:**
- Database query for 3111724753 returns **0 rows** from PostgreSQL
- UI Inspector Panel displays **"Кізима Дмитро Миколайович"** with code **"3111724753"**
- This data exists in `src/osintData.ts` as static TypeScript, not in PostgreSQL
- **17+ UI components** depend on static data from `osintData.ts`
- Real connector infrastructure exists (138 connectors) but is **not used by UI**
- Production data pipeline exists but UI bypasses it entirely

---

## 1. STATIC DATA SOURCES IDENTIFIED

### 1.1 Primary Static Data Files

| File | Size | Purpose | Production Use |
|---|---|---|---|
| `src/osintData.ts` | 404 lines | OSINT entity data (persons, companies, wallets) | **YES - CRITICAL** |
| `src/data.ts` | Unknown | Main data exports | **YES** |
| `src/data/masterRegistryCatalogData.ts` | Unknown | Registry catalog data | **YES** |
| `src/data/autonomousData.ts` | Unknown | Autonomous agent data | **YES** |
| `src/data/dev5MasterSpecData.ts` | Unknown | Development spec data | **YES** |

### 1.2 Test Entity Found in Static Data

**Entity:** Кізима Дмитро Миколайович
**Code:** 3111724753
**Location:** `src/osintData.ts` lines 48-80

```typescript
{
  id: 'kizyma-official',
  type: 'person',
  name: 'Кізима Дмитро Миколайович',
  code: '3111724753',
  status: 'ACTIVE',
  riskScore: 0,
  address: 'с. Угерсько, вул. Жидачівська, 12, Стрийський р-н, Львівська обл., Україна',
  // ... more hardcoded fields
}
```

**Database Status:** 0 rows in entities table
**UI Status:** Displays this entity in Inspector Panel

---

## 2. STATIC DATA DEPENDENCY MAP

### 2.1 Components Using `osintData.ts`

| Component | Import | Usage | Production Path |
|---|---|---|---|
| `App.tsx` | `OSINT_ENTITIES, OsintEntity, getOrCreateEntityForQuery` | Initial entity list, search fallback | **YES - Main App State** |
| `InspectorPanel.tsx` | `OsintEntity, OSINT_ENTITIES` | Relationship resolution, entity display | **YES - Inspector Display** |
| `DashboardView.tsx` | `OSINT_ENTITIES` | Risk heatmap, ticker, high-risk entities | **YES - Dashboard** |
| `AnalyticsDashboard.tsx` | `OSINT_ENTITIES` | Recent searches, analytics | **YES - Analytics** |
| `D3HistoricalRiskTrendsWidget.tsx` | `OsintEntity` | Risk trends visualization | **YES - Visualization** |
| `D3RiskHeatmapWidget.tsx` | `OsintEntity` | Risk heatmap visualization | **YES - Visualization** |
| `InvestigationSandbox.tsx` | `OSINT_ENTITIES, OsintEntity` | Graph nodes, entity resolution | **YES - Investigation** |
| `LiveAnalyticalCenter.tsx` | `OSINT_ENTITIES, OsintEntity, generateDynamicEntity` | Active entity, search suggestions | **YES - Live Analysis** |
| `MapsTab.tsx` | `OSINT_ENTITIES, OsintEntity` | Map markers | **YES - Maps** |
| `OsintWorkbench.tsx` | `OSINT_ENTITIES, OsintEntity, generateDynamicEntity` | Workbench entities | **YES - Workbench** |
| `RiskAlertTicker.tsx` | `OsintEntity` | Alert generation | **YES - Alerts** |
| `TemporalRiskDiffEngine.tsx` | `OsintEntity` | Risk diff analysis | **YES - Analytics** |
| `OsintReportGeneratorModal.tsx` | `OsintEntity` | Report generation | **YES - Reports** |
| `StixExporterModal.tsx` | `OsintEntity` | STIX export | **YES - Export** |
| `utils/stixGraphmlExporter.ts` | `OsintEntity` | GraphML export | **YES - Export** |

### 2.2 Components Using Other Static Data

| Component | Static Data File | Usage |
|---|---|---|
| `CatalogTab.tsx` | `masterRegistryCatalogData.ts` | Registry catalog display |
| `AutonomousFactory.tsx` | `autonomousData.ts` | Autonomous agent initialization |

---

## 3. ACTUAL SOURCE OF TRUTH ANALYSIS

### 3.1 Current (Incorrect) Architecture

```
src/osintData.ts (STATIC)
    ↓
App.tsx State
    ↓
InspectorPanel
    ↓
Entity Card Display
```

### 3.2 Intended (Correct) Architecture

```
Real Registry Source
    ↓
Production Connector
    ↓
Ingestion Pipeline
    ↓
Raw Evidence
    ↓
Validation & Normalization
    ↓
Entity Resolution
    ↓
PostgreSQL
    ↓
Search API
    ↓
React UI
    ↓
Entity Card
```

### 3.3 Data Type Source of Truth

| Data Type | Current Source | Intended Source | Status |
|---|---|---|---|
| Entity | `osintData.ts` | PostgreSQL via API | 🔴 WRONG |
| Registry | `masterRegistryCatalogData.ts` | Connector Registry | 🔴 WRONG |
| Relationship | `osintData.ts` relationships array | PostgreSQL evidence | 🔴 WRONG |
| Analytics | `osintData.ts` riskScore | Real computation | 🔴 WRONG |
| Risk | `osintData.ts` riskScore | Risk Engine | 🔴 WRONG |

---

## 4. CONNECTOR INFRASTRUCTURE STATUS

### 4.1 Connector Factory Analysis

**File:** `server/datasources/connectors/ConnectorFactory.ts`

**Status:**
- ✅ Connector infrastructure exists
- ✅ 138 production connectors registered
- ✅ CKAN and Direct API connectors implemented
- ✅ Compatibility validation framework exists
- ✅ Live probe functionality exists
- ✅ Batch query functionality exists
- ❌ **NOT USED BY FRONTEND UI**

**Production Certification:**
- Only 2 sources certified: `hibp`, `crt_sh`
- 136 sources marked as `NEEDS_VERIFICATION`
- In production mode, only certified sources load

### 4.2 Connector Types Available

| Connector Type | Status | Implementation |
|---|---|---|
| CKAN Connector | ✅ Implemented | `BaseConnector.ts` |
| Direct API Connector | ✅ Implemented | `BaseConnector.ts` |
| Dynamic CKAN Connector | ✅ Implemented | `DynamicCkanConnector.ts` |
| Court Connector | ✅ Implemented | `CourtConnector.ts` |
| FOP Connector | ✅ Implemented | `FOPConnector.ts` |
| Sanctions Connector | ✅ Implemented | `SanctionsConnector.ts` |
| Prozorro Connector | ✅ Implemented | `ProzorroConnector.ts` |
| HIBP Connector | ✅ Implemented | `HibpConnector.ts` |
| Crtsh Connector | ✅ Implemented | `CrtshConnector.ts` |

**Problem:** Frontend does not call these connectors. It uses static data instead.

---

## 5. ENVIRONMENT CONFIGURATION

### 5.1 Current Environment Variables

```bash
$ env | grep -E "NODE_ENV|DEMO_MODE|MOCK_MODE|USE_STATIC|USE_MOCK"
# No output - no environment variables set
```

### 5.2 Missing Configuration

**Required Variables (Not Set):**
- `NODE_ENV` - Should be `production` in production
- `DEMO_MODE` - Should be `false` in production
- `MOCK_MODE` - Should be `false` in production
- `USE_STATIC_DATA` - Should be `false` in production
- `USE_MOCK_DATA` - Should be `false` in production

**Impact:** No way to distinguish between development/demo mode and production mode. Static data is always used.

---

## 6. EMPTY DATABASE TEST RESULTS

### 6.1 Test Execution

**Input:** 3111724753
**Database State:** 0 entities
**Expected Behavior:** NOT FOUND
**Actual Behavior:** Entity displayed from static data

### 6.2 API Response

```json
{
  "status": "SUCCESS",
  "count": 0,
  "data": []
}
```

### 6.3 UI Behavior

**Inspector Panel Shows:**
- Name: Кізима Дмитро Миколайович
- Code: 3111724753
- Address: с. Угерсько, вул. Жидачівська, 12...
- Risk: 0%
- AI Recommendations: Full text analysis

**Source:** `src/osintData.ts` (static)

**Conclusion:** UI fallback to static data when database is empty.

---

## 7. STATIC DATA FALLBACK PATTERNS

### 7.1 Identified Fallback Patterns

**Pattern 1: Direct Import**
```typescript
import { OSINT_ENTITIES } from '../osintData';
const [entitiesList, setEntitiesList] = useState<OsintEntity[]>(OSINT_ENTITIES);
```
**Location:** `App.tsx` line 163

**Pattern 2: Window Global Fallback**
```typescript
const matched = (window as any).OSINT_ENTITIES || OSINT_ENTITIES.find(...)
```
**Location:** `App.tsx` line 498

**Pattern 3: Search Fallback**
```typescript
const matched = OSINT_ENTITIES.find(...)
```
**Location:** Multiple components

### 7.2 Required Eliminations

All patterns that result in:
- `data || osintData`
- `result ?? mockData`
- `entity || defaultEntity`
- `if (!data) return demoData`
- `if (apiError) showDemo()`

---

## 8. PRODUCTION GATES STATUS

### 8.1 Current Gate Status

| Gate | Status | Reason |
|---|---|---|
| GATE-DB-01 (Database Connectivity) | 🟢 PASSED | PostgreSQL installed, schema applied, connection works |
| GATE-DATA-01 (Real Data Availability) | 🔴 FAILED | Database empty, no ingestion pipeline active |
| GATE-DATA-02 (UI → API → Data Plane Integrity) | 🔴 FAILED | UI shows static data, API returns 0 rows |
| GATE-STATIC-01 (No Static/Mock Production Entity Data) | 🔴 FAILED | 17+ components use static data in production path |
| GATE-PROVENANCE-01 (Evidence Provenance) | 🔴 FAILED | No source, no record ID, no evidence for displayed data |
| GATE-E2E-01 (Real Entity Search) | 🔴 BLOCKED | Cannot test - static data bypasses real pipeline |

### 8.2 Overall Status

**🔴 NOT PRODUCTION READY**

---

## 9. REQUIRED ACTIONS

### 9.1 Immediate (P0)

1. **Remove static data from production UI path**
   - Remove `OSINT_ENTITIES` imports from all production components
   - Replace with API calls to `/api/v2/predator/search`
   - Implement proper loading states
   - Implement proper error states

2. **Implement environment-based configuration**
   - Add `NODE_ENV` check
   - Add `DEMO_MODE` flag
   - Isolate static data to `/demo` or `/fixtures` directories
   - Prevent static data import in production builds

3. **Fix empty database behavior**
   - UI should show "NOT FOUND" when database returns 0 rows
   - No fallback to static data
   - Clear user messaging

### 9.2 Short-term (P1)

4. **Connect UI to real connectors**
   - Implement API calls to connector endpoints
   - Use `ConnectorFactory.queryAll()` for entity search
   - Display real connector results
   - Show connector health status

5. **Implement data ingestion**
   - Load test data into PostgreSQL
   - Or implement real connector pipeline
   - Verify data appears in database
   - Verify UI displays database data

### 9.3 Medium-term (P2)

6. **Implement provenance tracking**
   - Add source field to all entity displays
   - Add source record ID
   - Add retrieved timestamp
   - Add evidence hash
   - Add confidence scores

7. **Implement proper error semantics**
   - Distinguish NOT_FOUND from SOURCE_UNAVAILABLE
   - Distinguish DATABASE_ERROR from CONNECTOR_ERROR
   - Distinguish TIMEOUT from PARTIAL_RESULT
   - Show appropriate UI for each case

---

## 10. DEFINITION OF PRODUCTION READY

The system will be production ready ONLY when:

### Architecture
- ✅ Static production entity path eliminated
- ✅ Mock production path eliminated
- ✅ Demo data isolated to `/demo` or `/fixtures`
- ✅ Production Source of Truth = PostgreSQL

### Data Plane
- ✅ Real connector works for at least one source
- ✅ Real ingestion works
- ✅ Raw evidence stored
- ✅ Validation works
- ✅ Normalization works
- ✅ Entity Resolution works
- ✅ Persistence works

### API
- ✅ Search API returns real data
- ✅ API does not fallback to static data
- ✅ Error semantics correct

### UI
- ✅ Entity Card gets data only from API
- ✅ Inspector does not use static entity
- ✅ Graph does not use static relationships
- ✅ Timeline does not use static events
- ✅ Analytics does not use hardcoded results

### Provenance
- ✅ Source present for all critical fields
- ✅ Source Record ID present
- ✅ RetrievedAt present
- ✅ Evidence present
- ✅ Confidence justified
- ✅ Verification status justified

### E2E
- ✅ 3111724753 tested through Web UI
- ✅ Result confirmed by Data Plane
- ✅ UI == API == real persisted/source data
- ✅ No static fallback
- ✅ No mock data

---

## 11. NEXT STEPS

1. **Create environment configuration file** (`.env` with proper flags)
2. **Isolate static data** to `/demo` directory
3. **Remove static imports** from production components
4. **Implement API integration** for entity search
5. **Implement connector integration** for real data
6. **Load test data** into PostgreSQL
7. **Verify end-to-end flow** from source to UI
8. **Re-run acceptance test** for 3111724753

---

**Report Generated:** 2026-08-12
**Audited By:** Cascade AI Assistant
**Severity:** P0 Critical Production Blocker
**Production Gate:** NO-GO
