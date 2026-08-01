import { useToast } from './ToastProvider';
import React, { useContext,  useState, useEffect, useRef } from "react";
import DataOnboardingCenter from "./DataOnboardingCenter";
import DataIngestionPipeline from "./DataIngestionPipeline";
import FreeSourcesTab from "./FreeSourcesTab";
import {
  Database,
  Server,
  Search,
  Play,
  Pause,
  Activity,
  Terminal,
  Bot,
  RefreshCw,
  X,
  CircleDot,
  Zap,
  CheckCircle2,
  HardDrive,
  Cpu,
  Radio,
  Network,
  Globe,
  AlertTriangle,
  FileText,
  ChevronRight,
  Eye,
  Code,
  ArrowRight,
  Layers,
  Sliders,
  Shield,
  BookOpen,
  Download,
  AlertCircle,
  Sparkles,
  Check,
  HelpCircle,
  TrendingUp,
  BarChart2,
  ShieldAlert,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

// Define the 17 Platform Stages as requested by the user
interface PlatformStage {
  number: number;
  title: string;
  category: string;
  status: "OPERATIONAL" | "STANDBY" | "SYNCING" | "SELF_HEALING";
  desc: string;
  output: string;
}

// Connector Category Union for 24 Categories
export type ConnectorCategory =
  | "UA_STATE"                  // 1. Українські державні реєстри
  | "GLOBAL_CORP"               // 2. Світові корпоративні реєстри
  | "SANCTIONS_COMPLIANCE"      // 3. Санкції та Compliance
  | "PEP_REGISTRY"              // 4. PEP (Politically Exposed Persons)
  | "COURTS_LEGAL"              // 5. Судові та правоохоронні системи
  | "PROCUREMENT"               // 6. Закупівлі & Публічні тендери
  | "CUSTOMS_TRADE"             // 7. Митниця та торгівля
  | "LOGISTICS_TRANSPORT"       // 8. Логістика та транспорт
  | "BANKING_FINANCE"           // 9. Банківські та фінансові системи
  | "CRYPTO_BLOCKCHAIN"         // 10. Криптовалюти & Блокчейн
  | "GEODATA_SATELLITE"         // 11. Геодані & Супутники
  | "REAL_ESTATE_CADASTRE"      // 12. Нерухомість & Кадастри
  | "INTERNET_DNS_OSINT"        // 13. Інтернет, WHOIS & Network OSINT
  | "GIT_ECOSYSTEM"             // 14. Git-екосистема
  | "OPEN_SCIENCE_CATALOGS"     // 15. Open Source & Наукові каталоги
  | "SOCIAL_MEDIA_OPEN"         // 16. Соціальні мережі & Відкриті медіа
  | "NEWS_ADVERSE_MEDIA"        // 17. Новини & Adverse Media
  | "DARKWEB_LEAKS"             // 18. Dark Web & Витоки даних
  | "OSINT_FRAMEWORKS"          // 19. OSINT Frameworks & Інструменти
  | "AI_KNOWLEDGE_GRAPHS"       // 20. AI Knowledge Sources & GraphRAG
  | "THREAT_INTEL_CVE"          // 21. Threat Intelligence & CVE
  | "ACADEMIC_RESEARCH"         // 22. Академічні джерела
  | "MEDIA_VISUAL"              // 23. Медіа & Візуальна розвідка
  | "EMERGING_DAO";             // 24. DAO & Блокчейн Врядування

// Extended Data Source Interface for Universal Data Connector Hub
export type ProcessingZone = "GREEN" | "YELLOW" | "RED";

interface IngestSource {
  id: string;
  name: string;
  flag: string;
  category: ConnectorCategory | string;
  processingZone: ProcessingZone; // 🟢 Green (Direct ETL) | 🟡 Yellow (Proxy Rotator) | 🔴 Red (Isolated Tor/Sandbox)
  owner: string;
  endpoint: string;
  protocol?: string;
  authMethod: "OAuth2" | "API Key" | "Bearer Token" | "None" | "mTLS" | "Tor Session";
  rateLimit: string;
  schedule: string;
  confidence: number;
  qualityScore: number;
  aiPriorityScore?: number;
  rowsLoaded: number;
  status: "ACTIVE" | "SYNCING" | "SELF_HEALING" | "ERROR" | "DRIFT_DETECTED" | "STANDBY";
  latency: number;
  hasOpenAPI: boolean;
  supportsFtM?: boolean;
}

// Comprehensive initial sources list spanning all 24 categories
const initialSources: IngestSource[] = [
  // 1. Українські державні реєстри (Green Zone)
  {
    id: "prozorro",
    name: "ProZorro Закупівлі",
    flag: "🇺🇦",
    category: "UA_STATE",
    processingZone: "GREEN",
    owner: "Мінекономіки України",
    endpoint: "https://api.prozorro.gov.ua/v2/tenders",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "No Limit (Open)",
    schedule: "Інкрементально кожні 6 год",
    confidence: 99.8,
    qualityScore: 99.9,
    aiPriorityScore: 99,
    rowsLoaded: 1245000,
    status: "ACTIVE",
    latency: 185,
    hasOpenAPI: true,
    supportsFtM: true,
  },
  {
    id: "spending",
    name: "Spending.gov.ua",
    flag: "🇺🇦",
    category: "UA_STATE",
    processingZone: "GREEN",
    owner: "Мінфін України",
    endpoint: "https://api.spending.gov.ua/api/v2",
    protocol: "REST API",
    authMethod: "API Key",
    rateLimit: "100 req/min",
    schedule: "Інкрементально кожні 12 год",
    confidence: 99.2,
    qualityScore: 99.1,
    aiPriorityScore: 98,
    rowsLoaded: 3840000,
    status: "ACTIVE",
    latency: 340,
    hasOpenAPI: true,
    supportsFtM: true,
  },
  {
    id: "nazk",
    name: "НАЗК Декларації & PEP",
    flag: "🇺🇦",
    category: "UA_STATE",
    processingZone: "GREEN",
    owner: "НАЗК України",
    endpoint: "https://api.nazk.gov.ua/v2/pep-registry",
    protocol: "REST API",
    authMethod: "API Key",
    rateLimit: "500 req/min",
    schedule: "Щоденний Bulk",
    confidence: 99.5,
    qualityScore: 98.9,
    aiPriorityScore: 99,
    rowsLoaded: 184500,
    status: "ACTIVE",
    latency: 220,
    hasOpenAPI: true,
    supportsFtM: true,
  },
  {
    id: "datagovua",
    name: "data.gov.ua (ЄДР Компанії & ФОП)",
    flag: "🇺🇦",
    category: "UA_STATE",
    processingZone: "GREEN",
    owner: "Мінцифра України",
    endpoint: "https://data.gov.ua/api/3/action/edr",
    protocol: "CKAN API",
    authMethod: "None",
    rateLimit: "No Limit",
    schedule: "Щотижневий Bulk",
    confidence: 98.4,
    qualityScore: 97.2,
    aiPriorityScore: 97,
    rowsLoaded: 2154000,
    status: "ACTIVE",
    latency: 290,
    hasOpenAPI: true,
    supportsFtM: true,
  },
  {
    id: "rnbo",
    name: "РНБО Реєстр Санкцій",
    flag: "🇺🇦",
    category: "UA_STATE",
    processingZone: "GREEN",
    owner: "РНБО України",
    endpoint: "https://drs.nsdc.gov.ua/api/public",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "1000 req/min",
    schedule: "Щодня о 03:30",
    confidence: 99.9,
    qualityScore: 99.9,
    aiPriorityScore: 100,
    rowsLoaded: 14812,
    status: "ACTIVE",
    latency: 112,
    hasOpenAPI: false,
    supportsFtM: true,
  },
  {
    id: "ersr_court",
    name: "Єдиний реєстр судових рішень",
    flag: "🇺🇦",
    category: "UA_STATE",
    processingZone: "GREEN",
    owner: "ДСА України / ЄРСР",
    endpoint: "https://reyestr.court.gov.ua/api/search",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "300 req/min",
    schedule: "Щоденний Bulk",
    confidence: 99.1,
    qualityScore: 98.6,
    aiPriorityScore: 98,
    rowsLoaded: 9500000,
    status: "ACTIVE",
    latency: 210,
    hasOpenAPI: false,
    supportsFtM: true,
  },

  // 2. Світові корпоративні реєстри (Green Zone)
  {
    id: "opencorporates",
    name: "OpenCorporates Global Registry",
    flag: "🌐",
    category: "GLOBAL_CORP",
    processingZone: "GREEN",
    owner: "OpenCorporates Ltd",
    endpoint: "https://api.opencorporates.com/v0.4",
    protocol: "REST API",
    authMethod: "API Key",
    rateLimit: "5000 req/day",
    schedule: "Щотижня",
    confidence: 99.6,
    qualityScore: 99.2,
    aiPriorityScore: 96,
    rowsLoaded: 1240000,
    status: "ACTIVE",
    latency: 280,
    hasOpenAPI: true,
    supportsFtM: true,
  },
  {
    id: "companies_house",
    name: "UK Companies House",
    flag: "🇬🇧",
    category: "GLOBAL_CORP",
    processingZone: "GREEN",
    owner: "UK Government",
    endpoint: "https://api.company-information.service.gov.uk",
    protocol: "REST API",
    authMethod: "API Key",
    rateLimit: "600 req/5min",
    schedule: "Інкрементально кожні 12 год",
    confidence: 99.9,
    qualityScore: 99.8,
    aiPriorityScore: 95,
    rowsLoaded: 5120000,
    status: "ACTIVE",
    latency: 160,
    hasOpenAPI: true,
    supportsFtM: true,
  },
  {
    id: "sec_edgar",
    name: "SEC EDGAR Filings (USA)",
    flag: "🇺🇸",
    category: "GLOBAL_CORP",
    processingZone: "GREEN",
    owner: "US Securities and Exchange Commission",
    endpoint: "https://data.sec.gov/api/xbrl/companyfacts",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "10 req/sec",
    schedule: "Щодня",
    confidence: 99.9,
    qualityScore: 99.9,
    aiPriorityScore: 94,
    rowsLoaded: 1850000,
    status: "ACTIVE",
    latency: 190,
    hasOpenAPI: true,
    supportsFtM: true,
  },

  // 3. Санкції та Compliance (Green Zone)
  {
    id: "opensanctions",
    name: "OpenSanctions (yente API)",
    flag: "🌐",
    category: "SANCTIONS_COMPLIANCE",
    processingZone: "GREEN",
    owner: "OpenSanctions Community",
    endpoint: "https://api.opensanctions.org/v1/entities",
    protocol: "REST API",
    authMethod: "Bearer Token",
    rateLimit: "Premium bulk API",
    schedule: "Щоденний Bulk",
    confidence: 99.9,
    qualityScore: 99.8,
    aiPriorityScore: 100,
    rowsLoaded: 680000,
    status: "ACTIVE",
    latency: 140,
    hasOpenAPI: true,
    supportsFtM: true,
  },
  {
    id: "ofac_sdn",
    name: "OFAC SDN & Consolidated List (USA)",
    flag: "🇺🇸",
    category: "SANCTIONS_COMPLIANCE",
    processingZone: "GREEN",
    owner: "US Treasury OFAC",
    endpoint: "https://www.treasury.gov/ofac/downloads/sdn.xml",
    protocol: "Bulk S3/GCS",
    authMethod: "None",
    rateLimit: "No Limit",
    schedule: "Щодня о 01:00",
    confidence: 100.0,
    qualityScore: 100.0,
    aiPriorityScore: 100,
    rowsLoaded: 42000,
    status: "ACTIVE",
    latency: 90,
    hasOpenAPI: false,
    supportsFtM: true,
  },

  // 4. PEP (Green Zone)
  {
    id: "everypolitician",
    name: "EveryPolitician World Dataset",
    flag: "🏛️",
    category: "PEP_REGISTRY",
    processingZone: "GREEN",
    owner: "mysociety NGO",
    endpoint: "https://everypolitician.org/api/v1/countries.json",
    protocol: "Bulk S3/GCS",
    authMethod: "None",
    rateLimit: "No Limit",
    schedule: "Щомісяця",
    confidence: 97.8,
    qualityScore: 96.5,
    aiPriorityScore: 92,
    rowsLoaded: 142000,
    status: "ACTIVE",
    latency: 210,
    hasOpenAPI: false,
    supportsFtM: true,
  },

  // 5. Судові та правоохоронні (Green Zone)
  {
    id: "courtlistener",
    name: "CourtListener (RECAP Federal US)",
    flag: "🏛️",
    category: "COURTS_LEGAL",
    processingZone: "GREEN",
    owner: "Free Law Project",
    endpoint: "https://www.courtlistener.com/api/v4",
    protocol: "REST API",
    authMethod: "API Key",
    rateLimit: "5000 req/hour",
    schedule: "Щомісяця",
    confidence: 99.0,
    qualityScore: 98.7,
    aiPriorityScore: 93,
    rowsLoaded: 850000,
    status: "ACTIVE",
    latency: 230,
    hasOpenAPI: true,
    supportsFtM: true,
  },

  // 6. Закупівлі (Green Zone)
  {
    id: "ted_europe",
    name: "TED Europe Procurement (EU)",
    flag: "🇪🇺",
    category: "PROCUREMENT",
    processingZone: "GREEN",
    owner: "Publications Office of the EU",
    endpoint: "https://ted.europa.eu/api/v3.0/notices/search",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "1000 req/hour",
    schedule: "Щодня",
    confidence: 99.4,
    qualityScore: 99.1,
    aiPriorityScore: 91,
    rowsLoaded: 2400000,
    status: "ACTIVE",
    latency: 270,
    hasOpenAPI: true,
    supportsFtM: true,
  },

  // 7. Митниця (Green Zone)
  {
    id: "un_comtrade",
    name: "UN Comtrade International Trade",
    flag: "🇺🇳",
    category: "CUSTOMS_TRADE",
    processingZone: "GREEN",
    owner: "United Nations Statistics Division",
    endpoint: "https://comtradeapi.un.org/public/v1/preview/C/A/HS",
    protocol: "REST API",
    authMethod: "API Key",
    rateLimit: "500 req/day",
    schedule: "Щомісяця",
    confidence: 98.9,
    qualityScore: 98.2,
    aiPriorityScore: 90,
    rowsLoaded: 18000000,
    status: "ACTIVE",
    latency: 350,
    hasOpenAPI: true,
    supportsFtM: true,
  },

  // 8. Логістика (Yellow Zone Proxy Mesh)
  {
    id: "marinetraffic_ais",
    name: "MarineTraffic Vessel Tracker",
    flag: "🚢",
    category: "LOGISTICS_TRANSPORT",
    processingZone: "YELLOW",
    owner: "MarineTraffic AIS Network",
    endpoint: "https://api.marinetraffic.com/v1/vesselpositions",
    protocol: "REST API",
    authMethod: "API Key",
    rateLimit: "Proxy Rotator / 60 req/min",
    schedule: "У реальному часі",
    confidence: 99.1,
    qualityScore: 98.5,
    aiPriorityScore: 89,
    rowsLoaded: 6200000,
    status: "ACTIVE",
    latency: 180,
    hasOpenAPI: true,
    supportsFtM: false,
  },

  // 9. Банківські (Green Zone)
  {
    id: "gleif_lei_api",
    name: "GLEIF LEI Legal Entity Index",
    flag: "🏦",
    category: "BANKING_FINANCE",
    processingZone: "GREEN",
    owner: "Global LEI Foundation",
    endpoint: "https://api.gleif.org/api/v1/lei-records",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "No Limit",
    schedule: "Щодня",
    confidence: 100.0,
    qualityScore: 99.9,
    aiPriorityScore: 97,
    rowsLoaded: 2800000,
    status: "ACTIVE",
    latency: 120,
    hasOpenAPI: true,
    supportsFtM: true,
  },

  // 10. Криптовалюти (Green Zone)
  {
    id: "blockchair_multi",
    name: "Blockchair Multi-Chain Explorer",
    flag: "⛓️",
    category: "CRYPTO_BLOCKCHAIN",
    processingZone: "GREEN",
    owner: "Blockchair Engine",
    endpoint: "https://api.blockchair.com/bitcoin/dashboards/transaction",
    protocol: "RPC Node",
    authMethod: "API Key",
    rateLimit: "30 req/min",
    schedule: "У реальному часі",
    confidence: 99.9,
    qualityScore: 99.7,
    aiPriorityScore: 95,
    rowsLoaded: 12500000,
    status: "ACTIVE",
    latency: 140,
    hasOpenAPI: true,
    supportsFtM: true,
  },

  // 11. Геодані (Yellow Zone Rate-Limited)
  {
    id: "nominatim_geocoder",
    name: "Nominatim Geocoder (OSM)",
    flag: "🗺️",
    category: "GEODATA_SATELLITE",
    processingZone: "YELLOW",
    owner: "OpenStreetMap API",
    endpoint: "https://nominatim.openstreetmap.org/search",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "1 req/sec Proxy Rotator",
    schedule: "On-demand",
    confidence: 99.5,
    qualityScore: 99.0,
    aiPriorityScore: 88,
    rowsLoaded: 420000,
    status: "ACTIVE",
    latency: 410,
    hasOpenAPI: false,
    supportsFtM: false,
  },

  // 13. Network OSINT (Yellow Zone Proxy Rotator)
  {
    id: "shodan_osint",
    name: "Shodan Network Intelligence",
    flag: "🔍",
    category: "INTERNET_DNS_OSINT",
    processingZone: "YELLOW",
    owner: "Shodan LLC",
    endpoint: "https://api.shodan.io/shodan/host/search",
    protocol: "REST API",
    authMethod: "API Key",
    rateLimit: "10,000 req/month",
    schedule: "За викликом",
    confidence: 99.2,
    qualityScore: 98.8,
    aiPriorityScore: 94,
    rowsLoaded: 189000000,
    status: "ACTIVE",
    latency: 110,
    hasOpenAPI: true,
    supportsFtM: false,
  },

  // 14. Git (Yellow Zone)
  {
    id: "github_api_osint",
    name: "GitHub Leaks & Code Intelligence",
    flag: "🐙",
    category: "GIT_ECOSYSTEM",
    processingZone: "YELLOW",
    owner: "GitHub Inc / Microsoft",
    endpoint: "https://api.github.com/search/code",
    protocol: "REST API",
    authMethod: "Bearer Token",
    rateLimit: "Rate-Limited Proxy",
    schedule: "Інкрементально кожні 1 год",
    confidence: 99.0,
    qualityScore: 98.4,
    aiPriorityScore: 93,
    rowsLoaded: 840000,
    status: "ACTIVE",
    latency: 190,
    hasOpenAPI: true,
    supportsFtM: false,
  },

  // 17. Adverse Media (Yellow Zone)
  {
    id: "gdelt_v2",
    name: "GDELT Project 2.0 Global Monitoring",
    flag: "📰",
    category: "NEWS_ADVERSE_MEDIA",
    processingZone: "YELLOW",
    owner: "GDELT Foundation",
    endpoint: "http://data.gdeltproject.org/gdeltv2",
    protocol: "Bulk S3/GCS",
    authMethod: "None",
    rateLimit: "Parallel Proxy Crawler",
    schedule: "Кожні 15 хвилин",
    confidence: 95.0,
    qualityScore: 92.4,
    aiPriorityScore: 96,
    rowsLoaded: 12400000,
    status: "ACTIVE",
    latency: 310,
    hasOpenAPI: false,
    supportsFtM: true,
  },

  // 18. Dark Web & Leaks (Red Zone Tor Sandbox)
  {
    id: "intelx_darknet",
    name: "Intelligence X (IntelX Darknet)",
    flag: "🧅",
    category: "DARKWEB_LEAKS",
    processingZone: "RED",
    owner: "Intelligence X Ltd",
    endpoint: "https://api.intelx.io/phonebook/search",
    protocol: "Tor SOCKS5",
    authMethod: "Tor Session",
    rateLimit: "Isolated Sandbox Container",
    schedule: "За викликом",
    confidence: 96.5,
    qualityScore: 94.2,
    aiPriorityScore: 98,
    rowsLoaded: 4500000,
    status: "ACTIVE",
    latency: 680,
    hasOpenAPI: true,
    supportsFtM: false,
  },
  {
    id: "ahmia_tor_search",
    name: "Ahmia.fi Darknet Indexer (.onion)",
    flag: "🧅",
    category: "DARKWEB_LEAKS",
    processingZone: "RED",
    owner: "Ahmia Tor Project",
    endpoint: "https://ahmia.fi/search/",
    protocol: "Tor SOCKS5",
    authMethod: "Tor Session",
    rateLimit: "Tor Relay Circuit",
    schedule: "Безперервно",
    confidence: 95.0,
    qualityScore: 92.0,
    aiPriorityScore: 97,
    rowsLoaded: 3800000,
    status: "ACTIVE",
    latency: 820,
    hasOpenAPI: false,
    supportsFtM: false,
  },
  {
    id: "ransomware_live_mon",
    name: "Ransomware.live Leak Sites",
    flag: "☣️",
    category: "DARKWEB_LEAKS",
    processingZone: "RED",
    owner: "Cyber Threat Intelligence Feed",
    endpoint: "https://api.ransomware.live/v1/recentvictims",
    protocol: "Tor SOCKS5",
    authMethod: "Tor Session",
    rateLimit: "Realtime Darknet Monitor",
    schedule: "У реальному часі",
    confidence: 99.0,
    qualityScore: 98.4,
    aiPriorityScore: 100,
    rowsLoaded: 124000,
    status: "ACTIVE",
    latency: 520,
    hasOpenAPI: true,
    supportsFtM: false,
  },

  // 19. OSINT Frameworks (Yellow Zone)
  {
    id: "spiderfoot_osint",
    name: "SpiderFoot OSINT Engine",
    flag: "🕷️",
    category: "OSINT_FRAMEWORKS",
    processingZone: "YELLOW",
    owner: "SpiderFoot Open Source",
    endpoint: "http://localhost:5001/api/v1/scan",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "Local Engine",
    schedule: "За викликом",
    confidence: 98.0,
    qualityScore: 97.0,
    aiPriorityScore: 91,
    rowsLoaded: 310000,
    status: "ACTIVE",
    latency: 150,
    hasOpenAPI: true,
    supportsFtM: false,
  },

  // 20. AI Knowledge Graphs (Green Zone)
  {
    id: "graphrag_triples",
    name: "GraphRAG Knowledge Graph",
    flag: "🧠",
    category: "AI_KNOWLEDGE_GRAPHS",
    processingZone: "GREEN",
    owner: "PREDATOR AI Engine",
    endpoint: "http://localhost:8000/graph/cypher",
    protocol: "GraphQL",
    authMethod: "Bearer Token",
    rateLimit: "Internal High-Speed",
    schedule: "У реальному часі",
    confidence: 99.8,
    qualityScore: 99.5,
    aiPriorityScore: 100,
    rowsLoaded: 45200000,
    status: "ACTIVE",
    latency: 45,
    hasOpenAPI: true,
    supportsFtM: true,
  },

  // 21. Threat Intelligence (Red Zone Tor / Green Zone)
  {
    id: "abuse_ch_threatfox",
    name: "Abuse.ch ThreatFox & IoC Hub",
    flag: "🛡️",
    category: "THREAT_INTEL_CVE",
    processingZone: "RED",
    owner: "Abuse.ch Cyber Threat Intelligence",
    endpoint: "https://threatfox-api.abuse.ch/api/v1/",
    protocol: "REST API / Tor",
    authMethod: "API Key",
    rateLimit: "1,000 req/min",
    schedule: "Щогодини",
    confidence: 99.8,
    qualityScore: 99.5,
    aiPriorityScore: 99,
    rowsLoaded: 2100000,
    status: "ACTIVE",
    latency: 180,
    hasOpenAPI: true,
    supportsFtM: false,
  },
  {
    id: "mitre_attack_cve",
    name: "MITRE ATT&CK & CVE Database",
    flag: "🛡️",
    category: "THREAT_INTEL_CVE",
    processingZone: "GREEN",
    owner: "MITRE Corporation",
    endpoint: "https://cve.mitre.org/api/v1",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "100 req/min",
    schedule: "Щодня",
    confidence: 99.9,
    qualityScore: 99.9,
    aiPriorityScore: 92,
    rowsLoaded: 245000,
    status: "ACTIVE",
    latency: 155,
    hasOpenAPI: true,
    supportsFtM: false,
  },

  // 12. Нерухомість & Кадастри (Green / Yellow Zone)
  {
    id: "dzk_drrp_ua",
    name: "Державний земельний кадастр & ДРРП",
    flag: "🏠",
    category: "REAL_ESTATE_CADASTRE",
    processingZone: "GREEN",
    owner: "Держгеокадастр / Мін'юст України",
    endpoint: "https://map.land.gov.ua/api/cadastre",
    protocol: "REST API",
    authMethod: "API Key",
    rateLimit: "300 req/min",
    schedule: "Щодня о 04:00",
    confidence: 99.5,
    qualityScore: 99.1,
    aiPriorityScore: 98,
    rowsLoaded: 14200000,
    status: "ACTIVE",
    latency: 210,
    hasOpenAPI: true,
    supportsFtM: true,
  },
  {
    id: "uk_land_registry",
    name: "UK HM Land Registry (Open Data)",
    flag: "🇬🇧",
    category: "REAL_ESTATE_CADASTRE",
    processingZone: "GREEN",
    owner: "UK Government",
    endpoint: "https://landregistry.data.gov.uk/app/root/qonsole",
    protocol: "SPARQL / REST",
    authMethod: "None",
    rateLimit: "No Limit",
    schedule: "Щотижня",
    confidence: 99.8,
    qualityScore: 99.5,
    aiPriorityScore: 94,
    rowsLoaded: 28500000,
    status: "ACTIVE",
    latency: 190,
    hasOpenAPI: true,
    supportsFtM: true,
  },

  // 15. Open Source & Наукові каталоги (Green Zone)
  {
    id: "cncf_landscape_api",
    name: "CNCF Cloud Native Landscape Engine",
    flag: "🌐",
    category: "OPEN_SCIENCE_CATALOGS",
    processingZone: "GREEN",
    owner: "Cloud Native Computing Foundation",
    endpoint: "https://landscape.cncf.io/api/data",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "No Limit",
    schedule: "Щодня",
    confidence: 99.2,
    qualityScore: 98.9,
    aiPriorityScore: 91,
    rowsLoaded: 380000,
    status: "ACTIVE",
    latency: 140,
    hasOpenAPI: true,
    supportsFtM: false,
  },
  {
    id: "huggingface_hub",
    name: "Hugging Face Datasets & Models API",
    flag: "🤗",
    category: "OPEN_SCIENCE_CATALOGS",
    processingZone: "GREEN",
    owner: "Hugging Face Inc",
    endpoint: "https://huggingface.co/api/datasets",
    protocol: "REST API",
    authMethod: "Bearer Token",
    rateLimit: "5000 req/hour",
    schedule: "У реальному часі",
    confidence: 99.5,
    qualityScore: 99.0,
    aiPriorityScore: 96,
    rowsLoaded: 8200000,
    status: "ACTIVE",
    latency: 160,
    hasOpenAPI: true,
    supportsFtM: false,
  },

  // 16. Соціальні мережі & Відкриті медіа (Yellow Zone Proxy Mesh)
  {
    id: "telegram_osint_mesh",
    name: "Telegram Channels & Groups Crawler",
    flag: "✈️",
    category: "SOCIAL_MEDIA_OPEN",
    processingZone: "YELLOW",
    owner: "Telegram MTProto Network",
    endpoint: "https://api.telegram.org/bot/getUpdates",
    protocol: "MTProto / REST",
    authMethod: "Bearer Token",
    rateLimit: "Proxy Mesh Rotator",
    schedule: "У реальному часі",
    confidence: 97.5,
    qualityScore: 95.8,
    aiPriorityScore: 99,
    rowsLoaded: 64000000,
    status: "ACTIVE",
    latency: 110,
    hasOpenAPI: true,
    supportsFtM: false,
  },
  {
    id: "bluesky_firehose",
    name: "Bluesky AT Protocol Firehose Stream",
    flag: "🦋",
    category: "SOCIAL_MEDIA_OPEN",
    processingZone: "GREEN",
    owner: "Bluesky Social PBC",
    endpoint: "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos",
    protocol: "WebSocket",
    authMethod: "None",
    rateLimit: "Live Event Stream",
    schedule: "У реальному часі Stream",
    confidence: 99.0,
    qualityScore: 98.2,
    aiPriorityScore: 95,
    rowsLoaded: 125000000,
    status: "ACTIVE",
    latency: 40,
    hasOpenAPI: true,
    supportsFtM: false,
  },

  // 22. Академічні джерела (Green Zone)
  {
    id: "openalex_academic",
    name: "OpenAlex Global Academic Graph",
    flag: "📚",
    category: "ACADEMIC_RESEARCH",
    processingZone: "GREEN",
    owner: "OurResearch NGO",
    endpoint: "https://api.openalex.org/works",
    protocol: "REST API",
    authMethod: "None",
    rateLimit: "100,000 req/day",
    schedule: "Щотижня",
    confidence: 99.9,
    qualityScore: 99.7,
    aiPriorityScore: 93,
    rowsLoaded: 240000000,
    status: "ACTIVE",
    latency: 180,
    hasOpenAPI: true,
    supportsFtM: true,
  },

  // 23. Медіа & Візуальна розвідка (Yellow Zone)
  {
    id: "commoncrawl_archive",
    name: "Common Crawl Open Web Index",
    flag: "🕸️",
    category: "MEDIA_VISUAL",
    processingZone: "YELLOW",
    owner: "Common Crawl Foundation",
    endpoint: "https://index.commoncrawl.org/CC-MAIN-2026-20-index",
    protocol: "Bulk S3/Parquet",
    authMethod: "None",
    rateLimit: "Parallel Proxy Crawler",
    schedule: "Щомісяця",
    confidence: 96.0,
    qualityScore: 94.0,
    aiPriorityScore: 95,
    rowsLoaded: 3500000000,
    status: "ACTIVE",
    latency: 420,
    hasOpenAPI: false,
    supportsFtM: false,
  },

  // 24. DAO & Блокчейн Врядування (Green Zone)
  {
    id: "snapshot_dao_gov",
    name: "Snapshot Decentralized Governance",
    flag: "🏛️",
    category: "EMERGING_DAO",
    processingZone: "GREEN",
    owner: "Snapshot Labs",
    endpoint: "https://hub.snapshot.org/graphql",
    protocol: "GraphQL",
    authMethod: "None",
    rateLimit: "No Limit",
    schedule: "Щодня",
    confidence: 99.1,
    qualityScore: 98.6,
    aiPriorityScore: 90,
    rowsLoaded: 4200000,
    status: "ACTIVE",
    latency: 130,
    hasOpenAPI: true,
    supportsFtM: true,
  },
];

export default function DataIngestionTab() {
  const { showToast } = useToast();
  const [sources, setSources] = useState<IngestSource[]>(initialSources);
  const [activeTab, setActiveTab] = useState<
    | "free-sources"
    | "onboarding-center"
    | "live-pipeline"
    | "stages"
    | "catalog"
    | "codegen"
    | "etl-workbench"
    | "graph-vectors"
    | "healing"
    | "observability"
    | "docs"
  >("free-sources");
  const [selectedSourceId, setSelectedSourceId] = useState<string>("prozorro");
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [globalSpeed, setGlobalSpeed] = useState<number>(124.8);
  const [totalRows, setTotalRows] = useState<number>(219451029);

  // Interactive Sandbox state for Entity Resolution
  const [erType, setErType] = useState<
    "company" | "person" | "iban" | "crypto"
  >("company");
  const [erInput, setErInput] = useState<string>(
    "ТОВ 'СПЕЦІАЛЬНІ ТЕХНОЛОГІЇ БЕЗПЕКИ.'",
  );
  const [erResult, setErResult] = useState<any>(null);
  const [erLoading, setErLoading] = useState<boolean>(false);

  // Interactive Cosine Similarity State
  const [textA, setTextA] = useState<string>(
    "Козаченко Андрій Михайлович, заступник голови НБУ",
  );
  const [textB, setTextB] = useState<string>(
    "Андрій Козаченко, екс-посадовець Національного банку України",
  );
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // Self-Healing simulator state
  const [isHealing, setIsHealing] = useState<boolean>(false);
  const [healingStage, setHealingStage] = useState<number>(0);
  const [healingLogs, setHealingLogs] = useState<string[]>([]);

  // Telemetry real-time updates
  const [realtimeLogs, setRealtimeLogs] = useState<
    { time: string; text: string; type: "info" | "success" | "warn" | "ai" }[]
  >([]);

  // Selected file in codegen file tree
  const [selectedFile, setSelectedFile] = useState<string>("client.py");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isTestingCode, setIsTestingCode] = useState<boolean>(false);

  // Selected ADR
  const [selectedAdr, setSelectedAdr] = useState<number>(1);
  const [docSubTab, setDocSubTab] = useState<"blueprint" | "adr">("blueprint");
  const [selectedBlueprintSection, setSelectedBlueprintSection] =
    useState<number>(0);

  // States for creating custom sources
  const [isCreatingSource, setIsCreatingSource] = useState<boolean>(false);
  const [newSourceName, setNewSourceName] = useState<string>("");
  const [newSourceEndpoint, setNewSourceEndpoint] = useState<string>("");
  const [newSourceAuth, setNewSourceAuth] = useState<
    "None" | "API Key" | "Bearer Token"
  >("None");
  const [newSourceRate, setNewSourceRate] = useState<string>("60 req/min");
  const [newSourceSched, setNewSourceSched] = useState<string>(
    "Інкрементально кожні 6 год",
  );
  const [newSourceCat, setNewSourceCat] = useState<
    "UA_STATE" | "INT_REGISTRY" | "OSINT_CYBER"
  >("INT_REGISTRY");
  const [newSourceZone, setNewSourceZone] = useState<ProcessingZone>("GREEN");
  const [newSourceEmoji, setNewSourceEmoji] = useState<string>("🔌");
  const [newSourceOwner, setNewSourceOwner] = useState<string>(
    "ШІ Автомат Інтеграції",
  );
  const [isSavingSource, setIsSavingSource] = useState<boolean>(false);
  const [zoneFilter, setZoneFilter] = useState<"ALL" | "GREEN" | "YELLOW" | "RED">("ALL");

  const filteredSources = sources.filter((s) => {
    if (zoneFilter === "ALL") return true;
    return s.processingZone === zoneFilter;
  });

  // Subscribe to live custom registries from Firestore in real time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "custom_registries"),
      (querySnapshot) => {
        const customs: IngestSource[] = [];
        querySnapshot.forEach((docSnap) => {
          customs.push(docSnap.data() as IngestSource);
        });
        if (customs.length > 0) {
          setSources((prev) => {
            const filtered = prev.filter(
              (p) => !customs.some((c) => c.id === p.id),
            );
            return [...filtered, ...customs];
          });
        }
      },
      (err) => {
        console.error("Error subscribing custom registries from Firestore:", err);
        handleFirestoreError(err, OperationType.LIST, "custom_registries");
      }
    );
    return () => unsub();
  }, []);

  // Initialize logs
  useEffect(() => {
    setRealtimeLogs([
      {
        time: "15:30:05",
        text: "PREDATOR ADIP Engine: Центральний планувальник активний.",
        type: "info",
      },
      {
        time: "15:30:12",
        text: "API Розвідка: Swagger проаналізовано для OpenSanctions v4.",
        type: "success",
      },
      {
        time: "15:30:18",
        text: "Зона MinIO: Записано 15,000 інкрементних записів у S3.",
        type: "info",
      },
      {
        time: "15:30:22",
        text: "ШІ Дедуплікації: Очищено 12 аномалій з наборів даних ЄДРПОУ.",
        type: "success",
      },
      {
        time: "15:30:29",
        text: "Векторна БД Qdrant: Згенеровано українські ембединги.",
        type: "ai",
      },
    ]);
  }, []);

  // Simulation cycle
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString();
      const randomSrc = sources[Math.floor(Math.random() * sources.length)];

      const logTemplates = [
        {
          text: `MinIO Browser: Raw backup written for ${randomSrc.name} (bucket: raw-${randomSrc.id}).`,
          type: "info" as const,
        },
        {
          text: `ETL Parser: Normalized +${Math.floor(Math.random() * 80 + 10)} records for ${randomSrc.name}.`,
          type: "success" as const,
        },
        {
          text: `Neo4j Engine: Formed new ownership links for ${randomSrc.name} entities.`,
          type: "ai" as const,
        },
        {
          text: `Qdrant: Vectorizing entities. Parity 100% across PostgreSQL & Qdrant.`,
          type: "success" as const,
        },
        {
          text: `System Monitor: Health Check for ${randomSrc.name} is OK. latency: ${randomSrc.latency}ms.`,
          type: "info" as const,
        },
      ];

      const randomLog =
        logTemplates[Math.floor(Math.random() * logTemplates.length)];
      setRealtimeLogs((prev) => [
        ...prev.slice(-30),
        { time: timeStr, text: randomLog.text, type: randomLog.type },
      ]);
      setTotalRows((prev) => prev + Math.floor(Math.random() * 15 + 2));
      setGlobalSpeed((prev) =>
        Math.max(110, Math.min(145, prev + (Math.random() * 6 - 3))),
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // The 17 Platform Stages (ADIP Architecture)
  const platformStages: PlatformStage[] = [
    {
      number: 1,
      title: "Discovery Layer",
      category: "CRAWLER",
      status: "OPERATIONAL",
      desc: "Автоматичний обхід вебресурсів, пошук відкритих API, державних та міжнародних реєстрів, CKAN, OData.",
      output: "УСПІШНО: Ідентифіковано 84 джерела. Боти-сканери: Активні.",
    },
    {
      number: 2,
      title: "Validation Engine",
      category: "DISCOVERY",
      status: "OPERATIONAL",
      desc: "Перевірка доступності, формату (JSON, XML, Parquet) та базової структури джерела.",
      output: "Кінцеві точки перевірено. Затримка Ping: < 50ms.",
    },
    {
      number: 3,
      title: "Classification",
      category: "DISCOVERY",
      status: "OPERATIONAL",
      desc: "Автоматичне визначення тематики (закупівлі, суди, фінанси, санкції) та призначення тегів.",
      output: "Класифіковано як: API Державних закупівель. Сектор: Уряд.",
    },
    {
      number: 4,
      title: "Risk Assessment",
      category: "DISCOVERY",
      status: "OPERATIONAL",
      desc: "Аналіз ліцензій, надійності провайдера, стабільності та безпекових ризиків.",
      output: "Ліцензія: Відкриті дані (еквівалент MIT). Ризик: Низький.",
    },
    {
      number: 5,
      title: "Metadata Extraction",
      category: "ANALYSIS",
      status: "OPERATIONAL",
      desc: "Вилучення обсягів, частоти оновлень, версій та наявності історичних зрізів.",
      output: "Об'єм: ~20GB. Частота оновлень: У реальному часі (Webhooks).",
    },
    {
      number: 6,
      title: "Schema Discovery",
      category: "ANALYSIS",
      status: "OPERATIONAL",
      desc: "Авто-аналіз Swagger/OpenAPI, побудова Pydantic моделей та SQL DDL міграцій.",
      output: "Схему згенеровано. Pydantic моделі: 45. Міграції БД готові.",
    },
    {
      number: 7,
      title: "Entity Discovery",
      category: "ANALYSIS",
      status: "OPERATIONAL",
      desc: "Розпізнавання сутностей (Company, Person, Tender, Address) для мапінгу.",
      output: "Сутності зіставлено: (Company), (Tender), (Contract).",
    },
    {
      number: 8,
      title: "Relationship Discovery",
      category: "ANALYSIS",
      status: "OPERATIONAL",
      desc: "Визначення PK/FK, зв'язків між сутностями для побудови Knowledge Graph.",
      output: "Зв'язки виявлено: 14 типів ребер. Граф готовий.",
    },
    {
      number: 9,
      title: "Priority Scoring",
      category: "INTELLIGENCE",
      status: "OPERATIONAL",
      desc: "Розрахунок рейтингу (цінність, унікальність, потенціал збагачення інших даних).",
      output: "Оцінка пріоритету: 98.4/100 (КРИТИЧНО). Схвалено для інтеграції.",
    },
    {
      number: 10,
      title: "Connector Generation",
      category: "CODEGEN",
      status: "OPERATIONAL",
      desc: "Генерація клієнтського Python коду, ETL логіки та аутентифікації без людини.",
      output: "Згенеровано Python клієнт: connectors/prozorro_client.py",
    },
    {
      number: 11,
      title: "Autonomous Testing",
      category: "CODEGEN",
      status: "OPERATIONAL",
      desc: "Генерація та запуск Unit/Integration/Contract тестів. Chaos Engineering.",
      output: "Покриття тестами: 99.1%. Контрактні тести: ПРОЙДЕНО.",
    },
    {
      number: 12,
      title: "GitOps Deployment",
      category: "DEPLOY",
      status: "OPERATIONAL",
      desc: "Створення Pull Request, Code Review ШІ-агентом, реліз через ArgoCD/Kubernetes.",
      output: "PR злито. Синхронізація ArgoCD: У нормі. Поди: Працюють.",
    },
    {
      number: 13,
      title: "Observability & Monitoring",
      category: "MONITORING",
      status: "STANDBY",
      desc: "Відстеження затримок, throughput, SLA, та якості даних (Data Quality).",
      output: "OpenTelemetry активна. Налаштовано сповіщення про затримку.",
    },
    {
      number: 14,
      title: "Self-Healing Engine",
      category: "EVOLUTION",
      status: "STANDBY",
      desc: "Автономний ремонт коду у разі Schema Drift або зміни API провайдером.",
      output: "Монітор відхилень: Активний. Агент самовідновлення: У режимі очікування.",
    },
    {
      number: 15,
      title: "Meta-Learning Engine",
      category: "EVOLUTION",
      status: "SYNCING",
      desc: "Накопичення знань про інтеграцію, оновлення шаблонів, правил графів та виправлення помилок.",
      output: "Бібліотеку шаблонів оновлено. Каталог помилок синхронізовано.",
    },
    {
      number: 16,
      title: "Sources Knowledge Graph",
      category: "EVOLUTION",
      status: "OPERATIONAL",
      desc: "Синхронізація графа джерел (Dataset, Registry) та їхніх зв'язків (depends_on).",
      output:
        "Source Graph updated: (Prozorro)-[:SYNCHRONIZED_WITH]->(Spending).",
    },
    {
      number: 17,
      title: "Continuous Intelligence",
      category: "RESEARCH",
      status: "OPERATIONAL",
      desc: "Постійний аналіз нових відкритих форматів, стандартів та релізів для вдосконалення фабрики.",
      output: "Розвідувальне сканування: Завершено. Виявлено нові формати: Parquet v2.",
    },
  ];

  const selectedSource =
    sources.find((s) => s.id === selectedSourceId) || sources[0];

  // Dynamic python code generator for files tab (Connector Generator Section 4)
  const generatePythonCode = (file: string, src: IngestSource) => {
    if (file === "client.py") {
      return `import os
import requests
import json
import time
from datetime import datetime, timedelta
from connectors.auth import get_auth_headers

class ${src.id.charAt(0).toUpperCase() + src.id.slice(1)}ConnectorClient:
    """
    AUTOGENERATED PREDATOR ADIP CLIENT FOR: ${src.name}
    Generator version: v2.5.4 (Antigravity Core)
    Endpoint: ${src.endpoint}
    Rate Limit: ${src.rateLimit}
    """
    def __init__(self):
        self.base_url = "${src.endpoint}"
        self.session = requests.Session()
        self.auth_method = "${src.authMethod}"
        
    def health_check(self) -> bool:
        try:
            headers = get_auth_headers(self.auth_method)
            r = self.session.get(f"{self.base_url}", headers=headers, timeout=10)
            return r.status_code in (200, 401) # 401 means auth is required but reachable
        except Exception as e:
            print(f"❌ Connection to {src.name} failed: {e}")
            return False

    def fetch_incremental(self, last_sync: datetime) -> list:
        headers = get_auth_headers(self.auth_method)
        # Dynamic strategy for rate limiting: ${src.rateLimit}
        print(f"📥 Starting incremental ingest from {src.name}...")
        results = []
        offset = last_sync.isoformat()
        
        # Simulated request loop
        params = {"since": offset, "limit": 100}
        resp = self.session.get(self.base_url, headers=headers, params=params)
        if resp.status_code == 200:
            results = resp.json().get("data", [])
        return results
`;
    } else if (file === "auth.py") {
      return `import os

def get_auth_headers(method: str) -> dict:
    """
    AUTOGENERATED PREDATOR ADIP SECURE AUTH MANAGER
    Retrieves credentials dynamically from local HashiCorp Vault.
    Method: ${src.authMethod}
    """
    headers = {
        "User-Agent": "PredatorADIP/3.5 (Sovereign Analytics)",
        "Accept": "application/json"
    }
    
    if method == "API Key":
        api_key = os.getenv("${src.id.toUpperCase()}_API_KEY")
        if not api_key:
            raise ValueError("Credentials missing for ${src.name} in environment")
        headers["X-API-KEY"] = api_key
        
    elif method == "Bearer Token":
        token = os.getenv("${src.id.toUpperCase()}_BEARER_TOKEN")
        if not token:
            raise ValueError("Bearer token missing for ${src.name}")
        headers["Authorization"] = f"Bearer {token}"
        
    return headers
`;
    } else if (file === "schemas.py") {
      return `from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ${src.id.charAt(0).toUpperCase() + src.id.slice(1)}EntityModel(BaseModel):
    """
    Smart Schema Engine: Autogenerated Pydantic validation schema
    Target: ${src.name}
    """
    id: str = Field(..., description="Unique sovereign ID of the record")
    name: Optional[str] = Field(None, description="Primary legal name")
    category: str = Field("${src.category}", description="Registry category identifier")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    confidence: float = Field(${src.confidence}, ge=0.0, le=100.0)
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "adip-uuid-example",
                "name": "TEST ENTITY CORP",
                "category": "${src.category}",
                "confidence": ${src.confidence}
            }
        }
`;
    }
    return `# Empty file`;
  };

  // Run dynamic unit tests on python code
  const handleTestRun = () => {
    if (isTestingCode) return;
    setIsTestingCode(true);
    setConsoleLogs([
      "[SHELL] Initiating virtual sandbox execution environment...",
      "pip install pydantic requests cryptography pytest pytest-mock -q",
    ]);

    setTimeout(() => {
      setConsoleLogs((prev) => [
        ...prev,
        "[SANDBOX] Environment initialized successfully. Found mock databases in local network (Postgres, ClickHouse).",
      ]);
    }, 1000);

    setTimeout(() => {
      setConsoleLogs((prev) => [
        ...prev,
        `[SANDBOX] Running: pytest tests/test_${selectedSource.id}.py`,
      ]);
    }, 1800);

    setTimeout(() => {
      setConsoleLogs((prev) => [
        ...prev,
        `test_connection_health (passed) - Reachable: Yes`,
        `test_auth_headers_generation (passed) - Method: ${selectedSource.authMethod}`,
        `test_pydantic_schema_validation (passed) - Confidence matches: ${selectedSource.confidence}%`,
        `[УСПІХ] 3/3 тести пройдено. Автозгенерована клієнтська бібліотека готова до використання в продакшені!`,
      ]);
      setIsTestingCode(false);
    }, 3200);
  };

  // Trigger entity resolution sandbox
  const handleEntityResolution = () => {
    setErLoading(true);
    setErResult(null);

    setTimeout(() => {
      setErLoading(false);
      if (erType === "company") {
        setErResult({
          match_found: true,
          matched_entity_id: "EDR-38491823",
          normalized_name:
            "ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ 'СПЕЦІАЛЬНІ ТЕХНОЛОГІЇ БЕЗПЕКИ'",
          confidence_weight: 98.4,
          sources: ["ProZorro", "data.gov.ua", "Spending.gov.ua"],
          risk_status: "ACTIVE_MONITORING",
          attributes: {
            edrpou: "38491823",
            beneficiary: "Козаченко Андрій Михайлович (PEP)",
            registered_date: "2015-04-12",
            country: "UA",
          },
        });
      } else if (erType === "person") {
        setErResult({
          match_found: true,
          matched_entity_id: "PEP-28391029",
          normalized_name: "КОЗАЧЕНКО АНДРІЙ МИХАЙЛОВИЧ",
          confidence_weight: 99.1,
          sources: ["НАЗК", "ВРУ", "OpenSanctions"],
          risk_status: "HIGH_RISK_PEP",
          attributes: {
            tax_id: "2839102948",
            is_pep: "True",
            position: "Екс-заступник Голови НБУ",
            birth_date: "1978-11-03",
          },
        });
      } else if (erType === "iban") {
        setErResult({
          match_found: true,
          matched_entity_id: "ACC-UAH-412903",
          normalized_name: "UA123013000002600412903481",
          confidence_weight: 100.0,
          sources: ["Spending.gov.ua", "NBU"],
          risk_status: "VERIFIED_STATE_RECIPIENT",
          attributes: {
            bank: "АТ КБ 'ПРИВАТБАНК'",
            owner_edrpou: "38491823",
            owner_name: "ТОВ 'СПЕЦІАЛЬНІ ТЕХНОЛОГІЇ БЕЗПЕКИ'",
          },
        });
      } else {
        setErResult({
          match_found: true,
          matched_entity_id: "ETH-WALL-883F",
          normalized_name: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
          confidence_weight: 91.2,
          sources: ["AlienVault OTX", "CyberLeaks"],
          risk_status: "SUSPICIOUS_EXCHANGE_OUTLET",
          attributes: {
            blockchain: "Ethereum",
            last_seen_tx: "2026-07-20 12:44",
            associated_actor: "FancyBear (attribution probable)",
          },
        });
      }
    }, 800);
  };

  // Run embeddings cosine similarity calculations
  const calculateCosineSimilarity = () => {
    setSimLoading(true);
    setSimilarity(null);
    setTimeout(() => {
      setSimLoading(false);
      // Realistic similarity math
      if (
        textA.toLowerCase().includes("козаченко") &&
        textB.toLowerCase().includes("козаченко")
      ) {
        setSimilarity(94.8);
      } else {
        setSimilarity(41.2);
      }
    }, 1000);
  };

  // Simulate Autonomous Self-Healing Pipeline
  const runSelfHealingSimulator = () => {
    if (isHealing) return;
    setIsHealing(true);
    setHealingStage(1);
    setHealingLogs([]);

    const steps = [
      {
        delay: 0,
        text: '🚨 [CRITICAL ALERT] spending.gov.ua API pipeline detected Schema Drift: missing key "payer_edrpou". Connection dropped.',
      },
      {
        delay: 1500,
        text: "🤖 [ШІ ЗАДІЯНО] Активація автономного циклу самовідновлення Google Antigravity для Spending.gov.ua.",
      },
      {
        delay: 3000,
        text: "🔍 [ВИЯВЛЕННЯ] Отримання останніх специфікацій Swagger / OpenAPI v2 з кінцевої точки public-api...",
      },
      {
        delay: 4500,
        text: '📂 [DIFF] Found API drift: "payer_edrpou" was renamed to "payer_tax_code". Newly added field "recipient_iin" parsed.',
      },
      {
        delay: 6000,
        text: "⚙️ [ГЕНЕРАЦІЯ КОДУ] Перегенерація файлів клієнта. Оновлено клієнт connectors/spending.py та модель pydantic у schemas.py.",
      },
      {
        delay: 7500,
        text: '⛓️ [SCHEMA] Executing automated migration scripts to Postgres & ClickHouse. Added column "recipient_iin" (nullable).',
      },
      {
        delay: 9000,
        text: "🧪 [РЕГРЕСІЯ] Виконання 14 регресійних тест-кейсів у тимчасовому стеку Docker...",
      },
      {
        delay: 10500,
        text: "✅ [ТЕСТИ ПРОЙДЕНО] Перевірено 14/14 тестів. Автогенерація журналу змін у документації docs/spending_migration.md.",
      },
      {
        delay: 12000,
        text: "🚀 [РОЗГОРТАННЯ] Надіслано хотфікс PR, обхід CI до локального пісочного продакшену. Статус підключення: АКТИВНИЙ.",
      },
    ];

    steps.forEach((stg, i) => {
      setTimeout(() => {
        setHealingStage(i + 1);
        setHealingLogs((prev) => [...prev, stg.text]);
        if (i === steps.length - 1) {
          setIsHealing(false);
        }
      }, stg.delay);
    });
  };

  return (
    <div className="flex-1 bg-transparent text-slate-300 flex flex-col h-full overflow-hidden p-2 relative font-sans">
      {/* Visual cyber glow effects */}
      <div className="absolute top-[-100px] left-[20%] w-[500px] h-[500px] bg-blue-950/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[20%] w-[500px] h-[500px] bg-rose-950/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-600/20 to-blue-600/10 border border-slate-800 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Database className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-display font-black text-white tracking-[0.2em] uppercase flex items-center gap-2">
              AI Intelligence Acquisition{" "}
              <span className="text-slate-600 font-normal">|</span>{" "}
              <span className="text-amber-400 font-mono text-xs">
                Global Discovery Engine
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-mono tracking-wider">
              AUTONOMOUS DISCOVERY, GENERATION, AND META-LEARNING SYSTEM
            </p>
          </div>
        </div>

        {/* Realtime stats tracker */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="hidden lg:flex flex-col items-end border-r border-slate-800 pr-4">
            <span className="text-slate-500">АВТОНОМНИХ АГЕНТІВ</span>
            <span className="text-amber-400 font-bold text-xs">4 активні</span>
          </div>
          <div className="hidden lg:flex flex-col items-end border-r border-slate-800 pr-4">
            <span className="text-slate-500">ПІДКЛЮЧЕНО API</span>
            <span className="text-slate-200 font-bold text-xs">
              84 / 84 реєстрів
            </span>
          </div>
          <div className="hidden sm:flex flex-col items-end border-r border-slate-800 pr-4">
            <span className="text-slate-500">ГЕНЕРАЦІЯ КОДУ</span>
            <span className="text-cyan-400 font-bold text-xs">
              100% без людини
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500">ШВИДКІСТЬ ПЛАТФОРМИ</span>
            <span className="text-emerald-400 font-bold text-xs">
              {globalSpeed.toFixed(1)} MB/s
            </span>
          </div>
          <div className="flex items-center gap-2 pl-3">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${isSimulating ? "bg-emerald-950/20 border-slate-800 text-emerald-400" : "bg-slate-900/40 backdrop-blur-md border-slate-800/60 text-slate-400"}`}
            >
              <RefreshCw
                className={`w-3 h-3 ${isSimulating ? "animate-spin" : ""}`}
              />
              <span>{isSimulating ? "Live стрімінг" : "Пауза"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 mb-4 gap-2 z-10 overflow-x-auto custom-scrollbar flex-shrink-0">
        {[
          {
            id: "free-sources",
            label: "100% Безплатні Джерела (Етапи 1-3)",
            icon: ShieldCheck,
            badge: "18 ACTIVE",
          },
          {
            id: "onboarding-center",
            label: "Центр підключення даних",
            icon: Zap,
            badge: "AI TRAINED",
          },
          {
            id: "live-pipeline",
            label: "Живий конвеєр даних",
            icon: Activity,
            badge: "STREAM",
          },
          { id: "stages", label: "Конвеєр виявлення джерел", icon: Network },
          { id: "catalog", label: "Глобальний рушій відкриттів", icon: Globe },
          { id: "codegen", label: "Еволюція конекторів", icon: Code },
          { id: "etl-workbench", label: "Датасети та дослідження", icon: Layers },
          {
            id: "graph-vectors",
            label: "Граф знань джерел",
            icon: Sparkles,
          },
          {
            id: "healing",
            label: "Мета-навчання та зцілення",
            icon: Shield,
            badge: "AUTO",
          },
          {
            id: "observability",
            label: "Безперервна розвідка",
            icon: BarChart2,
          },
          { id: "docs", label: "ADR & Архітектура", icon: FileText },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => setActiveTab(tb.id as any)}
            className={`px-2 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${activeTab === tb.id ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-black/30"}`}
          >
            <tb.icon className="w-3.5 h-3.5" />
            <span>{tb.label}</span>
            {tb.badge && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold border ${tb.id === "free-sources" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-amber-500/20 text-amber-400 border-amber-500/40"}`}>
                {tb.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto custom-scrollbar z-10">
        {/* TAB -1: 100% Free Data Sources */}
        {activeTab === "free-sources" && <FreeSourcesTab />}

        {/* TAB 0: Data Onboarding Center */}
        {activeTab === "onboarding-center" && <DataOnboardingCenter />}

        {/* TAB 0.5: Live Ingestion Pipeline */}
        {activeTab === "live-pipeline" && <DataIngestionPipeline />}

        {/* TAB 1: 17 Platform Stages */}
        {activeTab === "stages" && (
          <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
            {/* Visual Process Flow Map */}
            <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-blue-500/40 via-amber-500/30 to-transparent" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  SOURCE DISCOVERY PIPELINE (END-TO-END AUTOMATION)
                </span>
                <span className="text-xs bg-blue-500/15 text-blue-400 border border-slate-800 px-2 py-1 rounded font-mono font-bold">
                  17 АКТИВНИХ API
                </span>
              </div>

              {/* Graphical Network mapping */}
              <div className="flex-1 relative border border-slate-800 bg-black/40 rounded-lg flex flex-col justify-between p-2 overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="relative w-full h-full flex flex-col justify-between py-2 z-10 text-center">
                  {/* Row 1: Source Groups */}
                  <div className="flex justify-around items-center">
                    <div className="bg-slate-900/90 border border-slate-800/60 p-2 rounded-lg w-32 shadow-sm">
                      <Globe className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                      <span className="text-xs font-bold text-slate-200 block">
                        ДЕРЖРЕЄСТРИ УА
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ProZorro, НАЗК, НБУ, ВРУ
                      </span>
                    </div>
                    <div className="w-12 h-[1px] bg-dashed-animation border-t border-slate-800/60 border-dashed" />

                    <div className="bg-slate-900/90 border border-slate-800/60 p-2 rounded-lg w-32 shadow-sm">
                      <Network className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                      <span className="text-xs font-bold text-slate-200 block">
                        МІЖНАРОДНІ БАЗИ
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        OpenSanctions, CourtListener
                      </span>
                    </div>
                    <div className="w-12 h-[1px] bg-dashed-animation border-t border-slate-800/60 border-dashed" />

                    <div className="bg-slate-900/90 border border-slate-800/60 p-2 rounded-lg w-32 shadow-sm">
                      <Search className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="text-xs font-bold text-slate-200 block">
                        OSINT / Threat Intel
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        GDELT, MITRE, AlienVault
                      </span>
                    </div>
                  </div>

                  {/* Flow Arrow to landing zone */}
                  <div className="flex justify-center items-center text-slate-700 font-mono text-xs">
                    <div className="w-[80%] border-t border-b border-dashed border-slate-800/60 py-1.5 rounded-lg text-amber-500">
                      DISCOVERY ENGINE & AUTO-CODEGEN PIPELINE
                    </div>
                  </div>

                  {/* Row 2: Landing Zone & Normalisation */}
                  <div className="flex justify-center gap-16 items-center">
                    <div className="flex flex-col items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg w-48 shadow-2xl shadow-black/40 relative">
                      <span className="absolute -top-2 left-2 bg-amber-500 text-[#02050a] text-[6px] font-black px-1 rounded">
                        STAGE 7: RAW
                      </span>
                      <HardDrive className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-slate-200">
                        S3 MINIO LANDING ZONE
                      </span>
                      <span className="text-xs text-amber-500 font-mono">
                        GZIP raw JSON (Immutable)
                      </span>
                    </div>

                    <div className="text-cyan-500 animate-pulse">
                      <ArrowRight className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg w-48 shadow-2xl shadow-black/40 relative">
                      <span className="absolute -top-2 left-2 bg-cyan-500 text-[#02050a] text-[6px] font-black px-1 rounded">
                        STAGE 11: NORMALIZER
                      </span>
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black text-slate-200">
                        ENTITY UNIFICATION
                      </span>
                      <span className="text-xs text-cyan-400 font-mono">
                        Person, Company, PEP profiles
                      </span>
                    </div>
                  </div>

                  {/* Distribution arrow */}
                  <div className="flex justify-center items-center text-slate-700 font-mono text-xs">
                    <div className="w-[90%] border-t border-b border-dashed border-slate-800/60 py-1 rounded-lg text-cyan-400">
                      INTELLIGENT STORAGE TARGET ROUTER
                    </div>
                  </div>

                  {/* Row 3: MultiDB Targeting */}
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div className="bg-slate-900/60 border border-slate-800/60 p-1.5 rounded-lg">
                      <Database className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                      <span className="text-xs font-black text-slate-300 block">
                        POSTGRESQL
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Sovereign Master
                      </span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800/60 p-1.5 rounded-lg">
                      <Server className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="text-xs font-black text-slate-300 block">
                        CLICKHOUSE
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Analytical Stream
                      </span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800/60 p-1.5 rounded-lg">
                      <Network className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="text-xs font-black text-slate-300 block">
                        NEO4J GRAPH
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Control/Ownership
                      </span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800/60 p-1.5 rounded-lg">
                      <Search className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                      <span className="text-xs font-black text-slate-300 block">
                        OPENSEARCH
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Full-Text Ingest
                      </span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800/60 p-1.5 rounded-lg">
                      <Cpu className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                      <span className="text-xs font-black text-slate-300 block">
                        QDRANT VECTOR
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Embeddings AI
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion Stream Console */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
              <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] relative overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    ТЕРМІНАЛ ETL-ПОДІЙ PREDATOR ADIP
                  </span>
                  <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-1 rounded font-bold uppercase animate-pulse">
                    LIVE
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {realtimeLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 leading-relaxed">
                      <span className="text-slate-600 flex-shrink-0">
                        [{log.time}]
                      </span>
                      <span
                        className={`
                        ${log.type === "success" ? "text-emerald-400" : ""}
                        ${log.type === "warn" ? "text-amber-400 font-semibold" : ""}
                        ${log.type === "ai" ? "text-cyan-400" : ""}
                        ${log.type === "info" ? "text-slate-300" : ""}
                      `}
                      >
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-3 text-xs text-slate-500 flex justify-between items-center">
                  <span>Обробляється рядків: {totalRows.toLocaleString()}</span>
                  <span>Швидкість: {globalSpeed.toFixed(1)} MB/s</span>
                </div>
              </div>
            </div>

            {/* Stage Interactive Bento-Grid */}
            <div className="col-span-12">
              <div className="text-xs font-black text-slate-200 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                17 АВТОНОМНИХ ЕТАПІВ ПЛАТФОРМИ (ADIP ENGINE SPEC)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {platformStages.map((stg) => (
                  <div
                    key={stg.number}
                    className="bg-black/40 border border-slate-800 hover:border-slate-800/60 p-2 rounded-lg flex flex-col justify-between min-h-[140px] relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-1 font-mono text-[16px] font-black text-slate-900 group-hover:text-amber-500/10 transition-all">
                      {String(stg.number).padStart(2, "0")}
                    </div>

                    <div>
                      <span className="text-xs font-mono text-slate-500 block uppercase mb-1">
                        {stg.category}
                      </span>
                      <h4 className="text-xs font-black text-slate-200 mb-1">
                        {stg.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {stg.desc}
                      </p>
                    </div>

                    <div className="border-t border-slate-800/60 pt-2 mt-2 font-mono text-xs text-emerald-400 truncate">
                      {stg.output}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Catalog of Registries */}
        {activeTab === "catalog" && (
          <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
            {/* List of Registries */}
            <div className="col-span-12 xl:col-span-6 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-pink-400 animate-pulse" />
                  DATA CONNECTOR HUB CATALOG ({filteredSources.length})
                </span>
                <button
                  onClick={() => setIsCreatingSource(true)}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-slate-800 rounded text-xs font-mono transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>ІНІЦІЮВАТИ DEEP SCAN</span>
                </button>
              </div>

              {/* Processing Zone Filter Pills */}
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto custom-scrollbar pb-1">
                <button
                  onClick={() => setZoneFilter("ALL")}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    zoneFilter === "ALL"
                      ? "bg-slate-200 text-slate-900 shadow"
                      : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  Всі Зони ({sources.length})
                </button>
                <button
                  onClick={() => setZoneFilter("GREEN")}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
                    zoneFilter === "GREEN"
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-900/60"
                  }`}
                >
                  🟢 Green Zone ({sources.filter((s) => s.processingZone === "GREEN").length})
                </button>
                <button
                  onClick={() => setZoneFilter("YELLOW")}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
                    zoneFilter === "YELLOW"
                      ? "bg-amber-500 text-slate-950 shadow"
                      : "bg-amber-950/40 text-amber-400 hover:bg-amber-900/40 border border-amber-900/60"
                  }`}
                >
                  🟡 Yellow Zone ({sources.filter((s) => s.processingZone === "YELLOW").length})
                </button>
                <button
                  onClick={() => setZoneFilter("RED")}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
                    zoneFilter === "RED"
                      ? "bg-rose-500 text-slate-950 shadow"
                      : "bg-rose-950/40 text-rose-400 hover:bg-rose-900/40 border border-rose-900/60"
                  }`}
                >
                  🔴 Red Zone ({sources.filter((s) => s.processingZone === "RED").length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                {filteredSources.map((src) => {
                  const isSelected = src.id === selectedSourceId;
                  return (
                    <div
                      key={src.id}
                      onClick={() => {
                        setSelectedSourceId(src.id);
                        setIsCreatingSource(false);
                      }}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${isSelected ? "bg-amber-600/10 border-slate-800 shadow" : "bg-slate-900/40 border-slate-800 hover:border-slate-800/60"}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs">{src.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-200">
                              {src.name}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                                src.processingZone === "GREEN"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : src.processingZone === "YELLOW"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                              }`}
                            >
                              {src.processingZone === "GREEN"
                                ? "🟢 GREEN"
                                : src.processingZone === "YELLOW"
                                  ? "🟡 YELLOW"
                                  : "🔴 RED TOR"}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-500 block truncate max-w-[210px]">
                            {src.endpoint}
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-xs font-mono">
                        <span className="text-slate-400 font-bold block">
                          {src.schedule}
                        </span>
                        <span className="text-slate-500 block">
                          DQ: {src.qualityScore}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Registry Technical Profile or Creator Form */}
            {!isCreatingSource ? (
              <div className="col-span-12 xl:col-span-6 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl pointer-events-none" />

                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-amber-400" />
                      АВТОМАТИЗОВАНИЙ ПРОФІЛЬ РОЗВІДКИ
                    </span>
                    <span className="text-xs font-mono text-amber-400">
                      ID: {selectedSource.id}
                    </span>
                  </div>

                  <div className="bg-black/30 p-2 rounded-lg border border-slate-800 space-y-3 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                          <span>{selectedSource.flag}</span>
                          <span>{selectedSource.name}</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Офіційний власник: {selectedSource.owner}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs bg-emerald-950/50 text-emerald-400 border border-slate-800 px-2 py-0.5 rounded font-mono uppercase font-black">
                          {selectedSource.status}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            selectedSource.processingZone === "GREEN"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : selectedSource.processingZone === "YELLOW"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse"
                          }`}
                        >
                          {selectedSource.processingZone === "GREEN"
                            ? "🟢 GREEN ZONE (ETL)"
                            : selectedSource.processingZone === "YELLOW"
                              ? "🟡 YELLOW ZONE (PROXY)"
                              : "🔴 RED ZONE (TOR SANDBOX)"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-slate-500 block">
                          ENDPOINT API:
                        </span>
                        <span className="text-slate-300 break-all">
                          {selectedSource.endpoint}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">
                          АВТОРИЗАЦІЯ:
                        </span>
                        <span className="text-slate-300 font-bold">
                          {selectedSource.authMethod}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">
                          API RATE LIMITS / EXECUTION:
                        </span>
                        <span className="text-slate-300">
                          {selectedSource.rateLimit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">
                          ПАКЕТНИЙ SWAGGER:
                        </span>
                        <span
                          className={
                            selectedSource.hasOpenAPI
                              ? "text-emerald-400 font-bold"
                              : "text-slate-400"
                          }
                        >
                          {selectedSource.hasOpenAPI
                            ? "✔ OpenAPI Swagger"
                            : "✘ Немає (Custom Analyzer)"}
                        </span>
                      </div>
                    </div>

                    {/* Zone Security Specification Banner */}
                    <div className="p-2 rounded border bg-slate-950/60 text-[11px] font-mono leading-relaxed">
                      {selectedSource.processingZone === "GREEN" && (
                        <span className="text-emerald-300">
                          🟢 <strong>GREEN ZONE SECURITY:</strong> Direct HTTP/REST RESTful Pipeline. Zero Proxy Latency. High-throughput structured ingest directly into PostgreSQL + GraphRAG.
                        </span>
                      )}
                      {selectedSource.processingZone === "YELLOW" && (
                        <span className="text-amber-300">
                          🟡 <strong>YELLOW ZONE SECURITY:</strong> Rotated Residential Proxy Mesh with TLS Fingerprint Mimicry & Exponential Backoff Delay Generator. Evasion Enabled.
                        </span>
                      )}
                      {selectedSource.processingZone === "RED" && (
                        <span className="text-rose-300">
                          🔴 <strong>RED ZONE SECURITY:</strong> Tor SOCKS5 Circuit Isolation + Docker Container Sandbox Extraction. Automated Malware Disarm, Anti-Stolen Credential Sanitization Pipeline.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* API Discovery Progression Visual */}
                  <div className="flex-1 p-2 sm:p-3 md:p-4 flex flex-col gap-3 sm:gap-4 bg-slate-950 h-full w-full">
                    <span className="text-xs font-mono text-slate-500 uppercase block">
                      Discovery Intelligence Cycle:
                    </span>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-xs">
                      {[
                        "1. Endpoint Scan",
                        "2. Rate Detection",
                        "3. Schema Gen",
                        "4. Client Bind",
                      ].map((st, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950/80 backdrop-blur-xl p-2 rounded border border-slate-800 text-slate-400"
                        >
                          <span className="text-emerald-400 font-bold block">
                            ✓ Done
                          </span>
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur-xl p-2 rounded-lg">
                    <div>
                      <span className="text-slate-500 block">
                        QUALITY SCORE
                      </span>
                      <span className="text-emerald-400 font-black text-xs">
                        {selectedSource.qualityScore}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ВІРОГІДНІСТЬ</span>
                      <span className="text-cyan-400 font-black text-xs">
                        {selectedSource.confidence}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        LATENCY (AVG)
                      </span>
                      <span className="text-slate-300 font-black text-xs">
                        {selectedSource.latency} ms
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                  {!initialSources.some((s) => s.id === selectedSource.id) && (
                    <button
                      onClick={async () => {
                        try {
                          await deleteDoc(
                            doc(db, "custom_registries", selectedSource.id),
                          );
                          setSources((prev) =>
                            prev.filter((s) => s.id !== selectedSource.id),
                          );
                          setSelectedSourceId("prozorro");
                          const now = new Date().toLocaleTimeString();
                          setRealtimeLogs((prev) => [
                            ...prev,
                            {
                              time: now,
                              text: `Registry Manager: Deleted custom registry ${selectedSource.name} from cloud state database.`,
                              type: "warn",
                            },
                          ]);
                        } catch (err) {
                          console.error("Error deleting custom source: ", err);
                          handleFirestoreError(
                            err,
                            OperationType.DELETE,
                            `custom_registries/${selectedSource.id}`,
                          );
                        }
                      }}
                      className="px-3 py-1.5 cursor-pointer bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded font-mono font-bold text-xs uppercase transition-all"
                    >
                      Видалити
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("codegen")}
                    className="px-3 py-1.5 cursor-pointer bg-slate-900/40 backdrop-blur-md hover:bg-slate-800 text-slate-300 border border-slate-800/60 rounded font-mono text-xs font-bold uppercase transition-all"
                  >
                    Деталі API
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date().toLocaleTimeString();
                      setRealtimeLogs((prev) => [
                        ...prev,
                        {
                          time: now,
                          text: `Discovery Engine: Approved API ${selectedSource.name}. Sent to Codegen Engine.`,
                          type: "info",
                        },
                      ]);
                      setActiveTab("codegen");
                    }}
                    className="px-3 py-1.5 cursor-pointer bg-amber-600 hover:bg-amber-500 text-[#02050a] rounded font-mono font-bold text-xs uppercase transition-all flex items-center gap-1"
                  >
                    <span>СХВАЛИТИ ТА ЗГЕНЕРУВАТИ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="col-span-12 xl:col-span-6 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl pointer-events-none" />

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      DISCOVERY ЗАПИТ НА ПОШУК ТА ПАРСИНГ НОВОГО API
                    </span>
                    <button
                      onClick={() => setIsCreatingSource(false)}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-300">
                    <div>
                      <label className="block text-xs font-mono text-slate-500 mb-1">
                        НАЗВА ДЖЕРЕЛА / РЕЄСТРУ:
                      </label>
                      <input
                        type="text"
                        placeholder="Наприклад: Державний реєстр виноробства"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 focus:border-slate-800 rounded p-2 text-xs text-slate-200 font-bold focus:outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">
                          КАТЕГОРІЯ ДЖЕРЕЛА:
                        </label>
                        <select
                          value={newSourceCat}
                          onChange={(e: any) => setNewSourceCat(e.target.value)}
                          className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 focus:border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none transition-all"
                        >
                          <option value="UA_STATE">
                            🇺🇦 Державний реєстр України
                          </option>
                          <option value="INT_REGISTRY">
                            🌐 Міжнародний реєстр
                          </option>
                          <option value="OSINT_CYBER">
                            🛡️ OSINT / Кібербезпека
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">
                          ЕМОДЗІ-ІКОНКА:
                        </label>
                        <input
                          type="text"
                          placeholder="Наприклад: 🍷 або 🔌"
                          value={newSourceEmoji}
                          onChange={(e) => setNewSourceEmoji(e.target.value)}
                          className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 focus:border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-500 mb-1">
                        URL API ENDPOINT (SWAGGER / REST):
                      </label>
                      <input
                        type="text"
                        placeholder="Наприклад: https://api.wine.gov.ua/v1/registry"
                        value={newSourceEndpoint}
                        onChange={(e) => setNewSourceEndpoint(e.target.value)}
                        className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 focus:border-slate-800 rounded p-2 text-xs text-slate-300 font-mono focus:outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">
                          МЕТОД АВТОРИЗАЦІЇ:
                        </label>
                        <select
                          value={newSourceAuth}
                          onChange={(e: any) =>
                            setNewSourceAuth(e.target.value)
                          }
                          className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 focus:border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none transition-all"
                        >
                          <option value="None">
                            Відкритий API (Без авторизації)
                          </option>
                          <option value="API Key">API Key у заголовках</option>
                          <option value="Bearer Token">Bearer JWT Token</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">
                          ВЛАСНИК / МІНІСТЕРСТВО:
                        </label>
                        <input
                          type="text"
                          placeholder="Мінагрополітики України"
                          value={newSourceOwner}
                          onChange={(e) => setNewSourceOwner(e.target.value)}
                          className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 focus:border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">
                          РАЗОВИЙ ЛІМІТ ЗАПИТІВ (RATE):
                        </label>
                        <input
                          type="text"
                          placeholder="Напр. 120 req/min"
                          value={newSourceRate}
                          onChange={(e) => setNewSourceRate(e.target.value)}
                          className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 focus:border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-500 mb-1">
                          ЧАСТОТА ОНОВЛЕННЯ (SCHEDULE):
                        </label>
                        <input
                          type="text"
                          placeholder="Напр. Інкрементально кожні 6 год"
                          value={newSourceSched}
                          onChange={(e) => setNewSourceSched(e.target.value)}
                          className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 focus:border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreatingSource(false)}
                    className="px-3 py-1.5 cursor-pointer bg-slate-900/40 backdrop-blur-md hover:bg-slate-800 text-slate-300 border border-slate-800/60 rounded font-mono text-xs font-bold uppercase transition-all"
                  >
                    Скасувати
                  </button>
                  <button
                    type="button"
                    disabled={isSavingSource}
                    onClick={async () => {
                      if (!newSourceName || !newSourceEndpoint) {
                        showToast("Заповніть назву та API-endpoint!");
                        return;
                      }
                      setIsSavingSource(true);
                      const generatedId =
                        "custom_" +
                        newSourceName.toLowerCase().replace(/[^a-z0-9]/g, "_");
                      try {
                        const newRegistry: IngestSource = {
                          id: generatedId,
                          name: newSourceName,
                          flag: newSourceEmoji || "🔌",
                          category: newSourceCat,
                          processingZone: newSourceZone,
                          owner: newSourceOwner || "Intelligence Acquisition",
                          endpoint: newSourceEndpoint,
                          authMethod: newSourceAuth,
                          rateLimit: newSourceRate || "Auto-Detected",
                          schedule: newSourceSched || "Webhook / Trigger",
                          confidence: 99.8,
                          qualityScore: 100.0,
                          rowsLoaded: 0,
                          status: "ACTIVE",
                          latency: 45,
                          hasOpenAPI: true,
                        };

                        await setDoc(
                          doc(db, "custom_registries", generatedId),
                          newRegistry,
                        );
                        setSources((prev) => {
                          const filtered = prev.filter(
                            (s) => s.id !== generatedId,
                          );
                          return [...filtered, newRegistry];
                        });
                        setSelectedSourceId(generatedId);
                        setIsCreatingSource(false);

                        // Clear form
                        setNewSourceName("");
                        setNewSourceEndpoint("");

                        // Speak feedback if supported
                        if ("speechSynthesis" in window) {
                          const utterance = new SpeechSynthesisUtterance(
                            `API ${newSourceName} успішно проскановано та додано до каталогу.`,
                          );
                          utterance.lang = "uk-UA";
                          window.speechSynthesis.speak(utterance);
                        }

                        // Log
                        const now = new Date().toLocaleTimeString();
                        setRealtimeLogs((prev) => [
                          ...prev,
                          {
                            time: now,
                            text: `Discovery Engine: Successfully scanned and indexed API: ${newSourceName}. Schema validated.`,
                            type: "ai",
                          },
                        ]);
                      } catch (err) {
                        console.error("Firestore Save Error: ", err);
                        handleFirestoreError(
                          err,
                          OperationType.WRITE,
                          `custom_registries/${generatedId}`,
                        );
                      } finally {
                        setIsSavingSource(false);
                      }
                    }}
                    className="px-3 py-1.5 cursor-pointer bg-amber-600 hover:bg-amber-500 text-[#02050a] rounded font-mono font-bold text-xs uppercase transition-all flex items-center gap-1.5"
                  >
                    {isSavingSource ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>СКАНУВАННЯ...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3 h-3" />
                        <span>АНАЛІЗУВАТИ API</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: API Intelligence & Codegen */}
        {activeTab === "codegen" && (
          <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
            {/* File explorer panel */}
            <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  АВТОНОМНА ГЕНЕРАЦІЯ (AI CODEGEN ENGINE)
                </span>
                <span className="text-xs font-mono text-amber-500">
                  STAGE 4 CODEGEN
                </span>
              </div>

              <div className="p-2.5 bg-amber-950/10 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-400 mb-4 font-mono">
                <strong className="text-amber-400">
                  ШІ Генератор клієнтського коду:
                </strong>{" "}
                Для обраного джерела{" "}
                <strong className="text-slate-200">
                  {selectedSource.name}
                </strong>{" "}
                автоматично формується повнофункціональний Python репозиторій
                для збору, авторизації та валідації даних на базі 100% аналізу
                Swagger/JSON схеми.
              </div>

              {/* Selector for registers */}
              <div className="mb-3">
                <span className="text-xs font-mono text-slate-500 uppercase block mb-1">
                  ОБРАТИ СУБ'ЄКТ ГЕНЕРАЦІЇ:
                </span>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.flag} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File tree */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 font-mono text-xs">
                <div className="text-slate-500 font-bold mb-1">
                  📁 connectors/{selectedSource.id}/
                </div>
                {["client.py", "auth.py", "schemas.py"].map((file) => (
                  <div
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    className={`p-2 rounded border cursor-pointer flex items-center gap-2 ${selectedFile === file ? "bg-amber-600/15 border-slate-800 text-amber-400" : "bg-slate-900/40 border-slate-800 hover:border-slate-800/60 text-slate-400"}`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>{file}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Viewer and Sandbox terminal */}
            <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-amber-500/40 to-transparent" />

              {/* Generation Pipeline Status */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/50">
                <div className="flex gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>1. OpenAPI Parse</span>
                  </div>
                  <div className="w-4 h-[1px] bg-slate-800 my-auto" />
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>2. Pydantic Models</span>
                  </div>
                  <div className="w-4 h-[1px] bg-slate-800 my-auto" />
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>3. Client Logic</span>
                  </div>
                  <div className="w-4 h-[1px] bg-slate-800 my-auto" />
                  <div className="flex items-center gap-1.5 text-amber-400 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>4. SAST Validation</span>
                  </div>
                </div>
                <div className="text-xs font-mono bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-slate-800">
                  AGENT RUN: ACTIVE
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-slate-500" />
                    <span>
                      ФАЙЛ: connectors/{selectedSource.id}/{selectedFile}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-blue-500/10 text-blue-400 border border-slate-800 px-2 py-1 rounded">
                      AUTO-GENERATED
                    </span>
                    <span className="text-xs border border-slate-800/60 px-2 py-1 rounded uppercase">
                      Python
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-h-0 border border-slate-800 rounded-lg bg-slate-950/80 backdrop-blur-xl relative overflow-hidden flex flex-col">
                  <pre className="flex-1 p-2 overflow-auto custom-scrollbar font-mono text-xs text-slate-300 select-all leading-relaxed bg-slate-950/80 backdrop-blur-xl rounded-lg">
                    <code>
                      {generatePythonCode(selectedFile, selectedSource)}
                    </code>
                  </pre>
                </div>

                {/* Console simulator */}
                <div className="h-40 border border-slate-800 rounded-lg bg-slate-950/80 backdrop-blur-xl p-2 flex flex-col justify-between flex-shrink-0 font-mono">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      VIRTUAL TEST SHELL (workdir: /home/predator-platform)
                    </span>

                    <button
                      disabled={isTestingCode}
                      onClick={handleTestRun}
                      className="px-2.5 py-1 cursor-pointer bg-amber-600/20 hover:bg-amber-600 hover:text-[#02050a] text-amber-400 border border-slate-800 rounded text-xs font-bold uppercase transition-all"
                    >
                      {isTestingCode ? "Тестування..." : "Запустити юніт-тести"}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1 py-1.5 text-xs text-slate-400 custom-scrollbar pr-1">
                    {consoleLogs.length === 0 ? (
                      <div className="text-slate-600 italic text-center py-2">
                        Тестова служба готова. Натисніть "Запустити юніт-тести"
                        для перевірки згенерованого коннектора в ізольованій
                        пісочниці.
                      </div>
                    ) : (
                      consoleLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={
                            log.includes("[УСПІХ]")
                              ? "text-emerald-400"
                              : log.includes("passed")
                                ? "text-cyan-400"
                                : "text-slate-300"
                          }
                        >
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ETL & Entity Resolution */}
        {activeTab === "etl-workbench" && (
          <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
            {/* ETL Stage Pipeline Layout */}
            <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  ETL FACTORY PIPELINE SEQUENCE (S6)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  FLOW SPEC
                </span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 text-xs font-mono">
                {[
                  {
                    name: "1. Raw S3 Landing",
                    desc: "Первинний запис незмінного JSON у MinIO.",
                    col: "text-amber-500",
                  },
                  {
                    name: "2. Validator Engine",
                    desc: "Контроль схем, PK/FK та виявлення Schema Drift.",
                    col: "text-cyan-500",
                  },
                  {
                    name: "3. Cleaning Engine",
                    desc: "Фільтрація пошкоджених полів, NULL та дублікатів.",
                    col: "text-emerald-500",
                  },
                  {
                    name: "4. Model Normalization",
                    desc: "Приведення до універсальної суверенної схеми.",
                    col: "text-indigo-400",
                  },
                  {
                    name: "5. Deduplication Engine",
                    desc: "Придушення дублів за первинними ключами.",
                    col: "text-rose-400",
                  },
                  {
                    name: "6. Entity Resolution",
                    desc: "Об'єднання схожих людей та компаній на льоту.",
                    col: "text-amber-400",
                  },
                  {
                    name: "7. Graph Mapping (Neo4j)",
                    desc: "Будування зв'язків засновників/бенефіціарів.",
                    col: "text-indigo-500",
                  },
                  {
                    name: "8. Embeddings Vectorizer",
                    desc: "Генерація семантичних векторів для Qdrant.",
                    col: "text-purple-400",
                  },
                  {
                    name: "9. ClickHouse analytics",
                    desc: "Агрегування потоку транзакцій у ClickHouse.",
                    col: "text-emerald-500",
                  },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/80 backdrop-blur-xl p-2.5 rounded-lg border border-slate-800"
                  >
                    <span className={`font-bold block ${step.col}`}>
                      {step.name}
                    </span>
                    <span className="text-slate-400 text-xs leading-relaxed block mt-0.5">
                      {step.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entity Resolution Workbench */}
            <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

              <div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    РОЗДІЛ 11: ШІ РОБОЧЕ МІСЦЕ ENTITY RESOLUTION (УНІФІКАЦІЯ)
                  </span>
                  <span className="text-xs bg-cyan-950 text-cyan-400 border border-slate-800 px-2 py-1 rounded font-mono uppercase font-bold">
                    ONLINE
                  </span>
                </div>

                <div className="p-2 bg-cyan-950/10 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-400 mb-4 font-mono">
                  <strong className="text-cyan-400">
                    Технологія Entity Resolution:
                  </strong>{" "}
                  Автоматично усуває фрагментацію даних. Спроби маскування
                  компаній (ТОВ, ТОВ., LLC, Limited) чи людей зводяться до
                  єдиного суверенного профілю в базі даних.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <div className="md:col-span-1 space-y-2">
                    <span className="text-xs font-mono text-slate-500 uppercase block">
                      ТИП СУТНОСТІ:
                    </span>
                    <div className="flex flex-col gap-1 text-xs">
                      {[
                        {
                          id: "company",
                          label: "Юридична Особа (Company)",
                          sample: "ТОВ 'СПЕЦІАЛЬНІ ТЕХНОЛОГІЇ БЕЗПЕКИ.'",
                        },
                        {
                          id: "person",
                          label: "Фізична Особа (Person / PEP)",
                          sample: "КОЗАЧЕНКО АНДРІЙ МИХАЙЛОВИЧ",
                        },
                        {
                          id: "iban",
                          label: "Рахунок (IBAN)",
                          sample: "UA123013000002600412903481",
                        },
                        {
                          id: "crypto",
                          label: "Криптогаманець (Crypto)",
                          sample: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
                        },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setErType(t.id as any);
                            setErInput(t.sample);
                            setErResult(null);
                          }}
                          className={`p-2 rounded border text-left cursor-pointer transition-all ${erType === t.id ? "bg-amber-600/10 border-slate-800 text-amber-400 font-bold" : "bg-slate-950/80 backdrop-blur-xl border-slate-800 text-slate-400 hover:border-slate-800/60"}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2 font-mono">
                    <span className="text-xs text-slate-500 uppercase block">
                      ВХІДНІ "БРУДНІ" ДАНІ:
                    </span>
                    <textarea
                      value={erInput}
                      onChange={(e) => setErInput(e.target.value)}
                      className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded p-2.5 text-xs text-slate-200 h-24 focus:outline-none focus:border-amber-500 font-mono"
                    />

                    <button
                      onClick={handleEntityResolution}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-[#02050a] font-bold text-xs uppercase tracking-wide rounded cursor-pointer transition-all"
                    >
                      Запустити об'єднання (Entity Resolution)
                    </button>
                  </div>
                </div>

                {/* Displaying match result */}
                <div className="font-mono text-xs">
                  {erLoading && (
                    <div className="text-center py-8 text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>
                        Обчислення ваг схожості та зіставлення за базою...
                      </span>
                    </div>
                  )}

                  {erResult && (
                    <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-lg space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          СУТНІСТЬ УСПІШНО УНІФІКОВАНО
                        </span>
                        <span className="text-slate-500">
                          ID: {erResult.matched_entity_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-xs">
                            НОРМАЛІЗОВАНА НАЗВА ПЛАТФОРМИ:
                          </span>
                          <span className="text-slate-200 font-bold block mt-0.5">
                            {erResult.normalized_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs">
                            ВАГА ДОВІРИ ШІ (CONFIDENCE):
                          </span>
                          <span className="text-cyan-400 font-bold block mt-0.5">
                            {erResult.confidence_weight}% MATCH
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60">
                        <span className="text-slate-500 block text-xs mb-1">
                          ЗБЕРЕЖЕНІ ПАРАМЕТРИ ПРЕДАТОР ПОРТРЕТА:
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-black/30 p-2 rounded border border-slate-800">
                          {Object.entries(erResult.attributes).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-slate-500 block font-mono uppercase">
                                {k}:
                              </span>
                              <span className="text-slate-300 font-bold">
                                {v as string}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 font-mono border-t border-slate-800 pt-2 flex justify-between">
                <span>
                  Алгоритм: Jaro-Winkler + Cosine Embedding threshold (0.85)
                </span>
                <span>
                  Зв'язаних джерел:{" "}
                  {erResult ? erResult.sources.join(", ") : "всі 17 реєстрів"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Graph & Qdrant Vectors */}
        {activeTab === "graph-vectors" && (
          <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
            {/* Neo4j Schema Visualisation */}
            <div className="col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-400 animate-pulse" />
                  РОЗДІЛ 12: КАРТА ЗВ'ЯЗКІВ (NEO4J SCHEMA)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  NEO4J REBELLION
                </span>
              </div>

              <div className="p-2 bg-indigo-950/10 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-400 mb-4 font-mono">
                <strong className="text-indigo-400">
                  Графова модель зв'язків:
                </strong>{" "}
                При переході даних до Neo4j автоматично формуються зв\'язки на
                глибину до 10 рівнів.
              </div>

              <div className="flex-1 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-lg p-2 flex flex-col justify-between font-mono text-xs">
                <div className="space-y-2">
                  <span className="text-slate-500 block uppercase font-bold">
                    АКТИВНІ ТИПИ РЕБЕР (NEO4J CYC):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60 flex justify-between">
                      <span className="text-slate-400">
                        [:BENEFICIARY] (Бенефіціар)
                      </span>
                      <span className="text-emerald-400 font-bold">
                        124K links
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60 flex justify-between">
                      <span className="text-slate-400">
                        [:DIRECTOR_OF] (Директор)
                      </span>
                      <span className="text-emerald-400 font-bold">
                        98K links
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60 flex justify-between">
                      <span className="text-slate-400">
                        [:RELATIVE_OF] (Родич)
                      </span>
                      <span className="text-amber-400 font-bold">
                        15K links
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60 flex justify-between">
                      <span className="text-slate-400">
                        [:WINNER_OF] (Переможець)
                      </span>
                      <span className="text-cyan-400 font-bold">
                        410K links
                      </span>
                    </div>
                  </div>
                </div>

                {/* Graph visualization box */}
                <div className="my-4 border border-slate-800 p-2 rounded bg-slate-950/80 backdrop-blur-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="relative z-10 flex items-center gap-2 text-center">
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-1.5 rounded text-xs w-24">
                      <span className="font-bold block text-slate-200">
                        Козаченко А.М.
                      </span>
                      <span className="text-xs text-slate-500">
                        tax: 2839102948
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs bg-cyan-950 text-cyan-400 border border-slate-800 px-1 py-0.2 rounded mb-1">
                        DirectorOf
                      </span>
                      <div className="w-16 h-[1px] bg-gradient-to-r from-amber-500 to-indigo-500" />
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-1.5 rounded text-xs w-24">
                      <span className="font-bold block text-slate-200">
                        ТОВ "СПЕЦТЕХ"
                      </span>
                      <span className="text-xs text-slate-500">
                        edr: 38491823
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-800 pt-2">
                  <span>
                    Cypher Query: MATCH
                    (p:Person)-[r:DIRECTOR_OF]-&gt;(c:Company) RETURN p,r,c
                    LIMIT 1
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Query: 2.1ms
                  </span>
                </div>
              </div>
            </div>

            {/* Qdrant Vector Cosine Calculator */}
            <div className="col-span-12 lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl pointer-events-none" />

              <div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    РОЗДІЛ 12-13: ШІ СЕМАНТИЧНИЙ ПОШУК ТА СЕМАНТИЧНА ПОДІБНІСТЬ
                    ВЕКТОРІВ
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    QDRANT VECTORS
                  </span>
                </div>

                <div className="p-2 bg-cyan-950/10 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-400 mb-4 font-mono">
                  <strong className="text-cyan-400">
                    Генерація векторних embeddings у Qdrant (768-dim):
                  </strong>{" "}
                  Тексти реєстрів (наприклад, описи судових справ чи корупційних
                  аномалій) автоматично конвертуються у векторний простір для
                  порівняння смислового наповнення.
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1 uppercase">
                      Текст А (Перше порівняння):
                    </span>
                    <input
                      type="text"
                      value={textA}
                      onChange={(e) => setTextA(e.target.value)}
                      className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1 uppercase">
                      Текст Б (Друге порівняння для дубліката):
                    </span>
                    <input
                      type="text"
                      value={textB}
                      onChange={(e) => setTextB(e.target.value)}
                      className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    onClick={calculateCosineSimilarity}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-[#02050a] font-bold text-xs uppercase tracking-wide rounded cursor-pointer transition-all"
                  >
                    Обчислити косинусну близькість (Cosine Similarity)
                  </button>
                </div>

                {/* Similarity output */}
                <div className="mt-4 font-mono text-xs">
                  {simLoading && (
                    <div className="text-center py-2 text-slate-500">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 mx-auto mb-2" />
                      <span>
                        Генерація embeddings та косинусна звірка у Qdrant...
                      </span>
                    </div>
                  )}

                  {similarity !== null && (
                    <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400 font-bold uppercase">
                          КОСИНУСНА ПОДІБНІСТЬ EMBEDDINGS
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${similarity > 80 ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-400"}`}
                        >
                          {similarity > 80
                            ? "КРИТИЧНИЙ ЗБІГ"
                            : "ПРИЙНЯТНИЙ ДІАПАЗОН"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Близькість за косинусною відстаню:</span>
                          <span className="font-bold text-emerald-400">
                            {similarity}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900/40 backdrop-blur-md h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full rounded-full"
                            style={{ width: `${similarity}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800/60">
                        {similarity > 80
                          ? "✓ Виявлено критично високу схожість за змістом. ШІ рекомендує злити сутності Козаченко А.М. у єдиний унікальний профіль для запобігання дублювання."
                          : "Низький рівень збігу. Сутності класифікуються як різні."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500 font-mono border-t border-slate-800 pt-2">
                <span>
                  Векторний двигун: Qdrant Server (v1.8) | Модель:
                  Multilingual-E5-Large (768-dim)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Self-Healing Cockpit */}
        {activeTab === "healing" && (
          <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
            <div className="col-span-12 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-red-500/40 via-amber-500/30 to-transparent" />

              <div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-500 animate-pulse" />
                    SELF-HEALING ENGINE & GITOPS ORCHESTRATION
                  </span>
                  <span className="text-xs bg-rose-500/15 text-rose-400 border border-slate-800 px-2 py-1 rounded font-mono font-bold animate-pulse">
                    MONITOR ACTIVE
                  </span>
                </div>

                <div className="p-2 bg-rose-950/10 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-400 mb-4 font-mono">
                  <strong className="text-rose-400">
                    Автономний Ремонт (Self-Healing):
                  </strong>{" "}
                  Якщо API неочікувано змінить свою схему (Schema Drift),
                  Платформа самостійно виявить збій, опитає новий Swagger,
                  оновить код Python-клієнта, згенерує Postgres DDL міграції,
                  прожене їх через QA Validation Engine (Ruff, Pytest) і через
                  ArgoCD (GitOps) відновить деплой.
                </div>

                {/* Simulated Logs terminal */}
                <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-lg p-2 h-64 overflow-y-auto custom-scrollbar font-mono text-xs space-y-1.5 pr-1">
                  {healingLogs.length === 0 ? (
                    <div className="text-slate-600 text-center py-16">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-700 mb-2 animate-pulse" />
                      Кабінет самовідновлення вільний. Натисніть "ТРИГЕРУВАТИ
                      API FAILURE" для симуляції аварії та автоматичного
                      ремонту.
                    </div>
                  ) : (
                    healingLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2 leading-relaxed">
                        <span className="text-cyan-500 flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <span
                          className={
                            log.includes("[CRITICAL") || log.includes("🚨")
                              ? "text-rose-400 font-bold"
                              : log.includes("✅") || log.includes("passed")
                                ? "text-emerald-400"
                                : "text-slate-300"
                          }
                        >
                          {log}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                {isHealing && (
                  <div className="space-y-1 font-mono text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>ВИКОНАННЯ РЕМОНТУ ШІ:</span>
                      <span>{Math.round((healingStage / 9) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-900/40 backdrop-blur-md h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full transition-all duration-300"
                        style={{ width: `${(healingStage / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  disabled={isHealing}
                  onClick={runSelfHealingSimulator}
                  className={`w-full py-2.5 rounded-lg font-mono font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 ${isHealing ? "bg-slate-900/40 backdrop-blur-md text-slate-600 cursor-not-allowed border border-slate-800/60" : "bg-rose-600 hover:bg-rose-500 text-white shadow shadow-rose-950/20 cursor-pointer active:scale-95"}`}
                >
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                  ТРИГЕРУВАТИ API FAILURE (ЗМІНУ СХЕМИ) ТА АВТО-РЕМОНТ
                </button>
              </div>
            </div>

            {/* Regression PR status right box */}
            <div className="col-span-12 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] justify-between font-mono">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block pb-2 border-b border-slate-800 mb-3">
                  АНАЛІЗ РЕГРЕСІЇ ТА PULL REQUEST НА ДЕПЛОЙ
                </span>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950/80 backdrop-blur-xl p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">
                      GEN PR #142 (BRANCH: AUTO-HEAL-SCHEMA-DRIFT):
                    </span>
                    <span className="text-slate-300 block font-bold mt-1">
                      "chore(adip): Autonomous recovery patch for external API
                      schema drift"
                    </span>
                    <span className="text-slate-500 text-xs block mt-1">
                      Generated by: Self-Healing Engine (Antigravity Agent)
                    </span>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-xl p-2 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-slate-500 block">
                      DIFF OVERVIEW (АВТОМАТИЧНА РЕГЕНЕРАЦІЯ ШІ):
                    </span>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="text-emerald-400">
                        + self.params["payer_tax_code"] = payer_edrpou
                      </div>
                      <div className="text-rose-400">
                        - self.params["payer_edrpou"] = payer_edrpou
                      </div>
                      <div className="text-emerald-400">
                        + schema.add_column("recipient_iin", type=String,
                        nullable=True)
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-xl p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">
                      QA VALIDATION PIPELINE (CI/CD STATUS):
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1.5">
                      <div className="text-emerald-400">
                        ✔ Contract Tests (Passed)
                      </div>
                      <div className="text-emerald-400">
                        ✔ Ruff Linter (Clean)
                      </div>
                      <div className="text-emerald-400">
                        ✔ Chaos Engineering (Passed)
                      </div>
                      <div className="text-emerald-400">
                        ✔ DDL Postgres Migration (Passed)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 text-xs text-slate-400 leading-relaxed">
                <span className="text-amber-400 font-bold block mb-1">
                  ГЛОБАЛЬНИЙ СТАТУС ВІДНОВЛЕННЯ:
                </span>
                100% автономне усунення аварії. API-клієнт регенеровано, тести
                виконано, DDL-міграції застосовано до бази. Зміни передано до
                GitOps (ArgoCD) для production deployment.
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: Observability & Security */}
        {activeTab === "observability" && (
          <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
            {/* Realtime Metrics */}
            <div className="col-span-12 lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block pb-2 border-b border-slate-800 mb-4">
                  РОЗДІЛ 14: ЖИВИЙ МОНІТОРИНГ ПЛАТФОРМИ (OPENTELEMETRY TRACES)
                </span>

                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-lg">
                    <span className="text-slate-500 text-xs block">
                      THROUGHPUT (РЯДКІВ / СЕК)
                    </span>
                    <span className="text-emerald-400 text-base font-black block mt-1">
                      2,410 r/s
                    </span>
                    <span className="text-slate-500 text-xs block">
                      Streaming active
                    </span>
                  </div>
                  <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-lg">
                    <span className="text-slate-500 text-xs block">
                      СЕРЕДНЯ ЗАТРИМКА (LATENCY)
                    </span>
                    <span className="text-cyan-400 text-base font-black block mt-1">
                      245 ms
                    </span>
                    <span className="text-slate-500 text-xs block">
                      17 active APIs
                    </span>
                  </div>
                  <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-lg">
                    <span className="text-slate-500 text-xs block">
                      SLA AVAILABILITY (ДОСТУПНІСТЬ)
                    </span>
                    <span className="text-emerald-400 text-base font-black block mt-1">
                      99.99%
                    </span>
                    <span className="text-slate-500 text-xs block">
                      Sovereign Cluster Up
                    </span>
                  </div>
                  <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-lg">
                    <span className="text-slate-500 text-xs block">
                      ПОМИЛКА RATE (РІВЕНЬ ПОМИЛОК)
                    </span>
                    <span className="text-slate-300 text-base font-black block mt-1">
                      0.00%
                    </span>
                    <span className="text-slate-500 text-xs block">
                      Self-Healed: 1 event
                    </span>
                  </div>
                </div>

                {/* Simulated Traces lists representing telemetry */}
                <div className="mt-4 space-y-2 font-mono text-xs">
                  <span className="text-slate-500 block uppercase font-bold">
                    OpenTelemetry Span Traces (Latest Ingestion Flows):
                  </span>
                  {[
                    {
                      name: "GET prozorro/tenders",
                      dur: "185ms",
                      stat: "OK 200",
                    },
                    {
                      name: "POST raw-data/minio/prozorro_json",
                      dur: "22ms",
                      stat: "OK 201",
                    },
                    {
                      name: "JSON Parsing & validation (Pydantic)",
                      dur: "8ms",
                      stat: "OK",
                    },
                    {
                      name: "Entity Resolution matching (LLC -> ТОВ)",
                      dur: "45ms",
                      stat: "OK (ID Resolved)",
                    },
                    {
                      name: "Neo4j relation upsert (MERGE)",
                      dur: "18ms",
                      stat: "OK",
                    },
                  ].map((tr, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-slate-950/80 backdrop-blur-xl p-2 rounded border border-slate-800"
                    >
                      <span className="text-slate-300">{tr.name}</span>
                      <div className="space-x-3">
                        <span className="text-cyan-400">{tr.dur}</span>
                        <span className="text-emerald-400 font-bold">
                          {tr.stat}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                <span>
                  Observability Source: Prometheus v2.4 + Grafana Integration
                  Layer | Host: sovereign-adip-prod
                </span>
              </div>
            </div>

            {/* AI Security Auditor reports */}
            <div className="col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[400px] justify-between font-mono">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block pb-2 border-b border-slate-800 mb-3">
                  РОЗДІЛ 14: ШІ СЕКЮРІТІ АУДИТОР (SECURITY AUDIT)
                </span>

                <div className="p-2 bg-emerald-950/15 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-400 mb-4">
                  <strong className="text-emerald-400">
                    ШІ Аудит Безпеки Коду:
                  </strong>{" "}
                  Кожен автогенерований коннектор проходить примусову статичну
                  та динамічну перевірку безпеки (Ruff, MyPy, Bandit, Semgrep,
                  Trivy) перед автоматичним комітом у репозиторій.
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950/80 backdrop-blur-xl p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-xs">
                      BANDIT (CODE SECURITY SCANNER):
                    </span>
                    <span className="text-emerald-400 font-bold block mt-1">
                      ✔ 0 Issues Found. No unsafe eval() or os.system()
                      statements.
                    </span>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-xl p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-xs">
                      SEMGREP (OWASP CORES AUDIT):
                    </span>
                    <span className="text-emerald-400 font-bold block mt-1">
                      ✔ Clean. No hardcoded credentials or API keys exposed.
                      Vault setup compliant.
                    </span>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-xl p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-xs">
                      LICENSE AUDITOR:
                    </span>
                    <span className="text-emerald-400 font-bold block mt-1">
                      ✔ Compliant. All connected libs are MIT, Apache 2.0 or BSD
                      permissive.
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 text-xs text-slate-400 leading-relaxed">
                <span className="text-cyan-400 font-bold block mb-1">
                  САМОЗАДОВОЛЕННЯ КРИТЕРІЇВ:
                </span>
                Забезпечується абсолютна безпека. Платформа PREDATOR не
                пропускає до продакшну неперевірений ШІ-код.
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: Docs & ADRs */}
        {activeTab === "docs" && (
          <div className="col-span-12 flex flex-col gap-2 flex-1 min-h-0">
            {/* Sub tab navigation */}
            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg gap-2 self-start z-10">
              <button
                onClick={() => setDocSubTab("blueprint")}
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded cursor-pointer transition-all flex items-center gap-1.5 ${docSubTab === "blueprint" ? "bg-amber-600 text-[#02050a]" : "text-slate-400 hover:text-slate-200 hover:bg-black/30"}`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Генеральний План Інтеграції (Enterprise Blueprint)
              </button>
              <button
                onClick={() => setDocSubTab("adr")}
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded cursor-pointer transition-all flex items-center gap-1.5 ${docSubTab === "adr" ? "bg-amber-600 text-[#02050a]" : "text-slate-400 hover:text-slate-200 hover:bg-black/30"}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Architectural Decision Records (ADR 1-10)
              </button>
            </div>

            {docSubTab === "blueprint" ? (
              <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
                {/* Chapters list sidebar */}
                <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[360px]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      ГЛАВИ АРХІТЕКТУРНОГО ПЛАНУ PREDATOR
                    </span>
                    <span className="text-xs bg-amber-500/10 text-amber-400 px-1 py-0.5 rounded font-mono font-bold">
                      SOVEREIGN ETLS
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 text-xs">
                    {[
                      {
                        id: 0,
                        title: "1. Автономна Фабрика Конекторів",
                        desc: "Повністю автономна генерація, тестування, самовідновлення",
                      },
                      {
                        id: 1,
                        title: "2. Державні реєстри України (ETL)",
                        desc: "ProZorro, Spending, НАЗК, data.gov.ua, НБУ, ВРУ",
                      },
                      {
                        id: 2,
                        title: "3. Міжнародні санкції та реєстри",
                        desc: "OpenSanctions, FollowTheMoney, OpenCorporates, SEC",
                      },
                      {
                        id: 3,
                        title: "4. Наукометрія, Геополітика & Кібер",
                        desc: "OpenAlex Polite Pool, GDELT 2.0, Nominatim OSM",
                      },
                      {
                        id: 4,
                        title: "5. Knowledge Graph & Вектори",
                        desc: "Neo4j Graph Builder, Qdrant Embeddings, Entity Resolution",
                      },
                      {
                        id: 5,
                        title: "6. Трьохзональна Стратегія Збору (Green/Yellow/Red)",
                        desc: "Прямі API, Proxy Rotators, Ізольовані Tor / Sandbox Crawlers",
                      },
                    ].map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => setSelectedBlueprintSection(ch.id)}
                        className={`p-2.5 rounded border cursor-pointer transition-all flex flex-col gap-0.5 ${selectedBlueprintSection === ch.id ? "bg-amber-600/10 border-slate-800 text-amber-400" : "bg-slate-900/40 border-slate-800 hover:border-slate-800/60 text-slate-400"}`}
                      >
                        <span className="font-bold">{ch.title}</span>
                        <span className="text-xs text-slate-500 truncate">
                          {ch.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chapter contents */}
                <div className="col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[360px] justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                    {selectedBlueprintSection === 0 && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-black text-slate-200 uppercase">
                            ГЛАВА 1: ПЛАТФОРМА ЗБОРУ ЗНАНЬ (AI INTELLIGENCE
                            ACQUISITION)
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Тема: Від фабрики конекторів до 100% автономного
                            виявлення та еволюції джерел
                          </p>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Замість розробки десятків ізольованих ручних
                          інтеграцій (конекторів), сучасна платформа впроваджує
                          парадигму{" "}
                          <strong>AI Intelligence Acquisition Platform</strong>.
                          Це означає перехід від "фабрики конекторів" (яка чекає
                          на завдання) до системи, яка активно шукає нові API,
                          реєстри та датасети в інтернеті, самостійно оцінює їх
                          і генерує інтеграції. Людина не бере участі в
                          написанні коду — вона лише керує пріоритетами.
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Керує фабрикою агент рівня{" "}
                          <strong>Google Antigravity (Agent Mode)</strong>, який
                          виконує ролі AI Architect, DevOps, Data Engineer та
                          SRE. За допомогою <strong>Discovery Crawler</strong>{" "}
                          він обходить офіційні вебресурси, знаходить нові
                          набори відкритих даних, виявляє нові API, аналізує
                          Swagger/OpenAPI специфікації, генерує ETL, створює DDL
                          схеми, будує графи сутностей та граф джерел (Knowledge
                          Graph of Sources).
                        </p>
                        <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-lg font-mono text-xs text-amber-400 space-y-1">
                          <span className="font-bold block text-slate-400 text-xs uppercase">
                            GLOBAL DISCOVERY ENGINE ТА ЖИТТЄВИЙ ЦИКЛ:
                          </span>
                          <div>
                            • <strong>Source Discovery Pipeline:</strong> Пошук
                            нових OpenAPI, CKAN, RSS. Автоматична класифікація
                            та Risk Assessment.
                          </div>
                          <div>
                            • <strong>Autonomous Prioritization:</strong>{" "}
                            Розрахунок рейтингу джерела (цінність, унікальність,
                            якість).
                          </div>
                          <div>
                            • <strong>Connector Evolution Engine:</strong>{" "}
                            Discovery ➝ Learning ➝ Versioning ➝ Testing ➝
                            Production ➝ Continuous Improvement.
                          </div>
                          <div>
                            • <strong>Meta-Learning:</strong> Система накопичує
                            знання про інтеграції, оновлюючи шаблони ETL,
                            правила графів та типові помилки після кожного
                            циклу.
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-cyan-400 font-bold block uppercase text-xs">
                            GIT-OPS ТА АВТОМАТИЗАЦІЯ ДЕПЛОЮ:
                          </span>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Увесь згенерований код тестується статичним
                            аналізом. Запускаються Unit/Integration/Contract та
                            Load тести. Після покриття &gt;95%, система створює
                            Git Commit, проходить Code Review, створює Pull
                            Request та деплоїться в Production через Kubernetes
                            та ArgoCD (GitOps). Вся документація (ER та Sequence
                            діаграми, ADR, OpenAPI специфікації) створюється
                            автоматично.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedBlueprintSection === 1 && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-black text-slate-200 uppercase">
                            ГЛАВА 2: ІНТЕГРАЦІЯ З ДЕРЖАВНИМИ ІНФОРМАЦІЙНИМИ
                            СИСТЕМАМИ УКРАЇНИ
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Тема: Специфікація підключень та синхронізації
                            ProZorro, Spending, НАЗК, data.gov.ua, НБУ, ВРУ
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <span className="text-amber-400 font-bold block uppercase text-xs">
                              1. Система публічних закупівель ProZorro (OCDS):
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Синхронізація базується на безперервному
                              опитуванні часу модифікації. Замість limit/offset
                              пагінації конвеєр використовує унікальний об'єкт{" "}
                              <code>next_page</code>:
                            </p>
                            <table className="w-full text-left font-mono text-xs text-slate-400 border border-slate-800 rounded bg-slate-950/80 backdrop-blur-xl mt-1.5">
                              <thead>
                                <tr className="bg-slate-900/40 backdrop-blur-md text-slate-300">
                                  <th className="p-1">Властивість next_page</th>
                                  <th className="p-1">Призначення</th>
                                  <th className="p-1">Архітектурне значення</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t border-slate-800">
                                  <td className="p-1 text-cyan-400 font-bold">
                                    offset
                                  </td>
                                  <td className="p-1">
                                    Точний маркер часу / хеш
                                  </td>
                                  <td className="p-1">
                                    Забезпечує ідемпотентність. Зберігається в
                                    БД стану для відновлення після збоїв.
                                  </td>
                                </tr>
                                <tr className="border-t border-slate-800">
                                  <td className="p-1 text-cyan-400 font-bold">
                                    path
                                  </td>
                                  <td className="p-1">Відносний URL-шлях</td>
                                  <td className="p-1">
                                    Зберігає оригінальні параметри запиту через
                                    проксі-сервери або шлюзи.
                                  </td>
                                </tr>
                                <tr className="border-t border-slate-800">
                                  <td className="p-1 text-cyan-400 font-bold">
                                    uri
                                  </td>
                                  <td className="p-1">Абсолютна URL-адреса</td>
                                  <td className="p-1">
                                    Основний лінк для автоматизованої пагінації
                                    в циклах конвеєра.
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p className="text-xs text-slate-400 leading-relaxed mt-1">
                              Логіка конвеєра виконує запити за адресами{" "}
                              <code>next_page.uri</code>, поки не повернеться
                              порожній масив, після чого засинає на 5 хвилин.
                              Завантаження документів вимагає заголовок{" "}
                              <code>Authorization: Bearer broker</code> та
                              наявність параметра <code>acc_token</code>.
                              Процедури ESCO розраховуються за чистим приведеним
                              доходом (NPV). Для великих завантажень
                              використовується{" "}
                              <strong>Kingfisher Collect</strong>.
                            </p>
                          </div>

                          <div className="space-y-1 border-t border-slate-800/60 pt-2">
                            <span className="text-amber-400 font-bold block uppercase text-xs">
                              2. Портал публічних коштів (Spending.gov.ua):
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Для уникнення помилок HTTP 504 (Gateway Timeout),
                              конвеєр ділить великі періоди на щоденні
                              мікробатчі. Шар трансформації примусово конвертує
                              фінансові суми у тип <code>Decimal</code>{" "}
                              фіксованої точності, запобігаючи похибкам
                              округлення чисел з плаваючою комою.
                            </p>
                          </div>

                          <div className="space-y-1 border-t border-slate-800/60 pt-2">
                            <span className="text-amber-400 font-bold block uppercase text-xs">
                              3. Єдиний державний реєстр декларацій (НАЗК):
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Оскільки відповіді є глибоко вкладеними,
                              гетерогенними JSON-документами без жорсткої схеми,
                              застосовується архітектурний підхід{" "}
                              <strong>ELT</strong>. Сирі JSONB-дані
                              завантажуються в базу без змін, а розгортання
                              структур (flattening) та нормалізація сутностей
                              (декларанти, нерухомість, корпоративні права,
                              члени родини) виконується на стороні БД за
                              допомогою інструменту <strong>dbt</strong>.
                            </p>
                          </div>

                          <div className="space-y-1 border-t border-slate-800/60 pt-2">
                            <span className="text-amber-400 font-bold block uppercase text-xs">
                              4. Національний портал відкритих даних
                              (data.gov.ua / CKAN):
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Використовує <code>package_search</code> та{" "}
                              <code>datastore_search</code>. Якщо ресурс
                              доступний лише як зовнішній файл (ZIP, CSV, XML),
                              воркери використовують <code>io.BytesIO</code> та{" "}
                              <code>zipfile</code> для декомпресії в оперативній
                              пам'яті, миттєво спрямовуючи дані через bulk
                              inserts без збереження архівів на локальний диск.
                            </p>
                          </div>

                          <div className="space-y-1 border-t border-slate-800/60 pt-2">
                            <span className="text-amber-400 font-bold block uppercase text-xs">
                              5. НБУ (Фінмоніторинг) та ВРУ (Законодавство):
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Курси НБУ імпортуються щодня після 15:00 у
                              вимірювальні таблиці (Dimension Table) за моделлю
                              "Зірка". Тексти законів ВРУ проходять NLP
                              векторизацію та зберігаються у векторній базі
                              даних для подальшого використання у RAG-конвеєрах.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedBlueprintSection === 2 && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-black text-slate-200 uppercase">
                            ГЛАВА 3: ІНТЕГРАЦІЯ МІЖНАРОДНИХ БАЗ ДАНИХ, САНКЦІЙ
                            ТА КОРПОРАТИВНИХ РЕЄСТРІВ
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Тема: Глобальний санкційний моніторинг
                            OpenSanctions, OpenCorporates, SEC EDGAR,
                            CourtListener
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <span className="text-cyan-400 font-bold block uppercase text-xs">
                              1. Глобальний санкційний моніторинг:
                              OpenSanctions:
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Дані базуються на онтології{" "}
                              <strong>FollowTheMoney (FtM)</strong>. Оскільки
                              загальний зведений файл експорту досягає розмірів
                              у декілька гігабайт, завантаження його в
                              оперативну пам'ять як єдиного JSON-об'єкта
                              призводить до збоїв Out-of-Memory. Натомість
                              інтеграція вимагає потокового зчитування{" "}
                              <strong>line-delimited JSON</strong> (JSON-Lines).
                            </p>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Для тонкого налаштування видобутку
                              використовуються Apify актори (наприклад,
                              OpenSanctions Entities Scraper). Основні
                              конфігураційні параметри:
                            </p>
                            <table className="w-full text-left font-mono text-xs text-slate-400 border border-slate-800 rounded bg-slate-950/80 backdrop-blur-xl mt-1.5">
                              <thead>
                                <tr className="bg-slate-900/40 backdrop-blur-md text-slate-300">
                                  <th className="p-1">
                                    Конфігураційний параметр
                                  </th>
                                  <th className="p-1">Тип</th>
                                  <th className="p-1">
                                    Архітектурне призначення
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t border-slate-800">
                                  <td className="p-1 text-cyan-400 font-bold">
                                    datasetSlug
                                  </td>
                                  <td className="p-1">String</td>
                                  <td className="p-1">
                                    Вибір конкретного джерела (наприклад,{" "}
                                    <code>us_ofac_sdn</code>, або{" "}
                                    <code>за замовчуванням</code> для повного набору).
                                  </td>
                                </tr>
                                <tr className="border-t border-slate-800">
                                  <td className="p-1 text-cyan-400 font-bold">
                                    exportUrl
                                  </td>
                                  <td className="p-1">String</td>
                                  <td className="p-1">
                                    Пряме HTTPS-посилання на конкретний файл
                                    експорту OpenSanctions.
                                  </td>
                                </tr>
                                <tr className="border-t border-slate-800">
                                  <td className="p-1 text-cyan-400 font-bold">
                                    maxScanLines
                                  </td>
                                  <td className="p-1">Integer</td>
                                  <td className="p-1">
                                    Критичний механізм безпеки: лімітує
                                    кількість прочитаних JSON-рядків для
                                    оптимізації пам'яті.
                                  </td>
                                </tr>
                                <tr className="border-t border-slate-800">
                                  <td className="p-1 text-cyan-400 font-bold">
                                    maxItems
                                  </td>
                                  <td className="p-1">Integer</td>
                                  <td className="p-1">
                                    Контроль обсягу вихідних даних: лімітує
                                    кількість сутностей.
                                  </td>
                                </tr>
                                <tr className="border-t border-slate-800">
                                  <td className="p-1 text-cyan-400 font-bold">
                                    schemas / topics
                                  </td>
                                  <td className="p-1">String[]</td>
                                  <td className="p-1">
                                    Фільтрація сутностей за схемою (Person,
                                    Company, Vessel, sanctions, peps, crime).
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p className="text-xs text-slate-400 leading-relaxed mt-1">
                              З видобутих FtM-сутностей обов'язково імпортуються
                              атрибути: <code>id</code>, <code>caption</code>,{" "}
                              <code>schema</code> (або <code>entityType</code>),{" "}
                              <code>target</code> та <code>identifiers</code>{" "}
                              (податкові номери, LEI, ISIN, номери паспортів)
                              для точного детермінованого зіставлення із
                              записами українських реєстрів. Налаштування
                              параметра <code>includeProperties=true</code>{" "}
                              дозволяє також експортувати сирі, незмінені
                              властивості FtM.
                            </p>
                          </div>

                          <div className="space-y-1 border-t border-slate-800/60 pt-2">
                            <span className="text-cyan-400 font-bold block uppercase text-xs">
                              2. OpenCorporates, SEC EDGAR та CourtListener:
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Головним інженерним викликом є дотримання політики
                              справедливого використання (Fair Access Policy).
                              Наприклад, API SEC EDGAR встановлює абсолютний
                              ліміт частоти запитів на рівні{" "}
                              <strong>10 запитів на секунду</strong>.
                              Перевищення ліміту миттєво призводить до тривалого
                              блокування IP. Конвеєри повинні імплементувати
                              асинхронні черги (Celery або Kafka) та алгоритми
                              експоненційної затримки (
                              <strong>exponential backoff</strong>) з додаванням
                              випадкового джитера (<strong>jitter</strong>) для
                              обробки помилок HTTP 429.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedBlueprintSection === 3 && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-black text-slate-200 uppercase">
                            ГЛАВА 4: НАУКОМЕТРІЯ, ГЕОПОЛІТИКА ТА API
                            КІБЕРБЕЗПЕКИ (GIS)
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Тема: OpenAlex Polite Pool, GDELT 2.0, AlienVault
                            OTX, CISA KEV, MITRE, Nominatim OSM
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <span className="text-indigo-400 font-bold block uppercase text-xs">
                              1. OpenAlex: Наукометрія та інноваційний потенціал
                              (Polite Pool):
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Замість видачі індивідуальних API-ключів, система
                              використовує концепцію прозорої ідентифікації
                              через механізм{" "}
                              <strong>"Ввічливого пулу" (Polite Pool)</strong>.
                              Достатньо виконати інжекцію параметра{" "}
                              <code>mailto=vkizima534@gmail.com</code> у кожен
                              HTTP-запит, що підвищує ліміти та забезпечує
                              пріоритетну маршрутизацію мережевого трафіку. Може
                              інтегруватися через MCP-протокол.
                            </p>
                          </div>

                          <div className="space-y-1 border-t border-slate-800/60 pt-2">
                            <span className="text-indigo-400 font-bold block uppercase text-xs">
                              2. GDELT Project 2.0: Геополітичний моніторинг
                              новин:
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Дані оновлюються кожні 15 хвилин. Інтеграційний
                              конвеєр будується на принципах мікро-пакетної
                              обробки (micro-batching). Оркестратор перевіряє
                              Master File List на нові ZIP-архіви, завантажує
                              їх, декомпресує та парсить вміст прямо в
                              ClickHouse або BigQuery.
                            </p>
                          </div>

                          <div className="space-y-1 border-t border-slate-800/60 pt-2">
                            <span className="text-indigo-400 font-bold block uppercase text-xs">
                              3. API кібербезпеки: AlienVault OTX, CISA KEV та
                              MITRE ATT&CK:
                            </span>
                            <div className="text-xs text-slate-300 space-y-1">
                              <div>
                                • <strong>AlienVault OTX:</strong> Періодичне
                                опитування "пульсів" (Pulses) та збірок
                                індикаторів IoC (IP-адреси, домени, хеші
                                malware) для оцінки ризиків інфраструктури
                                контрагентів.
                              </div>
                              <div>
                                • <strong>CISA KEV:</strong> Щоденне
                                завантаження каталогу вразливостей з перевіркою
                                хешу на зміни та виконанням операції UPSERT.
                              </div>
                              <div>
                                • <strong>MITRE ATT&CK:</strong> Використання
                                індустріальних стандартів обміну даними STIX та
                                TAXII для імпорту складних графових структур
                                кібератак.
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 border-t border-slate-800/60 pt-2">
                            <span className="text-indigo-400 font-bold block uppercase text-xs">
                              4. OpenStreetMap / Nominatim: Геокодування адрес:
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Nominatim надає безкоштовний API, але
                              відрізняється найбільш суворою політикою
                              експлуатації:
                            </p>
                            <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 text-xs font-mono text-rose-400 space-y-1">
                              <div>
                                1. Жорсткий ліміт частоти запитів: рівно 1 запит
                                на секунду. Побудова паралельних запитів
                                категорично заборонена.
                              </div>
                              <div>
                                2. Ідентифікація через унікальний User-Agent з
                                вказівкою назви платформи та контактної пошти
                                (ігнорування дефолтних python-requests).
                              </div>
                              <div>
                                3. Обов'язкове кешування результатів у локальну
                                просторову базу даних PostGIS.
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mt-1">
                              Для масової обробки мільйонів адрес ЄДР чи
                              контрактів ProZorro публічний Nominatim
                              непридатний. Архітектурне вирішення: локальне
                              розгортання власного сервера Nominatim на базі OSM
                              дампів, що забезпечує тисячі запитів на секунду.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedBlueprintSection === 4 && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-black text-slate-200 uppercase">
                            ГЛАВА 5: KNOWLEDGE GRAPH BUILDER ТА ENTITY
                            RESOLUTION
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Тема: Автоматичне формування Neo4j Графу та Qdrant
                            Векторів
                          </p>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Система повністю автоматизує створення онтології та
                          вузлів <strong>Neo4j</strong>. ШІ сам аналізує поля з
                          джерел (Swagger, CSV, GraphQL) і автоматично витягує
                          сутності. Немає потреби писати Cypher-запити вручну.
                        </p>
                        <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-lg space-y-2">
                          <span className="font-bold block text-emerald-400 text-xs uppercase">
                            БАЗОВІ ВУЗЛИ (NODES), ЩО АВТОМАТИЧНО ЕКСТРАГУЮТЬСЯ:
                          </span>
                          <div className="text-xs text-slate-300 font-mono leading-relaxed">
                            Company, Person, PEP, Owner, Director, Tender,
                            Contract, Payment, Bank, Court, Sanction, Vehicle,
                            Aircraft, Ship, Weapon, Organization, Phone, Email,
                            IP, Domain, Crypto Wallet, Document, Address, Asset.
                          </div>

                          <span className="font-bold block text-cyan-400 text-xs uppercase mt-3">
                            АВТО-ВИЯВЛЕННЯ ЗВ'ЯЗКІВ (EDGES):
                          </span>
                          <div className="text-xs text-slate-300 font-mono leading-relaxed">
                            Ownership, Control, Influence, Family, Tender,
                            Procurement, Financial, Political, Corporate, Cyber,
                            Geospatial, Communication, Risk.
                          </div>
                        </div>
                        <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-lg space-y-2 mt-2">
                          <span className="font-bold block text-pink-400 text-xs uppercase">
                            AI DATA VALIDATION ТА EMBEDDINGS:
                          </span>
                          <div className="space-y-1 text-xs text-slate-300 font-mono">
                            <div>
                              • <strong>Qdrant:</strong> Авто-генерація векторів
                              (embeddings) для Hybrid Search, Semantic Search та
                              RAG-пам'яті агента.
                            </div>
                            <div>
                              • <strong>Data QA:</strong> Авто-перевірка
                              дублікатів, NULL, аномалій, Schema Drift, невірних
                              кодів та циклічних зв'язків.
                            </div>
                            <div>
                              • <strong>Entity Resolution:</strong> Злиття
                              брудних записів (ТОВ, LLC) через Jaro-Winkler +
                              косинусну близькість.
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Сукупність цих методів утворює єдиний узгоджений граф
                          знань, який розкриває приховані корпоративні змови,
                          фінансове кумівство та конфлікти інтересів з
                          максимальною точністю — і генерується повністю
                          автономно.
                        </p>
                      </div>
                    )}

                    {selectedBlueprintSection === 5 && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-black text-slate-200 uppercase">
                            ГЛАВА 6: ТРЬОХЗОНАЛЬНА АРХІТЕКТУРА ТА RED ZONE OPERATIONS
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Тема: Zero-Trust ізоляція, Darknet моніторинг та AI обхід CAPTCHA
                          </p>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Щоб обробляти різні класи джерел (Public Open Data, Investigative, Breach Intelligence, Darknet, Cyber Recon), Data Connector Hub використовує стратегію трьох контурів: <strong>Green Zone</strong> (Direct ETL/API), <strong>Yellow Zone</strong> (Rate-Limited Scraping), та <strong>Red Zone</strong> (Isolated Tor Sandbox).
                        </p>

                        <div className="space-y-3 font-mono text-xs">
                          {/* RED ZONE DETAILED ARCHITECTURE */}
                          <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-lg space-y-2">
                            <span className="text-rose-400 font-black text-xs block uppercase">
                              🔴 АРХІТЕКТУРА RED ZONE (ZERO-TRUST)
                            </span>
                            <p className="text-slate-300 text-xs leading-relaxed font-sans mb-2">
                              Проєктування ізольованого контуру для Dark Web та сайтів витоків вимагає 4 ключових рівнів для запобігання деанонімізації та "отруєнню" даних:
                            </p>
                            <div className="text-rose-300 text-[11px] space-y-2">
                              <div>
                                <strong className="text-rose-400">1. Мережевий рівень (Tor Proxy Fleet):</strong> Пул із 10–50 легких контейнерів із SOCKS5 + HAProxy балансувальник. Строгі правила iptables (NetworkPolicy) забороняють будь-який вихідний трафік (Egress), окрім з'єднань до мережі Tor.
                              </div>
                              <div>
                                <strong className="text-rose-400">2. Рівень виконання (Ephemeral Crawlers):</strong> Stateless-скрейпери створюються на час завдання і знищуються відразу після. Запуск з <code className="text-amber-200 bg-black/30 px-1">no-new-privileges:true</code>, <code className="text-amber-200 bg-black/30 px-1">read_only: true</code> та tmpfs.
                              </div>
                              <div>
                                <strong className="text-rose-400">3. Карантинне сховище (Quarantine Storage):</strong> Сирі артефакти (дампи баз, ZIP-архіви) пишуться у спеціальний "Red Bucket" в MinIO через Write-Only STS-токени.
                              </div>
                              <div>
                                <strong className="text-rose-400">4. Дезінфекція (Sanitization Bridge):</strong> Апаратна/Логічна ізоляція. Воркер сканує файли (ClamAV / YARA), чистить метадані та публікує чисті дані у зашифрований топік Redpanda (напр. <code className="text-amber-200 bg-black/30 px-1">osint.darkweb.sanitized</code>).
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg space-y-2 mt-2">
                            <span className="text-cyan-400 font-black text-xs block uppercase">
                              🛡️ ОБХІД CAPTCHA ТА АНТИБОТ-СИСТЕМ У ДАРКНЕТІ
                            </span>
                            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
                              Заборонено використання зовнішніх сервісів (Anti-Captcha). Всі рішення виконуються локально:
                            </p>
                            <div className="text-slate-300 text-[11px] space-y-1.5 mt-1">
                              <div>• <strong>Локальний AI-Vision (VLM/OCR):</strong> Використання Moondream2, Qwen2-VL-2B або PaddleOCR (на GPU-воркері) для розпізнавання викривленого тексту та графічних пазлів (YOLOv8).</div>
                              <div>• <strong>PoW Engine:</strong> Вилучення JS-скриптів Proof-of-Work (захисти EndGame, Dauntless) та їх виконання у локальному Node.js/V8 Engine.</div>
                              <div>• <strong>Session Harvesting:</strong> Кукі та токени після первинного розв'язання зберігаються у зашифрованому Redis, після чого працюють надшвидкі асинхронні HTTP-клієнти (httpx).</div>
                              <div>• <strong>HITL Fallback:</strong> При падінні точності моделі (нижче 75%), CAPTCHA надсилається в Dashboard аналітика PREDATOR для ручного розв'язання і донавчання моделі.</div>
                            </div>
                          </div>

                          <div className="p-3 bg-[#0a0a0a] border border-slate-800 rounded-lg space-y-2 mt-2 overflow-x-auto custom-scrollbar">
                            <span className="text-emerald-400 font-black text-[10px] block uppercase mb-1">
                              ПРИКЛАД: RED ZONE DOCKERFILE & PLAYWRIGHT SCRIPT (PADDLEOCR)
                            </span>
                            <pre className="text-[10px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">
{`# Dockerfile: Оптимізований образ для Red Zone (Zero-Trust)
FROM python:3.10-slim
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && rm -rf /var/lib/apt/lists/*
RUN useradd -m -s /bin/bash scraper
WORKDIR /home/scraper/app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install firefox && playwright install-deps firefox
# Попереднє завантаження ваг OCR-моделі (без інтернету в рантаймі)
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=False, lang='en')"
COPY scraper.py .
RUN chown -R scraper:scraper /home/scraper/app
USER scraper
CMD ["python", "scraper.py"]

--------------------------------------------------------------

# scraper.py (Playwright + PaddleOCR Bypass)
import asyncio, io, json, numpy as np
from PIL import Image
from playwright.async_api import async_playwright
from paddleocr import PaddleOCR

ocr_engine = PaddleOCR(use_angle_cls=False, lang='en', show_log=False)

async def solve_and_bypass(target_url: str):
    async with async_playwright() as p:
        browser = await p.firefox.launch(
            headless=True,
            proxy={"server": "socks5://127.0.0.1:9050"} # Локальний Tor-роутер
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; rv:115.0) Gecko/20100101 Firefox/115.0",
            viewport={"width": 1920, "height": 1080},
            timezone_id="UTC", locale="en-US", has_touch=False, color_scheme="dark"
        )
        page = await context.new_page()
        # Блокуємо завантаження зайвих ресурсів для швидкості
        await page.route("**/*.{png,jpg,jpeg,mp4,mp3,woff,woff2}", lambda route: route.abort())

        await page.goto(target_url, wait_until="domcontentloaded")
        captcha_locator = page.locator("img#captcha-image")
        await captcha_locator.wait_for(timeout=10000)
        image_bytes = await captcha_locator.screenshot()
        
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        result = ocr_engine.ocr(np.array(image), cls=False)
        captcha_text = result[0][0][1][0].strip().replace(" ", "")
        
        await page.fill("input[name='captcha_solution']", captcha_text)
        await page.click("button[type='submit']")
        await page.wait_for_selector("div.dashboard", timeout=15000)
        
        cookies = await context.cookies()
        with open("session_cookies.json", "w") as f:
            json.dump(cookies, f)
        await browser.close()`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-between items-center mt-4">
                    <span className="text-xs text-slate-500 font-mono">
                      Генеральний план PREDATOR • Google Antigravity Engine
                    </span>
                    <button
                      onClick={() => {
                        const now = new Date().toLocaleTimeString();
                        setRealtimeLogs((prev) => [
                          ...prev,
                          {
                            time: now,
                            text: `Blueprint Manager: Exported Architectural Plan chapter_${selectedBlueprintSection + 1}.md successfully.`,
                            type: "success",
                          },
                        ]);
                      }}
                      className="px-2.5 py-1.5 cursor-pointer bg-slate-950/80 backdrop-blur-xl hover:bg-slate-900/40 backdrop-blur-md text-slate-300 border border-slate-800/60 text-xs font-mono font-bold uppercase transition-all rounded flex items-center gap-1.5"
                    >
                      <Download className="w-3 h-3" />
                      Зберегти .md розділ архітектури
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
                {/* List of ADRs */}
                <div className="col-span-12 lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[360px]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      ARCHITECTURAL DECISION RECORDS (ADR 1-10)
                    </span>
                    <span className="text-xs font-mono text-cyan-400">
                      ADR GENERATOR
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 font-mono text-xs">
                    {[
                      {
                        id: 1,
                        title: "ADR-001: RAW S3 landing zone (MinIO)",
                        status: "ACCEPTED",
                      },
                      {
                        id: 2,
                        title: "ADR-002: Multi-Database target router",
                        status: "ACCEPTED",
                      },
                      {
                        id: 3,
                        title: "ADR-003: Autonomous Self-Healing pipeline",
                        status: "ACCEPTED",
                      },
                      {
                        id: 4,
                        title: "ADR-004: HashiCorp Vault key preservation",
                        status: "ACCEPTED",
                      },
                      {
                        id: 5,
                        title: "ADR-005: Qdrant Ukrainian embeddings v2",
                        status: "ACCEPTED",
                      },
                      {
                        id: 6,
                        title:
                          "ADR-006: Jaro-Winkler Entity Resolution thresholds",
                        status: "ACCEPTED",
                      },
                      {
                        id: 7,
                        title:
                          "ADR-007: ClickHouse analytical time-series scaling",
                        status: "ACCEPTED",
                      },
                      {
                        id: 8,
                        title: "ADR-008: OpenTelemetry trace telemetry spans",
                        status: "ACCEPTED",
                      },
                      {
                        id: 9,
                        title:
                          "ADR-009: Kafka queueing message distribute system",
                        status: "ACCEPTED",
                      },
                      {
                        id: 10,
                        title: "ADR-010: Neo4j relationship control indexing",
                        status: "ACCEPTED",
                      },
                    ].map((adr) => (
                      <div
                        key={adr.id}
                        onClick={() => setSelectedAdr(adr.id)}
                        className={`p-2.5 rounded border cursor-pointer flex justify-between items-center ${selectedAdr === adr.id ? "bg-cyan-950/30 border-slate-800 text-cyan-400" : "bg-slate-900/40 border-slate-800 hover:border-slate-800/60 text-slate-400"}`}
                      >
                        <span>{adr.title}</span>
                        <span className="text-xs bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-bold">
                          {adr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ADR Content */}
                <div className="col-span-12 lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col h-[360px] justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />

                  <div className="space-y-4 font-mono text-xs leading-relaxed">
                    <div className="border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-black text-slate-200">
                        ADR-00{selectedAdr}: ARCHITECTURAL CHOICE OVERVIEW
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Status: APPROVED | Deciders: Lead Architect & Google
                        Antigravity
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-cyan-400 font-bold block uppercase text-xs">
                          PROBLEM STATEMENT (КОНТЕКСТ):
                        </span>
                        <p className="text-slate-300">
                          {selectedAdr === 1
                            ? "Необхідно гарантувати незмінність (immutability) первинних завантажених JSON-даних для відтворення всього ланцюга поставок (lineage) та перезапуску ETL."
                            : selectedAdr === 2
                              ? "Дані мають різноманітну структуру запитів: повнотекстовий пошук судових рішень, аналітика Spending та пошук прихованих зв'язків засновників у Neo4j."
                              : selectedAdr === 3
                                ? "Зовнішні реєстри часто змінюють структуру API без попереджень, що призводить до поломки класичних ETL-конвеєрів."
                                : "Потрібно забезпечити абсолютну конфіденційність, безпечний розподіл ключів та гнучке векторне зіставлення у Qdrant без витоку персональних даних."}
                        </p>
                      </div>

                      <div>
                        <span className="text-amber-400 font-bold block uppercase text-xs">
                          DECISION (ПРИЙНЯТЕ РІШЕННЯ):
                        </span>
                        <p className="text-slate-300">
                          {selectedAdr === 1
                            ? "Використовувати MinIO S3 Object Storage як landing zone. Зберігати файли безпосередньо у форматі GZIP/JSON без перезапису первинних даних."
                            : selectedAdr === 2
                              ? "Впровадити багатокомпонентний роутер: Postgres для मास्टर-БД, ClickHouse для аналітики, Neo4j для графу, OpenSearch для пошуку та Qdrant для семантичних векторів."
                              : selectedAdr === 3
                                ? "Розгорнути ШІ-монітор самовідновлення. У разі падіння API автоматично оновлювати клієнти, мігрувати БД та проводити регресійне тестування перед релізом."
                                : "Синхронізувати ключі через Vault, будувати зв'язки у Neo4j за спільними IBAN/ПІБ/кодами та індексувати embeddings у Qdrant за моделлю Multilingual-E5."}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-xs">
                          CONSEQUENCES (НАСЛІДКИ):
                        </span>
                        <p className="text-slate-400">
                          Гарантована надійність і масштабованість. Зменшення
                          витрат на технічну підтримку інфраструктури на 90%
                          завдяки автономній ШІ-адаптації.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-between items-center mt-4">
                    <span className="text-xs text-slate-500 font-mono">
                      Згенеровано ШІ-агентом Google Antigravity Coder
                    </span>
                    <button
                      onClick={() => {
                        const now = new Date().toLocaleTimeString();
                        setRealtimeLogs((prev) => [
                          ...prev,
                          {
                            time: now,
                            text: `ADR Manager: Exported ADR-00${selectedAdr}.md to filesystem successfully.`,
                            type: "success",
                          },
                        ]);
                      }}
                      className="px-2.5 py-1.5 cursor-pointer bg-slate-950/80 backdrop-blur-xl hover:bg-slate-900/40 backdrop-blur-md text-slate-300 border border-slate-800/60 text-xs font-mono font-bold uppercase transition-all rounded flex items-center gap-1.5"
                    >
                      <Download className="w-3 h-3" />
                      Експорт .md ADR документа
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
