/**
 * Count Reconciliation Analysis
 * 
 * Analyzes existing catalog.json to reconcile resource count discrepancies
 * Reported counts: 322,509 vs 47,819
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXECUTION_DIR = __dirname;

async function reconcileCounts() {
  console.log('========================================');
  console.log('COUNT RECONCILIATION ANALYSIS');
  console.log('========================================');
  console.log('');

  const catalogPath = path.join(EXECUTION_DIR, 'catalog.json');
  const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  console.log('Catalog metadata:');
  console.log(`  Version: ${catalogData.version}`);
  console.log(`  Generated: ${catalogData.generatedAt}`);
  console.log(`  Source: ${catalogData.source}`);
  console.log(`  Total datasets (metadata): ${catalogData.totalDatasets}`);
  console.log(`  Datasets in array: ${catalogData.datasets.length}`);
  console.log('');

  // Count resources in the catalog
  let totalResources = 0;
  let resourcesWithDataStore = 0;
  let resourcesWithoutDataStore = 0;
  let resourceFormats: Map<string, number> = new Map();
  const datasetResourceCounts: number[] = [];

  console.log('Analyzing resources...');
  
  for (const dataset of catalogData.datasets) {
    if (dataset.resources && Array.isArray(dataset.resources)) {
      const resourceCount = dataset.resources.length;
      datasetResourceCounts.push(resourceCount);
      totalResources += resourceCount;
      
      for (const resource of dataset.resources) {
        // Count by format
        const format = resource.format || 'unknown';
        resourceFormats.set(format, (resourceFormats.get(format) || 0) + 1);
        
        // Count DataStore availability
        if (resource.datastore_active === true) {
          resourcesWithDataStore++;
        } else {
          resourcesWithoutDataStore++;
        }
      }
    }
  }

  // Calculate statistics
  const avgResourcesPerDataset = datasetResourceCounts.length > 0 
    ? totalResources / datasetResourceCounts.length 
    : 0;
  const maxResources = Math.max(...datasetResourceCounts, 0);
  const minResources = Math.min(...datasetResourceCounts, 0);

  console.log('\nResource statistics:');
  console.log(`  Total resources in catalog: ${totalResources}`);
  console.log(`  Average resources per dataset: ${avgResourcesPerDataset.toFixed(2)}`);
  console.log(`  Max resources in a dataset: ${maxResources}`);
  console.log(`  Min resources in a dataset: ${minResources}`);
  console.log(`  Resources with DataStore: ${resourcesWithDataStore}`);
  console.log(`  Resources without DataStore: ${resourcesWithoutDataStore}`);
  console.log('');

  console.log('Resource formats:');
  const sortedFormats = Array.from(resourceFormats.entries()).sort((a, b) => b[1] - a[1]);
  for (const [format, count] of sortedFormats.slice(0, 10)) {
    console.log(`  ${format}: ${count}`);
  }

  // Reconcile with reported counts
  console.log('\n========================================');
  console.log('COUNT RECONCILIATION');
  console.log('========================================');
  console.log(`Catalog datasets: ${catalogData.datasets.length}`);
  console.log(`Catalog resources: ${totalResources}`);
  console.log(`Reported count 1: 322,509`);
  console.log(`Reported count 2: 47,819`);
  console.log('');

  const reconciliation = {
    catalog_datasets: catalogData.datasets.length,
    catalog_resources: totalResources,
    reported_count_1: 322509,
    reported_count_2: 47819,
    discrepancy_1: Math.abs(totalResources - 322509),
    discrepancy_2: Math.abs(totalResources - 47819),
    avg_resources_per_dataset: avgResourcesPerDataset,
    estimated_full_catalog_resources: 0,
    analysis: '',
  };

  // Estimate full catalog resources
  if (catalogData.totalDatasets > catalogData.datasets.length) {
    const ratio = catalogData.totalDatasets / catalogData.datasets.length;
    reconciliation.estimated_full_catalog_resources = Math.round(totalResources * ratio);
    console.log(`Estimated full catalog resources: ${reconciliation.estimated_full_catalog_resources}`);
  }

  // Analysis
  if (totalResources > 300000) {
    reconciliation.analysis = 'Catalog resources match reported count 1 (322,509). This count likely includes all resources including metadata, documentation, and auxiliary files.';
  } else if (totalResources > 40000 && totalResources < 60000) {
    reconciliation.analysis = 'Catalog resources match reported count 2 (47,819). This count likely includes only primary data resources (CSV, JSON, XLSX).';
  } else {
    reconciliation.analysis = `Catalog resources (${totalResources}) do not match either reported count. The catalog sample (${catalogData.datasets.length} datasets) may not be representative of the full catalog (${catalogData.totalDatasets} datasets).`;
  }

  console.log(`Analysis: ${reconciliation.analysis}`);
  console.log('');

  // Additional analysis
  console.log('Additional findings:');
  console.log(`  Catalog is incomplete: ${catalogData.datasets.length} / ${catalogData.totalDatasets} datasets (${((catalogData.datasets.length / catalogData.totalDatasets) * 100).toFixed(2)}%)`);
  console.log(`  DataStore coverage: ${((resourcesWithDataStore / totalResources) * 100).toFixed(2)}%`);
  console.log(`  Most common format: ${sortedFormats[0]?.[0] || 'N/A'} (${sortedFormats[0]?.[1] || 0})`);

  const report = {
    reconciliation,
    resource_formats: Object.fromEntries(resourceFormats),
    dataset_resource_stats: {
      total: datasetResourceCounts.length,
      average: avgResourcesPerDataset,
      max: maxResources,
      min: minResources,
    },
    datastore_stats: {
      with_datastore: resourcesWithDataStore,
      without_datastore: resourcesWithoutDataStore,
      coverage_percent: (resourcesWithDataStore / totalResources) * 100,
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(EXECUTION_DIR, 'COUNT_RECONCILIATION_REPORT.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('\n✓ Saved: COUNT_RECONCILIATION_REPORT.json');
}

// Execute reconciliation
reconcileCounts().catch(error => {
  console.error('Reconciliation failed:', error);
  process.exit(1);
});
