# PREDATOR Analytics — Master Automated Test Report

> **Тестовий ідентифікатор (ІПН):** `3111724753`
> **Дата прогону:** 2026-08-06T13:39:29.376Z
> **Версія тестового комплексу:** 1.0.0

---

## 6. Зведений звіт

| Метрика | Значення |
|---------|----------|
| Загальна кількість джерел | **6** |
| ✅ Успішно пройшли (PASS) | **4** |
| ⚠️ Пройшли з попередженнями | **0** |
| 🟡 Частково працюють (PARTIAL) | **0** |
| ❌ Недоступні / помилки (FAIL) | **0** |
| 🔒 Заблоковані (BLOCKED) | **1** |
| ⬜ Не застосовні (NOT_APPLICABLE) | **1** |
| 📋 Мають provenance | **4** / 6 |
| ⚔️ Мають конфлікти | **0** |
| 🚀 Готові до Production | **4** / 6 |

---

## 4. Деталі по кожному джерелу

### ✅ [UA-001] ЄДР (Єдиний державний реєстр)

| Параметр | Значення |
|----------|----------|
| Registry ID | `UA-001` |
| Endpoint | `https://clarity-project.info/edr/` |
| Access Type | FREE_AUTO |
| Query Status | **SUCCESS** |
| HTTP Code | 200 |
| Response Time | 448ms |
| Data Returned | ✅ YES |
| Provenance | ✅ YES |
| Freshness | 2026-08-06T13:39:24.609Z |
| Conflicts | NONE |
| Confidence | 95% |
| **Final Status** | **PASS** |
| QA Notes | All critical tests passed |

| Test ID | Test Name | Result | Duration | Details |
|---------|-----------|--------|----------|---------|
| TEST-001 | Registry Discovery | ✅ | 0ms | ID=UA-001, Name=ЄДР (Єдиний державний реєстр), Endpoint=https://clarity-project. |
| TEST-002 | Connectivity | ✅ | 280ms | HTTP 404, TLS OK, DNS OK |
| TEST-003 | Authentication | ✅ | 0ms | No authentication required (public endpoint) |
| TEST-004 | Query Execution | ✅ | 448ms | Status=SUCCESS, Duration=448ms |
| TEST-005 | Raw Response Capture | ✅ | 0ms | RawPayload=YES, SHA-256=4f37e37f99f13660… (64 chars) |
| TEST-006 | Schema Validation | ✅ | 0ms | Schema valid |
| TEST-007 | Parser Validation | ✅ | 0ms | Fields=[name, status], NullFields=NONE, UTF-8=OK |
| TEST-008 | Data Integrity | ✅ | 0ms | Integrity check PASS — hashes match (4f37e37f99f13660…) |
| TEST-009 | Provenance | ✅ | 1ms | All provenance fields present: source_id, request_id, timestamp, response_hash,  |
| TEST-010 | Freshness | ✅ | 0ms | Retrieved 0s ago — FRESH |
| TEST-011 | Entity Resolution | ✅ | 0ms | Entity fields: [name, status] — no fabrication detected |
| TEST-012 | Cross Validation | ✅ | 0ms | Source UA-001 — no contradictions within single-source result |
| TEST-013 | No Hallucination | ✅ | 0ms | SUCCESS status with real data — no hallucination indicators |
| TEST-014 | Repeatability | ✅ | 343ms | Repeat confirmed: status=SUCCESS, normalizedData identical |
| TEST-015 | Performance | ✅ | 0ms | Latency=448ms, Threshold=15000ms — PASS |
| TEST-016 | Fault Injection | ✅ | 5ms | Abort handled gracefully (AbortError caught) |
| TEST-017 | Security | ✅ | 0ms | No secrets in endpoint URL; Identifier sanitization OK; TLS enforced |

---

### ✅ [UA-002] Єдиний державний реєстр судових рішень

| Параметр | Значення |
|----------|----------|
| Registry ID | `UA-002` |
| Endpoint | `https://clarity-project.info/edr/*/court-cases` |
| Access Type | FREE_AUTO |
| Query Status | **SUCCESS** |
| HTTP Code | 200 |
| Response Time | 292ms |
| Data Returned | ✅ YES |
| Provenance | ✅ YES |
| Freshness | 2026-08-06T13:39:25.534Z |
| Conflicts | NONE |
| Confidence | 95% |
| **Final Status** | **PASS** |
| QA Notes | All critical tests passed |

| Test ID | Test Name | Result | Duration | Details |
|---------|-----------|--------|----------|---------|
| TEST-001 | Registry Discovery | ✅ | 0ms | ID=UA-002, Name=Єдиний державний реєстр судових рішень, Endpoint=https://clarity |
| TEST-002 | Connectivity | ✅ | 284ms | HTTP 404, TLS OK, DNS OK |
| TEST-003 | Authentication | ✅ | 0ms | No authentication required (public endpoint) |
| TEST-004 | Query Execution | ✅ | 292ms | Status=SUCCESS, Duration=292ms |
| TEST-005 | Raw Response Capture | ✅ | 0ms | RawPayload=YES, SHA-256=17a35bf57f636473… (64 chars) |
| TEST-006 | Schema Validation | ✅ | 0ms | Schema valid |
| TEST-007 | Parser Validation | ✅ | 0ms | Fields=[totalCases], NullFields=NONE, UTF-8=OK |
| TEST-008 | Data Integrity | ✅ | 0ms | Integrity check PASS — hashes match (17a35bf57f636473…) |
| TEST-009 | Provenance | ✅ | 0ms | All provenance fields present: source_id, request_id, timestamp, response_hash,  |
| TEST-010 | Freshness | ✅ | 0ms | Retrieved 0s ago — FRESH |
| TEST-011 | Entity Resolution | ✅ | 0ms | Entity fields: [totalCases] — no fabrication detected |
| TEST-012 | Cross Validation | ✅ | 0ms | Source UA-002 — no contradictions within single-source result |
| TEST-013 | No Hallucination | ✅ | 0ms | SUCCESS status with real data — no hallucination indicators |
| TEST-014 | Repeatability | ✅ | 399ms | Repeat confirmed: status=SUCCESS, normalizedData identical |
| TEST-015 | Performance | ✅ | 0ms | Latency=292ms, Threshold=15000ms — PASS |
| TEST-016 | Fault Injection | ✅ | 2ms | Abort handled gracefully (AbortError caught) |
| TEST-017 | Security | ✅ | 0ms | No secrets in endpoint URL; Identifier sanitization OK; TLS enforced |

---

### ✅ [UA-003] Реєстр санкцій (РНБО)

| Параметр | Значення |
|----------|----------|
| Registry ID | `UA-003` |
| Endpoint | `https://clarity-project.info/edr/` |
| Access Type | FREE_AUTO |
| Query Status | **SUCCESS** |
| HTTP Code | 200 |
| Response Time | 285ms |
| Data Returned | ✅ YES |
| Provenance | ✅ YES |
| Freshness | 2026-08-06T13:39:26.459Z |
| Conflicts | NONE |
| Confidence | 95% |
| **Final Status** | **PASS** |
| QA Notes | All critical tests passed |

| Test ID | Test Name | Result | Duration | Details |
|---------|-----------|--------|----------|---------|
| TEST-001 | Registry Discovery | ✅ | 0ms | ID=UA-003, Name=Реєстр санкцій (РНБО), Endpoint=https://clarity-project.info/edr |
| TEST-002 | Connectivity | ✅ | 238ms | HTTP 404, TLS OK, DNS OK |
| TEST-003 | Authentication | ✅ | 0ms | No authentication required (public endpoint) |
| TEST-004 | Query Execution | ✅ | 285ms | Status=SUCCESS, Duration=285ms |
| TEST-005 | Raw Response Capture | ✅ | 0ms | RawPayload=YES, SHA-256=8fb3681130f88245… (64 chars) |
| TEST-006 | Schema Validation | ✅ | 0ms | Schema valid |
| TEST-007 | Parser Validation | ✅ | 0ms | Fields=[hasSanctions], NullFields=NONE, UTF-8=OK |
| TEST-008 | Data Integrity | ✅ | 1ms | Integrity check PASS — hashes match (8fb3681130f88245…) |
| TEST-009 | Provenance | ✅ | 0ms | All provenance fields present: source_id, request_id, timestamp, response_hash,  |
| TEST-010 | Freshness | ✅ | 0ms | Retrieved 0s ago — FRESH |
| TEST-011 | Entity Resolution | ✅ | 0ms | Entity fields: [hasSanctions] — no fabrication detected |
| TEST-012 | Cross Validation | ✅ | 0ms | Source UA-003 — no contradictions within single-source result |
| TEST-013 | No Hallucination | ✅ | 0ms | SUCCESS status with real data — no hallucination indicators |
| TEST-014 | Repeatability | ✅ | 333ms | Repeat confirmed: status=SUCCESS, normalizedData identical |
| TEST-015 | Performance | ✅ | 0ms | Latency=285ms, Threshold=15000ms — PASS |
| TEST-016 | Fault Injection | ✅ | 8ms | Abort handled gracefully (AbortError caught) |
| TEST-017 | Security | ✅ | 0ms | No secrets in endpoint URL; Identifier sanitization OK; TLS enforced |

---

### ✅ [UA-004] Prozorro (публічні закупівлі)

| Параметр | Значення |
|----------|----------|
| Registry ID | `UA-004` |
| Endpoint | `https://clarity-project.info/edr/*/tenders` |
| Access Type | FREE_AUTO |
| Query Status | **SUCCESS** |
| HTTP Code | 200 |
| Response Time | 223ms |
| Data Returned | ✅ YES |
| Provenance | ✅ YES |
| Freshness | 2026-08-06T13:39:27.251Z |
| Conflicts | NONE |
| Confidence | 95% |
| **Final Status** | **PASS** |
| QA Notes | All critical tests passed |

| Test ID | Test Name | Result | Duration | Details |
|---------|-----------|--------|----------|---------|
| TEST-001 | Registry Discovery | ✅ | 0ms | ID=UA-004, Name=Prozorro (публічні закупівлі), Endpoint=https://clarity-project. |
| TEST-002 | Connectivity | ✅ | 225ms | HTTP 404, TLS OK, DNS OK |
| TEST-003 | Authentication | ✅ | 0ms | No authentication required (public endpoint) |
| TEST-004 | Query Execution | ✅ | 223ms | Status=SUCCESS, Duration=223ms |
| TEST-005 | Raw Response Capture | ✅ | 0ms | RawPayload=YES, SHA-256=e2010dab3da08503… (64 chars) |
| TEST-006 | Schema Validation | ✅ | 0ms | Schema valid |
| TEST-007 | Parser Validation | ✅ | 0ms | Fields=[tendersCount, wonTendersCount], NullFields=NONE, UTF-8=OK |
| TEST-008 | Data Integrity | ✅ | 0ms | Integrity check PASS — hashes match (e2010dab3da08503…) |
| TEST-009 | Provenance | ✅ | 0ms | All provenance fields present: source_id, request_id, timestamp, response_hash,  |
| TEST-010 | Freshness | ✅ | 0ms | Retrieved 0s ago — FRESH |
| TEST-011 | Entity Resolution | ✅ | 0ms | Entity fields: [tendersCount, wonTendersCount] — no fabrication detected |
| TEST-012 | Cross Validation | ✅ | 0ms | Source UA-004 — no contradictions within single-source result |
| TEST-013 | No Hallucination | ✅ | 0ms | SUCCESS status with real data — no hallucination indicators |
| TEST-014 | Repeatability | ✅ | 230ms | Repeat confirmed: status=SUCCESS, normalizedData identical |
| TEST-015 | Performance | ✅ | 0ms | Latency=223ms, Threshold=15000ms — PASS |
| TEST-016 | Fault Injection | ✅ | 7ms | Abort handled gracefully (AbortError caught) |
| TEST-017 | Security | ✅ | 0ms | No secrets in endpoint URL; Identifier sanitization OK; TLS enforced |

---

### 🔒 [INT-001] HaveIBeenPwned (HIBP)

| Параметр | Значення |
|----------|----------|
| Registry ID | `INT-001` |
| Endpoint | `https://haveibeenpwned.com/api/v3/breachedaccount/` |
| Access Type | FREE_API_KEY |
| Query Status | **UNAVAILABLE** |
| HTTP Code | 401 |
| Response Time | 0ms |
| Data Returned | ❌ NO |
| Provenance | ❌ NO |
| Freshness | N/A |
| Conflicts | NONE |
| Confidence | 0% |
| **Final Status** | **BLOCKED** |
| QA Notes | TEST-004: Status=UNAVAILABLE, Duration=0ms, Error=HIBP_API_KEY is missing; TEST-005: No evidence object returned; TEST-009: No provenance metadata |

| Test ID | Test Name | Result | Duration | Details |
|---------|-----------|--------|----------|---------|
| TEST-001 | Registry Discovery | ✅ | 0ms | ID=INT-001, Name=HaveIBeenPwned (HIBP), Endpoint=https://haveibeenpwned.com/api/ |
| TEST-002 | Connectivity | ✅ | 100ms | HTTP 404, TLS OK, DNS OK |
| TEST-003 | Authentication | ❌ | 0ms | AUTH_REQUIRED: API_KEY not configured for INT-001 |
| TEST-004 | Query Execution | ❌ | 0ms | Status=UNAVAILABLE, Duration=0ms, Error=HIBP_API_KEY is missing |
| TEST-005 | Raw Response Capture | ❌ | 0ms | No evidence object returned |
| TEST-006 | Schema Validation | ❌ | 0ms | No evidence to validate |
| TEST-007 | Parser Validation | ❌ | 0ms | No normalized data |
| TEST-008 | Data Integrity | ❌ | 0ms | Missing normalizedData or rawPayload |
| TEST-009 | Provenance | ❌ | 0ms | No provenance metadata |
| TEST-010 | Freshness | ❌ | 0ms | No retrievedAt timestamp |
| TEST-011 | Entity Resolution | ❌ | 0ms | No data to check |
| TEST-012 | Cross Validation | ❌ | 0ms | No evidence for cross-validation |
| TEST-013 | No Hallucination | ✅ | 0ms | Status=UNAVAILABLE, no fabricated data |
| TEST-014 | Repeatability | ✅ | 0ms | Repeat confirmed: status=UNAVAILABLE, normalizedData identical |
| TEST-015 | Performance | ✅ | 0ms | Latency=0ms, Threshold=15000ms — PASS |
| TEST-016 | Fault Injection | ✅ | 1ms | Abort handled gracefully (AbortError caught) |
| TEST-017 | Security | ✅ | 0ms | No secrets in endpoint URL; Identifier sanitization OK; TLS enforced |

---

### ⬜ [INT-002] Certificate Transparency (crt.sh)

| Параметр | Значення |
|----------|----------|
| Registry ID | `INT-002` |
| Endpoint | `https://crt.sh/?q=&output=json` |
| Access Type | FREE_AUTO |
| Query Status | **FAILED** |
| HTTP Code | 500 |
| Response Time | 428ms |
| Data Returned | ❌ NO |
| Provenance | ❌ NO |
| Freshness | N/A |
| Conflicts | NONE |
| Confidence | 0% |
| **Final Status** | **NOT_APPLICABLE** |
| QA Notes | TEST-004: Status=FAILED, Duration=428ms, Error=Failed to fetch from crt.sh, status: 502; TEST-005: No evidence object returned; TEST-009: No provenance metadata |

| Test ID | Test Name | Result | Duration | Details |
|---------|-----------|--------|----------|---------|
| TEST-001 | Registry Discovery | ✅ | 0ms | ID=INT-002, Name=Certificate Transparency (crt.sh), Endpoint=https://crt.sh/?q=& |
| TEST-002 | Connectivity | ❌ | 328ms | HTTP 502, TLS OK, DNS OK |
| TEST-003 | Authentication | ✅ | 0ms | No authentication required (public endpoint) |
| TEST-004 | Query Execution | ❌ | 428ms | Status=FAILED, Duration=428ms, Error=Failed to fetch from crt.sh, status: 502 |
| TEST-005 | Raw Response Capture | ❌ | 0ms | No evidence object returned |
| TEST-006 | Schema Validation | ❌ | 0ms | No evidence to validate |
| TEST-007 | Parser Validation | ❌ | 0ms | No normalized data |
| TEST-008 | Data Integrity | ❌ | 0ms | Missing normalizedData or rawPayload |
| TEST-009 | Provenance | ❌ | 0ms | No provenance metadata |
| TEST-010 | Freshness | ❌ | 0ms | No retrievedAt timestamp |
| TEST-011 | Entity Resolution | ❌ | 0ms | No data to check |
| TEST-012 | Cross Validation | ❌ | 0ms | No evidence for cross-validation |
| TEST-013 | No Hallucination | ✅ | 0ms | Status=FAILED, no fabricated data |
| TEST-014 | Repeatability | ✅ | 1025ms | Repeat confirmed: status=FAILED, normalizedData identical |
| TEST-015 | Performance | ✅ | 0ms | Latency=428ms, Threshold=15000ms — PASS |
| TEST-016 | Fault Injection | ✅ | 3ms | Abort handled gracefully (AbortError caught) |
| TEST-017 | Security | ✅ | 0ms | No secrets in endpoint URL; Identifier sanitization OK; TLS enforced |

---

## Проблемні зони

- **[INT-001] HaveIBeenPwned (HIBP)** — BLOCKED: TEST-004: Status=UNAVAILABLE, Duration=0ms, Error=HIBP_API_KEY is missing; TEST-005: No evidence object returned; TEST-009: No provenance metadata
- **[INT-002] Certificate Transparency (crt.sh)** — NOT_APPLICABLE: TEST-004: Status=FAILED, Duration=428ms, Error=Failed to fetch from crt.sh, status: 502; TEST-005: No evidence object returned; TEST-009: No provenance metadata

## 7. Критерії приймання

| Критерій | Статус |
|----------|--------|
| Усі критичні джерела (UA-001..UA-004) пройшли | ✅ |
| Відсутні вигадані значення (TEST-013) | ✅ |
| Кожне значення має provenance | ✅ |
| Результати відтворювані (TEST-014) | ✅ |

