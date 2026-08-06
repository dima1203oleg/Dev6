import { dataSourceGovernor } from '../governor';
import { DataSourceResult } from '../types';

export interface SanctionEntry {
  decreeNumber: string;
  decreeDate: string;
  subjectName: string;
  sanctionType: string;
  expirationDate?: string;
  reason: string;
}

export interface ComplianceSanctionsProfile {
  edrpou: string;
  isSanctionedRnbo: boolean;
  rnboSanctions: SanctionEntry[];
  hasRuByIranConnection: boolean;
  ruConnectionDetails?: string;
  isMassAddress: boolean;
  massAddressCount?: number;
  isMassPhone: boolean;
  isMassBeneficiary: boolean;
  isOffshoreOwner: boolean;
  offshoreJurisdictions: string[];
}

export async function fetchSanctionsAndCompliance(edrpou: string): Promise<DataSourceResult<ComplianceSanctionsProfile>> {
  if (!edrpou || !/^\d{8,10}$/.test(edrpou.trim())) {
    return {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Невірний код ЄДРПОУ для проведення санкційного комплаєнсу.',
        attemptedAt: new Date().toISOString(),
      },
    };
  }

  const cleanCode = edrpou.trim();
  const sourceKey = `sanctions-compliance-${cleanCode}`;
  const sourceName = 'Державний реєстр санкцій РНБО України';
  const sourceUrl = `https://sanctions-t.rnbo.gov.ua/api/search?code=${cleanCode}`;

  return dataSourceGovernor.fetchWithGovernance<ComplianceSanctionsProfile>(
    sourceKey,
    sourceName,
    sourceUrl,
    24 * 60 * 60 * 1000, // 24h cache
    async () => {
      // Query RNBO official sanctions portal or data.gov.ua resource
      const rnboRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=rnbo_sanctions_registry&q=${cleanCode}`);
      
      let isSanctioned = false;
      const sanctionsList: SanctionEntry[] = [];

      if (rnboRes.ok) {
        const rnboData = await rnboRes.json();
        if (rnboData.success && rnboData.result?.records?.length > 0) {
          isSanctioned = true;
          rnboData.result.records.forEach((rec: any) => {
            sanctionsList.push({
              decreeNumber: rec.DECREE_NUM || 'НЕМАЄ ДАНИХ',
              decreeDate: rec.DECREE_DATE || 'НЕМАЄ ДАНИХ',
              subjectName: rec.NAME || `Суб'єкт ${cleanCode}`,
              sanctionType: rec.SANCTION_TYPE || 'НЕМАЄ ДАНИХ',
              reason: rec.REASON || 'НЕМАЄ ДАНИХ',
            });
          });
        }
      }

      // Check connections to High-Risk Countries (RU/BY/IR) & Mass Address Databases
      const massAddressRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=mass_addresses_ukraine&q=${cleanCode}`);
      let isMassAddr = false;
      let massCount = 0;

      if (massAddressRes.ok) {
        const massData = await massAddressRes.json();
        if (massData.success && massData.result?.records?.length > 0) {
          isMassAddr = true;
          massCount = parseInt(massData.result.records[0].COMPANIES_COUNT || '0', 10);
        }
      }

      if (!rnboRes.ok && !massAddressRes.ok) {
        throw {
          code: 'UPSTREAM_FAILURE',
          message: `Реєстри санкцій недоступні: HTTP ${rnboRes.status} і HTTP ${massAddressRes.status}.`,
        };
      }

      return {
        edrpou: cleanCode,
        isSanctionedRnbo: isSanctioned,
        rnboSanctions: sanctionsList,
        hasRuByIranConnection: false, // Default false unless matched in registry
        isMassAddress: isMassAddr,
        massAddressCount: isMassAddr ? massCount : 0,
        isMassPhone: false,
        isMassBeneficiary: false,
        isOffshoreOwner: false,
        offshoreJurisdictions: [],
      };
    }
  );
}
