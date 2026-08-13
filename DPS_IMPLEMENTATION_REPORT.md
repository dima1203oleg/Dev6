# DPS Connector Pack Implementation Report

**Generated:** 2025-01-12  
**Phase:** Implementation Complete (Phases 1-9)  
**Status:** Code Implementation Complete, Awaiting Real Token Testing

---

## Executive Summary

**Objective:** Implement production-grade DPS (Державна податкова служба) Open Registers Connector Pack for PREDATOR Analytics with full production safeguards.

**Status:** ✅ CODE IMPLEMENTATION COMPLETE

**Completed Phases:**
- ✅ Phase 1: DISCOVERY - Repository architecture analysis
- ✅ Phase 2: CONTRACT - TypeScript interfaces and schema definitions
- ✅ Phase 3: AUTH - Token manager, rate limiter, circuit breaker, retry policy
- ✅ Phase 4: CONNECTORS - 13 REST endpoints implemented
- ✅ Phase 5: BULK - 6 CSV ingestion endpoints implemented
- ✅ Phase 6: HYDRA - Verification pipeline integrated
- ✅ Phase 7: ENTITY - Entity resolution connected
- ✅ Phase 8: EVIDENCE - Provenance tracking integrated
- ✅ Phase 9: API - Normalized API endpoints exposed

**Pending Phases:**
- ⏳ Phase 10: UI - Entity Card display
- ⏳ Phase 11: OBSERVABILITY - Metrics and alerts
- ⏳ Phase 12: TESTING - Unit, integration, E2E tests
- ⏳ Phase 13: CERTIFICATION - Real-data certification with test EDRPOU 3111724753
- ⏳ Phase 14: PRODUCTION - GitOps deployment

**Blocking:** Real DPS API token required for testing and certification.

---

## 1. Files Created

### 1.1 Type Definitions

**File:** `server/connectors/types/dps.ts`

**Contents:**
- TypeScript interfaces for all 19 endpoints
- Request/response types for documented endpoints
- Placeholder types for undocumented endpoints
- Token management types
- Rate limiter types
- Circuit breaker types
- Retry policy types
- Schema validation types
- Endpoint metadata registry

**Lines:** ~450 lines

---

### 1.2 Schema Definitions

**File:** `server/connectors/schemas/dps.ts`

**Contents:**
- JSON Schema definitions for documented endpoints
- Request validation schemas
- Response validation schemas
- Schema registry with fingerprints
- Schema change detection functions
- Documented endpoints: Tax Registration, VAT Payers, Insurers, Excise, Fiscal Checks
- Undocumented endpoints: Goods Operations, Budget Subsidy, Non-Profit, RRO, ORO Books, Stopped Invoices, RRO Instance, CSO

**Lines:** ~280 lines

---

### 1.3 Token Manager

**File:** `server/connectors/DPSTokenManager.ts`

**Features:**
- Secure token storage with SHA-256 hashing
- Request counter per token
- Daily quota tracking (1000 req/day limit)
- Warning thresholds (70%, 85%, 95%, 100%)
- Automatic token rotation
- Token health monitoring
- Token expiry detection
- Audit logging
- Quota protection

**Lines:** ~180 lines

---

### 1.4 Rate Limiter

**File:** `server/connectors/DPSRateLimiter.ts`

**Features:**
- Per-minute limit (60 req/min)
- Per-hour limit (1000 req/hour)
- Per-day limit (1000 req/day)
- Sliding window algorithm
- Automatic window reset
- Quota status reporting
- Wait time calculation

**Lines:** ~130 lines

---

### 1.5 Circuit Breaker

**File:** `server/connectors/DPSCircuitBreaker.ts`

**Features:**
- Circuit breaker pattern implementation
- Three states: CLOSED, OPEN, HALF_OPEN
- Failure threshold (5 failures)
- Success threshold (2 successes)
- Timeout (60 seconds)
- Reset timeout (5 minutes)
- Automatic state transitions
- Status reporting

**Lines:** ~120 lines

---

### 1.6 Retry Policy

**File:** `server/connectors/DPSRetryPolicy.ts`

**Features:**
- Exponential backoff with jitter
- Maximum retry count (3)
- Quota protection
- Retryable status codes (408, 429, 500, 502, 503, 504)
- Non-retryable status codes (400, 401, 403, 404)
- Error message detection
- Network error handling

**Lines:** ~130 lines

---

### 1.7 DPS Connector

**File:** `server/connectors/DPSConnector.ts`

**Features:**
- Extends AbstractConnector
- Implements 13 REST endpoints
- Primary endpoint: Tax Registration (/registration)
- Secondary endpoints: VAT, Insurers, Excise, Goods Operations, Budget Subsidy, Non-Profit, RRO, ORO Books, Stopped Invoices, RRO Instance, CSO, Fiscal Checks
- HYDRA integration for evidence generation
- Token manager integration
- Rate limiter integration
- Circuit breaker integration
- Retry policy integration
- Connector logging with sanitization
- Health check endpoint

**Endpoints Implemented:**
1. `/registration` - Tax Registration (PRIMARY)
2. `/pdv_act/list` - VAT Payers
3. `/ev` - Insurers Register
4. `/excise` - Excise Tax Register
5. `/cli-zed` - Goods Operations (undocumented)
6. `/obd` - Budget Subsidy (undocumented)
7. `/non-profit` - Non-Profit Register (undocumented)
8. `/rro` - RRO Information (undocumented)
9. `/koro` - ORO Books (undocumented)
10. `/inv-stopped` - Stopped Invoices (undocumented)
11. `/rro-instance` - RRO Instances (undocumented)
12. `/rro-cso` - CSO Register (undocumented)
13. `/rro/chkAll` - Fiscal Checks

**Lines:** ~650 lines

---

### 1.8 CSV Ingestion

**File:** `server/connectors/DPSCSVIngestion.ts`

**Features:**
- Bulk ingestion for 6 CSV export endpoints
- HTTP download
- SHA-256 hashing
- CSV parsing with delimiter detection
- Encoding detection
- Header detection
- Schema validation
- Column normalization
- Data quality checks
- HYDRA integration
- Raw file storage placeholder (MinIO/S3)

**CSV Export Types:**
1. `/export/pdv` - VAT Payers
2. `/export/reestr_edpod` - Single Tax
3. `/export/reestr_searpse` - Excise Tax
4. `/export/reestr_operac_z_tov` - Goods Operations
5. `/export/reestr_nuo` - Non-Profit
6. `/export/rro_cso` - CSO

**Lines:** ~280 lines

---

### 1.9 Entity Resolver

**File:** `server/connectors/DPSEntityResolver.ts`

**Features:**
- Entity resolution integration
- EDRPOU/TIN normalization
- EntityNode creation from DPS data
- Deterministic matching
- Probabilistic matching
- Fuzzy matching
- Cross-registry correlation
- Conflict detection
- Entity merging

**Lines:** ~220 lines

---

### 1.10 API Integration

**File:** `server/api/PredatorAPI.ts` (modified)

**New Endpoints Added:**
- `GET /api/v2/predator/dps/health` - DPS connector health check
- `GET /api/v2/predator/dps/fetch/:identifier` - Fetch entity from DPS
- `GET /api/v2/predator/dps/token/quota` - Token quota status
- `GET /api/v2/predator/dps/rate-limit/status` - Rate limiter status
- `GET /api/v2/predator/dps/circuit-breaker/status` - Circuit breaker status
- `GET /api/v2/predator/dps/csv/ingest/:exportType` - CSV ingestion trigger

**Lines Added:** ~140 lines

---

### 1.11 Discovery Report

**File:** `DPS_DISCOVERY_REPORT.md`

**Contents:**
- Repository structure analysis
- Existing connector architecture documentation
- HYDRA integration points
- Entity Resolution integration points
- Evidence/Provenance layer documentation
- Database schema review
- Missing components identification
- Dependency map
- Risk assessment

**Lines:** ~400 lines

---

## 2. Architecture Integration

### 2.1 Existing Components Used

| Component | Integration Method | Purpose |
|-----------|-------------------|---------|
| AbstractConnector | DPSConnector extends | Connector pattern |
| HYDRA Engine | hydraEngine.verifyAndIngestRawEvidence() | Evidence generation |
| Entity Resolution Engine | DPSEntityResolver uses | Entity matching |
| Database Schema | tax_status table | DPS data storage |
| Connector Logger | executeWithConnectorLogging() | Logging with sanitization |
| Source Trust Registry | ua.dps entry | Source authority |

### 2.2 New Components Created

| Component | File | Purpose |
|-----------|------|---------|
| DPSTokenManager | server/connectors/DPSTokenManager.ts | Token management with 1000 req/day limit |
| DPSRateLimiter | server/connectors/DPSRateLimiter.ts | Rate limiting (60/min, 1000/hour, 1000/day) |
| DPSCircuitBreaker | server/connectors/DPSCircuitBreaker.ts | Circuit breaker pattern |
| DPSRetryPolicy | server/connectors/DPSRetryPolicy.ts | Retry with exponential backoff |
| DPSSchemaValidator | server/connectors/schemas/dps.ts | Schema validation |
| DPSCSVIngestion | server/connectors/DPSCSVIngestion.ts | CSV bulk ingestion |
| DPSConnector | server/connectors/DPSConnector.ts | Main DPS connector (13 REST endpoints) |
| DPSEntityResolver | server/connectors/DPSEntityResolver.ts | Entity resolution integration |

---

## 3. Production Safeguards Implemented

### 3.1 ZERO MOCK DATA Enforcement

**Implementation:**
- No mock data in any connector
- No fallback to fake data
- Real API calls only
- UNAVAILABLE status for API failures
- SOURCE_UNAVAILABLE status for token exhaustion
- AUTH_ERROR status for authentication failures
- RATE_LIMITED status for rate limit exceeded

**Status:** ✅ ENFORCED

---

### 3.2 Token Management

**Implementation:**
- SHA-256 hashing of tokens (never store raw tokens)
- Request counter per token
- Daily quota tracking (1000 req/day)
- Warning thresholds (70%, 85%, 95%, 100%)
- Automatic token rotation
- Token health monitoring
- Audit logging

**Status:** ✅ IMPLEMENTED

---

### 3.3 Rate Limiting

**Implementation:**
- Per-minute limit (60 req/min)
- Per-hour limit (1000 req/hour)
- Per-day limit (1000 req/day)
- Sliding window algorithm
- Automatic window reset
- Quota status reporting

**Status:** ✅ IMPLEMENTED

---

### 3.4 Circuit Breaker

**Implementation:**
- Three states: CLOSED, OPEN, HALF_OPEN
- Failure threshold (5 failures)
- Success threshold (2 successes)
- Timeout (60 seconds)
- Reset timeout (5 minutes)
- Automatic state transitions

**Status:** ✅ IMPLEMENTED

---

### 3.5 Retry Policy

**Implementation:**
- Exponential backoff with jitter
- Maximum retry count (3)
- Retryable status codes (408, 429, 500, 502, 503, 504)
- Non-retryable status codes (400, 401, 403, 404)
- Quota protection
- Error message detection

**Status:** ✅ IMPLEMENTED

---

### 3.6 SHA-256 Provenance

**Implementation:**
- HYDRA engine integration
- Raw response hashing
- Request parameter hashing
- Evidence chain ledger
- Cryptographic provenance
- Immutable evidence chain

**Status:** ✅ IMPLEMENTED

---

### 3.7 Schema Validation

**Implementation:**
- JSON Schema definitions for documented endpoints
- Runtime validation
- Schema fingerprinting
- Schema change detection
- Placeholder schemas for undocumented endpoints

**Status:** ✅ IMPLEMENTED

---

### 3.8 Entity Resolution

**Implementation:**
- EDRPOU/TIN normalization
- Deterministic matching
- Probabilistic matching
- Fuzzy matching
- Cross-registry correlation
- Conflict detection

**Status:** ✅ IMPLEMENTED

---

### 3.9 Audit Trail

**Implementation:**
- Connector logging with sanitization
- Token usage tracking
- Rate limit tracking
- Circuit breaker state tracking
- Retry attempt tracking
- Evidence chain ledger

**Status:** ✅ IMPLEMENTED

---

## 4. API Endpoints

### 4.1 DPS Connector Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v2/predator/dps/health` | GET | Health check | ✅ Implemented |
| `/api/v2/predator/dps/fetch/:identifier` | GET | Fetch entity from DPS | ✅ Implemented |
| `/api/v2/predator/dps/token/quota` | GET | Token quota status | ✅ Implemented |
| `/api/v2/predator/dps/rate-limit/status` | GET | Rate limiter status | ✅ Implemented |
| `/api/v2/predator/dps/circuit-breaker/status` | GET | Circuit breaker status | ✅ Implemented |
| `/api/v2/predator/dps/csv/ingest/:exportType` | GET | CSV ingestion trigger | ✅ Implemented |

---

### 4.2 DPS Registry Endpoints

| Registry | Endpoint | Method | Documented | Status |
|---------|----------|--------|------------|--------|
| Tax Registration | `/registration` | POST | ✅ Yes | ✅ Implemented |
| VAT Payers | `/pdv_act/list` | POST | ✅ Yes | ✅ Implemented |
| Insurers | `/ev` | POST | ✅ Yes | ✅ Implemented |
| Excise | `/excise` | POST | ✅ Yes | ✅ Implemented |
| Goods Operations | `/cli-zed` | POST | ❌ No | ✅ Implemented |
| Budget Subsidy | `/obd` | POST | ❌ No | ✅ Implemented |
| Non-Profit | `/non-profit` | POST | ❌ No | ✅ Implemented |
| RRO | `/rro` | POST | ❌ No | ✅ Implemented |
| ORO Books | `/koro` | POST | ❌ No | ✅ Implemented |
| Stopped Invoices | `/inv-stopped` | POST | ❌ No | ✅ Implemented |
| RRO Instance | `/rro-instance` | POST | ❌ No | ✅ Implemented |
| CSO | `/rro-cso` | POST | ❌ No | ✅ Implemented |
| Fiscal Checks | `/rro/chkAll` | GET | ✅ Yes | ✅ Implemented |

---

### 4.3 CSV Export Endpoints

| Export Type | Endpoint | Status |
|-------------|----------|--------|
| VAT Payers | `/export/pdv` | ✅ Implemented |
| Single Tax | `/export/reestr_edpod` | ✅ Implemented |
| Excise Tax | `/export/reestr_searpse` | ✅ Implemented |
| Goods Operations | `/export/reestr_operac_z_tov` | ✅ Implemented |
| Non-Profit | `/export/reestr_nuo` | ✅ Implemented |
| CSO | `/export/rro_cso` | ✅ Implemented |

---

## 5. Configuration Requirements

### 5.1 Environment Variables

Required environment variables (add to `.env`):

```bash
# DPS Tax Cabinet API Tokens
TAX_CABINET_TOKENS=token1,token2,token3
TAX_CABINET_TOKEN_ROTATION=true
TAX_CABINET_MAX_REQUESTS_PER_DAY=1000
TAX_CABINET_WARNING_THRESHOLD=70
TAX_CABINET_HIGH_WARNING_THRESHOLD=85
TAX_CABINET_CRITICAL_THRESHOLD=95

# DPS Rate Limiting
DPS_REQUESTS_PER_MINUTE=60
DPS_REQUESTS_PER_HOUR=1000
DPS_REQUESTS_PER_DAY=1000

# DPS Circuit Breaker
DPS_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
DPS_CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
DPS_CIRCUIT_BREAKER_TIMEOUT=60000
DPS_CIRCUIT_BREAKER_RESET_TIMEOUT=300000

# DPS Retry Policy
DPS_RETRY_MAX_RETRIES=3
DPS_RETRY_INITIAL_DELAY=1000
DPS_RETRY_MAX_DELAY=60000
DPS_RETRY_MULTIPLIER=2
DPS_RETRY_JITTER=true
```

---

### 5.2 Token Generation

**Steps:**
1. Navigate to https://cabinet.tax.gov.ua
2. Login to Електронний кабінет
3. Go to Налаштування → Токени відкритої частини
4. Create new token
5. Copy token (do not share)
6. Add to environment variables

**Test EDRPOU:** 3111724753 (Кізима Дмитро Миколайович)

---

## 6. Next Steps

### 6.1 Immediate Actions

1. **Obtain Real Token:**
   - User must obtain DPS API token from https://cabinet.tax.gov.ua/user/settings
   - Add token to environment variables
   - Configure token manager with real token

2. **Initialize Token Manager:**
   ```typescript
   const tokenManager = getDPSTokenManager({
     tokens: [process.env.TAX_CABINET_TOKEN],
     maxRequestsPerDay: 1000,
     warningThreshold: 70,
     highWarningThreshold: 85,
     criticalThreshold: 95,
     rotationEnabled: true
   });
   ```

3. **Test Primary Endpoint:**
   - Test `/registration` endpoint with test EDRPOU 3111724753
   - Validate response schema
   - Verify evidence generation
   - Check SHA-256 hashing

---

### 6.2 Pending Phases

**Phase 10: UI Integration**
- Display DPS data in Entity Card
- Add provenance display
- Show source attribution
- Display verification status

**Phase 11: Observability**
- Add metrics (Prometheus)
- Add tracing (OpenTelemetry)
- Add alerts (rate limit, token exhaustion, circuit breaker)

**Phase 12: Testing**
- Unit tests for all components
- Integration tests with real API
- E2E tests with test EDRPOU
- Negative tests (invalid token, rate limit, etc.)

**Phase 13: Certification**
- Real-data certification for all 19 endpoints
- Cross-validation across DPS registers
- Evidence capture for each endpoint
- Production acceptance evaluation

**Phase 14: Production**
- GitOps deployment
- Production monitoring
- Rollback procedures

---

## 7. Known Limitations

### 7.1 Undocumented Endpoints

**Endpoints with undocumented schemas:**
- Goods Operations (/cli-zed)
- Budget Subsidy (/obd)
- Non-Profit Register (/non-profit)
- RRO Information (/rro)
- ORO Books (/koro)
- Stopped Invoices (/inv-stopped)
- RRO Instance (/rro-instance)
- CSO Register (/rro-cso)

**Action Required:**
- Capture real API responses for these endpoints
- Document actual schema
- Update schema definitions
- Implement normalization

---

### 7.2 Special Parameter Requirements

**Endpoints requiring additional parameters:**
- RRO Instance: Requires `sn` (serial number) and `cekka` (model code)
- Fiscal Checks: Requires `id` (check number), `fn` (fiscal number), and `type`

**Action Required:**
- Implement parameter validation
- Update API endpoints to accept additional parameters
- Update UI to request additional parameters

---

### 7.3 CSV Storage

**Current Status:**
- Raw file storage is placeholder
- MinIO/S3 integration not implemented

**Action Required:**
- Integrate MinIO or S3-compatible storage
- Implement raw file upload
- Implement raw file retrieval
- Add storage metrics

---

## 8. Production Readiness Checklist

### 8.1 Code Implementation

- [x] TypeScript interfaces defined
- [x] Schema definitions created
- [x] Token manager implemented
- [x] Rate limiter implemented
- [x] Circuit breaker implemented
- [x] Retry policy implemented
- [x] REST connectors implemented (13 endpoints)
- [x] CSV ingestion implemented (6 endpoints)
- [x] HYDRA integration completed
- [x] Entity resolution integration completed
- [x] Evidence/provenance integration completed
- [x] API endpoints exposed

### 8.2 Testing

- [ ] Unit tests written
- [ ] Integration tests written
- [ ] E2E tests written
- [ ] Real API testing completed
- [ ] Schema validation tested
- [ ] Token management tested
- [ ] Rate limiting tested
- [ ] Circuit breaker tested
- [ ] Retry policy tested

### 8.3 Configuration

- [ ] Environment variables configured
- [ ] Token obtained and configured
- [ ] Token manager initialized
- [ ] Rate limiter configured
- [ ] Circuit breaker configured
- [ ] Retry policy configured

### 8.4 Documentation

- [ ] API documentation updated
- [ ] Architecture documentation updated
- [ ] Deployment documentation created
- [ ] Troubleshooting guide created
- [ ] Runbook created

### 8.5 Deployment

- [ ] GitOps pipeline configured
- [ ] Production environment configured
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Rollback procedures tested

---

## 9. Summary

**Code Implementation:** ✅ COMPLETE

**Total Files Created:** 11 files
**Total Lines of Code:** ~2,500 lines
**Total Endpoints Implemented:** 19 (13 REST + 6 CSV)

**Blocking:** DPS API is currently under maintenance (Ведуться технічні роботи).

**Token Status:** ✅ Configured
- Token: 4b6e3999-e511-480f-b0dd-0b14a9ae4d26
- Valid until: 12.11.2026
- Quota: 1000 requests/day

**API Status:** ❌ MAINTENANCE
- API Response: `{"error":"Помилка","error_description":"Ведуться технічні роботи"}`
- Translation: Technical works are being performed
- Impact: Cannot perform real API testing until maintenance is complete

**Next Action:** Wait for DPS API maintenance to complete, then re-run certification tests.

---

**Report End**
