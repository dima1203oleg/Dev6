import { DatabaseClient } from '../DatabaseClient';

export type NAISEDRSourceType = 'FOP' | 'UO';

export interface NAISEDRImport {
  importId: string;
  sourceType: NAISEDRSourceType;
  sourceUrl: string;
  archivePath: string;
  archiveSha256: string;
  archiveSize: number;
  xmlEntryName: string;
  startedAt: Date;
}

export interface NAISEDRImportMetrics {
  recordsSeen: number;
  recordsIndexed: number;
  recordsSkipped: number;
  recordsFailed: number;
}

export interface NAISEDRIndexedRecord {
  sourceType: NAISEDRSourceType;
  recordNumber: string;
  lookupIdentifier: string | null;
  edrpou: string | null;
  fullName: string;
  shortName: string | null;
  status: string | null;
  registration: string | null;
  rawData: Record<string, string>;
  rawHash: string;
  sourceUrl: string;
  sourceArchiveSha256: string;
  importId: string;
}

export interface NAISEDRStoredRecord extends NAISEDRIndexedRecord {
  importedAt: Date;
}

export interface NAISEDRImportStatus {
  importId: string;
  sourceType: NAISEDRSourceType;
  sourceUrl: string;
  archiveSha256: string;
  archiveSize: number;
  xmlEntryName: string;
  finishedAt: Date;
  recordsSeen: number;
  recordsIndexed: number;
}

/**
 * Persistence boundary for the NAIS batch index.  Keeping this separate from
 * the request-time connector makes it impossible for a user lookup to trigger
 * a multi-gigabyte download.
 */
export class NAISEDRRepository {
  constructor(private readonly db: DatabaseClient) {}

  async startImport(importRun: NAISEDRImport): Promise<void> {
    await this.db.query(
      `INSERT INTO nais_edr_imports (
        import_id, source_type, source_url, archive_path, archive_sha256,
        archive_size, xml_entry_name, started_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'RUNNING')`,
      [
        importRun.importId,
        importRun.sourceType,
        importRun.sourceUrl,
        importRun.archivePath,
        importRun.archiveSha256,
        importRun.archiveSize,
        importRun.xmlEntryName,
        importRun.startedAt,
      ],
    );
  }

  async upsertBatch(records: NAISEDRIndexedRecord[]): Promise<void> {
    if (records.length === 0) return;

    const columns = {
      sourceType: records.map((record) => record.sourceType),
      recordNumber: records.map((record) => record.recordNumber),
      lookupIdentifier: records.map((record) => record.lookupIdentifier),
      edrpou: records.map((record) => record.edrpou),
      fullName: records.map((record) => record.fullName),
      shortName: records.map((record) => record.shortName),
      status: records.map((record) => record.status),
      registration: records.map((record) => record.registration),
      rawData: records.map((record) => JSON.stringify(record.rawData)),
      rawHash: records.map((record) => record.rawHash),
      sourceUrl: records.map((record) => record.sourceUrl),
      archiveHash: records.map((record) => record.sourceArchiveSha256),
      importId: records.map((record) => record.importId),
    };

    await this.db.query(
      `INSERT INTO nais_edr_records (
        source_type, record_number, lookup_identifier, edrpou, full_name,
        short_name, status, registration, raw_data, raw_hash, source_url,
        source_archive_sha256, import_id, is_current, imported_at, updated_at
      )
      SELECT batch.source_type, batch.record_number, batch.lookup_identifier,
             batch.edrpou, batch.full_name, batch.short_name, batch.status,
             batch.registration, batch.raw_data, batch.raw_hash,
             batch.source_url, batch.source_archive_sha256, batch.import_id,
             false, NOW(), NOW()
      FROM UNNEST(
        $1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
        $6::text[], $7::text[], $8::text[], $9::jsonb[], $10::text[],
        $11::text[], $12::text[], $13::text[]
      ) AS batch(
        source_type, record_number, lookup_identifier, edrpou, full_name,
        short_name, status, registration, raw_data, raw_hash, source_url,
        source_archive_sha256, import_id
      )
      ON CONFLICT (source_type, record_number, import_id) DO UPDATE SET
        lookup_identifier = EXCLUDED.lookup_identifier,
        edrpou = EXCLUDED.edrpou,
        full_name = EXCLUDED.full_name,
        short_name = EXCLUDED.short_name,
        status = EXCLUDED.status,
        registration = EXCLUDED.registration,
        raw_data = EXCLUDED.raw_data,
        raw_hash = EXCLUDED.raw_hash,
        source_url = EXCLUDED.source_url,
        source_archive_sha256 = EXCLUDED.source_archive_sha256,
        is_current = false,
        imported_at = NOW(),
        updated_at = NOW()`,
      [
        columns.sourceType,
        columns.recordNumber,
        columns.lookupIdentifier,
        columns.edrpou,
        columns.fullName,
        columns.shortName,
        columns.status,
        columns.registration,
        columns.rawData,
        columns.rawHash,
        columns.sourceUrl,
        columns.archiveHash,
        columns.importId,
      ],
    );
  }

  async completeImport(
    importId: string,
    sourceType: NAISEDRSourceType,
    metrics: NAISEDRImportMetrics,
  ): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query(
        `DELETE FROM nais_edr_records
         WHERE source_type = $1 AND import_id <> $2`,
        [sourceType, importId],
      );
      await client.query(
        `UPDATE nais_edr_records
         SET is_current = true, updated_at = NOW()
         WHERE source_type = $1 AND import_id = $2`,
        [sourceType, importId],
      );
      await client.query(
        `UPDATE nais_edr_imports
         SET status = 'SUCCEEDED', finished_at = NOW(), records_seen = $2,
             records_indexed = $3, records_skipped = $4, records_failed = $5,
             updated_at = NOW()
         WHERE import_id = $1`,
        [
          importId,
          metrics.recordsSeen,
          metrics.recordsIndexed,
          metrics.recordsSkipped,
          metrics.recordsFailed,
        ],
      );
    });
  }

  async failImport(importId: string, metrics: NAISEDRImportMetrics, error: Error): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query('DELETE FROM nais_edr_records WHERE import_id = $1', [importId]);
      await client.query(
        `UPDATE nais_edr_imports
       SET status = 'FAILED', finished_at = NOW(), records_seen = $2,
           records_indexed = $3, records_skipped = $4, records_failed = $5,
           error_message = $6, updated_at = NOW()
       WHERE import_id = $1`,
        [
          importId,
          metrics.recordsSeen,
          metrics.recordsIndexed,
          metrics.recordsSkipped,
          metrics.recordsFailed,
          error.message.slice(0, 8_000),
        ],
      );
    });
  }

  async findCurrentByIdentifier(identifier: string): Promise<NAISEDRStoredRecord | null> {
    const result = await this.db.query(
      `SELECT source_type, record_number, lookup_identifier, edrpou, full_name,
              short_name, status, registration, raw_data, raw_hash, source_url,
              source_archive_sha256, import_id, imported_at
       FROM nais_edr_records
       WHERE is_current = true AND (edrpou = $1 OR lookup_identifier = $1)
       ORDER BY CASE WHEN edrpou = $1 THEN 0 ELSE 1 END, imported_at DESC
       LIMIT 1`,
      [identifier],
    );

    if (result.rows.length === 0) return null;
    return this.toStoredRecord(result.rows[0]);
  }

  async findLatestSuccessfulImport(sourceType?: NAISEDRSourceType): Promise<NAISEDRImportStatus | null> {
    const result = await this.db.query(
      `SELECT import_id, source_type, source_url, archive_sha256, archive_size,
              xml_entry_name, finished_at, records_seen, records_indexed
       FROM nais_edr_imports
       WHERE status = 'SUCCEEDED' AND ($1::text IS NULL OR source_type = $1)
       ORDER BY finished_at DESC
       LIMIT 1`,
      [sourceType ?? null],
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      importId: row.import_id,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      archiveSha256: row.archive_sha256,
      archiveSize: Number(row.archive_size),
      xmlEntryName: row.xml_entry_name,
      finishedAt: row.finished_at,
      recordsSeen: Number(row.records_seen),
      recordsIndexed: Number(row.records_indexed),
    };
  }

  async findSuccessfulImportByArchiveHash(
    sourceType: NAISEDRSourceType,
    archiveSha256: string,
  ): Promise<NAISEDRImportStatus | null> {
    const result = await this.db.query(
      `SELECT import_id, source_type, source_url, archive_sha256, archive_size,
              xml_entry_name, finished_at, records_seen, records_indexed
       FROM nais_edr_imports
       WHERE source_type = $1 AND archive_sha256 = $2 AND status = 'SUCCEEDED'
       ORDER BY finished_at DESC
       LIMIT 1`,
      [sourceType, archiveSha256],
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      importId: row.import_id,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      archiveSha256: row.archive_sha256,
      archiveSize: Number(row.archive_size),
      xmlEntryName: row.xml_entry_name,
      finishedAt: row.finished_at,
      recordsSeen: Number(row.records_seen),
      recordsIndexed: Number(row.records_indexed),
    };
  }

  private toStoredRecord(row: Record<string, unknown>): NAISEDRStoredRecord {
    return {
      sourceType: row['source_type'] as NAISEDRSourceType,
      recordNumber: String(row['record_number']),
      lookupIdentifier: row['lookup_identifier'] ? String(row['lookup_identifier']) : null,
      edrpou: row['edrpou'] ? String(row['edrpou']) : null,
      fullName: String(row['full_name']),
      shortName: row['short_name'] ? String(row['short_name']) : null,
      status: row['status'] ? String(row['status']) : null,
      registration: row['registration'] ? String(row['registration']) : null,
      rawData: row['raw_data'] as Record<string, string>,
      rawHash: String(row['raw_hash']),
      sourceUrl: String(row['source_url']),
      sourceArchiveSha256: String(row['source_archive_sha256']),
      importId: String(row['import_id']),
      importedAt: row['imported_at'] as Date,
    };
  }
}
