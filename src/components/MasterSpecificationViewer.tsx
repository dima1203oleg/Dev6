import { useState, useMemo } from 'react';
import { 
  BookOpen, ShieldCheck, Cpu, Terminal, Search, 
  Layers, CheckCircle2, Network, FileText,
  Lock, Scale, Activity, ShieldAlert, Box, HelpCircle
} from 'lucide-react';
import { useToast } from './ToastProvider';
import { 
  FIVE_QUESTIONS_FRAMEWORK, 
  DEV5_20_STEP_TEST, 
  DEV5_145_SPEC_ITEMS
} from '../data/dev5MasterSpecData';

export interface SpecChapter {
  id: number;
  title: string;
  category: string;
  badge: string;
  summary: string;
  details: string[];
  components: string[];
  invariants: string[];
}

export const MASTER_SPECIFICATION_CHAPTERS: SpecChapter[] = [
  {
    id: 1,
    title: "1. Vision & Strategy",
    category: "Strategic Foundation",
    badge: "Core Vision",
    summary: "Стратегічне бачення, місія, цінності та ключові вектори розвитку єдиної когнітивної платформи PREDATOR Analytics.",
    details: [
      "Vision: Стати універсальною операційною системою розвідки (Enterprise Intelligence OS) світового рівня.",
      "Mission: Автоматична агрегація, нормалізація, побудова графу знань та пояснюваний аналіз відкритих даних.",
      "Core Values: Open Source First, Zero Trust, Explainable AI, Evidence Based, Privacy by Design.",
      "Product & Data Strategy: Побудова універсального графу з підтримкою термінових OLAP та Vector запитів.",
      "Technology Radar: Безперервна оновлюваність стеку (FastAPI, Qdrant, OpenSearch, Neo4j, Ray, Temporal)."
    ],
    components: ["Business Capability Model", "Enterprise Capability Map", "Technology Radar", "Ecosystem Strategy"],
    invariants: ["Заборона використання закритих бібліотек без погодження", "Відповідність вимогам GDPR та законодавства"]
  },
  {
    id: 2,
    title: "2. Enterprise Architecture",
    category: "System Design",
    badge: "TOGAF & C4",
    summary: "Універсальна багатовимірна архітектура на основі TOGAF Viewpoints, Zachman Matrix та C4 Model.",
    details: [
      "TOGAF Viewpoints & Zachman Matrix: Формалізація кожного компоненту на всіх рівнях абстракції.",
      "C4 Architecture (Context, Containers, Components, Code): Повна прозорість взаємодій.",
      "Domain Driven Design (DDD) & Hexagonal Architecture: Ізоляція предметної області від інфраструктури.",
      "Event-Driven & Event-Sourcing (Kafka / Redpanda / Debezium): Повна аудитованість та відтворюваність стану.",
      "CQRS Pattern: Розділення команд збору/інжесту та високонавантажених аналітичних читань."
    ],
    components: ["C4 Model Engine", "Archimate Generator", "UML/BPMN Exporter", "Domain Context Map"],
    invariants: ["Незмінність контрактів без процедури RFC", "Zero Circular Dependencies"]
  },
  {
    id: 3,
    title: "3. Enterprise Ontology",
    category: "Knowledge Modeling",
    badge: "Semantic Kernel",
    summary: "Багатодоменна онтологічна модель для формалізації сутностей, подій, майна та зв'язків.",
    details: [
      "Investigation & Corporate Ontology: Формалізація компаній, PEP, бенефіціарів, офшорних контурів.",
      "Trade & AML Ontology: Опис митних декларацій, HS-кодів, фінансових потоків та крипто-адрес.",
      "OSINT & Geo Ontology: Моделювання супутникових даних, геокоординат, судових справ та новин.",
      "Supply Chain & Risk Ontology: Графове представлення ланцюгів постачання та векторів загроз."
    ],
    components: ["FollowTheMoney Standard", "GLEIF ISO 17442 Integration", "OWL/RDF Schema Repository", "Dynamic Entity Typer"],
    invariants: ["Усі сутності мусять мати універсальний UUIDv5", "Обов'язкова нормалізація назв та кодів ЄДРПОУ/LEI"]
  },
  {
    id: 4,
    title: "4. Universal Knowledge Graph",
    category: "Graph Engine",
    badge: "Graph Native",
    summary: "Багатошаровий граф знань, що об'єднує сутності, події, докази, комунікації та часові серії.",
    details: [
      "Entity & Event Graph: Пов'язування компаній, людей, майна та подій у єдиній просторово-часовій системі.",
      "Evidence & Document Graph: Доказовий ланцюг (Chain of Custody) з посиланням на першоджерело.",
      "Beneficial Ownership & Influence Graph: Автоматичний розрахунок кінцевих бенефіціарних власників (UBO).",
      "Timeline & Geo Graph: Трекінг переміщення вантажів, реєстраційних змін та трансферу активів у часі."
    ],
    components: ["Neo4j / Memgraph Cluster", "Cypher Query Engine", "Graph Neural Network (GNN) Embeddings", "Sub-graph Materializer"],
    invariants: ["Збереження посилання на джерело для кожного ребра графу", "Підтримка версіонування зв'язків"]
  },
  {
    id: 5,
    title: "5. Semantic Layer",
    category: "Knowledge & AI",
    badge: "W3C Standards",
    summary: "Семантичний шар для векторного пошуку, автоматичного логічного виводу та відповідності ISO стандартам.",
    details: [
      "Семантичний пошук та онтологічний висновок: Використання SHACL та OWL для логічної перевірки фактів.",
      "W3C & ISO Alignment: Повна підтримка JSON-LD, RDF, ISO 8000 (Data Quality) та ISO 11179.",
      "Knowledge Inference Engine: Автоматичне виведення нових зв'язків на основі транзитивності (A -> B -> C).",
      "Semantic Versioning of Schemas: Автоматична перевірка зворотної сумісності онтологій."
    ],
    components: ["SHACL Validator", "JSON-LD Normalizer", "OWL Reasoner", "Semantic Feature Store"],
    invariants: ["Strict Schema Validation via SHACL", "Semantic Versioning Major.Minor.Patch"]
  },
  {
    id: 6,
    title: "6. Universal Data Fabric",
    category: "Data Infrastructure",
    badge: "Polyglot Persistence",
    summary: "Поліглотна платформа зберігання й обробки даних (Data Lakehouse, Vector, Graph, TimeSeries).",
    details: [
      "Data Lakehouse & Warehouse: Поєднання MinIO/S3 + ClickHouse для миттєвої OLAP-аналітики.",
      "Vector Storage: Qdrant / Milvus для семантичного пошуку по мільйонах текстових embeddings.",
      "Операційна та пошукова БД: PostgreSQL / TimescaleDB + OpenSearch для швидкого повнотекстового пошуку.",
      "Feature Store & Metadata Catalog: Централізований каталог даних та відстеження Lineage."
    ],
    components: ["MinIO S3 Lake", "ClickHouse OLAP", "Qdrant Vector Cluster", "PostgreSQL / TimescaleDB", "OpenSearch"],
    invariants: ["Шифрування даних at-rest та in-transit (TLS 1.3 + AES-256)", "Ізоляція гарячих і холодних даних"]
  },
  {
    id: 7,
    title: "7. Enterprise Connector Ecosystem",
    category: "Integrations & API",
    badge: "ECIP v2.0",
    summary: "Екосистема з 100+ авто-згенерованих та самовідновлюваних конекторів до відкритих державних та міжнародних джерел.",
    details: [
      "Connector Discovery & Generator: Автоматичне виявлення джерел через GitHub, APIs.guru, CKAN.",
      "Auto-Repair & Schema Drift Engine: Виявлення змін API та оновлення DTO без зупинки системи.",
      "Secret & Vault Management: Безпечна ротація ключів через HashiCorp Vault та Secret Manager.",
      "Rate Intelligence Scheduler: Розподіл навантаження з підтримкою Token Bucket та Redis Limits."
    ],
    components: ["Universal Connector SDK", "HashiCorp Vault Rotator", "Schema Drift Watchdog", "Rate Limits Engine"],
    invariants: ["Заборона збереження ключів у коді", "100% заповнення цифрового паспорта джерела"]
  },
  {
    id: 8,
    title: "8. Autonomous AI Organization",
    category: "Multi-Agent System",
    badge: "AI Crew & Agents",
    summary: "Модель автономної AI-компанії з рольовою спеціалізацією (CEO, CTO, Security Officer, Data Architect).",
    details: [
      "Role-Based Agents: CEO Agent, CTO Agent, Chief Architect, Lead Security Officer, Critic Agent.",
      "Autonomic Task Execution: Розподіл завдань, автоматичний код-рев'ю, генерація тестів та деплой.",
      "Arbiter & Critic Loop: Валідація галюцинацій LLM перед прийняттям відповідальних рішень.",
      "Continuous Self-Improvement: Аналіз логів помилок та автоматичне створення Pull Request."
    ],
    components: ["LangGraph / CrewAI Supervisor", "Critic Agent Evaluator", "Autonomous Code Reviewer", "Task Router"],
    invariants: ["Жодних дій без проходження Критика (Critic Agent)", "Суворе дотримання AI Constitution"]
  },
  {
    id: 9,
    title: "9. Enterprise Memory System",
    category: "AI Cognition",
    badge: "4-Tier Memory",
    summary: "Багаторівнева система пам'яті AI (Working, Semantic, Procedural, Episodic).",
    details: [
      "Working Memory: Оперативний контекст поточного розслідування чи сесії.",
      "Semantic Memory: Граф знань та векторизована база нормативних документів.",
      "Procedural Memory: Набір перевірених інструкцій, алгоритмів та правил розслідування.",
      "Episodic Memory: Історія попередніх розслідувань, виявлених аномалій та рішень оператора."
    ],
    components: ["Episodic Vector DB", "Contextual Window Buffer", "Procedural Rules Graph", "Reasoning Trace Logger"],
    invariants: ["Повна аудитованість логічних ланцюгів (Reasoning Traces)", "Автоматичний занепад застарілого контексту"]
  },
  {
    id: 10,
    title: "10. Autonomous Planning",
    category: "Project & Execution",
    badge: "Critical Path AI",
    summary: "Автономне декомпонування задач, оцінка ризиків, визначення критичного шляху та ресурсів.",
    details: [
      "Dependency Graph Builder: Автоматичне побудування графу залежностей проектів.",
      "Critical Path Method (CPM): Визначення блокуючих вузлів при розгортанні модулів.",
      "ROI & Risk Estimator: Оцінка вартості обчислень, токенів та часу виконання.",
      "Gantt & Milestones Generator: Автоматична візуалізація термінів та етапів розробки."
    ],
    components: ["CPM Planner Engine", "Token Cost Predictor", "Dependency Risk Matrix", "Milestone Auto-Tracker"],
    invariants: ["Обов'язкова наявність Fallback-плану", "Автоматична зупинка при перевищенні ліміту токенів"]
  },
  {
    id: 11,
    title: "11. Autonomous Research",
    category: "OSINT & Intelligence",
    badge: "Deep Research",
    summary: "Автоматичний аналіз кодбаз, ArXiv публікацій, CNCF Landscape, GitHub репозиторіїв та патентів.",
    details: [
      "Deep Academic & Code Audit: Сканування ArXiv, PapersWithCode, GitHub, PyPI на нові алгоритми.",
      "OSINT & Security Benchmarks: Аналіз нових векторальних індексів, парсерів та джерел даних.",
      "Automated RFC & PoC Generation: Створення тестових прототипів для перевірки нових технологій."
    ],
    components: ["ArXiv / PapersWithCode Crawler", "GitHub Repos Auditor", "PoC Generator Engine"],
    invariants: ["Заборона впровадження незахищених залежностей", "Перевірка ліцензій (Apache 2.0 / MIT / BSD)"]
  },
  {
    id: 12,
    title: "12. Enterprise Security Constitution",
    category: "Security & Zero Trust",
    badge: "Zero Trust & SBOM",
    summary: "Незмінна конституція безпеки: Zero Trust, Policy-as-Code (OPA), SBOM, SLSA та розширений аудит.",
    details: [
      "Zero Trust Architecture: Повна автентифікація та авторизація кожного міжсервісного запиту.",
      "Policy-as-Code (OPA / Kyverno): Автоматична перевірка маніфестів та правил безпеки.",
      "Supply Chain Security (SBOM, Sigstore, Cosign): Підпис контейнерів та перевірка відсутності CVE.",
      "Immutable Audit Logs: Запис усіх дій користувачів та AI у незмінний хеш-лог."
    ],
    components: ["HashiCorp Vault", "OPA Policy Engine", "Falco Runtime Guard", "Trivy Vulnerability Scanner"],
    invariants: ["Zero Hardcoded Secrets", "100% покриття сервісів mTLS шифруванням"]
  },
  {
    id: 13,
    title: "13. Autonomous Quality System",
    category: "Quality Assurance",
    badge: "Mutation & QA",
    summary: "Комплексна система якості: Unit, Integration, Contract, Property-Based, Mutation та Hallucination тестування.",
    details: [
      "Polyglot Testing: Автоматична генерація Unit, Integration та Contract тестів (Pact).",
      "Property-Based & Mutation Testing: Перевірка граничних умов та стійкості коду.",
      "AI Hallucination Review: Оцінка достовірності відповідей LLM на контрольній вибірці."
    ],
    components: ["Mutation Testing Engine", "Pact Contract Validator", "LLM Hallucination Benchmark", "SAST/DAST Pipeline"],
    invariants: ["Покриття тестами не менше 85%", "100% закриття знайнених критичних CVE"]
  },
  {
    id: 14,
    title: "14. Enterprise Governance",
    category: "Management & Compliance",
    badge: "Compliance First",
    summary: "Централізоване управління архітектурою, даними, моделями, API та нормативною відповідністю.",
    details: [
      "Architecture & API Governance: Контроль відповідності OpenAPI, AsyncAPI та Protobuf контрактам.",
      "Model & Data Governance: Відстеження версій LLM моделей, промптів та джерел даних.",
      "Regulatory Compliance: Автоматична перевірка відповідності вимогам НБУ, ЄС, FATF та AML."
    ],
    components: ["API Registry", "Model Lineage Catalog", "Compliance Check Engine", "Data Governance Board"],
    invariants: ["Обов'язкова наявність версіонування API", "Повне документування ADR для будь-якої зміни"]
  },
  {
    id: 15,
    title: "15. Enterprise Observability",
    category: "Monitoring & Telemetry",
    badge: "OpenTelemetry",
    summary: "Повна наскрізна прозорість: метрики, траси, логи, телеметрія AI моделей та бізнес-KPI.",
    details: [
      "OpenTelemetry & Jaeger Tracing: Відстеження шляху запиту крізь усі мікросервіси.",
      "Prometheus & Grafana: Моніторинг CPU, Memory, Latency, RPS та стану квот API.",
      "LLM & Token Tracking: Облік використання токенів, затримок моделей та вартості операцій.",
      "Loki Log Aggregator: Централізоване зберігання логів з миттєвим пошуком."
    ],
    components: ["OpenTelemetry Collector", "Prometheus + Grafana Dashboard", "Jaeger Distributed Tracing", "Loki Log Engine"],
    invariants: ["Кожен запит повинен мати trace_id та span_id", "Alerting про аномалії за затримкою > 500ms"]
  },
  {
    id: 16,
    title: "16. Autonomous Evolution Engine",
    category: "Self-Evolution",
    badge: "GitOps Evolution",
    summary: "Двигун автономного розвитку платформи: аналіз нових версій бібліотек, рефакторинг та Canary Deployments.",
    details: [
      "Automated Dependency & CVE Monitoring: Відстеження нових релізів та патчів безпеки.",
      "Canary & Progressive Rollouts (Argo Rollouts): Автоматичне тестування нових версій на 5% трафіку.",
      "Automatic ADR & RFC Generator: Фіксація архітектурних рішень у вигляді коду."
    ],
    components: ["ArgoCD / Argo Rollouts Engine", "Dep-Bot Auto PR Creator", "Canary Metrics Evaluator"],
    invariants: ["Обов'язковий відкат (Rollback) при зростанні помилок > 1%", "Zero Downtime Deployments"]
  },
  {
    id: 17,
    title: "17. Enterprise Digital Twin",
    category: "Digital Twins",
    badge: "Digital Twin Engine",
    summary: "Цифрові двійники юридичних осіб, вантажів, митних маршрутів, контрагентів та розслідувань.",
    details: [
      "Company & Counterparty Twin: Моделювання фінансового стану, ризиків та афіліацій юридичної особи.",
      "Supply Chain & Customs Twin: Відстеження контейнерів, митних пунктів та логістичних ланцюгів.",
      "Platform & Connector Twin: Симуляція поведінки та навантаження будь-якого елементу PREDATOR."
    ],
    components: ["Digital Twin Simulator", "Customs Route Tracker", "Financial Risk Emulator"],
    invariants: ["Синхронізація стану цифрового двійника з реальною базою < 5 сек", "Збереження історії змін стану"]
  },
  {
    id: 18,
    title: "18. Global Intelligence Platform",
    category: "International OSINT",
    badge: "Multi-Jurisdiction",
    summary: "Глобальна підтримка будь-яких юрисдикцій, алфавітів, мов, валют та міжнародних реєстрів.",
    details: [
      "Multi-Language & Unicode Native: Підтримка української, англійської, арабської, китайської тощо.",
      "Global Registry Adapters: Інтеграція з реєстрами ЄС, США, Британії, Азії, ОАЕ та офшорних зон.",
      "Dynamic Address & Tax Normalizer: Зведення адрес і податкових номерів до міжнародних стандартів."
    ],
    components: ["Global Address Normalizer", "Unicode Entity Resolver", "Multi-Currency Exchange Engine"],
    invariants: ["Збереження оригінального написання ім'я/назви поруч з транслітерацією", "ISO 3166-1 alpha-2 для країн"]
  },
  {
    id: 19,
    title: "19. Enterprise Documentation Engine",
    category: "Documentation as Code",
    badge: "Doc-as-Code",
    summary: "Автоматична генерація OpenAPI, AsyncAPI, Protobuf, ERD, C4-діаграм, SDK та Runbooks з єдиної моделі.",
    details: [
      "Single Source of Truth Doc Generation: Генерація всіх схем та інструкцій із сутності специфікації.",
      "Interactive API & SDK Exporter: Автоматичне формування Python, TypeScript, Go SDK.",
      "Playbooks & Disaster Recovery Guides: Авто-оновлювані інструкції для операторів та SRE."
    ],
    components: ["OpenAPI / AsyncAPI Exporter", "PlantUML / Mermaid Generator", "SDK Code Generator"],
    invariants: ["Специфікація та код завжди 100% синхронізовані", "Жодного ручного редагування документації"]
  },
  {
    id: 20,
    title: "20. Master Enterprise Constitution",
    category: "Governance & Invariants",
    badge: "System Constitution",
    summary: "Головна Конституція PREDATOR Analytics: 12 непорушних інваріантів та правил автономної розробки.",
    details: [
      "Rule 1: Domain-Driven & Hexagonal Isolation. Заборонено змішувати бізнес-логіку з кодом БД чи UI.",
      "Rule 2: Zero Hardcoded Secrets & Vault Mandate. Усі секрети лише у HashiCorp Vault.",
      "Rule 3: Single Source of Truth Model. Будь-який контракт походить від центральної онтології.",
      "Rule 4: Critic Agent & Verification Mandatory. Жоден код чи висновок не приймається без верифікації.",
      "Rule 5: Legal & Ethical Open Data Compliance. Збір даних виключно у межах чинного законодавства."
    ],
    components: ["Constitution Enforcement Agent", "Invariants Linter", "Approval Gate System"],
    invariants: ["Абсолютна пріоритетність Конституції над будь-яким розширенням", "100% прозорість для аудиту"]
  }
];

export default function MasterSpecificationViewer() {
  const { showToast } = useToast();
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [specCategoryFilter, setSpecCategoryFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"dev5-spec" | "five-questions" | "twenty-steps" | "chapters" | "constitution" | "graph" | "registry-correctness">("dev5-spec");

  const selectedChapter = useMemo(() => {
    return MASTER_SPECIFICATION_CHAPTERS.find((c) => c.id === selectedChapterId) || MASTER_SPECIFICATION_CHAPTERS[0];
  }, [selectedChapterId]);

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return MASTER_SPECIFICATION_CHAPTERS;
    const q = searchQuery.toLowerCase();
    return MASTER_SPECIFICATION_CHAPTERS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.details.some((d) => d.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredDev5SpecItems = useMemo(() => {
    return DEV5_145_SPEC_ITEMS.filter((item) => {
      const matchesCat = specCategoryFilter === "ALL" || item.category === specCategoryFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || item.section.toLowerCase().includes(q) || item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [specCategoryFilter, searchQuery]);

  const handleExportSpecification = () => {
    const specDoc = {
      title: "DEV5 INTELLIGENCE OS - Master Production Technical Specification",
      version: "Target Architecture v5.0 Production",
      generatedAt: new Date().toISOString(),
      fiveQuestions: FIVE_QUESTIONS_FRAMEWORK,
      specItemsCount: DEV5_145_SPEC_ITEMS.length,
      specItems: DEV5_145_SPEC_ITEMS,
      twentyStepTest: DEV5_20_STEP_TEST,
      chapters: MASTER_SPECIFICATION_CHAPTERS,
    };

    const blob = new Blob([JSON.stringify(specDoc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dev5-intelligence-os-master-spec-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("Повну ТЗ-Специфікацію DEV5 Intelligence OS успішно завантажено в JSON", "success");
  };

  return (
    <div className="space-y-6 text-slate-200 font-sans pb-12">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                DEV5 Головна специфікація v5.0
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                REAL DATA ONLY
              </span>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Target Production OS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              DEV5 Intelligence OS — Master Technical Specification
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 w-full leading-relaxed">
              Офіційне ТЗ та архітектурний план перетворення DEV5 на оперативну когнітивну систему розвідки. 100% відповідність вимога прозорості джерел (Evidence, Claims, Confidence, Contradictions, Zero Fake Data).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={handleExportSpecification}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold font-mono rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-950/50"
            >
              <FileText className="w-4 h-4" />
              <span>Експорт ТЗ (JSON)</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 font-mono text-xs">
          {[
            { id: "dev5-spec", label: "📜 ТЗ DEV5 (145 Пунктів)", icon: Layers },
            { id: "five-questions", label: "🔍 5 Питань Доказової Істини", icon: HelpCircle },
            { id: "twenty-steps", label: "🧪 20-Кроковий Фінальний Тест", icon: CheckCircle2 },
            { id: "chapters", label: "🏛️ 20 Томів Архітектури", icon: BookOpen },
            { id: "constitution", label: "⚖️ Майстер Конституція", icon: Scale },
            { id: "registry-correctness", label: "✔️ Correctness Specification", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                    : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ВКЛАДКА 0: DEV5 ГОЛОВНА СПЕЦИФІКАЦІЯ (145 ITEMS) */}
      {activeTab === "dev5-spec" && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase">Категорія:</span>
              {["ALL", "Directive", "Architecture", "Connectors", "Intelligence", "AI", "Security", "Operations"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSpecCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    specCategoryFilter === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64 font-mono text-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук у ТЗ DEV5..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDev5SpecItems.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl space-y-3 transition-all"
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-bold">
                    {item.section}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.priority === 'Invariable' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    item.priority === 'P0 Critical' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {item.priority}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.summary}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 font-mono text-xs">
                  <span className="text-[11px] text-indigo-400 font-bold block uppercase">Вимоги:</span>
                  {item.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: FIVE QUESTIONS FRAMEWORK */}
      {activeTab === "five-questions" && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <HelpCircle className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-lg font-black text-white">5 Питань Доказової Істини DEV5</h3>
              <p className="text-xs text-slate-400 font-mono">
                Жодний результат не є Verified Intelligence, якщо система не дає відповіді на ці 5 питань:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {FIVE_QUESTIONS_FRAMEWORK.map((q) => (
              <div key={q.number} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-indigo-400">0{q.number}</span>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-bold text-sm">
                    {q.question}
                  </span>
                </div>
                <strong className="text-white text-xs block font-bold font-sans">{q.meaning}</strong>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-emerald-300 text-[11px] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Метод верифікації:</span>
                  <p>{q.verificationMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: 20-STEP FINAL TEST */}
      {activeTab === "twenty-steps" && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-black text-white">Фінальний 20-Кроковий Сценарій Перевірки Production</h3>
              <p className="text-xs text-slate-400 font-mono">
                Перед релізом у Production система мусить пройти всі 20 етапів без помилок:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {DEV5_20_STEP_TEST.map((step) => (
              <div key={step.step} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                  {step.step}
                </span>
                <div>
                  <strong className="text-white text-xs block font-bold">{step.title}</strong>
                  <p className="text-slate-400 text-[11px] font-sans mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: 20 CHAPTERS EXPLORER */}
      {activeTab === "chapters" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar: List of 20 Chapters */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-2">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Пошук тома за назвою чи тегою..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[650px] overflow-y-auto custom-scrollbar pr-1">
              {filteredChapters.map((ch) => {
                const isSelected = ch.id === selectedChapterId;
                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer font-mono text-xs space-y-1.5 ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-950/40"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-indigo-400 font-bold">
                        {ch.badge}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">{ch.category}</span>
                    </div>
                    <strong className="text-xs font-bold block text-slate-100">{ch.title}</strong>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">{ch.summary}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main Content: Detailed Chapter View */}
          <div className="lg:col-span-7">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl sticky top-6">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 font-mono">
                    <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-bold uppercase">
                      Том #{selectedChapter?.id} • {selectedChapter?.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">{selectedChapter?.title}</h3>
                </div>

                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Verified & Active
                </span>
              </div>

              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {selectedChapter?.summary}
                </p>

                {/* Key Technical Requirements */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Ключові Технічні Положення Розділу
                  </h4>
                  <div className="space-y-2">
                    {selectedChapter?.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Architecture Components */}
                <div className="space-y-2 font-mono text-xs">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    Компоненти та Сервіси
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedChapter?.components.map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Box className="w-3.5 h-3.5 text-amber-400" />
                        <span>{comp}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Invariants & Rules */}
                <div className="space-y-2 font-mono text-xs pt-2 border-t border-slate-800/80">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-400" />
                    Суворі Архітектурні Інваріанти
                  </h4>
                  <div className="space-y-1.5">
                    {selectedChapter?.invariants.map((inv, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-rose-950/20 border border-rose-500/30 text-rose-200 rounded-xl text-[11px] flex items-center gap-2 font-bold"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{inv}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER CONSTITUTION */}
      {activeTab === "constitution" && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-lg font-black text-white">Майстер Конституція PREDATOR Analytics (AI Constitution)</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Закони прямої дії для автономного агента Google Antigravity
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {[
              {
                num: "01",
                title: "Domain-Driven & Hexagonal Architecture",
                rule: "Жодна бізнес-логіка не повинна залежати від деталей реалізації баз даних, UI чи зовнішніх фреймворків.",
              },
              {
                num: "02",
                title: "Zero Hardcoded Secrets & Vault Mandate",
                rule: "Категорично заборонено зберігати токени, паролі чи секрети в коді. Усі секрети виключно в HashiCorp Vault.",
              },
              {
                num: "03",
                title: "Single Source of Truth Model",
                rule: "Усі схеми OpenAPI, Protobuf, SQL, Cypher та GraphQL генеруються виключно з центральної онтології.",
              },
              {
                num: "04",
                title: "Critic Agent Verification",
                rule: "Жодний автономний висновок чи код не приймається без валідації через Critic Agent та автоматичні тести.",
              },
              {
                num: "05",
                title: "Legal & Open Data Compliance",
                rule: "Робота здійснюється виключно з легальними відкритими джерелами та через офіційні API механізми.",
              },
              {
                num: "06",
                title: "Evidence-Based Traceability",
                rule: "Кожен факт, ребро графу та висновок повинні мати посилання на першоджерело з доказовим хешем (Chain of Custody).",
              },
            ].map((rule) => (
              <div key={rule.num} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-400 font-black text-sm">#RULE_{rule.num}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">
                    INVARIANT
                  </span>
                </div>
                <strong className="text-white text-xs block font-bold">{rule.title}</strong>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">{rule.rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ARCHITECTURE GRAPH DEPENDENCY MAP */}
      {activeTab === "graph" && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Network className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-lg font-black text-white">Карта Залежностей Томів Специфікації</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Залежності між ядром, онтологією, даними, AI та конекторами
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            {MASTER_SPECIFICATION_CHAPTERS.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedChapterId(c.id);
                  setActiveTab("chapters");
                }}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-2xl space-y-1 transition-all cursor-pointer"
              >
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>#TOM_{c.id}</span>
                  <span className="text-indigo-400 font-bold">{c.badge}</span>
                </div>
                <strong className="text-slate-200 text-xs block truncate">{c.title}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REGISTRY CORRECTNESS TEST SPECIFICATION */}
      {activeTab === "registry-correctness" && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-lg font-black text-white">ТЕСТ НА КОРЕКТНІСТЬ РЕЄСТРІВ</h3>
              <p className="text-xs text-slate-400 font-mono">
                Registry Correctness Test Specification (15 Критеріїв)
              </p>
            </div>
          </div>
          <div className="prose prose-invert prose-slate max-w-none prose-sm font-sans">
            <iframe src="/docs/RegistryCorrectness.md" className="w-full h-[800px] border-0 rounded-2xl bg-slate-950 p-4 custom-scrollbar" title="Registry Correctness Spec" />
          </div>
        </div>
      )}

    </div>
  );
}
