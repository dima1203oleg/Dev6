# RNBO Sanctions API - Discovery Report

**Report Date:** 2026-08-13  
**Component:** RNBO (National Security and Defense Council) State Register of Sanctions  
**Status:** 🔍 RESEARCH COMPLETE - Implementation Feasible  
**Priority:** P1 (Medium Priority Free Data Source)

---

## Executive Summary

The RNBO State Register of Sanctions provides official access to Ukrainian sanctions data through two main interfaces:

1. **Official RNBO API** - api-drs.nsdc.gov.ua (direct government source)
2. **OpenSanctions API** - api.opensanctions.org (consolidated international data)

The API offers comprehensive sanctions data including individuals and legal entities subject to Ukrainian restrictive measures. This represents a **high-value free data source** for the PREDATOR Analytics system for compliance and risk assessment.

**Key Finding:** OpenSanctions provides a more developer-friendly API with consolidated international sanctions data, while the official RNBO API provides the most authoritative Ukrainian-specific data.

---

## 1. API Overview

### 1.1 Base URLs
- **Official RNBO API:** https://api-drs.nsdc.gov.ua
- **Official RNBO Web Interface:** https://drs.nsdc.gov.ua
- **OpenSanctions API:** https://api.opensanctions.org
- **OpenSanctions Documentation:** https://www.opensanctions.org/docs/api/

### 1.2 Authentication Methods

#### Official RNBO API
- **Method:** Not clearly documented in public sources
- **Requirement:** May require API key or registration
- **Complexity:** UNKNOWN - Requires further investigation
- **Recommendation:** Start with OpenSanctions API first

#### OpenSanctions API
- **Method:** Public API (no authentication required for basic queries)
- **Rate Limiting:** May apply for high-volume usage
- **Complexity:** LOW - Standard REST API
- **Recommendation:** Primary implementation target

---

## 2. Available Endpoints

### 2.1 OpenSanctions API (Recommended for Initial Implementation)

#### Entity Matching
- **Endpoint:** `/match`
- **Method:** POST
- **Data:** Entity matching for sanctions screening
- **Authentication:** None required
- **Use Case:** Check if an entity is under sanctions

#### Full-Text Search
- **Endpoint:** `/search`
- **Method:** GET
- **Data:** Full-text search across sanctions data
- **Authentication:** None required
- **Use Case:** Search for entities by name, identifier, etc.

#### Reconciliation API
- **Endpoint:** `/reconcile`
- **Method:** GET
- **Data:** OpenRefine reconciliation
- **Authentication:** None required
- **Use Case:** Data reconciliation and matching

### 2.2 Official RNBO API (Requires Investigation)

#### Official Register Access
- **Endpoint:** Unknown (requires API documentation)
- **Method:** Unknown
- **Data:** Official Ukrainian sanctions data
- **Authentication:** Unknown
- **Use Case:** Authoritative Ukrainian sanctions verification
- **Complexity:** HIGH - Requires API documentation access

---

## 3. Data Value Assessment

### 3.1 High Value Data
- ✅ **Sanctions Status** - Critical for compliance and risk assessment
- ✅ **Sanctions Details** - Asset freezes, travel bans, trade restrictions
- ✅ **Legal Basis** - Presidential decrees and NSDC decisions
- ✅ **Entity Identifiers** - Names, dates of birth, company identifiers

### 3.2 Medium Value Data
- ⚠️ **Court Decisions** - Related legal proceedings
- ⚠️ **Sanction Duration** - Temporary vs indefinite sanctions
- ⚠️ **International Context** - Cross-references with other sanctions lists

### 3.3 Low Value Data
- ❌ **Historical Data** - Past sanctions (no longer active)
- ❌ **Administrative Data** - Internal processing information

---

## 4. Integration Feasibility

### 4.1 OpenSanctions API - HIGH FEASIBILITY ✅

**Advantages:**
- No authentication required (public API)
- Consolidated international sanctions data
- RESTful API design
- JSON response format
- Comprehensive documentation
- Regular updates (daily)

**Requirements:**
- Internet access to api.opensanctions.org
- Rate limiting handling
- Data mapping to internal schema

**Implementation Complexity:** LOW

### 4.2 Official RNBO API - MEDIUM FEASIBILITY ⚠️

**Advantages:**
- Most authoritative Ukrainian data source
- Official government data
- Synchronous updates with presidential decrees
- Electronic extracts with legal validity

**Disadvantages:**
- API documentation not publicly available
- Authentication requirements unknown
- May require registration or approval
- Potential rate limiting

**Requirements:**
- API documentation access
- Authentication credentials
- Government approval process

**Implementation Complexity:** MEDIUM to HIGH

---

## 5. Recommended Implementation Strategy

### Phase 1: OpenSanctions API (Immediate)

**Priority:** P1  
**Timeline:** 1 week

**Endpoints to Implement:**
1. Entity Matching (`/match`)
2. Full-Text Search (`/search`)

**Implementation Steps:**
1. Create RNBOConnector class
2. Implement OpenSanctions API integration
3. Add data mapping and normalization
4. Integrate with IntelligenceOrchestrator fallback chain
5. Add caching layer for performance
6. Implement error handling and rate limiting

**Expected Outcomes:**
- Access to consolidated international sanctions data
- Entity screening capabilities
- Integration with existing fallback chain
- Compliance checking functionality

### Phase 2: Official RNBO API (Future)

**Priority:** P2  
**Timeline:** 2-4 weeks

**Prerequisites:**
- Obtain API documentation
- Secure authentication credentials
- Complete government approval process

**Implementation Steps:**
1. Request API access from RNBO
2. Review API documentation
3. Implement official RNBO API integration
4. Add data validation and verification
5. Implement electronic extract functionality
6. Update fallback chain to prioritize official data

**Expected Outcomes:**
- Authoritative Ukrainian sanctions data
- Legal validity for compliance purposes
- Electronic extract generation
- Enhanced data accuracy

---

## 6. Technical Implementation Details

### 6.1 OpenSanctions API Flow

**Entity Matching:**
```typescript
// API call
const response = await fetch('https://api.opensanctions.org/match', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    schema: 'Person',
    properties: {
      name: 'Entity Name',
      birthDate: '1990-01-01',
      nationality: 'UA',
    },
  }),
});

// Expected response
{
  "results": [
    {
      "id": "ua-nsdc-sanctions-12345",
      "schema": "Person",
      "properties": {
        "name": "Entity Name",
        "birthDate": "1990-01-01",
        "sanctions": [
          {
            "program": "UA-SA1644",
            "startDate": "2022-02-24",
            "endDate": null,
            "reason": "Threat to national security",
          }
        ]
      }
    }
  ]
}
```

**Full-Text Search:**
```typescript
// API call
const response = await fetch('https://api.opensanctions.org/search?q=Entity+Name&dataset=ua_nsdc_sanctions');

// Expected response
{
  "results": [
    {
      "id": "ua-nsdc-sanctions-12345",
      "schema": "Person",
      "name": "Entity Name",
      "dataset": "ua_nsdc_sanctions",
      "match": true
    }
  ]
}
```

### 6.2 Data Structure

**Sanctions Response (Expected):**
```json
{
  "id": "ua-nsdc-sanctions-12345",
  "schema": "Person",
  "name": "Entity Name",
  "properties": {
    "name": "Entity Name",
    "birthDate": "1990-01-01",
    "nationality": "UA",
    "identifiers": [
      {
        "scheme": "UA_EDRPOU",
        "id": "12345678"
      }
    ],
    "sanctions": [
      {
        "program": "UA-SA1644",
        "startDate": "2022-02-24",
        "endDate": null,
        "reason": "Threat to national security",
        "measures": [
          "asset_freeze",
          "travel_ban",
          "trade_restriction"
        ]
      }
    ]
  }
}
```

### 6.3 Error Handling

**Expected Error Scenarios:**
- Rate limiting (429 Too Many Requests)
- Entity not found (404 Not Found)
- Service unavailable (503 Service Unavailable)
- Invalid request (400 Bad Request)

**Error Response Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details"
}
```

---

## 7. Comparison with Existing Data Sources

### 7.1 vs Existing Sanctions Connector
- **RNBO Sanctions:** Official Ukrainian sanctions data
- **Existing Sanctions:** May use different data sources
- **Complementarity:** RNBO provides Ukraine-specific authoritative data

### 7.2 vs DPS Tax Cabinet
- **RNBO Sanctions:** Sanctions and compliance data
- **DPS Tax Cabinet:** Tax registration and compliance
- **Complementarity:** Both provide compliance data from different perspectives

### 7.3 vs Clarity Project API
- **RNBO Sanctions:** Free, official Ukrainian sanctions
- **Clarity Project:** Paid, international business data
- **Complementarity:** RNBO for Ukraine-specific sanctions, Clarity for international context

---

## 8. Risk Assessment

### 8.1 Technical Risks
- **Risk:** API rate limiting may affect performance
- **Mitigation:** Implement caching and rate limiting handling
- **Risk:** API changes may break integration
- **Mitigation:** Version-specific endpoints, monitoring

### 8.2 Operational Risks
- **Risk:** Data updates may be delayed
- **Mitigation:** Regular monitoring, fallback to cached data
- **Risk:** Service downtime affects data availability
- **Mitigation:** Fallback chain implementation

### 8.3 Security Risks
- **Risk:** Data exposure through API responses
- **Mitigation:** Data minimization, access controls
- **Risk:** False positives in sanctions screening
- **Mitigation:** Manual verification for critical decisions

---

## 9. Cost Analysis

### 9.1 Direct Costs
- **API Access:** FREE (OpenSanctions public API)
- **Official RNBO API:** FREE (may require registration)
- **Data Usage:** FREE (no per-request fees)

### 9.2 Indirect Costs
- **Development:** 1 week for initial implementation
- **Maintenance:** Ongoing monitoring and updates
- **Infrastructure:** Minimal (standard API calls)

### 9.3 Cost Comparison
- **RNBO Sanctions:** FREE
- **DPS Tax Cabinet:** FREE
- **NAIS EDR:** FREE (with setup cost)
- **Clarity Project API:** PAID

---

## 10. Recommendations

### 10.1 Immediate Action
1. ✅ **Proceed with OpenSanctions API implementation**
2. ✅ **Start with entity matching and search endpoints**
3. ✅ **Integrate with existing fallback chain**
4. ✅ **Implement caching for performance**

### 10.2 Follow-up Actions
1. ⚠️ **Monitor API performance and reliability**
2. ⚠️ **Implement rate limiting handling**
3. ⚠️ **Add data validation and verification**
4. ⚠️ **Document false positive handling procedures**

### 10.3 Future Considerations
1. ❌ **Request official RNBO API access** (requires government approval)
2. ❌ **Implement official RNBO API integration** (after Phase 1)
3. ❌ **Add electronic extract functionality** (legal validity)
4. ❌ **Integrate with other international sanctions lists** (comprehensive coverage)

---

## 11. Conclusion

The RNBO State Register of Sanctions represents a **high-value free data source** that should be integrated into the PREDATOR Analytics system. The OpenSanctions API offers straightforward integration with no authentication requirements and provides consolidated international sanctions data.

**Recommendation:** Proceed with Phase 1 implementation of OpenSanctions API endpoints as a P1 priority task.

**Expected Benefits:**
- Access to official Ukrainian sanctions data
- Enhanced compliance checking capabilities
- Improved risk assessment functionality
- No direct costs for API access

**Implementation Timeline:** 1 week for initial deployment

---

**End of Report**
