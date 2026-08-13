import { getDatabaseClient } from '../../database/DatabaseClient';
import {
  NAISEDRRepository,
  NAISEDRStoredRecord,
} from '../../database/repositories/NAISEDRRepository';
import { dataSourceGovernor } from '../governor';
import { DataSourceResult } from '../types';

const NAIS_DATASET_URL = 'https://data.gov.ua/dataset/a1799820-195b-4982-8141-6e84f58103e7';

export interface NAISEDRCompany {
  type: 'FOP' | 'UO';
  recordNumber: string;
  name: string;
  shortName?: string;
  edrpou?: string;
  status?: string;
  registration?: string;
  /** Exact published fields, retained for consumers that need NAIS-specific data. */
  fields: Record<string, string>;
  provenance: {
    sourceId: 'nais-edr-xml';
    retrievalTimestamp: string;
    sourceUrl: string;
    fileHash: string;
    importId: string;
    importedAt: string;
  };
}

function mapRecord(record: NAISEDRStoredRecord): NAISEDRCompany {
  return {
    type: record.sourceType,
    recordNumber: record.recordNumber,
    name: record.fullName,
    shortName: record.shortName ?? undefined,
    edrpou: record.edrpou ?? undefined,
    status: record.status ?? undefined,
    registration: record.registration ?? undefined,
    fields: record.rawData,
    provenance: {
      sourceId: 'nais-edr-xml',
      retrievalTimestamp: new Date().toISOString(),
      sourceUrl: record.sourceUrl,
      fileHash: record.sourceArchiveSha256,
      importId: record.importId,
      importedAt: record.importedAt.toISOString(),
    },
  };
}

/**
 * Looks up the local NAIS EDR batch index.  The XML archive is intentionally
 * never fetched on the request path: the importer validates and publishes a
 * complete index before this connector can serve it.
 */
export async function fetchNAISEDR(identifier: string): Promise<DataSourceResult<NAISEDRCompany>> {
  if (!identifier || !/^\d{8,10}$/.test(identifier.trim())) {
    return {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Невірний формат коду ЄДРПОУ/ІПН. Очікується 8 або 10 цифр.',
        attemptedAt: new Date().toISOString(),
      },
    };
  }

  const cleanCode = identifier.trim();
  return dataSourceGovernor.fetchWithGovernance<NAISEDRCompany>(
    `nais-edr-index-${cleanCode}`,
    'NAIS EDR XML (Мін\'юст)',
    NAIS_DATASET_URL,
    5 * 60 * 1000,
    async () => {
      const repository = new NAISEDRRepository(getDatabaseClient());
      const record = await repository.findCurrentByIdentifier(cleanCode);
      if (record) return mapRecord(record);

      const expectedSource = cleanCode.length === 10 ? 'FOP' : 'UO';
      const importStatus = await repository.findLatestSuccessfulImport(expectedSource);
      if (!importStatus) {
        throw {
          code: 'UPSTREAM_FAILURE',
          message: `NAIS EDR індекс ${expectedSource} ще не створено або останній імпорт не завершився успішно.`,
        };
      }
      throw {
        code: 'NO_RECORDS',
        message: `Запис для ${cleanCode} не знайдено в актуальному індексі NAIS EDR.`,
      };
    },
  );
}

/** Returns index freshness and coverage for health checks or dashboards. */
export async function getNAISEDRIndexStatus() {
  const repository = new NAISEDRRepository(getDatabaseClient());
  const [fop, uo] = await Promise.all([
    repository.findLatestSuccessfulImport('FOP'),
    repository.findLatestSuccessfulImport('UO'),
  ]);
  return { fop, uo };
}
