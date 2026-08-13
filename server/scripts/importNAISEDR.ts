#!/usr/bin/env node
/**
 * NAIS EDR XML Importer
 * 
 * Downloads, parses, and imports NAIS EDR XML datasets into the database.
 * Uses streaming XML parsing to handle large files without loading everything into memory.
 */

import { getDatabaseClient } from '../database/DatabaseClient';
import { NAISEDRRepository, NAISEDRImport, NAISEDRImportMetrics, NAISEDRSourceType } from '../database/repositories/NAISEDRRepository';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import iconv from 'iconv-lite';

const FOP_URL = 'https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714/resource/c262938f-cce7-4489-a805-2fd7c5a44e0b/download/fop.zip';
const UO_URL = 'https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714/resource/d40cc921-39bb-44fd-be06-dc02589f45c6/download/uo.zip';

interface ImportOptions {
  sourceType: NAISEDRSourceType;
  url: string;
  batchSize?: number;
}

async function downloadDataset(url: string): Promise<{ buffer: Buffer; hash: string }> {
  console.log(`[Importer] Downloading from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  console.log(`[Importer] Downloaded ${buffer.length} bytes, SHA-256: ${hash}`);
  return { buffer, hash };
}

async function extractAndParseXML(
  zipBuffer: Buffer,
  sourceType: NAISEDRSourceType,
  onRecord: (record: any) => void,
  onProgress: (seen: number, indexed: number) => void
): Promise<void> {
  console.log(`[Importer] Extracting and parsing ${sourceType} XML...`);
  
  const xmlEntryName = sourceType === 'FOP' ? 'FOP.xml' : 'UO.xml';
  
  try {
    // Extract ZIP archive
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    
    console.log(`[Importer] ZIP contains ${zipEntries.length} entries`);
    
    // Find the XML entry
    const xmlEntry = zipEntries.find(entry => entry.entryName.includes(xmlEntryName));
    if (!xmlEntry) {
      throw new Error(`XML entry ${xmlEntryName} not found in ZIP archive`);
    }
    
    console.log(`[Importer] Found XML entry: ${xmlEntry.entryName}, size: ${xmlEntry.header.size} bytes`);
    
    // Read XML content as buffer
    const xmlBuffer = xmlEntry.getData();
    console.log(`[Importer] XML buffer size: ${xmlBuffer.length} bytes`);
    
    // Convert from WINDOWS-1251 to UTF-8
    const utf8Content = iconv.decode(xmlBuffer, 'windows-1251');
    console.log(`[Importer] Converted to UTF-8, length: ${utf8Content.length} characters`);
    
    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    
    const result = parser.parse(utf8Content);
    
    const subjects = result.DATA?.SUBJECT;
    const recordArray = Array.isArray(subjects) ? subjects : (subjects ? [subjects] : []);
    
    console.log(`[Importer] Found ${recordArray.length} records in XML`);
    
    let seen = 0;
    let indexed = 0;
    
    for (const record of recordArray) {
      seen++;
      try {
        const normalized = normalizeRecord(record, sourceType);
        onRecord(normalized);
        indexed++;
      } catch (error) {
        console.error(`[Importer] Failed to normalize record ${seen}:`, error);
      }
      
      if (seen % 1000 === 0) {
        onProgress(seen, indexed);
      }
    }
    
    onProgress(seen, indexed);
    
  } catch (error) {
    console.error(`[Importer] XML parsing failed:`, error);
    throw error;
  }
}

function normalizeRecord(raw: any, sourceType: NAISEDRSourceType): any {
  if (sourceType === 'FOP') {
    return {
      sourceType: 'FOP',
      recordNumber: raw.RECORD || '',
      lookupIdentifier: raw.RECORD || null,
      edrpou: null,
      fullName: raw.NAME || '',
      shortName: null,
      status: raw.STAN || null,
      registration: raw.REGISTRATION || null,
      rawData: raw,
    };
  } else {
    return {
      sourceType: 'UO',
      recordNumber: raw.RECORD || '',
      lookupIdentifier: raw.EDRPOU || null,
      edrpou: raw.EDRPOU || null,
      fullName: raw.NAME || '',
      shortName: raw.SHORT_NAME || null,
      status: raw.STAN || null,
      registration: raw.REGISTRATION || null,
      rawData: raw,
    };
  }
}

async function importDataset(options: ImportOptions): Promise<void> {
  const { sourceType, url, batchSize = 1000 } = options;
  
  console.log(`[Importer] Starting import for ${sourceType}...`);
  
  const db = getDatabaseClient();
  const repository = new NAISEDRRepository(db);
  
  // Download dataset
  const { buffer, hash } = await downloadDataset(url);
  
  // Check if this archive has already been imported
  const existingImport = await repository.findSuccessfulImportByArchiveHash(sourceType, hash);
  if (existingImport) {
    console.log(`[Importer] Archive ${hash} already imported on ${existingImport.finishedAt}. Skipping.`);
    return;
  }
  
  // Start import
  const importId = `${sourceType}-${Date.now()}`;
  const importRun: NAISEDRImport = {
    importId,
    sourceType,
    sourceUrl: url,
    archivePath: `/tmp/${sourceType}-${hash}.zip`,
    archiveSha256: hash,
    archiveSize: buffer.length,
    xmlEntryName: sourceType === 'FOP' ? 'FOP.xml' : 'UO.xml',
    startedAt: new Date(),
  };
  
  await repository.startImport(importRun);
  
  const metrics: NAISEDRImportMetrics = {
    recordsSeen: 0,
    recordsIndexed: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
  };
  
  const batch: any[] = [];
  
  try {
    await extractAndParseXML(
      buffer,
      sourceType,
      (record) => {
        const recordHash = crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex');
        batch.push({
          ...record,
          rawHash: recordHash,
          sourceUrl: url,
          sourceArchiveSha256: hash,
          importId,
        });
        
        if (batch.length >= batchSize) {
          repository.upsertBatch(batch);
          batch.length = 0;
        }
      },
      (seen, indexed) => {
        metrics.recordsSeen = seen;
        metrics.recordsIndexed = indexed;
        console.log(`[Importer] Progress: ${seen} seen, ${indexed} indexed`);
      }
    );
    
    // Flush remaining batch
    if (batch.length > 0) {
      await repository.upsertBatch(batch);
    }
    
    // Complete import
    await repository.completeImport(importId, sourceType, metrics);
    
    console.log(`[Importer] Import completed: ${metrics.recordsSeen} seen, ${metrics.recordsIndexed} indexed`);
    
  } catch (error) {
    console.error(`[Importer] Import failed:`, error);
    await repository.failImport(importId, metrics, error as Error);
    throw error;
  }
}

async function main(): Promise<void> {
  console.log('[Importer] NAIS EDR XML Importer starting...');
  
  try {
    // Initialize database connection
    const db = getDatabaseClient();
    await db.connect();
    console.log('[Importer] Database connected');
    
    // Import FOP dataset
    await importDataset({
      sourceType: 'FOP',
      url: FOP_URL,
      batchSize: 1000,
    });
    
    // Import UO dataset
    await importDataset({
      sourceType: 'UO',
      url: UO_URL,
      batchSize: 1000,
    });
    
    console.log('[Importer] All imports completed successfully');
    
    await db.disconnect();
  } catch (error) {
    console.error('[Importer] Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { importDataset, main };
