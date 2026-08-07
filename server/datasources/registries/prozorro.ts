import { dataSourceGovernor } from '../governor';
import { DataSourceResult } from '../types';

export interface TenderItem {
  tenderId: string;
  title: string;
  status: string;
  value: {
    amount: number;
    currency: string;
  };
  procuringEntity: {
    name: string;
    identifier?: {
      id: string;
      legalName: string;
    };
  };
  date: string;
}

export interface ProcurementProfile {
  edrpou: string;
  totalTenders: number;
  wonTenders: number;
  participatedTenders: TenderItem[];
  recentTenders: TenderItem[];
}

export async function fetchProzorroProfile(edrpou: string): Promise<DataSourceResult<ProcurementProfile>> {
  if (!edrpou || !/^\d{8,10}$/.test(edrpou.trim())) {
    return {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Невірний код ЄДРПОУ для пошуку закупівель.',
        attemptedAt: new Date().toISOString(),
      },
    };
  }

  const cleanCode = edrpou.trim();
  const sourceKey = `prozorro-${cleanCode}`;
  const sourceName = 'Система публічних закупівель Prozorro';
  const sourceUrl = `https://public-api.prozorro.gov.ua/api/2.5/tenders`;

  return dataSourceGovernor.fetchWithGovernance<ProcurementProfile>(
    sourceKey,
    sourceName,
    sourceUrl,
    6 * 60 * 60 * 1000, // 6h cache
    async () => {
      // Query official Prozorro public API
      const prozorroRes = await fetch(
        `https://public-api.prozorro.gov.ua/api/2.5/tenders?opt_schema=ocds&descending=1&limit=50`
      );
      
      const participatedTenders: TenderItem[] = [];
      const wonTenders: TenderItem[] = [];
      let totalTenders = 0;

      if (prozorroRes.ok) {
        const prozorroData = await prozorroRes.json();
        if (prozorroData.data && Array.isArray(prozorroData.data)) {
          prozorroData.data.forEach((tender: any) => {
            const entityIdentifier = tender.procuringEntity?.identifier?.id;
            const isParticipant = entityIdentifier === cleanCode;
            
            if (isParticipant || tender.procuringEntity?.name?.includes(cleanCode)) {
              const tenderItem: TenderItem = {
                tenderId: tender.id || 'НЕМАЄ ДАНИХ',
                title: tender.title || 'НЕМАЄ ДАНИХ',
                status: tender.status || 'НЕМАЄ ДАНИХ',
                value: {
                  amount: tender.value?.amount || 0,
                  currency: tender.value?.currency || 'UAH',
                },
                procuringEntity: {
                  name: tender.procuringEntity?.name || 'НЕМАЄ ДАНИХ',
                  identifier: tender.procuringEntity?.identifier,
                },
                date: tender.date || 'НЕМАЄ ДАНИХ',
              };
              
              participatedTenders.push(tenderItem);
              
              // Count as won if status is 'complete' or 'active.awarded'
              if (tender.status === 'complete' || tender.status === 'active.awarded') {
                wonTenders.push(tenderItem);
              }
            }
          });
          totalTenders = participatedTenders.length;
        }
      }

      if (!prozorroRes.ok) {
        throw {
          code: 'UPSTREAM_FAILURE',
          message: `Prozorro API недоступний: HTTP ${prozorroRes.status}.`,
        };
      }

      return {
        edrpou: cleanCode,
        totalTenders,
        wonTenders: wonTenders.length,
        participatedTenders: participatedTenders.slice(0, 10),
        recentTenders: participatedTenders.slice(0, 5),
      };
    }
  );
}
