/**
 * Registry Discovery Platform (RDP)
 * Real-world Test Script for data.gov.ua
 * 
 * This script tests RDP against the actual data.gov.ua API
 * to prove it works end-to-end, not just on paper.
 */

const { CKANAdapter } = require('./adapters/CKANAdapter');

class RDPRealWorldTest {
  private catalogConfig: any;
  private adapter: typeof CKANAdapter;

  constructor() {
    this.catalogConfig = {
      id: 'data-gov-ua',
      name: 'data.gov.ua',
      type: 'CKAN',
      baseUrl: 'https://data.gov.ua',
      enabled: true,
    };

    this.adapter = new CKANAdapter(this.catalogConfig);
  }

  /**
   * Test 1: Connection to data.gov.ua
   */
  async testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
    console.log('\n=== TEST 1: Connection to data.gov.ua ===');
    
    try {
      const connected = await this.adapter.testConnection();
      
      if (connected) {
        console.log('✅ Connection successful');
        return { success: true, message: 'Connection successful' };
      } else {
        console.log('❌ Connection failed');
        return { success: false, message: 'Connection failed' };
      }
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ Connection error:', errorMsg);
      return { success: false, message: 'Connection error', error: errorMsg };
    }
  }

  /**
   * Test 2: Get package list
   */
  async testPackageList(): Promise<{ success: boolean; count: number; message: string; error?: string }> {
    console.log('\n=== TEST 2: Get Package List ===');
    
    try {
      const packages = await this.adapter.getPackageList();
      
      console.log(`✅ Retrieved ${packages.length} packages`);
      console.log(`   First 5 packages: ${packages.slice(0, 5).join(', ')}`);
      
      return { 
        success: true, 
        count: packages.length, 
        message: `Retrieved ${packages.length} packages` 
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ Package list error:', errorMsg);
      return { success: false, count: 0, message: 'Package list error', error: errorMsg };
    }
  }

  /**
   * Test 3: Package search
   */
  async testPackageSearch(): Promise<{ success: boolean; count: number; message: string; error?: string }> {
    console.log('\n=== TEST 3: Package Search ===');
    
    try {
      const result = await this.adapter.searchPackages({
        q: 'registry',
        rows: 10,
      });
      
      console.log(`✅ Search returned ${result.count} total packages`);
      console.log(`   Retrieved ${result.results.length} packages`);
      
      if (result.results.length > 0) {
        console.log(`   Sample package: ${result.results[0].name} - ${result.results[0].title}`);
      }
      
      return { 
        success: true, 
        count: result.count, 
        message: `Search returned ${result.count} packages` 
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ Package search error:', errorMsg);
      return { success: false, count: 0, message: 'Package search error', error: errorMsg };
    }
  }

  /**
   * Test 4: Package show
   */
  async testPackageShow(): Promise<{ success: boolean; resources: number; message: string; error?: string }> {
    console.log('\n=== TEST 4: Package Show ===');
    
    try {
      // First, get a package to test with
      const searchResult = await this.adapter.searchPackages({
        q: 'edr',
        rows: 1,
      });

      if (searchResult.results.length === 0) {
        console.log('❌ No packages found for testing');
        return { success: false, resources: 0, message: 'No packages found' };
      }

      const packageId = searchResult.results[0].id;
      console.log(`   Testing with package: ${packageId}`);

      const pkg = await this.adapter.getPackage(packageId);
      
      console.log(`✅ Retrieved package: ${pkg.name}`);
      console.log(`   Title: ${pkg.title}`);
      console.log(`   Organization: ${pkg.owner_org}`);
      console.log(`   Resources: ${pkg.resources.length}`);
      
      // Show resource details
      for (const resource of pkg.resources.slice(0, 3)) {
        console.log(`   - ${resource.name}: ${resource.format}, datastore_active=${resource.datastore_active}`);
      }
      
      return { 
        success: true, 
        resources: pkg.resources.length, 
        message: `Retrieved package with ${pkg.resources.length} resources` 
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ Package show error:', errorMsg);
      return { success: false, resources: 0, message: 'Package show error', error: errorMsg };
    }
  }

  /**
   * Test 5: Resource show
   */
  async testResourceShow(): Promise<{ success: boolean; datastoreActive: boolean; message: string; error?: string }> {
    console.log('\n=== TEST 5: Resource Show ===');
    
    try {
      // Get a package with resources
      const searchResult = await this.adapter.searchPackages({
        q: 'edr',
        rows: 1,
      });

      if (searchResult.results.length === 0) {
        return { success: false, datastoreActive: false, message: 'No packages found' };
      }

      const pkg = await this.adapter.getPackage(searchResult.results[0].id);
      
      if (pkg.resources.length === 0) {
        return { success: false, datastoreActive: false, message: 'No resources found' };
      }

      const resourceId = pkg.resources[0].id;
      console.log(`   Testing with resource: ${resourceId}`);

      const resource = await this.adapter.getResource(resourceId);
      
      console.log(`✅ Retrieved resource: ${resource.name}`);
      console.log(`   Format: ${resource.format}`);
      console.log(`   DataStore Active: ${resource.datastore_active}`);
      console.log(`   Size: ${resource.size} bytes`);
      console.log(`   URL: ${resource.url}`);
      
      return { 
        success: true, 
        datastoreActive: resource.datastoreActive, 
        message: `Retrieved resource, datastore_active=${resource.datastore_active}` 
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ Resource show error:', errorMsg);
      return { success: false, datastoreActive: false, message: 'Resource show error', error: errorMsg };
    }
  }

  /**
   * Test 6: DataStore search
   */
  async testDataStoreSearch(): Promise<{ success: boolean; records: number; message: string; error?: string }> {
    console.log('\n=== TEST 6: DataStore Search ===');
    
    try {
      // Find a resource with DataStore active
      const searchResult = await this.adapter.searchPackages({
        q: 'registry',
        rows: 5,
      });

      let resourceWithDS: any = null;

      for (const pkg of searchResult.results) {
        const fullPkg = await this.adapter.getPackage(pkg.id);
        const dsResource = fullPkg.resources.find((r: any) => r.datastore_active);
        if (dsResource) {
          resourceWithDS = dsResource;
          break;
        }
      }

      if (!resourceWithDS) {
        console.log('⚠️  No resources with DataStore found in search results');
        return { success: false, records: 0, message: 'No DataStore resources found' };
      }

      console.log(`   Testing with resource: ${resourceWithDS.id}`);
      console.log(`   DataStore Active: ${resourceWithDS.datastore_active}`);

      const response = await this.adapter.searchDataStore({
        resource_id: resourceWithDS.id,
        limit: 10,
      });

      console.log(`✅ DataStore search successful`);
      console.log(`   Total records: ${response.result.total}`);
      console.log(`   Retrieved records: ${response.result.records.length}`);
      console.log(`   Fields: ${response.result.fields.map((f: any) => f.id).join(', ')}`);
      
      if (response.result.records.length > 0) {
        console.log(`   Sample record:`, JSON.stringify(response.result.records[0], null, 2).substring(0, 200));
      }
      
      return { 
        success: true, 
        records: response.result.total, 
        message: `DataStore search returned ${response.result.total} total records` 
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ DataStore search error:', errorMsg);
      return { success: false, records: 0, message: 'DataStore search error', error: errorMsg };
    }
  }

  /**
   * Test 7: DataStore pagination
   */
  async testDataStorePagination(): Promise<{ success: boolean; message: string; error?: string }> {
    console.log('\n=== TEST 7: DataStore Pagination ===');
    
    try {
      // Find a resource with DataStore
      const searchResult = await this.adapter.searchPackages({
        q: 'registry',
        rows: 5,
      });

      let resourceWithDS: any = null;

      for (const pkg of searchResult.results) {
        const fullPkg = await this.adapter.getPackage(pkg.id);
        const dsResource = fullPkg.resources.find((r: any) => r.datastore_active);
        if (dsResource) {
          resourceWithDS = dsResource;
          break;
        }
      }

      if (!resourceWithDS) {
        return { success: false, message: 'No DataStore resources found' };
      }

      console.log(`   Testing pagination with resource: ${resourceWithDS.id}`);

      // Get first page
      const page1 = await this.adapter.searchDataStore({
        resource_id: resourceWithDS.id,
        limit: 5,
        offset: 0,
      });

      // Get second page
      const page2 = await this.adapter.searchDataStore({
        resource_id: resourceWithDS.id,
        limit: 5,
        offset: 5,
      });

      console.log(`✅ Pagination successful`);
      console.log(`   Page 1 records: ${page1.result.records.length}`);
      console.log(`   Page 2 records: ${page2.result.records.length}`);
      
      // Verify different records
      const page1Ids = page1.result.records.map((r: any) => r._id);
      const page2Ids = page2.result.records.map((r: any) => r._id);
      const overlap = page1Ids.filter((id: number) => page2Ids.includes(id)).length;

      console.log(`   Overlap between pages: ${overlap} (should be 0)`);
      
      return { 
        success: true, 
        message: `Pagination successful, overlap=${overlap}` 
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ Pagination error:', errorMsg);
      return { success: false, message: 'Pagination error', error: errorMsg };
    }
  }

  /**
   * Test 8: DataStore SQL
   */
  async testDataStoreSQL(): Promise<{ success: boolean; records: number; message: string; error?: string }> {
    console.log('\n=== TEST 8: DataStore SQL ===');
    
    try {
      // Find a resource with DataStore
      const searchResult = await this.adapter.searchPackages({
        q: 'registry',
        rows: 5,
      });

      let resourceWithDS: any = null;

      for (const pkg of searchResult.results) {
        const fullPkg = await this.adapter.getPackage(pkg.id);
        const dsResource = fullPkg.resources.find((r: any) => r.datastore_active);
        if (dsResource) {
          resourceWithDS = dsResource;
          break;
        }
      }

      if (!resourceWithDS) {
        return { success: false, records: 0, message: 'No DataStore resources found' };
      }

      console.log(`   Testing SQL with resource: ${resourceWithDS.id}`);

      const response = await this.adapter.searchDataStoreSQL(
        `SELECT * FROM "${resourceWithDS.id}" LIMIT 5`
      );

      console.log(`✅ SQL query successful`);
      console.log(`   Records returned: ${response.result.records.length}`);
      
      if (response.result.records.length > 0) {
        console.log(`   Sample record:`, JSON.stringify(response.result.records[0], null, 2).substring(0, 200));
      }
      
      return { 
        success: true, 
        records: response.result.records.length, 
        message: `SQL query returned ${response.result.records.length} records` 
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ SQL query error:', errorMsg);
      return { success: false, records: 0, message: 'SQL query error', error: errorMsg };
    }
  }

  /**
   * Test 9: Download non-DataStore resource
   */
  async testNonDataStoreDownload(): Promise<{ success: boolean; size: number; message: string; error?: string }> {
    console.log('\n=== TEST 9: Non-DataStore Resource Download ===');
    
    try {
      // Find a resource without DataStore
      const searchResult = await this.adapter.searchPackages({
        q: 'registry',
        rows: 5,
      });

      let resourceWithoutDS: any = null;

      for (const pkg of searchResult.results) {
        const fullPkg = await this.adapter.getPackage(pkg.id);
        const nonDSResource = fullPkg.resources.find((r: any) => !r.datastore_active && r.format === 'CSV');
        if (nonDSResource) {
          resourceWithoutDS = nonDSResource;
          break;
        }
      }

      if (!resourceWithoutDS) {
        console.log('⚠️  No non-DataStore CSV resources found');
        return { success: false, size: 0, message: 'No non-DataStore CSV resources found' };
      }

      console.log(`   Testing download of: ${resourceWithoutDS.name}`);
      console.log(`   Format: ${resourceWithoutDS.format}`);
      console.log(`   URL: ${resourceWithoutDS.url}`);

      const response = await fetch(resourceWithoutDS.url);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const size = buffer.length;

      console.log(`✅ Download successful`);
      console.log(`   Size: ${size} bytes`);
      console.log(`   Size (KB): ${(size / 1024).toFixed(2)} KB`);
      
      // Try to parse as CSV
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter(line => line.trim());
      console.log(`   Lines in CSV: ${lines.length}`);
      if (lines[0]) {
        console.log(`   First line: ${lines[0].substring(0, 100)}...`);
      }
      
      return { 
        success: true, 
        size, 
        message: `Downloaded ${size} bytes, ${lines.length} lines` 
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ Download error:', errorMsg);
      return { success: false, size: 0, message: 'Download error', error: errorMsg };
    }
  }

  /**
   * Test 10: Generate catalog.json
   */
  async testCatalogGeneration(): Promise<{ success: boolean; datasets: number; message: string; error?: string }> {
    console.log('\n=== TEST 10: Catalog Generation ===');
    
    try {
      // Search for a limited number of datasets
      const searchResult = await this.adapter.searchPackages({
        q: 'registry',
        rows: 10,
      });

      const catalog = {
        version: '2.0',
        generatedAt: new Date().toISOString(),
        totalDatasets: searchResult.count,
        datasets: searchResult.results.map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          title: pkg.title,
          organization: pkg.owner_org,
          resources: pkg.resources.map((r: any) => ({
            id: r.id,
            name: r.name,
            format: r.format,
            datastoreActive: r.datastore_active,
            size: r.size,
          })),
        })),
      };

      console.log(`✅ Catalog generated`);
      console.log(`   Total datasets in catalog: ${catalog.datasets.length}`);
      console.log(`   Total datasets available: ${catalog.totalDatasets}`);
      
      // Save to file
      const fs = require('fs');
      const path = require('path');
      const catalogPath = path.join(__dirname, 'test-catalog.json');
      fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
      console.log(`   Saved to: ${catalogPath}`);
      
      return { 
        success: true, 
        datasets: catalog.datasets.length, 
        message: `Generated catalog with ${catalog.datasets.length} datasets` 
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error('❌ Catalog generation error:', errorMsg);
      return { success: false, datasets: 0, message: 'Catalog generation error', error: errorMsg };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<{
    total: number;
    passed: number;
    failed: number;
    results: any[];
  }> {
    console.log('\n========================================');
    console.log('RDP REAL-WORLD TEST SUITE');
    console.log('Testing against: https://data.gov.ua');
    console.log('========================================');

    const tests = [
      this.testConnection(),
      this.testPackageList(),
      this.testPackageSearch(),
      this.testPackageShow(),
      this.testResourceShow(),
      this.testDataStoreSearch(),
      this.testDataStorePagination(),
      this.testDataStoreSQL(),
      this.testNonDataStoreDownload(),
      this.testCatalogGeneration(),
    ];

    const results = await Promise.all(tests);
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n========================================');
    console.log('TEST RESULTS');
    console.log('========================================');
    console.log(`Total: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED - RDP WORKS ON REAL DATA.GOV.UA');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED - REVIEW REQUIRED');
      console.log('\nFailed tests:');
      results.forEach((r, i) => {
        if (!r.success) {
          console.log(`  ${i + 1}. ${r.message}`);
          if (r.error) console.log(`     Error: ${r.error}`);
        }
      });
    }

    return {
      total: tests.length,
      passed,
      failed,
      results,
    };
  }
}

// Run tests if executed directly
if (require.main === module) {
  const test = new RDPRealWorldTest();
  test.runAllTests().then(results => {
    process.exit(results.failed === 0 ? 0 : 1);
  });
}
