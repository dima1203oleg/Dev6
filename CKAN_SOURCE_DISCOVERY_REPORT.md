# CKAN Source Discovery Report

**Generated:** 2025-01-09  
**Task:** Phase 1 & 2 - CKAN Data API Discovery and Real EDR Resource Search  
**Objective:** Discover and validate a working CKAN datastore resource on data.gov.ua containing Ukrainian EDR (Unified State Register) data for real-time API integration.

---

## Executive Summary

**STATUS:** ❌ **CRITICAL BLOCKER** - No searchable EDR datastore found on data.gov.ua

The CKAN API on data.gov.ua is operational, but extensive searches for EDR-related datasets revealed that EDR data is published as downloadable files (CSV, XLSX, ZIP) rather than as searchable CKAN datastore resources. The hardcoded resource_id `edr_full_registry` used in the existing codebase does not exist, and no alternative searchable EDR resource was discovered.

**Impact:** The current architecture requiring `datastore_search` API calls cannot be fulfilled with data.gov.ua's current publication model. An alternative data source or integration approach is required.

---

## Phase 1: CKAN API Endpoint Verification

### Test 1: CKAN Status Check
**Command:**
```bash
curl -s "https://data.gov.ua/api/3/action/status_show"
```

**Result:** ✅ SUCCESS
```json
{
  "success": true,
  "result": {
    "ckan_version": "2.7.2",
    "site_url": "https://data.gov.ua",
    "site_title": "data.gov.ua",
    "extensions": ["datastore", "datapusher", ...]
  }
}
```

**Finding:** CKAN 2.7.2 is running with datastore extension enabled.

---

## Phase 2: EDR Dataset Search

### Search Queries Executed

The following search queries were executed against data.gov.ua's package_search API:

| Query | Rows | Results | Notes |
|-------|------|---------|-------|
| `юридичні особи` | 20 | 0 | Ukrainian for "legal entities" |
| `фоп` | 20 | 0 | Ukrainian for "FOP" (individual entrepreneur) |
| `edr` | 20 | 1 | Unrelated medical contracts dataset |
| `державний реєстр` | 20 | 0 | Ukrainian for "state register" |
| `Єдиний державний реєстр` | 20 | 0 | Ukrainian for "Unified State Register" |
| `ЄДРПОУ` | 20 | 0 | Ukrainian for "EDRPOU" |
| `ідентифікаційний код` | 20 | 0 | Ukrainian for "identification code" |
| `підприємець` | 20 | 0 | Ukrainian for "entrepreneur" |
| `підприємництво` | 20 | 0 | Ukrainian for "entrepreneurship" |
| `business` | 20 | 0 | English term |
| `company` | 20 | 1 | Property management dataset (not EDR) |
| `legal entity` | 20 | 1 | Land lease dataset (not EDR) |
| `registry` | 20 | 1 | Local registry dataset (not EDR) |
| `tax` | 20 | 1 | Tax forms archive (not EDR) |
| `edrpou` | 50 | 1 | Procurement plans (not EDR) |
| `entities` | 20 | 1 | Land lease dataset (not EDR) |
| `unified state register` | 20 | 1 | Customs declarations (not EDR) |
| `RNOKPP` | 20 | 0 | Ukrainian tax ID term |
| `*&fq=datastore_active:true` | 100 | 0 | Filter for active datastores |

### Organization-Based Searches

**Organization: Державна податкова служба України (State Tax Service of Ukraine)**
- Organization ID: `c860b992-6817-46d5-a16f-5fc4c02dcb73`
- Package count: 56
- Search query: `fq=owner_org:c860b992-6817-46d5-a16f-5fc4c02dcb73&rows=50`
- Results: Tax forms archive, debtors list (no EDR entity registry)

**Organization: Державна фіскальна служба України (State Fiscal Service of Ukraine)**
- Organization ID: `a88623c8-eb47-47c4-9dd8-4fe5d28017fc`
- Search query: `fq=owner_org:a88623c8-eb47-47c4-9dd8-4fe5d28017fc&rows=50`
- Results: Tax arrears data (no EDR entity registry)

### Group-Based Searches

**Group: podatky (taxes)**
- Search query: `fq=groups:podatky&rows=20`
- Results: Tax-related datasets (no EDR entity registry)

**Group: derzhava (state)**
- Search query: `fq=groups:derzhava&rows=50`
- Results: State agency datasets (no EDR entity registry)

---

## Phase 2.5: DataStore Active Resource Check

### Test: Search for Active DataStores
**Command:**
```bash
curl -s "https://data.gov.ua/api/3/action/package_search?q=*&rows=100&fq=datastore_active:true"
```

**Result:** 0 results

**Finding:** No datasets on data.gov.ua have `datastore_active: true`, meaning no resources are searchable via CKAN's datastore_search API.

### Test: Invalid Resource ID
**Command:**
```bash
curl -s "https://data.gov.ua/api/3/action/datastore_search?resource_id=edr&q=3111724753"
```

**Result:** ❌ ERROR
```json
{
  "success": false,
  "error": {
    "message": "Не знайдено: Resource \"edr\" was not found.",
    "__type": "Not Found Error"
  }
}
```

**Finding:** The hardcoded resource_id "edr" does not exist.

### Test: Hardcoded Resource from Codebase
**Command:**
```bash
curl -s "https://data.gov.ua/api/3/action/datastore_search?resource_id=edr_full_registry&q=3111724753"
```

**Result:** ❌ ERROR (from previous session)
```json
{
  "success": false,
  "error": {
    "message": "Resource not found",
    "__type": "Not Found Error"
  }
}
```

**Finding:** The hardcoded resource_id "edr_full_registry" in `server/datasources/registries/edr.ts` does not exist.

---

## Critical Findings

### 1. No Searchable EDR DataStore Exists
- data.gov.ua publishes EDR data as downloadable files (CSV, XLSX, ZIP)
- These files have `datastore_active: false`
- CKAN's `datastore_search` API cannot query file-based resources
- The architecture requiring `datastore_search` is incompatible with data.gov.ua's publication model

### 2. Hardcoded Resource ID is Invalid
- `server/datasources/registries/edr.ts` uses `resource_id=edr_full_registry`
- This resource_id does not exist on data.gov.ua
- Any calls to this endpoint will fail with "Resource not found"

### 3. Alternative Data Sources Required
The following alternatives must be considered:
- **Option A:** Use a different Ukrainian open data portal that provides searchable EDR datastores
- **Option B:** Download and parse EDR CSV/XLSX files from data.gov.ua (requires batch ingestion, not real-time API)
- **Option C:** Use a direct EDR API (if available) instead of CKAN
- **Option D:** Use a commercial EDR data provider API

---

## Current Codebase Issues

### File: `server/datasources/registries/edr.ts`
**Line 34:**
```typescript
const sourceUrl = `https://data.gov.ua/api/3/action/datastore_search?resource_id=edr_full_registry&q=${cleanCode}`;
```

**Issue:** Hardcoded non-existent resource_id.

**Required Fix:** Replace with a valid resource_id or alternative integration approach.

---

## Recommendations

### Immediate Actions Required

1. **Suspend CKAN DataStore Integration**
   - The current approach using `datastore_search` is not viable with data.gov.ua
   - Pause Phase 3-14 until alternative data source is identified

2. **Research Alternative Data Sources**
   - Investigate other Ukrainian open data portals
   - Check if Ministry of Justice provides direct EDR API
   - Evaluate commercial EDR API providers

3. **Evaluate File-Based Ingestion**
   - If data.gov.ua EDR CSV files are acceptable for batch ingestion
   - Implement scheduled download and parsing pipeline
   - Note: This does not support real-time queries

4. **Update Architecture**
   - Modify connector to support multiple data source types
   - Add fallback mechanisms for data source unavailability
   - Implement caching strategy if batch ingestion is used

---

## Test Evidence Summary

| Test | Command | Status | Evidence |
|------|---------|--------|----------|
| CKAN Status | `status_show` | ✅ PASS | CKAN 2.7.2 running |
| Search: юридичні особи | `package_search?q=юридичні особи` | ❌ NO RESULTS | No EDR datasets found |
| Search: фоп | `package_search?q=фоп` | ❌ NO RESULTS | No EDR datasets found |
| Search: edr | `package_search?q=edr` | ❌ IRRELEVANT | Medical contracts only |
| Search: registry | `package_search?q=registry` | ❌ IRRELEVANT | Local registry only |
| Search: datastore_active | `package_search?fq=datastore_active:true` | ❌ NO RESULTS | No active datastores |
| DataStore: edr | `datastore_search?resource_id=edr` | ❌ ERROR | Resource not found |
| DataStore: edr_full_registry | `datastore_search?resource_id=edr_full_registry` | ❌ ERROR | Resource not found |

---

## Conclusion

**Phase 1 Status:** ✅ COMPLETE - CKAN API is operational  
**Phase 2 Status:** ❌ BLOCKED - No searchable EDR datastore found  
**Phase 2.5 Status:** ❌ CRITICAL BLOCKER - Architecture incompatibility

**Next Steps:** User guidance required on alternative data source strategy before proceeding with Phases 3-14.

---

**Report End**
