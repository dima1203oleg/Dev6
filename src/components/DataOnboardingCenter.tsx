import React, { useState, useEffect } from "react";
import {
  Database,
  Activity,
  Bot,
  RefreshCw,
  X,
  CircleDot,
  Zap,
  CheckCircle2,
  HardDrive,
  Cpu,
  Network,
  FileText,
  Eye,
  Sparkles,
  Check,
  BarChart2,
  ArrowRight,
  Link as LinkIcon,
  Box,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./ToastProvider";

// Define Pipeline Stage Interface
export interface PipelineStage {
  id: string;
  name: string;
  category: "INGEST" | "PROCESS" | "ENRICH" | "GRAPH" | "STORAGE" | "VERIFY";
  status: "WAITING" | "RUNNING" | "ERROR" | "COMPLETED";
  progress: number; // 0 to 100
  rowsProcessed: number;
  totalRows: number;
  speedRowsPerSec: number;
  timeElapsedSeconds: number;
  invalidRecords: number;
  description: string;
}

// Preset Domains for 1-Click Domain Onboarding
export interface DomainPreset {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  sourceType: string;
  sampleEndpoint: string;
  domainSubject: string;
  expectedEntities: string[];
  recommendedModules: string[];
  targetRows: number;
  sampleRecords: any[];
}

export const DOMAIN_PRESETS: DomainPreset[] = [
  {
    id: "customs",
    title: "Митний брокер / ЗЕД",
    subtitle: "Митні декларації, вантажі, контейнери, УКТЗЕД, Incoterms",
    icon: "🛃",
    color: "from-blue-600 to-cyan-500",
    sourceType: "S3 / MinIO Parquet Lake",
    sampleEndpoint: "s3://customs-data-lake/ua_declarations_2026.parquet",
    domainSubject: "Митні декларації та ЗЕД контракти",
    expectedEntities: [
      "Company (Імпортер/Експортер)",
      "Broker",
      "Declaration (МД-1)",
      "Commodity (УКТЗЕД)",
      "Container",
      "Vehicle",
      "Incoterms",
      "Invoice",
      "Country of Origin",
      "Risk Indicator",
    ],
    recommendedModules: [
      "Customs Risk Analytics",
      "Sanctions Screening",
      "AML & Pricing Anomaly",
      "Graph Supply Chain",
    ],
    targetRows: 250000,
    sampleRecords: [
      {
        id: "MD-2026-883910",
        date: "2026-07-22 14:20",
        importer: "ТОВ 'ЛОГІСТИК-ТРАНС-УКРАЇНА' (ЄДРПОУ 39281049)",
        exporter: "GLOBAL FREIGHT LOGISTICS GMBH (DE81239102)",
        hs_code: "8471300000",
        hs_desc: "Машини автоматичного оброблення інформації (ноутбуки)",
        customs_val_usd: 145800.0,
        incoterms: "FOB Hamburg",
        broker: "ПП 'БРОК-СЕРВІС' (ЄДРПОУ 38192039)",
        country_origin: "DE (Німеччина)",
        risk_flag: "CLEAN",
      },
      {
        id: "MD-2026-883911",
        date: "2026-07-22 14:35",
        importer: "ТОВ 'СПЕЦТЕХНО-ІМПОРТ' (ЄДРПОУ 41029384)",
        exporter: "SINO TECH SUPPLIES LTD (HK9102381)",
        hs_code: "8517620000",
        hs_desc: "Пристрої для прийому, перетворення і передачі голосу та зображень",
        customs_val_usd: 312000.0,
        incoterms: "CIF Odesa",
        broker: "ТОВ 'АЛЬФА-БРОК' (ЄДРПОУ 40192831)",
        country_origin: "CN (Китай)",
        risk_flag: "PRICE_ANOMALY_WARNING",
      },
      {
        id: "MD-2026-883912",
        date: "2026-07-22 15:02",
        importer: "ТОВ 'ЕНЕРГО-АЛЬЯНС' (ЄДРПОУ 37819203)",
        exporter: "NEFT-ENERGO EXPORT LLC (RU1029381023)",
        hs_code: "2710198100",
        hs_desc: "Моторні оливи та дизельне паливо",
        customs_val_usd: 890000.0,
        incoterms: "DAP Izmail",
        broker: "ТОВ 'ДУНАЙ-БРОК' (ЄДРПОУ 39021823)",
        country_origin: "RU (Підсанкційне джерело)",
        risk_flag: "SANCTIONS_BLOCKED",
      },
    ],
  },
  {
    id: "bank_aml",
    title: "Банк & Фінансовий моніторинг",
    subtitle: "Платежі Spending.gov.ua, PEP декларації НАЗК, IBAN реестр",
    icon: "🏦",
    color: "from-emerald-600 to-teal-500",
    sourceType: "REST API + Webhook Stream",
    sampleEndpoint: "https://api.spending.gov.ua/rest/v1/transactions",
    domainSubject: "Публічні транзакції та Фінансовий моніторинг",
    expectedEntities: [
      "Payer (Платник ЄДРПОУ)",
      "Recipient (Отримувач)",
      "IBAN Account",
      "Bank (МФО)",
      "PEP (Особа під моніторингом)",
      "Transaction",
      "Treasury Code",
      "Risk Score",
    ],
    recommendedModules: [
      "AML Fraud Detection",
      "PEP & Affiliations Matrix",
      "Treasury Spending Graph",
      "Real-time Alerts",
    ],
    targetRows: 180000,
    sampleRecords: [
      {
        id: "TX-99823019",
        date: "2026-07-23 09:15",
        payer: "Державна казначейська служба України (ЄДРПОУ 37567819)",
        payer_iban: "UA82820000000000000002600100",
        recipient: "ТОВ 'СПЕЦІАЛЬНІ ТЕХНОЛОГІЇ БЕЗПЕКИ' (ЄДРПОУ 38491823)",
        recipient_iban: "UA123013000002600412903481",
        amount_uah: 4500000.0,
        purpose: "Оплата за комплект серверного обладнання згідно з договором №45-Т",
        pep_linked: "Козаченко А.М. (Засновник - PEP)",
        risk_flag: "PEP_BENEFICIARY_ALERT",
      },
      {
        id: "TX-99823020",
        date: "2026-07-23 09:40",
        payer: "Виконавчий комітет міської ради (ЄДРПОУ 04052391)",
        payer_iban: "UA12320000000000000003500210",
        recipient: "ФОП Петренко Іван Васильович (ІПН 2938102938)",
        recipient_iban: "UA453052990000026009823910",
        amount_uah: 198000.0,
        purpose: "Послуги з поточного ремонту асфальтного покриття",
        pep_linked: "Немає",
        risk_flag: "VERIFIED",
      },
    ],
  },
  {
    id: "legal_court",
    title: "Юридична компанія & Адвокатура",
    subtitle: "ЄДРСР судові рішення, справи CourtListener, позови ВРУ",
    icon: "⚖️",
    color: "from-purple-600 to-indigo-500",
    sourceType: "GraphQL API / OData",
    sampleEndpoint: "https://court.gov.ua/odata/v1/decisions",
    domainSubject: "Судова практика та Аналіз правових ризиків",
    expectedEntities: [
      "Court Decision",
      "Case Number",
      "Judge",
      "Plaintiff (Позивач)",
      "Defendant (Відповідач)",
      "Criminal/Civil Article",
      "Penalty Amount",
    ],
    recommendedModules: [
      "Court Decisions NLP",
      "Judge Analytics",
      "Corporate Litigation Graph",
      "Legal Vector Qdrant",
    ],
    targetRows: 120000,
    sampleRecords: [
      {
        id: "CASE-910/12839/25",
        date: "2026-06-18",
        court_name: "Господарський суд міста Києва",
        judge: "Суддя Ковтун С.А.",
        plaintiff: "ПАТ 'НАЦІОНАЛЬНА ЕНЕРГОКОМПАНІЯ' (ЄДРПОУ 00032910)",
        defendant: "ТОВ 'ПРОМ-ЕНЕРГО' (ЄДРПОУ 37192834)",
        category: "Господарські правопорушення / Стягнення заборгованості",
        claim_amount_uah: 12400000.0,
        verdict: "Позов задовольнити повністю",
        risk_flag: "HIGH_MONETARY_CLAIM",
      },
    ],
  },
  {
    id: "security_osint",
    title: "Служба безпеки & OSINT",
    subtitle: "Санкційні списки OpenSanctions, РНБО, медіа GDELT, AlienVault OTX",
    icon: "🛡️",
    color: "from-rose-600 to-red-500",
    sourceType: "SFTP / Daily Darknet & Registry Dump",
    sampleEndpoint: "s3://predator-osint/opensanctions_rnbo_combined.json.gz",
    domainSubject: "Глобальні санкції, загрози та перевірка бекграунду",
    expectedEntities: [
      "Sanctioned Person",
      "Sanctioned Company",
      "Vessel / Aircraft",
      "Crypto Wallet",
      "Threat Actor",
      "IP / Domain IoC",
      "Offshore Entity",
    ],
    recommendedModules: [
      "Sanctions Matching",
      "OSINT Knowledge Graph",
      "Threat Intelligence (OTX)",
      "Deepfake & Media Verification",
    ],
    targetRows: 500000,
    sampleRecords: [
      {
        id: "SANCTION-RNBO-8812",
        date: "2026-05-10",
        entity_name: "ВЕКТОР-ХОЛДИНГ ЛТД / VECTOR HOLDING LTD",
        tax_id: "RU103773910293",
        sanction_body: "РНБО України (Указ №289/2026) / OFAC SDN List",
        reason: "Фінансування військово-промислового комплексу країни-агресора",
        aliases: ["Vector Defence Solutions", "Vector Global Trading FZE"],
        risk_flag: "CRITICAL_SANCTIONED",
      },
    ],
  },
  {
    id: "logistics",
    title: "Логістика & Судноплавство",
    subtitle: "Реєстри ТТН, контейнери, судна AIS, геокодування Nominatim",
    icon: "🚚",
    color: "from-amber-600 to-orange-500",
    sourceType: "Kafka / Webhook Live Stream",
    sampleEndpoint: "wss://logistics-stream.predator.internal/ais/v1",
    domainSubject: "Логістичний трекінг та Транскордонні маршрути",
    expectedEntities: [
      "Ship / AIS Vessel",
      "Port of Loading",
      "Port of Discharge",
      "Container No",
      "TTN Document",
      "Carrier Company",
      "Route Waypoints",
    ],
    recommendedModules: [
      "Geospatial Map Nominatim",
      "Vessel AIS Tracking",
      "Border Crossing Matrix",
    ],
    targetRows: 300000,
    sampleRecords: [
      {
        id: "AIS-IMO-9812391",
        vessel_name: "MV BLACK SEA STAR",
        imo_number: "9812391",
        flag_country: "PA (Панама)",
        current_coordinates: "46.4825 N, 30.7233 E (Порт Одеса)",
        destination: "Port of Constanta (RO)",
        cargo_type: "Зернові культури (Пшениця 55,000 тонн)",
        carrier: "BLACK SEA SHIPPING CORP",
        risk_flag: "TRACKING_ACTIVE",
      },
    ],
  },
];

// 11 Autonomous Sub-Agents
export interface SubAgentState {
  id: string;
  name: string;
  role: string;
  status: "ACTIVE" | "STANDBY" | "PROCESSING" | "COMPLETED";
  cpuLoad: number; // %
  ramUsageMb: number;
  queueCount: number;
  lastOp: string;
}

const INITIAL_SUB_AGENTS: SubAgentState[] = [
  {
    id: "discovery",
    name: "Discovery Agent",
    role: "Аналіз протоколу, заголовок, сканування Swagger/OData",
    status: "ACTIVE",
    cpuLoad: 12,
    ramUsageMb: 240,
    queueCount: 0,
    lastOp: "Перевірка токена доступу та ендпоінта",
  },
  {
    id: "parser",
    name: "Parser Agent",
    role: "Розпакування Parquet/JSON/CSV/PDF/Docx",
    status: "PROCESSING",
    cpuLoad: 45,
    ramUsageMb: 580,
    queueCount: 1420,
    lastOp: "Парсинг блоку 12,500 записів",
  },
  {
    id: "validation",
    name: "Validation Agent",
    role: "Перевірка контрольних сум ЄДРПОУ/ІПН/IBAN",
    status: "PROCESSING",
    cpuLoad: 28,
    ramUsageMb: 310,
    queueCount: 890,
    lastOp: "Валідація 15 аномальних даних",
  },
  {
    id: "ocr",
    name: "OCR Agent",
    role: "Tesseract & Vision LLM для растрових PDF/сканів",
    status: "STANDBY",
    cpuLoad: 2,
    ramUsageMb: 190,
    queueCount: 0,
    lastOp: "В очікуванні растрових документів",
  },
  {
    id: "ner",
    name: "NER Agent",
    role: "Вилучення сутностей (Компанії, PEP, Судна, Валюта)",
    status: "PROCESSING",
    cpuLoad: 68,
    ramUsageMb: 1240,
    queueCount: 2310,
    lastOp: "Розпізнавання бенефіціарів та афілійованих осіб",
  },
  {
    id: "embedding",
    name: "Embedding Agent",
    role: "Генерація 768-мірних векторів для Qdrant",
    status: "PROCESSING",
    cpuLoad: 74,
    ramUsageMb: 1650,
    queueCount: 1890,
    lastOp: "Генерація векторних представлень назв та текстів",
  },
  {
    id: "graph",
    name: "Graph Agent",
    role: "Побудова вузлів та ребер графу зв'язків у Neo4j",
    status: "PROCESSING",
    cpuLoad: 52,
    ramUsageMb: 890,
    queueCount: 940,
    lastOp: "Зв'язування компанії з PEP та бенефіціаром",
  },
  {
    id: "etl",
    name: "ETL Agent",
    role: "Трансформація, типів даних, часових міток",
    status: "PROCESSING",
    cpuLoad: 38,
    ramUsageMb: 420,
    queueCount: 610,
    lastOp: "Приведення дат до ISO-8601 та кодувань UTF-8",
  },
  {
    id: "storage",
    name: "Storage Agent",
    role: "Мультиплексування та запис у 7 БД",
    status: "PROCESSING",
    cpuLoad: 41,
    ramUsageMb: 630,
    queueCount: 420,
    lastOp: "Паралельний маршрутизований запис",
  },
  {
    id: "qa",
    name: "QA Agent",
    role: "Аудит цілісності, дедуплікація та перевірка дельт",
    status: "ACTIVE",
    cpuLoad: 18,
    ramUsageMb: 220,
    queueCount: 0,
    lastOp: "Розрахунок Data Quality Index (97.8%)",
  },
  {
    id: "security",
    name: "Security Agent",
    role: "DLP сканування, шифрування, права доступу",
    status: "ACTIVE",
    cpuLoad: 9,
    ramUsageMb: 180,
    queueCount: 0,
    lastOp: "Шифрування чутливих персональних полів",
  },
];

export default function DataOnboardingCenter() {
  const { showToast } = useToast();

  // Active domain preset
  const [selectedPreset, setSelectedPreset] = useState<DomainPreset>(() => {
    const preset = DOMAIN_PRESETS[0];
    if (preset) return preset;
    // Fallback if array is empty
    return {
      id: "custom",
      title: "Custom Source",
      subtitle: "Custom data source",
      icon: "🔌",
      color: "from-slate-600 to-slate-500",
      sourceType: "S3 / MinIO",
      sampleEndpoint: "s3://custom-bucket/data.parquet",
      domainSubject: "Custom",
      expectedEntities: [],
      recommendedModules: [],
      targetRows: 0,
      sampleRecords: [],
    };
  });

  // Form inputs
  const [sourceName, setSourceName] = useState<string>(
    "Митний масив декларацій MД-1 (S3 Parquet)"
  );
  const [protocolType, setProtocolType] = useState<string>("S3 / MinIO");
  const [endpointUrl, setEndpointUrl] = useState<string>(
    "s3://customs-data-lake/ua_declarations_2026.parquet"
  );
  const [authMethod, setAuthMethod] = useState<string>("AWS IAM / Vault");
  const [syncSchedule, setSyncSchedule] = useState<string>("Інкрементально кожні 6 год");

  // Pipeline Execution State
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [pipelineFinished, setPipelineFinished] = useState<boolean>(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [processedRowsCount, setProcessedRowsCount] = useState<number>(0);
  const [throughputSpeed, setThroughputSpeed] = useState<number>(0); // rows/sec
  const [invalidRecordsCount, setInvalidRecordsCount] = useState<number>(0);

  // Sub-Agents State
  const [subAgents, setSubAgents] =
    useState<SubAgentState[]>(INITIAL_SUB_AGENTS);

  // Generated Connector catalog item after finish
  const [createdConnector, setCreatedConnector] = useState<any | null>(null);

  // Interactive Data Preview Selected Row Modal
  const [selectedPreviewRow, setSelectedPreviewRow] = useState<any | null>(
    null
  );

  // Define 18 Pipeline Stages
  const stagesList: PipelineStage[] = [
    {
      id: "src",
      name: "1. Джерело",
      category: "INGEST",
      status:
        activeStageIndex > 0
          ? "COMPLETED"
          : activeStageIndex === 0
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 0 ? 100 : activeStageIndex === 0 ? 80 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: 0,
      description: "З'єднання з протоколом " + protocolType,
    },
    {
      id: "check",
      name: "2. Перевірка",
      category: "INGEST",
      status:
        activeStageIndex > 1
          ? "COMPLETED"
          : activeStageIndex === 1
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 1 ? 100 : activeStageIndex === 1 ? 90 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: 0,
      description: "Перевірка Ping, SSL, Vault Key, rate-limits",
    },
    {
      id: "connect",
      name: "3. Підключення",
      category: "INGEST",
      status:
        activeStageIndex > 2
          ? "COMPLETED"
          : activeStageIndex === 2
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 2 ? 100 : activeStageIndex === 2 ? 85 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: 0,
      description: "Встановлення сокет-з'єднання та сесії",
    },
    {
      id: "download",
      name: "4. Завантаження",
      category: "INGEST",
      status:
        activeStageIndex > 3
          ? "COMPLETED"
          : activeStageIndex === 3
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 3 ? 100 : activeStageIndex === 3 ? 60 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: 0,
      description: "Буферизація в тимчасову зону MinIO raw-bucket",
    },
    {
      id: "validation",
      name: "5. Валідація",
      category: "PROCESS",
      status:
        activeStageIndex > 4
          ? "COMPLETED"
          : activeStageIndex === 4
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 4 ? 100 : activeStageIndex === 4 ? 75 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Перевірка цілісності та форматів полів",
    },
    {
      id: "parser",
      name: "6. Парсер",
      category: "PROCESS",
      status:
        activeStageIndex > 5
          ? "COMPLETED"
          : activeStageIndex === 5
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 5 ? 100 : activeStageIndex === 5 ? 70 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Стрімінговий парсинг структури даних",
    },
    {
      id: "clean",
      name: "7. Очистка",
      category: "PROCESS",
      status:
        activeStageIndex > 6
          ? "COMPLETED"
          : activeStageIndex === 6
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 6 ? 100 : activeStageIndex === 6 ? 90 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Видалення дублікатів та битих спецсимволів",
    },
    {
      id: "normalization",
      name: "8. Нормалізація",
      category: "PROCESS",
      status:
        activeStageIndex > 7
          ? "COMPLETED"
          : activeStageIndex === 7
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 7 ? 100 : activeStageIndex === 7 ? 85 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Приведення дат, сум, назв та регістрів",
    },
    {
      id: "schema_detection",
      name: "9. Визначення схеми",
      category: "ENRICH",
      status:
        activeStageIndex > 8
          ? "COMPLETED"
          : activeStageIndex === 8
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 8 ? 100 : activeStageIndex === 8 ? 95 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Автовизначення типів колонок та Pydantic схеми",
    },
    {
      id: "ner",
      name: "10. Розпізнавання сутностей",
      category: "ENRICH",
      status:
        activeStageIndex > 9
          ? "COMPLETED"
          : activeStageIndex === 9
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 9 ? 100 : activeStageIndex === 9 ? 80 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "ШІ-розпізнавання Компаній, PEP, Суден, Товарів",
    },
    {
      id: "embedding",
      name: "11. Векторне вбудовування",
      category: "ENRICH",
      status:
        activeStageIndex > 10
          ? "COMPLETED"
          : activeStageIndex === 10
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 10 ? 100 : activeStageIndex === 10 ? 70 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Векторизація тексту для семантичного Qdrant",
    },
    {
      id: "relationship",
      name: "12. Виявлення зв'язків",
      category: "GRAPH",
      status:
        activeStageIndex > 11
          ? "COMPLETED"
          : activeStageIndex === 11
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 11 ? 100 : activeStageIndex === 11 ? 85 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Пошук неявних зв'язків між суб'єктами",
    },
    {
      id: "graph_builder",
      name: "13. Побудова графа",
      category: "GRAPH",
      status:
        activeStageIndex > 12
          ? "COMPLETED"
          : activeStageIndex === 12
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 12 ? 100 : activeStageIndex === 12 ? 90 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Генерація графових ребер і вузлів у Neo4j",
    },
    {
      id: "storage_router",
      name: "14. Маршрутизатор",
      category: "STORAGE",
      status:
        activeStageIndex > 13
          ? "COMPLETED"
          : activeStageIndex === 13
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 13 ? 100 : activeStageIndex === 13 ? 95 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Автоматичний розподіл даних між 7 БД",
    },
    {
      id: "db_write",
      name: "15. Мульти-БД сховище",
      category: "STORAGE",
      status:
        activeStageIndex > 14
          ? "COMPLETED"
          : activeStageIndex === 14
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 14 ? 100 : activeStageIndex === 14 ? 80 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Паралельний запис у Postgres, ClickHouse, Neo4j...",
    },
    {
      id: "indexing",
      name: "16. Індексація",
      category: "STORAGE",
      status:
        activeStageIndex > 15
          ? "COMPLETED"
          : activeStageIndex === 15
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 15 ? 100 : activeStageIndex === 15 ? 90 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Побудова повнотекстового індексу OpenSearch & Redis",
    },
    {
      id: "ai_verify",
      name: "17. ШІ-перевірка",
      category: "VERIFY",
      status:
        activeStageIndex > 16
          ? "COMPLETED"
          : activeStageIndex === 16
          ? "RUNNING"
          : "WAITING",
      progress:
        activeStageIndex > 16 ? 100 : activeStageIndex === 16 ? 95 : 0,
      rowsProcessed: processedRowsCount,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Підсумковий аудит якості та аномалій ШІ",
    },
    {
      id: "complete",
      name: "18. Завершено",
      category: "VERIFY",
      status: pipelineFinished ? "COMPLETED" : "WAITING",
      progress: pipelineFinished ? 100 : 0,
      rowsProcessed: selectedPreset.targetRows,
      totalRows: selectedPreset.targetRows,
      speedRowsPerSec: throughputSpeed,
      timeElapsedSeconds: elapsedSeconds,
      invalidRecords: invalidRecordsCount,
      description: "Конектор згенеровано та додано до каталогу",
    },
  ];

  // Select Preset Handler
  const handleSelectPreset = (p: DomainPreset) => {
    setSelectedPreset(p);
    setSourceName(`${p.title} (Навчальний масив)`);
    setProtocolType(p.sourceType.split(" ")[0] || "S3");
    setEndpointUrl(p.sampleEndpoint);
    setIsRunningPipeline(false);
    setPipelineFinished(false);
    setActiveStageIndex(-1);
    setProcessedRowsCount(0);
    setElapsedSeconds(0);
    setThroughputSpeed(0);
    setInvalidRecordsCount(0);
    setCreatedConnector(null);
  };

  // Start Pipeline Simulation
  const handleStartPipeline = () => {
    if (isRunningPipeline) return;
    setIsRunningPipeline(true);
    setPipelineFinished(false);
    setActiveStageIndex(0);
    setElapsedSeconds(0);
    setProcessedRowsCount(0);
    setThroughputSpeed(12500);
    setInvalidRecordsCount(0);
    setCreatedConnector(null);

    showToast(
      "🚀 Розпочато процес підключення та навчання ШІ з джерелом " + sourceName,
      "info"
    );
  };

  // Simulation step timer
  useEffect(() => {
    if (!isRunningPipeline || pipelineFinished) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      // Randomly adjust subagent CPU & RAM
      setSubAgents((prev) =>
        prev.map((ag) => ({
          ...ag,
          cpuLoad: Math.floor(Math.random() * 60 + 20),
          ramUsageMb: ag.ramUsageMb + Math.floor(Math.random() * 10 - 4),
        }))
      );

      const target = selectedPreset.targetRows;
      const stepRows = Math.floor(target / 17);

      setProcessedRowsCount((prev) => Math.min(target, prev + stepRows));
      setThroughputSpeed(Math.floor(Math.random() * 3000 + 11000));
      if (Math.random() > 0.6) {
        setInvalidRecordsCount((prev) => prev + Math.floor(Math.random() * 3 + 1));
      }

      setActiveStageIndex((curr) => {
        const next = curr + 1;
        if (next >= 17) {
          setTimeout(() => {
            setIsRunningPipeline(false);
            setPipelineFinished(true);
            setProcessedRowsCount(target);
            showToast(
              "🎉 Навчання завершено! Створено новий конектор та правила графа для " +
                selectedPreset.title,
              "success"
            );

            // Build generated connector card
            setCreatedConnector({
              id: `conn-${Date.now()}`,
              name: sourceName,
              domainSubject: selectedPreset.domainSubject,
              protocol: protocolType,
              author: "PREDATOR AI Engine (Auto Trained)",
              version: "v1.0.0-PROD",
              createdAt: new Date().toLocaleDateString("uk-UA"),
              syncSchedule: syncSchedule,
              rowsProcessed: target,
              latencyMs: 145,
              confidenceScore: 99.2,
              dataQualityIndex: 97.8,
              healthScore: 100,
              detectedEntities: selectedPreset.expectedEntities,
              recommendedModules: selectedPreset.recommendedModules,
              storageMapping: {
                rawFiles: "MinIO (raw-bucket)",
                vectors: "Qdrant (768-dim)",
                entitiesGraph: "Neo4j (nodes & edges)",
                structuredTables: "PostgreSQL",
                analyticsLogs: "ClickHouse",
                cacheState: "Redis",
                fulltextSearch: "OpenSearch",
              },
            });
          }, 0);
          return 17;
        }
        return next;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isRunningPipeline, pipelineFinished, selectedPreset, sourceName, protocolType, syncSchedule, showToast]);

  return (
    <div className="flex flex-col gap-4 text-slate-100 font-sans">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-500" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-amber-500/10">
            🧠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Data Onboarding Center
              </h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                САМОНАВЧАЛЬНА ШІ ФАБРИКА
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Центр підключення джерел та навчання PREDATOR Analytics предметній області користувача
            </p>
          </div>
        </div>

        {/* Live System Specs */}
        <div className="flex items-center gap-4 bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">ПІДКЛЮЧЕНО ДЖЕРЕЛ</span>
            <span className="text-emerald-400 font-bold">15/15 Активні</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">АВТОНОМНИХ АГЕНТІВ</span>
            <span className="text-cyan-400 font-bold">11 Працюють</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px]">ШВИДКІСТЬ ІНДЕКСАЦІЇ</span>
            <span className="text-amber-400 font-bold">12,500 rows/sec</span>
          </div>
        </div>
      </div>

      {/* 1-CLICK PRESET DOMAINS BAR */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Оберіть предметну область для швидкого розгортання та навчання ШІ:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {DOMAIN_PRESETS.map((p) => {
            const isSel = selectedPreset.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  isSel
                    ? "bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                {isSel && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-full border-b border-l border-amber-500/30 flex items-start justify-end p-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{p.icon}</span>
                    <span
                      className={`text-xs font-bold tracking-tight ${
                        isSel ? "text-amber-300" : "text-slate-200"
                      }`}
                    >
                      {p.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {p.subtitle}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{p.sourceType}</span>
                  <span className="text-amber-400 font-bold">~{p.targetRows.toLocaleString()} записів</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SOURCE CONNECTION FORM & LIVE AI INSPECTOR PANEL */}
      <div className="grid grid-cols-12 gap-3">
        {/* Connection Setup Form */}
        <div className="col-span-12 lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3 relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                1. Параметри підключення джерела даних
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              ПРОТОКОЛ: {protocolType}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Назва джерела або реєстру
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Протокол / Тип передачі
              </label>
              <select
                value={protocolType}
                onChange={(e) => setProtocolType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="S3 / MinIO">S3 / MinIO Parquet Bucket</option>
                <option value="REST API">REST API / OpenAPI v3</option>
                <option value="GraphQL">GraphQL API</option>
                <option value="SOAP">SOAP / XML Web Service</option>
                <option value="FTP / SFTP">SFTP / FTP File Dump</option>
                <option value="Telegram">Telegram Channel / Bot</option>
                <option value="PostgreSQL">PostgreSQL / MySQL Direct DB</option>
                <option value="Google Drive">Google Drive / SharePoint</option>
                <option value="CKAN">CKAN Open Data Portal</option>
                <option value="PDF / Docx Batch">PDF / DOCX Document Batch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">
              URL ендпоінту / Шлях до файлів або S3 бакету
            </label>
            <div className="relative">
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-amber-500/60 pr-10"
              />
              <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Метод авторизації / Ключі Vault
              </label>
              <select
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="AWS IAM / Vault">HashiCorp Vault / IAM Role</option>
                <option value="Bearer Token">Bearer Token (OAuth2)</option>
                <option value="API Key">API Key Header</option>
                <option value="mTLS">mTLS Client Certificate</option>
                <option value="None">Відкрите джерело (None)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Розклад синхронізації
              </label>
              <select
                value={syncSchedule}
                onChange={(e) => setSyncSchedule(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="Інкрементально кожні 6 год">Інкрементально кожні 6 год</option>
                <option value="Реальний час (Streaming)">Реальний час (Webhooks / Kafka)</option>
                <option value="Щоденний Bulk">Щоденний Bulk (03:00 AM)</option>
                <option value="За вимогою (On Demand)">За вимогою (On Demand)</option>
              </select>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Готово до запуску каскаду
            </div>

            <button
              onClick={handleStartPipeline}
              disabled={isRunningPipeline}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
                isRunningPipeline
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 active:scale-95"
              }`}
            >
              {isRunningPipeline ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                  <span>Виконується каскад навчання...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>🚀 Почати завантаження та навчання</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Inspector Side Panel */}
        <div className="col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900 to-indigo-950/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AI Inspector (Аналіз джерела)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              AI CONFIDENCE: 99.4%
            </span>
          </div>

          <div className="flex-1 p-2 sm:p-3 md:p-4 flex flex-col gap-3 sm:gap-4 bg-slate-950 h-full w-full">
            <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-mono">Тип джерела:</span>
              <span className="font-bold text-cyan-300 font-mono">{protocolType}</span>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-mono">Тематика:</span>
              <span className="font-bold text-amber-300">{selectedPreset.domainSubject}</span>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-mono">Мова та кодування:</span>
              <span className="font-bold text-emerald-300 font-mono">Українська (UTF-8)</span>
            </div>

            <div className="p-2 rounded-xl bg-black/40 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1 font-mono">
                Визначені сутності (NER Schema):
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedPreset.expectedEntities.map((ent, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-800 text-amber-200 border border-slate-700 px-2 py-0.5 rounded font-mono"
                  >
                    {ent}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-black/40 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-1 font-mono">
                Рекомендовані модулі PREDATOR:
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedPreset.recommendedModules.map((mod, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-indigo-950/60 text-cyan-300 border border-indigo-800/60 px-2 py-0.5 rounded font-mono"
                  >
                    ✓ {mod}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Якість даних (Data Quality):</span>
            <span className="text-emerald-400 font-bold">97.8% (Відмінно)</span>
          </div>
        </div>
      </div>

      {/* VISUAL LIVE PIPELINE MAP (18 INTERACTIVE STAGES) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              2. Жива карта каскаду даних (Live Data Ingestion Pipeline Map)
            </h3>
          </div>

          {/* Execution Metrics Bar */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-black/50 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500">ПРОГРЕС:</span>
              <span className="text-amber-400 font-bold">
                {processedRowsCount.toLocaleString()} / {selectedPreset.targetRows.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/50 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500">ШВИДКІСТЬ:</span>
              <span className="text-emerald-400 font-bold">
                {throughputSpeed.toLocaleString()} rows/sec
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/50 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500">ЧАС:</span>
              <span className="text-cyan-400 font-bold">
                00:00:{elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/50 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500">ПОМИЛКИ:</span>
              <span className="text-rose-400 font-bold">
                {invalidRecordsCount} invalid
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Stages Flow Map */}
        <div className="overflow-x-auto custom-scrollbar py-2">
          <div className="flex items-center gap-2 min-w-[1400px]">
            {stagesList.map((stg, idx) => {
              const isRun = stg.status === "RUNNING";
              const isComp = stg.status === "COMPLETED";

              return (
                <React.Fragment key={stg.id}>
                  <div
                    className={`p-2.5 rounded-xl border flex-shrink-0 w-44 flex flex-col justify-between transition-all relative ${
                      isRun
                        ? "bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-500/20 scale-105"
                        : isComp
                        ? "bg-emerald-950/20 border-emerald-500/60"
                        : "bg-slate-900/40 border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-200 tracking-tight truncate">
                        {stg.name}
                      </span>
                      {isComp ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isRun ? (
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      ) : (
                        <CircleDot className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 mb-2 leading-snug line-clamp-2">
                      {stg.description}
                    </p>

                    {/* Stage Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-slate-400">
                        <span>
                          {isComp ? "Готово" : isRun ? "Обробка" : "Чекає"}
                        </span>
                        <span
                          className={
                            isComp
                              ? "text-emerald-400 font-bold"
                              : isRun
                              ? "text-amber-400 font-bold"
                              : "text-slate-600"
                          }
                        >
                          {stg.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isComp
                              ? "bg-emerald-400"
                              : isRun
                              ? "bg-gradient-to-r from-amber-500 to-amber-300 animate-pulse"
                              : "bg-slate-800"
                          }`}
                          style={{ width: `${stg.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {idx < stagesList.length - 1 && (
                    <ArrowRight
                      className={`w-4 h-4 flex-shrink-0 ${
                        isComp
                          ? "text-emerald-400"
                          : isRun
                          ? "text-amber-400 animate-pulse"
                          : "text-slate-700"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* AUTOMATIC STORAGE ROUTER VISUALIZER & LIVE WORKER MONITOR */}
      <div className="grid grid-cols-12 gap-3">
        {/* Storage Router Visualizer */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                3. Автоматичний Storage Router (Маршрутизація даних)
              </h3>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">
              7 СПЕЦІАЛІЗОВАНИХ БД
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-200">PDF / Скани / Файли</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-mono text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                MinIO Object Storage (raw-bucket)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-slate-200">Тексти & Вектори</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-mono text-purple-300 bg-purple-950/40 border border-purple-800/60 px-2 py-0.5 rounded">
                Qdrant Vector DB (768-dim)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-slate-800">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-200">Сутності & Зв'язки</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-mono text-indigo-300 bg-indigo-950/40 border border-indigo-800/60 px-2 py-0.5 rounded">
                Neo4j Knowledge Graph
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">Структуровані табло</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 px-2 py-0.5 rounded">
                PostgreSQL (Core Entities)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">Логи & Часові ряди</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                ClickHouse OLAP Engine
              </span>
            </div>
          </div>
        </div>

        {/* Live Worker Monitor Panel (11 Sub-Agents) */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                4. Live Worker Monitor (11 Автономних ШІ Агентів)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              ВУЗЛІВ: 11 ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {subAgents.map((ag) => (
              <div
                key={ag.id}
                className="p-2 rounded-xl bg-black/40 border border-slate-800/80 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">
                    {ag.name}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                    {ag.status}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 truncate mb-1">
                  {ag.lastOp}
                </p>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>CPU: {ag.cpuLoad}%</span>
                  <span>RAM: {ag.ramUsageMb}MB</span>
                  <span>Черга: {ag.queueCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DATA PREVIEW (FIRST 100 RECORDS GRID) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              5. Data Preview (Перші 100 розпарсених записів з виявленими типами)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            ДЖЕРЕЛО: {selectedPreset.title}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                <th className="p-2.5">
                  ID Record
                  <span className="block text-[9px] text-cyan-400 font-normal">[UNIQUE ID]</span>
                </th>
                <th className="p-2.5">
                  Дата / Час
                  <span className="block text-[9px] text-amber-400 font-normal">[TIMESTAMP]</span>
                </th>
                <th className="p-2.5">
                  Суб'єкт / Платник
                  <span className="block text-[9px] text-emerald-400 font-normal">[ENTITY: COMPANY/PERSON]</span>
                </th>
                <th className="p-2.5">
                  Контрагент / Отримувач
                  <span className="block text-[9px] text-purple-400 font-normal">[ENTITY: RECIPIENT]</span>
                </th>
                <th className="p-2.5">
                  Сума / Опис
                  <span className="block text-[9px] text-cyan-400 font-normal">[NUMERIC / TEXT]</span>
                </th>
                <th className="p-2.5">
                  Статус ризику
                  <span className="block text-[9px] text-rose-400 font-normal">[RISK FLAG]</span>
                </th>
                <th className="p-2.5 text-right">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {selectedPreset.sampleRecords.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-900/50 transition-colors"
                >
                  <td className="p-2.5 text-cyan-300 font-bold">{row.id}</td>
                  <td className="p-2.5 text-slate-400">{row.date || "2026-07-23"}</td>
                  <td className="p-2.5 text-slate-200">
                    {row.importer || row.payer || row.plaintiff || row.entity_name || row.vessel_name}
                  </td>
                  <td className="p-2.5 text-slate-300">
                    {row.exporter || row.recipient || row.defendant || row.aliases?.[0] || row.carrier || "—"}
                  </td>
                  <td className="p-2.5 text-amber-300">
                    {row.customs_val_usd
                      ? `$${row.customs_val_usd.toLocaleString()}`
                      : row.amount_uah
                      ? `${row.amount_uah.toLocaleString()} UAH`
                      : row.claim_amount_uah
                      ? `${row.claim_amount_uah.toLocaleString()} UAH`
                      : row.hs_desc || row.purpose || row.category || row.reason || "Детальний вміст..."}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        row.risk_flag?.includes("SANCTION") || row.risk_flag?.includes("BLOCKED")
                          ? "bg-rose-950/60 text-rose-300 border-rose-800"
                          : row.risk_flag?.includes("PEP") || row.risk_flag?.includes("ANOMALY")
                          ? "bg-amber-950/60 text-amber-300 border-amber-800"
                          : "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                      }`}
                    >
                      {row.risk_flag || "VERIFIED"}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => setSelectedPreviewRow(row)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 transition-colors cursor-pointer"
                    >
                      Детальніше
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI LEARNING SUMMARY & SELF-GENERATED CONNECTOR CARD */}
      <AnimatePresence>
        {pipelineFinished && createdConnector && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 border border-amber-500/60 rounded-lg p-5 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 relative overflow-hidden shadow-2xl shadow-amber-500/10"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-400 via-amber-400 to-cyan-400" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl text-emerald-400">
                  🎉
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                    Я навчився працювати з цим джерелом!
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Створено новий конектор, Pydantic схему, ETL пакунок, правила графа Neo4j та додано до каталогу.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl font-mono font-bold">
                  HEALTH SCORE: {createdConnector.healthScore}%
                </span>
              </div>
            </div>

            {/* Connector Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-black/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-slate-500 block text-[10px]">КОНЕКТОР</span>
                <span className="text-amber-300 font-bold block">{createdConnector.name}</span>
                <span className="text-slate-400 block text-[10px]">
                  Протокол: {createdConnector.protocol} | Автор: {createdConnector.author}
                </span>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-slate-500 block text-[10px]">ОБРОБЛЕНО ЗАПИСІВ</span>
                <span className="text-emerald-400 font-bold text-sm block">
                  {createdConnector.rowsProcessed.toLocaleString()} rows
                </span>
                <span className="text-slate-400 block text-[10px]">
                  Затримка: {createdConnector.latencyMs}ms | Quality: {createdConnector.dataQualityIndex}%
                </span>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-slate-500 block text-[10px]">РОЗКЛАД СИНХРОНІЗАЦІЇ</span>
                <span className="text-cyan-300 font-bold block">{createdConnector.syncSchedule}</span>
                <span className="text-slate-400 block text-[10px]">
                  Статус: ACTIVE IN CATALOG
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROW DETAIL MODAL */}
      {selectedPreviewRow && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Деталі розпарсеного запису #{selectedPreviewRow.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPreviewRow(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono max-h-[350px] overflow-y-auto custom-scrollbar p-1">
              {Object.entries(selectedPreviewRow).map(([k, v]) => (
                <div key={k} className="p-2 rounded bg-black/40 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] uppercase block">{k}</span>
                  <span className="text-slate-200 break-all">{String(v)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedPreviewRow(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer font-bold"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
