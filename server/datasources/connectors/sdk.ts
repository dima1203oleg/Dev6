/**
 * PREDATOR Analytics — Production Connector SDK
 * Specification: MASTER CONNECTOR & COMPATIBILITY SPECIFICATION v1.0
 *
 * Base interfaces for all production connectors.
 * NO mock/stub/fake data allowed in production.
 */

// ─── CORE TYPES ────────────────────────────────────────────────────────────

export type SourceStatus =
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
  | 'NO_MATCH'
  | 'NOT_SUPPORTED'
  | 'DISABLED'
  | 'NEEDS_VERIFICATION';

export type CertificationStatus =
  | 'CERTIFIED'
  | 'NOT_CERTIFIED'
  | 'IN_PROGRESS'
  | 'FAILED';

export type CompatibilityStatus =
  | 'COMPATIBLE'
  | 'PARTIALLY_COMPATIBLE'
  | 'INCOMPATIBLE'
  | 'NEEDS_VERIFICATION'
  | 'LIVE_OK'
  | 'LIVE_DEGRADED'
  | 'LIVE_DOWN';

export type AccessLevel =
  | 'FREE_AUTO'
  | 'FREE_PUBLIC_DATASET'
  | 'FREE_API'
  | 'FREE_API_KEY'
  | 'FREE_WITH_APPROVAL'
  | 'MANUAL'
  | 'RESTRICTED'
  | 'UNVERIFIED'
  | 'PAID'
  | 'TRIAL_ONLY'
  | 'COMMERCIAL_API'
  | 'PAID_FALLBACK';

export type AutomationLevel = 'FULL' | 'PARTIAL' | 'MANUAL' | 'NONE';
export type AuthType = 'NONE' | 'API_KEY' | 'OAUTH' | 'TOKEN' | 'CERTIFICATE' | 'APPROVAL';
export type DataFormat = 'JSON' | 'XML' | 'CSV' | 'XLSX' | 'ZIP' | 'HTML' | 'CKAN' | 'SPARQL' | 'RDF' | 'FILE';
export type EntityType =
  | 'PERSON' | 'COMPANY' | 'FOP' | 'OWNER' | 'BENEFICIARY' | 'DIRECTOR'
  | 'ADDRESS' | 'LICENSE' | 'PERMIT' | 'COURT_CASE' | 'DEBT' | 'SANCTION'
  | 'PEP' | 'TENDER' | 'CONTRACT' | 'AUCTION' | 'PROPERTY' | 'LAND_PARCEL'
  | 'VEHICLE' | 'VESSEL' | 'AIRCRAFT' | 'DOMAIN' | 'IP' | 'TRADEMARK'
  | 'LEGAL_ACT' | 'STATE_ASSET';

export type IdentifierType =
  | 'edrpou' | 'ipn' | 'name' | 'date_of_birth' | 'address'
  | 'phone' | 'email' | 'domain' | 'ip' | 'license_number'
  | 'case_number' | 'vessel_imo' | 'aircraft_reg' | 'plate' | 'any';

// ─── CONNECTOR METADATA ────────────────────────────────────────────────────

export interface ConnectorMetadata {
  id: string;
  sourceId: string;
  name: string;
  nameEn: string;
  owner: string;
  country: string;
  category: string;
  accessLevel: AccessLevel;
  automationLevel: AutomationLevel;
  officialUrl: string;
  endpointOrResource: string;
  authType: AuthType;
  format: DataFormat;
  updateFrequency: 'REALTIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'STATIC';
  rateLimitReqPerMin: number;
  supportedEntities: EntityType[];
  supportedIdentifiers: IdentifierType[];
  legalStatus: 'ALLOWED' | 'RESTRICTED' | 'UNKNOWN';
  notes?: string;
}

// ─── CONNECTOR CAPABILITIES ───────────────────────────────────────────────

export interface ConnectorCapabilities {
  canSearch: boolean;
  canFetch: boolean;
  canPaginate: boolean;
  canFilter: boolean;
  canBulkDownload: boolean;
  supportsIncrementalUpdate: boolean;
  supportsHistory: boolean;
  maxResultsPerPage: number;
}

// ─── HEALTH & AUTH ─────────────────────────────────────────────────────────

export interface HealthResult {
  ok: boolean;
  latencyMs: number;
  statusCode?: number;
  error?: string;
  checkedAt: string;
}

export interface AuthResult {
  ok: boolean;
  method: AuthType;
  error?: string;
}

// ─── REQUEST / RESPONSE ────────────────────────────────────────────────────

export interface QueryInput {
  identifier: string;
  identifierType: IdentifierType;
  limit?: number;
  offset?: number;
  filters?: Record<string, string>;
}

export interface RawResponse {
  sourceId: string;
  requestUrl: string;
  requestHash: string;
  responseHash: string;
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  retrievedAt: string;
  durationMs: number;
}

export interface ParsedRecord {
  sourceId: string;
  recordId: string;
  entityType: EntityType;
  rawFields: Record<string, any>;
  parsedAt: string;
}

export interface CanonicalRecord {
  sourceId: string;
  recordId: string;
  entityType: EntityType;
  canonicalFields: Record<string, any>;
  normalizedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  schemaVersion?: string;
  errors: string[];
  warnings: string[];
}

// ─── EVIDENCE & PROVENANCE ─────────────────────────────────────────────────

export interface RequestContext {
  sourceId: string;
  query: string;
  identifierType: IdentifierType;
  connectorVersion: string;
  requestedAt: string;
}

export interface Evidence {
  evidenceId: string;
  sourceId: string;
  recordId: string;
  requestHash: string;
  responseHash: string;
  retrievedAt: string;
  parserVersion: string;
  connectorVersion: string;
  fieldMapping: Record<string, string>;
}

// ─── TEST RESULTS ─────────────────────────────────────────────────────────

export interface TestMatrix {
  sourceId: string;
  testedAt: string;
  test_connectivity: 'PASS' | 'FAIL';
  test_auth: 'PASS' | 'FAIL' | 'NA';
  test_search: 'PASS' | 'FAIL' | 'NA';
  test_fetch: 'PASS' | 'FAIL' | 'NA';
  test_schema: 'PASS' | 'FAIL';
  test_parser: 'PASS' | 'FAIL';
  test_normalization: 'PASS' | 'FAIL';
  test_evidence: 'PASS' | 'FAIL';
  test_provenance: 'PASS' | 'FAIL';
  test_graph_sync: 'PASS' | 'FAIL';
  test_retry: 'PASS' | 'FAIL';
  test_rate_limit: 'PASS' | 'FAIL';
  test_failure_mode: 'PASS' | 'FAIL';
  test_regression: 'PASS' | 'FAIL';
}

// ─── COMPATIBILITY RECORD ─────────────────────────────────────────────────

export interface CompatibilityRecord {
  sourceId: string;
  sourceName: string;
  owner: string;
  accessLevel: AccessLevel;
  format: DataFormat;
  endpoint: string;
  supportedIdentifiers: IdentifierType[];
  supportedEntities: EntityType[];
  authType: AuthType;
  rateLimitReqPerMin: number;
  updateFrequency: string;
  compatibilityStatus: CompatibilityStatus;
  sourceStatus: SourceStatus;
  certificationStatus: CertificationStatus;
  schemaValid?: boolean;
  parserValid?: boolean;
  normalizationValid?: boolean;
  evidenceValid?: boolean;
  provenanceValid?: boolean;
  productionReady: boolean;
  lastProbe?: string;
  lastSuccess?: string;
  lastFailure?: string;
  qualityScore: number;   // 0–100
  freshnessScore: number; // 0–100
  notes?: string;
}

// ─── PRODUCTION CONNECTOR INTERFACE ──────────────────────────────────────

export interface ProductionConnector {
  readonly VERSION: string;
  metadata(): ConnectorMetadata;
  capabilities(): ConnectorCapabilities;
  healthCheck(): Promise<HealthResult>;
  authenticate(): Promise<AuthResult>;
  search(query: QueryInput): Promise<RawResponse>;
  fetch(recordId: string): Promise<RawResponse>;
  parse(raw: RawResponse): ParsedRecord[];
  validateSchema(raw: RawResponse): ValidationResult;
  normalize(parsed: ParsedRecord[]): CanonicalRecord[];
  buildEvidence(ctx: RequestContext, raw: RawResponse): Evidence;
}

// ─── CONNECTOR FACTORY INTERFACE ──────────────────────────────────────────

export type ConnectorConstructor = new () => ProductionConnector;

export interface ConnectorRegistry {
  sourceId: string;
  connectorId: string;
  connectorVersion: string;
  parserVersion: string;
  normalizerVersion: string;
  compatibilityStatus: CompatibilityStatus;
  certificationStatus: CertificationStatus;
  lastTestedAt?: string;
}

export interface CompatibilityReport {
  sourceId: string;
  stageA_canRead: boolean;
  stageB_canParse: boolean;
  stageC_canNormalize: boolean;
  stageD_certified: boolean;
  stageE_operational: boolean;
  overallStatus: CompatibilityStatus;
  checkedAt: string;
  errors: string[];
}

export interface ConnectorFactory {
  create(sourceId: string): ProductionConnector;
  register(sourceId: string, connectorCtor: ConnectorConstructor): void;
  validateCompatibility(sourceId: string): Promise<CompatibilityReport>;
  listRegistered(): string[];
}
