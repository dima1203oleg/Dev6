# Clarity API Production Report

**Generated:** 2025-01-12  
**Task:** Phase 4.1 - Clarity API Validation  
**Objective:** Define real API contract from official documentation.

---

## API Contract Definition

### Source Documentation
- **Official Documentation:** https://github.com/the-clarity-project/api
- **Endpoint Documentation:** https://github.com/the-clarity-project/api/blob/master/edr.info.md
- **Example Response:** https://raw.githubusercontent.com/the-clarity-project/api/master/examples/edr.info.json

---

## Fixed API Contract

### BASE_URL
```
https://clarity-project.info/api
```

### AUTH_METHOD
```
API_KEY (GET parameter)
```

Authentication is performed by passing the API key as a GET parameter named `key` in the URL.

### ENDPOINT
```
/edr.info/{edrpou}
```

Where `{edrpou}` is the EDRPOU code (for legal entities) or RNOKPP (for individual entrepreneurs).

### HTTP_METHOD
```
GET
```

### REQUEST_SCHEMA
```
URL: https://clarity-project.info/api/edr.info/{edrpou}?key={API_KEY}
```

**Parameters:**
- `edrpou` (path parameter): EDRPOU code or RNOKPP identifier
- `key` (query parameter): API authentication key

**Example:**
```
GET https://clarity-project.info/api/edr.info/3111724753?key=xxx
```

### RESPONSE_SCHEMA

Based on official documentation and example response:

```json
{
  "edr": "string",
  "name": "string",
  "address": "string",
  "contact": "string",
  "isTenderer": boolean,
  "isBuyer": boolean,
  "edr_data": {
    "edr": "string",
    "name": "string",
    "shortName": "string",
    "opf": "string",
    "opf_name": "string",
    "address": "string",
    "address_parts": {
      "region": "string",
      "district": "string",
      "city": "string",
      "street": "string",
      "building": "string"
    },
    "status": "string",
    "statusName": "string",
    "capital": "number",
    "activity": [
      {
        "kved": "string",
        "kved_name": "string"
      }
    ],
    "founders": [
      {
        "name": "string",
        "edr": "string",
        "share": "number"
      }
    ],
    "beneficiaries": [
      {
        "Name": "string",
        "Country": "string",
        "Address": "string",
        "Details": {
          "type": "string",
          "interest": "number",
          "indirect_interest": "number",
          "other_impact": "string",
          "beneficiary_false": boolean
        }
      }
    ],
    "signers": [
      {
        "name": "string"
      }
    ],
    "branches": [
      {
        "name": "string",
        "address": "string"
      }
    ],
    "predecessors": [
      {
        "name": "string",
        "edr": "string"
      }
    ],
    "contacts": {
      "phone": "string",
      "email": "string"
    },
    "registration": {
      "date": number,
      "num": "string"
    },
    "termination": {
      "date": number,
      "num": "string"
    }
  },
  "history": number,
  "licenses_count": number,
  "property_struct_info": {
    "struct_signed": boolean,
    "date_struct": number,
    "num_struct": "string",
    "last_name_sign": "string",
    "first_middle_name_sign": "string",
    "type_sign": number,
    "struct_false": boolean,
    "struct_opaque": boolean,
    "struct_excluded": boolean
  },
  "beneficiaries_info": "string"
}
```

### RATE_LIMIT
```
Contract-dependent
```

From pricing information: from 1.23 UAH per request. Specific rate limits are determined by the contract/agreement with Clarity Project. No public rate limit documentation available.

### TIMEOUT
```
Default: 10000ms (10 seconds)
```

Not specified in official documentation. Setting reasonable default based on typical API response times.

### ERROR_CODES

Based on typical HTTP behavior and API patterns:

- **200 OK:** Successful request, entity data returned
- **400 Bad Request:** Invalid EDRPOU format or missing parameters
- **401 Unauthorized:** Invalid or missing API key
- **403 Forbidden:** API key does not have access to this endpoint
- **404 Not Found:** EDRPOU not found in registry
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** API server error
- **503 Service Unavailable:** API temporarily unavailable

*Note: Specific error codes need to be verified through actual API testing.*

---

## Field Mapping to PREDATOR Schema

### Core Fields

| Clarity Field | PREDATOR Field | Type | Required |
|---------------|----------------|------|----------|
| edr | rnokpp | string | YES |
| name | fullName | string | YES |
| shortName | shortName | string | NO |
| address | address | string | NO |
| status | status | string | NO |
| statusName | statusName | string | NO |

### Registration Fields

| Clarity Field | PREDATOR Field | Type | Required |
|---------------|----------------|------|----------|
| registration.date | registrationDate | timestamp | NO |
| registration.num | registrationNumber | string | NO |
| termination.date | terminationDate | timestamp | NO |
| termination.num | terminationNumber | string | NO |

### Activity Fields

| Clarity Field | PREDATOR Field | Type | Required |
|---------------|----------------|------|----------|
| activity[].kved | kved | string[] | NO |
| activity[].kved_name | kvedDescription | string[] | NO |

### People Fields

| Clarity Field | PREDATOR Field | Type | Required |
|---------------|----------------|------|----------|
| founders[] | founders | array | NO |
| beneficiaries[] | beneficiaries | array | NO |
| signers[] | signers | array | NO |
| contacts.phone | phone | string | NO |
| contacts.email | email | string | NO |

---

## Configuration Contract

### Required Environment Variables

```bash
# Clarity API Configuration
CLARITY_API_BASE_URL=https://clarity-project.info/api
CLARITY_API_KEY=<secret>
CLARITY_TIMEOUT=10000
CLARITY_RATE_LIMIT=60
CLARITY_CACHE_TTL=86400
```

### Secret Management Requirements

**CRITICAL:** `CLARITY_API_KEY` must NOT be stored in:
- React source code (.tsx, .ts)
- Git repository
- README files
- Test fixtures
- Configuration files committed to version control

**Approved Storage Locations:**
- Environment variables (.env files not committed)
- Secret management service (e.g., AWS Secrets Manager, HashiCorp Vault)
- CI/CD secret store (e.g., GitHub Actions Secrets, GitLab CI Variables)

---

## Validation Requirements

### Request Validation
- EDRPOU must be numeric string (8-10 digits)
- API key must be non-empty string
- Timeout must be positive integer

### Response Validation
- HTTP status must be 200 for success
- Response must be valid JSON
- `edr` field must be present and non-empty
- `name` field must be present and non-empty

### Identifier Validation
- Response `edr` field must exactly match request identifier
- No partial matches allowed
- No fuzzy matches allowed
- No substring matches allowed

---

## Test Identifier

**Test EDRPOU:** 3111724753  
**Expected Entity:** КІЗИМА ДМИТРО МИКОЛАЙОВИЧ  
**Expected Status:** припинено (terminated)  
**Expected Registration:** 21.03.2007  
**Expected Termination:** 23.03.2017

This identifier was previously verified via Clarity Project web interface and will be used for API validation.

---

## Next Steps

1. **Phase 4.2:** Obtain real API key through Clarity Project registration
2. **Phase 4.3:** Execute real API request with test identifier
3. **Phase 4.4:** Implement ClarityAPIConnector based on this contract
4. **Phase 4.5:** Register source in source_registry

---

## Status

**Phase 4.1 Status:** ✅ COMPLETE

**API Contract Defined:** YES  
**Documentation Referenced:** YES  
**Configuration Contract Defined:** YES  
**Field Mapping Defined:** YES  
**Validation Requirements Defined:** YES  

---

**Report End**
