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
import * as iconv from 'iconv-lite';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
// @ts-ignore - sax library doesn't have TypeScript definitions
import * as sax from 'sax';

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
  console.log(`[Importer] Extracting and parsing ${sourceType} XML (streaming mode)...`);
  
  const xmlEntryName = sourceType === 'FOP' ? 'FOP.xml' : 'UO.xml';
  // Use project directory for temp files instead of system temp directory (more space)
  const tempDir = path.join(process.cwd(), 'temp_import');
  const tempZipPath = path.join(tempDir, `${xmlEntryName}.zip`);
  const tempXmlPath = path.join(tempDir, `${xmlEntryName}.tmp`);
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`[Importer] Created temp directory: ${tempDir}`);
  }
  
  try {
    // Write ZIP buffer to temporary file
    console.log(`[Importer] Writing ZIP to temporary file: ${tempZipPath}`);
    fs.writeFileSync(tempZipPath, zipBuffer);
    
    // Extract ZIP archive using system unzip (more memory-efficient)
    console.log(`[Importer] Extracting ZIP using system unzip...`);
    
    try {
      execSync(`cd ${tempDir} && unzip -o ${tempZipPath} ${xmlEntryName}`, { stdio: 'inherit' });
      console.log(`[Importer] Successfully extracted ${xmlEntryName}`);
    } catch (unzipError) {
      console.error(`[Importer] System unzip failed:`, unzipError);
      throw new Error(`Failed to extract ZIP: ${unzipError}`);
    }
    
    // Check if XML file was extracted
    if (!fs.existsSync(tempXmlPath)) {
      throw new Error(`Extracted XML file not found: ${tempXmlPath}`);
    }
    
    console.log(`[Importer] Starting streaming XML parse...`);
    
    // Use streaming SAX parser to handle large files
    await parseXMLStreaming(tempXmlPath, sourceType, onRecord, onProgress);
    
    // Clean up temporary files
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
      console.log(`[Importer] Cleaned up temporary ZIP file: ${tempZipPath}`);
    }
    if (fs.existsSync(tempXmlPath)) {
      fs.unlinkSync(tempXmlPath);
      console.log(`[Importer] Cleaned up temporary XML file: ${tempXmlPath}`);
    }
    
  } catch (error) {
    console.error(`[Importer] XML parsing failed:`, error);
    
    // Clean up temporary files on error
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
    if (fs.existsSync(tempXmlPath)) {
      fs.unlinkSync(tempXmlPath);
    }
    
    throw error;
  }
}

async function parseXMLStreaming(
  xmlPath: string,
  sourceType: NAISEDRSourceType,
  onRecord: (record: any) => void,
  onProgress: (seen: number, indexed: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let seen = 0;
    let indexed = 0;
    let currentRecord: any = {};
    let inSubject = false;
    let currentTag = '';
    
    // Create SAX parser
    const parser = sax.parser(false, {
      lowercase: true,
      trim: true,
      normalize: true,
    });
    
    parser.onerror = (err: any) => {
      console.error(`[Importer] SAX parser error:`, err);
      reject(err);
    };
    
    parser.onopentag = (node: any) => {
      currentTag = node.name;
      
      if (node.name === 'subject') {
        inSubject = true;
        currentRecord = {};
      }
      
      if (inSubject && node.name !== 'subject') {
        currentRecord[node.name] = '';
      }
    };
    
    parser.ontext = (text: any) => {
      if (inSubject && currentTag && currentTag !== 'subject') {
        if (currentRecord[currentTag] !== undefined) {
          currentRecord[currentTag] += text;
        }
      }
    };
    
    parser.onclosetag = (tagName: any) => {
      if (tagName === 'subject') {
        inSubject = false;
        seen++;
        
        try {
          const normalized = normalizeRecord(currentRecord, sourceType);
          onRecord(normalized);
          indexed++;
        } catch (error) {
          console.error(`[Importer] Failed to normalize record ${seen}:`, error);
        }
        
        if (seen % 1000 === 0) {
          onProgress(seen, indexed);
          console.log(`[Importer] Processed ${seen} records, indexed ${indexed}`);
        }
        
        currentRecord = {};
        currentTag = '';
      } else {
        currentTag = '';
      }
    };
    
    parser.onend = () => {
      onProgress(seen, indexed);
      console.log(`[Importer] Streaming parse complete: ${seen} records seen, ${indexed} indexed`);
      resolve();
    };
    
    // Stream the file in chunks and convert from WINDOWS-1251 to UTF-8
    console.log(`[Importer] Starting streaming file read with encoding conversion...`);
    const CHUNK_SIZE = 64 * 1024; // 64KB chunks
    
    const fileStream = fs.createReadStream(xmlPath);
    let buffer: Buffer = Buffer.alloc(0);
    
    fileStream.on('data', (chunk: Buffer | string) => {
      buffer = Buffer.concat([buffer, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
      
      // Process buffer in chunks to avoid memory issues
      while (buffer.length >= CHUNK_SIZE) {
        const chunkToProcess = buffer.slice(0, CHUNK_SIZE);
        buffer = buffer.slice(CHUNK_SIZE);
        
        try {
          const utf8Chunk = iconv.decode(chunkToProcess, 'windows-1251');
          parser.write(utf8Chunk);
        } catch (error) {
          console.error(`[Importer] Error processing chunk:`, error);
        }
      }
    });
    
    fileStream.on('end', () => {
      // Process remaining buffer
      if (buffer.length > 0) {
        try {
          const utf8Chunk = iconv.decode(buffer, 'windows-1251');
          parser.write(utf8Chunk);
        } catch (error) {
          console.error(`[Importer] Error processing final chunk:`, error);
        }
      }
      
      parser.close();
    });
    
    fileStream.on('error', (error) => {
      console.error(`[Importer] File stream error:`, error);
      reject(error);
    });
  });
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
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { importDataset, main };
