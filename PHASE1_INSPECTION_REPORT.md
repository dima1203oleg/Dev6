# Phase 1: Full Codebase Inspection Report

## Critical Issues Found

### 1. BROKEN SEARCH ENDPOINT
- **File**: `src/components/SearchPortal.tsx` (line 55)
- **Issue**: Calls `/api/v2/intelligence/search` which does not exist
- **Impact**: Search functionality completely broken
- **Root Cause**: Frontend expects v2 API but only v1 routes exist
- **Backend Route**: `/api/v1/predator/search` exists at `server/routes/predatorRoutes.ts`

### 2. EMPTY SEARCH RESULTS
- **File**: `server/services/predatorClient.ts` (lines 25-56)
- **Issue**: `searchEntities()` returns empty candidates array
- **Impact**: No data returned from search
- **Root Cause**: Method has placeholder logic, doesn't call actual connectors
- **Note**: `IntelligenceOrchestrator.ts` has real data fetching via `connectorFactory.queryAll()`

### 3. DISCONNECTED DATA FLOW
- **Files**: `predatorClient.ts` vs `IntelligenceOrchestrator.ts`
- **Issue**: predatorClient doesn't use IntelligenceOrchestrator's real data fetching
- **Impact**: Search returns no data even though backend can fetch it
- **Root Cause**: predatorClient.searchEntities has incomplete implementation

## Backend Structure

### Routes (9 files)
- `/api/v1/predator` - predatorRoutes.ts (search, dossier, provenance, investigations)
- `/api/v1/ai` - aiRoutes.ts (AI tasks, classification, orchestration)
- `/api/v1/connectors` - connectorRoutes.ts
- `/api/v1/audit` - auditRoutes.ts
- `/api/v1/media` - mediaRoutes.ts
- `/api/v1/data` - dataRoutes.ts (EDR, Tax, Court, Sanctions, Licenses)
- `/api/v1/system` - registryMasterCatalogRoutes.ts
- `/api/v1/admin` - adminRoutes.ts
- `/api/v1/mlip` - mlipRoutes.ts (OSI, COMINT, TECHINT, MEDINT, SOCINT, DARKINT)

### Services (16 files)
- predatorClient.ts - Main client (INCOMPLETE search)
- IntelligenceOrchestrator.ts - Real data fetching (WORKING)
- hydraEngine.ts - Evidence engine
- EntityResolutionEngine.ts
- GlobalHealthService.ts
- OSIService.ts, ComintService.ts, TechintService.ts, MedintService.ts, SocintService.ts, DarkintService.ts
- aiRouter.ts
- queryDsl.ts
- mediaPipeline.ts
- predatorVoiceProfile.ts

### Connectors (13 files)
- AbstractConnector.ts
- CourtConnector.ts, FOPConnector.ts, HibpConnector.ts, ProzorroConnector.ts, SanctionsConnector.ts, CrtshConnector.ts
- ckan/ (api.ts, client.ts, discovery.ts, index.ts)
- connectorLogger.ts
- sdk.ts

### Data Sources (16 files)
- connectors/ConnectorFactory.ts, BaseConnector.ts, CertificationManager.ts, sdk.ts
- registries/ (court.ts, edr.ts, licenses.ts, sanctions.ts, tax.ts, universalCatalog.ts)
- RegistryCatalog.ts, governor.ts, riskEngine.ts, types.ts
- qa/MatrixRunner.ts

## Frontend Structure

### Components (58+ files)
- App.tsx (2672 lines) - Main app with tabs
- SearchPortal.tsx (522 lines) - Search interface (BROKEN endpoint)
- DossierView.tsx (1439 lines) - Entity card display
- Many specialized components (PersonProfiler, OsintWorkbench, InvestigationWorkspaceTab, etc.)
- search/ directory with cards and blocks
- dev6/ directory with DEV6 components
- mlip/ directory with MLIP components

### Issues in Frontend
1. SearchPortal calls non-existent `/api/v2/intelligence/search`
2. Many components may have placeholder data
3. Complex routing in App.tsx with many tabs

## Data Flow Issues

### Current (Broken) Flow:
1. User searches in SearchPortal
2. Calls `/api/v2/intelligence/search` (DOESN'T EXIST)
3. Search fails

### Intended Flow:
1. User searches in SearchPortal
2. Should call `/api/v1/predator/search`
3. predatorClient.searchEntities should call IntelligenceOrchestrator
4. IntelligenceOrchestrator fetches from connectors
5. Returns dossier to frontend

## Next Steps (Phase 2)

1. Fix search endpoint mismatch
2. Implement predatorClient.searchEntities to use real data
3. Verify connector data flow
4. Test end-to-end search
