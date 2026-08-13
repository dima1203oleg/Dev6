import crypto from 'crypto';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { basename } from 'path';
import { getDatabaseClient } from '../../database/DatabaseClient';
import {
  NAISEDRImportMetrics,
  NAISEDRIndexedRecord,
  NAISEDRRepository,
  NAISEDRSourceType,
} from '../../database/repositories/NAISEDRRepository';
import { findXmlEntry, openZipEntryStream } from './zip';
import { NAISEDRRawRecord, NAISEDRSubjectParser } from './xml';

const DEFAULT_BATCH_SIZE = 500;

export interface NAISEDRIngestionRequest {
  sourceType: NAISEDRSourceType;
  archivePath: string;
  sourceUrl: string;
  batchSize?: number;
}

export interface NAISEDRIngestionResult extends NAISEDRImportMetrics {
  importId: string;
  sourceType: NAISEDRSourceType;
  archiveSha256: string;
  archiveSize: number;
  xmlEntryName: string;
  finishedAt: string;
}

function normaliseWhitespace(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function getFirst(record: NAISEDRRawRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = normaliseWhitespace(record[key]);
    if (value) return value;
  }
  return null;
}

function normaliseIdentifier(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return /^\d{8,10}$/.test(digits) ? digits : null;
}

function selectRecordNumber(record: NAISEDRRawRecord, sourceType: NAISEDRSourceType): string | null {
  return getFirst(record, sourceType === 'UO'
    ? ['RECORD', 'RECORD_NUMBER', 'ID', 'NUMBER']
    : ['RECORD', 'RECORD_NUMBER', 'ID', 'NUMBER']);
}

function normaliseRecord(
  record: NAISEDRRawRecord,
  sourceType: NAISEDRSourceType,
  importId: string,
  sourceUrl: string,
  sourceArchiveSha256: string,
): NAISEDRIndexedRecord | null {
  const recordNumber = selectRecordNumber(record, sourceType);
  const fullName = getFirst(record, ['NAME', 'FULL_NAME', 'FULLNAME']);
  if (!recordNumber || !fullName) return null;

  const explicitEdrpou = normaliseIdentifier(getFirst(record, [
    'EDRPOU',
    'EDRPOU_CODE',
    'EDRPOU_NUMBER',
    'CODE_EDRPOU',
  ]));
  // The published FOP schema may omit RNOKPP.  Never infer it from the
  // registry's internal RECORD number; only a declared identifier is indexed.
  const declaredFopIdentifier = normaliseIdentifier(getFirst(record, [
    'RNOKPP',
    'IPN',
    'TIN',
    'TAX_NUMBER',
    'TAXPAYER_ID',
  ]));
  const edrpou = sourceType === 'UO' ? explicitEdrpou : null;
  const lookupIdentifier = sourceType === 'FOP' ? declaredFopIdentifier : edrpou;
  const rawData = Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, normaliseWhitespace(value)])
      .filter((entry): entry is [string, string] => entry[1] !== null),
  );

  return {
    sourceType,
    recordNumber,
    lookupIdentifier,
    edrpou,
    fullName,
    shortName: getFirst(record, ['SHORT_NAME', 'SHORTNAME']),
    status: getFirst(record, ['STAN', 'STATUS', 'STATE']),
    registration: getFirst(record, ['REGISTRATION', 'REGISTRATION_DATE', 'REG_DATE']),
    rawData,
    rawHash: crypto.createHash('sha256').update(JSON.stringify(rawData)).digest('hex'),
    sourceUrl,
    sourceArchiveSha256,
    importId,
  };
}

async function sha256File(path: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk as Buffer);
  }
  return hash.digest('hex');
}

/**
 * Production batch importer for NAIS EDR XML.  It accepts a pre-downloaded
 * official archive because the source is too large and too slow to be fetched
 * on a customer request path.
 */
export class NAISEDRIngestion {
  private readonly repository: NAISEDRRepository;

  constructor(repository = new NAISEDRRepository(getDatabaseClient())) {
    this.repository = repository;
  }

  async ingest(request: NAISEDRIngestionRequest): Promise<NAISEDRIngestionResult> {
    const archive = await stat(request.archivePath);
    if (!archive.isFile()) {
      throw new Error(`NAIS archive '${request.archivePath}' is not a file.`);
    }

    const batchSize = request.batchSize ?? DEFAULT_BATCH_SIZE;
    if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5_000) {
      throw new Error('NAIS batchSize must be an integer from 1 to 5000.');
    }

    const archiveSha256 = await sha256File(request.archivePath);
    const previousImport = await this.repository.findSuccessfulImportByArchiveHash(
      request.sourceType,
      archiveSha256,
    );
    if (previousImport) {
      return {
        importId: previousImport.importId,
        sourceType: request.sourceType,
        archiveSha256,
        archiveSize: archive.size,
        xmlEntryName: previousImport.xmlEntryName,
        finishedAt: previousImport.finishedAt.toISOString(),
        recordsSeen: previousImport.recordsSeen,
        recordsIndexed: previousImport.recordsIndexed,
        recordsSkipped: 0,
        recordsFailed: 0,
      };
    }

    const xmlEntry = await findXmlEntry(request.archivePath);
    const importId = `nais-edr-${request.sourceType.toLowerCase()}-${crypto.randomUUID()}`;
    const metrics: NAISEDRImportMetrics = {
      recordsSeen: 0,
      recordsIndexed: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
    };
    let batch: NAISEDRIndexedRecord[] = [];

    await this.repository.startImport({
      importId,
      sourceType: request.sourceType,
      sourceUrl: request.sourceUrl,
      archivePath: request.archivePath,
      archiveSha256,
      archiveSize: archive.size,
      xmlEntryName: xmlEntry.name,
      startedAt: new Date(),
    });

    const flush = async (): Promise<void> => {
      if (batch.length === 0) return;
      await this.repository.upsertBatch(batch);
      metrics.recordsIndexed += batch.length;
      batch = [];
    };

    try {
      const xmlStream = await openZipEntryStream(request.archivePath, xmlEntry);
      const parser = new NAISEDRSubjectParser({
        onRecord: async (record) => {
          metrics.recordsSeen += 1;
          try {
            const normalized = normaliseRecord(
              record,
              request.sourceType,
              importId,
              request.sourceUrl,
              archiveSha256,
            );
            if (!normalized) {
              metrics.recordsSkipped += 1;
              return;
            }
            batch.push(normalized);
            if (batch.length >= batchSize) await flush();
          } catch (_error) {
            // A malformed record does not invalidate a 5 GiB official file;
            // the import report retains the precise failure count.
            metrics.recordsFailed += 1;
          }
        },
      });

      for await (const chunk of xmlStream) {
        await parser.write(chunk as Uint8Array);
      }
      await parser.end();
      await flush();
      await this.repository.completeImport(importId, request.sourceType, metrics);
    } catch (error) {
      const reason = error instanceof Error ? error : new Error(String(error));
      await this.repository.failImport(importId, metrics, reason);
      throw reason;
    }

    return {
      importId,
      sourceType: request.sourceType,
      archiveSha256,
      archiveSize: archive.size,
      xmlEntryName: xmlEntry.name,
      finishedAt: new Date().toISOString(),
      ...metrics,
    };
  }

  public static sourceUrlFor(sourceType: NAISEDRSourceType): string {
    if (sourceType === 'FOP') {
      return 'https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714/resource/c262938f-cce7-4489-a805-2fd7c5a44e0b/download/fop.zip';
    }
    return 'https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714/resource/d40cc921-39bb-44fd-be06-dc02589f45c6/download/uo.zip';
  }

  public static usage(sourceType: NAISEDRSourceType, archivePath: string): string {
    return `tsx server/ingestion/nais-edr/cli.ts ${sourceType.toLowerCase()} ${basename(archivePath)}`;
  }
}
