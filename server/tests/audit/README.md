# PREDATOR Analytics - End-to-End Data Flow Audit Framework

Цей фреймворк проводить комплексний аудит data flow між backend та Web UI для виявлення місць втрати даних.

## Завдання

Фреймворк виконує наступні 10 завдань:

1. **End-to-End Audit** - Аудит всього pipeline від Registry Connectors до React Components
2. **Data Flow Report** - Звіт про потік даних для кожної категорії
3. **EntityCardBuilder Check** - Перевірка на відсутні категорії в Entity Card Builder
4. **REST API Check** - Перевірка повноти відповіді REST API
5. **Frontend Mapping Check** - Перевірка узгодженості мапінгу frontend
6. **React Components Check** - Перевірка рендерингу даних в React компонентах
7. **Placeholder Removal** - Видалення placeholder логіки для реальних даних
8. **Automatic Coverage Test** - Тест покриття (Connector Count == Builder Count == API Count == UI Count)
9. **Data Consistency Validator** - Валідатор узгодженості даних
10. **IPN Verification** - Фінальна верифікація для IPN 3111724753

## Структура

```
server/tests/audit/
├── DataFlowAudit.ts              # End-to-End аудит pipeline
├── EntityCardBuilderAudit.ts      # Аудит Entity Card Builder
├── RestAPIAudit.ts               # Аудит REST API
├── FrontendMappingAudit.ts       # Аудит мапінгу frontend
├── ReactComponentsAudit.ts        # Аудит React компонентів
├── PlaceholderRemovalAudit.ts     # Аудит placeholder логіки
├── AutomaticCoverageTest.ts      # Automatic Coverage Test
├── DataConsistencyValidator.ts   # Data Consistency Validator
├── IPNVerificationAudit.ts       # IPN Verification (acceptance test)
├── runAuditTests.ts              # Головний runner скрипт
└── README.md                     # Цей файл
```

## Використання

### Запустити всі аудити

```bash
npm run test:audit
```

### Запустити конкретний аудит

```bash
# Тільки Data Flow Audit
npm run test:audit -- --data-flow

# Тільки Entity Card Builder Audit
npm run test:audit -- --entity-card

# Тільки REST API Audit
npm run test:audit -- --rest-api

# Тільки Frontend Mapping Audit
npm run test:audit -- --frontend-mapping

# Тільки React Components Audit
npm run test:audit -- --react-components

# Тільки Placeholder Removal Audit
npm run test:audit -- --placeholder

# Тільки Automatic Coverage Test
npm run test:audit -- --coverage

# Тільки Data Consistency Validator
npm run test:audit -- --consistency

# Тільки IPN Verification (acceptance test)
npm run test:audit -- --ipn-verification
```

### Запустити з кастомним IPN

```bash
npm run test:audit -- -i 1234567890
```

### Запустити з EDRPOU

```bash
npm run test:audit -- -i 12345678 -t edrpou
```

### Запустити без генерації Markdown звітів

```bash
npm run test:audit -- --no-markdown
```

### Запустити без виводу в консоль

```bash
npm run test:audit -- --no-console
```

## Вивід

Звіти генеруються в директорії `./audit-reports`:

- `data-flow-audit-{timestamp}.md` - Data Flow Audit звіт
- `entity-card-builder-audit-{timestamp}.md` - Entity Card Builder Audit звіт
- `rest-api-audit-{timestamp}.md` - REST API Audit звіт
- `frontend-mapping-audit-{timestamp}.md` - Frontend Mapping Audit звіт
- `react-components-audit-{timestamp}.md` - React Components Audit звіт
- `placeholder-removal-audit-{timestamp}.md` - Placeholder Removal Audit звіт
- `coverage-test-{timestamp}.md` - Coverage Test звіт
- `consistency-validation-{timestamp}.md` - Consistency Validation звіт
- `ipn-verification-{timestamp}.md` - IPN Verification звіт

## Критерії приймання

Після виконання всіх аудитів система повинна відповідати наступним критеріям:

1. ✅ Після пошуку РНОКПП 3111724753 всі знайдені backend дані відображаються у Web UI
2. ✅ Жодна категорія не втрачається між Connector → Builder → API → UI
3. ✅ Усі React-компоненти відображають реальні дані без placeholder-заглушок
4. ✅ Automatic Coverage Test підтверджує рівність кількості записів на всіх етапах
5. ✅ У консолі відсутні помилки серіалізації, мапінгу або втрати DTO
6. ✅ Golden QA Validation проходить без помилок, а всі категорії даних мають статус PASS

## Інтеграція з CI/CD

### Automatic Coverage Test

```bash
# Запустити як CI тест
tsx server/tests/audit/AutomaticCoverageTest.ts
```

Цей тест повертає exit code 0 якщо пройдено, 1 якщо не пройдено.

### Data Consistency Validator

```bash
# Запустити як CI валідацію
tsx server/tests/audit/DataConsistencyValidator.ts
```

Ця валідація повертає exit code 0 якщо узгоджено, 1 якщо не узгоджено (блокує збірку).

### IPN Verification (Acceptance Test)

```bash
# Запустити як acceptance test
tsx server/tests/audit/IPNVerificationAudit.ts
```

Цей тест повертає exit code 0 якщо PASS, 1 якщо FAIL або PARTIAL.

## Додаткові опції

```
Usage: tsx runAuditTests.ts [options]

Options:
  -i, --ipn <code>              IPN or EDRPOU to audit [default: 3111724753]
  -t, --type <type>             Identifier type: ipn or edrpou [default: ipn]
  -o, --output <dir>            Output directory for reports [default: ./audit-reports]
  --all                         Run all audits (default)
  --data-flow                   Run only Data Flow Audit
  --entity-card                 Run only Entity Card Builder Audit
  --rest-api                    Run only REST API Audit
  --frontend-mapping            Run only Frontend Mapping Audit
  --react-components            Run only React Components Audit
  --placeholder                 Run only Placeholder Removal Audit
  --coverage                    Run only Automatic Coverage Test
  --consistency                 Run only Data Consistency Validator
  --ipn-verification            Run only IPN Verification (acceptance test)
  --no-markdown                 Skip Markdown report generation
  --no-console                  Skip console output
  -h, --help                    Show this help message
```

## Примітки

- Frontend Store та React Components аудити потребують інструментування frontend коду
- Поточна реалізація Frontend Mapping та React Components аудитів використовує статичний аналіз коду
- Для повноцінної роботи потрібно додати instrumentation в React компоненти
- Placeholder Removal Audit ідентифікує проблеми, але не видалає placeholder логіку автоматично
