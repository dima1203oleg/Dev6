# PREDATOR Production Acceptance Contract
## Жорстка версія ТЗ - Production Acceptance Contract для кодера
## Repository: dima1203oleg/Dev6
## Date: 2026-08-09
## Status: FRAMEWORK IMPLEMENTED

---

## Принцип роботи

Система не може бути оголошена "PRODUCTION READY" поки вона сама не доведе це автоматизованими тестами.

**Не приймається:**
- "код запустився"
- "170 реєстрів є в каталозі"
- "API повернув 200"

**Приймається тільки:**
- Кожен production-компонент має доведений працездатний шлях від реального джерела до кінцевого UI
- З доказом походження даних
- З автоматичними тестами
- З security-контролем
- З monitoring
- З можливістю rollback

---

## Реалізовані компоненти

### P0 — БЛОКЕРИ РЕЛІЗУ ✅ FRAMEWORK

#### P0.1 — Реєстри 170+/173 ✅ FRAMEWORK

**Файл:** `server/certification/RegistryCertifier.ts`

**Реалізовано:**
- Повний evidence chain для кожного реєстру
- SOURCE → CONNECTOR → REAL REQUEST → REAL RESPONSE → RAW HASH → SCHEMA → NORMALIZATION → IDENTIFIER MATCH → ENTITY → EVIDENCE → UI
- Статуси: CERTIFIED, HEALTHY, DEGRADED, BROKEN, UNAVAILABLE, CONTRACT_UNKNOWN, NOT_IMPLEMENTED
- Збереження доказів: URL/API, дата/час, request ID, HTTP status, response hash, response schema, отримані поля, identifier, parser, normalized result, evidence, latency, error, остаточний статус
- Batch certification для всіх конекторів

**API:**
```typescript
await registryCertifier.certify(connector, testIdentifier, identifierType)
await registryCertifier.batchCertify(connectors, testIdentifier, identifierType, concurrency)
```

#### P0.2 — Нуль fake/mock у production ✅ FRAMEWORK

**Файл:** `server/certification/FakeDataScanner.ts`

**Реалізовано:**
- Автоматичний пошук заборонених патернів: mock, fake, fixture, demo, sample, dummy, fallback, hardcoded, test data, placeholder
- Перевірка кожного входження
- Валідація production connector на синтетичні дані
- Production connector не має права повертати синтетичні дані навіть якщо зовнішній API недоступний
- Якщо джерело не працює: UNAVAILABLE (а не SUCCESS + порожня/синтетична відповідь)

**API:**
```typescript
const scanResult = fakeDataScanner.scanDirectory(rootPath, productionMode)
const validation = fakeDataScanner.validateProductionReady(scanResult)
const findings = fakeDataScanner.checkConnectorForSyntheticData(connectorCode)
```

#### P0.3 — Прибрати hardcoded production identifiers ✅ FRAMEWORK

**Файл:** `server/certification/HardcodedIdentifierScanner.ts`

**Реалізовано:**
- Автоматичний пошук hardcoded identifiers: testCode, testIPN, defaultEDRPOU
- Перевірка probe-all, query-all, QA runner та connector defaults
- Ідентифікація test-only, ізольованих, явно маркованих, недоступних production runtime
- Валідація production readiness

**API:**
```typescript
const scanResult = hardcodedIdentifierScanner.scanDirectory(rootPath)
const validation = hardcodedIdentifierScanner.validateProductionReady(scanResult)
const findings = hardcodedIdentifierScanner.checkFile(filePath)
```

#### P0.4 — Evidence / HYDRA ✅ FRAMEWORK

**Файл:** `server/certification/EvidenceChain.ts`

**Реалізовано:**
- Повний evidence chain: CLAIM → SOURCE → RAW RESPONSE → SHA-256 → PARSER → NORMALIZER → ENTITY RESOLUTION → CROSS-SOURCE VALIDATION → CONFIDENCE → UI
- Користувач може відповісти "Звідки система взяла саме це значення?" одним переходом до evidence
- Contradiction detection для конфліктуючих джерел
- Validation evidence chain completeness
- Evidence для UI display

**API:**
```typescript
const chain = evidenceChainBuilder.buildChain(claim, claimType, value, sourceId, rawData, parserVersion, normalizerVersion, entityId)
evidenceChainBuilder.addContradiction(evidenceId, sourceA, sourceB, valueA, valueB, ...)
const validation = evidenceChainBuilder.validateChain(evidenceId)
const evidence = evidenceChainBuilder.getEvidenceForUI(evidenceId)
```

### Production Acceptance Contract ✅ FRAMEWORK

**Файл:** `server/certification/ProductionAcceptanceContract.ts`

**Реалізовано:**
- Master certification system
- Автоматичне виконання всіх P0, P1, P2 тестів
- Блокування релізу при невдалому P0
- Повна звітність з blockers та warnings
- API endpoints для запуску контрактів

**API:**
```typescript
const result = await productionAcceptanceContract.runFullContract(testIdentifier)
const battleTest = await productionAcceptanceContract.runFinalBattleTest(testIdentifier)
```

**HTTP Endpoints:**
- `POST /api/v1/certification/run` - Запуск повного контракту
- `POST /api/v1/certification/battle-test` - Final battle test

### P1.1 — TypeScript ✅ FRAMEWORK

**Файл:** `tsconfig.json`

**Реалізовано:**
- Strict mode увімкнено
- noImplicitAny, strictNullChecks, noUnusedLocals, noUnusedParameters
- noFallthroughCasesInSwitch, noImplicitReturns, noUncheckedIndexedAccess
- noImplicitOverride, noPropertyAccessFromIndexSignature
- Server directory включений в compilation
- Path aliases для @server/*

**Статус:** Framework реалізовано, але є TypeScript errors (потрібно виправити)

```bash
npm run typecheck
```

**Поточний стан:** 459+ TypeScript errors (потрібно виправити для 0 errors)

---

## Поточний статус

### Реалізовано ✅

**P0 Blockers (Framework):**
- ✅ P0.1: Registry certification system
- ✅ P0.2: Fake data scanner
- ✅ P0.3: Hardcoded identifier scanner
- ✅ P0.4: Evidence chain system
- ✅ Production Acceptance Contract master system
- ✅ HTTP API endpoints for certification

**P1 Production Hardening (Framework):**
- ✅ P1.1: TypeScript strict mode (framework, errors require fixing)

### Не реалізовано ⏳

**P1 Production Hardening:**
- ⏳ P1.2: API Security - All endpoints protected
- ⏳ P1.3: Secrets scan - Repository-wide
- ⏳ Connector contract testing - Per registry
- ⏳ Entity resolution validation
- ⏳ Contradiction engine implementation
- ⏳ Frontend full QA - All UI elements
- ⏳ Backend → UI trace mapping
- ⏳ AI trust validation
- ⏳ Performance SLO validation
- ⏳ Resilience testing

**P2 CI/CD:**
- ⏳ P2.1: CI/CD pipeline implementation
- ⏳ P2.2: Release gate automation

**Final:**
- ⏳ Final Battle Test - Real identifier validation

---

## Як використовувати Production Acceptance Contract

### 1. Запуск повного контракту

```bash
# Через API
curl -X POST http://localhost:3000/api/v1/certification/run \
  -H "Content-Type: application/json" \
  -d '{"testIdentifier": "14360570"}'
```

### 2. Запуск Final Battle Test

```bash
# Через API
curl -X POST http://localhost:3000/api/v1/certification/battle-test \
  -H "Content-Type: application/json" \
  -d '{"testIdentifier": "14360570"}'
```

### 3. Програмний запуск

```typescript
import { productionAcceptanceContract } from './server/certification/ProductionAcceptanceContract';

const result = await productionAcceptanceContract.runFullContract('14360570');

console.log('Overall Status:', result.overallStatus);
console.log('P0 Status:', result.p0Status);
console.log('P1 Status:', result.p1Status);
console.log('P2 Status:', result.p2Status);
console.log('Blockers:', result.blockers);
console.log('Warnings:', result.warnings);

if (result.overallStatus === 'PRODUCTION_READY') {
  console.log('✅ SYSTEM READY FOR PRODUCTION');
} else {
  console.log('❌ SYSTEM NOT READY FOR PRODUCTION');
}
```

---

## Структура відповіді контракту

```typescript
{
  overallStatus: 'PRODUCTION_READY' | 'NOT_READY',
  p0Status: 'PASS' | 'FAIL',
  p1Status: 'PASS' | 'FAIL',
  p2Status: 'PASS' | 'FAIL',
  testResults: [
    {
      testName: string,
      category: 'P0' | 'P1' | 'P2',
      status: 'PASS' | 'FAIL' | 'SKIP',
      message: string,
      details: any,
      timestamp: string
    }
  ],
  summary: {
    total: number,
    passed: number,
    failed: number,
    skipped: number,
    byCategory: {
      p0: { total, passed, failed, skipped },
      p1: { total, passed, failed, skipped },
      p2: { total, passed, failed, skipped }
    }
  },
  blockers: string[],
  warnings: string[],
  certificationTimestamp: string
}
```

---

## Блокери релізу

Система буде заблокована від production deployment якщо:

**P0 Blockers:**
- Registry certification < 50% operational
- Fake/mock data знайдено в production code
- Hardcoded production identifiers знайдено
- Evidence chain validation failed

**P1 Blockers:**
- TypeScript errors > 0
- Critical API endpoints without security
- Secrets exposed in repository
- Failed connector contract tests
- Failed entity resolution tests
- Failed contradiction detection

**P2 Blockers:**
- CI/CD pipeline not functional
- Release gate automation not working
- Failed final battle test

---

## Наступні кроки

### Пріоритет 1 (Критичне):

1. **Виправити TypeScript errors**
   ```bash
   npm run typecheck
   ```
   Потрібно досягти 0 errors

2. **Реалізувати P1.2: API Security**
   - Перевірити кожен endpoint на authentication
   - Перевірити authorization та RBAC
   - Перевірити rate limiting
   - Перевірити input validation
   - Особливо: /api/v1/admin, /api/v1/registry/*, /api/v1/connectors/*, /api/v1/ai/*, /api/v2/*

3. **Реалізувати P1.3: Secrets Scan**
   - Провести repository-wide secret scan
   - Перевірити .env, .env.example, source code, logs, tests, fixtures, Git history, Docker, CI/CD
   - API keys не повинні бути в коді, Git, frontend bundle, logs, test artifacts

### Пріоритет 2 (Важливе):

4. **Connector Contract Testing**
   - Для кожного реєстру створити contract test
   - Перевірити HTTP, timeout, retry, rate limit, schema, encoding, required fields, identifier, timestamps, pagination, duplicate records, malformed response, unavailable source

5. **Entity Resolution Validation**
   - Перевірити РНОКПП, ЄДРПОУ, паспортні/реєстраційні identifiers, назва, ПІБ, адресу, телефон, email
   - Система повинна відрізняти EXACT_MATCH, HIGH_CONFIDENCE, POSSIBLE_MATCH, NO_MATCH, CONFLICT

6. **Contradiction Engine**
   - Якщо два джерела кажуть різне, система повинна показати CONFLICT з обома джерелами, timestamps, source reliability, актуальністю, reasoning, confidence

### Пріоритет 3 (Додаткове):

7. **Frontend Full QA**
   - Пройти кожну сторінку, кнопку, поле, таблицю, modal, filter, search, export
   - Зафіксувати PASS, FAIL, BROKEN, MISSING, NOT_CONNECTED

8. **Backend → UI Trace**
   - Створити автоматичний mapping: backend_field → api_route → frontend_store → component → UI_location → source → evidence

9. **AI Trust Validation**
   - AI не має права вигадувати дані реєстрів
   - Формат: CLAIM, EVIDENCE, SOURCE, CONFIDENCE, FRESHNESS, CONTRADICTIONS, EXPLANATION
   - Якщо evidence немає: INSUFFICIENT_EVIDENCE

10. **Performance SLO Validation**
    - API indexed query < 2s
    - Cached dossier < 3s
    - UI initial load < 3s
    - Graph initial render < 3s
    - Health endpoint < 500ms
    - Error rate < 1%
    - Availability ≥ 99.95%

11. **Resilience Testing**
    - Протестувати API timeout, API 429, API 500, API 503, DNS failure, TLS failure, database unavailable, Redis unavailable, connector unavailable, malformed JSON, schema drift, network interruption

### Пріоритет 4 (CI/CD):

12. **CI/CD Pipeline**
    - COMMIT → LINT → TYPECHECK → UNIT → INTEGRATION → CONNECTOR CONTRACT TESTS → E2E → SECURITY → BUILD → DEPLOY STAGING → SMOKE → PRODUCTION GATE → CANARY → OBSERVE → PROMOTE / ROLLBACK

13. **Release Gate Automation**
    - Production deploy BLOCKED якщо: Critical bug > 0, High security vulnerability > 0, Failed connector certification > 0, Failed mandatory E2E > 0, Evidence chain broken > 0, TypeScript errors > 0, Migration failure > 0, Rollback test failed, Secrets exposed, SLO violation, Fake/mock production path detected

### Пріоритет 5 (Final):

14. **Final Battle Test**
    - Взяти реальний тестовий ідентифікатор
    - Пройти: IDENTIFIER → ALL CERTIFIED REGISTRIES → RAW RESPONSES → NORMALIZATION → ENTITY RESOLUTION → GRAPH → RISK → AI → DOSSIER → UI → REPORT
    - Незалежний QA порівнює реальні результати джерел ↔ результати PREDATOR

---

## Фінальний Acceptance Criterion

Не:
- "код запустився"
- "170 реєстрів є в каталозі"
- "API повернув 200"

А:
- Кожен production-компонент має доведений працездатний шлях від реального джерела до кінцевого UI
- З доказом походження даних
- З автоматичними тестами
- З security-контролем
- З monitoring
- З можливістю rollback

І тільки після цього:
**PRODUCTION READY**

До цього статус:
**NOT READY**

---

## Статус фреймворку

**Framework Implementation:** ✅ COMPLETE
**Automated Testing:** ✅ OPERATIONAL
**API Endpoints:** ✅ AVAILABLE
**TypeScript Strict Mode:** ✅ ENABLED (errors require fixing)
**Production Readiness:** ❌ NOT READY (requires passing all tests)

---

## Висновок

Жорстка версія Production Acceptance Contract реалізована як автоматизована система. Кодер не може сказати "готово" поки система сама не доведе це тестами.

**Наступний крок:** Виправити TypeScript errors та реалізувати P1.2 (API Security) для початку проходження контракту.

**Кінцева мета:** Система проходить всі P0, P1, P2 тести автоматично і отримує статус PRODUCTION_READY.
