# Tax Cabinet API Configuration Report

**Generated:** 2025-01-12  
**Task:** Phase 4.2 - Tax Cabinet API Access - Configuration contract and secrets  
**Objective:** Define configuration contract and secret management for Tax Cabinet API.

---

## Configuration Contract

### Environment Variables Added

Updated `.env.example` with the following configuration:

```bash
# Tax Cabinet API Configuration
TAX_CABINET_TOKENS="[]"
TAX_CABINET_BASE_URL="https://cabinet.tax.gov.ua/ws/api/public/registers"
TAX_CABINET_TIMEOUT="10000"
TAX_CABINET_TOKEN_ROTATION="true"
```

### Variable Definitions

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| TAX_CABINET_TOKENS | array | [] | YES | Array of authorization tokens (SECRET) |
| TAX_CABINET_BASE_URL | string | https://cabinet.tax.gov.ua/ws/api/public/registers | NO | API base URL |
| TAX_CABINET_TIMEOUT | number | 10000 | NO | Request timeout in milliseconds |
| TAX_CABINET_TOKEN_ROTATION | boolean | true | NO | Enable automatic token rotation |

---

## Secret Management

### CRITICAL: TAX_CABINET_TOKENS is a Secret

**TAX_CABINET_TOKENS must NOT be stored in:**
- ❌ React source code (.tsx, .ts files)
- ❌ Git repository (committed files)
- ❌ README.md or documentation
- ❌ Test fixtures
- ❌ Configuration files committed to version control

**TAX_CABINET_TOKENS must be stored in:**
- ✅ `.env` file (not committed to Git)
- ✅ Environment variables in production
- ✅ Secret management service (AWS Secrets Manager, HashiCorp Vault)
- ✅ CI/CD secret store (GitHub Actions Secrets, GitLab CI Variables)

### .gitignore Verification

The `.env` file should be in `.gitignore` to prevent accidental commits.

---

## Token Management

### Rate Limit Constraint

**CRITICAL:** Each token is limited to **1000 requests per day**. After 1000 requests, the token is automatically cancelled.

### Token Rotation Strategy

The connector must implement automatic token rotation:

```typescript
class TokenManager {
  private tokens: string[] = [];
  private usageCount: Map<string, number> = new Map();
  
  async getToken(): Promise<string> {
    // Find token with usage < 1000
    for (const token of this.tokens) {
      const usage = this.usageCount.get(token) || 0;
      if (usage < 1000) {
        this.usageCount.set(token, usage + 1);
        return token;
      }
    }
    
    // All tokens at limit - need new token
    throw new Error('All tokens exhausted. Generate new token.');
  }
  
  async regenerateToken(): Promise<string> {
    // User must manually generate new token in Tax Cabinet
    // This cannot be automated via API
    throw new Error('Manual token generation required via Tax Cabinet UI');
  }
}
```

### Token Pool Configuration

**Recommended:** Maintain pool of 2-3 tokens to avoid service interruption:

```bash
TAX_CABINET_TOKENS='["token1", "token2", "token3"]'
```

---

## Secret Acquisition Process

### Step 1: Register with Tax Cabinet

**Action Required by User:**
1. Navigate to https://cabinet.tax.gov.ua
2. Click "Реєстрація" (Registration)
3. Complete registration process for electronic cabinet
4. Login with credentials

### Step 2: Generate Token

**Action Required by User:**
1. Navigate to "Налаштування" (Settings)
2. Click "Токени відкритої частини" (Open part tokens)
3. Click "Створити токен" (Create token)
4. Copy generated token

**Documentation:** https://cabinet.tax.gov.ua/help/api-registers.html

### Step 3: Configure Environment

**Action Required by User:**
1. Copy `.env.example` to `.env`
2. Set `TAX_CABINET_TOKENS='["your_token"]'`
3. Adjust other configuration values if needed
4. Ensure `.env` is not committed to Git

### Step 4: Verify Configuration

**Action Required by User:**
1. Test API connection with test identifier 3111724753
2. Verify response is valid JSON
3. Verify authentication works
4. Document test results

---

## Configuration Validation

### Runtime Validation

The connector should validate configuration at startup:

```typescript
function validateTaxCabinetConfig(): void {
  const tokens = process.env.TAX_CABINET_TOKENS;
  
  if (!tokens) {
    throw new Error('TAX_CABINET_TOKENS is required');
  }
  
  const tokenArray = JSON.parse(tokens);
  
  if (tokenArray.length === 0) {
    throw new Error('TAX_CABINET_TOKENS must contain at least one token');
  }
  
  for (const token of tokenArray) {
    if (!token || token === '' || token === 'xxx') {
      throw new Error('TAX_CABINET_TOKENS must contain real tokens, not placeholders');
    }
  }
  
  const timeout = parseInt(process.env.TAX_CABINET_TIMEOUT || '10000');
  if (isNaN(timeout) || timeout <= 0) {
    throw new Error('TAX_CABINET_TIMEOUT must be a positive number');
  }
}
```

### Placeholder Detection

The connector should reject placeholder values:
- Empty string
- "xxx"
- "your-token-here"
- "REPLACE_WITH_REAL_TOKEN"

---

## Security Considerations

### Token Protection

1. **Never log token** - Use redaction in logs
2. **Never expose in error messages** - Sanitize error output
3. **Never include in client-side code** - Keep server-side only
4. **Monitor usage** - Track request count per token
5. **Alert on exhaustion** - Detect when token approaches 1000 requests

### Rate Limit Protection

1. **Implement rate limiting** - Track usage per token
2. **Use token rotation** - Distribute load across token pool
3. **Monitor costs** - Free service, but track usage patterns
4. **Alert on anomalies** - Detect unusual usage patterns

---

## Current Status

**Phase 4.2 Status:** ⚠️ BLOCKED - User Action Required

**Configuration Contract:** ✅ Defined  
**Environment Variables:** ✅ Added to .env.example  
**Secret Management:** ✅ Documented  
**Token Management:** ✅ Documented  
**Token Acquisition:** ❌ Requires user registration with Tax Cabinet  
**Configuration Validation:** ⚠️ Cannot validate without real token  

---

## Next Steps

### User Action Required

1. **Register with Tax Cabinet** to obtain token:
   - https://cabinet.tax.gov.ua
2. **Generate token** in settings (Налаштування → Токени відкритої частини)
3. **Set TAX_CABINET_TOKENS** in `.env` file
4. **Test API connection** with test identifier 3111724753

### After Token Obtained

1. **Phase 4.3:** Execute real API request with evidence
2. **Phase 4.4:** Implement TaxCabinetConnector
3. **Phase 4.5:** Register source in source_registry

---

## Limitations Reminder

**IMPORTANT:** Tax Cabinet API provides **tax data only**, not full EDR profile:
- VAT payer status
- Single tax status
- Tax registration date
- Tax cancellation date
- Company name

**NOT AVAILABLE:**
- Full EDR profile
- Founders/beneficiaries
- Directors
- Address
- Activity types (KVED)
- Registration history

**Use Case:** Tax status enrichment only, not primary EDR source.

---

**Report End**
