export interface Dev5SpecItem {
  id: number;
  section: string;
  category: "Directive" | "Architecture" | "Connectors" | "Intelligence" | "AI" | "Security" | "Operations" | "Roadmap";
  priority: "P0 Critical" | "P1 Core" | "P2 Enterprise" | "P3 Advanced" | "Invariable";
  title: string;
  summary: string;
  requirements: string[];
  status: "ACTIVE" | "VERIFIED" | "TARGET";
}

export interface FiveQuestionsItem {
  number: number;
  question: string;
  meaning: string;
  verificationMethod: string;
}

export const FIVE_QUESTIONS_FRAMEWORK: FiveQuestionsItem[] = [
  {
    number: 1,
    question: "ЩО?",
    meaning: "Що саме система стверджує? (Конкретний факт, claim, сутність чи висновок)",
    verificationMethod: "Нормалізований Claim у таблиці claims з чітким subject-predicate-object",
  },
  {
    number: 2,
    question: "ЗВІДКИ?",
    meaning: "Яке першоджерело даної інформації?",
    verificationMethod: "Evidence Record з SHA-256 hash, URL, source_id, timestamp та профілем репутації джерела",
  },
  {
    number: 3,
    question: "КОЛИ?",
    meaning: "Коли інформація була актуальною або спостереженою?",
    verificationMethod: "Temporal Intelligence: valid_from, valid_to, observed_at, published_at",
  },
  {
    number: 4,
    question: "НАСКІЛЬКИ?",
    meaning: "Який рівень впевненості (Confidence Score) у цьому факті?",
    verificationMethod:
      "Confidence Engine (0-100%) на основі перехресної перевірки джерел та відсутності суперечностей",
  },
  {
    number: 5,
    question: "ЧОМУ?",
    meaning: "Які докази та який алгоритм привели до цього висновку?",
    verificationMethod:
      "Explainable Risk/Graph Engine, Reasoning Traces, посилання на докази та відсутність галюцинацій",
  },
];

export const DEV5_20_STEP_TEST: { step: number; title: string; desc: string }[] = [
  { step: 1, title: "Login & Session", desc: "Автентифікація користувача через MFA / SSO та отримання JWT" },
  { step: 2, title: "Search Real Entity", desc: "Пошук реальної сутності у мульти-джерельному індексі" },
  { step: 3, title: "Resolve Entity", desc: "Дедуплікація та асоціація ідентифікаторів (ЄДРПОУ, ІПН, LEI)" },
  { step: 4, title: "Query Real Sources", desc: "Паралельний опит реєстрів (OpenDataBot, YouControl, ЄДР, Prozorro)" },
  { step: 5, title: "Normalize Results", desc: "Приведення відповідей до єдиної канонічної онтології DEV5" },
  { step: 6, title: "Detect Duplicates", desc: "Аналіз збігів за хешами та фузі-алгоритмами" },
  { step: 7, title: "Build Entity Profile", desc: "Формування єдиного цифрового профілю з версіонуванням" },
  { step: 8, title: "Build Relationships", desc: "Побудова графу зв'язків (директори, зановники, адреси, майно)" },
  { step: 9, title: "Collect Evidence", desc: "Фіксація незмінних доказів (Raw Evidence + SHA-256) у MinIO" },
  { step: 10, title: "Generate Claims", desc: "Формування атомарних тверджень (Supported / Contradicted)" },
  { step: 11, title: "Calculate Confidence", desc: "Оцінка довіри на основі авторитетності джерел та свіжості" },
  { step: 12, title: "Detect Contradictions", desc: "Виявлення розбіжностей у реєстрах (різні директори/адреси)" },
  { step: 13, title: "Calculate Risk Score", desc: "Пояснюваний розрахунок факторів ризику (Sanctions, PEP, AML)" },
  { step: 14, title: "Create Investigation", desc: "Ініціалізація кейсу в Investigation Workspace" },
  { step: 15, title: "Add Watchlist Alert", desc: "Підписка на автоматичні сповіщення про нові реєстраційні дії" },
  { step: 16, title: "Trigger Event Bus", desc: "Публікація події ENTITY_UPDATED в Event Bus" },
  { step: 17, title: "Generate Intelligence Report", desc: "Створення підписаного PDF/DOCX звіту з цитуваннями" },
  { step: 18, title: "Export Report Data", desc: "Експорт доказів у форматах STIX 2.1 / GraphML / JSON" },
  { step: 19, title: "Verify Audit Log", desc: "Перевірка запису в Audit Engine про кожну проведену дію" },
  { step: 20, title: "Reproduce Snapshot", desc: "100% відтворення стану сутності з часового знімка" },
];

export const DEV5_145_SPEC_ITEMS: Dev5SpecItem[] = [
  {
    id: 0,
    section: "0. Executive Directive",
    category: "Directive",
    priority: "Invariable",
    title: "Перетворення DEV5 у повноцінну Intelligence Operating System",
    summary: "DEV5 перетворюється на операційний intelligence layer над реальними джерелами та PREDATOR Analytics.",
    requirements: [
      "Кожен результат системи мусить бути реальним, трасованим, перевірюваним, відтворюваним, безпечним та пояснюваним.",
      "DEV5 є операційним шар розвідки над реальними реєстрами, а не самостійним джерелом істини.",
    ],
    status: "ACTIVE",
  },
  {
    id: 1,
    section: "1. Baseline Repository Audit",
    category: "Architecture",
    priority: "P0 Critical",
    title: "Видалення генерації випадкових залишків та фіктивних станів",
    summary: "Очищення коду від залишків рандомізації та неузгоджених станів health-check.",
    requirements: [
      "Усунення будь-якої fallback/dynamic generation логіки з використанням випадкових генераторів у production paths.",
      "Створення чіткого прозорого contour для перевірки інтеграційних станів.",
    ],
    status: "VERIFIED",
  },
  {
    id: 2,
    section: "2. Final Product Definition",
    category: "Architecture",
    priority: "P0 Critical",
    title: "Формула DEV5 Intelligence OS",
    summary:
      "DEV5 = Experience + Engine + Connectors + Evidence + Graph + Risk + AI + Security + Audit + Observability.",
    requirements: ["Повна інтеграція 10 ключових підсистем.", "Побудова єдиного стандарту передачі даних між шарами."],
    status: "ACTIVE",
  },
  {
    id: 3,
    section: "3. Target Architecture",
    category: "Architecture",
    priority: "P0 Critical",
    title: "Шартивна архітектура PREDATOR Analytics",
    summary: "Аналітик -> DEV5 -> Gateway -> Intelligence Core / AI Layer / Connectors -> Polyglot DB.",
    requirements: [
      "Підтримка PostgreSQL (SSOT), ClickHouse (OLAP), Neo4j (Graph), OpenSearch (Search), Qdrant (Vector), MinIO (Evidence).",
      " Event-driven взаємодія через центральну подієву шину.",
    ],
    status: "ACTIVE",
  },
  {
    id: 5,
    section: "5. Absolute Production Rule",
    category: "Directive",
    priority: "Invariable",
    title: "REAL DATA ONLY — Заборона фейкових даних у Production",
    summary: "Заборонено використання випадкових значень, fake latency, fake metrics, fake risk, fake online status.",
    requirements: [
      "Якщо джерело не відповіло — OFFLINE.",
      "Якщо дані застарілі — STALE.",
      "Якщо з кешу — CACHED.",
      "Якщо без перевірки — UNVERIFIED.",
      "Ніколи VERIFIED без фактичної процедури перевірки.",
    ],
    status: "ACTIVE",
  },
  {
    id: 8,
    section: "8. Connector Platform Contract",
    category: "Connectors",
    priority: "P0 Critical",
    title: "Єдиний контракт Конектора",
    summary: "Кожен connector підпорядкований єдиному розширеному контракту.",
    requirements: [
      "authenticate(), healthCheck(), discover(), search(), fetch(), paginate(), validate(), normalize(), enrich(), cache(), metrics().",
    ],
    status: "VERIFIED",
  },
  {
    id: 10,
    section: "10. Connector States",
    category: "Connectors",
    priority: "P0 Critical",
    title: "Офіційні стани Конекторів",
    summary: "Система відображає лише фактичні стани з'єднань.",
    requirements: ["LIVE, CACHED, STALE, OFFLINE, BROKEN, AUTH_FAILED, RATE_LIMITED, SCHEMA_DRIFT, UNKNOWN."],
    status: "ACTIVE",
  },
  {
    id: 12,
    section: "12. Circuit Breaker",
    category: "Connectors",
    priority: "P0 Critical",
    title: "Circuit Breaker для зовнішніх API",
    summary: "Захист від каскадних збоїв зовнішніх сервісів.",
    requirements: [
      "Стани: CLOSED -> OPEN -> COOLDOWN -> HALF_OPEN -> CLOSED.",
      "Підтримка порогів помилок, таймаутів та автоматичного відновлення.",
    ],
    status: "ACTIVE",
  },
  {
    id: 16,
    section: "16. Secret Management",
    category: "Security",
    priority: "P0 Critical",
    title: "Заборона зберігання секретів у браузері/коді",
    summary: "Усі API-ключі та секрети знаходяться виключно на сервері.",
    requirements: [
      "Передача запитів через BFF / Connector Gateway.",
      "Автоматичне сканування CI на наявність витоків токенів.",
    ],
    status: "VERIFIED",
  },
  {
    id: 20,
    section: "20. Evidence Engine",
    category: "Intelligence",
    priority: "P1 Core",
    title: "Двигун Доказів (Evidence Engine) & Chain of Custody",
    summary: "Кожен доказ отримує унікальний ID, SHA-256 хеш та мітку часу.",
    requirements: [
      "Запис raw_hash, source_url, collected_at, observed_at, integrity status.",
      "При зміні першоджерела фіксується CONTENT_CHANGED.",
    ],
    status: "ACTIVE",
  },
  {
    id: 22,
    section: "22. Claim Engine",
    category: "Intelligence",
    priority: "P1 Core",
    title: "Двигун Тверджень (Claim Engine)",
    summary: "Розділення Data, Evidence, Claim, Inference та Hypothesis.",
    requirements: [
      "Статуси тверджень: SUPPORTED, UNCONFIRMED, CONTRADICTED, DISPUTED, REVOKED, EXPIRED.",
      "Чітка прив'язка до evidence_ids та source_ids.",
    ],
    status: "ACTIVE",
  },
  {
    id: 25,
    section: "25. Contradiction Engine",
    category: "Intelligence",
    priority: "P1 Core",
    title: "Виявлення розбіжностей у реєстрах",
    summary: "Автоматичне виявлення суперечливих даних з різних джерел.",
    requirements: [
      "Показ конфліктних засновників, застарілих адрес, некоректних статутних капіталів.",
      "Індикатор CONFLICT DETECTED у інтерфейсі аналітика.",
    ],
    status: "ACTIVE",
  },
  {
    id: 29,
    section: "29. Entity Resolution",
    category: "Intelligence",
    priority: "P1 Core",
    title: "Сервіс точного та нечіткого співставлення сутностей",
    summary: "Об'єднання профілів за ЄДРПОУ, ІПН, LEI, адресою, телефоном та фузі-алгоритмами.",
    requirements: [
      "Збереження match_score, match_reason, matched_fields.",
      "Підтримка операцій Merge / Split із можливістю Rollback.",
    ],
    status: "ACTIVE",
  },
  {
    id: 35,
    section: "35. Risk Engine 2.0",
    category: "Intelligence",
    priority: "P1 Core",
    title: "Пояснювана оцінка ризиків (Explainable Risk)",
    summary: "Ризик не є просто числом — це прозорий набір факторів.",
    requirements: [
      "Розкладання на драйвери: Sanctions, Adverse Media, Ownership, Jurisdiction, Network.",
      "Фіксація часової динаміки risk(t) та причин змін.",
    ],
    status: "ACTIVE",
  },
  {
    id: 47,
    section: "47. AI Grounding & No Hallucinations",
    category: "AI",
    priority: "P1 Core",
    title: "Суворі обмеження для AI Copilot",
    summary: "Штучний інтелект не має права вигадувати джерела чи факти.",
    requirements: [
      "Обов'язкове заземлення (grounding) на реальний контекст реєстрів.",
      "Використання AI Model Router з fallback ланцюжком (gemini-3.6-flash).",
    ],
    status: "VERIFIED",
  },
  {
    id: 70,
    section: "70. Audit Engine",
    category: "Security",
    priority: "P0 Critical",
    title: "Незмінний аудит дій (Immutable Audit Log)",
    summary: "Усі пошуки, перегляди, експорти та AI-запити фіксуються в лозі.",
    requirements: [
      "Запис user_id, action, resource_type, resource_id, before, after, ip, request_id.",
      "Заборона редагування логів користувачем.",
    ],
    status: "VERIFIED",
  },
  {
    id: 114,
    section: "114. UI Status Rule",
    category: "Operations",
    priority: "Invariable",
    title: "Статуси UI вимагають доказів із Сервера",
    summary: "Будь-який зелений індикатор ONLINE / CONNECTED має підтверджуватися реальним ping.",
    requirements: [
      "Frontend не має права визначати істину самостійно.",
      "Відображення реальних результатів health check.",
    ],
    status: "VERIFIED",
  },
  {
    id: 144,
    section: "144. Master Prohibition",
    category: "Directive",
    priority: "Invariable",
    title: "Заборона створення ілюзії істини",
    summary: "DEV5 ніколи не має права створювати ілюзію істини при відсутності даних.",
    requirements: [
      "Немає відповіді -> OFFLINE",
      "Застарілі дані -> STALE",
      "Немає доказів -> UNCONFIRMED",
      "Суперечливі джерела -> CONTRADICTED",
      "Невідомо -> UNKNOWN",
    ],
    status: "ACTIVE",
  },
];
