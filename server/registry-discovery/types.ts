/**
 * Registry Discovery Platform (RDP)
 * Type Definitions
 */

// Catalog Types
export type CatalogType = 
  | 'CKAN'
  | 'SOCRATA'
  | 'ARCGIS_HUB'
  | 'OPENDATASOFT'
  | 'GITHUB'
  | 'FTP'
  | 'S3'
  | 'REST_API'
  | 'SOAP'
  | 'XML_FEED'
  | 'RSS'
  | 'HTML_CATALOG';

export interface CatalogConfig {
  id: string;
  name: string;
  type: CatalogType;
  baseUrl: string;
  apiKey?: string;
  authentication?: {
    type: 'NONE' | 'API_KEY' | 'BASIC' | 'OAUTH2' | 'BEARER';
    credentials?: any;
  };
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  enabled: boolean;
  lastDiscovery?: Date;
  totalDatasets?: number;
}

// CKAN Types
export interface CKANPackage {
  id: string;
  name: string;
  title: string;
  notes?: string;
  owner_org: string;
  author?: string;
  maintainer?: string;
  state: string;
  version?: string;
  license_id?: string;
  license_title?: string;
  license_url?: string;
  tags: CKANTag[];
  groups: CKANGroup[];
  resources: CKANResource[];
  metadata_created: string;
  metadata_modified: string;
  private: boolean;
  url?: string;
}

export interface CKANTag {
  display_name: string;
  id: string;
  name: string;
  state: string;
  vocabulary_id?: string;
}

export interface CKANGroup {
  display_name: string;
  description?: string;
  id: string;
  image_display_url?: string;
  name: string;
  state: string;
  title?: string;
}

export interface CKANResource {
  id: string;
  package_id: string;
  name: string;
  description?: string;
  url: string;
  format: string;
  mimetype?: string;
  mimetype_inner?: string;
  size?: number;
  created: string;
  last_modified: string;
  cache_last_updated?: string;
  hash?: string;
  datastore_active: boolean;
  url_type?: string;
  resource_type?: string;
  position?: number;
  revision_id?: string;
  state: string;
}

export interface CKANDataStoreRecord {
  _id: number;
  [key: string]: any;
}

export interface CKANDataStoreResponse {
  help: string;
  success: boolean;
  result: {
    resource_id: string;
    fields: Array<{
      id: string;
      type: string;
      info?: any;
    }>;
    records: CKANDataStoreRecord[];
    total: number;
    _form: any;
  };
}

// Dataset Types
export type DatasetFormat = 
  | 'CSV'
  | 'JSON'
  | 'XML'
  | 'ZIP'
  | 'GZIP'
  | 'RAR'
  | '7Z'
  | 'XLS'
  | 'XLSX'
  | 'ODS'
  | 'PARQUET'
  | 'DATASTORE'
  | 'API'
  | 'DUMP'
  | 'STREAMING'
  | 'UNKNOWN';

export interface Dataset {
  id: string;
  catalogId: string;
  packageId: string;
  name: string;
  title: string;
  description?: string;
  format: DatasetFormat;
  url: string;
  size?: number;
  created: Date;
  modified: Date;
  license?: string;
  tags: (string | { name: string; display_name?: string; id: string })[];
  organization?: string | { name: string; id: string; display_name?: string };
  datastoreActive: boolean;
  resourceType: string;
  downloadUrl: string;
  hash?: string;
  metadata: any;
  resources?: Array<{ name: string; description?: string; url: string }>;
}

// Registry Passport
export interface RegistryPassport {
  registryId: string;
  name: string;
  ownerOrg: string;
  url: string;
  api: string;
  type: CatalogType;
  format: DatasetFormat;
  license: string;
  updateFrequency: string;
  lastCheck: Date;
  recordCount: number;
  datastoreActive: boolean;
  authentication: string;
  rateLimit: number;
  healthScore: number;
  dataQualityScore: number;
  coverageScore: number;
  confidence: number;
  schemaVersion: string;
  connectorVersion: string;
  status: 'ACTIVE' | 'DEGRADED' | 'INACTIVE' | 'ERROR';
  lastError?: string;
  discoveredAt: Date;
  integratedAt?: Date;
}

// Quality Metrics
export interface QualityMetrics {
  availability: number;
  completeness: number;
  freshness: number;
  integrity: number;
  consistency: number;
  apiStability: number;
  avgResponseTime: number;
  errorRate: number;
  metadataQuality: number;
  fieldCoverage: number;
  overallScore: number;
}

// Schema Information
export interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
  sampleValues?: any[];
  constraints?: any;
}

export interface Schema {
  version: string;
  fields: SchemaField[];
  primaryKey?: string;
  indexes?: string[];
  relationships?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchemaDrift {
  detectedAt: Date;
  oldVersion: string;
  newVersion: string;
  changes: {
    renamedFields: Array<{ old: string; new: string }>;
    typeChanges: Array<{ field: string; oldType: string; newType: string }>;
    newFields: string[];
    removedFields: string[];
    structureChanges: string[];
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoFixed: boolean;
  prCreated?: string;
}

// Connector Configuration
export interface ConnectorConfig {
  id: string;
  registryId: string;
  name: string;
  type: 'CKAN' | 'REST' | 'SOAP' | 'FILE' | 'DATABASE';
  baseUrl: string;
  endpoint?: string;
  authentication?: any;
  pagination?: {
    type: 'LIMIT_OFFSET' | 'CURSOR' | 'PAGE' | 'NONE';
    limitParam?: string;
    offsetParam?: string;
    maxLimit?: number;
  };
  filters?: any;
  transformations: Transformation[];
  mapping: FieldMapping[];
  schedule: ScheduleConfig;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transformation {
  type: 'RENAME' | 'TYPE_CAST' | 'FORMAT' | 'FILTER' | 'AGGREGATE' | 'JOIN' | 'SPLIT';
  field: string;
  target?: string;
  config?: any;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: Transformation;
  required: boolean;
  default?: any;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'REALTIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  cronExpression?: string;
  timezone: string;
  lastRun?: Date;
  nextRun?: Date;
}

// Discovery Report
export interface DiscoveryReport {
  runId: string;
  timestamp: Date;
  catalogId: string;
  totalDatasets: number;
  newDatasets: number;
  updatedDatasets: number;
  failedDatasets: number;
  processingTime: number;
  datasets: Dataset[];
  errors: Array<{
    datasetId: string;
    error: string;
    timestamp: Date;
  }>;
  summary: string;
}

// Health Report
export interface HealthReport {
  timestamp: Date;
  totalRegistries: number;
  healthyRegistries: number;
  degradedRegistries: number;
  unhealthyRegistries: number;
  overallHealth: number;
  registries: Array<{
    registryId: string;
    health: number;
    status: string;
    lastCheck: Date;
  }>;
}

// Production Status
export interface ProductionStatus {
  timestamp: Date;
  phase: 'DISCOVERY' | 'ANALYSIS' | 'GENERATION' | 'VALIDATION' | 'INTEGRATION' | 'MONITORING';
  currentOperation: string;
  progress: number;
  totalRegistries: number;
  integratedRegistries: number;
  pendingRegistries: number;
  failedRegistries: number;
  lastUpdate: Date;
  nextScheduled: Date;
}

// Scan Result
export interface ScanResult {
  dataset: Dataset;
  hasDataStore: boolean;
  hasCSV: boolean;
  hasJSON: boolean;
  hasXML: boolean;
  hasZIP: boolean;
  hasXLSX: boolean;
  hasAPI: boolean;
  hasDump: boolean;
  hasStreaming: boolean;
  recommendedMethod: 'DATASTORE' | 'DOWNLOAD' | 'API' | 'DUMP';
  estimatedSize: number;
  estimatedRecords: number;
  schema?: Schema;
  qualityScore: number;
}

// Download Result
export interface DownloadResult {
  dataset: Dataset;
  method: 'DATASTORE' | 'DOWNLOAD' | 'API' | 'DUMP';
  success: boolean;
  records?: any[];
  rawData?: Buffer;
  format: DatasetFormat;
  size: number;
  downloadTime: number;
  error?: string;
  paginated?: boolean;
  pages?: number;
  checkpoint?: string;
}


export interface ProductionArtifacts {
  catalog: any;
  registryPassports: RegistryPassport[];
  downloadQueue: any[];
  connectorRegistry: any[];
  schemaHistory: any;
  healthReport: HealthReport;
  qualityReport: any;
  discoveryReport: string;
  productionStatus: ProductionStatus;
}
