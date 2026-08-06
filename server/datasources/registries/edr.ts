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
      // Query Ukraine State Open Data Portal API (data.gov.ua CKAN API)
      const ckanRes = await fetch(sourceUrl);
      
      if (ckanRes.ok) {
        const ckanData = await ckanRes.json();
        if (ckanData.success && ckanData.result?.records?.length > 0) {
          const rec = ckanData.result.records[0];
          return {
            edrpou: cleanCode,
            fullName: rec.NAME || rec.full_name || rec.SHORT_NAME || 'НЕМАЄ ДАНИХ',
            shortName: rec.SHORT_NAME || rec.NAME || 'НЕМАЄ ДАНИХ',
            status: rec.STATUS === 'скасовано' ? 'TERMINATED' : 'ACTIVE',
            registrationDate: rec.REGISTRATION_DATE || 'НЕМАЄ ДАНИХ',
            director: rec.BOSS || 'НЕМАЄ ДАНИХ',
            address: rec.ADDRESS || 'НЕМАЄ ДАНИХ',
            kved: rec.KVED || 'НЕМАЄ ДАНИХ',
            kvedDescription: rec.KVED_NAME || 'НЕМАЄ ДАНИХ',
            founders: rec.FOUNDERS ? [{ name: rec.FOUNDERS, sharePercent: 100 }] : [],
            beneficiaries: rec.BENEFICIARIES ? [{ name: rec.BENEFICIARIES, sharePercent: 100 }] : [],
            history: [],
          };
        }
      }

      throw {
        code: ckanRes.ok ? 'NO_RECORDS' : 'UPSTREAM_FAILURE',
        message: ckanRes.ok
          ? `Запис для ${cleanCode} не знайдено у ЄДР.`
          : `ЄДР недоступний: HTTP ${ckanRes.status}.`,
      };
    }
  );
}
