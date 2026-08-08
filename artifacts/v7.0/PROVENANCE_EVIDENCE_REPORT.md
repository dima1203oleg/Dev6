# PREDATOR v7.0 Provenance & Evidence Report
MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0

## Provenance System Overview

**Location**: `core/provenance/ProvenanceEngine.ts`
**Purpose**: Track complete data lineage from source to card
**Status**: IMPLEMENTED

## Provenance Fields

### FieldProvenance Interface

```typescript
export interface FieldProvenance {
  // Source Information
  source_id: string;
  source_name: string;
  source_url: string;
  
  // Version Tracking (7 fields per specification)
  source_version: string;
  schema_version: string;
  parser_version: string;
  mapping_version: string;
  normalizer_version: string;
  entity_resolution_version: string;
  card_contract_version: string;
  
  // Temporal Information
  source_timestamp: string;
  retrieved_at: string;
  
  // Verification
  verification_status: 'FACT' | 'DERIVED' | 'HYPOTHESIS' | 'UNKNOWN' | 'CONFLICTED';
  confidence: number;
  
  // Lineage
  transformation_steps: string[];
  source_field_name?: string;
  intermediate_values?: any[];
}
```

## Evidence Table Structure

```sql
CREATE TABLE evidence (
  id SERIAL PRIMARY KEY,
  evidence_id VARCHAR(255) UNIQUE NOT NULL,
  source_id VARCHAR(255),
  dataset_id VARCHAR(255),
  resource_id VARCHAR(255),
  record_id VARCHAR(255),
  fact_id VARCHAR(255),
  retrieved_at TIMESTAMP NOT NULL,
  published_at TIMESTAMP,
  source_url TEXT,
  
  -- Version Tracking (7 fields)
  source_version VARCHAR(50),
  schema_version VARCHAR(50),
  parser_version VARCHAR(50),
  mapping_version VARCHAR(50),
  normalizer_version VARCHAR(50),
  entity_resolution_version VARCHAR(50),
  card_contract_version VARCHAR(50),
  
  verification_status VARCHAR(50),
  confidence DECIMAL(5,4),
  raw_document JSONB,
  metadata JSONB
);
```

## Provenance Tracking Pipeline

### Stage 1: Source Capture
- **Component**: `ProductionIngestionEngine`
- **Fields Captured**:
  - `source_id`: Source identifier
  - `source_url`: Original URL
  - `source_timestamp`: Publication timestamp
  - `source_version`: Source version identifier
  - `retrieved_at`: Retrieval timestamp
  - `raw_document`: Raw source data

### Stage 2: Schema Validation
- **Component**: `SchemaAnalyzer`
- **Fields Captured**:
  - `schema_version`: Schema version used for validation
  - Verification status updated based on schema compliance

### Stage 3: Parsing
- **Component**: `BaseConnector.parse()`
- **Fields Captured**:
  - `parser_version`: Parser version identifier
  - Transformation steps recorded
  - Intermediate values stored

### Stage 4: Mapping
- **Component**: `FactNormalizer`
- **Fields Captured**:
  - `mapping_version`: Mapping rules version
  - `source_field_name`: Original field name
  - Field-to-field mapping recorded

### Stage 5: Normalization
- **Component**: `FactNormalizer.normalize()`
- **Fields Captured**:
  - `normalizer_version`: Normalizer version
  - Transformation steps (case normalization, trim, etc.)
  - Confidence calculated

### Stage 6: Entity Resolution
- **Component**: `EntityResolutionEngine`
- **Fields Captured**:
  - `entity_resolution_version`: Resolution algorithm version
  - Match reason recorded
  - Matched identifiers tracked

### Stage 7: Card Generation
- **Component**: `CardContract`
- **Fields Captured**:
  - `card_contract_version`: Contract version used
  - Validation status per field
  - Final confidence calculated

## Provenance Engine Methods

### createEnvelope()
```typescript
createEnvelope(
  sourceId: string,
  sourceUrl: string,
  data: any,
  versions: {
    source_version: string;
    schema_version: string;
    parser_version: string;
    mapping_version: string;
    normalizer_version: string;
    entity_resolution_version: string;
    card_contract_version: string;
  }
): DataEnvelope
```
Creates a data envelope with full provenance metadata.

### trackField()
```typescript
trackField(
  fieldName: string,
  value: any,
  source: string,
  transformations: string[]
): FieldProvenance
```
Tracks provenance for a specific field.

### verifyField()
```typescript
verifyField(
  provenance: FieldProvenance,
  verificationMethod: string
): VerificationResult
```
Verifies field provenance against source.

## Evidence Repository

### EvidenceRepository Methods

```typescript
class EvidenceRepository {
  create(evidence: Evidence): Promise<Evidence>
  findById(evidenceId: string): Promise<Evidence | null>
  findByRecordId(recordId: string): Promise<Evidence[]>
  findByDatasetId(datasetId: string): Promise<Evidence[]>
  findBySourceId(sourceId: string): Promise<Evidence[]>
  update(evidenceId: string, data: Partial<Evidence>): Promise<Evidence>
  delete(evidenceId: string): Promise<boolean>
  search(criteria: EvidenceSearchCriteria): Promise<Evidence[]>
}
```

## Verification Status Values

| Status | Description | Use Case |
|--------|-------------|----------|
| FACT | Directly from source with high confidence | Official government data |
| DERIVED | Calculated from other fields | Computed values |
| HYPOTHESIS | Inferred from patterns | Predicted values |
| UNKNOWN | Source unclear or missing | Unverified data |
| CONFLICTED | Conflicting sources | Data quality issues |

## Confidence Scoring

### Confidence Calculation Formula
```
confidence = base_confidence * source_reliability * verification_score
```

### Base Confidence Levels
- Official government source: 0.95
- Verified third-party: 0.85
- Unverified source: 0.70
- Derived calculation: 0.60
- Hypothesis: 0.40

### Verification Score Factors
- Schema compliance: +0.10
- Format validation: +0.05
- Cross-source verification: +0.15
- Recency: +0.05

## Transformation Tracking

### Common Transformations
1. **Case Normalization**: `UPPER → lower → Title`
2. **Trim**: Remove leading/trailing whitespace
3. **Date Format**: `DD.MM.YYYY → YYYY-MM-DD`
4. **Number Format**: `1,234.56 → 1234.56`
5. **Currency**: `UAH → USD` (with conversion rate)
6. **Name Normalization**: `First Last → Last, First`
7. **Address Normalization**: Standardize address components

### Transformation Example
```typescript
{
  field_name: 'company_name',
  original_value: 'ПРИВАТНЕ ПІДПРИЄМСТВО "ТЕСТ"',
  transformations: [
    'trim',
    'case_normalize',
    'remove_quotes',
    'translate_to_english'
  ],
  intermediate_values: [
    'ПРИВАТНЕ ПІДПРИЄМСТВО "ТЕСТ"',
    'приватне підприємство "тест"',
    'приватне підприємство тест',
    'private enterprise test'
  ],
  final_value: 'Private Enterprise Test'
}
```

## Field-Level Provenance

### Example: EDRPOU Field
```typescript
{
  field_name: 'edrpou',
  field_value: '19007752',
  source_id: 'data-gov-ua-edr',
  source_url: 'https://data.gov.ua/dataset/...',
  source_timestamp: '2025-01-08T12:00:00Z',
  retrieved_at: '2025-01-09T10:30:00Z',
  
  source_version: 'v1.0',
  schema_version: 'edr-v2.1',
  parser_version: 'parser-v1.3',
  mapping_version: 'mapping-v1.0',
  normalizer_version: 'norm-v1.2',
  entity_resolution_version: 'er-v1.0',
  card_contract_version: 'contract-v1.0',
  
  verification_status: 'FACT',
  confidence: 0.98,
  
  transformation_steps: ['trim', 'validate_format'],
  source_field_name: 'code',
  intermediate_values: [' 19007752 ', '19007752']
}
```

## Card Field Provenance API

### Endpoint
```
GET /api/v2/predator/cards/:cardId/fields/:fieldName/provenance
```

### Response
```json
{
  "field_name": "edrpou",
  "field_value": "19007752",
  "provenance": {
    "source_id": "data-gov-ua-edr",
    "source_name": "Ukrainian EDR",
    "source_url": "https://data.gov.ua/...",
    "source_version": "v1.0",
    "schema_version": "edr-v2.1",
    "parser_version": "parser-v1.3",
    "mapping_version": "mapping-v1.0",
    "normalizer_version": "norm-v1.2",
    "entity_resolution_version": "er-v1.0",
    "card_contract_version": "contract-v1.0",
    "source_timestamp": "2025-01-08T12:00:00Z",
    "retrieved_at": "2025-01-09T10:30:00Z",
    "verification_status": "FACT",
    "confidence": 0.98,
    "transformation_steps": ["trim", "validate_format"],
    "source_field_name": "code"
  }
}
```

## Evidence Chain

### Complete Evidence Chain Example
```
Source (data.gov.ua EDR API)
  ↓ source_version: v1.0
  ↓ retrieved_at: 2025-01-09T10:30:00Z
Schema Validation
  ↓ schema_version: edr-v2.1
  ↓ status: VALID
Parser
  ↓ parser_version: parser-v1.3
  ↓ transformation: JSON parse
Mapping
  ↓ mapping_version: mapping-v1.0
  ↓ mapping: code → edrpou
Normalizer
  ↓ normalizer_version: norm-v1.2
  ↓ transformation: trim, validate
Entity Resolution
  ↓ entity_resolution_version: er-v1.0
  ↓ match: exact EDRPOU match
Card Contract
  ↓ card_contract_version: contract-v1.0
  ↓ validation: PASS
Card Field
  ↓ final_value: 19007752
  ↓ confidence: 0.98
```

## Compliance with v7.0 Specification

✅ All 7 version fields implemented
✅ Source information captured
✅ Temporal information tracked
✅ Verification status with 5 values
✅ Confidence scoring
✅ Transformation tracking
✅ Field-level provenance
✅ Evidence repository with CRUD
✅ Provenance API endpoint
✅ Evidence chain visualization

## Conclusion

The PREDATOR v7.0 provenance and evidence system is complete with full version tracking across all 7 pipeline stages. The system provides complete data lineage from source to card with field-level provenance, confidence scoring, and transformation tracking. All components are implemented and ready for production use.
