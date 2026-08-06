import { dataSourceGovernor } from '../governor';
import { DataSourceResult } from '../types';

export interface LicenseItem {
  licenseNumber: string;
  issueDate: string;
  activityType: string;
  issuerName: string;
  status: 'ДІЙСНА' | 'АНУЛЬОВАНА' | 'ПРИЗУПИНЕНА';
}

export interface StateRegistriesProfile {
  edrpou: string;
  licenses: LicenseItem[];
  isDiiaCityResident: boolean;
  diiaCityResidentSince?: string;
  amcuViolationsCount: number;
  amcuDecisionsSummary: string[];
}

export async function fetchLicensesAndRegistries(edrpou: string): Promise<DataSourceResult<StateRegistriesProfile>> {
  if (!edrpou || !/^\d{8,10}$/.test(edrpou.trim())) {
    return {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Невірний код ЄДРПОУ для перевірки ліцензій та реєстрів.',
        attemptedAt: new Date().toISOString(),
      },
    };
  }

  const cleanCode = edrpou.trim();
  const sourceKey = `licenses-registries-${cleanCode}`;
  const sourceName = 'Єдиний державний реєстр ліцензій та Дія.City';
  const sourceUrl = `https://data.gov.ua/dataset/licenses_registry?code=${cleanCode}`;

  return dataSourceGovernor.fetchWithGovernance<StateRegistriesProfile>(
    sourceKey,
    sourceName,
    sourceUrl,
    24 * 60 * 60 * 1000, // 24h cache
    async () => {
      // Query Diia.City Registry
      const diiaRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=diia_city_residents&q=${cleanCode}`);
      let isDiiaCity = false;
      let diiaSince = undefined;

      if (diiaRes.ok) {
        const diiaData = await diiaRes.json();
        if (diiaData.success && diiaData.result?.records?.length > 0) {
          isDiiaCity = true;
          diiaSince = diiaData.result.records[0].DATE || 'НЕМАЄ ДАНИХ';
        }
      }

      // Query AMCU Decisions Register
      const amcuRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=amcu_blacklisted_companies&q=${cleanCode}`);
      let amcuCount = 0;
      const amcuDecisions: string[] = [];

      if (amcuRes.ok) {
        const amcuData = await amcuRes.json();
        if (amcuData.success && amcuData.result?.records?.length > 0) {
          amcuCount = amcuData.result.records.length;
          amcuData.result.records.forEach((rec: any) => {
            amcuDecisions.push(rec.DECISION || 'НЕМАЄ ДАНИХ');
          });
        }
      }

      return {
        edrpou: cleanCode,
        licenses: [],
        isDiiaCityResident: isDiiaCity,
        diiaCityResidentSince: diiaSince,
        amcuViolationsCount: amcuCount,
        amcuDecisionsSummary: amcuDecisions,
      };
    }
  );
}
