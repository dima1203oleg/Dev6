import { dataSourceGovernor } from '../governor';
import { DataSourceResult } from '../types';

export interface TaxStatus {
  edrpou: string;
  isVatPayer: boolean;
  vatPayerNumber?: string;
  vatStatus?: string;
  isSingleTaxPayer: boolean;
  singleTaxGroup?: number;
  isNonProfit: boolean;
  hasTaxDebt: boolean;
  debtAmountUah: number;
  debtType?: string;
  taxInspectionOffice: string;
  lastVerifiedAt: string;
}

export async function fetchTaxStatus(edrpou: string): Promise<DataSourceResult<TaxStatus>> {
  if (!edrpou || !/^\d{8,10}$/.test(edrpou.trim())) {
    return {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Невірний код ЄДРПОУ для перевірки податкового стану.',
        attemptedAt: new Date().toISOString(),
      },
    };
  }

  const cleanCode = edrpou.trim();
  const sourceKey = `tax-status-${cleanCode}`;
  const sourceName = 'Державна податкова служба (ДПС України)';
  const sourceUrl = `https://cabinet.tax.gov.ua/ws/registry/public?code=${cleanCode}`;

  return dataSourceGovernor.fetchWithGovernance<TaxStatus>(
    sourceKey,
    sourceName,
    sourceUrl,
    12 * 60 * 60 * 1000, // 12h cache
    async () => {
      // Query DPS public portal / Data.gov.ua Tax registry resource
      const dpsRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=tax_debts_register&q=${cleanCode}`);
      
      let debtUah = 0;
      let hasDebt = false;
      let dpsOffice = 'НЕМАЄ ДАНИХ';

      if (dpsRes.ok) {
        const dpsData = await dpsRes.json();
        if (dpsData.success && dpsData.result?.records?.length > 0) {
          const record = dpsData.result.records[0];
          debtUah = parseFloat(record.SUM_DEBT || record.debt || '0');
          hasDebt = debtUah > 0;
          dpsOffice = record.TAX_OFFICE || dpsOffice;
        }
      }

      // Check VAT Registry on data.gov.ua
      const vatRes = await fetch(`https://data.gov.ua/api/3/action/datastore_search?resource_id=vat_payers_registry&q=${cleanCode}`);
      let isVat = false;
      let vatNum = undefined;

      if (vatRes.ok) {
        const vatData = await vatRes.json();
        if (vatData.success && vatData.result?.records?.length > 0) {
          isVat = true;
          vatNum = vatData.result.records[0].VAT_NUMBER;
        }
      }

      if (!dpsRes.ok && !vatRes.ok) {
        throw {
          code: 'UPSTREAM_FAILURE',
          message: `Податкові реєстри недоступні: HTTP ${dpsRes.status} і HTTP ${vatRes.status}.`,
        };
      }

      return {
        edrpou: cleanCode,
        isVatPayer: isVat,
        vatPayerNumber: vatNum,
        vatStatus: isVat ? 'ДІЙСНЕ РЕЄСТРАЦІЙНЕ СВІДОЦТВО' : 'НЕЗАРЕЄСТРОВАНО',
        isSingleTaxPayer: false, // Default to false if we don't know
        singleTaxGroup: undefined,
        isNonProfit: false,
        hasTaxDebt: hasDebt,
        debtAmountUah: debtUah,
        debtType: hasDebt ? 'Податковий борг' : undefined,
        taxInspectionOffice: dpsOffice,
        lastVerifiedAt: new Date().toISOString(),
      };
    }
  );
}
