# EDR Batch Ingestion Feasibility

**Generated:** 2025-01-12  
**Task:** Phase 3 - Real EDR Source Strategy Discovery  
**Objective:** Evaluate feasibility of batch ingestion from NAIS EDR XML files on data.gov.ua.

---

## Executive Summary

**STATUS:** ✅ FEASIBLE with architectural considerations

Batch ingestion from NAIS EDR XML files is technically feasible and provides authoritative, complete EDR data at no cost. However, it requires a significant architectural change from real-time API queries to scheduled batch processing with a 5-day data lag.

---

## Source File Analysis

### File Details

**Dataset:** Єдиний державний реєстр юридичних осіб, фізичних осіб – підприємців та громадських формувань  
**Owner:** Ministry of Justice / ДП «НАІС»  
**Classification:** AUTHORITATIVE

**File URL:** https://nais.gov.ua/files/general/2026/08/10/20260810082357-16.zip  
**File Size:** 761 MB (797,786,846 bytes)  
**Format:** XML compressed with ZIP  
**Update Frequency:** Every 5 working days  
**Last Updated:** 10.08.2026  
**Data Currency:** 10.08.2026

### File Contents

The dataset contains three main XML files:

1. **UO.zip** - Legal Entities (Юридичні особи)
   - Company name
   - Organizational form
   - EDRPOU code
   - Founders (physical and legal persons)
   - Ultimate beneficial owners
   - Management bodies
   - Directors and authorized signatories
   - Separated units
   - Registration history

2. **FOP.zip** - Individual Entrepreneurs (Фізичні особи-підприємці)
   - Full name (surname, name, patronymic)
   - Registration date
   - Registration action number
   - Property manager details
   - Family farm indicator
   - Termination records

3. **Separated Units** - Separated units of foreign legal entities
   - Name
   - Unit type
   - EDRPOU code
   - Director details
   - Parent company information

### Wartime Restrictions

Due to martial law in Ukraine, the following data is **NOT published**:
- Location/address data
- Activity types (KVED)
- Founder/beneficiary addresses
- Contact information
- Physical storage location of registration files

---

## Technical Feasibility

### Download Feasibility

**File Size:** 761 MB  
**Download Time:** ~2-5 minutes on 100 Mbps connection  
**Storage Requirements:** ~2 GB (compressed + uncompressed + processing)  
**Bandwidth:** ~150 MB per update (incremental if delta available)

**Verdict:** ✅ FEASIBLE

### Parsing Feasibility

**Format:** XML  
**Schema:** XSD available (16-ufopfsu_xsd)  
**Parsing Complexity:** MEDIUM  
**Estimated Record Count:** ~3-5 million entities (based on Ukrainian business population)

**Parsing Challenges:**
- Large XML file requires streaming parser (not DOM)
- Ukrainian character encoding (UTF-8)
- Complex nested structures (founders, beneficiaries, history)
- Wartime field restrictions (missing expected fields)

**Verdict:** ✅ FEASIBLE with streaming XML parser

### Database Ingestion Feasibility

**Target:** PostgreSQL  
**Schema:** Existing PREDATOR schema supports EDR data  
**Insert Rate:** ~10,000-50,000 records/second with optimized batch inserts  
**Initial Load Time:** ~1-3 hours for full dataset  
**Incremental Update Time:** ~10-30 minutes

**Storage Requirements:**
- Raw XML: 761 MB
- Uncompressed XML: ~2 GB
- Parsed entities: ~500 MB
- Indexes: ~200 MB
- Total: ~3.5 GB

**Verdict:** ✅ FEASIBLE with existing PostgreSQL infrastructure

---

## Architecture Design

### Proposed Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ NAIS EDR XML (data.gov.ua)                                  │
│ URL: https://nais.gov.ua/files/.../16.zip                   │
│ Update: Every 5 working days                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Scheduled Downloader (Cron Job)                              │
│ Frequency: Every 6 hours (check for updates)                │
│ Action: HEAD request → Compare ETag/Last-Modified           │
│ If new: Download → SHA256 verification                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ File Processor                                               │
│ 1. Unzip XML files                                          │
│ 2. Validate SHA256 hash                                     │
│ 3. Validate XML schema (XSD)                                │
│ 4. Stream parse XML (SAX/StAX)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Normalizer                                                  │
│ 1. Map XML fields to PREDATOR schema                        │
│ 2. Handle wartime field restrictions                       │
│ 3. Normalize dates, codes, names                           │
│ 4. Entity resolution (deduplication)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL Ingestion                                         │
│ 1. Upsert entities (ON CONFLICT UPDATE)                    │
│ 2. Insert raw evidence (XML snippet, hash)                  │
│ 3. Update provenance metadata                               │
│ 4. Rebuild indexes if needed                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Search API (existing)                                       │
│ Query by EDRPOU/RNOKPP                                      │
│ Return normalized entity with provenance                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ PREDATOR UI (existing)                                      │
� Display entity data from PostgreSQL                           │
└─────────────────────────────────────────────────────────────┘
```

### Provenance Strategy

**For each entity record:**
- `source`: "NAIS_EDR_XML"
- `dataset_id`: "16-UFOPFSU-{date}"
- `resource_id`: File URL
- `record_id`: XML internal ID
- `retrieved_at`: File download timestamp
- `evidence_hash`: SHA256 of XML record snippet
- `validation_status`: "VALID" (if schema passes)
- `confidence`: 1.0 (authoritative source)

**For each ingestion run:**
- `ingestion_run_id`: UUID
- `source_file_url`: NAIS file URL
- `source_file_hash`: SHA256 of entire ZIP file
- `source_file_size`: File size in bytes
- `source_file_date`: Last-Modified header
- `ingestion_started_at`: Timestamp
- `ingestion_completed_at`: Timestamp
- `records_processed`: Count
- `records_inserted`: Count
- `records_updated`: Count
- `records_failed`: Count

---

## Implementation Complexity

### Components Required

1. **Scheduled Downloader** (MEDIUM complexity)
   - HTTP client with HEAD request support
   - ETag/Last-Modified comparison
   - File download with retry logic
   - SHA256 calculation
   - Error handling and logging

2. **XML Parser** (MEDIUM complexity)
   - Streaming XML parser (SAX/StAX)
   - XSD schema validation
   - Ukrainian character handling
   - Memory-efficient processing

3. **Normalizer** (HIGH complexity)
   - Field mapping from XML to PREDATOR schema
   - Handling wartime field restrictions
   - Entity resolution and deduplication
   - Address normalization (when available)
   - Name normalization

4. **Database Ingestion** (MEDIUM complexity)
   - Batch upsert operations
   - Transaction management
   - Index optimization
   - Provenance metadata insertion

**Total Complexity:** MEDIUM-HIGH

### Estimated Development Time

- Scheduled Downloader: 2-3 days
- XML Parser: 3-4 days
- Normalizer: 5-7 days
- Database Ingestion: 2-3 days
- Testing & Validation: 3-5 days
- Total: **15-22 days**

---

## Operational Considerations

### Data Freshness

**Update Frequency:** Every 5 working days  
**Maximum Data Lag:** 7 days (including weekends)  
**Average Data Lag:** 3-4 days

**Impact:** Not suitable for real-time use cases requiring current data within hours.

### Resource Requirements

**Storage:** ~3.5 GB for EDR data + growth  
**Memory:** 2-4 GB during parsing (streaming reduces this)  
**CPU:** Moderate during parsing (XML processing)  
**Network:** 150 MB per update (download)

**Impact:** Manageable for typical production infrastructure.

### Failure Handling

**Download Failure:** Retry with exponential backoff, alert after 3 failures  
**Parse Failure:** Log error, skip problematic record, continue processing  
**Schema Validation Failure:** Alert immediately, halt ingestion  
**Database Failure:** Transaction rollback, retry, alert

**Impact:** Requires monitoring and alerting infrastructure.

---

## Advantages

✅ **Authoritative Source:** Official government data  
✅ **Free:** No licensing or API costs  
✅ **Complete Dataset:** All entities in one file  
✅ **No Authentication:** No API keys or contracts  
✅ **Provenance:** File hash provides audit trail  
✅ **No Rate Limits:** Download at will  
✅ **Offline Capability:** Local copy available  
✅ **Predictable Updates:** Every 5 working days  

---

## Disadvantages

❌ **Not Real-Time:** 3-7 day data lag  
❌ **Large File Size:** 761 MB per update  
❌ **Complex Parsing:** XML with nested structures  
❌ **Wartime Restrictions:** Missing address/activity data  
❌ **Initial Load Time:** 1-3 hours for first ingestion  
❌ **Storage Requirements:** ~3.5 GB  
❌ **Implementation Complexity:** 15-22 days development  
❌ **Maintenance:** Ongoing monitoring required  

---

## Comparison with Alternatives

| Factor | NAIS XML (Batch) | Commercial API (Real-time) |
|--------|------------------|---------------------------|
| Data Freshness | 3-7 days | Real-time |
| Cost | FREE | Paid (per request) |
| Authority | AUTHORITATIVE | AGGREGATOR |
| Implementation | MEDIUM-HIGH | LOW |
| Maintenance | Ongoing monitoring | API dependency |
| Completeness | Complete dataset | Query-specific |
| Offline Capability | YES | NO |
| Rate Limits | NONE | Contract-dependent |

---

## Use Case Suitability

### Suitable For:

✅ Historical analysis and reporting  
✅ Bulk entity verification  
✅ Data warehouse and analytics  
✅ Backup/fallback data source  
✅ Cost-sensitive applications  
✅ Offline or air-gapped environments  

### Not Suitable For:

❌ Real-time entity verification  
❌ High-frequency queries  
❌ Applications requiring current data within hours  
❌ Resource-constrained environments  

---

## Recommendation

**For PREDATOR Analytics:**

Batch ingestion from NAIS EDR XML is **FEASIBLE** as a **SECONDARY/FALLBACK** data source for the following reasons:

1. Provides authoritative, complete EDR data at no cost
2. Suitable as backup if commercial API becomes unavailable
3. Can serve as baseline data for analytics
4. Enables offline capability

**However, it should NOT be the PRIMARY source** because:

1. 3-7 day data lag is unacceptable for real-time OSINT use cases
2. Implementation complexity is significant (15-22 days)
3. Wartime field restrictions limit data completeness
4. Real-time queries are required for production UI

**Recommended Architecture:**
- **PRIMARY:** Commercial API (Clarity Project) for real-time queries
- **SECONDARY:** NAIS XML batch for backup and analytics
- **TERTIARY:** Tax Cabinet API for tax status enrichment

---

## Implementation Priority

**Phase 1:**
- Implement Commercial API connector (Clarity Project)
- Enable real-time queries in production

**Phase 2:**
- Implement NAIS XML batch ingestion
- Set up scheduled downloader
- Enable backup/fallback capability

**Phase 3:**
- Implement Tax Cabinet API integration
- Add tax status enrichment

---

**Report End**
