/**
 * Simple test script for data.gov.ua API
 * Tests basic CKAN API functionality without full RDP modules
 */

const BASE_URL = 'https://data.gov.ua/api/3/action';

async function testConnection() {
  console.log('\n=== TEST 1: Connection ===');
  try {
    const response = await fetch(`${BASE_URL}/package_list`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Connection successful');
      console.log(`   Total packages: ${data.result.length}`);
      return { success: true, count: data.result.length };
    } else {
      console.log('❌ API returned error');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testPackageSearch() {
  console.log('\n=== TEST 2: Package Search ===');
  try {
    const response = await fetch(`${BASE_URL}/package_search?q=registry&rows=5`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Search successful');
      console.log(`   Total results: ${data.result.count}`);
      console.log(`   Retrieved: ${data.result.results.length}`);
      
      if (data.result.results.length > 0) {
        const pkg = data.result.results[0];
        console.log(`   Sample: ${pkg.name} - ${pkg.title}`);
      }
      
      return { success: true, count: data.result.count };
    } else {
      console.log('❌ Search failed');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Search error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testPackageShow() {
  console.log('\n=== TEST 3: Package Show ===');
  try {
    // First get a package ID
    const searchResponse = await fetch(`${BASE_URL}/package_search?q=edr&rows=1`);
    const searchData = await searchResponse.json();
    
    if (!searchData.success || searchData.result.results.length === 0) {
      console.log('❌ No packages found');
      return { success: false };
    }
    
    const packageId = searchData.result.results[0].id;
    console.log(`   Testing package: ${packageId}`);
    
    const response = await fetch(`${BASE_URL}/package_show?id=${packageId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Package show successful');
      console.log(`   Name: ${data.result.name}`);
      console.log(`   Title: ${data.result.title}`);
      console.log(`   Organization: ${data.result.owner_org}`);
      console.log(`   Resources: ${data.result.resources.length}`);
      
      for (const resource of data.result.resources.slice(0, 3)) {
        console.log(`   - ${resource.name}: ${resource.format}, datastore=${resource.datastore_active}`);
      }
      
      return { success: true, resources: data.result.resources.length };
    } else {
      console.log('❌ Package show failed');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Package show error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testDataStoreSearch() {
  console.log('\n=== TEST 4: DataStore Search ===');
  try {
    // Search more broadly for packages with DataStore
    const searchTerms = ['data', 'list', 'registry', 'catalog', 'information'];
    let resourceWithDS = null;
    let packageId = '';
    
    for (const term of searchTerms) {
      console.log(`   Searching for: ${term}`);
      const searchResponse = await fetch(`${BASE_URL}/package_search?q=${term}&rows=20`);
      const searchData = await searchResponse.json();
      
      if (searchData.success) {
        for (const pkg of searchData.result.results) {
          try {
            const pkgResponse = await fetch(`${BASE_URL}/package_show?id=${pkg.id}`);
            const pkgData = await pkgResponse.json();
            
            if (pkgData.success) {
              const dsResource = pkgData.result.resources.find(r => r.datastore_active);
              if (dsResource) {
                resourceWithDS = dsResource;
                packageId = pkg.id;
                console.log(`   Found DataStore in package: ${pkg.name}`);
                break;
              }
            }
          } catch (e) {
            // Skip this package if fetch fails
            continue;
          }
        }
      }
      
      if (resourceWithDS) break;
    }
    
    if (!resourceWithDS) {
      console.log('⚠️  No DataStore resources found in any search');
      console.log('   Note: DataStore may not be enabled on data.gov.ua or requires special access');
      return { success: false, message: 'No DataStore found - may require special access' };
    }
    
    console.log(`   Testing resource: ${resourceWithDS.id}`);
    console.log(`   DataStore active: ${resourceWithDS.datastore_active}`);
    
    const response = await fetch(`${BASE_URL}/datastore_search?resource_id=${resourceWithDS.id}&limit=5`);
    const data = await response.json();
    
    console.log(`   Response success: ${data.success}`);
    if (!data.success) {
      console.log(`   Error: ${JSON.stringify(data.error)}`);
    }
    
    if (data.success) {
      console.log('✅ DataStore search successful');
      console.log(`   Total records: ${data.result.total}`);
      console.log(`   Retrieved: ${data.result.records.length}`);
      console.log(`   Fields: ${data.result.fields.map(f => f.id).join(', ')}`);
      
      if (data.result.records.length > 0) {
        console.log(`   Sample: ${JSON.stringify(data.result.records[0]).substring(0, 150)}...`);
      }
      
      return { success: true, records: data.result.total };
    } else {
      console.log('❌ DataStore search failed - resource may not exist in DataStore');
      return { success: false, error: data.error, message: 'DataStore resource not found' };
    }
  } catch (error) {
    console.error('❌ DataStore error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testDataStoreSQL() {
  console.log('\n=== TEST 5: DataStore SQL ===');
  console.log('   Skipping - DataStore not available on data.gov.ua');
  console.log('   Note: data.gov.ua resources marked as datastore_active=true may not have actual DataStore data');
  return { success: false, message: 'DataStore not available - using file downloads instead' };
}

async function testCSVDownload() {
  console.log('\n=== TEST 5: CSV Resource Download ===');
  try {
    // Find a CSV resource
    const searchResponse = await fetch(`${BASE_URL}/package_search?q=registry&rows=10`);
    const searchData = await searchResponse.json();
    
    let csvResource = null;
    
    for (const pkg of searchData.result.results) {
      try {
        const pkgResponse = await fetch(`${BASE_URL}/package_show?id=${pkg.id}`);
        const pkgData = await pkgResponse.json();
        
        if (pkgData.success) {
          const csvRes = pkgData.result.resources.find(r => r.format.toLowerCase() === 'csv');
          if (csvRes) {
            csvResource = csvRes;
            console.log(`   Found CSV: ${csvRes.name}`);
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!csvResource) {
      console.log('⚠️  No CSV resources found');
      return { success: false, message: 'No CSV found' };
    }
    
    console.log(`   Downloading: ${csvResource.url}`);
    
    const response = await fetch(csvResource.url);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log('✅ CSV download successful');
    console.log(`   Size: ${text.length} bytes`);
    console.log(`   Lines: ${lines.length}`);
    console.log(`   First line: ${lines[0].substring(0, 100)}...`);
    
    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log(`   Headers: ${headers.join(', ')}`);
    
    return { 
      success: true, 
      size: text.length, 
      lines: lines.length,
      headers: headers.length,
      message: `Downloaded CSV with ${lines.length} lines and ${headers.length} columns` 
    };
  } catch (error) {
    console.error('❌ CSV download error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n========================================');
  console.log('DATA.GOV.UA API TEST SUITE');
  console.log('========================================');
  
  const tests = [
    testConnection(),
    testPackageSearch(),
    testPackageShow(),
    testDataStoreSearch(),
    testCSVDownload(),
  ];
  
  const results = await Promise.all(tests);
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n========================================');
  console.log('RESULTS');
  console.log('========================================');
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - DATA.GOV.UA API IS WORKING');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
  }
  
  return { total: tests.length, passed, failed };
}

runAllTests().then(results => {
  process.exit(results.failed === 0 ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
