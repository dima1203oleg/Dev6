# PREDATOR DATABASE INCIDENT REPORT

## Incident
HTTP 503 on /api/v2/predator/search - Database unavailable blocking production acceptance test

## Root Cause

**Primary Root Cause: PostgreSQL Not Installed**

The PREDATOR Analytics backend was configured to use PostgreSQL as its primary database, but PostgreSQL was not installed on the development machine. The application attempted to connect to localhost:5432, but no PostgreSQL service was running, resulting in connection refused errors.

**Secondary Root Cause: Incorrect Default Database User Configuration**

After installing PostgreSQL via Homebrew, the application still failed because the default database user configuration in `server/database/DatabaseClient.ts` was set to `'postgres'`. However, Homebrew's PostgreSQL installation uses the current OS user (`dima1203`) as the default superuser, not a dedicated `postgres` user. This caused authentication failures with error code `28000` (FATAL: role "postgres" does not exist).

## Evidence

### Initial Error Logs
```
GET /api/v2/predator/search?identifier=3111724753&limit=10
Query failed: error: connect ECONNREFUSED 127.0.0.1:5432
```

### PostgreSQL Status Check
```bash
$ lsof -ti:5432
# No output - PostgreSQL not running
```

### Database Configuration (Before Fix)
```typescript
// server/database/DatabaseClient.ts lines 147-154
const config: DatabaseConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  database: process.env['DB_NAME'] || 'predator',
  user: process.env['DB_USER'] || 'postgres',  // ❌ Wrong default
  password: process.env['DB_PASSWORD'] || 'postgres',
  ssl: process.env['DB_SSL'] === 'true'
};
```

### Authentication Error (After PostgreSQL Installation)
```
GET /api/v2/predator/health
Query failed: error: role "postgres" does not exist
code: '28000'
severity: 'FATAL'
routine: 'InitializeSessionUserId'
```

### Actual PostgreSQL Roles
```sql
                                   List of roles
 Role name |                         Attributes                         | Member of
-----------+------------------------------------------------------------+-----------
 dima1203  | Superuser, Create role, Create DB, Replication, Bypass RLS | {}
 postgres  | Superuser                                                  | {}
```

### Environment Variables
```bash
$ env | grep -E "DB_|POSTGRES|PG"
# No output - no database environment variables configured
```

## Impact

**Blocked Functionality:**
- Entity search via `/api/v2/predator/search`
- Entity card retrieval
- Evidence and provenance tracking
- All database-dependent features
- Production acceptance test for RNOCPP 3111724753

**System Status:**
- Frontend: ✅ Operational (serving static assets)
- Backend HTTP server: ✅ Running
- PostgreSQL: ❌ Not installed → ❌ Authentication failure → ✅ Fixed
- Database connectivity: ❌ 503 Service Unavailable → ✅ Healthy
- Search API: ❌ 503 error → ✅ 200 OK (no data)
- Production readiness: 🔴 BLOCKED → 🟡 PARTIALLY RESTORED

## Fix

### Step 1: Install PostgreSQL
```bash
brew install postgresql@14
```

### Step 2: Start PostgreSQL Service
```bash
brew services start postgresql@14
```

### Step 3: Create Database
```bash
/opt/homebrew/opt/postgresql@14/bin/createdb predator
```

### Step 4: Apply Schema
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d predator -f /Users/dima1203/Downloads/predator8/server/database/schema.sql
```

### Step 5: Fix Database User Configuration
**File:** `server/database/DatabaseClient.ts`
**Change:** Modified default user from `'postgres'` to `'dima1203'` to match Homebrew's PostgreSQL installation

```typescript
// Before (line 151)
user: process.env['DB_USER'] || 'postgres',

// After (line 151)
user: process.env['DB_USER'] || 'dima1203',
```

### Step 6: Restart Backend Server
```bash
# Killed existing server processes
npm run dev
```

## Verification

### PostgreSQL
**Status:** ✅ PASS
- Process running: Yes (PID 35367)
- Port listening: 5432
- Database exists: predator
- Schema applied: All 30+ tables created with indexes
- Current user: dima1203 (superuser)

### Schema
**Status:** ✅ PASS
- Tables created: entities, persons, companies, addresses, phones, emails, court_cases, sanctions, licenses, declarations, debts, assets, tenders, executive_cases, relationships, facts, evidence, card_instances, card_fields, validation_results, incidents, etc.
- Indexes created: All required indexes present
- Triggers created: update_updated_at_column function applied to all relevant tables
- Extensions: uuid-ossp enabled

### Migrations
**Status:** ✅ PASS
- Schema applied successfully via schema.sql
- No migration errors
- All tables and indexes created

### Backend DB Query
**Status:** ✅ PASS
- Database health check: `{"status":"HEALTHY","timestamp":"2026-08-12T18:08:17.238Z"}`
- Connection pool: Functional
- Query execution: Successful (84ms duration for search query)
- No authentication errors

### PREDATOR Search API
**Status:** ✅ PASS
- Endpoint: `GET /api/v2/predator/search?identifier=3111724753&limit=10`
- HTTP Status: 200 OK (previously 503)
- Response time: 94ms
- Database query executed: `SELECT e.*, c.edrpou FROM entities e JOIN companies c ON e.entity_id = c.entity_id WHERE c.edrpou = $1`
- Rows returned: 0 (correct - database is empty)

### Web UI
**Status:** ✅ PASS
- Frontend loads: Yes
- Search interface: Functional
- Search input: Accepts "3111724753"
- Search button: Triggers API call
- No 503 errors in console
- No authentication errors

### Search 3111724753
**Status:** ⚠️ PARTIAL PASS
- API call: Successful (200 OK)
- Database query: Executed successfully
- Result: 0 rows (database is empty - expected)
- **CRITICAL FINDING:** UI displays data from static frontend files (`src/osintData.ts`) instead of database
- The Inspector Panel shows "Кізима Дмитро Миколайович" with code "3111724753" but this is from static TypeScript data, not PostgreSQL
- Real database query returned 0 results, but UI shows entity information from mock/static data

## Remaining Problems

### 1. **CRITICAL: Data Source Confusion**
The PREDATOR UI is displaying entity data from static frontend files (`src/osintData.ts`, `src/data/dev5MasterSpecData.ts`) rather than from the PostgreSQL database. This creates a false impression that the system is working with real production data when it's actually showing static/demo data.

**Evidence:**
- Database query for 3111724753 returns 0 rows
- UI Inspector Panel shows detailed entity information for "Кізима Дмитро Миколайович"
- This data exists in `src/osintData.ts` as static TypeScript
- No data exists in PostgreSQL entities table

**Impact:**
- Production acceptance test cannot verify real data integrity
- Provenance tracking is bypassed
- Entity resolution is not using the intended database
- Risk of false positives in production

**Required Action:**
- Determine whether the system should use static data for development/demo purposes
- If production requires real database data, implement data ingestion pipeline
- If static data is acceptable for development, clearly label it as such
- Ensure production deployment uses only database-backed data

### 2. **No Production Data in Database**
The PostgreSQL database is completely empty (0 entities, 0 companies, 0 persons). The schema is in place but no data has been ingested from the 170+ Ukrainian registries.

**Impact:**
- Entity search returns no results
- Entity cards cannot be generated
- Evidence and provenance cannot be tracked
- Production acceptance test cannot verify data quality

**Required Action:**
- Implement data ingestion pipeline from Ukrainian registries
- Load test data for acceptance testing
- Verify data quality and provenance

### 3. **Missing Environment Configuration**
No environment variables are set for database configuration. The system relies on hardcoded defaults in `DatabaseClient.ts`.

**Current Defaults:**
- DB_HOST: localhost
- DB_PORT: 5432
- DB_NAME: predator
- DB_USER: dima1203 (OS-specific)
- DB_PASSWORD: (empty)

**Impact:**
- Not portable across environments
- Hardcoded OS-specific user (dima1203)
- No separation between dev/staging/production configurations
- Security risk (no password in dev)

**Required Action:**
- Create `.env` file with proper database configuration
- Use environment-specific configuration files
- Remove OS-specific hardcoded defaults
- Implement proper secret management for production

### 4. **Database Health Check Architecture Issue**
The `/health` endpoint returns 200 OK even when database health check fails. This is incorrect for production systems.

**Current Behavior:**
- Database health check fails → `/api/v2/predator/health` returns UNHEALTHY
- But overall `/health` endpoint still returns 200 OK

**Required Action:**
- Implement proper liveness vs readiness probes
- `/live` should check if Node process is running
- `/ready` should check if dependencies (PostgreSQL, Redis, etc.) are available
- `/health` should aggregate all health checks and return appropriate status

### 5. **API Routing Issue for /api/v2/predator/stats**
The endpoint `/api/v2/predator/stats` appears to fallback to serving `index.html` instead of returning JSON. This needs investigation.

## Production Status

**DATABASE RESTORED — READY FOR DATA INGESTION**

The database connectivity issue has been fully resolved:
- ✅ PostgreSQL installed and running
- ✅ Database schema applied
- ✅ Authentication fixed
- ✅ Backend successfully connects to database
- ✅ Search API executes real database queries
- ✅ No 503 errors

**HOWEVER - NOT READY FOR FULL PRODUCTION ACCEPTANCE TEST**

The system cannot proceed with the full black-box production acceptance test for RNOCPP 3111724753 because:

1. **Database is empty** - No entities, companies, or persons exist in PostgreSQL
2. **UI uses static data** - The interface displays data from `src/osintData.ts` instead of database
3. **No data ingestion** - No pipeline exists to load data from Ukrainian registries
4. **Cannot verify data integrity** - Without real database data, provenance and quality cannot be tested

**Next Steps Required:**

1. **Implement Data Ingestion:**
   - Load test entity data into PostgreSQL (at minimum: entity 3111724753)
   - Or implement connector pipeline to fetch from real registries
   - Verify data appears in database tables

2. **Resolve Data Source Architecture:**
   - Determine if static frontend data should be used for development
   - If yes, clearly separate dev/demo mode from production mode
   - If no, remove or disable static data sources in production

3. **Configure Environment:**
   - Create proper `.env` files for dev/staging/production
   - Remove OS-specific hardcoded defaults
   - Implement secret management

4. **Resume Acceptance Test:**
   - Only after real data exists in database
   - Only after UI displays database-backed data
   - Only after entity search returns database results

---

**Report Generated:** 2026-08-12
**Investigated By:** Cascade AI Assistant
**Database:** PostgreSQL 14.23 (Homebrew)
**Schema Version:** v7.0 Production
