/**
 * Registry Discovery Platform (RDP)
 * DataStore Fallback Verification Test
 * 
 * This script verifies DataStore probing and fallback logic
 * by testing against real resources from data.gov.ua
 */

import { CatalogConfig } from './types.js';
import { CKANAdapter } from './adapters/CKANAdapter.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DataStoreFallbackVerification {
  private catalogConfig: CatalogConfig;
  private adapter: CKANAdapter;
  private executionDir: string;

  constructor() {
    this.catalogConfig = {
      id: 'data-gov-ua',
      name: 'data.gov.ua',
      type: 'CKAN',
      baseUrl: 'https://data.gov.ua',
      enabled: true,
    };

    this.adapter = new CKANAdapter(this.catalogConfig);
    this.executionDir = path.join(__dirname, '../../../execution');
  }

  async verifyDataStoreFallback(): Promise<{
    success: boolean;
    results: any[];
    summary: any;
  }> {
    console.log('\n========================================');
    console.log('DATASTORE FALLBACK VERIFICATION');
    console.log('Source: https://data.gov.ua');
    console.log('========================================\n');

    const results = [];
    const summary = {
      totalTested: 0,
      datastoreAvailable: 0,
      datastoreUnavailable: 0,
      fallbackSuccessful: 0,
      fallbackFailed: 0,
      errors: 0,
    };

    try {
      // Search for packages with DataStore active
      console.log('Searching for packages with DataStore active...');
      const searchResult = await this.adapter.searchPackages({
        rows: 20,
        q: 'res_format:CSV', // Search for CSV resources which are more likely to have DataStore
      });

      console.log(`Found ${searchResult.results.length} packages for testing`);

      // Fetch full package details to get resources
      const dataStoreResources = [];
      const nonDataStoreResources = [];

      for (const pkg of searchResult.results.slice(0, 10)) {
        try {
          const fullPkg = await this.adapter.getPackage(pkg.id);
          
          for (const resource of fullPkg.resources || []) {
            const isActive = resource.datastore_active;
            if (isActive) {
              dataStoreResources.push({ resource, packageId: pkg.id });
            } else {
              nonDataStoreResources.push({ resource, packageId: pkg.id });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch package ${pkg.id}: ${error}`);
        }
      }

      console.log(`Found ${dataStoreResources.length} DataStore resources`);
      console.log(`Found ${nonDataStoreResources.length} non-DataStore resources`);

      // Test DataStore probing on DataStore resources
      console.log('\n--- Testing DataStore Probing ---');
      for (let i = 0; i < Math.min(5, dataStoreResources.length); i++) {
        const { resource, packageId } = dataStoreResources[i];
        summary.totalTested++;

        console.log(`\nTest ${i + 1}: Resource ${resource.id} (${resource.name})`);
        console.log(`   Package: ${packageId}`);
        console.log(`   DataStore active: ${resource.datastore_active}`);

        try {
          const probeResult = await this.adapter.probeDataStoreAvailability(resource.id);
          
          console.log(`   Probe result: ${probeResult.available ? 'AVAILABLE' : 'UNAVAILABLE'}`);
          console.log(`   Probe time: ${probeResult.probeTime}ms`);
          
          if (probeResult.available) {
            summary.datastoreAvailable++;
          } else {
            summary.datastoreUnavailable++;
            console.log(`   Error: ${probeResult.error}`);
          }

          results.push({
            test: i + 1,
            resourceId: resource.id,
            resourceName: resource.name,
            packageId,
            datastoreActive: resource.datastore_active,
            probeAvailable: probeResult.available,
            probeTime: probeResult.probeTime,
            probeError: probeResult.error,
            status: 'SUCCESS',
          });

        } catch (error) {
          summary.errors++;
          console.error(`   Probe failed: ${error}`);
          
          results.push({
            test: i + 1,
            resourceId: resource.id,
            resourceName: resource.name,
            packageId,
            datastoreActive: resource.datastore_active,
            probeAvailable: null,
            probeTime: null,
            probeError: String(error),
            status: 'ERROR',
          });
        }
      }

      // Test fallback on non-DataStore resources
      console.log('\n--- Testing Fallback to Direct Download ---');
      for (let i = 0; i < Math.min(5, nonDataStoreResources.length); i++) {
        const { resource, packageId } = nonDataStoreResources[i];
        summary.totalTested++;

        console.log(`\nTest ${i + 1}: Resource ${resource.id} (${resource.name})`);
        console.log(`   Package: ${packageId}`);
        console.log(`   DataStore active: ${resource.datastore_active}`);

        try {
          // Try to download directly (fallback path)
          const response = await fetch(resource.url);
          const success = response.ok;
          
          console.log(`   Direct download: ${success ? 'SUCCESS' : 'FAILED'}`);
          console.log(`   HTTP status: ${response.status}`);
          
          if (success) {
            summary.fallbackSuccessful++;
          } else {
            summary.fallbackFailed++;
          }

          results.push({
            test: i + 1,
            resourceId: resource.id,
            resourceName: resource.name,
            packageId,
            datastoreActive: resource.datastore_active,
            directDownloadSuccess: success,
            httpStatus: response.status,
            status: 'SUCCESS',
          });

        } catch (error) {
          summary.errors++;
          console.error(`   Direct download failed: ${error}`);
          
          results.push({
            test: i + 1,
            resourceId: resource.id,
            resourceName: resource.name,
            packageId,
            datastoreActive: resource.datastore_active,
            directDownloadSuccess: false,
            httpStatus: null,
            error: String(error),
            status: 'ERROR',
          });
        }
      }

      // Save results
      const report = {
        timestamp: new Date().toISOString(),
        source: 'https://data.gov.ua',
        summary,
        results,
      };

      fs.writeFileSync(
        path.join(this.executionDir, 'datastore_fallback_verification.json'),
        JSON.stringify(report, null, 2)
      );

      console.log('\n========================================');
      console.log('VERIFICATION SUMMARY');
      console.log('========================================');
      console.log(`Total tested: ${summary.totalTested}`);
      console.log(`DataStore available: ${summary.datastoreAvailable}`);
      console.log(`DataStore unavailable: ${summary.datastoreUnavailable}`);
      console.log(`Fallback successful: ${summary.fallbackSuccessful}`);
      console.log(`Fallback failed: ${summary.fallbackFailed}`);
      console.log(`Errors: ${summary.errors}`);
      console.log(`Report saved: datastore_fallback_verification.json`);

      return {
        success: summary.errors === 0,
        results,
        summary,
      };

    } catch (error) {
      console.error('\n❌ Verification failed:', error);
      throw error;
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verification = new DataStoreFallbackVerification();
  verification.verifyDataStoreFallback()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { DataStoreFallbackVerification };
