#!/usr/bin/env tsx

/**
 * TASK 2: Full CKAN Discovery
 * 
 * Complete enumeration of all datasets and resources from data.gov.ua
 * No stopping at 80, 100, or 1000 datasets - must be complete
 */

import https from 'https';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface CKANResponse {
  help: string;
  success: boolean;
  result: any;
}

interface Dataset {
  id: string;
  name: string;
  title: string;
  organization: any;
  resources: Resource[];
  metadata_created: string;
  metadata_modified: string;
  state: string;
}

interface Resource {
  id: string;
  name: string;
  url: string;
  format: string;
  datastore_active: boolean;
  size: number;
  last_modified: string;
}

const CKAN_BASE_URL = 'https://data.gov.ua/api/3/action';
const OUTPUT_DIR = '/Users/dima1203/Downloads/predator8/execution/catalog';

mkdirSync(OUTPUT_DIR, { recursive: true });

async function ckanRequest(action: string, params: Record<string, any> = {}): Promise<any> {
  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  
  const url = `${CKAN_BASE_URL}/${action}?${queryString}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json: CKANResponse = JSON.parse(data);
          if (json.success) {
            resolve(json.result);
          } else {
            reject(new Error(`CKAN request failed: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getPackageList(): Promise<string[]> {
  console.log('Fetching package list...');
  const packages = await ckanRequest('package_list');
  console.log(`Found ${packages.length} packages`);
  return packages;
}

async function getPackageDetails(packageId: string): Promise<Dataset> {
  return ckanRequest('package_show', { id: packageId });
}

async function fullDiscovery() {
  const startTime = Date.now();
  console.log('Starting full CKAN discovery...');
  console.log('====================================');
  
  // Step 1: Get all package IDs
  const packageIds = await getPackageList();
  writeFileSync(join(OUTPUT_DIR, 'package_list.json'), JSON.stringify(packageIds, null, 2));
  
  // Step 2: Use package_search with pagination to get all datasets efficiently
  const datasets: Dataset[] = [];
  const resources: Resource[] = [];
  const errors: any[] = [];
  
  const ROWS_PER_PAGE = 1000;
  let start = 0;
  let total = 0;
  let hasMore = true;
  
  console.log('Fetching datasets using package_search pagination...');
  
  while (hasMore) {
    try {
      const searchResult = await ckanRequest('package_search', {
        rows: ROWS_PER_PAGE,
        start: start
      });
      
      total = searchResult.count;
      const pageDatasets = searchResult.results;
      
      datasets.push(...pageDatasets);
      pageDatasets.forEach((d: Dataset) => {
        resources.push(...d.resources);
      });
      
      console.log(`Progress: ${datasets.length}/${total} (${((datasets.length/total)*100).toFixed(1)}%)`);
      
      start += ROWS_PER_PAGE;
      hasMore = start < total;
      
      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errors.push({ start, error: (error as Error).message });
      console.error(`Error fetching page at ${start}: ${(error as Error).message}`);
      hasMore = false;
    }
  }
  
  console.log(`\nCompleted: ${datasets.length} datasets`);
  console.log(`Errors: ${errors.length}`);
  
  // Step 3: Save results in chunks to avoid string length limits
  const CHUNK_SIZE = 1000;
  
  // Save datasets in chunks
  for (let i = 0; i < datasets.length; i += CHUNK_SIZE) {
    const chunk = datasets.slice(i, i + CHUNK_SIZE);
    writeFileSync(join(OUTPUT_DIR, `datasets_chunk_${i}.json`), JSON.stringify(chunk, null, 2));
  }
  
  // Save resources in chunks
  for (let i = 0; i < resources.length; i += CHUNK_SIZE) {
    const chunk = resources.slice(i, i + CHUNK_SIZE);
    writeFileSync(join(OUTPUT_DIR, `resources_chunk_${i}.json`), JSON.stringify(chunk, null, 2));
  }
  
  writeFileSync(join(OUTPUT_DIR, 'errors.json'), JSON.stringify(errors, null, 2));
  
  // Step 4: Create summary
  const summary = {
    timestamp: new Date().toISOString(),
    duration_seconds: (Date.now() - startTime) / 1000,
    packages_total: packageIds.length,
    datasets_total: datasets.length,
    datasets_from_search: datasets.length,
    resources_total: resources.length,
    organizations: [...new Set(datasets.map(d => d.organization?.name))].length,
    active_datasets: datasets.filter(d => d.state === 'active').length,
    datastore_resources: resources.filter(r => r.datastore_active).length,
    errors: errors.length,
    discovery_method: 'package_search_pagination',
    rows_per_page: ROWS_PER_PAGE
  };
  
  writeFileSync(join(OUTPUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  
  console.log('\n====================================');
  console.log('Discovery Summary:');
  console.log(`Total packages: ${summary.packages_total}`);
  console.log(`Total datasets: ${summary.datasets_total}`);
  console.log(`Total resources: ${summary.resources_total}`);
  console.log(`Organizations: ${summary.organizations}`);
  console.log(`Active datasets: ${summary.active_datasets}`);
  console.log(`DataStore resources: ${summary.datastore_resources}`);
  console.log(`Duration: ${summary.duration_seconds.toFixed(2)}s`);
  console.log('====================================');
}

fullDiscovery().catch(console.error);
