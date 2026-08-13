# Static Data Elimination Report

**Generated:** 2025-01-12  
**Task:** Phase 4.10 - Static Data Elimination - Audit and remove  
**Objective:** Audit and remove static data dependency from production code.

---

## Executive Summary

**STATUS:** ⚠️ CRITICAL - STATIC DATA DEPENDENCY FOUND

Static entity data is currently used throughout the PREDATOR UI as a fallback mechanism. This violates production requirements (GATE-STATIC-01). The static data must be removed and replaced with real API queries.

---

## Static Data Audit

### Primary Static Data Source

**File:** `src/osintData.ts`  
**Export:** `OSINT_ENTITIES` (array of `OsintEntity`)  
**Size:** 6 entities (including test entity 3111724753)  
**Purpose:** Fallback entity data for UI display

### Static Entity List

| ID | Name | Code | Type | Status | Risk Score |
|----|------|------|------|--------|------------|
| kizyma-official | Кізима Дмитро Миколайович | 3111724753 | person | ACTIVE | 0 |
| comp-fop | ФОП Кізима Дмитро Миколайович | 3111724753 | company | ACTIVE | 10 |
| comp-1 | ТОВ 'СпецТехПостач' | 38294012 | company | SANCTIONED | 94 |
| person-1 | Коваленко Ігор Вікторович |  2938401923 | person | SUSPICIOUS | 82 |
| wallet-1 | BTC Wallet / Node | BTC-TRX-02 | cryptowallet | SUSPICIOUS | 89 |
| person-kizima | Кізима Дмитро Миколайович | 3111724753 | person | ACTIVE | 0 |

**CRITICAL:** Test entity 3111724753 is hardcoded in static data (2 entries).

---

## Usage Analysis

### Files Importing OSINT_ENTITIES

| File | Usage Count | Purpose |
|------|-------------|---------|
| src/App.tsx | 6 | Entity list, search fallback, entity selection |
| src/components/AnalyticsDashboard.tsx | 2 | Recent searches display |
| src/components/DashboardView.tsx | 9 | Risk heatmap, ticker, widgets |
| src/components/InspectorPanel.tsx | 3 | Relationship resolution |
| src/components/InvestigationSandbox.tsx | 5 | Graph visualization |
| src/components/LiveAnalyticalCenter.tsx | 5 | Entity selection, search |
| src/components/MapsTab.tsx | 3 | Map markers |
| src/components/OsintWorkbench.tsx | 5 | Entity display |
| src/osintData.ts | 3 | Export definition |

**Total:** 41 usages across 9 files

---

## Critical Usage Patterns

### 1. Search Fallback (src/App.tsx)

```typescript
const matched =
  (window as any).OSINT_ENTITIES ||
  (typeof OSINT_ENTITIES !== "undefined" ? OSINT_ENTITIES : []).find(
    (ent: any) =>
      ent.name.toLowerCase().includes(queryLower) ||
      ent.code.includes(queryLower),
```

**Problem:** Search falls back to static data when API returns no results.

**Impact:** User sees static entity instead of "NOT_FOUND" message.

---

### 2. Entity Selection (src/App.tsx)

```typescript
const [entitiesList, setEntitiesList] = useState<OsintEntity[]>(OSINT_ENTITIES);
const [selectedEntity, setSelectedEntity] = useState<OsintEntity | null>(
  OSINT_ENTITIES[0] || null,
);
```

**Problem:** Initial entity loaded from static data.

**Impact:** UI shows static entity on load instead of empty state.

---

### 3. Search Suggestions (src/components/LiveAnalyticalCenter.tsx)

```typescript
const matched = OSINT_ENTITIES.filter(
  (e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.code.includes(searchQuery),
```

**Problem:** Search suggestions populated from static data.

**Impact:** User sees static entities in autocomplete.

---

### 4. Dynamic Entity Generation (src/osintData.ts)

```typescript
export function generateDynamicEntity(rawQuery: string): OsintEntity {
  // Generates fake entity with placeholder data
  return {
    id: 'person-' + (extractedCode || 'dynamic'),
    type: 'person',
    name: query,
    code: extractedCode || "НЕВІДОМО_ПОТРЕБУЄ_РНОКПП",
    // ... placeholder fields
  };
}
```

**Problem:** Generates fake entity data when no match found.

**Impact:** User sees fake entity instead of "NOT_FOUND" message.

---

### 5. Entity Resolution (src/osintData.ts)

```typescript
export function getOrCreateEntityForQuery(rawQuery: string, existingList: OsintEntity[] = OSINT_ENTITIES): OsintEntity {
  const found = existingList.find(e => {
    // Search logic
  });
  if (found) return found;
  return generateDynamicEntity(rawQuery);
}
```

**Problem:** Falls back to static data, then generates fake entity.

**Impact:** Never returns "NOT_FOUND" - always returns some entity.

---

## Production Rule Violations

### GATE-STATIC-01: No Static Production Entity

**Status:** ❌ FAILED

**Evidence:**
- Static data used in 9 files
- Test entity 3111724753 hardcoded
- Search fallback to static data
- Fake entity generation
- Never returns "NOT_FOUND"

---

## Required Changes

### Phase 4.10.1: Remove Static Data Imports

**Files to Modify:**
1. `src/App.tsx` - Remove OSINT_ENTITIES import and usage
2. `src/components/AnalyticsDashboard.tsx` - Remove OSINT_ENTITIES import
3. `src/components/DashboardView.tsx` - Remove OSINT_ENTITIES import
4. `src/components/InspectorPanel.tsx` - Remove OSINT_ENTITIES import
5. `src/components/InvestigationSandbox.tsx` - Remove OSINT_ENTITIES import
6. `src/components/LiveAnalyticalCenter.tsx` - Remove OSINT_ENTITIES import
7. `src/components/MapsTab.tsx` - Remove OSINT_ENTITIES import
8. `src/components/OsintWorkbench.tsx` - Remove OSINT_ENTITIES import

### Phase 4.10.2: Replace with API Calls

**New Architecture:**
```
User Search
    ↓
API Call to Backend
    ↓
Connector Query
    ↓
Real Source (Tax Cabinet / NAIS XML)
    ↓
PostgreSQL
    ↓
API Response
    ↓
UI Display
```

**Behavior Changes:**
- If entity found: Display with provenance
- If entity not found: Display "NOT_FOUND" message
- If API error: Display error message
- No static fallback
- No fake entity generation

### Phase 4.10.3: Update Search Logic

**Current:**
```typescript
const matched = OSINT_ENTITIES.find(...) || generateDynamicEntity(query);
```

**New:**
```typescript
const response = await api.searchEntity(query);
if (response.found) {
  return response.entity;
} else {
  return { status: 'NOT_FOUND' };
}
```

### Phase 4.10.4: Update Initial State

**Current:**
```typescript
const [selectedEntity, setSelectedEntity] = useState<OsintEntity | null>(
  OSINT_ENTITIES[0] || null,
);
```

**New:**
```typescript
const [selectedEntity, setSelectedEntity] = useState<OsintEntity | null>(null);
```

### Phase 4.10.5: Update Widget Data Sources

**Current:**
```typescript
<RiskAlertTicker entities={OSINT_ENTITIES} />
<D3RiskHeatmapWidget entities={OSINT_ENTITIES} />
```

**New:**
```typescript
<RiskAlertTicker entities={[]} />
<D3RiskHeatmapWidget entities={[]} />
// Or fetch from API
```

---

## Implementation Priority

### HIGH PRIORITY (Critical for Production)

1. **App.tsx** - Remove search fallback and initial state
2. **LiveAnalyticalCenter.tsx** - Remove search suggestions
3. **osintData.ts** - Remove generateDynamicEntity function

### MEDIUM PRIORITY (UI Components)

4. **DashboardView.tsx** - Remove widget static data
5. **InspectorPanel.tsx** - Remove relationship resolution from static
6. **InvestigationSandbox.tsx** - Remove graph static data

### LOW PRIORITY (Display Components)

7. **AnalyticsDashboard.tsx** - Remove recent searches static
8. **MapsTab.tsx** - Remove map markers static
9. **OsintWorkbench.tsx** - Remove entity display static

---

## Testing Requirements

### Test A: Known Entity (3111724753)

**Input:** 3111724753  
**Expected:** Real entity from API with provenance  
**NOT Expected:** Static entity from OSINT_ENTITIES

### Test B: Unknown Entity (9999999999)

**Input:** 9999999999  
**Expected:** "NOT_FOUND" message  
**NOT Expected:** Fake entity from generateDynamicEntity

### Test C: Empty Search

**Input:** Empty string  
**Expected:** Empty state or search prompt  
**NOT Expected:** OSINT_ENTITIES[0]

### Test D: API Error

**Scenario:** API returns error  
**Expected:** Error message  
**NOT Expected:** Static entity fallback

---

## Rollback Plan

If real API is not available, system should:
1. Display "Service Unavailable" message
2. Show "NOT_FOUND" for all searches
3. NOT fall back to static data
4. NOT generate fake entities

---

## Current Status

**Phase 4.10 Status:** ⚠️ IN PROGRESS

**Audit Complete:** ✅ YES  
**Usage Mapped:** ✅ YES  
**Violation Identified:** ✅ YES  
**Removal Plan:** ✅ YES  
**Implementation:** ❌ NOT STARTED  
**Testing:** ❌ NOT STARTED  

---

## Next Steps

1. **Remove static data imports** from all 9 files
2. **Replace with API calls** to backend
3. **Update search logic** to handle NOT_FOUND
4. **Update initial state** to null
5. **Test with real API** (Tax Cabinet)
6. **Verify NOT_FOUND behavior** for unknown entities
7. **Generate STATIC_DATA_ELIMINATION_IMPLEMENTATION_REPORT.md**

---

**Report End**
