# Canonical Model Verification

**Verification Date**: 2026-08-08  
**Component**: Canonical Source Registry  
**File**: `/core/registry/canonical-source-registry.ts`

## Model Structure

### CanonicalSourceUnit Interface

The canonical model defines 25 fields for each data source:

**Identity Fields:**
- `source_id`: Unique identifier (e.g., 'ua.edr', 'ua.courts')
- `name`: Display name (e.g., 'Єдиний державний реєстр (ЄДР)')
- `country`: ISO country code (default: 'UA')
- `category`: Source category (corporate, legal, financial, sanctions, etc.)
- `owner`: Data owner/agency

**Technical Fields:**
- `official_url`: Official website URL
- `endpoint_or_resource`: API endpoint or dataset resource URL
- `source_type`: API, DATASET, DUMP, SEARCH, HISTORY, ARCHIVE
- `access_level`: FREE_AUTO, FREE_API, FREE_PUBLIC_DATASET, etc.
- `automation_level`: FULL, SEMI, MANUAL
- `cost`: FREE, PAID
- `license`: License type
- `legal_status`: VERIFIED_PUBLIC, OPEN_GOV, RESTRICTED, UNVERIFIED
- `format`: JSON, CSV, XML, SPARQL, HTML, API
- `encoding`: Character encoding (default: UTF-8)
- `update_frequency`: realtime, hourly, daily, weekly, monthly, irregular
- `schema_version`: Schema version string

**Capability Fields:**
- `capabilities`: Array of supported entity types (person, company, fop, etc.)
- `supported_identifiers`: Array of supported ID types (rnokpp, edrpou, name, etc.)

**Integration Fields:**
- `connector_id`: Connector implementation ID
- `parser_id`: Parser implementation ID
- `normalizer_id`: Normalizer implementation ID

**Status Fields:**
- `status`: CertificationStatus (DISCOVERED, VERIFIED, IMPLEMENTED, LIVE, CERTIFIED, etc.)
- `certified`: Boolean certification flag
- `last_probe`: Last probe timestamp
- `last_success`: Last successful access timestamp
- `last_failure`: Last failure timestamp
- `last_schema_change`: Last schema change timestamp
- `freshness`: FRESH, STALE, VERY_STALE, UNKNOWN
- `quality_score`: 0-100 quality score

## Registered Sources (7 Core Sources)

1. **ua.edr** - Єдиний державний реєстр (ЄДР)
   - Category: corporate
   - Capabilities: person, company, fop
   - Identifiers: rnokpp, edrpou, name
   - Status: DISCOVERED

2. **ua.courts** - Єдиний державний реєстр судових рішень (ЄДРСР)
   - Category: legal
   - Capabilities: person, company, court_case
   - Identifiers: name, edrpou, rnokpp, case_number
   - Status: DISCOVERED

3. **ua.tax** - ДПС - Податковий борг
   - Category: financial
   - Capabilities: company, fop
   - Identifiers: edrpou, rnokpp
   - Status: DISCOVERED

4. **ua.sanctions** - Державний реєстр санкцій РНБО
   - Category: sanctions
   - Capabilities: person, company
   - Identifiers: name, edrpou, rnokpp
   - Status: DISCOVERED

5. **ua.debtors** - Єдиний реєстр боржників (ЄРБ)
   - Category: legal
   - Capabilities: person, company, fop
   - Identifiers: edrpou, rnokpp, name
   - Status: DISCOVERED

6. **ua.bankruptcy** - Реєстр справ про банкрутство
   - Category: legal
   - Capabilities: company, fop
   - Identifiers: edrpou, name
   - Status: DISCOVERED

7. **ua.ckan_data_gov** - Єдиний державний вебпортал відкритих даних (data.gov.ua)
   - Category: corporate
   - Capabilities: person, company, fop, tender, vehicle
   - Identifiers: edrpou, rnokpp, name
   - Status: DISCOVERED

## Verification Results

### ✅ Model Completeness
- All required fields defined
- Proper TypeScript typing
- Comprehensive status enumeration
- Clear categorization system

### ✅ Model Consistency
- Consistent naming conventions
- Logical field grouping
- Appropriate default values
- Clear status lifecycle

### ✅ Integration Points
- Connector/parser/normalizer IDs properly defined
- Capability mapping to entity types
- Identifier mapping to search keys
- Status tracking for certification

### ⚠️ Status Verification
- All 7 sources currently marked as `DISCOVERED`
- Requires live probe to determine `LIVE` or `CERTIFIED` status
- `updateProbeResult()` method available for status updates

### ✅ RDP Integration
- RDP CKAN adapter maps to `ua.ckan_data_gov` canonical source
- Full catalog discovery (36,887 packages) validates source capability
- DataStore probing validates technical feasibility

## Conclusion

**Canonical Model Status**: ✅ VERIFIED

The canonical source registry model is well-structured, comprehensive, and properly integrated with the RDP. The model provides:
- Complete source metadata
- Clear certification lifecycle
- Proper capability mapping
- Status tracking infrastructure

**Recommendation**: Proceed with live probe implementation to upgrade sources from `DISCOVERED` to `LIVE`/`CERTIFIED` status.
