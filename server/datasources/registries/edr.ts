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
      
      const data = await response.json();
      
      // Parse real EDR data from CKAN response
      // The CKAN API returns data in result.records array
      if (!data.result || !data.result.records || !Array.isArray(data.result.records)) {
        throw new Error('Invalid EDR API response structure');
      }
      
      // Find matching record by EDRPOU
      const record = data.result.records.find((r: any) => 
        r.edrpou === cleanCode || r.code === cleanCode
      );
      
      if (!record) {
        throw new Error(`Company with EDRPOU ${cleanCode} not found in EDR registry`);
      }
      
      // Map CKAN record to EdrCompany interface
      const company: EdrCompany = {
        edrpou: record.edrpou || record.code || cleanCode,
        fullName: record.full_name || record.name || 'Unknown',
        shortName: record.short_name || record.name || 'Unknown',
        status: record.status === 'registered' ? 'ACTIVE' : 
                record.status === 'terminated' ? 'TERMINATED' :
                record.status === 'bankrupt' ? 'BANKRUPT' :
                record.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE',
        registrationDate: record.registration_date || record.created_at || new Date().toISOString().split('T')[0],
        director: record.director || record.head || 'Unknown',
        address: record.address || record.location || 'Unknown',
        kved: record.kved || record.activity_code || 'Unknown',
        kvedDescription: record.kved_description || record.activity_name || 'Unknown',
        founders: record.founders || record.beneficiaries || [],
        beneficiaries: record.beneficiaries || [],
        history: record.history || []
      };
      
      return company;
    }
  );
}
