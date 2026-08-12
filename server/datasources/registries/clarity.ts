import { dataSourceGovernor } from '../governor';
import { DataSourceResult } from '../types';

export interface ClarityCompany {
  edrpou: string;
  fullName: string;
  shortName: string;
  status: 'ACTIVE' | 'TERMINATED' | 'BANKRUPT' | 'SUSPENDED';
  registrationDate: string;
  terminationDate?: string;
  director: string;
  address: string;
  kved: string[];
  kvedDescription: string[];
  founders: Array<{ name: string; sharePercent: number; country?: string }>;
  beneficiaries: Array<{ name: string; sharePercent: number; country?: string }>;
  capital: number;
  head: string;
}

/**
 * Clarity Project API - PRIMARY EDR Source
 * Documentation: https://clarity-project.info/api
 * Cost: 1.23 UAH/request
 * Real-time query capability
 */
export async function fetchClarityEdr(edrpou: string): Promise<DataSourceResult<ClarityCompany>> {
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
  const sourceKey = `clarity-edr-${cleanCode}`;
  const sourceName = 'Clarity Project API';
  const sourceUrl = `https://api.clarity-project.info/edr/edr/${cleanCode}`;

  return dataSourceGovernor.fetchWithGovernance<ClarityCompany>(
    sourceKey,
    sourceName,
    sourceUrl,
    24 * 60 * 60 * 1000, // 24h cache
    async () => {
      // Query Clarity Project API
      const response = await fetch(sourceUrl, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw {
          code: 'UPSTREAM_FAILURE',
          message: `Clarity API недоступний: HTTP ${response.status}.`,
        };
      }

      const data = await response.json();

      if (!data || !data.edrpou) {
        throw {
          code: 'NO_RECORDS',
          message: `Запис для ${cleanCode} не знайдено у Clarity Project.`,
        };
      }

      // Map Clarity API response to our schema
      return {
        edrpou: data.edrpou || cleanCode,
        fullName: data.name || data.full_name || 'НЕМАЄ ДАНИХ',
        shortName: data.short_name || data.name || 'НЕМАЄ ДАНИХ',
        status: mapClarityStatus(data.status),
        registrationDate: data.registration_date || data.created_at || 'НЕМАЄ ДАНИХ',
        terminationDate: data.termination_date || null,
        director: data.head || data.boss || 'НЕМАЄ ДАНИХ',
        address: data.address || 'НЕМАЄ ДАНИХ',
        kved: Array.isArray(data.kved) ? data.kved : (data.kved ? [data.kved] : []),
        kvedDescription: Array.isArray(data.kved_name) ? data.kved_name : (data.kved_name ? [data.kved_name] : []),
        founders: data.founders || [],
        beneficiaries: data.beneficiaries || [],
        capital: data.capital || 0,
        head: data.head || 'НЕМАЄ ДАНИХ'
      };
    }
  );
}

function mapClarityStatus(status: string): 'ACTIVE' | 'TERMINATED' | 'BANKRUPT' | 'SUSPENDED' {
  if (!status) return 'ACTIVE';
  
  const normalized = status.toLowerCase();
  if (normalized.includes('terminated') || normalized.includes('припинено') || normalized.includes('скасовано')) {
    return 'TERMINATED';
  }
  if (normalized.includes('bankrupt') || normalized.includes('банкрут')) {
    return 'BANKRUPT';
  }
  if (normalized.includes('suspended') || normalized.includes('призупинено')) {
    return 'SUSPENDED';
  }
  return 'ACTIVE';
}
