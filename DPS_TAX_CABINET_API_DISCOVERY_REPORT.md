# DPS Tax Cabinet API - Discovery Report

**Report Date:** 2026-08-13  
**Component:** DPS (State Tax Service) Tax Cabinet API  
**Status:** 🔍 RESEARCH COMPLETE - Implementation Feasible  
**Priority:** P0 (High Priority Free Data Source)

---

## Executive Summary

The DPS Tax Cabinet API provides official access to Ukrainian tax data through two main interfaces:

1. **Private Part API** - Requires user authentication (digital signature)
2. **Public Registers API** - Requires API token (easier integration)

The API offers comprehensive tax data including VAT payer status, tax registration data, budget accounts status, and various tax registers. This represents a **high-value free data source** for the PREDATOR Analytics system.

**Key Finding:** Public Registers API is feasible for integration with token-based authentication, while Private Part API requires complex digital signature handling.

---

## 1. API Overview

### 1.1 Base URLs
- **Private Part API:** `https://cabinet.tax.gov.ua/ws/public_api/`
- **Public Registers API:** `https://cabinet.tax.gov.ua/ws/api/public/registers/`
- **Documentation:** https://cabinet.tax.gov.ua/help/api-registers.html

### 1.2 Authentication Methods

#### Private Part API (Complex)
- **Method:** Authorization header with digital signature
- **Format:** `Authorization: EDRPOU/IPN signed with internal signature + certificate in BASE64`
- **Requirement:** User must have digital signature certificate (pb.jks or Key6.dat)
- **Complexity:** HIGH - Requires cryptographic signing

#### Public Registers API (Simple)
- **Method:** API Token in Authorization header
- **Token Creation:** Created in "Tokens of open part" in user settings
- **URL:** https://cabinet.tax.gov.ua/user/settings
- **Complexity:** LOW - Standard token-based authentication

---

## 2. Available Endpoints

### 2.1 Public Registers API (Recommended for Integration)

#### VAT Payer Register
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/api/public/registers/pdv_act/list`
- **Method:** GET
- **Data:** Active VAT payers
- **Authentication:** Token required
- **Use Case:** Verify VAT payer status

#### Tax Registration Data
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/api/public/registers/registration`
- **Method:** POST
- **Data:** Tax payer registration information
- **Authentication:** Token required
- **Use Case:** Get entity registration details

#### Insurers Register
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/api/public/registers/ev`
- **Method:** GET
- **Data:** Registered insurers
- **Authentication:** Token required
- **Use Case:** Verify insurance status

#### Excise Tax Payer Register
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/api/public/registers/excise`
- **Method:** GET
- **Data:** Excise tax payers (fuel, alcohol)
- **Authentication:** Token required
- **Use Case:** Verify excise tax compliance

#### Goods Operations Register
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/api/public/registers/cli-zed`
- **Method:** GET
- **Data:** Entities operating with goods
- **Authentication:** Token required
- **Use Case:** Track goods operations

#### Budget Subsidy Recipients
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/api/public/registers/obd`
- **Method:** GET
- **Data:** Budget subsidy recipients
- **Authentication:** Token required
- **Use Case:** Identify subsidy recipients

#### Non-Profit Organizations
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/api/public/registers/non-profit`
- **Method:** GET
- **Data:** Non-profit organizations
- **Authentication:** Token required
- **Use Case:** Verify non-profit status

### 2.2 Private Part API (Complex Authentication)

#### Tax Accounts Status
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/public_api/ta/splatp?year=2020`
- **Method:** GET
- **Data:** Budget accounts status, tax debts
- **Authentication:** Digital signature required
- **Use Case:** Check tax debt status
- **Complexity:** HIGH - Not recommended for initial implementation

#### Payer Card Data
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/public_api/payer_card`
- **Method:** GET
- **Data:** Payer account information
- **Authentication:** Digital signature required
- **Use Case:** Get detailed payer data
- **Complexity:** HIGH - Not recommended for initial implementation

#### Reports Viewing
- **Endpoint:** `https://cabinet.tax.gov.ua/ws/public_api/reg_doc/list`
- **Method:** GET
- **Data:** Tax reports
- **Authentication:** Digital signature required
- **Use Case:** Access tax reports
- **Complexity:** HIGH - Not recommended for initial implementation

---

## 3. Data Value Assessment

### 3.1 High Value Data
- ✅ **VAT Payer Status** - Critical for business verification
- ✅ **Tax Registration Data** - Official registration information
- ✅ **Non-Profit Status** - Important for entity classification
- ✅ **Excise Tax Compliance** - Regulatory compliance data

### 3.2 Medium Value Data
- ⚠️ **Insurers Register** - Industry-specific
- ⚠️ **Goods Operations Register** - Supply chain intelligence
- ⚠️ **Budget Subsidy Recipients** - Government funding tracking

### 3.3 Low Value Data (High Complexity)
- ❌ **Tax Accounts Status** - Requires digital signature
- ❌ **Payer Card Data** - Requires digital signature
- ❌ **Tax Reports** - Requires digital signature

---

## 4. Integration Feasibility

### 4.1 Public Registers API - HIGH FEASIBILITY ✅

**Advantages:**
- Token-based authentication (simple)
- Official government data source
- RESTful API design
- JSON response format
- No complex cryptographic requirements

**Requirements:**
- User must create API token in Tax Cabinet settings
- Token must be stored securely
- Rate limiting may apply

**Implementation Complexity:** LOW

### 4.2 Private Part API - LOW FEASIBILITY ❌

**Disadvantages:**
- Digital signature required (complex)
- Cryptographic operations needed
- Certificate management overhead
- User-specific authentication
- Not suitable for system-wide integration

**Requirements:**
- Digital signature certificate (pb.jks or Key6.dat)
- Cryptographic signing library
- Certificate rotation management
- Per-user authentication

**Implementation Complexity:** HIGH

---

## 5. Recommended Implementation Strategy

### Phase 1: Public Registers API (Immediate)

**Priority:** P0  
**Timeline:** 1-2 weeks

**Endpoints to Implement:**
1. VAT Payer Register (`pdv_act/list`)
2. Tax Registration Data (`registration`)
3. Non-Profit Organizations (`non-profit`)

**Implementation Steps:**
1. Create DPSTaxCabinetConnector class
2. Implement token-based authentication
3. Add endpoint functions for each register
4. Integrate with IntelligenceOrchestrator fallback chain
5. Add caching layer for performance
6. Implement error handling and rate limiting

**Expected Outcomes:**
- Access to official VAT payer status
- Tax registration verification
- Non-profit status verification
- Integration with existing fallback chain

### Phase 2: Additional Registers (Future)

**Priority:** P1  
**Timeline:** 2-4 weeks

**Endpoints to Add:**
1. Insurers Register (`ev`)
2. Excise Tax Payer Register (`excise`)
3. Goods Operations Register (`cli-zed`)
4. Budget Subsidy Recipients (`obd`)

**Implementation Steps:**
1. Extend connector with additional endpoints
2. Add specialized data processing for each register
3. Update data mapping and normalization
4. Add relevant fields to entity dossiers

### Phase 3: Private Part API (Future - Optional)

**Priority:** P2  
**Timeline:** 4-8 weeks

**Considerations:**
- Only implement if specific use case requires
- Requires significant cryptographic infrastructure
- May not be suitable for system-wide deployment
- Consider alternative data sources first

---

## 6. Technical Implementation Details

### 6.1 Authentication Flow

**Public Registers API:**
```typescript
// Token creation (manual step by user)
// 1. User logs into https://cabinet.tax.gov.ua
// 2. Navigate to Settings → Tokens of open part
// 3. Create new API token
// 4. Copy token to environment configuration

// API call
const response = await fetch(
  'https://cabinet.tax.gov.ua/ws/api/public/registers/pdv_act/list',
  {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Accept': 'application/json'
    }
  }
);
```

### 6.2 Data Structure

**VAT Payer Response (Expected):**
```json
{
  "tin": "1234567890",
  "name": "Company Name",
  "status": "ACTIVE",
  "registrationDate": "2020-01-01",
  "address": "Address details"
}
```

**Tax Registration Response (Expected):**
```json
{
  "tin": "1234567890",
  "name": "Company Name",
  "status": "REGISTERED",
  "registrationDate": "2020-01-01",
  "taxAuthority": "Tax office details"
}
```

### 6.3 Error Handling

**Expected Error Scenarios:**
- Invalid token (401 Unauthorized)
- Rate limiting (429 Too Many Requests)
- Entity not found (404 Not Found)
- Service unavailable (503 Service Unavailable)

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

### 7.1 vs NAIS EDR
- **DPS Tax Cabinet:** More current tax data, official status
- **NAIS EDR:** Comprehensive business registry, batch import
- **Complementarity:** DPS for tax-specific data, NAIS for general registry

### 7.2 vs data.gov.ua EDR
- **DPS Tax Cabinet:** Official tax authority data
- **data.gov.ua EDR:** General business registry
- **Complementarity:** DPS for tax compliance, data.gov.ua for general info

### 7.3 vs Clarity Project API
- **DPS Tax Cabinet:** Free, official Ukrainian data
- **Clarity Project:** Paid, international data
- **Complementarity:** DPS for Ukraine-specific data, Clarity for international

---

## 8. Risk Assessment

### 8.1 Technical Risks
- **Risk:** API rate limiting may affect performance
- **Mitigation:** Implement caching and rate limiting handling
- **Risk:** API changes may break integration
- **Mitigation:** Version-specific endpoints, monitoring

### 8.2 Operational Risks
- **Risk:** Token expiration requires manual renewal
- **Mitigation:** Token rotation process, monitoring
- **Risk:** Service downtime affects data availability
- **Mitigation:** Fallback chain implementation

### 8.3 Security Risks
- **Risk:** Token compromise could allow unauthorized access
- **Mitigation:** Secure token storage, access logging
- **Risk:** Data exposure through API responses
- **Mitigation:** Data minimization, access controls

---

## 9. Cost Analysis

### 9.1 Direct Costs
- **API Access:** FREE (official government service)
- **Authentication:** FREE (token creation)
- **Data Usage:** FREE (no per-request fees)

### 9.2 Indirect Costs
- **Development:** 1-2 weeks for initial implementation
- **Maintenance:** Ongoing monitoring and updates
- **Infrastructure:** Minimal (standard API calls)

### 9.3 Cost Comparison
- **DPS Tax Cabinet:** FREE
- **Clarity Project API:** PAID
- **NAIS EDR:** FREE (with setup cost)
- **data.gov.ua EDR:** FREE

---

## 10. Recommendations

### 10.1 Immediate Action
1. ✅ **Proceed with Public Registers API implementation**
2. ✅ **Start with VAT Payer and Tax Registration endpoints**
3. ✅ **Integrate with existing fallback chain**
4. ✅ **Implement token-based authentication**

### 10.2 Follow-up Actions
1. ⚠️ **Monitor API performance and reliability**
2. ⚠️ **Implement caching for frequently accessed data**
3. ⚠️ **Add observability and alerting**
4. ⚠️ **Document token rotation procedures**

### 10.3 Future Considerations
1. ❌ **Defer Private Part API implementation** (high complexity)
2. ❌ **Evaluate need for additional registers** after initial deployment
3. ❌ **Consider automated token renewal** if API supports it

---

## 11. Conclusion

The DPS Tax Cabinet API represents a **high-value free data source** that should be integrated into the PREDATOR Analytics system. The Public Registers API offers straightforward integration with token-based authentication and provides critical tax-related data including VAT payer status and tax registration information.

**Recommendation:** Proceed with Phase 1 implementation of Public Registers API endpoints as a P0 priority task.

**Expected Benefits:**
- Access to official Ukrainian tax data
- Improved entity verification capabilities
- Enhanced compliance checking
- No direct costs for API access

**Implementation Timeline:** 1-2 weeks for initial deployment

---

**End of Report**
