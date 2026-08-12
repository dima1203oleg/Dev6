/**
 * DPS (Державна податкова служба) Schema Definitions
 * JSON Schema definitions for request/response validation
 * 
 * Source: https://cabinet.tax.gov.ua/help/api-registers.html
 */

// ============================================================================
// TAX REGISTRATION SCHEMA (/registration) - PRIMARY
// ============================================================================

export const DPSTaxRegistrationRequestSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    tins: { type: ['string', 'null'], pattern: '^\\d{8,10}$' },
    name: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSTaxRegistrationResponseSchema = {
  type: 'object',
  required: ['FULL_NAME', 'TIN_S', 'ADRESS', 'D_REG_STI', 'N_REG_STI', 'C_STI_MAIN_NAME', 'FACE_MODE', 'C_STAN', 'C_KIND', 'C_CLOSE'],
  properties: {
    FULL_NAME: { type: 'string' },
    TIN_S: { type: 'string', pattern: '^\\d{8,10}$' },
    ADRESS: { type: 'string' },
    D_REG_STI: { type: 'string', pattern: '^\\d{2}\\.\\d{2}\\.\\d{4}$' },
    N_REG_STI: { type: 'string' },
    C_STI_MAIN_NAME: { type: 'string' },
    VED_LIC: { type: ['number', 'null'] },
    FACE_MODE: { type: 'number' },
    C_STAN: { type: 'number' },
    D_ZAKR_STI: { type: ['string', 'null'] },
    C_KIND: { type: 'number' },
    C_CLOSE: { type: 'number' }
  },
  additionalProperties: true
};

// ============================================================================
// VAT PAYERS SCHEMA (/pdv_act/list)
// ============================================================================

export const DPSVATPayersRequestSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    kodPdvList: { 
      type: ['array', 'null'],
      items: { type: 'number' },
      maxItems: 10
    },
    tinList: { 
      type: ['string', 'null'],
      pattern: '^[\\d\\s]+$'
    },
    name: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSVATPayersResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['kodPdv', 'tin', 'name', 'datReestr', 'kodPdvs', 'datSvd', 'kodPid'],
    properties: {
      kodPdv: { type: 'number' },
      tin: { type: 'string', pattern: '^\\d{8,10}$' },
      name: { type: 'string' },
      datReestr: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$' },
      datAnul: { type: ['string', 'null'] },
      kodPdvs: { type: 'string' },
      datTerm: { type: ['string', 'null'] },
      dreestrSg: { type: ['string', 'null'] },
      datSvd: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$' },
      danulSg: { type: ['string', 'null'] },
      dpdvSg: { type: ['string', 'null'] },
      kodAnul: { type: ['string', 'null'] },
      kodPid: { type: 'string' }
    },
    additionalProperties: true
  }
};

// ============================================================================
// INSURERS REGISTER SCHEMA (/ev)
// ============================================================================

export const DPSInsurersRequestSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    tin: { type: ['string', 'null'], pattern: '^\\d{8,10}$' },
    name: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSInsurersResponseSchema = {
  type: 'object',
  required: ['TIN_S', 'FULL_NAME', 'DATE_ACC_ERS', 'ID_ERS', 'C_STI_MAIN_NAME', 'KVED', 'RCLASS'],
  properties: {
    TIN_S: { type: 'string', pattern: '^\\d{8,10}$' },
    FULL_NAME: { type: 'string' },
    DATE_ACC_ERS: { type: 'string', pattern: '^\\d{2}\\.\\d{2}\\.\\d{4}$' },
    ID_ERS: { type: 'string' },
    C_STI_MAIN_NAME: { type: 'string' },
    KVED: { type: 'string' },
    RCLASS: { type: 'string' },
    DATE_DCC_ERS: { type: ['string', 'null'] },
    IS_PAYER: { type: ['boolean', 'null'] }
  },
  additionalProperties: true
};

// ============================================================================
// EXCISE TAX REGISTER SCHEMA (/excise)
// ============================================================================

export const DPSExciseRequestSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    tin: { type: ['string', 'null'], pattern: '^\\d{8,10}$' },
    name: { type: ['string', 'null'] },
    nReg: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSExciseResponseSchema = {
  type: 'object',
  required: ['TIN_S', 'FULL_NAME', 'DAT_REEST', 'N_REG', 'LAST_DATE', 'FACE_MODE', 'OZN_P'],
  properties: {
    TIN_S: { type: 'string', pattern: '^\\d{8,10}$' },
    FULL_NAME: { type: 'string' },
    DAT_REEST: { type: 'string', pattern: '^\\d{2}\\.\\d{2}\\.\\d{4}$' },
    N_REG: { type: 'number' },
    LAST_DATE: { type: 'string', pattern: '^\\d{2}\\.\\d{2}\\.\\d{4}$' },
    DAT_ANUL: { type: ['string', 'null'] },
    C_ANUL_NAME: { type: ['string', 'null'] },
    FACE_MODE: { type: 'number' },
    OZN_P: { type: 'string' },
    OZN_S: { type: ['string', 'null'] }
  },
  additionalProperties: true
};

// ============================================================================
// FISCAL CHECKS SCHEMA (/rro/chkAll)
// ============================================================================

export const DPSFiscalChecksRequestSchema = {
  type: 'object',
  required: ['id', 'type', 'token'],
  properties: {
    id: { type: 'string', minLength: 1 },
    date: { 
      type: ['string', 'null'],
      pattern: '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$'
    },
    fn: { type: ['string', 'null'] },
    type: { type: 'number', enum: [1, 2, 3] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSFiscalChecksResponseSchema = {
  type: 'object',
  required: ['check', 'fn', 'xml', 'sign'],
  properties: {
    check: { type: 'string' },
    fn: { type: 'string' },
    name: { type: ['string', 'null'] },
    addressGo: { type: ['string', 'null'] },
    typeGo: { type: ['string', 'null'] },
    tins: { type: ['string', 'null'] },
    xml: { type: 'boolean' },
    sign: { type: 'boolean' },
    qr: { type: ['string', 'null'] },
    resultCode: { type: ['string', 'null'] },
    resultText: { type: ['string', 'null'] }
  },
  additionalProperties: true
};

// ============================================================================
// STOPPED INVOICES SCHEMA (/inv-stopped)
// ============================================================================

export const DPSStoppedInvoicesRequestSchema = {
  type: 'object',
  required: ['ipn', 'token'],
  properties: {
    ipn: { type: 'string', minLength: 1 },
    num: { type: ['string', 'null'] },
    crtDate: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

// Response schema to be captured from real API
export const DPSStoppedInvoicesResponseSchema = {
  type: 'object',
  additionalProperties: true
};

// ============================================================================
// RRO INSTANCE SCHEMA (/rro-instance)
// ============================================================================

export const DPSRROInstanceRequestSchema = {
  type: 'object',
  required: ['sn', 'cekka', 'token'],
  properties: {
    sn: { type: 'string', minLength: 1 },
    cekka: { type: 'string', minLength: 1 },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

// Response schema to be captured from real API
export const DPSRROInstanceResponseSchema = {
  type: 'object',
  additionalProperties: true
};

// ============================================================================
// CSO REGISTER SCHEMA (/rro-cso)
// ============================================================================

export const DPSCSORequestSchema = {
  type: 'object',
  required: ['tins', 'token'],
  properties: {
    tins: { type: 'string', minLength: 1 },
    cekka: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

// Response schema to be captured from real API
export const DPSCSOResponseSchema = {
  type: 'object',
  additionalProperties: true
};

// ============================================================================
// UNDOCUMENTED ENDPOINTS - SCHEMAS TO BE CAPTURED FROM REAL API
// ============================================================================

// Goods Operations (/cli-zed)
export const DPSGoodsOperationsRequestSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    tins: { type: ['string', 'null'] },
    name: { type: ['string', 'null'] },
    kodPdv: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSGoodsOperationsResponseSchema = {
  type: 'object',
  additionalProperties: true,
  note: 'Schema to be captured from real API response'
};

// Budget Subsidy (/obd)
export const DPSBudgetSubsidyRequestSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    tins: { type: ['string', 'null'] },
    name: { type: ['string', 'null'] },
    kodPdv: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSBudgetSubsidyResponseSchema = {
  type: 'object',
  additionalProperties: true,
  note: 'Schema to be captured from real API response'
};

// Non-Profit Register (/non-profit)
export const DPSNonProfitRequestSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    tin: { type: ['string', 'null'] },
    name: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSNonProfitResponseSchema = {
  type: 'object',
  additionalProperties: true,
  note: 'Schema to be captured from real API response'
};

// RRO Information (/rro)
export const DPSRRORequestSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    tins: { type: ['string', 'null'] },
    name: { type: ['string', 'null'] },
    nFis: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSRROResponseSchema = {
  type: 'object',
  additionalProperties: true,
  note: 'Schema to be captured from real API response'
};

// ORO Books (/koro)
export const DPSOROBooksRequestSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    tins: { type: ['string', 'null'] },
    name: { type: ['string', 'null'] },
    nFis: { type: ['string', 'null'] },
    token: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const DPSOROBooksResponseSchema = {
  type: 'object',
  additionalProperties: true,
  note: 'Schema to be captured from real API response'
};

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

export interface DPSSchemaRegistry {
  [endpoint: string]: {
    requestSchema: any;
    responseSchema: any;
    documented: boolean;
    version: string;
    fingerprint: string;
  };
}

export const DPS_SCHEMA_REGISTRY: DPSSchemaRegistry = {
  '/registration': {
    requestSchema: DPSTaxRegistrationRequestSchema,
    responseSchema: DPSTaxRegistrationResponseSchema,
    documented: true,
    version: '1.0',
    fingerprint: 'tax-registration-v1'
  },
  '/pdv_act/list': {
    requestSchema: DPSVATPayersRequestSchema,
    responseSchema: DPSVATPayersResponseSchema,
    documented: true,
    version: '1.0',
    fingerprint: 'vat-payers-v1'
  },
  '/ev': {
    requestSchema: DPSInsurersRequestSchema,
    responseSchema: DPSInsurersResponseSchema,
    documented: true,
    version: '1.0',
    fingerprint: 'insurers-v1'
  },
  '/excise': {
    requestSchema: DPSExciseRequestSchema,
    responseSchema: DPSExciseResponseSchema,
    documented: true,
    version: '1.0',
    fingerprint: 'excise-v1'
  },
  '/cli-zed': {
    requestSchema: DPSGoodsOperationsRequestSchema,
    responseSchema: DPSGoodsOperationsResponseSchema,
    documented: false,
    version: '0.1',
    fingerprint: 'goods-operations-undocumented'
  },
  '/obd': {
    requestSchema: DPSBudgetSubsidyRequestSchema,
    responseSchema: DPSBudgetSubsidyResponseSchema,
    documented: false,
    version: '0.1',
    fingerprint: 'budget-subsidy-undocumented'
  },
  '/non-profit': {
    requestSchema: DPSNonProfitRequestSchema,
    responseSchema: DPSNonProfitResponseSchema,
    documented: false,
    version: '0.1',
    fingerprint: 'non-profit-undocumented'
  },
  '/rro': {
    requestSchema: DPSRRORequestSchema,
    responseSchema: DPSRROResponseSchema,
    documented: false,
    version: '0.1',
    fingerprint: 'rro-undocumented'
  },
  '/koro': {
    requestSchema: DPSOROBooksRequestSchema,
    responseSchema: DPSOROBooksResponseSchema,
    documented: false,
    version: '0.1',
    fingerprint: 'oro-books-undocumented'
  },
  '/inv-stopped': {
    requestSchema: DPSStoppedInvoicesRequestSchema,
    responseSchema: DPSStoppedInvoicesResponseSchema,
    documented: false,
    version: '0.1',
    fingerprint: 'stopped-invoices-undocumented'
  },
  '/rro-instance': {
    requestSchema: DPSRROInstanceRequestSchema,
    responseSchema: DPSRROInstanceResponseSchema,
    documented: false,
    version: '0.1',
    fingerprint: 'rro-instance-undocumented'
  },
  '/rro-cso': {
    requestSchema: DPSCSORequestSchema,
    responseSchema: DPSCSOResponseSchema,
    documented: false,
    version: '0.1',
    fingerprint: 'cso-undocumented'
  },
  '/rro/chkAll': {
    requestSchema: DPSFiscalChecksRequestSchema,
    responseSchema: DPSFiscalChecksResponseSchema,
    documented: true,
    version: '1.0',
    fingerprint: 'fiscal-checks-v1'
  }
};

// ============================================================================
// SCHEMA FINGERPRINTING
// ============================================================================

export function calculateSchemaFingerprint(schema: any): string {
  const crypto = require('crypto');
  const schemaString = JSON.stringify(schema);
  return crypto.createHash('sha256').update(schemaString).digest('hex').substring(0, 16);
}

export function detectSchemaChange(oldSchema: any, newSchema: any): boolean {
  const oldFingerprint = calculateSchemaFingerprint(oldSchema);
  const newFingerprint = calculateSchemaFingerprint(newSchema);
  return oldFingerprint !== newFingerprint;
}
