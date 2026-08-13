#!/usr/bin/env node
/**
 * Test script for NAIS EDR XML parser
 * Tests the parsing logic with a minimal sample
 */

// @ts-ignore - adm-zip library doesn't have TypeScript definitions
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import iconv from 'iconv-lite';

// Create a minimal FOP XML sample (WINDOWS-1251 encoded)
const sampleUTF8 = `<?xml version="1.0" encoding="windows-1251"?>
<DATA>
  <SUBJECT>
    <RECORD>3111724753</RECORD>
    <NAME>Кізима Дмитро Миколайович</NAME>
    <STAN>REGISTERED</STAN>
    <REGISTRATION>2015-03-12</REGISTRATION>
  </SUBJECT>
</DATA>`;
const sampleFOPXML = iconv.encode(sampleUTF8, 'windows-1251');

function normalizeRecord(raw: any, sourceType: 'FOP' | 'UO'): any {
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

async function testParser() {
  console.log('[Test] Testing NAIS EDR XML parser...');
  
  const records: any[] = [];
  
  try {
    // Simulate ZIP extraction with our sample
    const zip = new AdmZip();
    zip.addFile('FOP.xml', sampleFOPXML);
    const zipBuffer = zip.toBuffer();
    
    // Extract and parse
    const testZip = new AdmZip(zipBuffer);
    const xmlEntry = testZip.getEntries()[0];
    const xmlBuffer = xmlEntry.getData();
    const utf8Content = iconv.decode(xmlBuffer, 'windows-1251');
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    
    const result = parser.parse(utf8Content);
    console.log('[Test] Parsed XML result:', JSON.stringify(result, null, 2));
    
    const subjects = result.DATA?.SUBJECT;
    const recordArray = Array.isArray(subjects) ? subjects : (subjects ? [subjects] : []);
    
    console.log(`[Test] Found ${recordArray.length} records in XML`);
    
    for (const record of recordArray) {
      console.log('[Test] Processing record:', JSON.stringify(record, null, 2));
      const normalized = normalizeRecord(record, 'FOP');
      records.push(normalized);
      console.log(`[Test] Parsed record:`, normalized);
    }
    
    console.log(`[Test] Successfully parsed ${records.length} records`);
    
    // Validate records
    if (records.length !== 1) {
      throw new Error(`Expected 1 record, got ${records.length}`);
    }
    
    if (String(records[0].recordNumber) !== '3111724753') {
      throw new Error(`First record number mismatch: expected 3111724753, got ${records[0].recordNumber}`);
    }
    
    if (records[0].fullName !== 'Кізима Дмитро Миколайович') {
      throw new Error(`First record name mismatch`);
    }
    
    console.log('[Test] All validations passed!');
    
  } catch (error) {
    console.error('[Test] Parser test failed:', error);
    process.exit(1);
  }
}

// Run test
testParser().catch(console.error);
