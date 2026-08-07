/**
 * Registry Discovery Platform (RDP)
 * Full CKAN Catalog Discovery
 * 
 * This script executes full catalog enumeration for data.gov.ua
 * to prove complete discovery capability and generate execution evidence.
 */

import { CatalogConfig } from './types.js';
import { CKANAdapter } from './adapters/CKANAdapter.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FullCKANDiscovery {
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
    
    // Ensure execution directory exists
    if (!fs.existsSync(this.executionDir)) {
      fs.mkdirSync(this.executionDir, { recursive: true });
    }
  }

  /**
   * Execute full catalog discovery using package_search with pagination
   */
  async executeFullDiscovery(): Promise<{
    success: boolean;
    totalPackages: number;
    totalResources: number;
    executionTime: number;
    errors: string[];
  }> {
    console.log('\n========================================');
    console.log('FULL CKAN CATALOG DISCOVERY');
    console.log('Source: https://data.gov.ua');
    console.log('Method: package_search with pagination (1000 per page)');
    console.log('========================================\n');

    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      // Step 1: Get total count using package_search
      console.log('Step 1: Getting total package count...');
      const initialSearch = await this.adapter.searchPackages({
        rows: 1,
        start: 0,
      });
      const totalCount = initialSearch.count;
      console.log(`✅ Total packages in catalog: ${totalCount}`);
      
      // Step 2: Enumerate all packages using pagination
      console.log(`\nStep 2: Enumerating ${totalCount} packages using pagination...`);
      const catalogDatasets = [];
      const catalogResources = [];
      
      const pageSize = 1000;
      let processedCount = 0;
      let errorCount = 0;
      let pageCount = 0;
      
      for (let start = 0; start < totalCount; start += pageSize) {
        try {
          pageCount++;
          const searchResult = await this.adapter.searchPackages({
            rows: pageSize,
            start: start,
          });
          
          for (const pkg of searchResult.results) {
            catalogDatasets.push({
              id: pkg.id,
              name: pkg.name,
              title: pkg.title,
              organization: pkg.owner_org,
              resource_count: pkg.resources?.length || 0,
              created: pkg.metadata_created,
              modified: pkg.metadata_modified,
            });
            
            catalogResources.push(...(pkg.resources?.map((r: any) => ({
              id: r.id,
              name: r.name,
              format: r.format,
              size: r.size,
              datastore_active: r.datastore_active,
              package_id: r.package_id,
            })) || []));
            
            processedCount++;
          }
          
          // Progress logging
          if (pageCount % 5 === 0) {
            console.log(`   Progress: ${processedCount}/${totalCount} packages (${((processedCount / totalCount) * 100).toFixed(1)}%) - Page ${pageCount}`);
          }
          
        } catch (error) {
          errorCount++;
          errors.push(`Page ${pageCount} (start=${start}): ${error}`);
          console.error(`   Error processing page ${pageCount}: ${error}`);
        }
      }
      
      console.log(`\n✅ Enumeration complete: ${processedCount}/${totalCount} packages processed`);
      console.log(`   Errors: ${errorCount}`);
      
      // Step 3: Calculate statistics
      const totalResources = catalogResources.length;
      const datastoreActive = catalogResources.filter((r: any) => r.datastore_active).length;
      const formats: Record<string, number> = {};
      catalogResources.forEach((r: any) => {
        formats[r.format] = (formats[r.format] || 0) + 1;
      });
      
      console.log(`\nStep 3: Calculating statistics...`);
      console.log(`   Total packages: ${totalCount}`);
      console.log(`   Total resources: ${totalResources}`);
      console.log(`   DataStore active: ${datastoreActive}`);
      console.log(`   DataStore inactive: ${totalResources - datastoreActive}`);
      console.log(`   Formats: ${JSON.stringify(formats, null, 2)}`);
      
      // Step 4: Save execution artifacts
      console.log(`\nStep 4: Saving execution artifacts...`);
      
      const catalog = {
        version: '2.0',
        generatedAt: new Date().toISOString(),
        source: 'https://data.gov.ua',
        totalPackages: totalCount,
        totalResources,
        packagesProcessed: processedCount,
        packagesFailed: errorCount,
        packages: catalogDatasets,
        resources: catalogResources,
        statistics: {
          datastoreActive,
          datastoreInactive: totalResources - datastoreActive,
          formats,
        },
      };
      
      fs.writeFileSync(
        path.join(this.executionDir, 'catalog.json'),
        JSON.stringify(catalog, null, 2)
      );
      console.log(`   Saved: catalog.json`);
      
      fs.writeFileSync(
        path.join(this.executionDir, 'catalog_datasets.json'),
        JSON.stringify(catalogDatasets, null, 2)
      );
      console.log(`   Saved: catalog_datasets.json`);
      
      fs.writeFileSync(
        path.join(this.executionDir, 'catalog_resources.json'),
        JSON.stringify(catalogResources, null, 2)
      );
      console.log(`   Saved: catalog_resources.json`);
      
      fs.writeFileSync(
        path.join(this.executionDir, 'catalog_search_history.json'),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'https://data.gov.ua',
          method: 'package_search_pagination',
          pageSize: pageSize,
          totalPackages: totalCount,
          packagesProcessed: processedCount,
          packagesFailed: errorCount,
          totalResources,
          executionTime: Date.now() - startTime,
        }, null, 2)
      );
      console.log(`   Saved: catalog_search_history.json`);
      
      const executionTime = Date.now() - startTime;
      
      console.log(`\n========================================`);
      console.log('DISCOVERY COMPLETE');
      console.log('========================================');
      console.log(`Total packages: ${totalCount}`);
      console.log(`Total resources: ${totalResources}`);
      console.log(`Execution time: ${(executionTime / 1000).toFixed(2)}s`);
      console.log(`Errors: ${errorCount}`);
      
      return {
        success: true,
        totalPackages: totalCount,
        totalResources,
        executionTime,
        errors,
      };
      
    } catch (error) {
      const errorMessage = String(error);
      console.error('\n❌ Discovery failed:', errorMessage);
      
      return {
        success: false,
        totalPackages: 0,
        totalResources: 0,
        executionTime: Date.now() - startTime,
        errors: [errorMessage, ...errors],
      };
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const discovery = new FullCKANDiscovery();
  discovery.executeFullDiscovery()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { FullCKANDiscovery };
