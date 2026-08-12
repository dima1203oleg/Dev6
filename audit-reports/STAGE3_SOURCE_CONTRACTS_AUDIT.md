# ЕТАП 3: Аудит Source Contracts
## Repository: dima1203oleg/Dev6
## Date: 2026-08-09
## Status: IN_PROGRESS

---

## 1. Connector Framework Analysis

### BaseConnector Implementation

**File:** `server/datasources/connectors/BaseConnector.ts`

**Capabilities:**
- ✅ Health check with timeout (10s)
- ✅ Authentication framework (NONE by default)
- ✅ Schema validation
- ✅ Evidence building with hashing
- ✅ Fetch helper with API key injection
- ✅ Request/response hashing
- ✅ Latency tracking

**API Key Injection:**
- `ua.edr` / `ua.court` → NAIS_API_KEY
- `ua.tax` → TAX_GOV_API_KEY
- `ua.nazk` → NAZK_API_TOKEN
- `ua.prozorro` → PROZORRO_API_KEY

**Connector Types:**
1. `CkanConnector` - для CKAN data.gov.ua джерел
2. `DirectApiConnector` - для прямих API

---

### ConnectorFactory Implementation

**File:** `server/datasources/connectors/ConnectorFactory.ts`

**Bootstrap Process:**
- Loads from `FULL_REGISTRY_CATALOG` (170+ sources)
- Filters for `isAutomatic` sources only
- Creates CkanConnector or DirectApiConnector based on metadata
- Registers in connectorMap and registryMap

**Compatibility Validation (5 Stages A-E):**
- **Stage A:** Can we read it? (health check)
- **Stage B:** Can we parse it? (schema validation)
- **Stage C:** Can we normalize it? (follows parsing)
- **Stage D:** Certified? (certificationStatus check)
- **Stage E:** Operational? (latency < 30s)

**Status Types:**
- `COMPATIBLE` - All stages pass + certified
- `PARTIALLY_COMPATIBLE` - Stages A-C pass, not certified
- `LIVE_DEGRADED` - Stage A pass, others fail
- `LIVE_DOWN` - Stage A fail

**Live Probe:**
- Tests with specific code (e.g., EDRPOU)
- Returns: ok, latencyMs, recordsFound, rawSample, error
- Updates compatibility cache

**Batch Probe:**
- Probes all registered connectors with concurrency control
- Default concurrency: 5
- Returns Map of results

**Query All:**
- Queries all live connectors for a specific code
- Supports EDRPOU, IPN, name identifiers
- Concurrency control (default: 8)
- Returns status: OK, NO_DATA, ERROR, TIMEOUT

---

## 2. Source Contract Requirements

### Production-Ready Contract Must Include:

**1. API Documentation:**
- [ ] Official API documentation URL
- [ ] Endpoint specification
- [ ] Request/response examples
- [ ] Error codes reference

**2. Authentication:**
- [ ] Auth method specification (NONE, API_KEY, BEARER, OAUTH2)
- [ ] API key location (header, query param)
- [ ] Key format requirements
- [ ] Token refresh mechanism (if applicable)

**3. Rate Limits:**
- [ ] Requests per minute/hour
- [ ] Burst limits
- [ ] Throttling behavior
- [ ] Rate limit headers (if available)

**4. Schema:**
- [ ] Response schema specification
- [ ] Field types and formats
- [ ] Required vs optional fields
- [ ] Enum values
- [ ] Date/time formats

**5. Health Check:**
- [ ] Dedicated health endpoint
- [ ] Expected response format
- [ ] Timeout expectations
- [ ] Degraded mode indicators

**6. Error Handling:**
- [ ] Error code mapping
- [ ] Retry strategy
- [ ] Backoff behavior
- [ ] Circuit breaker thresholds

**7. Provenance:**
- [ ] Data source attribution
- [ ] Last update timestamp
- [ ] Data freshness indicators
- [ ] Version information

**8. Field Mapping:**
- [ ] Source field → canonical field mapping
- [ ] Transformation rules
- [ ] Validation rules per field
- [ ] Unit conversions

---

## 3. Current Contract Status

### Verified Sources (2/170)

#### 1. HIBP (Have I Been Pwned)
- **Source ID:** hibp
- **API Type:** Official
- **Auth Method:** api_key
- **Status:** VERIFIED
- **Contract Complete:** ✅
- **Health Check:** ✅
- **Rate Limit Documented:** ✅
- **Schema Documented:** ✅

#### 2. crt.sh (Certificate Search)
- **Source ID:** crt_sh
- **API Type:** Official
- **Auth Method:** none
- **Status:** VERIFIED
- **Contract Complete:** ✅
- **Health Check:** ✅
- **Rate Limit Documented:** ✅
- **Schema Documented:** ✅

### Pending Verification (4/170)

#### 3-6. Pending Sources
- **Status:** PENDING_VERIFICATION
- **Contract Complete:** ❌
- **Issues:**
  - No official API documentation
  - No auth method specified
  - No rate limit documentation
  - No schema specification

### Unofficial/Clarity Project (164/170)

- **Status:** REQUIRES_OFFICIAL_CONTRACT
- **Certification Required:** ✅
- **Issues:**
  - Using unofficial/Clarity Project APIs
  - No official API contracts
  - No guaranteed availability
  - No SLA guarantees

---

## 4. Ukrainian Registry Sources

### API Key Requirements

**NAIS API Key:**
- Sources: `ua.edr`, `ua.court`
- Auth Type: Bearer token
- Header: `Authorization: Bearer {NAIS_API_KEY}`
- Status: ⚠️ Requires official contract

**TAX GOV API Key:**
- Sources: `ua.tax`
- Auth Type: API key
- Header: `X-API-KEY: {TAX_GOV_API_KEY}`
- Status: ⚠️ Requires official contract

**NAZK API Token:**
- Sources: `ua.nazk`
- Auth Type: Bearer token
- Header: `Authorization: Bearer {NAZK_API_TOKEN}`
- Status: ⚠️ Requires official contract

**PROZORRO API Key:**
- Sources: `ua.prozorro`
- Auth Type: Bearer token
- Header: `Authorization: Bearer {PROZORRO_API_KEY}`
- Status: ⚠️ Requires official contract

### CKAN Data.gov.ua Sources

**Connector Type:** CkanConnector
**Base URL:** https://data.gov.ua
**API Type:** CKAN
**Auth Type:** NONE
**Update Frequency:** DAILY
**Rate Limit:** 60 req/min

**Issues:**
- ❌ No official API contract for each resource
- ❌ No per-source rate limit documentation
- ❌ No schema validation per resource
- ❌ No field mapping documentation
- ❌ No provenance tracking
- ❌ No error handling specification

---

## 5. Contract Validation Results

### Stage A: Can Read (Health Check)
- **Total Connectors:** 138 (bootstrapped)
- **Tested:** Unknown (requires live probe)
- **Pass Rate:** Unknown
- **Issues:**
  - No systematic health check execution
  - No automated health monitoring
  - No alerting on health failures

### Stage B: Can Parse (Schema Validation)
- **Implementation:** Basic schema validation in BaseConnector
- **Coverage:** Generic (checks for object type)
- **Issues:**
  - No per-source schema definitions
  - No field-level validation
  - No type checking
  - No enum validation

### Stage C: Can Normalize
- **Implementation:** Basic normalization in CkanConnector
- **Coverage:** Generic (rawFields → canonicalFields)
- **Issues:**
  - No field mapping rules
  - No transformation logic
  - No unit conversions
  - No data standardization

### Stage D: Certified
- **Certified:** 2/138 (1.4%)
- **Not Certified:** 136/138 (98.6%)
- **Issues:**
  - No certification process for most sources
  - No official API contracts
  - No legal status verification

### Stage E: Operational
- **Latency Threshold:** 30s
- **Tested:** Unknown
- **Issues:**
  - No systematic latency monitoring
  - No performance baselines
  - No SLO/SLA definitions

---

## 6. Critical Issues

### P0 Blockers

1. **No Official API Contracts (164/170)**
   - Impact: Cannot guarantee data accuracy
   - Risk: Data may be incorrect or outdated
   - Required: Official contracts for all sources

2. **API Keys in Environment Variables**
   - Impact: Security risk, no vault integration
   - Risk: Keys may be exposed
   - Required: Vault/secret manager integration

3. **No Per-Source Schema Validation**
   - Impact: Data may not match expected format
   - Risk: Runtime errors, data corruption
   - Required: Schema definitions for each source

4. **No Field Mapping Documentation**
   - Impact: Cannot trace data provenance
   - Risk: Data attribution unclear
   - Required: Field mapping for each source

5. **No Rate Limit Enforcement**
   - Impact: May exceed API limits
   - Risk: Service disruption, blocking
   - Required: Per-source rate limiting

### P1 Issues

1. **No Systematic Health Monitoring**
   - Impact: Cannot detect source failures
   - Risk: Extended downtime
   - Required: Automated health checks

2. **No Error Handling Specification**
   - Impact: Inconsistent error handling
   - Risk: Poor user experience
   - Required: Error handling strategies

3. **No Provenance Tracking**
   - Impact: Cannot verify data sources
   - Risk: Data integrity issues
   - Required: Provenance metadata

4. **No Performance Monitoring**
   - Impact: Cannot detect performance issues
   - Risk: SLA violations
   - Required: Performance metrics

---

## 7. Next Steps

### Immediate Actions (P0)

1. **Establish Official Contracts**
   - Contact data.gov.ua for official API access
   - Obtain API keys for Ukrainian registries
   - Document rate limits and quotas
   - Get official schema documentation

2. **Implement Schema Validation**
   - Create schema definitions for each source
   - Implement field-level validation
   - Add type checking
   - Validate enum values

3. **Add Field Mapping**
   - Document source → canonical field mapping
   - Implement transformation rules
   - Add unit conversions
   - Validate data consistency

4. **Implement Rate Limiting**
   - Add per-source rate limiting
   - Implement token bucket algorithm
   - Add rate limit headers parsing
   - Implement backoff strategy

5. **Secure API Keys**
   - Migrate to vault/secret manager
   - Implement key rotation
   - Add key usage logging
   - Implement key access controls

### Medium Term (P1)

1. **Health Monitoring**
   - Implement automated health checks
   - Add health status dashboards
   - Implement alerting
   - Add health history tracking

2. **Error Handling**
   - Define error handling strategies
   - Implement retry logic
   - Add circuit breakers
   - Document error codes

3. **Provenance Tracking**
   - Add source attribution
   - Track data freshness
   - Implement version tracking
   - Add audit logs

4. **Performance Monitoring**
   - Implement latency tracking
   - Define performance baselines
   - Add SLO/SLA monitoring
   - Implement performance alerting

---

## 8. Acceptance Criteria

### Source Contract Complete When:

- [ ] Official API documentation available
- [ ] Auth method specified and implemented
- [ ] Rate limits documented and enforced
- [ ] Schema defined and validated
- [ ] Health check implemented and monitored
- [ ] Error handling specified
- [ ] Provenance tracking implemented
- [ ] Field mapping documented
- [ ] Performance monitored
- [ ] Legal status verified

---

## Status Summary

**Total Sources:** 170
**Verified:** 2 (1.2%)
**Pending:** 4 (2.4%)
**Requires Contract:** 164 (96.5%)

**Production Ready:** 2/170 (1.2%)
**Not Production Ready:** 168/170 (98.8%)

**Critical Blockers:** 5
**Medium Priority Issues:** 4

**Estimated Effort:**
- P0: 2-3 weeks
- P1: 3-4 weeks
- Total: 5-7 weeks

---

## Recommendation

**DO NOT DEPLOY TO PRODUCTION** until:

1. All 164 unofficial sources have official contracts OR are explicitly marked as non-production
2. API keys are migrated to vault
3. Schema validation is implemented for all sources
4. Field mapping is documented
5. Rate limiting is enforced
6. Health monitoring is operational

**Alternative:** Deploy with only 2 verified sources (HIBP, crt.sh) and explicitly disable all other sources until certified.
