/**
 * Registry Discovery Platform (RDP)
 * Positive Control Finder
 * 
 * This script searches through downloaded registry data to find
 * a real IPN that exists in the data for positive control testing
 */

import { CatalogConfig } from './types.js';
import { CKANAdapter } from './adapters/CKANAdapter.js';

class PositiveControlFinder {
  private catalogConfig: CatalogConfig;
  private adapter: CKANAdapter;

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

  async findPositiveControl(): Promise<{
    success: boolean;
    positiveIPN?: string;
    sourceDataset?: string;
    sourceResource?: string;
    record?: any;
  }> {
    console.log('\n========================================');
    console.log('POSITIVE CONTROL FINDER');
    console.log('Source: https://data.gov.ua');
    console.log('========================================\n');

    try {
      // Search for datasets with DataStore active (CSV format preferred)
      console.log('Searching for CSV datasets with DataStore...');
      const searchResult = await this.adapter.searchPackages({
        rows: 100,
        q: 'res_format:CSV',
      });

      console.log(`Found ${searchResult.results.length} CSV datasets`);

      // Test each dataset to find one with actual data
      for (let i = 0; i < Math.min(20, searchResult.results.length); i++) {
        const pkg = searchResult.results[i];
        if (!pkg) continue;
        
        console.log(`\n--- Testing dataset ${i + 1}: ${pkg.title.substring(0, 50)}... ---`);

        try {
          const fullPkg = await this.adapter.getPackage(pkg.id);
          
          // Find CSV resources
          const csvResources = fullPkg.resources?.filter((r: any) => 
            r.format === 'CSV' || r.mimetype === 'text/csv'
          ) || [];

          if (csvResources.length === 0) {
            console.log('   No CSV resources found');
            continue;
          }

          console.log(`   Found ${csvResources.length} CSV resources`);

          // Test first CSV resource
          const resource = csvResources[0];
          if (!resource) continue;
          
          console.log(`   Testing resource: ${resource.name}`);

          // Check DataStore availability
          const probeResult = await this.adapter.probeDataStoreAvailability(resource.id);
          
          if (probeResult.available) {
            console.log(`   DataStore available, fetching sample records...`);
            
            const dataStoreResult = await this.adapter.searchDataStore({
              resource_id: resource.id,
              limit: 100,
            });

            const records = dataStoreResult.result.records;
            console.log(`   Fetched ${records.length} records`);

            if (records.length === 0) {
              console.log('   No records in DataStore');
              continue;
            }

            // Search for IPN fields in records (exclude postal codes and other non-entity IDs)
            const ipnFields = ['ipn', 'rnokpp', 'tax_id', 'edrpou', 'inn', 'kod', 'code', 'id_code', 'taxpayer_id'];
            const excludedFields = ['postcode', 'post_code', 'zip', 'postal', 'address', 'geo', 'coordinates', 'latitude', 'longitude'];
            
            for (const record of records) {
              for (const field of Object.keys(record)) {
                const fieldLower = field.toLowerCase();
                
                // Skip excluded fields
                if (excludedFields.some(ex => fieldLower.includes(ex))) {
                  continue;
                }
                
                // Check if field matches IPN-related patterns
                const isIPNField = ipnFields.some(f => fieldLower.includes(f));
                
                if (isIPNField || fieldLower.includes('id')) {
                  const value = record[field];
                  if (value && typeof value === 'string') {
                    // Extract numeric part (IPN is typically 10 digits for individuals, 8 for companies)
                    const numericValue = value.replace(/\D/g, '');
                    
                    // Check if it's a valid IPN (10 digits) or EDRPOU (8 digits)
                    // Exclude postal codes (5-6 digits) and other short codes
                    if ((numericValue.length === 10 || numericValue.length === 8) && numericValue.length > 6) {
                      console.log(`\n✅ FOUND POSITIVE CONTROL:`);
                      console.log(`   IPN/EDRPOU: ${numericValue}`);
                      console.log(`   Field: ${field}`);
                      console.log(`   Dataset: ${pkg?.title}`);
                      console.log(`   Resource: ${resource?.name}`);
                      console.log(`   Record: ${JSON.stringify(record).substring(0, 200)}...`);

                      return {
                        success: true,
                        positiveIPN: numericValue,
                        sourceDataset: pkg.title,
                        sourceResource: resource.name,
                        record,
                      };
                    }
                  }
                }
              }
            }

            console.log('   No IPN fields found in sample records');
            
          } else {
            console.log(`   DataStore not available, trying direct download...`);
            
            // Try direct download
            const response = await fetch(resource?.url);
            if (!response.ok) {
              console.log(`   Download failed: ${response.status}`);
              continue;
            }

            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
              console.log('   Empty file');
              continue;
            }

            console.log(`   Downloaded ${lines.length} lines`);

            // Parse CSV headers
            const firstLine = lines[0];
            if (!firstLine) {
              console.log('   Empty first line');
              continue;
            }
            
            const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
            console.log(`   Headers: ${headers.join(', ')}`);

            // Check for IPN-related headers (exclude postal codes)
            const ipnFields = ['ipn', 'rnokpp', 'tax_id', 'edrpou', 'inn', 'kod', 'code', 'id_code', 'taxpayer_id'];
            const excludedFields = ['postcode', 'post_code', 'zip', 'postal', 'address', 'geo', 'coordinates', 'latitude', 'longitude'];
            
            const ipnHeader = headers.find(h => {
              const hLower = h.toLowerCase();
              const isIPNField = ipnFields.some(f => hLower.includes(f));
              const isExcluded = excludedFields.some(ex => hLower.includes(ex));
              return isIPNField && !isExcluded;
            });

            if (ipnHeader) {
              console.log(`   Found IPN header: ${ipnHeader}`);
              
              // Extract IPN from first data row
              const secondLine = lines[1];
              if (!secondLine) {
                console.log('   No data row found');
                continue;
              }
              
              const firstRow = secondLine.split(',').map(v => v.trim().replace(/"/g, ''));
              const ipnIndex = headers.indexOf(ipnHeader);
              const ipnValue = firstRow[ipnIndex];
              if (!ipnValue) {
                console.log('   No IPN value found');
                continue;
              }
              
              const numericIPN = ipnValue.replace(/\D/g, '');

              if ((numericIPN.length === 10 || numericIPN.length === 8) && numericIPN.length > 6) {
                console.log(`\n✅ FOUND POSITIVE CONTROL:`);
                console.log(`   IPN/EDRPOU: ${numericIPN}`);
                console.log(`   Field: ${ipnHeader}`);
                console.log(`   Dataset: ${pkg?.title}`);
                console.log(`   Resource: ${resource?.name}`);

                return {
                  success: true,
                  positiveIPN: numericIPN,
                  sourceDataset: pkg.title,
                  sourceResource: resource.name,
                  record: { [ipnHeader]: ipnValue },
                };
              }
            }

            console.log('   No IPN header found');
          }

        } catch (error) {
          console.error(`   Error testing dataset: ${error}`);
          continue;
        }
      }

      console.log('\n❌ No positive control found in tested datasets');
      return {
        success: false,
      };

    } catch (error) {
      console.error('\n❌ Search failed:', error);
      throw error;
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const finder = new PositiveControlFinder();
  finder.findPositiveControl()
    .then(result => {
      if (result.success) {
        console.log(`\nPOSITIVE CONTROL: ${result.positiveIPN}`);
        process.exit(0);
      } else {
        console.log('\nNO POSITIVE CONTROL FOUND');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { PositiveControlFinder };
