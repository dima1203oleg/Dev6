#!/usr/bin/env tsx

/**
 * TASK 3: DataStore + Download Fallback Verification
 * 
 * Test access methods for resources:
 * 1. DataStore (if datastore_active=true)
 * 2. Official API
 * 3. Direct Download
 * 4. Archive
 * 
 * For each resource, record:
 * - access_method
 * - attempted
 * - status
 * - HTTP status
 * - latency
 * - error
 * - fallback_used
 */

import https from 'https';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

const CATALOG_DIR = '/Users/dima1203/Downloads/predator8/execution/catalog';
const OUTPUT_DIR = '/Users/dima1203/Downloads/predator8/execution/datastore_test';

mkdirSync(OUTPUT_DIR, { recursive: true });

interface Resource {
  id: string;
  name: string;
  url: string;
  format: string;
  datastore_active: boolean;
  size: number;
  last_modified: string;
  package_id: string;
}

interface TestResult {
  resource_id: string;
  resource_name: string;
  dataset_id: string;
  datastore_active: boolean;
  datastore_test: {
    attempted: boolean;
    status: string;
    http_status?: number;
    latency_ms?: number;
    error?: string;
  };
  direct_download_test: {
    attempted: boolean;
    status: string;
    http_status?: number;
    latency_ms?: number;
    error?: string;
  };
  fallback_used: boolean;
  final_access_method: string;
}

async function httpRequest(url: string): Promise<{ status: number; latency_ms: number; error?: string }> {
  const startTime = Date.now();
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const latency = Date.now() - startTime;
      resolve({ status: res.statusCode || 0, latency_ms: latency });
    }).on('error', (err) => {
      const latency = Date.now() - startTime;
      resolve({ status: 0, latency_ms: latency, error: err.message });
    });
  });
}

async function testDataStore(resource: Resource): Promise<{ attempted: boolean; status: string; http_status?: number; latency_ms?: number; error?: string }> {
  if (!resource.datastore_active) {
    return { attempted: false, status: 'NOT_APPLICABLE' };
  }
  
  try {
    const result = await httpRequest(`https://data.gov.ua/api/3/action/datastore_search?resource_id=${resource.id}&limit=1`);
    return {
      attempted: true,
      status: result.status === 200 ? 'SUCCESS' : 'FAILED',
      http_status: result.status,
      latency_ms: result.latency_ms,
      error: result.error
    };
  } catch (error) {
    return {
      attempted: true,
      status: 'ERROR',
      error: (error as Error).message
    };
  }
}

async function testDirectDownload(resource: Resource): Promise<{ attempted: boolean; status: string; http_status?: number; latency_ms?: number; error?: string }> {
  try {
    const result = await httpRequest(resource.url);
    return {
      attempted: true,
      status: result.status === 200 ? 'SUCCESS' : 'FAILED',
      http_status: result.status,
      latency_ms: result.latency_ms,
      error: result.error
    };
  } catch (error) {
    return {
      attempted: true,
      status: 'ERROR',
      error: (error as Error).message
    };
  }
}

async function runDatastoreFallbackTest() {
  console.log('TASK 3: DataStore + Download Fallback Verification');
  console.log('====================================================');
  
  // Load resources from catalog
  const resourcesChunk0 = JSON.parse(readFileSync(join(CATALOG_DIR, 'resources_chunk_0.json'), 'utf-8'));
  
  // Sample resources for testing (first 100)
  const sampleResources = resourcesChunk0.slice(0, 100);
  
  console.log(`Testing ${sampleResources.length} sample resources...`);
  
  const results: TestResult[] = [];
  let datastore_active_count = 0;
  let datastore_success_count = 0;
  let direct_download_success_count = 0;
  let fallback_used_count = 0;
  
  for (const resource of sampleResources) {
    const result: TestResult = {
      resource_id: resource.id,
      resource_name: resource.name,
      dataset_id: resource.package_id,
      datastore_active: resource.datastore_active,
      datastore_test: { attempted: false, status: 'PENDING' },
      direct_download_test: { attempted: false, status: 'PENDING' },
      fallback_used: false,
      final_access_method: 'NONE'
    };
    
    if (resource.datastore_active) {
      datastore_active_count++;
      result.datastore_test = await testDataStore(resource);
      
      if (result.datastore_test.status === 'SUCCESS') {
        datastore_success_count++;
        result.final_access_method = 'DATASTORE';
      } else {
        // Fallback to direct download
        result.direct_download_test = await testDirectDownload(resource);
        result.fallback_used = true;
        fallback_used_count++;
        
        if (result.direct_download_test.status === 'SUCCESS') {
          direct_download_success_count++;
          result.final_access_method = 'DIRECT_DOWNLOAD_FALLBACK';
        } else {
          result.final_access_method = 'FAILED';
        }
      }
    } else {
      // Direct download only
      result.direct_download_test = await testDirectDownload(resource);
      
      if (result.direct_download_test.status === 'SUCCESS') {
        direct_download_success_count++;
        result.final_access_method = 'DIRECT_DOWNLOAD';
      } else {
        result.final_access_method = 'FAILED';
      }
    }
    
    results.push(result);
    
    if (results.length % 10 === 0) {
      console.log(`Progress: ${results.length}/${sampleResources.length}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Save results
  writeFileSync(join(OUTPUT_DIR, 'test_results.json'), JSON.stringify(results, null, 2));
  
  // Create summary
  const summary = {
    timestamp: new Date().toISOString(),
    resources_tested: sampleResources.length,
    datastore_active: datastore_active_count,
    datastore_success: datastore_success_count,
    direct_download_success: direct_download_success_count,
    fallback_used: fallback_used_count,
    datastore_success_rate: datastore_active_count > 0 ? (datastore_success_count / datastore_active_count * 100).toFixed(2) + '%' : 'N/A',
    direct_download_success_rate: (direct_download_success_count / sampleResources.length * 100).toFixed(2) + '%',
    fallback_success_rate: fallback_used_count > 0 ? (direct_download_success_count / fallback_used_count * 100).toFixed(2) + '%' : 'N/A'
  };
  
  writeFileSync(join(OUTPUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  
  console.log('\n====================================================');
  console.log('DataStore + Download Fallback Test Summary:');
  console.log(`Resources tested: ${summary.resources_tested}`);
  console.log(`DataStore active: ${summary.datastore_active}`);
  console.log(`DataStore success: ${summary.datastore_success}`);
  console.log(`Direct download success: ${summary.direct_download_success}`);
  console.log(`Fallback used: ${summary.fallback_used}`);
  console.log(`DataStore success rate: ${summary.datastore_success_rate}`);
  console.log(`Direct download success rate: ${summary.direct_download_success_rate}`);
  console.log(`Fallback success rate: ${summary.fallback_success_rate}`);
  console.log('====================================================');
}

runDatastoreFallbackTest().catch(console.error);
