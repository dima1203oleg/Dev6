import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  AlertTriangle,
  Clock,
  Activity,
  Sparkles,
  Terminal,
  Network,
  Box,
  Check,
} from "lucide-react";

export interface PipelineStep {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  icon: string;
  category: "DISCOVERY" | "PARSER" | "PROCESSING" | "ROUTING" | "STORAGE" | "VERIFY";
  description: string;
  details: string[];
}

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "discovery",
    number: 1,
    name: "Виявлення джерела",
    subtitle: "Автовизначення протоколу, SSL та HashiCorp Vault Auth",
    icon: "🔍",
    category: "DISCOVERY",
    description: "Сканування ендпоінту, розпізнавання OpenAPI/OData схем та валідація токенів доступу.",
    details: ["Протокол: S3/MinIO & REST", "Сертифікат TLS 1.3", "Секрети Vault ін'єктовано"],
  },
  {
    id: "parser",
    number: 2,
    name: "Генерація парсера",
    subtitle: "Динамічна генерація AST-парсерів у пам'яті",
    icon: "⚙️",
    category: "PARSER",
    description: "Автоматичне проектування токенізатора для Parquet, JSON lines, XML та растрових сканів.",
    details: ["Схему AST скомпільовано", "Потік пам'яті Zero-Copy", "Багатопотокове розбиття"],
  },
  {
    id: "validation",
    number: 3,
    name: "Валідація та очищення",
    subtitle: "Контрольні суми ЄДРПОУ/IBAN, дедуплікація та очистка",
    icon: "🛡️",
    category: "PROCESSING",
    description: "Скринінг контрольних розрядів, виправлення кодувань UTF-8 та відсіювання битих записів.",
    details: ["Валідатор сум: Пройдено", "Вікно дедуплікації: 100k", "Чисті записи: 99.8%"],
  },
  {
    id: "schema",
    number: 4,
    name: "Визначення схеми",
    subtitle: "Визначення Pydantic типів, часових полів та ID",
    icon: "📐",
    category: "PARSER",
    description: "Аналіз типів даних у колонках, автоматичне визначення первинних ключів та часових міток.",
    details: ["Знайдено колонок: 28", "Первинний ключ: MD_NUMBER", "Формат часу: ISO-8601"],
  },
  {
    id: "ner",
    number: 5,
    name: "Розпізнавання сутностей",
    subtitle: "ШІ-вилучення Компаній, PEP, Валют, Товарів УКТЗЕД",
    icon: "🧠",
    category: "PROCESSING",
    description: "LLM & Spacy NER каскад для розпізнавання суб'єктів ЗЕД, бенефіціарів та ризикових маркерів.",
    details: ["Сутностей знайдено: 12 Типів", "Відмічено зв'язки PEP", "Перевірка по санкціях"],
  },
  {
    id: "vector",
    number: 6,
    name: "Векторне вбудовування",
    subtitle: "Генерація 768-мірних векторів для Qdrant",
    icon: "💎",
    category: "PROCESSING",
    description: "Семантична векторизація описів товарів, судових рішень та приміток для гібридного пошуку.",
    details: ["Модель вбудовування: bge-m3", "Векторний вимір: 768", "Індекс: HNSW Cosine"],
  },
  {
    id: "relationship",
    number: 7,
    name: "Пошук зв'язків",
    subtitle: "Пошук афіліацій, спільних адрес та зв'язків",
    icon: "🕸️",
    category: "ROUTING",
    description: "Виявлення прихованих графів володіння, спільних телефонних номерів та спільних брокерів.",
    details: ["Неявні зв'язки: 1,420", "Каскади власності визначено", "Ребра графа підготовлено"],
  },
  {
    id: "graph_builder",
    number: 8,
    name: "Побудова графа",
    subtitle: "Генерація Cypher-запитів та ребер у Neo4j",
    icon: "🔗",
    category: "ROUTING",
    description: "Автоматичне створення вузлів (:Company), (:Person), (:Declaration) та ребер (:IMPORTS).",
    details: ["Вузлів створено: 45,200", "Ребер зв'язано: 128,400", "Cypher Batch: Зафіксовано"],
  },
  {
    id: "router",
    number: 9,
    name: "Маршрутизатор сховища",
    subtitle: "Автоматичне мультиплексування за типами даних",
    icon: "🔀",
    category: "ROUTING",
    description: "Маршрутизація сирих файлів у MinIO, векторів у Qdrant, таблиць у Postgres, логів у ClickHouse.",
    details: ["Двигун маршрутизації: Активний", "Призначення: 7 Баз Даних", "Безперебійна маршрутизація"],
  },
  {
    id: "multi_sink",
    number: 10,
    name: "Мульти-базовий приймач",
    subtitle: "Паралельний запис у 7 спеціалізованих БД",
    icon: "⚡",
    category: "STORAGE",
    description: "Паралельна синхронізація з PostgreSQL, ClickHouse, Neo4j, Qdrant, OpenSearch, Redis, MinIO.",
    details: ["Postgres WAL: Синхронізація", "ClickHouse MergeTree: Вставка", "Redis Memory Cache: Гарячий"],
  },
  {
    id: "indexing",
    number: 11,
    name: "Індексація та Кеш",
    subtitle: "Побудова OpenSearch індексів та гарячого кешу",
    icon: "💾",
    category: "STORAGE",
    description: "Індексація повнотекстового пошуку з підтримкою української морфології та псевдонімів.",
    details: ["Інвертований індекс пошуку: Створено", "Redis TTL: 86400s", "Відсоток попадання в кеш: 99.4%"],
  },
  {
    id: "verify",
    number: 12,
    name: "ШІ-Верифікація та QA",
    subtitle: "Підсумковий аудит якості та акцепт ШІ-конектора",
    icon: "✅",
    category: "VERIFY",
    description: "Автоматичний аудит Data Quality Index (98.2%), закриття батчу та публікація у каталозі.",
    details: ["Якість даних: 98.2%", "Аудит аномалій: Пройдено", "Статус конектора: ОПУБЛІКОВАНО"],
  },
];

export interface StorageDestination {
  id: string;
  name: string;
  type: string;
  dataType: string;
  icon: string;
  color: string;
  badge: string;
  rowsWritten: number;
}

const STORAGE_NODES: StorageDestination[] = [
  { id: "minio", name: "MinIO S3", type: "Об'єктне сховище", dataType: "PDF, DOCX, Parquet", icon: "📦", color: "from-amber-600 to-yellow-500", badge: "СИРІ ФАЙЛИ", rowsWritten: 1240 },
  { id: "qdrant", name: "Qdrant Vector DB", type: "Векторне сховище", dataType: "768-мірні ембединги", icon: "💎", color: "from-purple-600 to-indigo-500", badge: "ВЕКТОРИ", rowsWritten: 185000 },
  { id: "neo4j", name: "Neo4j Graph", type: "Графова БД", dataType: "Граф сутностей і зв'язків", icon: "🕸️", color: "from-cyan-600 to-blue-500", badge: "ГРАФ", rowsWritten: 128400 },
  { id: "postgres", name: "PostgreSQL", type: "Реляційна СУБД", dataType: "Структуровані декларації", icon: "🐘", color: "from-blue-600 to-teal-500", badge: "ТАБЛИЦІ", rowsWritten: 250000 },
  { id: "clickhouse", name: "ClickHouse", type: "Колонкова OLAP", dataType: "Аналітика та Логи", icon: "📊", color: "from-emerald-600 to-green-500", badge: "АНАЛІТИКА", rowsWritten: 250000 },
  { id: "opensearch", name: "OpenSearch", type: "Повнотекстовий пошук", dataType: "Морфологічний індекс", icon: "🔎", color: "from-rose-600 to-orange-500", badge: "ПОШУК", rowsWritten: 250000 },
  { id: "redis", name: "Redis Enterprise", type: "Кеш в пам'яті", dataType: "Гарячий стан та ліміти", icon: "⚡", color: "from-red-600 to-pink-500", badge: "КЕШ", rowsWritten: 45000 },
];

export default function DataIngestionPipeline() {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(4); // Step 5 actively running
  const [processedRows, setProcessedRows] = useState<number>(142500);
  const [totalRows, _setTotalRows] = useState<number>(250000);
  const [speedRowsPerSec, setSpeedRowsPerSec] = useState<number>(12800);
  const [invalidRecords, setInvalidRecords] = useState<number>(18);
  const [elapsedSec, setElapsedSec] = useState<number>(38);
  const [selectedSource, setSelectedSource] = useState<string>("customs_s3");
  const [selectedStepDetail, setSelectedStepDetail] = useState<PipelineStep | null>(PIPELINE_STEPS[4] || null);
  const [logMessages, setLogMessages] = useState<Array<{ time: string; level: string; msg: string; step: string }>>([
    { time: "00:00:02", level: "INFO", msg: "З'єднання з s3://customs-data-lake/ua_declarations_2026.parquet успішно встановлено.", step: "Source Discovery" },
    { time: "00:00:05", level: "SUCCESS", msg: "Згенеровано динамічний Parquet AST-парсер із нульовим копіюванням у пам'яті.", step: "Parser Generation" },
    { time: "00:00:12", level: "INFO", msg: "Проведено перевірку контрольних розрядів ЄДРПОУ/ІПН. Виявлено 18 невалідних структур.", step: "Validation & Clean" },
    { time: "00:00:20", level: "SUCCESS", msg: "Автоматично визначено Pydantic схему: 28 колонок, первинний ключ MD_NUMBER.", step: "Schema Detection" },
    { time: "00:00:32", level: "RUNNING", msg: "Виконується розпізнавання сутностей (NER): імпортери, брокери, УКТЗЕД коди та бенефіціари...", step: "Entity Recognition" },
  ]);

  const logConsoleRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    if (logConsoleRef.current) {
      logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight;
    }
  }, [logMessages]);

  // Simulation Interval
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = Math.max(200, 1000 / speedMultiplier);
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);

      // Increase row counts
      setProcessedRows((prev) => {
        const next = prev + Math.floor(Math.random() * 2000 + 11000);
        if (next >= totalRows) {
          setIsRunning(false);
          return totalRows;
        }
        return next;
      });

      // Fluctuate speed
      setSpeedRowsPerSec(Math.floor(Math.random() * 3000 + 11500));

      // Advance step index periodically
      if (Math.random() > 0.6) {
        setCurrentStepIndex((curr) => {
          if (curr < PIPELINE_STEPS.length - 1) {
            const nextIndex = curr + 1;
            const nextStep = PIPELINE_STEPS[nextIndex];
            
            // Append log
            const nowTime = new Date().toLocaleTimeString("uk-UA");
            setLogMessages((logs) => [
              ...logs.slice(-40),
              {
                time: nowTime,
                level: nextIndex === PIPELINE_STEPS.length - 1 ? "SUCCESS" : "RUNNING",
                msg: nextStep ? `Етап [${nextStep.name}] виконується: ${nextStep.description}` : "Етап виконується",
                step: nextStep?.name || "Unknown",
              },
            ]);

            return nextIndex;
          }
          return curr;
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speedMultiplier, totalRows]);

  // Reset Pipeline Simulation
  const handleReset = () => {
    setIsRunning(false);
    setCurrentStepIndex(0);
    setProcessedRows(0);
    setElapsedSec(0);
    setInvalidRecords(0);
    setSpeedRowsPerSec(0);
    setLogMessages([
      {
        time: new Date().toLocaleTimeString("uk-UA"),
        level: "INFO",
        msg: "Скинуто стан каскаду. Готово до нового витка навчання джерела.",
        step: "System Reset",
      },
    ]);
  };

  const progressPercent = Math.min(100, Math.round((processedRows / totalRows) * 100));

  return (
    <div className="flex flex-col gap-4 text-slate-100 font-sans">
      {/* HEADER CONTROL & LIVE METRICS BAR */}
      <div className="glass-panel-premium border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-500" />

        {/* Title & Source Selector */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/40 flex items-center justify-center text-xl shadow-lg shadow-amber-500/10 flex-shrink-0">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Живий конвеєр завантаження даних
              </h2>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-bold uppercase">
                ДВИГУН ПОТОКУ В РЕАЛЬНОМУ ЧАСІ
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">Джерело:</span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500/60 cursor-pointer"
              >
                <option value="customs_s3">🛃 S3 Parquet Lake — Митні декларації MД-1 (250k записів)</option>
                <option value="spending_api">🏦 REST API Spending.gov.ua — Казначейські платежі (180k записів)</option>
                <option value="court_graphql">⚖️ GraphQL court.gov.ua — Судові рішення ЄДРСР (120k записів)</option>
                <option value="opensanctions_sftp">🛡️ SFTP Dump — OpenSanctions & РНБО Списки (500k записів)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Speed Multiplier */}
          <div className="flex items-center gap-1 bg-black/40 border border-slate-800 rounded-xl p-1 text-xs font-mono">
            <span className="text-slate-500 px-1">ШВИДКІСТЬ:</span>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  speedMultiplier === spd
                    ? "bg-amber-500 text-slate-950 font-extrabold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Start/Pause/Reset Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
                isRunning
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30"
                  : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Пауза</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Запустити</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Скинути</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP LIVE METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Rows Processed */}
        <div className="glass-panel border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>ПРОГРЕС ОБРОБКИ</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {processedRows.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {totalRows.toLocaleString()}</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <motion.div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>{progressPercent}% ЗАВЕРШЕНО</span>
            <span className="text-emerald-400 font-bold">ОЧІКУВАННЯ: ~00:00:15</span>
          </div>
        </div>

        {/* Metric 2: Speed Rows / Sec */}
        <div className="glass-panel border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>ПРОПУСКНА ЗДАТНІСТЬ</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
              {speedRowsPerSec.toLocaleString()} <span className="text-xs text-emerald-500/80 font-normal">рядків/сек</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ПІКОВА ШВИДКІСТЬ: 15,200</span>
            <span className="text-cyan-400 font-bold">ПОТІК БЕЗ КОПІЙ</span>
          </div>
        </div>

        {/* Metric 3: Time Elapsed */}
        <div className="glass-panel border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>ЧАС ВИКОНАННЯ</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold font-mono text-cyan-300 tracking-tight">
              00:00:{elapsedSec < 10 ? `0${elapsedSec}` : elapsedSec}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ЗАТРИМКА: 12мс</span>
            <span className="text-amber-400 font-bold">11 АГЕНТІВ АКТИВНІ</span>
          </div>
        </div>

        {/* Metric 4: Invalid Records */}
        <div className="glass-panel border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>НЕВАЛІДНІ ЗАПИСИ</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold font-mono text-rose-400 tracking-tight">
              {invalidRecords} <span className="text-xs text-rose-500/80 font-normal">записів</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ІНДЕКС ЯКОСТІ ДАНИХ</span>
            <span className="text-emerald-400 font-bold">98.2% (ВІДМІННО)</span>
          </div>
        </div>
      </div>

      {/* PIPELINE VISUAL FLOW CARDS (12 ANIMATED STAGES) */}
      <div className="glass-panel-premium border-slate-800 rounded-2xl p-4 flex flex-col gap-3 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Інтерактивний живий каскад обробки (12 Етапів Data Pipeline)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            АКТИВНИЙ ЕТАП: #{currentStepIndex + 1} — {PIPELINE_STEPS[currentStepIndex]?.name}
          </span>
        </div>

        {/* Grid of 12 Interactive Pipeline Stage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isWaiting = idx > currentStepIndex;
            const isSelected = selectedStepDetail?.id === step.id;

            return (
              <motion.div
                key={step.id}
                onClick={() => setSelectedStepDetail(step)}
                whileHover={{ scale: 1.02 }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isCurrent
                    ? "bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/15"
                    : isCompleted
                    ? "bg-slate-900/60 border-emerald-500/40 hover:border-emerald-500/60"
                    : "bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-700"
                } ${isSelected ? "ring-2 ring-amber-400/80" : ""}`}
              >
                {/* Status Indicator Chip */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{step.icon}</span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{step.number}
                    </span>
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      ВИКОНУЄТЬСЯ
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      ГОТОВО
                    </span>
                  )}
                  {isWaiting && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      ОЧІКУВАННЯ
                    </span>
                  )}
                </div>

                {/* Step Title & Subtitle */}
                <div>
                  <h4 className={`text-xs font-bold ${isCurrent ? "text-amber-300" : isCompleted ? "text-slate-200" : "text-slate-400"}`}>
                    {step.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {step.subtitle}
                  </p>
                </div>

                {/* Stage Progress Bar / Stats */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">{step.category}</span>
                  {isCurrent && (
                    <span className="text-amber-400 font-bold">12,500/s</span>
                  )}
                  {isCompleted && (
                    <span className="text-emerald-400 font-bold">100%</span>
                  )}
                  {isWaiting && (
                    <span className="text-slate-600">0%</span>
                  )}
                </div>

                {/* Animated Glowing bar for active stage */}
                {isCurrent && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 w-full"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* STORAGE ROUTING VISUALIZER & STEP INSPECTOR */}
      <div className="grid grid-cols-12 gap-3">
        {/* Storage Router Dynamic Flow */}
        <div className="col-span-12 lg:col-span-7 glass-panel-premium border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Маршрутизатор сховища (Динамічна маршрутизація у 7 Баз Даних)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              МУЛЬТИ-ПРИЙМАЧ РЕДИРЕКТІВ
            </span>
          </div>

          {/* Storage Nodes Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 my-3">
            {STORAGE_NODES.map((node) => (
              <div
                key={node.id}
                className="p-3 bg-black/40 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{node.icon}</span>
                    <span className="text-xs font-bold text-slate-200">{node.name}</span>
                  </div>
                  <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                    {node.badge}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 font-mono mb-2">
                  {node.dataType}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500">ЗАПИСАНО:</span>
                  <span className="text-amber-400 font-bold">
                    {node.rowsWritten.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Маршрутизатор автоматично трансформує сутності під специфіку кожної БД.
            </span>
            <span className="text-cyan-400 font-bold">7/7 Сховищ Активні</span>
          </div>
        </div>

        {/* Selected Step Inspector & Terminal Logs */}
        <div className="col-span-12 lg:col-span-5 glass-panel-premium border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative bg-black/50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Живий термінал та перевірка
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">ЛОГИ ПОТОКУ</span>
          </div>

          {/* Active Step Specs */}
          {selectedStepDetail && (
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl my-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>{selectedStepDetail.icon}</span>
                  #{selectedStepDetail.number}. {selectedStepDetail.name}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {selectedStepDetail.category}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                {selectedStepDetail.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedStepDetail.details.map((d, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-black/60 text-cyan-300 border border-slate-800 px-2 py-0.5 rounded font-mono"
                  >
                    ✓ {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Terminal Console Logs */}
          <div
            ref={logConsoleRef}
            className="h-44 overflow-y-auto custom-scrollbar font-mono text-[11px] bg-black p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-slate-300"
          >
            {logMessages.map((log, i) => (
              <div key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 flex-shrink-0">[{log.time}]</span>
                <span
                  className={`font-bold text-[10px] px-1 rounded flex-shrink-0 ${
                    log.level === "SUCCESS"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : log.level === "RUNNING"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-cyan-500/20 text-cyan-400"
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-slate-300">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
