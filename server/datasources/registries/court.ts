import { dataSourceGovernor } from '../governor';
import { DataSourceResult } from '../types';

export interface CourtCaseItem {
  caseNumber: string;
  courtName: string;
  judgeName?: string;
  caseType: 'ГОСПОДАРСЬКЕ' | 'ЦИВІЛЬНЕ' | 'АДМІНІСТРАТИВНЕ' | 'КРИМІНАЛЬНЕ';
  status: string;
  date: string;
  summary: string;
}

export interface EnforcementItem {
  vpNumber: string;
  creditor: string;
  debtor: string;
  category: string;
  status: 'ОТКРЫТО' | 'ЗАВЕРШЕНО' | 'ЗУПИНЕНО';
  department: string;
  startDate: string;
}

export interface LegalProfile {
  edrpou: string;
  courtCasesCount: number;
  courtCases: CourtCaseItem[];
  isBankrupt: boolean;
  bankruptcyStage?: string;
  activeEnforcementsCount: number;
  enforcementProceedings: EnforcementItem[];
}

export async function fetchCourtAndLegalProfile(edrpou: string): Promise<DataSourceResult<LegalProfile>> {
  if (!edrpou || !/^\d{8,10}$/.test(edrpou.trim())) {
    return {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Невірний код ЄДРПОУ для пошуку судових справ.',
        attemptedAt: new Date().toISOString(),
      },
    };
  }

  const cleanCode = edrpou.trim();
  const sourceKey = `court-legal-${cleanCode}`;
  const sourceName = 'Єдиний державний реєстр судових рішень (ЄДРСР) та Реєстр боржників Мін\'юсту';
  const sourceUrl = `https://reyestr.court.gov.ua/search?code=${cleanCode}`;

  return dataSourceGovernor.fetchWithGovernance<LegalProfile>(
    sourceKey,
    sourceName,
    sourceUrl,
    6 * 60 * 60 * 1000, // 6h cache
    async () => {
      // Query Court Registry Open Data resource
      const courtRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=court_decisions_opendata&q=${cleanCode}`);
      const courtCases: CourtCaseItem[] = [];

      if (courtRes.ok) {
        const courtData = await courtRes.json();
        if (courtData.success && courtData.result?.records) {
          courtData.result.records.slice(0, 10).forEach((rec: any) => {
            courtCases.push({
              caseNumber: rec.CASE_NUMBER || rec.number || 'НЕМАЄ ДАНИХ',
              courtName: rec.COURT_NAME || 'НЕМАЄ ДАНИХ',
              caseType: rec.TYPE || 'ГОСПОДАРСЬКЕ',
              status: rec.STATUS || 'НЕМАЄ ДАНИХ',
              date: rec.DATE || 'НЕМАЄ ДАНИХ',
              summary: rec.SUMMARY || 'НЕМАЄ ДАНИХ',
            });
          });
        }
      }

      // Query Bankruptcy Register
      const bankrRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=bankruptcy_register&q=${cleanCode}`);
      let isBankrupt = false;
      let bankruptcyStage = undefined;

      if (bankrRes.ok) {
        const bankrData = await bankrRes.json();
        if (bankrData.success && bankrData.result?.records?.length > 0) {
          isBankrupt = true;
          bankruptcyStage = bankrData.result.records[0].STAGE || 'Відкрито провадження у справі про банкрутство';
        }
      }

      // Query Enforcement Proceedings Register (ЕРБ / АСВП)
      const erbRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=enforcement_proceedings&q=${cleanCode}`);
      const enforcements: EnforcementItem[] = [];

      if (erbRes.ok) {
        const erbData = await erbRes.json();
        if (erbData.success && erbData.result?.records) {
          erbData.result.records.slice(0, 10).forEach((rec: any) => {
            enforcements.push({
              vpNumber: rec.VP_NUM || rec.number || 'НЕМАЄ ДАНИХ',
              creditor: rec.CREDITOR || 'НЕМАЄ ДАНИХ',
              debtor: rec.DEBTOR || cleanCode,
              category: rec.CATEGORY || 'НЕМАЄ ДАНИХ',
              status: 'ОТКРЫТО',
              department: rec.DEPT || 'НЕМАЄ ДАНИХ',
              startDate: rec.DATE || 'НЕМАЄ ДАНИХ',
            });
          });
        }
      }

      if (!courtRes.ok && !bankrRes.ok && !erbRes.ok) {
        throw {
          code: 'UPSTREAM_FAILURE',
          message: `Судові реєстри недоступні: HTTP ${courtRes.status}, ${bankrRes.status}, ${erbRes.status}.`,
        };
      }

      return {
        edrpou: cleanCode,
        courtCasesCount: courtCases.length,
        courtCases,
        isBankrupt,
        bankruptcyStage,
        activeEnforcementsCount: enforcements.length,
        enforcementProceedings: enforcements,
      };
    }
  );
}
