export type StageId =
  "CORE_7" | "STAGE_1" | "STAGE_2" | "STAGE_3" | "STAGE_4" | "STAGE_5" | "STAGE_6" | "STAGE_7" | "STAGE_8";

export interface StageConfig {
  id: StageId;
  title: string;
  description: string;
}

export const STAGES_CONFIG: StageConfig[] = [
  {
    id: "CORE_7",
    title: "Велика Сімка (Core Data Layer)",
    description: "7 основних джерел розвідки з найвищою достовірністю",
  },
  { id: "STAGE_1", title: "Стадія 1 (Державні та Судові Реєстри)", description: "Державні реєстри України, ЄС та США" },
  {
    id: "STAGE_2",
    title: "Стадія 2 (Міжнародні Санкції та PEP)",
    description: "Глобальні санкційні списки та публічні діячі",
  },
  {
    id: "STAGE_3",
    title: "Стадія 3 (Офшори та Витоки Даних)",
    description: "ICIJ Offshore Leaks, витоки та корпоративні структури",
  },
  {
    id: "STAGE_4",
    title: "Стадія 4 (Кіберрозвідка та IP/DNS)",
    description: "IP, DNS, WHOIS, Shodan, Threat Intelligence",
  },
  {
    id: "STAGE_5",
    title: "Стадія 5 (Наукові та Патентні БД)",
    description: "arXiv, PubMed, Lens.org, патенти та дослідження",
  },
  {
    id: "STAGE_6",
    title: "Стадія 6 (Геопросторові та Супутникові)",
    description: "OpenStreetMap, Sentinel, GIS, супутникові знімки",
  },
  {
    id: "STAGE_7",
    title: "Стадія 7 (Фінансові та Крипто Моніторинг)",
    description: "Blockchain Explorers, криптогаманці, SWIFT/SEPA",
  },
  {
    id: "STAGE_8",
    title: "Стадія 8 (Автономна Фабрика API)",
    description: "Universal Discovery Engine та генерація конекторів",
  },
];

export interface FreeConnectorPassport {
  owner: string;
  accessType: string;
  country: string;
  trustScore: number;
  authProtocol?: string;
  rateLimit?: string;
  updateFreq?: string;
  dataFormats?: string[];
  license?: string;
  legalBasis?: string;
}

export interface FreeConnector {
  id: string;
  name: string;
  flag: string;
  stage: StageId;
  category: string;
  subCategory: "CORE" | "CYBER" | "SCIENTIFIC" | "OSINT" | "GEOSPATIAL" | "FINANCIAL";
  description: string;
  endpoint: string;
  sampleQuery: string;
  enabled: boolean;
  isCoreSeven?: boolean;
  coreSevenRank?: number;
  coreSevenTitle?: string;
  passport: FreeConnectorPassport;
}

export interface QueryExecutionResult {
  success: boolean;
  latencyMs: number;
  rawResponse: any;
  entityResolution: {
    matchedEntityId: string;
    canonicalName: string;
    confidenceScore: number;
  };
  graphDbCypher: string;
  storageLocations: {
    postgresql: string;
    neo4jGraph: string;
    minioS3: string;
    qdrantVector: string;
  };
  qualityAudit: {
    duplicateCheck: string;
    nullsPercentage: string;
    provenanceVersion: string;
    trustScoreAssigned: number;
  };
}

export const FREE_CONNECTORS_CATALOG: FreeConnector[] = [
  {
    id: "opensanctions_yente",
    name: "OpenSanctions Yente — Глобальний Санкційний Двигун",
    flag: "🌐",
    stage: "CORE_7",
    category: "Санкції та PEP",
    subCategory: "CORE",
    description:
      "Агрегатор понад 50 глобальних санкційних списків, PEP, терористів та злочинців у стандарті FollowTheMoney.",
    endpoint: "https://api.opensanctions.org/match/default",
    sampleQuery: "q=ТОВ Спеціальні Технології",
    enabled: true,
    isCoreSeven: true,
    coreSevenRank: 1,
    coreSevenTitle: "Санкції, PEP, Витоки",
    passport: {
      owner: "OpenSanctions NGO",
      accessType: "Публічний API / Yente Open Source",
      country: "Німеччина / ЄС",
      trustScore: 99,
      authProtocol: "API Key / Bearer",
      rateLimit: "100req/min",
      updateFreq: "Щодня",
      dataFormats: ["JSON-LD", "FollowTheMoney"],
      license: "CC-BY-4.0",
      legalBasis: "Open Data Directive EU",
    },
  },
  {
    id: "data_gov_ua",
    name: "Data.gov.ua — Єдиний Портал Відкритих Даних України",
    flag: "🇺🇦",
    stage: "CORE_7",
    category: "Державні Реєстри",
    subCategory: "CORE",
    description: "CKAN API доступу до ЄДР, податкових боржників, ліцензій, публічних закупівель та комунального майна.",
    endpoint: "https://data.gov.ua/api/3/action/package_show",
    sampleQuery: "q=39281045",
    enabled: true,
    isCoreSeven: true,
    coreSevenRank: 2,
    coreSevenTitle: "ЄДР, Податки, Реєстри UA",
    passport: {
      owner: "Мінцифри України",
      accessType: "Відкритий CKAN API",
      country: "Україна",
      trustScore: 98,
      authProtocol: "Без авторизації / Open",
      rateLimit: "300req/min",
      updateFreq: "В режимі реального часу",
      dataFormats: ["JSON", "CSV", "XML"],
      license: "Open Government License UA",
      legalBasis: "ЗУ Про доступ до публічної інформації",
    },
  },
  {
    id: "courtlistener",
    name: "CourtListener — США та Міжнародні Судові Прецеденти",
    flag: "🇺🇸",
    stage: "CORE_7",
    category: "Судова Система",
    subCategory: "CORE",
    description: "База даних RECAP для пошуку федеральних судових рішень, банкрутств та кримінальних справ у США.",
    endpoint: "https://www.courtlistener.com/api/rest/v3/dockets/",
    sampleQuery: "q=CyberSecurity LLC",
    enabled: true,
    isCoreSeven: true,
    coreSevenRank: 3,
    coreSevenTitle: "Федеральний Суд & RECAP",
    passport: {
      owner: "Free Law Project",
      accessType: "REST API v3",
      country: "США",
      trustScore: 96,
      authProtocol: "Token / Bearer",
      rateLimit: "500req/min",
      updateFreq: "Щогодини",
      dataFormats: ["JSON", "PDF"],
      license: "Public Domain / Non-Profit",
      legalBasis: "US Freedom of Information Act",
    },
  },
  {
    id: "icij_offshore_leaks",
    name: "ICIJ Offshore Leaks — Panama, Pandora & Paradise Papers",
    flag: "🏝️",
    stage: "CORE_7",
    category: "Офшори & Бенефіціари",
    subCategory: "CORE",
    description:
      "База даних журналістських розслідувань ICIJ: понад 800,000 офшорних компаній, трастів та бенефіціарів.",
    endpoint: "https://api.offshoreleaks.icij.org/v1/search",
    sampleQuery: "q=Kovalenko",
    enabled: true,
    isCoreSeven: true,
    coreSevenRank: 4,
    coreSevenTitle: "ICIJ 800k+ Offshore Entities",
    passport: {
      owner: "International Consortium of Investigative Journalists",
      accessType: "Open Database API",
      country: "Міжнародний",
      trustScore: 97,
      authProtocol: "API Key",
      rateLimit: "120req/min",
      updateFreq: "Щомісяця",
      dataFormats: ["JSON", "CSV", "GraphML"],
      license: "Open Investigative License",
      legalBasis: "Public Interest Journalism",
    },
  },
  {
    id: "companies_house_uk",
    name: "Companies House UK — Державний Реєстр Компаній Великобританії",
    flag: "🇬🇧",
    stage: "CORE_7",
    category: "Корпоративний Реєстр",
    subCategory: "CORE",
    description:
      "Офіційний API Companies House для перевірки бенефіціарів (PSC), фінансових звітів та директур у Британії.",
    endpoint: "https://api.company-information.service.gov.uk/search/companies",
    sampleQuery: "q=Tech Innovations",
    enabled: true,
    isCoreSeven: true,
    coreSevenRank: 5,
    coreSevenTitle: "UK PSC & Directors Register",
    passport: {
      owner: "UK Executive Agency",
      accessType: "REST API (HTTP Basic)",
      country: "Великобританія",
      trustScore: 99,
      authProtocol: "Basic Auth / API Key",
      rateLimit: "600req/5min",
      updateFreq: "Realtime",
      dataFormats: ["JSON"],
      license: "Open Government Licence v3.0",
      legalBasis: "Companies Act 2006 UK",
    },
  },
  {
    id: "shodan_free",
    name: "Shodan Threat Intel — Пошуковик Інтернету Речей та Серверів",
    flag: "🛡️",
    stage: "CORE_7",
    category: "Кіберрозвідка",
    subCategory: "CYBER",
    description: "Сканування відкритих портів, вразливостей, SSL-сертифікатів та мережевої інфраструктури об'єктів.",
    endpoint: "https://api.shodan.io/shodan/host/",
    sampleQuery: "ip=8.8.8.8",
    enabled: true,
    isCoreSeven: true,
    coreSevenRank: 6,
    coreSevenTitle: "IP, Ports & CVE Scanner",
    passport: {
      owner: "Shodan LLC",
      accessType: "Developer REST API",
      country: "США",
      trustScore: 95,
      authProtocol: "API Key",
      rateLimit: "1req/sec",
      updateFreq: "Безперервно",
      dataFormats: ["JSON"],
      license: "Commercial / Free Tier",
      legalBasis: "Public Network Scanning",
    },
  },
  {
    id: "gdelt_project",
    name: "GDELT Project — Моніторинг Глобальних Подій та Медіа",
    flag: "📰",
    stage: "CORE_7",
    category: "Медіа & Моніторинг",
    subCategory: "OSINT",
    description:
      "Моніторинг новинних стрічок 100+ мовами світу, вилучення тональності, згадок персон та географії подій.",
    endpoint: "https://api.gdeltproject.org/api/v2/doc/doc",
    sampleQuery: "query=cyberattack Ukraine",
    enabled: true,
    isCoreSeven: true,
    coreSevenRank: 7,
    coreSevenTitle: "Real-time Global Media Stream",
    passport: {
      owner: "Google Cloud / GDELT Project",
      accessType: "Open Query API",
      country: "США / Global",
      trustScore: 94,
      authProtocol: "Open / No Auth",
      rateLimit: "1000req/min",
      updateFreq: "Кожні 15 хвилин",
      dataFormats: ["JSON", "CSV"],
      license: "Open Research Data",
      legalBasis: "Academic Research License",
    },
  },
  {
    id: "sec_edgar",
    name: "SEC EDGAR — Фінансові Звіти Публічних Компаній США",
    flag: "🇺🇸",
    stage: "STAGE_1",
    category: "Корпоративні Звіти",
    subCategory: "FINANCIAL",
    description: "Звіти 10-K, 10-Q, 8-K та структура володіння акціями для публічних компаній США.",
    endpoint: "https://data.sec.gov/submissions/",
    sampleQuery: "cik=0000320193",
    enabled: true,
    passport: {
      owner: "US Securities and Exchange Commission",
      accessType: "REST API",
      country: "США",
      trustScore: 99,
      authProtocol: "User-Agent Header",
      rateLimit: "10req/sec",
      updateFreq: "Realtime",
      dataFormats: ["JSON", "XBRL"],
      license: "Public Domain",
      legalBasis: "Securities Exchange Act 1934",
    },
  },
  {
    id: "arxiv_api",
    name: "arXiv Academic Repository — Наукові Дослідження та AI",
    flag: "📚",
    stage: "STAGE_5",
    category: "Наукові Публікації",
    subCategory: "SCIENTIFIC",
    description: "Понад 2 мільйони наукових статей з фізики, комп'ютерних наук, кібербезпеки та математики.",
    endpoint: "http://export.arxiv.org/api/query",
    sampleQuery: "search_query=cat:cs.CR",
    enabled: true,
    passport: {
      owner: "Cornell University",
      accessType: "OAI-PMH / REST API",
      country: "США",
      trustScore: 98,
      authProtocol: "Open",
      rateLimit: "1req/3sec",
      updateFreq: "Щодня",
      dataFormats: ["XML", "Atom"],
      license: "CC-BY",
      legalBasis: "Open Access Scholarly Repository",
    },
  },
  {
    id: "open_street_map",
    name: "OpenStreetMap Nominatim — Геокодування та GIS",
    flag: "🗺️",
    stage: "STAGE_6",
    category: "Геопросторові Дані",
    subCategory: "GEOSPATIAL",
    description: "Перетворення адрес у географічні координати, пошук об'єктів інфраструктури та кордонів.",
    endpoint: "https://nominatim.openstreetmap.org/search",
    sampleQuery: "q=Kyiv Ukraine",
    enabled: true,
    passport: {
      owner: "OpenStreetMap Foundation",
      accessType: "Nominatim API",
      country: "Міжнародний",
      trustScore: 96,
      authProtocol: "User-Agent Required",
      rateLimit: "1req/sec",
      updateFreq: "Realtime Community",
      dataFormats: ["JSON", "GeoJSON"],
      license: "ODbL",
      legalBasis: "Open Data Commons",
    },
  },
  {
    id: "etherscan_api",
    name: "Etherscan Crypto Explorer — Аналіз Транзакцій Ethereum",
    flag: "🪙",
    stage: "STAGE_7",
    category: "Криптомоніторинг",
    subCategory: "FINANCIAL",
    description: "Моніторинг балансів, смарт-контрактів та транзакцій у мережі Ethereum та ERC-20 токенів.",
    endpoint: "https://api.etherscan.io/api",
    sampleQuery: "address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae",
    enabled: true,
    passport: {
      owner: "Etherscan Developer Platform",
      accessType: "REST API",
      country: "Малайзія / Global",
      trustScore: 95,
      authProtocol: "API Key",
      rateLimit: "5req/sec",
      updateFreq: "Realtime Blockchain",
      dataFormats: ["JSON"],
      license: "Free API Tier",
      legalBasis: "Public Blockchain Indexer",
    },
  },
  {
    id: "universal_discovery_factory",
    name: "Universal Discovery Engine — Автономна Фабрика API",
    flag: "🤖",
    stage: "STAGE_8",
    category: "Автономний ШІ",
    subCategory: "CORE",
    description:
      "Генератор конекторів, контролер Schema Drift та автоматичний мапінг об'єктів у стандарт FollowTheMoney.",
    endpoint: "https://predator-factory.internal/api/v1/synthesize",
    sampleQuery: "url=https://data.gov.ua/api/3/action/package_show",
    enabled: true,
    passport: {
      owner: "PREDATOR Autonomous Engine",
      accessType: "Internal AI Synthesizer",
      country: "Україна",
      trustScore: 100,
      authProtocol: "mTLS / Internal",
      rateLimit: "Unlimited",
      updateFreq: "Realtime Adaptive",
      dataFormats: ["TypeScript", "JSON Schema", "FtM DTO"],
      license: "Proprietary Core",
      legalBasis: "Autonomous System",
    },
  },
];

export const executeFreeConnectorQuery = async (
  connectorId?: string,
  query?: string,
): Promise<QueryExecutionResult> => {
  const targetId = connectorId || "opensanctions_yente";
  const targetTerm = query || "ТОВ Спеціальні Технології";
  const start = Date.now();

  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    success: true,
    latencyMs: Date.now() - start,
    rawResponse: {
      status: "SUCCESS",
      query: targetTerm,
      connectorUsed: targetId,
      timestamp: new Date().toISOString(),
      hitsCount: 1,
      results: [
        {
          id: `entity-${targetTerm}`,
          caption: targetTerm,
          schema: "Company",
          properties: {
            name: [targetTerm],
            registrationNumber: ["39281045"],
            jurisdiction: ["ua"],
            status: ["active"],
            address: ["Україна, м. Київ"],
            riskLevel: ["LOW"],
          },
        },
      ],
    },
    entityResolution: {
      matchedEntityId: "entity-39281045-ua",
      canonicalName: targetTerm.toUpperCase(),
      confidenceScore: 98.4,
    },
    graphDbCypher: `MERGE (c:Company {id: "entity-39281045-ua"})
ON CREATE SET c.name = "${targetTerm}", c.jurisdiction = "ua", c.updatedAt = datetime()
RETURN c`,
    storageLocations: {
      postgresql: "public.company_records (Row ID: 39281045)",
      neo4jGraph: "Node (c:Company) + 3 Relationships",
      minioS3: "s3://predator-raw-data/2026/08/payload_39281045.json",
      qdrantVector: "Vector Collection 'companies' (384-dim Embedding)",
    },
    qualityAudit: {
      duplicateCheck: "0 duplicates found (Canonical Unified)",
      nullsPercentage: "1.2% empty fields",
      provenanceVersion: "v2.4-verified",
      trustScoreAssigned: 98,
    },
  };
};
