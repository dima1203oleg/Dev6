// core/registry/canonical-source-registry.ts
// SINGLE SOURCE OF TRUTH FOR ALL PREDATOR DATA SOURCES (§5, §6, §7)

export type AccessLevel =
  | 'FREE_AUTO'
  | 'FREE_PUBLIC_DATASET'
  | 'FREE_API'
  | 'FREE_API_KEY'
  | 'FREE_WITH_APPROVAL'
  | 'MANUAL'
  | 'RESTRICTED'
  | 'PAID'
  | 'UNVERIFIED';

export type CertificationStatus =
  | 'DISCOVERED'
  | 'VERIFIED'
  | 'IMPLEMENTED'
  | 'LIVE'
  | 'CERTIFIED'
  | 'DEGRADED'
  | 'OFFLINE'
  | 'SCHEMA_DRIFT'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'NO_DATA'
  | 'NOT_SUPPORTED'
  | 'REQUIRES_VERIFICATION'
  | 'DISABLED';

export type SourceCategory =
  | 'corporate'
  | 'legal'
  | 'financial'
  | 'compliance'
  | 'sanctions'
  | 'real_estate'
  | 'procurement'
  | 'maritime_aviation'
  | 'cyber_osint'
  | 'licenses'
  | 'pep';

export interface CanonicalSourceUnit {
  source_id: string;
  name: string;
  country: string;
  category: SourceCategory;
  owner: string;
  official_url: string;
  endpoint_or_resource: string;
  source_type: 'API' | 'DATASET' | 'DUMP' | 'SEARCH' | 'HISTORY' | 'ARCHIVE';
  access_level: AccessLevel;
  automation_level: 'FULL' | 'SEMI' | 'MANUAL';
  cost: 'FREE' | 'PAID';
  license: string;
  legal_status: 'VERIFIED_PUBLIC' | 'OPEN_GOV' | 'RESTRICTED' | 'UNVERIFIED';
  format: 'JSON' | 'CSV' | 'XML' | 'SPARQL' | 'HTML' | 'API';
  encoding: string;
  update_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'irregular';
  schema_version: string;
  capabilities: ('person' | 'company' | 'fop' | 'address' | 'vehicle' | 'vessel' | 'aircraft' | 'domain' | 'ip' | 'tender' | 'court_case')[];
  supported_identifiers: ('rnokpp' | 'edrpou' | 'name' | 'vin' | 'imo' | 'domain' | 'ip' | 'case_number' | 'license_id')[];
  connector_id: string;
  parser_id: string;
  normalizer_id: string;
  status: CertificationStatus;
  certified: boolean;
  last_probe: string | null;
  last_success: string | null;
  last_failure: string | null;
  last_schema_change: string | null;
  freshness: 'FRESH' | 'STALE' | 'VERY_STALE' | 'UNKNOWN';
  quality_score: number; // 0-100
}

class CanonicalSourceRegistryService {
  private sources: Map<string, CanonicalSourceUnit> = new Map();

  constructor() {
    this.initializeDefaultCatalog();
  }

  private initializeDefaultCatalog() {
    // Initial 20 Core Sources registered as DISCOVERED until live probe verifies them
    const initialSources: Partial<CanonicalSourceUnit>[] = [
      {
        source_id: 'ua.edr',
        name: 'Єдиний державний реєстр (ЄДР)',
        country: 'UA',
        category: 'corporate',
        owner: "Міністерство юстиції України",
        official_url: 'https://usr.minjust.gov.ua',
        endpoint_or_resource: 'https://usr.minjust.gov.ua/api/1.0/',
        source_type: 'API',
        access_level: 'FREE_API',
        capabilities: ['person', 'company', 'fop'],
        supported_identifiers: ['rnokpp', 'edrpou', 'name'],
        connector_id: 'EDRConnector',
        parser_id: 'EDRParser',
        normalizer_id: 'EDRNormalizer'
      },
      {
        source_id: 'ua.courts',
        name: 'Єдиний державний реєстр судових рішень (ЄДРСР)',
        country: 'UA',
        category: 'legal',
        owner: 'Державна судова адміністрація України',
        official_url: 'https://reyestr.court.gov.ua',
        endpoint_or_resource: 'https://reyestr.court.gov.ua/api/',
        source_type: 'API',
        access_level: 'FREE_API',
        capabilities: ['person', 'company', 'court_case'],
        supported_identifiers: ['name', 'edrpou', 'rnokpp', 'case_number'],
        connector_id: 'CourtsConnector',
        parser_id: 'CourtsParser',
        normalizer_id: 'CourtsNormalizer'
      },
      {
        source_id: 'ua.tax',
        name: 'ДПС - Податковий борг',
        country: 'UA',
        category: 'financial',
        owner: 'Державна податкова служба України',
        official_url: 'https://tax.gov.ua',
        endpoint_or_resource: 'https://tax.gov.ua/data/material/',
        source_type: 'DATASET',
        access_level: 'FREE_PUBLIC_DATASET',
        capabilities: ['company', 'fop'],
        supported_identifiers: ['edrpou', 'rnokpp'],
        connector_id: 'TaxConnector',
        parser_id: 'TaxParser',
        normalizer_id: 'TaxNormalizer'
      },
      {
        source_id: 'ua.sanctions',
        name: 'Державний реєстр санкцій РНБО',
        country: 'UA',
        category: 'sanctions',
        owner: 'Рада національної безпеки і оборони України',
        official_url: 'https://drs.rnbo.gov.ua',
        endpoint_or_resource: 'https://sn.nacp.gov.ua/api/',
        source_type: 'API',
        access_level: 'FREE_API',
        capabilities: ['person', 'company'],
        supported_identifiers: ['name', 'edrpou', 'rnokpp'],
        connector_id: 'SanctionsConnector',
        parser_id: 'SanctionsParser',
        normalizer_id: 'SanctionsNormalizer'
      },
      {
        source_id: 'ua.debtors',
        name: 'Єдиний реєстр боржників (ЄРБ)',
        country: 'UA',
        category: 'legal',
        owner: "Міністерство юстиції України",
        official_url: 'https://erb.minjust.gov.ua',
        endpoint_or_resource: 'https://erb.minjust.gov.ua/api/',
        source_type: 'API',
        access_level: 'FREE_API',
        capabilities: ['person', 'company', 'fop'],
        supported_identifiers: ['edrpou', 'rnokpp', 'name'],
        connector_id: 'DebtorsConnector',
        parser_id: 'DebtorsParser',
        normalizer_id: 'DebtorsNormalizer'
      },
      {
        source_id: 'ua.bankruptcy',
        name: 'Реєстр справ про банкрутство',
        country: 'UA',
        category: 'legal',
        owner: "Міністерство юстиції України",
        official_url: 'https://minjust.gov.ua',
        endpoint_or_resource: 'https://minjust.gov.ua/api/bankruptcy',
        source_type: 'API',
        access_level: 'FREE_API',
        capabilities: ['company', 'fop'],
        supported_identifiers: ['edrpou', 'name'],
        connector_id: 'BankruptcyConnector',
        parser_id: 'BankruptcyParser',
        normalizer_id: 'BankruptcyNormalizer'
      },
      {
        source_id: 'ua.ckan_data_gov',
        name: 'Єдиний державний вебпортал відкритих даних (data.gov.ua)',
        country: 'UA',
        category: 'corporate',
        owner: 'Мінцифри / ДП ДІЯ',
        official_url: 'https://data.gov.ua',
        endpoint_or_resource: 'https://data.gov.ua/api/3/action/',
        source_type: 'API',
        access_level: 'FREE_AUTO',
        capabilities: ['person', 'company', 'fop', 'tender', 'vehicle'],
        supported_identifiers: ['edrpou', 'rnokpp', 'name'],
        connector_id: 'CKANConnector',
        parser_id: 'CKANParser',
        normalizer_id: 'CKANNormalizer'
      }
    ];

    for (const s of initialSources) {
      const fullUnit: CanonicalSourceUnit = {
        source_id: s.source_id!,
        name: s.name!,
        country: s.country || 'UA',
        category: s.category || 'corporate',
        owner: s.owner || 'Government',
        official_url: s.official_url || '',
        endpoint_or_resource: s.endpoint_or_resource || '',
        source_type: s.source_type || 'API',
        access_level: s.access_level || 'FREE_API',
        automation_level: 'FULL',
        cost: 'FREE',
        license: 'Open Data License',
        legal_status: 'VERIFIED_PUBLIC',
        format: 'JSON',
        encoding: 'UTF-8',
        update_frequency: 'daily',
        schema_version: '1.0',
        capabilities: s.capabilities || [],
        supported_identifiers: s.supported_identifiers || [],
        connector_id: s.connector_id || '',
        parser_id: s.parser_id || '',
        normalizer_id: s.normalizer_id || '',
        status: 'DISCOVERED', // Real Probe determines LIVE status!
        certified: false,
        last_probe: null,
        last_success: null,
        last_failure: null,
        last_schema_change: null,
        freshness: 'UNKNOWN',
        quality_score: 0
      };
      this.sources.set(fullUnit.source_id, fullUnit);
    }
  }

  public getAll(): CanonicalSourceUnit[] {
    return Array.from(this.sources.values());
  }

  public getById(sourceId: string): CanonicalSourceUnit | undefined {
    return this.sources.get(sourceId);
  }

  public updateProbeResult(sourceId: string, success: boolean, status: CertificationStatus, qualityScore: number = 100) {
    const source = this.sources.get(sourceId);
    if (!source) return;

    const now = new Date().toISOString();
    source.last_probe = now;
    source.status = status;
    source.quality_score = qualityScore;

    if (success) {
      source.last_success = now;
      source.freshness = 'FRESH';
      if (status === 'LIVE' || status === 'CERTIFIED') {
        source.certified = (status === 'CERTIFIED');
      }
    } else {
      source.last_failure = now;
      source.certified = false;
    }

    this.sources.set(sourceId, source);
  }

  public getSummaryStats() {
    const all = this.getAll();
    return {
      totalCount: all.length,
      certifiedCount: all.filter(s => s.certified).length,
      liveCount: all.filter(s => s.status === 'LIVE').length,
      degradedCount: all.filter(s => s.status === 'DEGRADED').length,
      offlineCount: all.filter(s => s.status === 'OFFLINE').length,
      discoveredCount: all.filter(s => s.status === 'DISCOVERED').length,
      paidCount: 0,
      mockCount: 0
    };
  }
}

export const canonicalSourceRegistry = new CanonicalSourceRegistryService();
