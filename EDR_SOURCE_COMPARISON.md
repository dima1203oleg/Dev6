# EDR Source Comparison

**Generated:** 2025-01-12  
**Task:** Phase 3 - Real EDR Source Strategy Discovery  
**Objective:** Compare candidate EDR data sources for PREDATOR Analytics production pipeline.

---

## Source Classification

**AUTHORITATIVE SOURCE:** Official government register or API maintained by the state authority that is the legal holder of the data.

**PUBLIC MIRROR:** Third-party platform that republishes official data with attribution.

**COMMERCIAL AGGREGATOR:** Paid service that aggregates multiple official sources, adds analytics, and provides unified API.

**SEARCH ENGINE:** Web interface for searching official data without programmatic access.

**STATIC WEB PAGE:** HTML pages without API or structured data access.

---

## Candidate Sources Comparison

| Source | Authority | Identifier Search | Name Search | API | Authentication | Real-time/Batch | Freshness | Rate Limits | Response Format | Provenance | Raw Evidence | Can Test 3111724753 | Cost | Production Suitability | Complexity |
|--------|-----------|-------------------|-------------|-----|----------------|-----------------|-----------|-------------|----------------|------------|--------------|---------------------|------|------------------------|------------|
| **A. NAIS EDR XML (data.gov.ua)** | AUTHORITATIVE | NO (batch) | NO (batch) | NO | NO | BATCH | Every 5 working days | None | XML (ZIP) | YES (file hash) | YES | YES (if downloaded) | FREE | HIGH (batch) | HIGH |
| **B. NAIS EDR API (zqedr-api)** | AUTHORITATIVE | YES | YES | YES | YES (Token) | REAL-TIME | Real-time | Contract | JSON | YES | YES | NO (contract required) | PAID | HIGH (if contract) | MEDIUM |
| **C. usr.minjust.gov.ua** | AUTHORITATIVE | YES | YES | NO | NO | REAL-TIME | Real-time | None | HTML | LIMITED | NO | YES (tested ✓) | FREE | LOW (scraping) | HIGH |
| **D. Clarity Project API** | COMMERCIAL AGGREGATOR | YES | YES | YES | YES (API Key) | REAL-TIME | Real-time | Contract | JSON | YES | YES | YES (tested ✓) | PAID (1.23 UAH/req) | HIGH | LOW |
| **E. OpenDataBot API** | COMMERCIAL AGGREGATOR | YES | YES | YES | YES (API Key) | REAL-TIME | Real-time | Contract | JSON | YES | YES | NO (key required) | PAID | HIGH | LOW |
| **F. YouControl API (YouScore)** | COMMERCIAL AGGREGATOR | YES | YES | YES | YES (API Key) | REAL-TIME | Real-time/Daily | Contract | JSON | YES | YES | NO (key required) | PAID | HIGH | LOW |
| **G. Tax Cabinet API** | AUTHORITATIVE | YES | NO | YES | YES (Token) | REAL-TIME | Real-time | 1000/day | JSON | YES | YES | YES (tax only) | FREE | MEDIUM (tax only) | LOW |

---

## Detailed Source Analysis

### A. NAIS EDR XML (data.gov.ua) - AUTHORITATIVE

**Source:** Ministry of Justice / ДП «НАІС»  
**Classification:** AUTHORITATIVE  
**URL:** https://nais.gov.ua/m/ediniy-derjavniy-reestr-yuridichnih-osib-fizichnih-osib-pidpriemtsiv-ta-gromadskih-formuvan

**File Details:**
- Dataset ID: 16‑UFOPFSU_10.08.2026
- File URL: https://nais.gov.ua/files/general/2026/08/10/20260810082357-16.zip
- File Size: 761 MB (797,786,846 bytes)
- Format: XML compressed with ZIP
- Update Frequency: Every 5 working days
- Last Updated: 10.08.2026
- Data Currency: 10.08.2026

**Content:**
- Legal entities (UO.zip)
- Individual entrepreneurs (FOP.zip)
- Separated units of legal entities
- Founders, beneficiaries, directors
- Registration history

**Wartime Restrictions:**
- Location data not published
- Activity types not published
- Founder/beneficiary addresses not published
- Contact information not published

**Pros:**
- Official authoritative source
- Complete dataset
- Free
- No authentication
- Provenance via file hash
- Structured XML format

**Cons:**
- Not real-time (5-day lag)
- Large file size (761 MB)
- Requires batch ingestion pipeline
- XML parsing complexity
- Wartime field restrictions
- No identifier search capability

**Production Suitability:** HIGH for batch ingestion architecture

---

### B. NAIS EDR API (zqedr-api.nais.gov.ua) - AUTHORITATIVE

**Source:** Ministry of Justice / ДП «НАІС»  
**Classification:** AUTHORITATIVE  
**URL:** https://zqedr-api.nais.gov.ua

**API Details:**
- Endpoint: `/1.0/subjects?code={EDRPOU}`
- Authentication: Token-based
- Documentation: Available on request
- Real-time access

**Pros:**
- Official authoritative source
- Real-time data
- Identifier search
- Name search
- JSON response
- Full EDR data

**Cons:**
- Requires contract with NAIS
- Paid service
- Not publicly accessible without agreement
- Contract-dependent rate limits

**Production Suitability:** HIGH if contract can be obtained

**Test Status:** NOT_TESTED (requires contract)

---

### C. usr.minjust.gov.ua - AUTHORITATIVE (Web Portal)

**Source:** Ministry of Justice / ДП «НАІС»  
**Classification:** SEARCH ENGINE (official web interface)  
**URL:** https://usr.minjust.gov.ua

**Test Results for 3111724753:**
- Status: FOUND
- Entity: КІЗИМА ДМИТРО МИКОЛАЙОВИЧ
- RNOKPP: 3111724753
- State: припинено (terminated)
- Address: ЛЬВІВСЬКА ОБЛ., СТРИЙСЬКИЙ Р-Н, С. УГЕРСЬКО, ВУЛ. ЖИДАЧІВСЬКА, БУД. 12
- Test Date: 2025-01-12
- Test Method: Web interface (requires KEP/digital signature for full access)

**Pros:**
- Official authoritative source
- Free
- No authentication for basic search
- Real-time data
- Verified to find test entity

**Cons:**
- No API access
- HTML response (not structured)
- Web scraping required for automation
- Fragile to UI changes
- KEP required for detailed data
- Not suitable for production automation

**Production Suitability:** LOW (web scraping not recommended)

---

### D. Clarity Project API - COMMERCIAL AGGREGATOR

**Source:** ТОВ «КЛАРІТІ АПП» (ЄДРПОУ 43007203)  
**Classification:** COMMERCIAL AGGREGATOR  
**URL:** https://clarity-project.info

**API Details:**
- Base URL: https://clarity-project.info/api
- Authentication: API Key (GET parameter `key`)
- Cost: From 1.23 UAH per request
- Documentation: https://github.com/the-clarity-project/api
- Endpoints: `edr.info/{edrpou}`, `edr.search`, `fop.bycode`, etc.

**Test Results for 3111724753:**
- Status: FOUND
- Entity: КІЗИМА ДМИТРО МИКОЛАЙОВИЧ
- RNOKPP: 3111724753
- State: припинено (terminated)
- Registration Date: 21.03.2007
- Termination Date: 23.03.2017
- Address: 79038, ЛЬВІВСЬКА область, СТРИЙСЬКИЙ район, село УГЕРСЬКО
- KVED: 33.12, 47.42
- Test Date: 2025-01-12
- Test Method: Web interface (API available with key)

**Pros:**
- Real-time data
- JSON API
- Identifier search
- Name search
- 140+ registers aggregated
- Low implementation complexity
- Provenance support
- Test access available

**Cons:**
- Commercial dependency
- Per-request cost
- Not authoritative (aggregator)
- Requires API key
- Budget dependency

**Production Suitability:** HIGH if budget allows

---

### E. OpenDataBot API - COMMERCIAL AGGREGATOR

**Source:** OpenDataBot  
**Classification:** COMMERCIAL AGGREGATOR  
**URL:** https://opendatabot.ua/en/open/api

**API Details:**
- Authentication: API Key
- Cost: Contract-based
- Documentation: Available after application
- Registries: EDR, ERSR, ERB, ASVP, RRP, DRORM, etc.

**Pros:**
- Real-time data
- JSON API
- Multiple registries
- Identifier search
- Low implementation complexity

**Cons:**
- Commercial dependency
- Contract required
- Not authoritative (aggregator)
- Requires application for access
- Test status unknown

**Production Suitability:** HIGH if budget allows

**Test Status:** NOT_TESTED (requires API key)

---

### F. YouControl API (YouScore) - COMMERCIAL AGGREGATOR

**Source:** YouControl  
**Classification:** COMMERCIAL AGGREGATOR  
**URL:** https://youscore.com.ua

**API Details:**
- Authentication: API Key
- Cost: Contract-based
- Documentation: Swagger available
- Sources: 200+ open data sources
- Real-time: Some registers real-time, others daily

**Pros:**
- Real-time data (most registers)
- JSON API
- 200+ sources
- Advanced analytics
- Low implementation complexity
- Swagger documentation

**Cons:**
- Commercial dependency
- Contract required
- Not authoritative (aggregator)
- Requires application for access
- Budget dependency

**Production Suitability:** HIGH if budget allows

**Test Status:** NOT_TESTED (requires API key)

---

### G. Tax Cabinet API - AUTHORITATIVE (Tax Data Only)

**Source:** State Tax Service of Ukraine  
**Classification:** AUTHORITATIVE  
**URL:** https://cabinet.tax.gov.ua

**API Details:**
- Base URL: https://cabinet.tax.gov.ua/ws/api/public/registers
- Authentication: Token (self-generated in settings)
- Cost: FREE
- Rate Limit: 1000 requests/day per token
- Documentation: https://cabinet.tax.gov.ua/help/api-registers.html

**Available Registers:**
- VAT payer register
- Single tax register
- Excise tax register
- Non-profit organizations
- Tax registration data

**Pros:**
- Official authoritative source
- Free
- JSON API
- Real-time data
- Self-service token generation
- Low implementation complexity

**Cons:**
- Tax data only (not full EDR profile)
- No company name/director data
- 1000 requests/day limit
- Token auto-cancel after 1000 requests

**Production Suitability:** MEDIUM (supplementary tax data only)

**Test Status:** TESTABLE (requires token generation)

---

## Test Evidence Summary

### Test Identifier: 3111724753

| Source | Test Status | Result | Evidence | Timestamp |
|--------|-------------|--------|----------|-----------|
| usr.minjust.gov.ua | TESTED ✓ | FOUND | КІЗИМА ДМИТРО МИКОЛАЙОВИЧ, припинено | 2025-01-12T18:51:00Z |
| Clarity Project (web) | TESTED ✓ | FOUND | КІЗИМА ДМИТРО МИКОЛАЙОВИЧ, припинено, 21.03.2007-23.03.2017 | 2025-01-12T18:51:45Z |
| NAIS EDR XML | NOT TESTED | N/A | Requires download and parsing | - |
| NAIS EDR API | NOT TESTED | N/A | Requires contract | - |
| OpenDataBot API | NOT TESTED | N/A | Requires API key | - |
| YouControl API | NOT TESTED | N/A | Requires API key | - |
| Tax Cabinet API | NOT TESTED | N/A | Tax data only | - |

---

## Production Architecture Options

### Option 1: Batch Ingestion from NAIS XML

**Architecture:**
```
NAIS EDR XML (data.gov.ua)
↓
Scheduled Downloader (every 5 days)
↓
Raw XML File (761 MB)
↓
SHA256 Hash Verification
↓
XML Parser
↓
Schema Validation
↓
Normalization
↓
Entity Resolution
↓
PostgreSQL
↓
Search API
↓
PREDATOR UI
```

**Pros:**
- Free
- Authoritative
- Complete dataset
- No external dependencies
- Provenance via file hash

**Cons:**
- 5-day data lag
- Large file handling
- Initial load complexity
- Storage requirements
- Not real-time

**Suitability:** HIGH for non-real-time use cases

---

### Option 2: Commercial API Integration

**Architecture:**
```
Commercial API (Clarity/OpenDataBot/YouControl)
↓
REST Connector
↓
JSON Response
↓
Provenance Capture
↓
Normalization
↓
PostgreSQL
↓
Search API
↓
PREDATOR UI
```

**Pros:**
- Real-time data
- Low implementation complexity
- Multiple registers
- Advanced analytics (some providers)

**Cons:**
- Ongoing cost
- Commercial dependency
- Budget dependency
- Not authoritative

**Suitability:** HIGH if budget allows

---

### Option 3: Hybrid Approach

**Architecture:**
```
Primary: Commercial API (real-time queries)
Secondary: NAIS XML (batch backup/fallback)
Tertiary: Tax Cabinet API (tax data enrichment)
```

**Pros:**
- Real-time capability
- Authoritative backup
- Cost optimization (cache commercial API results)
- Redundancy

**Cons:**
- Higher complexity
- Still has commercial dependency for real-time
- Multiple integration points

**Suitability:** HIGH for production-grade resilience

---

## Recommendations Summary

**For Real-Time Queries:**
- Commercial API (Clarity Project) - if budget allows
- NAIS EDR API - if contract can be obtained

**For Batch Ingestion:**
- NAIS EDR XML - authoritative, free, complete

**For Supplementary Data:**
- Tax Cabinet API - free, tax status enrichment

**NOT Recommended:**
- usr.minjust.gov.ua - web scraping fragile
- Static data - violates production requirements

---

**Report End**
