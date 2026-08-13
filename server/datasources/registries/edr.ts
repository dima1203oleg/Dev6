import { dataSourceGovernor } from '../governor';
import { DataSourceResult } from '../types';

export interface EdrCompany {
  edrpou: string;
  fullName: string;
  shortName: string;
  status: 'ACTIVE' | 'TERMINATED' | 'BANKRUPT' | 'SUSPENDED';
  registrationDate: string;
  director: string;
  address: string;
  kved: string;
  kvedDescription: string;
  founders: Array<{ name: string; sharePercent: number; country?: string }>;
  beneficiaries: Array<{ name: string; sharePercent: number; country?: string }>;
  history: Array<{ date: string; changeType: string; description: string }>;
}

export async function fetchEdrFull(edrpou: string): Promise<DataSourceResult<EdrCompany>> {
  if (!edrpou || !/^\d{8,10}$/.test(edrpou.trim())) {
    return {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Невірний формат коду ЄДРПОУ/ІПН. Очікується 8 або 10 цифр.',
        attemptedAt: new Date().toISOString(),
      },
    };
  }

  const cleanCode = edrpou.trim();
  const sourceKey = `edr-full-${cleanCode}`;
  const sourceName = 'Єдиний державний реєстр (ЄДР)';
  const sourceUrl = `https://data.gov.ua/api/3/action/datastore_search?resource_id=edr_full_registry&q=${cleanCode}`;

  return dataSourceGovernor.fetchWithGovernance<EdrCompany>(
    sourceKey,
    sourceName,
    sourceUrl,
    24 * 60 * 60 * 1000, // 24h cache
    async () => {
      // PRODUCTION MODE: Query actual data.gov.ua CKAN API
      // No demo fallback - return error if source unavailable
      console.log(`[EDR] Fetching real data for ${cleanCode} from ${sourceUrl}`);
      
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`EDR API returned ${response.status}: ${response.statusText}`);
      }
      
      await response.json();
      
      // Parse real EDR data from CKAN response
      // This would need actual parsing logic based on the real API structure
      throw new Error('Real EDR API integration not yet implemented - SOURCE_UNAVAILABLE');
    }
  );
}
