# Clarity API Configuration Report

**Generated:** 2025-01-12  
**Task:** Phase 4.2 - Real API Access - Configuration contract and secrets  
**Objective:** Define configuration contract and secret management for Clarity API.

---

## Configuration Contract

### Environment Variables Added

Updated `.env.example` with the following configuration:

```bash
# Clarity API Configuration
CLARITY_API_KEY=""
CLARITY_API_BASE_URL="https://clarity-project.info/api"
CLARITY_TIMEOUT="10000"
CLARITY_RATE_LIMIT="60"
CLARITY_CACHE_TTL="86400"
```

### Variable Definitions

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| CLARITY_API_KEY | string | - | YES | API authentication key (SECRET) |
| CLARITY_API_BASE_URL | string | https://clarity-project.info/api | NO | API base URL |
| CLARITY_TIMEOUT | number | 10000 | NO | Request timeout in milliseconds |
| CLARITY_RATE_LIMIT | number | 60 | NO | Rate limit in requests per minute |
| CLARITY_CACHE_TTL | number | 86400 | NO | Cache time-to-live in seconds (24 hours) |

---

## Secret Management

### CRITICAL: CLARITY_API_KEY is a Secret

**CLARITY_API_KEY must NOT be stored in:**
- ❌ React source code (.tsx, .ts files)
- ❌ Git repository (committed files)
- ❌ README.md or documentation
- ❌ Test fixtures
- ❌ Configuration files committed to version control

**CLARITY_API_KEY must be stored in:**
- ✅ `.env` file (not committed to Git)
- ✅ Environment variables in production
- ✅ Secret management service (AWS Secrets Manager, HashiCorp Vault)
- ✅ CI/CD secret store (GitHub Actions Secrets, GitLab CI Variables)

### .gitignore Verification

The `.env` file should be in `.gitignore` to prevent accidental commits.

---

## Secret Acquisition Process

### Step 1: Register with Clarity Project

**Action Required by User:**
1. Navigate to https://clarity-project.info
2. Click "Вхід" (Login) or "Реєстрація" (Register)
3. Complete registration process
4. Navigate to account settings
5. Generate API key in API settings section

**Documentation:** https://github.com/the-clarity-project/api

### Step 2: Configure Environment

**Action Required by User:**
1. Copy `.env.example` to `.env`
2. Set `CLARITY_API_KEY` to the obtained key
3. Adjust other configuration values if needed
4. Ensure `.env` is not committed to Git

### Step 3: Verify Configuration

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
function validateClarityConfig(): void {
  if (!process.env.CLARITY_API_KEY) {
    throw new Error('CLARITY_API_KEY is required');
  }
  
  if (process.env.CLARITY_API_KEY === '' || process.env.CLARITY_API_KEY === 'xxx') {
    throw new Error('CLARITY_API_KEY must be a real API key, not placeholder');
  }
  
  const timeout = parseInt(process.env.CLARITY_TIMEOUT || '10000');
  if (isNaN(timeout) || timeout <= 0) {
    throw new Error('CLARITY_TIMEOUT must be a positive number');
  }
}
```

### Placeholder Detection

The connector should reject placeholder values:
- Empty string
- "xxx"
- "your-api-key-here"
- "REPLACE_WITH_REAL_KEY"

---

## Security Considerations

### API Key Protection

1. **Never log API key** - Use redaction in logs
2. **Never expose in error messages** - Sanitize error output
3. **Never include in client-side code** - Keep server-side only
4. **Rotate regularly** - Implement key rotation strategy
5. **Monitor usage** - Track request count for cost management

### Rate Limit Protection

1. **Implement rate limiting** - Respect CLARITY_RATE_LIMIT
2. **Use caching** - Reduce API calls with CLARITY_CACHE_TTL
3. **Monitor costs** - Track API usage and estimated costs
4. **Alert on anomalies** - Detect unusual usage patterns

---

## Current Status

**Phase 4.2 Status:** ⚠️ BLOCKED - User Action Required

**Configuration Contract:** ✅ Defined  
**Environment Variables:** ✅ Added to .env.example  
**Secret Management:** ✅ Documented  
**API Key Acquisition:** ❌ Requires user registration with Clarity Project  
**Configuration Validation:** ⚠️ Cannot validate without real API key  

---

## Next Steps

### User Action Required

1. **Register with Clarity Project** to obtain API key
2. **Set CLARITY_API_KEY** in `.env` file
3. **Test API connection** with test identifier 3111724753

### After API Key Obtained

1. **Phase 4.3:** Execute real API request with evidence
2. **Phase 4.4:** Implement ClarityAPIConnector
3. **Phase 4.5:** Register source in source_registry

---

## Alternative Approach

If Clarity Project API key cannot be obtained, consider:

1. **OpenDataBot API** - Similar commercial aggregator
2. **YouControl API** - Similar commercial aggregator
3. **NAIS EDR XML** - Batch ingestion (no API key required)
4. **NAIS EDR API** - Contract with Ministry of Justice

However, these alternatives would require additional research and implementation effort.

---

**Report End**
