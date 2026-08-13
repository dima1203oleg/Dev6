/**
 * RNBO Sanctions API Connector
 * 
 * Provides access to Ukrainian sanctions data through OpenSanctions API.
 * Based on the State Register of Sanctions maintained by NSDC (РНБО).
 * 
 * Documentation: https://www.opensanctions.org/docs/api/
 * 
 * Phase 1 Implementation:
 * - Entity matching (/match)
 * - Full-text search (/search)
 */

export interface RNBOEntity {
  sourceType: 'RNBO_SANCTIONS';
  id: string;
  schema: 'Person' | 'Organization' | 'Company';
  name: string;
  dataset: string;
  isSanctioned: boolean;
  sanctions?: RNBOSanction[];
  identifiers?: RNBOIdentifier[];
  rawData?: any;
}

export interface RNBOIdentifier {
  scheme: string;
  id: string;
}

export interface RNBOSanction {
  program: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  measures?: string[];
}

export interface RNBOConfig {
  baseUrl?: string;
  timeout?: number;
}

const DEFAULT_BASE_URL = 'https://api.opensanctions.org';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Match entity against sanctions database
 * 
 * Endpoint: /match
 * Method: POST
 * Authentication: None required
 */
export async function matchEntity(
  query: {
    schema?: 'Person' | 'Organization' | 'Company';
    properties: {
      name?: string;
      birthDate?: string;
      nationality?: string;
      registrationNumber?: string;
      taxId?: string;
      [key: string]: any;
    };
  },
  config: RNBOConfig = {}
): Promise<RNBOEntity | null> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/match`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset: 'ua_nsdc_sanctions',
        ...query,
      }),
      signal: AbortSignal.timeout(config.timeout || DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Entity not found
      }
      if (response.status === 429) {
        throw new Error('OpenSanctions API: Rate limit exceeded');
      }
      throw new Error(`OpenSanctions API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if we have matching results
    if (!data.results || data.results.length === 0) {
      return null;
    }

    // Return the best match (first result)
    const match = data.results[0];
    return normalizeOpenSanctionsEntity(match);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('OpenSanctions API: Request timeout');
      }
      throw error;
    }
    throw new Error('OpenSanctions API: Unknown error');
  }
}

/**
 * Search for entities in sanctions database
 * 
 * Endpoint: /search
 * Method: GET
 * Authentication: None required
 */
export async function searchSanctions(
  query: string,
  config: RNBOConfig = {}
): Promise<RNBOEntity[]> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/search`;
  
  try {
    const response = await fetch(`${url}?q=${encodeURIComponent(query)}&dataset=ua_nsdc_sanctions`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(config.timeout || DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('OpenSanctions API: Rate limit exceeded');
      }
      throw new Error(`OpenSanctions API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if we have results
    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Normalize all results
    return data.results.map((result: any) => normalizeOpenSanctionsEntity(result));
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('OpenSanctions API: Request timeout');
      }
      throw error;
    }
    throw new Error('OpenSanctions API: Unknown error');
  }
}

/**
 * Check if a specific identifier is under sanctions
 * 
 * This is a convenience function that tries multiple search strategies
 */
export async function checkSanctionsStatus(
  identifier: string,
  config: RNBOConfig = {}
): Promise<RNBOEntity | null> {
  // Try entity matching first
  try {
    const matchResult = await matchEntity({
      properties: {
        name: identifier,
      },
    }, config);
    
    if (matchResult && matchResult.isSanctioned) {
      return matchResult;
    }
  } catch (error) {
    console.error('[RNBO Sanctions] Entity matching failed:', error);
  }

  // Try full-text search as fallback
  try {
    const searchResults = await searchSanctions(identifier, config);
    
    if (searchResults.length > 0) {
      // Return the first result
      return searchResults[0];
    }
  } catch (error) {
    console.error('[RNBO Sanctions] Search failed:', error);
  }

  return null;
}

/**
 * Normalize OpenSanctions API response to internal format
 */
function normalizeOpenSanctionsEntity(data: any): RNBOEntity {
  const properties = data.properties || {};
  const sanctions = properties.sanctions || [];
  
  return {
    sourceType: 'RNBO_SANCTIONS',
    id: data.id,
    schema: data.schema || 'Person',
    name: properties.name || data.name || '',
    dataset: data.dataset || 'ua_nsdc_sanctions',
    isSanctioned: sanctions.length > 0,
    sanctions: sanctions.map((sanction: any) => ({
      program: sanction.program || 'Unknown',
      startDate: sanction.startDate,
      endDate: sanction.endDate,
      reason: sanction.reason,
      measures: sanction.measures || [],
    })),
    identifiers: properties.identifiers || [],
    rawData: data,
  };
}

/**
 * Main connector function - checks sanctions status
 * 
 * This function tries multiple strategies to determine if an entity
 * is under Ukrainian sanctions.
 */
export async function fetchRNBOsanctions(
  identifier: string,
  config: RNBOConfig = {}
): Promise<RNBOEntity | null> {
  return await checkSanctionsStatus(identifier, config);
}
