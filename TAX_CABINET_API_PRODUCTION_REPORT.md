# Tax Cabinet API Production Report

**Generated:** 2025-01-12  
**Task:** Phase 4.1 - Tax Cabinet API Validation  
**Objective:** Define real API contract from official documentation.

---

## API Contract Definition

### Source Documentation
- **Official Documentation:** https://cabinet.tax.gov.ua/help/api-registers.html
- **API Base URL:** https://cabinet.tax.gov.ua/ws/api/public/registers/
- **Token Generation:** https://cabinet.tax.gov.ua/user/settings (Токени відкритої частини)

---

## Fixed API Contract

### BASE_URL
```
https://cabinet.tax.gov.ua/ws/api/public/registers
```

### AUTH_METHOD
```
TOKEN (POST body parameter)
```

Authentication is performed by passing the token in the POST body as a JSON field named `token`.

### ENDPOINTS

#### 1. Tax Registration (Дані про взяття на облік платників податків) - PRIMARY FOR EDR
```
POST /registration
```
**Purpose:** Get tax registration data for entities (most relevant for EDR data)

#### 2. VAT Payer Register (Реєстр платників ПДВ)
```
POST /pdv_act/list
```

#### 3. Single Tax Register (Реєстр платників єдиного податку)
```
POST /reestr_edpod
```

#### 4. Non-Profit Register (Реєстр неприбуткових установ та організацій)
```
POST /non-profit
```

#### 5. Excise Tax Register (Реєстр платників акцизного податку)
```
POST /excise
```

#### 6. Insurers Register (Реєстр страхувальників)
```
POST /ev
```

#### 7. Goods Operations Register (Реєстр осіб, які здійснюють операції з товарами)
```
POST /cli-zed
```

#### 8. Budget Subsidy Recipients (Реєстр отримувачів бюджетної дотації)
```
POST /obd
```

#### 9. RRO Information (Інформація про РРО)
```
POST /rro
```

#### 10. ORO Books Information (Інформація про книги ОРО)
```
POST /koro
```

#### 11. Stopped VAT Invoices (Реєстр ПН / РК, реєстрація яких зупинена)
```
POST /inv-stopped
```

#### 12. RRO Instances (Реєстр екземплярів РРО)
```
POST /rro-instance
```

#### 13. CSO Register (Реєстр ЦСО)
```
POST /rro-cso
```

#### 14. Fiscal Checks (Реєстр фіскальних чеків)
```
GET /rro/chkAll
```

### HTTP_METHOD
```
POST
```

All endpoints use POST method with JSON body.

### REQUEST_SCHEMA

#### Tax Registration Search (PRIMARY ENDPOINT)
```json
{
  "tins": "3111724753",
  "name": null,
  "token": "YOUR_TOKEN_HERE"
}
```

**Parameters:**
- `tins` (string): EDRPOU code (optional)
- `name` (string): Company name (optional)
- `token` (string): Authorization token (REQUIRED)

**Example:**
```bash
curl -d '{"tins":"3111724753","name":null,"token":"TOKEN"}' \
  -H "Content-Type: application/json" \
  -X POST 'https://cabinet.tax.gov.ua/ws/api/public/registers/registration'
```

#### VAT Payer Search
```json
{
  "kodPdvList": null,
  "tinList": "3111724753",
  "name": null,
  "token": "YOUR_TOKEN_HERE"
}
```

**Parameters:**
- `kodPdvList` (array): List of VAT codes (up to 10, optional)
- `tinList` (string): Space-separated EDRPOU codes (up to 10, optional)
- `name` (string): Company name (optional)
- `token` (string): Authorization token (REQUIRED)

**Example:**
```bash
curl -d '{"kodPdvList":null,"tinList":"3111724753","name":null,"token":"TOKEN"}' \
  -H "Content-Type: application/json" \
  -X POST 'https://cabinet.tax.gov.ua/ws/api/public/registers/pdv_act/list'
```

### RESPONSE_SCHEMA

#### Tax Registration Response (PRIMARY ENDPOINT)
```json
{
  "FULL_NAME": "ПрАТ \"Літак\"",
  "TIN_S": "34554355",
  "ADRESS": "УКРАЇНА, 88745, ЧЕРКАСЬКА ОБЛАСТЬ, ЖАШКІВСЬКИЙ РАЙОН Р-Н, М.ЖАШКІВ, ВУЛ. ЛЕНІНА, БУД. 22, КВ (ОФІС) 57",
  "D_REG_STI": "01.01.2011",
  "N_REG_STI": "555",
  "C_STI_MAIN_NAME": "2311, ГОЛОВНЕ УПРАВЛІННЯ ДПС У ЧЕРКАСЬКІЙ ОБЛАСТІ, УМАНСЬКЕ УПРАВЛІННЯ, ЖАШКІВСЬКА ДПІ(ЖАШКІВСЬКИЙ Р-Н)",
  "VED_LIC": null,
  "FACE_MODE": 1,
  "C_STAN": 3,
  "D_ZAKR_STI": null,
  "C_KIND": 230,
  "C_CLOSE": 3
}
```

**Response Fields:**
- `FULL_NAME`: Full name of entity
- `TIN_S`: EDRPOU code
- `ADRESS`: Legal address
- `D_REG_STI`: Registration date with tax authority
- `N_REG_STI`: Registration number with tax authority
- `C_STI_MAIN_NAME`: Tax authority name where registered
- `VED_LIC`: Foreign economic activity indicator
- `FACE_MODE`: Entity type (1 = legal entity)
- `C_STAN`: Entity status
- `D_ZAKR_STI`: Closure date with tax authority
- `C_KIND`: Entity kind code
- `C_CLOSE`: Closure status

#### VAT Payer Response
```json
[
  {
    "kodPdv": 123456789015,
    "tin": 3111724753,
    "name": "ТОВ \"Назва\"",
    "datReestr": "2016-01-11 00:00:00",
    "datAnul": "2016-10-14 00:00:00",
    "kodPdvs": "123456789015",
    "datTerm": null,
    "dreestrSg": null,
    "datSvd": "2016-01-11 00:00:00",
    "danulSg": null,
    "dpdvSg": null,
    "kodAnul": null,
    "kodPid": "ЗАРЕЄСТРОВАНО"
  }
]
```

**Response Fields:**
- `kodPdv`: VAT code
- `tin`: Tax identification number (EDRPOU)
- `name`: Company name
- `datReestr`: Registration date
- `datAnul`: Cancellation date
- `kodPid`: Status code (ЗАРЕЄСТРОВАНО/АНУЛЬОВАНО)
- `kodAnul`: Cancellation reason

### RATE_LIMIT
```
1000 requests per day per token
```

**CRITICAL:** Token is automatically cancelled after 1000 requests in one day. New token must be generated.

### TIMEOUT
```
Default: 10000ms (10 seconds)
```

Not specified in official documentation. Setting reasonable default.

### ERROR_CODES

Based on typical HTTP behavior:
- **200 OK:** Successful request
- **400 Bad Request:** Invalid parameters
- **401 Unauthorized:** Invalid or expired token
- **429 Too Many Requests:** Rate limit exceeded (token cancelled)
- **500 Internal Server Error:** API server error

---

## Field Mapping to PREDATOR Schema

### Tax Registration Fields (PRIMARY ENDPOINT - /registration)

| Tax Cabinet Field | PREDATOR Field | Type | Required |
|------------------|----------------|------|----------|
| TIN_S | rnokpp | string | YES |
| FULL_NAME | fullName | string | YES |
| ADRESS | address | string | NO |
| D_REG_STI | taxRegistrationDate | timestamp | NO |
| N_REG_STI | taxRegistrationNumber | string | NO |
| C_STI_MAIN_NAME | taxAuthority | string | NO |
| FACE_MODE | entityType | number | NO |
| C_STAN | taxStatus | number | NO |
| D_ZAKR_STI | taxClosureDate | timestamp | NO |
| C_KIND | entityKind | number | NO |
| C_CLOSE | closureStatus | number | NO |

### VAT Payer Fields

| Tax Cabinet Field | PREDATOR Field | Type | Required |
|------------------|----------------|------|----------|
| tin | rnokpp | string | YES |
| name | fullName | string | YES |
| kodPid | vatStatus | string | NO |
| datReestr | vatRegistrationDate | timestamp | NO |
| datAnul | vatCancellationDate | timestamp | NO |
| kodPdv | vatCode | string | NO |

---

## Configuration Contract

### Required Environment Variables

```bash
# Tax Cabinet API Configuration
TAX_CABINET_BASE_URL=https://cabinet.tax.gov.ua/ws/api/public/registers
TAX_CABINET_TOKENS=["token1", "token2"]
TAX_CABINET_TIMEOUT=10000
TAX_CABINET_TOKEN_ROTATION=true
```

### Secret Management Requirements

**CRITICAL:** `TAX_CABINET_TOKENS` must NOT be stored in:
- React source code (.tsx, .ts)
- Git repository
- README files
- Test fixtures

**Approved Storage Locations:**
- Environment variables (.env files not committed)
- Secret management service

### Token Management

**Token Rotation Strategy:**
1. Track usage count per token
2. When usage approaches 1000, generate new token
3. Maintain pool of active tokens
4. Automatically rotate to next available token
5. Alert when all tokens exhausted

---

## Validation Requirements

### Request Validation
- TIN must be numeric string (8-10 digits)
- Token must be non-empty string
- Token must not be placeholder value

### Response Validation
- HTTP status must be 200 for success
- Response must be valid JSON array
- `tin` field must be present
- Response `tin` must exactly match request identifier

### Identifier Validation
- Response `tin` field must exactly match request identifier
- No partial matches allowed
- No fuzzy matches allowed

---

## Test Identifier

**Test TIN:** 3111724753  
**Expected Entity:** КІЗИМА ДМИТРО МИКОЛАЙОВИЧ (ФОП)  
**Note:** Tax Cabinet API primarily serves legal entities. FOP data may be limited to tax registration status only.

---

## Token Generation Instructions

### Step 1: Register
1. Navigate to https://cabinet.tax.gov.ua
2. Register for electronic cabinet (Електронний кабінет)
3. Complete registration process

### Step 2: Generate Token
1. Login to electronic cabinet
2. Navigate to Налаштування (Settings)
3. Click Токени відкритої частини (Open part tokens)
4. Click Generate new token
5. Copy generated token

### Step 3: Configure
1. Add token to `.env` file
2. Set `TAX_CABINET_TOKENS=["your_token"]`
3. Ensure `.env` is not committed to Git

---

## Limitations

**IMPORTANT:** Tax Cabinet API provides **tax registration data**, not full EDR profile:
- Tax registration status
- Legal address
- Registration date with tax authority
- Tax authority name
- Entity type and status
- VAT payer status (via separate endpoint)
- Single tax status (via separate endpoint)

**NOT AVAILABLE:**
- Full EDR profile (founders, directors, KVED)
- Beneficiaries
- Registration history
- Court cases
- Sanctions data

**Use Case:** Tax registration data enrichment and address verification. Can serve as PRIMARY source for tax-related entity data, but should be combined with NAIS XML batch for full EDR profile.

---

## Next Steps

1. **Phase 4.2:** Obtain real token through Tax Cabinet registration
2. **Phase 4.3:** Execute real API request with test identifier
3. **Phase 4.4:** Implement TaxCabinetConnector
4. **Phase 4.5:** Register source in source_registry

---

## Status

**Phase 4.1 Status:** ✅ COMPLETE

**API Contract Defined:** YES  
**Documentation Referenced:** YES  
**Configuration Contract Defined:** YES  
**Field Mapping Defined:** YES  
**Validation Requirements Defined:** YES  
**Limitations Documented:** YES  

---

**Report End**
