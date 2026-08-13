/**
 * DPS Tax Cabinet API Connector
 * 
 * Provides access to Ukrainian State Tax Service (DPS) public registers
 * through the Tax Cabinet API with token-based authentication.
 * 
 * Documentation: https://cabinet.tax.gov.ua/help/api-registers.html
 * 
 * Phase 1 Implementation:
 * - VAT Payer Register (pdv_act/list)
 * - Tax Registration Data (registration)
 * - Non-Profit Organizations (non-profit)
 */

export interface DPSTaxCompany {
  sourceType: 'DPS_TAX_CABINET';
  tin: string; // Tax Identification Number (EDRPOU/IPN)
  name: string;
  status?: string;
  registrationDate?: string;
  vatStatus?: string;
  vatRegistrationDate?: string;
  isNonProfit?: boolean;
  taxAuthority?: string;
  address?: string;
  rawData?: any;
}

export interface DPSTaxConfig {
  apiToken: string;
  baseUrl?: string;
  timeout?: number;
}

const DEFAULT_BASE_URL = 'https://cabinet.tax.gov.ua/ws/api/public/registers';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Fetch VAT payer status from DPS Tax Cabinet
 * 
 * Endpoint: /pdv_act/list
 * Method: GET
 * Authentication: Bearer token
 */
export async function fetchVATPayerStatus(
  tin: string,
  config: DPSTaxConfig
): Promise<DPSTaxCompany | null> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/pdv_act/list`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config.timeout || DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('DPS Tax Cabinet: Invalid API token');
      }
      if (response.status === 404) {
        return null; // Entity not found
      }
      if (response.status === 429) {
        throw new Error('DPS Tax Cabinet: Rate limit exceeded');
      }
      throw new Error(`DPS Tax Cabinet: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // The API returns a list, we need to find the matching TIN
    const records = Array.isArray(data) ? data : [data];
    const record = records.find((r: any) => r.tin === tin || r.TIN === tin);
    
    if (!record) {
      return null;
    }

    return {
      sourceType: 'DPS_TAX_CABINET',
      tin: record.tin || record.TIN,
      name: record.name || record.NAME,
      status: record.status || record.STATUS,
      registrationDate: record.registrationDate || record.REGISTRATION_DATE,
      vatStatus: record.vatStatus || record.VAT_STATUS,
      vatRegistrationDate: record.vatRegistrationDate || record.VAT_REGISTRATION_DATE,
      taxAuthority: record.taxAuthority || record.TAX_AUTHORITY,
      address: record.address || record.ADDRESS,
      rawData: record,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('DPS Tax Cabinet: Request timeout');
      }
      throw error;
    }
    throw new Error('DPS Tax Cabinet: Unknown error');
  }
}

/**
 * Fetch tax registration data from DPS Tax Cabinet
 * 
 * Endpoint: /registration
 * Method: POST
 * Authentication: Bearer token
 */
export async function fetchTaxRegistration(
  tin: string,
  config: DPSTaxConfig
): Promise<DPSTaxCompany | null> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/registration`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tin }),
      signal: AbortSignal.timeout(config.timeout || DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('DPS Tax Cabinet: Invalid API token');
      }
      if (response.status === 404) {
        return null; // Entity not found
      }
      if (response.status === 429) {
        throw new Error('DPS Tax Cabinet: Rate limit exceeded');
      }
      throw new Error(`DPS Tax Cabinet: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }

    const record = Array.isArray(data) ? data[0] : data;
    
    return {
      sourceType: 'DPS_TAX_CABINET',
      tin: record.tin || record.TIN,
      name: record.name || record.NAME,
      status: record.status || record.STATUS,
      registrationDate: record.registrationDate || record.REGISTRATION_DATE,
      taxAuthority: record.taxAuthority || record.TAX_AUTHORITY,
      address: record.address || record.ADDRESS,
      rawData: record,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('DPS Tax Cabinet: Request timeout');
      }
      throw error;
    }
    throw new Error('DPS Tax Cabinet: Unknown error');
  }
}

/**
 * Fetch non-profit organization status from DPS Tax Cabinet
 * 
 * Endpoint: /non-profit
 * Method: GET
 * Authentication: Bearer token
 */
export async function fetchNonProfitStatus(
  tin: string,
  config: DPSTaxConfig
): Promise<DPSTaxCompany | null> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/non-profit`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(config.timeout || DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('DPS Tax Cabinet: Invalid API token');
      }
      if (response.status === 404) {
        return null; // Entity not found
      }
      if (response.status === 429) {
        throw new Error('DPS Tax Cabinet: Rate limit exceeded');
      }
      throw new Error(`DPS Tax Cabinet: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // The API returns a list, we need to find the matching TIN
    const records = Array.isArray(data) ? data : [data];
    const record = records.find((r: any) => r.tin === tin || r.TIN === tin);
    
    if (!record) {
      return null;
    }

    return {
      sourceType: 'DPS_TAX_CABINET',
      tin: record.tin || record.TIN,
      name: record.name || record.NAME,
      status: record.status || record.STATUS,
      registrationDate: record.registrationDate || record.REGISTRATION_DATE,
      isNonProfit: true,
      taxAuthority: record.taxAuthority || record.TAX_AUTHORITY,
      address: record.address || record.ADDRESS,
      rawData: record,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('DPS Tax Cabinet: Request timeout');
      }
      throw error;
    }
    throw new Error('DPS Tax Cabinet: Unknown error');
  }
}

/**
 * Main connector function - fetches comprehensive tax data from DPS Tax Cabinet
 * 
 * This function tries multiple endpoints in order:
 * 1. VAT Payer Register
 * 2. Tax Registration Data
 * 3. Non-Profit Organizations
 * 
 * Returns the first successful result or null if not found.
 */
export async function fetchDPSTaxCabinet(
  identifier: string,
  config: DPSTaxConfig
): Promise<DPSTaxCompany | null> {
  // Try VAT Payer Register first
  try {
    const vatResult = await fetchVATPayerStatus(identifier, config);
    if (vatResult) {
      return vatResult;
    }
  } catch (error) {
    console.error('[DPS Tax Cabinet] VAT Payer Register error:', error);
  }

  // Try Tax Registration Data
  try {
    const registrationResult = await fetchTaxRegistration(identifier, config);
    if (registrationResult) {
      return registrationResult;
    }
  } catch (error) {
    console.error('[DPS Tax Cabinet] Tax Registration error:', error);
  }

  // Try Non-Profit Organizations
  try {
    const nonProfitResult = await fetchNonProfitStatus(identifier, config);
    if (nonProfitResult) {
      return nonProfitResult;
    }
  } catch (error) {
    console.error('[DPS Tax Cabinet] Non-Profit Register error:', error);
  }

  return null;
}
