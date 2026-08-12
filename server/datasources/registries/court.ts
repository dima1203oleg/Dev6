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
      const courtCases: CourtCaseItem[] = [];
      let isBankrupt = false;
      let bankruptcyStage = undefined;
      const enforcements: EnforcementItem[] = [];

      // PRIMARY: Use data.gov.ua court decisions open data
      // The official court API requires authentication/CAPTCHA, so we use the open data portal
      try {
        const courtRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=2a970e33-053a-4e5a-b48f-7de98a275eae&q=${cleanCode}`, {
          signal: AbortSignal.timeout(30000)
        });

        if (courtRes.ok) {
          const courtData = await courtRes.json();
          if (courtData.success && courtData.result?.records) {
            courtData.result.records.slice(0, 10).forEach((rec: any) => {
              courtCases.push({
                caseNumber: rec.case_number || rec.CASE_NUMBER || 'НЕМАЄ ДАНИХ',
                courtName: rec.court_name || rec.COURT_NAME || 'НЕМАЄ ДАНИХ',
                judgeName: rec.judge_name || undefined,
                caseType: rec.case_type || rec.TYPE || 'ГОСПОДАРСЬКЕ',
                status: rec.status || rec.STATUS || 'НЕМАЄ ДАНИХ',
                date: rec.date || rec.DATE || 'НЕМАЄ ДАНИХ',
                summary: rec.summary || rec.SUMMARY || 'НЕМАЄ ДАНИХ',
              });
            });
          }
        }
      } catch (e) {
        console.log(`[Court Connector] Primary data.gov.ua fetch failed:`, e);
      }

      // Query Bankruptcy Register via data.gov.ua
      try {
        const bankrRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=2e6e8e40-63b5-44c9-b5a2-505b9f1e9a9a&q=${cleanCode}`);
        if (bankrRes.ok) {
          const bankrData = await bankrRes.json();
          if (bankrData.success && bankrData.result?.records?.length > 0) {
            isBankrupt = true;
            bankruptcyStage = bankrData.result.records[0].stage || bankrData.result.records[0].STAGE || 'Відкрито провадження у справі про банкрутство';
          }
        }
      } catch (e) {
        console.log(`[Court Connector] Bankruptcy query failed:`, e);
      }

      // Query Enforcement Proceedings Register via data.gov.ua
      try {
        const erbRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=3e4e8e40-63b5-44c9-b5a2-505b9f1e9a9b&q=${cleanCode}`);
        if (erbRes.ok) {
          const erbData = await erbRes.json();
          if (erbData.success && erbData.result?.records) {
            erbData.result.records.slice(0, 10).forEach((rec: any) => {
              enforcements.push({
                vpNumber: rec.vp_number || rec.VP_NUM || rec.number || 'НЕМАЄ ДАНИХ',
                creditor: rec.creditor || rec.CREDITOR || 'НЕМАЄ ДАНИХ',
                debtor: rec.debtor || rec.DEBTOR || cleanCode,
                category: rec.category || rec.CATEGORY || 'НЕМАЄ ДАНИХ',
                status: rec.status || 'ОТКРЫТО',
                department: rec.department || rec.DEPT || 'НЕМАЄ ДАНИХ',
                startDate: rec.start_date || rec.DATE || 'НЕМАЄ ДАНИХ',
              });
            });
          }
        }
      } catch (e) {
        console.log(`[Court Connector] Enforcement query failed:`, e);
      }

      if (courtCases.length === 0 && !isBankrupt && enforcements.length === 0) {
        throw {
          code: 'NO_RECORDS',
          message: `Судові справи для ${cleanCode} не знайдено.`,
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
