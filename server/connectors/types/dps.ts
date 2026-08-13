/**
 * DPS (Державна податкова служба) Open Registers Connector Pack
 * TypeScript Type Definitions for 19 Endpoints
 * 
 * Source: https://cabinet.tax.gov.ua/help/api-registers.html
 * Base URL: https://cabinet.tax.gov.ua/ws/api/public/registers/
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type DPSConnectorStatus = 
  | 'CONNECTED'
  | 'CONFIGURED'
  | 'AUTHENTICATION_FAILED'
  | 'UNREACHABLE'
  | 'API_CONTRACT_UNKNOWN'
  | 'DISABLED'
  | 'MAINTENANCE'
  | 'TOKEN_EXHAUSTED'
  | 'RATE_LIMITED'
  | 'SCHEMA_BROKEN';

export type DPSResponseStatus = 
  | 'SUCCESS'
  | 'FAILED'
  | 'NO_MATCH'
  | 'UNAVAILABLE'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'SCHEMA_ERROR'
  | 'PARSER_ERROR';

export interface DPSConnectorResponse {
  status: DPSResponseStatus;
  evidence?: DPSEvidence;
  normalizedData?: any;
  error?: string;
  errorDetails?: {
    code?: string;
    httpStatus?: number;
    message?: string;
    details?: any;
  };
}

export interface DPSEvidence {
  id: string;
  sourceId: string;
  rawPayload: any;
  schemaValid: boolean;
  checksumValid: boolean;
  provenance: {
    sourceId: string;
    requestId: string;
    retrievedAt: string;
    responseHash: string;
    rawRecordReference: string;
    httpStatus?: number;
    responseTimeMs?: number;
  };
}

export interface DPSProductionValidation {
  has_official_api: boolean;
  documentation_url?: string;
  documentation_current: boolean;
  api_version_supported: string;
  authorization_mechanism: string;
  rate_limits_confirmed: boolean;
  tested_with_real_responses: boolean;
  last_validation_date?: string;
  notes?: string;
}

// ============================================================================
// ENDPOINT 1: TAX REGISTRATION (/registration) - PRIMARY
// ============================================================================

export interface DPSTaxRegistrationRequest {
  tins?: string | null;
  name?: string | null;
  token: string;
}

export interface DPSTaxRegistrationResponse {
  FULL_NAME: string;
  TIN_S: string;
  ADRESS: string;
  D_REG_STI: string; // DD.MM.YYYY
  N_REG_STI: string;
  C_STI_MAIN_NAME: string;
  VED_LIC: number | null;
  FACE_MODE: number;
  C_STAN: number;
  D_ZAKR_STI: string | null;
  C_KIND: number;
  C_CLOSE: number;
}

export interface DPSTaxRegistrationNormalized {
  rnokpp: string;
  fullName: string;
  address: string;
  taxRegistrationDate: string;
  taxRegistrationNumber: string;
  taxAuthority: string;
  foreignEconomicActivity: number | null;
  entityType: number;
  taxStatus: number;
  taxClosureDate: string | null;
  entityKind: number;
  closureStatus: number;
}

// ============================================================================
// ENDPOINT 2: VAT PAYERS (/pdv_act/list)
// ============================================================================

export interface DPSVATPayersRequest {
  kodPdvList?: number[] | null;
  tinList?: string | null; // Space-separated, up to 10
  name?: string | null;
  token: string;
}

export interface DPSVATPayersResponse {
  kodPdv: number;
  tin: string;
  name: string;
  datReestr: string; // YYYY-MM-DD HH:mm:ss
  datAnul: string | null;
  kodPdvs: string;
  datTerm: string | null;
  dreestrSg: string | null;
  datSvd: string; // YYYY-MM-DD HH:mm:ss
  danulSg: string | null;
  dpdvSg: string | null;
  kodAnul: string | null;
  kodPid: string;
}

export interface DPSVATPayersNormalized {
  vatCode: number;
  rnokpp: string;
  fullName: string;
  vatRegistrationDate: string;
  vatCancellationDate: string | null;
  vatCodeString: string;
  vatTerminationDate: string | null;
  vatRegistrationSg: string | null;
  vatCertificateDate: string;
  vatCancellationSg: string | null;
  vatPaymentSg: string | null;
  vatCancellationReason: string | null;
  vatStatus: string;
}

// ============================================================================
// ENDPOINT 3: INSURERS REGISTER (/ev)
// ============================================================================

export interface DPSInsurersRequest {
  tin?: string | null;
  name?: string | null;
  token: string;
}

export interface DPSInsurersResponse {
  TIN_S: string;
  FULL_NAME: string;
  DATE_ACC_ERS: string; // DD.MM.YYYY
  ID_ERS: string;
  C_STI_MAIN_NAME: string;
  KVED: string;
  RCLASS: string;
  DATE_DCC_ERS: string | null;
  IS_PAYER: boolean | null;
}

export interface DPSInsurersNormalized {
  rnokpp: string;
  fullName: string;
  insuranceRegistrationDate: string;
  insuranceId: string;
  taxAuthority: string;
  kved: string;
  riskClass: string;
  insuranceCancellationDate: string | null;
  isPayer: boolean | null;
}

// ============================================================================
// ENDPOINT 4: EXCISE TAX REGISTER (/excise)
// ============================================================================

export interface DPSExciseRequest {
  tin?: string | null;
  name?: string | null;
  nReg?: string | null;
  token: string;
}

export interface DPSExciseResponse {
  TIN_S: string;
  FULL_NAME: string;
  DAT_REEST: string; // DD.MM.YYYY
  N_REG: number;
  LAST_DATE: string; // DD.MM.YYYY
  DAT_ANUL: string | null;
  C_ANUL_NAME: string | null;
  FACE_MODE: number;
  OZN_P: string;
  OZN_S: string | null;
}

export interface DPSExciseNormalized {
  rnokpp: string;
  fullName: string;
  exciseRegistrationDate: string;
  registrationNumber: number;
  lastDate: string;
  exciseCancellationDate: string | null;
  cancellationReason: string | null;
  entityType: number;
  oznP: string;
  oznS: string | null;
}

// ============================================================================
// ENDPOINT 5: GOODS OPERATIONS (/cli-zed)
// ============================================================================

export interface DPSGoodsOperationsRequest {
  tins?: string | null;
  name?: string | null;
  kodPdv?: string | null;
  token: string;
}

// Response schema to be captured from real API
export interface DPSGoodsOperationsResponse {
  [key: string]: any;
}

export interface DPSGoodsOperationsNormalized {
  [key: string]: any;
}

// ============================================================================
// ENDPOINT 6: BUDGET SUBSIDY (/obd)
// ============================================================================

export interface DPSBudgetSubsidyRequest {
  tins?: string | null;
  name?: string | null;
  kodPdv?: string | null;
  token: string;
}

// Response schema to be captured from real API
export interface DPSBudgetSubsidyResponse {
  [key: string]: any;
}

export interface DPSBudgetSubsidyNormalized {
  [key: string]: any;
}

// ============================================================================
// ENDPOINT 7: NON-PROFIT REGISTER (/non-profit)
// ============================================================================

export interface DPSNonProfitRequest {
  tin?: string | null;
  name?: string | null;
  token: string;
}

// Response schema to be captured from real API
export interface DPSNonProfitResponse {
  [key: string]: any;
}

export interface DPSNonProfitNormalized {
  [key: string]: any;
}

// ============================================================================
// ENDPOINT 8: RRO INFORMATION (/rro)
// ============================================================================

export interface DPSRRORequest {
  tins?: string | null;
  name?: string | null;
  nFis?: string | null;
  token: string;
}

// Response schema to be captured from real API
export interface DPSRROResponse {
  [key: string]: any;
}

export interface DPRRONormalized {
  [key: string]: any;
}

// ============================================================================
// ENDPOINT 9: ORO BOOKS (/koro)
// ============================================================================

export interface DPSOROBooksRequest {
  tins?: string | null;
  name?: string | null;
  nFis?: string | null;
  token: string;
}

// Response schema to be captured from real API
export interface DPSOROBooksResponse {
  [key: string]: any;
}

export interface DPSOROBooksNormalized {
  [key: string]: any;
}

// ============================================================================
// ENDPOINT 10: STOPPED INVOICES (/inv-stopped)
// ============================================================================

export interface DPSStoppedInvoicesRequest {
  ipn: string; // REQUIRED
  num?: string | null;
  crtDate?: string | null;
  token: string;
}

// Response schema to be captured from real API
export interface DPSStoppedInvoicesResponse {
  [key: string]: any;
}

export interface DPSStoppedInvoicesNormalized {
  [key: string]: any;
}

// ============================================================================
// ENDPOINT 11: RRO INSTANCES (/rro-instance)
// ============================================================================

export interface DPSRROInstanceRequest {
  sn: string; // REQUIRED - Serial number
  cekka: string; // REQUIRED - Model code
  token: string;
}

// Response schema to be captured from real API
export interface DPSRROInstanceResponse {
  [key: string]: any;
}

export interface DPSRROInstanceNormalized {
  [key: string]: any;
}

// ============================================================================
// ENDPOINT 12: CSO REGISTER (/rro-cso)
// ============================================================================

export interface DPSCSORequest {
  tins: string; // REQUIRED - EDRPOU list
  cekka?: string | null;
  token: string;
}

// Response schema to be captured from real API
export interface DPSCSOResponse {
  [key: string]: any;
}

export interface DPSCSONormalized {
  [key: string]: any;
}

// ============================================================================
// ENDPOINT 13: FISCAL CHECKS (/rro/chkAll)
// ============================================================================

export interface DPSFiscalChecksRequest {
  id: string; // REQUIRED - Check number
  date?: string | null; // YYYY-MM-DD HH:mm:ss
  fn?: string | null; // Fiscal number
  type: number; // REQUIRED - 1=XML, 2=Signed XML, 3=Text UTF-8
  token: string;
}

export interface DPSFiscalChecksResponse {
  check: string;
  fn: string;
  name: string | null;
  addressGo: string | null;
  typeGo: string | null;
  tins: string | null;
  xml: boolean;
  sign: boolean;
  qr: string | null;
  resultCode: string | null;
  resultText: string | null;
}

export interface DPSFiscalChecksNormalized {
  checkNumber: string;
  fiscalNumber: string;
  name: string | null;
  address: string | null;
  type: string | null;
  rnokpp: string | null;
  hasXml: boolean;
  hasSignature: boolean;
  qrCode: string | null;
  resultCode: string | null;
  resultText: string | null;
}

// ============================================================================
// CSV EXPORT ENDPOINTS (6)
// ============================================================================

export type DPSCSVExportType =
  | 'pdv' // VAT Payers
  | 'reestr_edpod' // Single Tax
  | 'reestr_searpse' // Excise Tax
  | 'reestr_operac_z_tov' // Goods Operations
  | 'reestr_nuo' // Non-Profit
  | 'rro_cso'; // CSO

export interface DPSCSVExportRequest {
  exportType: DPSCSVExportType;
  token: string;
}

export interface DPSCSVExportResponse {
  csvData: string;
  rowCount: number;
  fileSize: number;
  sha256: string;
  downloadedAt: string;
}

export interface DPSCSVExportNormalized {
  exportType: DPSCSVExportType;
  records: any[];
  rowCount: number;
  sha256: string;
  downloadedAt: string;
  processedAt: string;
}

// ============================================================================
// TOKEN MANAGEMENT TYPES
// ============================================================================

export interface DPSTokenUsage {
  tokenHash: string;
  requestCount: number;
  lastResetDate: Date;
  remainingQuota: number;
  quotaPercentage: number;
  status: 'ACTIVE' | 'WARNING' | 'CRITICAL' | 'EXHAUSTED';
}

export interface DPSTokenManagerConfig {
  tokens: string[];
  maxRequestsPerDay: number;
  warningThreshold: number; // 70%
  highWarningThreshold: number; // 85%
  criticalThreshold: number; // 95%
  rotationEnabled: boolean;
}

// ============================================================================
// RATE LIMITER TYPES
// ============================================================================

export interface DPSRateLimiterConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  backoffInitialDelay: number;
  backoffMaxDelay: number;
  backoffMultiplier: number;
}

export interface DPSRateLimitStatus {
  allowed: boolean;
  remainingQuota: number;
  resetTime: Date | null;
  reason?: string;
}

// ============================================================================
// CIRCUIT BREAKER TYPES
// ============================================================================

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface DPSCircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // milliseconds
  resetTimeout: number; // milliseconds
}

export interface DPSCircuitBreakerStatus {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
}

// ============================================================================
// RETRY POLICY TYPES
// ============================================================================

export interface DPSRetryPolicyConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  jitter: boolean;
  retryableStatusCodes: number[];
  nonRetryableStatusCodes: number[];
}

export interface DPSRetryResult {
  attempt: number;
  success: boolean;
  totalDelay: number;
  error?: Error;
}

// ============================================================================
// SCHEMA VALIDATION TYPES
// ============================================================================

export interface DPSSchemaDefinition {
  endpoint: string;
  version: string;
  requestSchema: any;
  responseSchema: any;
  fingerprint: string;
}

export interface DPSSchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fingerprint: string;
  schemaVersion: string;
}

// ============================================================================
// UNIFIED REQUEST/RESPONSE TYPES
// ============================================================================

export type DPSRequest =
  | DPSTaxRegistrationRequest
  | DPSVATPayersRequest
  | DPSInsurersRequest
  | DPSExciseRequest
  | DPSGoodsOperationsRequest
  | DPSBudgetSubsidyRequest
  | DPSNonProfitRequest
  | DPSRRORequest
  | DPSOROBooksRequest
  | DPSStoppedInvoicesRequest
  | DPSRROInstanceRequest
  | DPSCSORequest
  | DPSFiscalChecksRequest;

export type DPSResponse =
  | DPSTaxRegistrationResponse
  | DPSVATPayersResponse
  | DPSInsurersResponse
  | DPSExciseResponse
  | DPSGoodsOperationsResponse
  | DPSBudgetSubsidyResponse
  | DPSNonProfitResponse
  | DPSRROResponse
  | DPSOROBooksResponse
  | DPSStoppedInvoicesResponse
  | DPSRROInstanceResponse
  | DPSCSOResponse
  | DPSFiscalChecksResponse;

export type DPSNormalized =
  | DPSTaxRegistrationNormalized
  | DPSVATPayersNormalized
  | DPSInsurersNormalized
  | DPSExciseNormalized
  | DPSGoodsOperationsNormalized
  | DPSBudgetSubsidyNormalized
  | DPSNonProfitNormalized
  | DPRRONormalized
  | DPSOROBooksNormalized
  | DPSStoppedInvoicesNormalized
  | DPSRROInstanceNormalized
  | DPSCSONormalized
  | DPSFiscalChecksNormalized;

// ============================================================================
// ENDPOINT METADATA
// ============================================================================

export interface DPSEndpointMetadata {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  description: string;
  requiresAuth: boolean;
  rateLimit: number;
  requestType: string;
  responseType: string;
  normalizedType: string;
  schemaDocumented: boolean;
  primary: boolean;
}

export const DPS_ENDPOINTS: DPSEndpointMetadata[] = [
  {
    id: 'tax_registration',
    name: 'Tax Registration',
    endpoint: '/registration',
    method: 'POST',
    description: 'Дані про взяття на облік платників податків',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSTaxRegistrationRequest',
    responseType: 'DPSTaxRegistrationResponse',
    normalizedType: 'DPSTaxRegistrationNormalized',
    schemaDocumented: true,
    primary: true,
  },
  {
    id: 'vat_payers',
    name: 'VAT Payers',
    endpoint: '/pdv_act/list',
    method: 'POST',
    description: 'Реєстр платників ПДВ',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSVATPayersRequest',
    responseType: 'DPSVATPayersResponse',
    normalizedType: 'DPSVATPayersNormalized',
    schemaDocumented: true,
    primary: false,
  },
  {
    id: 'insurers',
    name: 'Insurers Register',
    endpoint: '/ev',
    method: 'POST',
    description: 'Реєстр страхувальників',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSInsurersRequest',
    responseType: 'DPSInsurersResponse',
    normalizedType: 'DPSInsurersNormalized',
    schemaDocumented: true,
    primary: false,
  },
  {
    id: 'excise',
    name: 'Excise Tax Register',
    endpoint: '/excise',
    method: 'POST',
    description: 'Реєстр платників акцизного податку',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSExciseRequest',
    responseType: 'DPSExciseResponse',
    normalizedType: 'DPSExciseNormalized',
    schemaDocumented: true,
    primary: false,
  },
  {
    id: 'goods_operations',
    name: 'Goods Operations',
    endpoint: '/cli-zed',
    method: 'POST',
    description: 'Реєстр осіб, які здійснюють операції з товарами',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSGoodsOperationsRequest',
    responseType: 'DPSGoodsOperationsResponse',
    normalizedType: 'DPSGoodsOperationsNormalized',
    schemaDocumented: false,
    primary: false,
  },
  {
    id: 'budget_subsidy',
    name: 'Budget Subsidy',
    endpoint: '/obd',
    method: 'POST',
    description: 'Реєстр отримувачів бюджетної дотації',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSBudgetSubsidyRequest',
    responseType: 'DPSBudgetSubsidyResponse',
    normalizedType: 'DPSBudgetSubsidyNormalized',
    schemaDocumented: false,
    primary: false,
  },
  {
    id: 'non_profit',
    name: 'Non-Profit Register',
    endpoint: '/non-profit',
    method: 'POST',
    description: 'Реєстр неприбуткових установ та організацій',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSNonProfitRequest',
    responseType: 'DPSNonProfitResponse',
    normalizedType: 'DPSNonProfitNormalized',
    schemaDocumented: false,
    primary: false,
  },
  {
    id: 'rro',
    name: 'RRO Information',
    endpoint: '/rro',
    method: 'POST',
    description: 'Інформація про РРО',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSRRORequest',
    responseType: 'DPSRROResponse',
    normalizedType: 'DPRRONormalized',
    schemaDocumented: false,
    primary: false,
  },
  {
    id: 'oro_books',
    name: 'ORO Books',
    endpoint: '/koro',
    method: 'POST',
    description: 'Інформація про книги ОРО',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSOROBooksRequest',
    responseType: 'DPSOROBooksResponse',
    normalizedType: 'DPSOROBooksNormalized',
    schemaDocumented: false,
    primary: false,
  },
  {
    id: 'stopped_invoices',
    name: 'Stopped Invoices',
    endpoint: '/inv-stopped',
    method: 'POST',
    description: 'Реєстр ПН / РК, реєстрація яких зупинена',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSStoppedInvoicesRequest',
    responseType: 'DPSStoppedInvoicesResponse',
    normalizedType: 'DPSStoppedInvoicesNormalized',
    schemaDocumented: false,
    primary: false,
  },
  {
    id: 'rro_instance',
    name: 'RRO Instances',
    endpoint: '/rro-instance',
    method: 'POST',
    description: 'Реєстр екземплярів РРО',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSRROInstanceRequest',
    responseType: 'DPSRROInstanceResponse',
    normalizedType: 'DPSRROInstanceNormalized',
    schemaDocumented: false,
    primary: false,
  },
  {
    id: 'cso',
    name: 'CSO Register',
    endpoint: '/rro-cso',
    method: 'POST',
    description: 'Реєстр ЦСО',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSCSORequest',
    responseType: 'DPSCSOResponse',
    normalizedType: 'DPSCSONormalized',
    schemaDocumented: false,
    primary: false,
  },
  {
    id: 'fiscal_checks',
    name: 'Fiscal Checks',
    endpoint: '/rro/chkAll',
    method: 'GET',
    description: 'Реєстр фіскальних чеків',
    requiresAuth: true,
    rateLimit: 1000,
    requestType: 'DPSFiscalChecksRequest',
    responseType: 'DPSFiscalChecksResponse',
    normalizedType: 'DPSFiscalChecksNormalized',
    schemaDocumented: true,
    primary: false,
  },
];
