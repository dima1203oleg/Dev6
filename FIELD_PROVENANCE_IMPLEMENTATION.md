# Field-Level Provenance Implementation

**Status:** DESIGN PHASE
**Priority:** HIGH
**Impact:** CRITICAL for production certification

## Current State

HYDRA engine provides evidence records with source-level provenance:
- EvidenceRecord: evidence_id, source_id, source_record_id, query, raw_payload_hash, retrieved_at, etc.
- EvidenceChainEntry: cryptographic chain with previous_hash and chain_hash

**GAP:** Field-level provenance is missing. Each field in Entity Cards needs:
- field_name
- field_value
- source
- source_id
- evidence_id
- sha256
- retrieved_at
- confidence
- validation_status

## Proposed Implementation

### 1. FieldProvenance Interface

```typescript
export interface FieldProvenance {
  field_id: string;
  entity_id: string;
  field_name: string;
  field_value: any;
  source_id: string;
  source_name: string;
  evidence_id: string;
  raw_field_hash: string;
  retrieved_at: string;
  confidence: number;
  validation_status: 'VERIFIED' | 'CORROBORATED' | 'CONFLICTED' | 'UNVERIFIED';
  temporal_validity?: {
    valid_from: string | null;
    valid_to: string | null;
  };
}
```

### 2. HYDRA Enhancement

Add field-level provenance extraction to `resolveVerifiedFacts`:

```typescript
public resolveVerifiedFactsWithProvenance(
  entityId: string,
  evidenceRecords: EvidenceRecord[],
  factCandidates: Array<{...}>
): {
  verifiedFacts: VerifiedFact[];
  fieldProvenance: FieldProvenance[];
  contradictions: ContradictionRecord[];
}
```

### 3. Database Schema

Add `field_provenance` table:

```sql
CREATE TABLE field_provenance (
  field_id VARCHAR(255) PRIMARY KEY,
  entity_id VARCHAR(255) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  field_value TEXT,
  source_id VARCHAR(255) NOT NULL,
  source_name VARCHAR(255) NOT NULL,
  evidence_id VARCHAR(255) NOT NULL,
  raw_field_hash VARCHAR(64) NOT NULL,
  retrieved_at TIMESTAMP WITH TIME ZONE NOT NULL,
  confidence DECIMAL(5,4) NOT NULL,
  validation_status VARCHAR(50) NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (entity_id) REFERENCES entities(entity_id),
  FOREIGN KEY (evidence_id) REFERENCES evidence(evidence_id)
);

CREATE INDEX idx_field_provenance_entity ON field_provenance(entity_id);
CREATE INDEX idx_field_provenance_field ON field_provenance(field_name);
CREATE INDEX idx_field_provenance_source ON field_provenance(source_id);
```

### 4. Integration with Entity Cards

Entity Card generation must include field provenance:

```typescript
export interface EntityCardField {
  name: string;
  value: any;
  provenance: FieldProvenance;
  status: 'VERIFIED' | 'PROBABLE' | 'CONFLICTED' | 'UNVERIFIED';
}
```

## Implementation Priority

1. **PHASE 1:** Define FieldProvenance interface and database schema
2. **PHASE 2:** Enhance HYDRA to extract field-level provenance
3. **PHASE 3:** Implement FieldProvenanceRepository
4. **PHASE 4:** Integrate with Entity Card generation
5. **PHASE 5:** Update API to return field provenance
6. **PHASE 6:** Update frontend to display field provenance

## Current Blockers

- Disk space limitation prevents full NAIS import for testing
- DPS upstream maintenance prevents real data testing
- TypeScript errors in frontend demo components (201 errors)

## Next Steps

Given production certification timeline, recommend:
1. Implement field-level provenance schema and interface
2. Integrate with HYDRA engine
3. Test with mock data for verification
4. Real data testing when DPS/NAIS available

---

**Created:** 2026-08-13
**Status:** DESIGN PHASE - AWAITING IMPLEMENTATION
