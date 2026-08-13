# EDR Connector Recommendation

**Generated:** 2025-01-12  
**Task:** Phase 3 - Real EDR Source Strategy Discovery  
**Objective:** Recommend connector implementation for selected EDR data sources.

---

## Executive Summary

**RECOMMENDATION:** Implement three connectors corresponding to the hybrid architecture:

1. **ClarityAPIConnector** - Primary real-time connector
2. **NAISXMLConnector** - Secondary batch ingestion connector
3. **TaxCabinetConnector** - Tertiary enrichment connector

All connectors should extend the existing `AbstractConnector` framework and implement provenance tracking, error handling, and monitoring.

---

## Connector Architecture

### Base Framework

All connectors should extend the existing `AbstractConnector` class defined in `server/connectors/AbstractConnector.ts`.

**Required Interface:**
```typescript
interface AbstractConnector {
  id: string;
  name: string;
  api_documentation_url: string;
  supported_api_version: string;
  authorization_mechanism: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'CERTIFICATE' | 'NONE';
  
  fetch(identifier: string): Promise<ConnectorResponse>;
  health_check(): Promise<ConnectorStatus>;
  get_production_validation(): ProductionValidation;
}
```

**Response Structure:**
```typescript
interface ConnectorResponse {
  status: 'SUCCESS' | 'FAILED';
  normalizedData?: any;
  evidence?: {
    id: string;
    sourceId: string;
    rawPayload: any;
    schemaValid: boolean;
    checksumValid: boolean;
    provenance: {
      sourceId: string;
      requestId: string;
      retrievedAt: string;
      responseHash: string;
      rawRecordReference: string;
    };
  };
  error?: string;
}
```

---

## Connector 1: ClarityAPIConnector

### Purpose
Primary real-time connector for EDR/FOP entity queries.

### Source
- **Provider:** Clarity Project (ТОВ «КЛАРІТІАПП»)
- **Classification:** COMMERCIAL AGGREGATOR
- **API Base URL:** https://clarity-project.info/api
- **Documentation:** https://github.com/the-clarity-project/api

### Implementation Details

**Connector ID:** `clarity_edr`  
**Authorization:** API_KEY (GET parameter `key`)  
**Rate Limiting:** Contract-dependent (implement configurable rate limiter)  
**Cost Tracking:** Monitor request count for cost estimation

**Primary Endpoint:**
```
GET /api/edr.info/{edrpou}?key={API_KEY}
```

**Response Mapping:**
```typescript
interface ClarityEDRResponse {
  edrpou: string;
  name: string;
  short_name?: string;
  status: string;
  registration_date?: string;
  termination_date?: string;
  address?: string;
  kved?: string[];
  kved_description?: string[];
  founders?: Array<{name: string; share?: number}>;
  beneficiaries?: Array<{name: string; share?: number}>;
  director?: string;
  // ... other fields
}
```

**Normalization to PREDATOR Schema:**
```typescript
{
  rnokpp: response.edrpou,
  fullName: response.name,
  shortName: response.short_name,
  status: mapStatus(response.status),
  registrationDate: response.registration_date,
  terminationDate: response.termination_date,
  address: response.address,
  kved: response.kved,
  kvedDescription: response.kved_description,
  founders: normalizeFounders(response.founders),
  beneficiaries: normalizeBeneficiaries(response.beneficiaries),
  director: response.director
}
```

**Provenance Capture:**
```typescript
{
  sourceId: 'clarity_edr',
  requestId: `req-${Date.now()}`,
  retrievedAt: new Date().toISOString(),
  responseHash: sha256(JSON.stringify(rawResponse)),
  rawRecordReference: `https://clarity-project.info/api/edr.info/${identifier}`
}
```

**Error Handling:**
- **401 Unauthorized:** API key invalid - alert immediately
- **429 Too Many Requests:** Rate limit exceeded - implement backoff
- **404 Not Found:** Entity not found - return NOT_FOUND status
- **500 Server Error:** API error - retry with exponential backoff
- **Network Error:** Connection failed - retry with exponential backoff

**Health Check:**
```typescript
async health_check(): Promise<ConnectorStatus> {
  try {
    const testResult = await this.fetch('14360570'); // Known valid EDRPOU (PrivatBank)
    return testResult.status === 'SUCCESS' ? 'CONNECTED' : 'UNREACHABLE';
  } catch {
    return 'UNREACHABLE';
  }
}
```

**Configuration:**
```typescript
{
  CLARITY_API_KEY: string; // Required
  CLARITY_RATE_LIMIT: number; // Requests per minute (default: 60)
  CLARITY_TIMEOUT: number; // Request timeout in ms (default: 10000)
  CLARITY_CACHE_TTL: number; // Cache TTL in seconds (default: 86400)
}
```

**Implementation Effort:** 2-3 days

---

## Connector 2: NAISXMLConnector

### Purpose
Secondary batch ingestion connector for authoritative EDR data backup.

### Source
- **Provider:** Ministry of Justice / ДП «НАІС»
- **Classification:** AUTHORITATIVE
- **File URL:** https://nais.gov.ua/files/general/2026/08/10/20260810082357-16.zip
- **Format:** XML (ZIP compressed)
- **Update Frequency:** Every 5 working days

### Implementation Details

**Connector ID:** `nais_edr_xml`  
**Authorization:** NONE  
**Operation Mode:** BATCH (scheduled ingestion)

**Architecture:**
```
NAISXMLConnector
├── ScheduledDownloader
│   ├── Check for updates (HEAD request)
│   ├── Download file if new
│   ├── Verify SHA256 hash
│   └── Store raw file
├── XMLParser
│   ├── Unzip XML files
│   ├── Stream parse XML (SAX/StAX)
│   ├── Validate schema (XSD)
│   └── Extract entity records
├── Normalizer
│   ├── Map XML fields to schema
│   ├── Handle wartime restrictions
│   ├── Normalize dates/codes
│   └── Entity resolution
└── DatabaseIngestor
    ├── Batch upsert operations
    ├── Insert provenance metadata
    └── Update ingestion run metadata
```

**File Processing:**
```typescript
interface NAISXMLRecord {
  EDRPOU: string;
  NAME: string;
  SHORT_NAME?: string;
  STATUS: string;
  REGISTRATION_DATE?: string;
  ADDRESS?: string;
  KVED?: string;
  KVED_NAME?: string;
  BOSS?: string; // Director
  FOUNDERS?: string;
  BENEFICIARIES?: string;
  // ... other XML fields
}
```

**Normalization to PREDATOR Schema:**
```typescript
{
  rnokpp: record.EDRPOU,
  fullName: record.NAME,
  shortName: record.SHORT_NAME,
  status: mapStatus(record.STATUS),
  registrationDate: record.REGISTRATION_DATE,
  address: record.ADDRESS,
  kved: record.KVED,
  kvedDescription: record.KVED_NAME,
  director: record.BOSS,
  founders: parseFounders(record.FOUNDERS),
  beneficiaries: parseBeneficiaries(record.BENEFICIARIES)
}
```

**Provenance Capture:**
```typescript
{
  sourceId: 'nais_edr_xml',
  requestId: `ingestion-${ingestionRunId}`,
  retrievedAt: fileDownloadTimestamp,
  responseHash: fileSHA256,
  rawRecordReference: fileURL,
  ingestionRunId: ingestionRunId,
  recordId: xmlInternalId
}
```

**Health Check:**
```typescript
async health_check(): Promise<ConnectorStatus> {
  try {
    // Check if last ingestion was successful
    const lastRun = await getLastIngestionRun();
    const lastSuccess = lastRun?.status === 'SUCCESS';
    const lastRunAge = Date.now() - new Date(lastRun?.completedAt).getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (lastSuccess && lastRunAge < maxAge) {
      return 'CONNECTED';
    }
    return 'STALE';
  } catch {
    return 'UNREACHABLE';
  }
}
```

**Configuration:**
```typescript
{
  NAIS_FILE_URL: string; // Default: latest NAIS file URL
  NAIS_CHECK_INTERVAL: number; // Check interval in hours (default: 6)
  NAIS_DOWNLOAD_DIR: string; // Download directory (default: /tmp/nais_edr)
  NAIS_STORAGE_RETENTION: number; // File retention in days (default: 30)
  NAIS_BATCH_SIZE: number; // Batch insert size (default: 1000)
}
```

**Implementation Effort:** 15-22 days

---

## Connector 3: TaxCabinetConnector

### Purpose
Tertiary enrichment connector for tax status data.

### Source
- **Provider:** State Tax Service of Ukraine
- **Classification:** AUTHORITATIVE (tax data only)
- **API Base URL:** https://cabinet.tax.gov.ua/ws/api/public/registers
- **Documentation:** https://cabinet.tax.gov.ua/help/api-registers.html

### Implementation Details

**Connector ID:** `tax_cabinet`  
**Authorization:** TOKEN (self-generated in user settings)  
**Rate Limiting:** 1000 requests/day per token (implement token rotation)

**Primary Endpoints:**
```
GET /ws/api/public/registers/pdv_act/list?code={EDRPOU}&token={TOKEN}
GET /ws/api/public/registers/registration?code={EDRPOU}&token={TOKEN}
GET /ws/api/public/registers/non-profit?code={EDRPOU}&token={TOKEN}
```

**Response Mapping:**
```typescript
interface TaxResponse {
  pdv_status?: string; // VAT payer status
  single_tax_status?: string;
  registration_date?: string;
  tax_authority?: string;
  // ... other tax fields
}
```

**Normalization to PREDATOR Schema:**
```typescript
{
  taxStatus: {
    vatPayer: response.pdv_status,
    singleTaxPayer: response.single_tax_status,
    registrationDate: response.registration_date,
    taxAuthority: response.tax_authority
  }
}
```

**Provenance Capture:**
```typescript
{
  sourceId: 'tax_cabinet',
  requestId: `req-${Date.now()}`,
  retrievedAt: new Date().toISOString(),
  responseHash: sha256(JSON.stringify(rawResponse)),
  rawRecordReference: `https://cabinet.tax.gov.ua/ws/api/public/registers`
}
```

**Token Management:**
```typescript
class TokenManager {
  private tokens: string[] = [];
  private usageCount: Map<string, number> = new Map();
  
  async getToken(): Promise<string> {
    // Find token with usage < 1000
    // If none, generate new token
    // If all at limit, wait for next day
  }
  
  async regenerateToken(): Promise<string> {
    // Call token regeneration endpoint
    // Update usage count
  }
}
```

**Error Handling:**
- **401 Unauthorized:** Token expired - regenerate token
- **429 Too Many Requests:** Rate limit exceeded - rotate to next token
- **404 Not Found:** Entity not found in tax register - return empty tax data
- **500 Server Error:** API error - retry with backoff

**Health Check:**
```typescript
async health_check(): Promise<ConnectorStatus> {
  try {
    const token = await this.tokenManager.getToken();
    const testResult = await this.fetch('14360570', token);
    return testResult.status === 'SUCCESS' ? 'CONNECTED' : 'UNREACHABLE';
  } catch {
    return 'UNREACHABLE';
  }
}
```

**Configuration:**
```typescript
{
  TAX_CABINET_TOKENS: string[]; // List of tokens
  TAX_CABINET_TOKEN_ROTATION: boolean; // Auto-rotate tokens (default: true)
  TAX_CABINET_TIMEOUT: number; // Request timeout in ms (default: 10000)
}
```

**Implementation Effort:** 3-5 days

---

## Connector Factory Integration

### Registration

Update `server/datasources/connectors/ConnectorFactory.ts`:

```typescript
import { ClarityAPIConnector } from './ClarityAPIConnector';
import { NAISXMLConnector } from './NAISXMLConnector';
import { TaxCabinetConnector } from './TaxCabinetConnector';

export class PredatorConnectorFactory {
  private connectors: Map<string, AbstractConnector> = new Map();
  
  constructor() {
    // Register connectors
    this.registerConnector(new ClarityAPIConnector());
    this.registerConnector(new NAISXMLConnector());
    this.registerConnector(new TaxCabinetConnector());
    
    // ... existing connectors
  }
  
  getConnector(id: string): AbstractConnector {
    const connector = this.connectors.get(id);
    if (!connector) {
      throw new Error(`Connector ${id} not found`);
    }
    return connector;
  }
  
  getPrimaryEDRConnector(): AbstractConnector {
    return this.getConnector('clarity_edr');
  }
  
  getSecondaryEDRConnector(): AbstractConnector {
    return this.getConnector('nais_edr_xml');
  }
  
  getTaxConnector(): AbstractConnector {
    return this.getConnector('tax_cabinet');
  }
}
```

### Query Strategy

Implement fallback logic in the API layer:

```typescript
async fetchEntity(identifier: string): Promise<Entity> {
  const primary = factory.getPrimaryEDRConnector();
  const secondary = factory.getSecondaryEDRConnector();
  
  try {
    // Try primary connector
    const result = await primary.fetch(identifier);
    if (result.status === 'SUCCESS') {
      // Enrich with tax data asynchronously
      enrichWithTaxData(identifier, result.normalizedData);
      return result.normalizedData;
    }
  } catch (error) {
    logger.error('Primary connector failed', error);
  }
  
  // Fallback to secondary connector
  try {
    const result = await secondary.fetch(identifier);
    if (result.status === 'SUCCESS') {
      return {
        ...result.normalizedData,
        _stale: true,
        _source: 'nais_edr_xml'
      };
    }
  } catch (error) {
    logger.error('Secondary connector failed', error);
  }
  
  throw new Error('Entity not found');
}
```

---

## Monitoring and Metrics

### Required Metrics

For each connector, track:

**Request Metrics:**
- Total requests
- Successful requests
- Failed requests
- Average response time
- P95 response time
- Rate limit hits

**Cost Metrics (Clarity):**
- Total API calls
- Estimated cost (UAH)
- Cache hit rate

**Ingestion Metrics (NAIS):**
- Last successful ingestion
- Ingestion duration
- Records processed
- Records inserted
- Records updated
- Records failed

**Token Metrics (Tax):**
- Token usage count
- Token regeneration count
- Active tokens

### Alerting

**Critical Alerts:**
- Primary connector down for > 5 minutes
- Secondary ingestion failed
- Tax token rotation failed
- Cost threshold exceeded

**Warning Alerts:**
- High error rate (> 5%)
- Slow response time (> 2s P95)
- Cache hit rate low (< 50%)

---

## Testing Strategy

### Unit Tests

- Mock API responses
- Test normalization logic
- Test error handling
- Test provenance capture

### Integration Tests

- Test against real API (with test keys)
- Test with known entity (3111724753)
- Test failover logic
- Test caching behavior

### Load Tests

- Test rate limit handling
- Test concurrent requests
- Test batch ingestion performance

---

## Deployment Strategy

### Phase 1: ClarityAPIConnector (Week 1-2)
1. Implement connector
2. Register in factory
3. Add configuration
4. Deploy to staging
5. Test with demo API key
6. Monitor for 1 week
7. Deploy to production

### Phase 2: TaxCabinetConnector (Week 3)
1. Implement connector
2. Register in factory
3. Add token management
4. Deploy to staging
5. Test with real tokens
6. Deploy to production

### Phase 3: NAISXMLConnector (Week 4-7)
1. Implement downloader
2. Implement XML parser
3. Implement normalizer
4. Implement database ingestor
5. Deploy to staging
6. Perform initial full load
7. Monitor for 1 week
8. Deploy to production

---

## Summary

**Total Implementation Effort:** 20-30 days  
**Primary Connector:** ClarityAPIConnector (2-3 days)  
**Secondary Connector:** NAISXMLConnector (15-22 days)  
**Tertiary Connector:** TaxCabinetConnector (3-5 days)

**Recommendation:** Implement in phases, starting with ClarityAPIConnector for immediate real-time capability, followed by TaxCabinetConnector for enrichment, then NAISXMLConnector for authoritative backup.

---

**Report End**
