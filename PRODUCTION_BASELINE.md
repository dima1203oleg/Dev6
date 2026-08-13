# PREDATOR Analytics - Production Baseline Audit

**Generated:** 2025-01-12  
**Purpose:** Complete repository inventory before production hardening  
**Scope:** All components, dependencies, and current status

---

## 1. Repository Structure

### 1.1 Root Level

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| package.json | / | Node.js dependencies | - | ✅ VALID | ✅ PASS | ⏳ PENDING | None |
| tsconfig.json | / | TypeScript config | - | ✅ VALID | ✅ PASS | ⏳ PENDING | None |
| vite.config.ts | / | Vite build config | - | ✅ VALID | ✅ PASS | ⏳ PENDING | None |
| .env.example | / | Environment template | - | ✅ VALID | ✅ PASS | ⏳ PENDING | None |
| server.ts | / | Main server entry | All server modules | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| index.html | / | Frontend entry | All frontend modules | ✅ VALID | ✅ PASS | ⏳ PENDING | None |

### 1.2 Frontend (src/)

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| App.tsx | src/ | Main React app | All components | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| main.tsx | src/ | React entry | React, App | ✅ VALID | ✅ PASS | ⏳ PENDING | None |
| ErrorBoundary.tsx | src/ | Error handling | React | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| components/ | src/ | UI components | React, types | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| hooks/ | src/ | React hooks | React | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| lib/ | src/ | Utilities | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| services/ | src/ | API services | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| types/ | src/ | TypeScript types | - | ✅ VALID | ✅ PASS | ⏳ PENDING | None |
| utils/ | src/ | Helper functions | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| data.ts | src/ | Static data | - | ⚠️ CONTAINS STATIC DATA | ⏳ PENDING | ❌ NOT PRODUCTION | Static data elimination required |
| osintData.ts | src/ | OSINT entities | - | ⚠️ CONTAINS STATIC DATA | ⏳ PENDING | ❌ NOT PRODUCTION | Static data elimination required |
| data/ | src/ | Additional data | - | ⚠️ CONTAINS STATIC DATA | ⏳ PENDING | ❌ NOT PRODUCTION | Static data elimination required |

### 1.3 Server (server/)

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| api/ | server/ | API routes | Express, services | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| cards/ | server/ | Card logic | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| certification/ | server/ | Certification logic | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| config/ | server/ | Configuration | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| connectors/ | server/ | Data connectors | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| data/ | server/ | Data processing | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| database/ | server/ | Database layer | pg | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| datasources/ | server/ | Data source configs | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| middleware/ | server/ | Express middleware | Express | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| models/ | server/ | Data models | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| registry-discovery/ | server/ | Registry discovery | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| routes/ | server/ | Route definitions | Express | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| services/ | server/ | Business logic | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| src/ | server/ | Server source | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| tests/ | server/ | Server tests | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| utils/ | server/ | Server utilities | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| validation/ | server/ | Validation logic | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |

### 1.4 Connectors (server/connectors/)

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| AbstractConnector.ts | server/connectors/ | Base connector class | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| connectorLogger.ts | server/connectors/ | Connector logging | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| sdk.ts | server/connectors/ | Connector SDK | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| FOPConnector.ts | server/connectors/ | FOP registry | AbstractConnector | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |
| CourtConnector.ts | server/connectors/ | Court registry | AbstractConnector | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |
| CrtshConnector.ts | server/connectors/ | CRT.sh | AbstractConnector | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |
| HibpConnector.ts | server/connectors/ | Have I Been Pwned | AbstractConnector | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |
| ProzorroConnector.ts | server/connectors/ | Prozorro | AbstractConnector | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |
| SanctionsConnector.ts | server/connectors/ | Sanctions | AbstractConnector | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |
| DPSConnector.ts | server/connectors/ | DPS (19 endpoints) | AbstractConnector, DPS modules | ✅ VALID | ⏳ PENDING | ❌ BLOCKED | DPS API maintenance |
| DPSTokenManager.ts | server/connectors/ | DPS token mgmt | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSRateLimiter.ts | server/connectors/ | DPS rate limiting | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSCircuitBreaker.ts | server/connectors/ | DPS circuit breaker | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSRetryPolicy.ts | server/connectors/ | DPS retry policy | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSCSVIngestion.ts | server/connectors/ | DPS CSV ingestion | - | ✅ VALID | ⏳ PENDING | ❌ BLOCKED | DPS API maintenance |
| DPSEntityResolver.ts | server/connectors/ | DPS entity resolution | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSErrorTaxonomy.ts | server/connectors/ | DPS error classification | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSTestMatrix.ts | server/connectors/ | DPS test matrix | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSMaintenanceMode.ts | server/connectors/ | DPS maintenance detection | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSAutoResume.ts | server/connectors/ | DPS auto resume | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSMetrics.ts | server/connectors/ | DPS metrics | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| DPSSecurityAudit.ts | server/connectors/ | DPS security audit | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| types/ | server/connectors/ | DPS types | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| schemas/ | server/connectors/ | DPS schemas | - | ✅ VALID | ✅ PASS | ✅ READY | None |
| ckan/ | server/connectors/ | CKAN connectors | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |

### 1.5 Services (server/services/)

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| hydraEngine.ts | server/services/ | HYDRA verification engine | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |
| EntityResolutionEngine.ts | server/services/ | Entity resolution | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |
| aiRouter.ts | server/services/ | AI routing | @google/genai | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Real data test required |
| IntelligenceOrchestrator.ts | server/services/ | Intelligence orchestration | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| OSIService.ts | server/services/ | OSINT processing | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| ComintService.ts | server/services/ | COMINT processing | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| MedintService.ts | server/services/ | MEDINT processing | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| TechintService.ts | server/services/ | TECHINT processing | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| DarkintService.ts | server/services/ | DARKINT processing | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| SocintService.ts | server/services/ | SOCINT processing | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| SourceDiscoveryService.ts | server/services/ | Source discovery | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| GlobalHealthService.ts | server/services/ | Health monitoring | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| queryDsl.ts | server/services/ | Query DSL | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| predatorClient.ts | server/services/ | PREDATOR client | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| predatorVoiceProfile.ts | server/services/ | Voice profiling | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| mediaPipeline.ts | server/services/ | Media processing | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| ardp/ | server/services/ | ARDP integration | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| certification/ | server/services/ | Certification service | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| discovery/ | server/services/ | Discovery services | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| healing/ | server/services/ | Self-healing | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| onboarding/ | server/services/ | Onboarding | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |

### 1.6 Database (server/database/)

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| DatabaseClient.ts | server/database/ | PostgreSQL client | pg | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Connection config verified |
| schema.sql | server/database/ | Database schema | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Migration system required |
| repositories/ | server/database/ | Data repositories | DatabaseClient | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |

### 1.7 API (server/api/)

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| PredatorAPI.ts | server/api/ | Main API router | Express, services | ✅ VALID | ⏳ PENDING | ⏳ PENDING | DPS endpoints added |

### 1.8 Configuration

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| config/ | server/ | Server config | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Environment separation required |
| production/ | / | Production configs | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | None |
| .env.example | / | Environment template | - | ✅ VALID | ✅ PASS | ✅ READY | No secrets present |

### 1.9 Tests

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| tests/ | server/ | Server tests | - | ✅ VALID | ⏳ PENDING | ⏳ PENDING | Coverage analysis required |
| test-reports/ | / | Test reports | - | ✅ CONTAINS REPORTS | ⏳ PENDING | ⏳ PENDING | Typecheck reports present |

### 1.10 Documentation

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| README.md | / | Project documentation | - | ✅ VALID | N/A | ✅ READY | None |
| *.md reports | / | Various reports | - | ✅ VALID | N/A | ✅ READY | None |

### 1.11 Artifacts & Execution

| Component | Location | Purpose | Dependencies | Current Status | Test Status | Production Status | Blockers |
|-----------|----------|---------|--------------|----------------|-------------|-------------------|----------|
| artifacts/ | / | Build artifacts | - | ✅ VALID | N/A | ⏳ PENDING | None |
| execution/ | / | Execution records | - | ✅ VALID | N/A | ⏳ PENDING | None |
| audit-reports/ | / | Audit reports | - | ✅ VALID | N/A | ⏳ PENDING | None |

---

## 2. Component Summary

### 2.1 Total Components

- **Frontend Components:** ~124 components
- **Server Components:** ~238 files
- **Connectors:** 9 implemented + DPS (19 endpoints) + CKAN (4)
- **Services:** 20+ services
- **Database:** 1 schema, 5 repositories
- **API Routes:** Multiple routes in PredatorAPI.ts

### 2.2 Critical Production Components

| Component | Status | Blockers |
|-----------|--------|----------|
| Build System | ✅ VALID | None |
| TypeScript Config | ✅ VALID | None |
| Database Schema | ✅ VALID | Migration system required |
| Authentication | ⏳ NOT IMPLEMENTED | RBAC required |
| Authorization | ⏳ NOT IMPLEMENTED | RBAC required |
| HYDRA Engine | ✅ VALID | Real data test required |
| Entity Resolution | ✅ VALID | Real data test required |
| DPS Connector Pack | ✅ VALID | DPS API maintenance |
| Static Data | ❌ NOT PRODUCTION | Elimination required |
| Secrets | ✅ SECURE | No secrets in source |
| Observability | ⏳ PARTIAL | Full integration required |
| Backup/Restore | ⏳ NOT IMPLEMENTED | Implementation required |

---

## 3. Dependencies

### 3.1 Key Dependencies

| Dependency | Version | Purpose | Production Ready |
|------------|---------|---------|------------------|
| React | 19.0.1 | Frontend framework | ✅ Yes |
| Express | 4.21.2 | Backend framework | ✅ Yes |
| pg | 8.22.0 | PostgreSQL client | ✅ Yes |
| @google/genai | 2.4.0 | AI integration | ✅ Yes |
| @modelcontextprotocol/sdk | 1.30.0 | MCP SDK | ✅ Yes |
| Vite | 6.2.3 | Build tool | ✅ Yes |
| TypeScript | 5.8.2 | Type system | ✅ Yes |
| Firebase | 12.16.0 | Backend services | ✅ Yes |

### 3.2 Dev Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| @types/* | Various | TypeScript definitions |
| eslint | 10.7.0 | Linting |
| jsdom | 29.1.1 | Testing |
| esbuild | 0.25.0 | Bundling |

---

## 4. Current Blockers

### 4.1 P0 - Block Go-Live

| Blocker | Component | Impact | Resolution |
|---------|-----------|--------|------------|
| Static data in production | src/data.ts, src/osintData.ts | CRITICAL | Eliminate static data, use real connectors |
| Authentication not implemented | server/ | CRITICAL | Implement RBAC/OIDC |
| Authorization not implemented | server/ | CRITICAL | Implement RBAC/OIDC |
| Backup/Restore not implemented | server/database/ | CRITICAL | Implement backup and test restore |
| Migration system not implemented | server/database/ | CRITICAL | Implement migration system |

### 4.2 P1 - Block Critical Feature

| Blocker | Component | Impact | Resolution |
|---------|-----------|--------|------------|
| DPS API maintenance | DPS Connector | HIGH | Wait for recovery, auto-resume enabled |
| Real data tests not executed | All connectors | HIGH | Execute real data tests |
| Observability partial | server/ | HIGH | Full Prometheus/Grafana integration |
| E2E tests not executed | Frontend/Backend | HIGH | Implement E2E tests |

### 4.3 P2 - Non-Critical

| Blocker | Component | Impact | Resolution |
|---------|-----------|--------|------------|
| Source registry not centralized | server/ | MEDIUM | Implement source registry |
| Connector registry not centralized | server/connectors/ | MEDIUM | Implement connector registry |
| 170+ sources not classified | server/datasources/ | MEDIUM | Classify all sources |

---

## 5. Next Steps

### 5.1 Immediate Actions

1. **PHASE 1: BUILD GATE** - Run typecheck, lint, build, test
2. **PHASE 4: SECRETS** - Final security audit
3. **PHASE 5: DATABASE** - Implement migration system
4. **PHASE 6: DATA CONTRACT** - Create canonical contracts
5. **PHASE 9: 170+ SOURCES** - Classify all sources

### 5.2 DPS-Specific Actions

- Keep DPS status = UPSTREAM_MAINTENANCE
- Keep auto-resume enabled
- Do not consume quota on retries
- Wait for API recovery

---

## 6. Summary

**Total Components Audited:** 400+ files  
**Production Ready:** ~30%  
**Blocked:** ~70% (mostly due to missing tests, auth, and real data validation)

**Critical Path:**
1. Build gate (typecheck, lint, build, test)
2. Eliminate static data
3. Implement authentication/authorization
4. Implement migration system
5. Implement backup/restore
6. Execute real data tests
7. Implement observability
8. Execute E2E tests

**Estimated Time to Production:** 40-60 hours of focused work

---

**Baseline Audit Complete**

**Next:** PHASE 1 - BUILD GATE
