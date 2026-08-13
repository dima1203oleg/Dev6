# DPS Registry Connector Pack Specification

**Generated:** 2025-01-12  
**Task:** Phase 4.3 - DPS Registry Connector Pack Specification  
**Objective:** Create detailed technical specification for 19 DPS Public Registers connectors.

---

## Executive Summary

**Authority:** State Tax Service of Ukraine (Державна податкова служба України)  
**Base URL:** https://cabinet.tax.gov.ua  
**API Path:** /ws/api/public/registers/  
**Documentation:** https://cabinet.tax.gov.ua/help/api-registers.html

**CRITICAL REQUIREMENTS:**
- ZERO MOCK DATA in production
- Real API only - no fallback to static data
- Token limit: 1000 requests/day per token (auto-cancelled after)
- All responses must be stored with provenance, timestamp, HTTP metadata, SHA-256 hash
- API errors, rate-limit, token cancellation must NOT be masked with mock data

---

## 1. Available Endpoints (19 Total)

### 1.1 REST API Endpoints (13)

| # | Registry | Endpoint | Method | Purpose |
|---|----------|----------|--------|---------|
| 1 | Tax Registration | /registration | POST | Entity tax registration data (PRIMARY for EDR) |
| 2 | Insurers Register | /ev | POST | Insurance data |
| 3 | Single Tax Register | /reestr_edpod | POST | Single tax payers |
| 4 | Excise Tax Register | /excise | POST | Excise tax payers |
| 5 | Goods Operations | /cli-zed | POST | Goods operations entities |
| 6 | Budget Subsidy | /obd | POST | Budget subsidy recipients |
| 7 | Non-Profit Register | /non-profit | POST | Non-profit organizations |
| 8 | RRO Information | /rro | POST | Fiscal register information |
| 9 | ORO Books | /koro | POST | ORO book information |
| 10 | VAT Payers | /pdv_act/list | POST | VAT payer registration |
| 11 | Stopped Invoices | /inv-stopped | POST | Stopped VAT invoices |
| 12 | RRO Instances | /rro-instance | POST | RRO device instances |
| 13 | CSO Register | /rro-cso | POST | CSO register |

### 1.2 CSV Export Endpoints (6)

| # | Registry | Endpoint | Method | Purpose |
|---|----------|----------|--------|---------|
| 14 | VAT Payers CSV | /export/pdv | GET | Full VAT register export |
| 15 | Single Tax CSV | /export/reestr_edpod | GET | Full single tax register export |
| 16 | Excise Tax CSV | /export/reestr_searpse | GET | Full excise tax register export |
| 17 | Goods Operations CSV | /export/reestr_operac_z_tov | GET | Full goods operations export |
| 18 | Non-Profit CSV | /export/reestr_nuo | GET | Full non-profit register export |
| 19 | CSO CSV | /export/rro_cso | GET | Full CSO register export |

---

## 2. Request Schemas

### 2.1 Tax Registration (/registration) - PRIMARY

```json
{
  "tins": "string | null",
  "name": "string | null",
  "token": "string (REQUIRED)"
}
```

**Parameters:**
- `tins`: EDRPOU code (optional)
- `name`: Entity name (optional)
- `token`: Authorization token (REQUIRED)

**Validation:**
- At least one of `tins` or `name` must be provided
- `token` must be non-empty string
- `token` must not be placeholder value

---

### 2.2 VAT Payers (/pdv_act/list)

```json
{
  "kodPdvList": "array | null",
  "tinList": "string | null",
  "name": "string | null",
  "token": "string (REQUIRED)"
}
```

**Parameters:**
- `kodPdvList`: Array of VAT codes (up to 10, optional)
- `tinList`: Space-separated EDRPOU codes (up to 10, optional)
- `name`: Entity name (optional)
- `token`: Authorization token (REQUIRED)

**Validation:**
- `kodPdvList` max length: 10
- `tinList` max codes: 10
- At least one search parameter must be provided

---

### 2.3 Insurers Register (/ev)

```json
{
  "tin": "string | null",
  "name": "string | null",
  "token": "string (REQUIRED)"
}
```

---

### 2.4 Excise Tax Register (/excise)

```json
{
  "tin": "string | null",
  "name": "string | null",
  "nReg": "string | null",
  "token": "string (REQUIRED)"
}
```

---

### 2.5 Goods Operations (/cli-zed)

```json
{
  "tins": "string | null",
  "name": "string | null",
  "kodPdv": "string | null",
  "token": "string (REQUIRED)"
}
```

---

### 2.6 Budget Subsidy (/obd)

```json
{
  "tins": "string | null",
  "name": "string | null",
  "kodPdv": "string | null",
  "token": "string (REQUIRED)"
}
```

---

### 2.7 Non-Profit Register (/non-profit)

```json
{
  "tin": "string | null",
  "name": "string | null",
  "token": "string (REQUIRED)"
}
```

---

### 2.8 RRO Information (/rro)

```json
{
  "tins": "string | null",
  "name": "string | null",
  "nFis": "string | null",
  "token": "string (REQUIRED)"
}
```

---

### 2.9 ORO Books (/koro)

```json
{
  "tins": "string | null",
  "name": "string | null",
  "nFis": "string | null",
  "token": "string (REQUIRED)"
}
```

---

### 2.10 Stopped Invoices (/inv-stopped)

```json
{
  "ipn": "string (REQUIRED)",
  "num": "string | null",
  "crtDate": "string | null",
  "token": "string (REQUIRED)"
}
```

**Validation:**
- `ipn` is REQUIRED
- `crtDate` format: YYYY-MM-DD (if provided)

---

### 2.11 RRO Instances (/rro-instance)

```json
{
  "sn": "string (REQUIRED)",
  "cekka": "string (REQUIRED)",
  "token": "string (REQUIRED)"
}
```

**Validation:**
- `sn` (serial number) is REQUIRED
- `cekka` (model code) is REQUIRED

---

### 2.12 CSO Register (/rro-cso)

```json
{
  "tins": "string (REQUIRED)",
  "cekka": "string | null",
  "token": "string (REQUIRED)"
}
```

**Validation:**
- `tins` (EDRPOU list) is REQUIRED

---

### 2.13 Fiscal Checks (/rro/chkAll)

```json
{
  "id": "string (REQUIRED)",
  "date": "string | null",
  "fn": "string | null",
  "type": "number (REQUIRED)",
  "token": "string (REQUIRED)"
}
```

**Parameters:**
- `id`: Check number (REQUIRED)
- `date`: Date (format YYYY-MM-DD HH:mm:ss, optional)
- `fn`: Fiscal number (optional)
- `type`: 1=Original XML, 2=Signed XML, 3=Text UTF-8 (REQUIRED)

**Validation:**
- `type` must be 1, 2, or 3

---

## 3. Response Schemas

### 3.1 Tax Registration Response (/registration) - PRIMARY

```json
{
  "FULL_NAME": "string",
  "TIN_S": "string",
  "ADRESS": "string",
  "D_REG_STI": "string (DD.MM.YYYY)",
  "N_REG_STI": "string",
  "C_STI_MAIN_NAME": "string",
  "VED_LIC": "number | null",
  "FACE_MODE": "number",
  "C_STAN": "number",
  "D_ZAKR_STI": "string | null",
  "C_KIND": "number",
  "C_CLOSE": "number"
}
```

**Field Mapping:**
- `FULL_NAME` → fullName
- `TIN_S` → rnokpp
- `ADRESS` → address
- `D_REG_STI` → taxRegistrationDate
- `N_REG_STI` → taxRegistrationNumber
- `C_STI_MAIN_NAME` → taxAuthority
- `FACE_MODE` → entityType
- `C_STAN` → taxStatus
- `D_ZAKR_STI` → taxClosureDate
- `C_KIND` → entityKind
- `C_CLOSE` → closureStatus

---

### 3.2 VAT Payers Response (/pdv_act/list)

```json
[
  {
    "kodPdv": "number",
    "tin": "string",
    "name": "string",
    "datReestr": "string (YYYY-MM-DD HH:mm:ss)",
    "datAnul": "string | null",
    "kodPdvs": "string",
    "datTerm": "string | null",
    "dreestrSg": "string | null",
    "datSvd": "string (YYYY-MM-DD HH:mm:ss)",
    "danulSg": "string | null",
    "dpdvSg": "string | null",
    "kodAnul": "string | null",
    "kodPid": "string"
  }
]
```

**Field Mapping:**
- `tin` → rnokpp
- `name` → fullName
- `kodPdv` → vatCode
- `datReestr` → vatRegistrationDate
- `datAnul` → vatCancellationDate
- `kodPid` → vatStatus
- `kodAnul` → vatCancellationReason

---

### 3.3 Insurers Register Response (/ev)

```json
{
  "TIN_S": "string",
  "FULL_NAME": "string",
  "DATE_ACC_ERS": "string (DD.MM.YYYY)",
  "ID_ERS": "string",
  "C_STI_MAIN_NAME": "string",
  "KVED": "string",
  "RCLASS": "string",
  "DATE_DCC_ERS": "string | null",
  "IS_PAYER": "boolean | null"
}
```

---

### 3.4 Excise Tax Register Response (/excise)

```json
{
  "TIN_S": "string",
  "FULL_NAME": "string",
  "DAT_REEST": "string (DD.MM.YYYY)",
  "N_REG": "number",
  "LAST_DATE": "string (DD.MM.YYYY)",
  "DAT_ANUL": "string | null",
  "C_ANUL_NAME": "string | null",
  "FACE_MODE": "number",
  "OZN_P": "string",
  "OZN_S": "string | null"
}
```

---

### 3.5 Fiscal Checks Response (/rro/chkAll)

```json
{
  "check": "string",
  "fn": "string",
  "name": "string | null",
  "addressGo": "string | null",
  "typeGo": "string | null",
  "tins": "string | null",
  "xml": "boolean",
  "sign": "boolean",
  "qr": "string | null",
  "resultCode": "string | null",
  "resultText": "string | null"
}
```

---

### 3.6 Undocumented Response Schemas

**CRITICAL:** For endpoints where response schema is not fully documented in the official documentation:
- `/cli-zed` (Goods Operations)
- `/obd` (Budget Subsidy)
- `/non-profit` (Non-Profit Register)
- `/rro` (RRO Information)
- `/koro` (ORO Books)
- `/rro-instance` (RRO Instances)
- `/rro-cso` (CSO Register)
- `/inv-stopped` (Stopped Invoices)

**Requirement:** Connector must first obtain real response and capture actual schema before implementing normalization.

**Process:**
1. Make test request with real token
2. Capture raw JSON response
3. Document actual fields and types
4. Create schema definition
5. Implement normalization
6. Add to this specification

---

## 4. Token Management

### 4.1 Token Configuration

```bash
TAX_CABINET_TOKENS=["token1", "token2", "token3"]
TAX_CABINET_TOKEN_ROTATION=true
TAX_CABINET_TOKEN_ROTATION_THRESHOLD=900
```

### 4.2 Token Pool Strategy

**Purpose:** Maintain pool of 2-3 tokens to avoid service interruption.

**Implementation:**
```typescript
class TokenManager {
  private tokens: string[] = [];
  private usageCount: Map<string, number> = new Map();
  private lastReset: Map<string, Date> = new Map();
  
  async getToken(): Promise<string> {
    // Find token with usage < 1000
    for (const token of this.tokens) {
      const usage = this.usageCount.get(token) || 0;
      const lastReset = this.lastReset.get(token);
      
      // Reset counter if new day
      if (lastReset && this.isNewDay(lastReset)) {
        this.usageCount.set(token, 0);
        this.lastReset.set(token, new Date());
        return token;
      }
      
      if (usage < 1000) {
        this.usageCount.set(token, usage + 1);
        return token;
      }
    }
    
    // All tokens exhausted
    throw new Error('TAX_CABINET_TOKENS_EXHAUSTED');
  }
  
  private isNewDay(lastReset: Date): boolean {
    const now = new Date();
    return lastReset.getDate() !== now.getDate() ||
           lastReset.getMonth() !== now.getMonth() ||
           lastReset.getFullYear() !== now.getFullYear();
  }
}
```

### 4.3 Token Rotation

**Threshold:** 900 requests (100 requests buffer before limit)

**Behavior:**
- When token reaches 900 requests, log warning
- When token reaches 950 requests, alert monitoring
- When token reaches 1000 requests, mark as exhausted
- Automatically rotate to next available token
- If all tokens exhausted, return UNAVAILABLE status

### 4.4 Token Expiry Handling

**Auto-Cancellation:** Token is automatically cancelled after 1000 requests in one day.

**Detection:**
- HTTP 401 Unauthorized
- Response contains token expiry message

**Recovery:**
- Mark token as exhausted
- Rotate to next token
- Alert user to generate new token
- Do NOT auto-generate (requires manual action in Tax Cabinet UI)

---

## 5. Circuit Breaker & Retry Policy

### 5.1 Circuit Breaker Configuration

```typescript
const circuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 60 seconds
  resetTimeout: 300000, // 5 minutes
};
```

**States:**
- **CLOSED:** Normal operation
- **OPEN:** Circuit open after 5 failures
- **HALF-OPEN:** Testing recovery after timeout

### 5.2 Retry Policy

**Retry Conditions:**
- HTTP 429 (Rate Limited) - with exponential backoff
- HTTP 503 (Service Unavailable) - with exponential backoff
- Network timeout - with exponential backoff

**No Retry For:**
- HTTP 400 (Bad Request) - client error
- HTTP 401 (Unauthorized) - token expired
- HTTP 403 (Forbidden) - permission denied
- HTTP 404 (Not Found) - entity not found

**Backoff Strategy:**
```typescript
const backoffStrategy = {
  initialDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
  maxRetries: 3,
};
```

### 5.3 Dangerous Request Detection

**Never Retry:**
- Write operations (if any)
- Requests that modify state
- Requests with financial impact
- Requests with legal implications

**Detection:**
- Analyze HTTP method (POST/PUT/DELETE)
- Analyze endpoint semantics
- Maintain list of dangerous endpoints

---

## 6. Rate Limit Protection

### 6.1 Rate Limit Configuration

```typescript
const rateLimiterConfig = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  requestsPerDay: 1000,
};
```

### 6.2 Rate Limit Implementation

```typescript
class RateLimiter {
  private requestCount: Map<string, number> = new Map();
  private windowStart: Date = new Date();
  
  async checkRateLimit(token: string): Promise<boolean> {
    const now = new Date();
    const elapsed = now.getTime() - this.windowStart.getTime();
    
    // Reset counter if new day
    if (elapsed > 86400000) {
      this.requestCount.clear();
      this.windowStart = now;
    }
    
    const count = this.requestCount.get(token) || 0;
    
    if (count >= 1000) {
      return false; // Rate limit exceeded
    }
    
    this.requestCount.set(token, count + 1);
    return true;
  }
}
```

### 6.3 Rate Limit Response

**HTTP 429:** Rate limit exceeded

**Behavior:**
- Log warning
- Return UNAVAILABLE status
- Do NOT retry immediately
- Wait for backoff period
- Alert monitoring

---

## 7. Raw Response Storage & SHA-256 Provenance

### 7.1 Raw Response Storage

**Table:** `source_snapshots`

```sql
CREATE TABLE source_snapshots (
  id SERIAL PRIMARY KEY,
  source_id VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  response_hash VARCHAR(64) NOT NULL,
  request_body JSONB,
  response_body JSONB,
  http_status INTEGER NOT NULL,
  response_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  correlation_id VARCHAR(255),
  INDEX idx_source_id (source_id),
  INDEX idx_response_hash (response_hash),
  INDEX idx_timestamp (timestamp)
);
```

### 7.2 SHA-256 Hash Calculation

```typescript
import crypto from 'crypto';

function calculateHash(data: any): string {
  const jsonString = JSON.stringify(data);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}
```

**Hash Fields:**
- `request_hash`: SHA-256 of request body
- `response_hash`: SHA-256 of response body

### 7.3 Provenance Capture

**Table:** `provenance`

```sql
CREATE TABLE provenance (
  id SERIAL PRIMARY KEY,
  entity_id VARCHAR(255) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  field_value TEXT,
  source_id VARCHAR(255) NOT NULL,
  source_record_id VARCHAR(255),
  retrieved_at TIMESTAMP WITH TIME ZONE NOT NULL,
  evidence_hash VARCHAR(64) NOT NULL,
  validation_status VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2),
  INDEX idx_entity_id (entity_id),
  INDEX idx_field_name (field_name),
  INDEX idx_source_id (source_id)
);
```

**Provenance Record:**
```typescript
{
  field: "fullName",
  value: "Кізима Дмитро Миколайович",
  source: "tax_cabinet",
  source_record_id: "3111724753",
  retrieved_at: "2025-01-12T19:00:00Z",
  evidence_hash: "abc123...",
  validation_status: "SOURCE_CONFIRMED",
  confidence: 1.00
}
```

---

## 8. Schema Validation

### 8.1 Schema Definition

**For each endpoint, define expected schema:**

```typescript
const taxRegistrationSchema = {
  type: "object",
  required: ["FULL_NAME", "TIN_S"],
  properties: {
    FULL_NAME: { type: "string" },
    TIN_S: { type: "string", pattern: "^\\d{8,10}$" },
    ADRESS: { type: "string" },
    D_REG_STI: { type: "string", pattern: "^\\d{2}\\.\\d{2}\\.\\d{4}$" },
    N_REG_STI: { type: "string" },
    C_STI_MAIN_NAME: { type: "string" },
    VED_LIC: { type: ["number", "null"] },
    FACE_MODE: { type: "number" },
    C_STAN: { type: "number" },
    D_ZAKR_STI: { type: ["string", "null"] },
    C_KIND: { type: "number" },
    C_CLOSE: { type: "number" }
  }
};
```

### 8.2 Schema Validation

```typescript
import Ajv from 'ajv';

function validateResponse(schema: string, response: any): boolean {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(response);
  
  if (!valid) {
    console.error('Schema validation failed:', validate.errors);
    return false;
  }
  
  return true;
}
```

### 8.3 Validation Failure Handling

**Behavior:**
- Log validation error
- Store raw response anyway
- Mark entity as SCHEMA_VALIDATION_FAILED
- Do NOT use invalid data
- Alert monitoring

---

## 9. Entity Resolution

### 9.1 Entity Resolution Strategy

**Primary Key:** EDRPOU (TIN_S / tin)

**Resolution Logic:**
1. Query by EDRPOU
2. If found, update existing entity
3. If not found, create new entity
4. Merge data from multiple sources
5. Handle conflicts (mark as CONFLICTED)

### 9.2 Cross-Registry Correlation

**Sources to Correlate:**
- Tax Registration (/registration)
- VAT Payers (/pdv_act/list)
- Insurers Register (/ev)
- Excise Tax Register (/excise)
- Non-Profit Register (/non-profit)

**Correlation Fields:**
- EDRPOU (TIN_S / tin)
- Full Name (FULL_NAME / name)
- Address (ADRESS / address)

### 9.3 Conflict Resolution

**Conflict Detection:**
- Different values for same field from different sources
- Different status from different sources
- Different registration dates from different sources

**Conflict Handling:**
- Mark field as CONFLICTED
- Store all values with provenance
- Display conflict in UI
- Require manual resolution

---

## 10. UI Mapping to Entity Card

### 10.1 Entity Card Fields

| UI Field | Source Endpoint | Source Field | Priority |
|----------|-----------------|--------------|----------|
| Full Name | /registration | FULL_NAME | PRIMARY |
| EDRPOU | /registration | TIN_S | PRIMARY |
| Address | /registration | ADRESS | PRIMARY |
| Tax Status | /registration | C_STAN | PRIMARY |
| Tax Authority | /registration | C_STI_MAIN_NAME | SECONDARY |
| Registration Date | /registration | D_REG_STI | SECONDARY |
| VAT Status | /pdv_act/list | kodPid | SECONDARY |
| VAT Code | /pdv_act/list | kodPdv | SECONDARY |
| VAT Registration Date | /pdv_act/list | datReestr | SECONDARY |
| Insurance Status | /ev | IS_PAYER | TERTIARY |
| KVED | /ev | KVED | TERTIARY |

### 10.2 Provenance Display

**For each field, display:**
- Source: tax_cabinet
- Endpoint: /registration
- Retrieved At: timestamp
- Evidence Hash: SHA-256
- Validation Status: SOURCE_CONFIRMED
- Confidence: 1.00

**UI Component:**
```typescript
<FieldProvenance
  field="fullName"
  value="Кізима Дмитро Миколайович"
  source="tax_cabinet"
  endpoint="/registration"
  retrievedAt="2025-01-12T19:00:00Z"
  evidenceHash="abc123..."
  validationStatus="SOURCE_CONFIRMED"
  confidence={1.00}
/>
```

---

## 11. E2E Testing

### 11.1 Test Identifier

**Primary Test EDRPOU:** 3111724753  
**Expected Entity:** Кізима Дмитро Миколайович

### 11.2 Test Matrix

| Endpoint | Test EDRPOU | Expected Result | Status |
|----------|-------------|-----------------|--------|
| /registration | 3111724753 | Entity data or NOT_FOUND | PENDING |
| /pdv_act/list | 3111724753 | VAT data or NOT_FOUND | PENDING |
| /ev | 3111724753 | Insurance data or NOT_FOUND | PENDING |
| /excise | 3111724753 | Excise data or NOT_FOUND | PENDING |
| /non-profit | 3111724753 | Non-profit data or NOT_FOUND | PENDING |
| /rro | 3111724753 | RRO data or NOT_FOUND | PENDING |

### 11.3 Test Execution

**For each endpoint:**
1. Make real API request with test EDRPOU
2. Capture HTTP status, response time, response body
3. Calculate SHA-256 hash of response
4. Store in source_snapshots table
5. Validate response schema
6. Map to entity fields
7. Store provenance
8. Display in UI

**Test Evidence:**
```json
{
  "endpoint": "/registration",
  "request": {"tins": "3111724753", "token": "***"},
  "http_status": 200,
  "response_time_ms": 523,
  "response": {...},
  "response_hash": "abc123...",
  "timestamp": "2025-01-12T19:00:00Z",
  "validation_status": "PASSED"
}
```

---

## 12. ZERO MOCK DATA Enforcement

### 12.1 Production Rule

**CRITICAL:** NO MOCK DATA in production.

**Enforcement:**
- All API calls must be to real endpoints
- No hardcoded responses
- No fallback to static data
- No fake entity generation
- No placeholder data

### 12.2 Development Exception

**Allowed in development only:**
- Test fixtures for unit tests
- Mock data for UI development (explicitly marked)
- Documentation examples

**Requirements:**
- Must be clearly marked as MOCK
- Must not be used in production builds
- Must be excluded from production deployment

### 12.3 Detection

**Static Analysis:**
- Scan code for hardcoded entities
- Scan code for placeholder responses
- Scan code for mock API calls

**Runtime Detection:**
- Detect if API response is from mock
- Detect if static data is used
- Detect if placeholder values are returned

**Alerting:**
- Log warning if mock data detected in production
- Block deployment if mock data found
- Alert monitoring system

---

## 13. UNAVAILABLE Status

### 13.1 UNAVAILABLE Conditions

**Return UNAVAILABLE status when:**
- Token exhausted (1000 requests/day)
- All tokens in pool exhausted
- Circuit breaker OPEN
- Rate limit exceeded
- API returns 503/504
- Network timeout after retries
- Schema validation fails

### 13.2 UNAVAILABLE Behavior

**API Response:**
```json
{
  "status": "UNAVAILABLE",
  "reason": "TOKEN_EXHAUSTED",
  "message": "All Tax Cabinet tokens exhausted. Generate new token in Tax Cabinet UI.",
  "retry_after": "2025-01-13T00:00:00Z"
}
```

**UI Display:**
- Show "Service Unavailable" message
- Show reason for unavailability
- Show retry time (if applicable)
- Do NOT show static entity
- Do NOT show mock data

---

## 14. Audit Trail

### 14.1 Audit Table

```sql
CREATE TABLE audit_trail (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  correlation_id VARCHAR(255),
  user_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  source_id VARCHAR(255),
  endpoint VARCHAR(255),
  request_params JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  INDEX idx_timestamp (timestamp),
  INDEX idx_correlation_id (correlation_id),
  INDEX idx_user_id (user_id)
);
```

### 14.2 Audit Events

**Log for every request:**
- Timestamp
- Correlation ID
- User ID (if available)
- Action (API_CALL, ENTITY_CREATE, ENTITY_UPDATE)
- Source ID (tax_cabinet)
- Endpoint
- Request parameters (redacted token)
- Response status
- Response time
- Error message (if any)

### 14.3 Audit Query

**Example:**
```sql
SELECT * FROM audit_trail
WHERE source_id = 'tax_cabinet'
  AND endpoint = '/registration'
  AND timestamp > NOW() - INTERVAL '1 day'
ORDER BY timestamp DESC;
```

---

## 15. Automatic QA

### 15.1 QA Test EDRPOU

**Test Identifiers:**
- 3111724753 (known entity)
- 9999999999 (unknown entity - should return NOT_FOUND)
- 0000000000 (invalid format - should return error)

### 15.2 QA Test Schedule

**Daily:**
- Test all endpoints with known EDRPOU
- Test all endpoints with unknown EDRPOU
- Test token rotation
- Test rate limit
- Test circuit breaker

**Weekly:**
- Full E2E test suite
- Schema validation test
- Provenance verification test
- Audit trail verification test

### 15.3 QA Failure Handling

**If QA test fails:**
- Alert monitoring system
- Block deployment
- Require manual investigation
- Do NOT auto-deploy

---

## 16. Configuration

### 16.1 Environment Variables

```bash
# Tax Cabinet API Configuration
TAX_CABINET_BASE_URL=https://cabinet.tax.gov.ua/ws/api/public/registers
TAX_CABINET_TOKENS=["token1", "token2", "token3"]
TAX_CABINET_TIMEOUT=10000
TAX_CABINET_TOKEN_ROTATION=true
TAX_CABINET_TOKEN_ROTATION_THRESHOLD=900
TAX_CABINET_RATE_LIMIT_PER_MINUTE=60
TAX_CABINET_RATE_LIMIT_PER_HOUR=1000
TAX_CABINET_RATE_LIMIT_PER_DAY=1000
TAX_CABINET_CACHE_TTL=86400
```

### 16.2 Secret Management

**CRITICAL:** `TAX_CABINET_TOKENS` must be stored in:
- Environment variables (.env files not committed)
- Secret management service (AWS Secrets Manager, HashiCorp Vault)
- CI/CD secret store (GitHub Actions Secrets, GitLab CI Variables)

**NOT stored in:**
- Git repository
- Source code
- React files
- README files
- Test fixtures

---

## 17. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Token manager implementation
- Rate limiter implementation
- Circuit breaker implementation
- Retry policy implementation
- Raw response storage
- SHA-256 hashing
- Audit trail logging

### Phase 2: Primary Endpoints (Week 2)
- /registration (PRIMARY)
- /pdv_act/list
- Schema validation
- Entity resolution
- Provenance capture

### Phase 3: Secondary Endpoints (Week 3)
- /ev
- /excise
- /non-profit
- Schema discovery
- Normalization
- UI mapping

### Phase 4: Tertiary Endpoints (Week 4)
- /cli-zed
- /obd
- /rro
- /koro
- /inv-stopped
- /rro-instance
- /rro-cso
- /rro/chkAll

### Phase 5: CSV Export (Week 5)
- /export/pdv
- /export/reestr_edpod
- /export/reestr_searpse
- /export/reestr_operac_z_tov
- /export/reestr_nuo
- /export/rro_cso
- Batch ingestion pipeline

### Phase 6: Integration & Testing (Week 6)
- UI integration
- E2E testing
- QA automation
- Performance testing
- Security testing

---

## 18. Success Criteria

### 18.1 Technical Success

- All 19 endpoints implemented
- Token management working (1000 req/day limit)
- Circuit breaker working
- Rate limiting working
- Raw response storage working
- SHA-256 provenance working
- Schema validation working
- Entity resolution working
- Cross-registry correlation working
- UI mapping working
- E2E tests passing
- ZERO MOCK DATA in production
- UNAVAILABLE status working
- Audit trail working

### 18.2 Business Success

- Real entity data retrieved from Tax Cabinet API
- Test identifier 3111724753 found and displayed
- Unknown identifier 9999999999 returns NOT_FOUND
- Provenance displayed for all fields
- Static data eliminated
- Production pipeline working end-to-end

---

## 19. Risks & Mitigations

### 19.1 Token Exhaustion

**Risk:** All tokens exhausted, service unavailable

**Mitigation:**
- Maintain pool of 2-3 tokens
- Monitor usage per token
- Alert before exhaustion
- Manual token generation process documented

### 19.2 API Changes

**Risk:** DPS changes API without notice

**Mitigation:**
- Schema validation detects breaking changes
- Circuit breaker prevents cascade failures
- Audit trail tracks API changes
- Regular API documentation review

### 19.3 Rate Limiting

**Risk:** Rate limit exceeded, service blocked

**Mitigation:**
- Rate limiter prevents exceeding limit
- Backoff strategy handles 429 responses
- Monitoring alerts on rate limit approach
- Token rotation distributes load

### 19.4 Schema Changes

**Risk:** Response schema changes, normalization fails

**Mitigation:**
- Schema validation detects changes
- Raw response stored regardless
- Manual review required for schema changes
- Versioned schema definitions

---

## 20. Deliverables

### 20.1 Code Deliverables

- `DPSRegistryConnector.ts` - Main connector class
- `TokenManager.ts` - Token management
- `RateLimiter.ts` - Rate limiting
- `CircuitBreaker.ts` - Circuit breaker
- `SchemaValidator.ts` - Schema validation
- `EntityResolver.ts` - Entity resolution
- `ProvenanceManager.ts` - Provenance capture
- `AuditLogger.ts` - Audit trail logging

### 20.2 Documentation Deliverables

- DPS_REGISTRY_CONNECTOR_PACK_SPEC.md (this document)
- DPS_CONNECTOR_IMPLEMENTATION_REPORT.md
- DPS_ENDPOINT_REFERENCE.md
- DPS_SCHEMA_DEFINITIONS.md
- DPS_QA_TEST_PLAN.md

### 20.3 Test Deliverables

- E2E test suite for all 19 endpoints
- Schema validation tests
- Token management tests
- Rate limiter tests
- Circuit breaker tests
- Provenance verification tests

---

## Status

**Phase 4.3 Status:** ✅ COMPLETE

**Specification Created:** YES  
**19 Endpoints Documented:** YES  
**Request Schemas Defined:** YES  
**Response Schemas Defined:** YES (where documented)  
**Token Management Specified:** YES  
**Circuit Breaker Specified:** YES  
**Rate Limiting Specified:** YES  
**Raw Response Storage Specified:** YES  
**SHA-256 Provenance Specified:** YES  
**Schema Validation Specified:** YES  
**Entity Resolution Specified:** YES  
**UI Mapping Specified:** YES  
**E2E Testing Specified:** YES  
**ZERO MOCK DATA Specified:** YES  
**UNAVAILABLE Status Specified:** YES  
**Audit Trail Specified:** YES  
**Automatic QA Specified:** YES  

---

**Next Phase:** Phase 4.4 - DPS Registry Connector Pack Implementation

**Report End**
