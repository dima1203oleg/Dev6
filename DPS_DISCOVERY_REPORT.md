# DPS Integration Discovery Report

**Generated:** 2025-01-12  
**Phase:** PHASE 1 - DISCOVERY  
**Task:** Repository Architecture Analysis for DPS Connector Pack Implementation

---

## Executive Summary

**Objective:** Analyze existing PREDATOR Analytics architecture to determine integration points for DPS (Державна податкова служба) Open Registers Connector Pack.

**Status:** ✅ DISCOVERY COMPLETE

**Key Findings:**
- Existing connector architecture is production-ready with AbstractConnector pattern
- HYDRA Verified Data Engine already implements evidence provenance, SHA-256 hashing, contradiction detection
- Entity Resolution Engine supports deterministic, probabilistic, and fuzzy matching
- Database schema supports entities, evidence, provenance, contradictions
- Connector logging with sanitization already implemented
- Source trust registry already includes `ua.dps` source

**Integration Strategy:** Extend existing architecture rather than create parallel systems.

---

## 1. Repository Structure

```
/Users/dima1203/Downloads/predator8/
├── server/
│   ├── connectors/              # Connector implementations
│   │   ├── AbstractConnector.ts
│   │   ├── FOPConnector.ts
│   │   ├── CourtConnector.ts
│   │   ├── SanctionsConnector.ts
│   │   ├── ProzorroConnector.ts
│   │   ├── connectorLogger.ts
│   │   └── sdk.ts
│   ├── services/
│   │   ├── hydraEngine.ts      # HYDRA Verified Data Engine
│   │   ├── EntityResolutionEngine.ts
│   │   ├── IntelligenceOrchestrator.ts
│   │   └── certification/
│   ├── database/
│   │   ├── DatabaseClient.ts
│   │   ├── schema.sql
│   │   └── repositories/
│   ├── api/
│   │   ├── PredatorAPI.ts
│   │   └── FieldProvenanceAPI.ts
│   ├── datasources/
│   │   └── registries/
│   │       └── edr.ts
│   └── routes/
├── src/
│   ├── types/
│   │   ├── hydraEngine.ts
│   │   └── mlip.ts
│   └── components/
└── .env.example
```

---

## 2. Existing Connector Architecture

### 2.1 AbstractConnector Pattern

**File:** `server/connectors/AbstractConnector.ts`

**Interface:**
```typescript
export abstract class AbstractConnector {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly api_documentation_url?: string;
  public abstract readonly supported_api_version?: string;
  public abstract readonly authorization_mechanism?: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'CERTIFICATE' | 'NONE';

  public abstract fetch(identifier: string): Promise<ConnectorResponse>;
  public abstract health_check(): Promise<ConnectorStatus>;
  public abstract get_production_validation(): ProductionValidation;
}
```

**ConnectorStatus Types:**
- `CONNECTED` - API passed real health check
- `CONFIGURED` - Configuration exists but not verified
- `AUTHENTICATION_FAILED` - Credentials invalid/expired
- `UNREACHABLE` - API endpoint not responding
- `API_CONTRACT_UNKNOWN` - API exists but contract not verified
- `DISABLED` - Explicitly disabled
- `MAINTENANCE` - API under maintenance

**ConnectorResponse:**
```typescript
export interface ConnectorResponse {
  status: 'SUCCESS' | 'FAILED' | 'NO_MATCH' | 'UNAVAILABLE';
  evidence?: Evidence;
  normalizedData?: any;
  error?: string;
}
```

**ProductionValidation:**
```typescript
export interface ProductionValidation {
  has_official_api: boolean;
  documentation_url?: string;
  documentation_current: boolean;
  api_version_supported: string;
  authorization_mechanism: string;
  rate_limits_confirmed: boolean;
  tested_with_real_responses: boolean;
  last_validation_date?: string;
  notes?: string;
}
```

**Integration Point:** DPS Connector will extend `AbstractConnector` and implement all abstract methods.

---

### 2.2 FOPConnector Example

**File:** `server/connectors/FOPConnector.ts`

**Key Features:**
- Extends `AbstractConnector`
- Uses `fetchEdrFull` from datasources
- Implements SHA-256 hashing for evidence
- Returns `Evidence` object with provenance
- Handles NO_MATCH with proper evidence
- Health check with test EDRPOU
- Production validation metadata

**Evidence Structure:**
```typescript
evidence: {
  id: `ev-fop-${identifier}-${Date.now()}`,
  sourceId: this.id,
  rawPayload: rawRecord,
  schemaValid: true,
  checksumValid: true,
  provenance: {
    sourceId: this.id,
    requestId: `req-${Date.now()}`,
    retrievedAt: new Date().toISOString(),
    responseHash: hash,
    rawRecordReference: 'https://data.gov.ua'
  }
}
```

**Integration Point:** DPS Connector will follow same pattern for evidence generation.

---

## 3. HYDRA Verified Data Engine

### 3.1 HYDRA Engine

**File:** `server/services/hydraEngine.ts`

**Key Features:**
- Evidence chain ledger with cryptographic hashing
- Source trust registry (already includes `ua.dps`)
- Search plan builder with 10 phases
- Raw evidence ingestion with SHA-256
- Verified fact resolution
- Contradiction detection
- Source authority scoring

**Source Trust Registry:**
```typescript
private sourceTrustRegistry: Map<string, SourceTrust> = new Map([
  ["ua.dps", { 
    source_id: "ua.dps", 
    source_name: "Державна податкова служба України", 
    authority_score: 1.0, 
    authenticity_score: 1.0, 
    freshness_score: 0.96, 
    completeness_score: 0.95, 
    stability_score: 0.98 
  }],
  // ... other sources
]);
```

**Evidence Record:**
```typescript
export interface EvidenceRecord {
  evidence_id: string;
  source_id: string;
  source_record_id: string | null;
  query: string;
  raw_payload_hash: string;
  retrieved_at: string;
  http_status: number;
  content_type: string;
  connector_version: string;
  schema_version: string;
  source_authority: string;
  source_tier: string;
  signature_verified: boolean;
  tls_verified: boolean;
  freshness_status: string;
  validation_status: string;
  evidence_status: FactEvidenceStatus;
}
```

**Evidence Status Types:**
- `VERIFIED` - Official source, high authority
- `CORROBORATED` - Multiple sources agree
- `UNVERIFIED` - Low authority or single source
- `SOURCE_UNAVAILABLE` - API failed
- `CONFLICTED` - Contradiction detected

**Integration Point:** DPS Connector will use `hydraEngine.verifyAndIngestRawEvidence()` for evidence generation.

---

### 3.2 Contradiction Engine

**Features:**
- Detects conflicting values from different sources
- Creates `ContradictionRecord` with severity
- Marks facts as `CONFLICTED`
- Does NOT guess or merge conflicting data

**Contradiction Record:**
```typescript
export interface ContradictionRecord {
  contradiction_id: string;
  entity_id: string;
  attribute: string;
  values: Array<{
    value: any;
    source_id: string;
    evidence_id: string;
    retrieved_at: string;
  }>;
  sources: string[];
  detected_at: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  temporal_resolution: string;
}
```

**Integration Point:** DPS data will be fed into contradiction engine for cross-source validation.

---

## 4. Entity Resolution Engine

### 4.1 EntityResolutionEngine

**File:** `server/services/EntityResolutionEngine.ts`

**Key Features:**
- Jaro-Winkler similarity for names
- Levenshtein distance for fuzzy matching
- Deterministic match on exact identifiers (EDRPOU, taxId, email, etc.)
- Probabilistic match on name + DOB + country
- Fuzzy match for label similarity
- Graph building from query results
- Confidence score calculation
- Node merging

**Deterministic Match:**
```typescript
deterministicMatch(node1: EntityNode, node2: EntityNode): EntityMatchCandidate | null {
  const exactFields = ['edrpou', 'taxId', 'email', 'address', 'ip', 'hash', 'telegramId', 'number'];
  for (const field of exactFields) {
    if (a[field] && b[field] && a[field] === b[field]) {
      return {
        nodeId: node2.id,
        matchScore: 1.0,
        matchType: 'DETERMINISTIC',
        matchedFields: [field],
      };
    }
  }
  return null;
}
```

**Integration Point:** DPS data will use EDRPOU/TIN as primary identifier for deterministic matching.

---

## 5. Database Schema

### 5.1 Schema Overview

**File:** `server/database/schema.sql`

**Key Tables:**
- `sources` - Source tracking
- `datasets` - Dataset tracking
- `resources` - Resource tracking
- `raw_records` - Raw evidence storage
- `entities` - Canonical entities
- `companies` - Company entities with EDRPOU
- `persons` - Person entities with IPN
- `fops` - FOP entities
- `tax_status` - Tax status data
- `evidence` - Evidence records
- `facts` - Verified facts
- `contradictions` - Contradiction records
- `card_instances` - Entity card instances
- `card_fields` - Card field values
- `validation_results` - Validation results
- `incidents` - Incident tracking

### 5.2 Tax Status Table

**Relevant for DPS:**
```sql
CREATE TABLE tax_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id VARCHAR(255) UNIQUE NOT NULL REFERENCES entities(entity_id),
    tax_id VARCHAR(50),
    tax_status VARCHAR(50),
    tax_debt DECIMAL(20,2),
    last_payment_date DATE,
    tax_authority VARCHAR(255),
    tax_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Integration Point:** DPS tax registration data will be stored in `tax_status` table.

---

## 6. Connector Logging

### 6.1 Connector Logger

**File:** `server/connectors/connectorLogger.ts`

**Key Features:**
- Structured logging with sanitization
- Automatic redaction of sensitive fields (token, api_key, secret, etc.)
- Ring buffer for log entries (max 1000)
- Aggregated metrics calculation
- Cloud Logging JSON stdout output
- Request/response tracking with latency

**Sensitive Field Redaction:**
```typescript
const SENSITIVE_KEY_REGEX = /^(authorization|bearer|token|api_?key|sec_?key|secret|password|passwd|auth|credential|cookie|private_?key|jwt|x-api-key)$/i;
```

**Log Entry:**
```typescript
export interface ConnectorLogEntry {
  id: string;
  requestId: string;
  connectorId: string;
  connectorName: string;
  timestamp: string;
  durationMs: number;
  endpoint: string;
  method: string;
  request: { headers?, queryParams?, body? };
  response: { statusCode, success, bodySize?, dataPreview?, error? };
  retryCount?: number;
  isEmulated?: boolean;
}
```

**Integration Point:** DPS Connector will use `executeWithConnectorLogging()` wrapper for all API calls.

---

## 7. API Layer

### 7.1 Predator API

**File:** `server/api/PredatorAPI.ts`

**Key Features:**
- REST API endpoints
- Database queries
- Entity search by EDRPOU
- Field provenance API

**Integration Point:** DPS data will be exposed through existing API endpoints.

---

## 8. Missing Components

### 8.1 Token Manager

**Status:** NOT IMPLEMENTED

**Required:** DPS Token Manager with:
- Secure token storage
- Request counter per token
- Daily quota tracking (1000 req/day)
- Warning thresholds (70%, 85%, 95%, 100%)
- Automatic request blocking
- Token health monitoring
- Token expiry detection
- Audit logging

**Implementation:** New file `server/connectors/DPSTokenManager.ts`

---

### 8.2 Rate Limiter

**Status:** NOT IMPLEMENTED

**Required:** Rate Limiter with:
- Per-minute limit (60 req/min)
- Per-hour limit (1000 req/hour)
- Per-day limit (1000 req/day)
- Token-specific tracking
- Automatic blocking
- Backoff strategy

**Implementation:** New file `server/connectors/DPSRateLimiter.ts`

---

### 8.3 Circuit Breaker

**Status:** NOT IMPLEMENTED

**Required:** Circuit Breaker with:
- Failure threshold (5 failures)
- Success threshold (2 successes)
- Timeout (60 seconds)
- Reset timeout (5 minutes)
- State management (CLOSED, OPEN, HALF-OPEN)

**Implementation:** New file `server/connectors/DPSCircuitBreaker.ts`

---

### 8.4 Retry Policy

**Status:** NOT IMPLEMENTED

**Required:** Retry Policy with:
- Exponential backoff
- Jitter
- Maximum retry count (3)
- Quota protection
- Dangerous request detection
- No retry for 400, 401, 403, 404

**Implementation:** New file `server/connectors/DPSRetryPolicy.ts`

---

### 8.5 Schema Validator

**Status:** NOT IMPLEMENTED

**Required:** Schema Validator with:
- JSON schema definitions for each endpoint
- Runtime validation
- Schema change detection
- Schema fingerprinting

**Implementation:** New file `server/connectors/DPSSchemaValidator.ts`

---

### 8.6 CSV Ingestion Pipeline

**Status:** NOT IMPLEMENTED

**Required:** CSV Ingestion with:
- HTTP download
- SHA-256 hashing
- Raw file storage (MinIO/S3)
- CSV parsing
- Encoding detection
- Header detection
- Schema validation
- Column normalization
- Data quality checks
- Entity resolution
- Batch persistence

**Implementation:** New file `server/connectors/DPSCSVIngestion.ts`

---

## 9. Integration Points Summary

### 9.1 Extend Existing Components

| Component | Integration Method |
|-----------|-------------------|
| AbstractConnector | DPSConnector extends AbstractConnector |
| HYDRA Engine | Use `hydraEngine.verifyAndIngestRawEvidence()` |
| Entity Resolution Engine | Use EDRPOU/TIN for deterministic matching |
| Database Schema | Use `tax_status` table for DPS data |
| Connector Logger | Use `executeWithConnectorLogging()` wrapper |
| Source Trust Registry | Use existing `ua.dps` entry |

### 9.2 Create New Components

| Component | File | Purpose |
|-----------|------|---------|
| DPSTokenManager | `server/connectors/DPSTokenManager.ts` | Token management with 1000 req/day limit |
| DPSRateLimiter | `server/connectors/DPSRateLimiter.ts` | Rate limiting (60/min, 1000/hour, 1000/day) |
| DPSCircuitBreaker | `server/connectors/DPSCircuitBreaker.ts` | Circuit breaker pattern |
| DPSRetryPolicy | `server/connectors/DPSRetryPolicy.ts` | Retry with exponential backoff |
| DPSSchemaValidator | `server/connectors/DPSSchemaValidator.ts` | Schema validation |
| DPSCSVIngestion | `server/connectors/DPSCSVIngestion.ts` | CSV bulk ingestion |
| DPSConnector | `server/connectors/DPSConnector.ts` | Main DPS connector (13 REST endpoints) |
| DPSCSVConnector | `server/connectors/DPSCSVConnector.ts` | CSV connector (6 CSV endpoints) |

---

## 10. Dependency Map

```
DPSConnector (REST)
├── AbstractConnector (extends)
├── DPSTokenManager (uses)
├── DPSRateLimiter (uses)
├── DPSCircuitBreaker (uses)
├── DPSRetryPolicy (uses)
├── DPSSchemaValidator (uses)
├── hydraEngine (uses for evidence)
├── connectorLogger (uses for logging)
└── DatabaseClient (uses for persistence)

DPSCSVConnector (CSV)
├── AbstractConnector (extends)
├── DPSCSVIngestion (uses)
├── DPSSchemaValidator (uses)
├── hydraEngine (uses for evidence)
├── connectorLogger (uses for logging)
└── DatabaseClient (uses for persistence)
```

---

## 11. Risks

### 11.1 Technical Risks

- **Token Exhaustion:** 1000 req/day limit may be insufficient for production load
- **Schema Changes:** DPS API may change response schema without notice
- **Rate Limiting:** Aggressive rate limiting may impact user experience
- **CSV Size:** Full register exports may be very large (GBs)

### 11.2 Mitigation Strategies

- **Token Pool:** Maintain 2-3 tokens to distribute load
- **Schema Fingerprinting:** Detect schema changes automatically
- **Caching:** Implement caching with proper TTL
- **Batch Processing:** Process CSV exports in batches

---

## 12. Next Steps

### Phase 2: CONTRACT
- Create DPS connector contract
- Define TypeScript interfaces for all 19 endpoints
- Create schema definitions

### Phase 3: AUTH
- Implement DPSTokenManager
- Implement DPSRateLimiter
- Implement DPSCircuitBreaker
- Implement DPSRetryPolicy

### Phase 4: CONNECTORS
- Implement DPSConnector (13 REST endpoints)
- Implement DPSCSVConnector (6 CSV endpoints)

### Phase 5: HYDRA
- Connect to HYDRA engine
- Implement evidence generation
- Implement provenance tracking

### Phase 6: ENTITY
- Connect to Entity Resolution Engine
- Implement EDRPOU/TIN matching

### Phase 7: EVIDENCE
- Connect to evidence layer
- Implement SHA-256 hashing
- Implement contradiction detection

### Phase 8: API
- Expose normalized API endpoints
- Update PredatorAPI.ts

### Phase 9: UI
- Update Entity Card components
- Display DPS data sections

### Phase 10: OBSERVABILITY
- Add metrics
- Add tracing
- Add alerts

### Phase 11: TESTING
- Unit tests
- Integration tests
- E2E tests

### Phase 12: CERTIFICATION
- Real-data certification with test EDRPOU 3111724753
- Cross-validation across all DPS registers

### Phase 13: PRODUCTION
- GitOps deployment
- Production validation

---

## Status

**Phase 1: DISCOVERY** - ✅ COMPLETE

**Discovery Completed:**
- ✅ Repository structure analyzed
- ✅ Existing connector architecture documented
- ✅ HYDRA integration points identified
- ✅ Entity Resolution integration points identified
- ✅ Evidence/Provenance integration points identified
- ✅ Database schema reviewed
- ✅ Connector logger reviewed
- ✅ Missing components identified
- ✅ Dependency map created
- ✅ Risks documented

**Ready for Phase 2: CONTRACT**

---

**Report End**
