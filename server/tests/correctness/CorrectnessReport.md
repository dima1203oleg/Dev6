# PREDATOR Analytics - Registry Correctness Report

Date: 2026-08-06T13:26:41.975Z

## 12.1. Загальний підсумок
- Кількість реєстрів: 6
- Кількість успішних (ONLINE): 4
- Кількість з помилкою авторизації: 1
- Кількість з no data: 0

## 12.2. Деталі по кожному реєстру

| Source ID | Name | Status | Real Access | Valid | Empty | Invalid | Schema OK | Replayable |
|-----------|------|--------|-------------|-------|-------|---------|-----------|------------|
| edr_fop | ЄДР (FOP dataset) | **VERIFIED_ONLINE** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| UA-002 | Єдиний державний реєстр судових рішень | **VERIFIED_ONLINE** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| UA-003 | Реєстр санкцій (РНБО) | **VERIFIED_ONLINE** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| UA-004 | Система публічних закупівель Prozorro | **VERIFIED_ONLINE** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| INT-001 | HaveIBeenPwned (HIBP) | **AUTH_REQUIRED** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| INT-002 | Certificate Transparency Logs (crt.sh) | **FAILED** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
