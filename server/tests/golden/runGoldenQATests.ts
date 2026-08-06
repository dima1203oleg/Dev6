/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Main Golden QA Test Runner
 */

import dotenv from 'dotenv';
import { GoldenQAOrchestrator } from './GoldenQAOrchestrator';
import { GoldenQAReportGenerator } from './GoldenQAReportGenerator';
import { GoldenDataset } from './types';

// Load environment variables
dotenv.config();

interface RunnerOptions {
  goldenDatasetPath: string;
  backendDataPath: string;
  uiDataPath: string;
  baseURL: string;
  outputDir: string;
  generateJSON: boolean;
  generateMarkdown: boolean;
  generateCSV: boolean;
  consoleOutput: boolean;
  enableSelfHealing: boolean;
  runSystemHealthCheck: boolean;
}

function parseArguments(): RunnerOptions {
  const args = process.argv.slice(2);
  const options: RunnerOptions = {
    goldenDatasetPath: './server/tests/golden/datasets/golden-dataset-3111724753.json',
    backendDataPath: '',
    uiDataPath: '',
    baseURL: 'http://localhost:3000',
    outputDir: './golden-qa-reports',
    generateJSON: true,
    generateMarkdown: true,
    generateCSV: false,
    consoleOutput: true,
    enableSelfHealing: false,
    runSystemHealthCheck: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--golden-dataset':
      case '-g':
        options.goldenDatasetPath = args[++i];
        break;
      case '--backend-data':
      case '-b':
        options.backendDataPath = args[++i];
        break;
      case '--ui-data':
      case '-u':
        options.uiDataPath = args[++i];
        break;
      case '--url':
        options.baseURL = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputDir = args[++i];
        break;
      case '--no-json':
        options.generateJSON = false;
        break;
      case '--no-markdown':
        options.generateMarkdown = false;
        break;
      case '--csv':
        options.generateCSV = true;
        break;
      case '--no-console':
        options.consoleOutput = false;
        break;
      case '--self-healing':
        options.enableSelfHealing = true;
        break;
      case '--health-check':
        options.runSystemHealthCheck = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
PREDATOR Analytics - Golden QA Validation Test Runner

Usage: tsx runGoldenQATests.ts [options]

Options:
  -g, --golden-dataset <path>   Path to golden dataset JSON file [default: ./server/tests/golden/datasets/golden-dataset-3111724753.json]
  -b, --backend-data <path>    Path to backend data JSON file (required for validation)
  -u, --ui-data <path>         Path to UI data JSON file (required for validation)
  --url <url>                  Base URL of the application [default: http://localhost:3000]
  -o, --output <dir>           Output directory for reports [default: ./golden-qa-reports]
  --no-json                    Skip JSON report generation
  --no-markdown                Skip Markdown report generation
  --csv                        Generate CSV report
  --no-console                 Skip console output
  --self-healing               Enable self-healing capabilities
  --health-check               Run system health check only
  -h, --help                   Show this help message

Examples:
  # Run Golden QA validation with backend and UI data
  tsx runGoldenQATests.ts --backend-data backend.json --ui-data ui.json

  # Run with custom golden dataset
  tsx runGoldenQATests.ts -g custom-dataset.json -b backend.json -u ui.json

  # Run system health check only
  tsx runGoldenQATests.ts --health-check

  # Enable self-healing
  tsx runGoldenQATests.ts -b backend.json -u ui.json --self-healing
`);
}

async function loadGoldenDataset(path: string): Promise<GoldenDataset> {
  try {
    const fs = await import('fs');
    const data = fs.readFileSync(path, 'utf-8');
    const dataset = JSON.parse(data);
    
    // Convert date strings to Date objects
    if (dataset.identification && dataset.identification.birth_date) {
      dataset.identification.birth_date = new Date(dataset.identification.birth_date);
    }
    
    if (dataset.last_verified) {
      dataset.last_verified = new Date(dataset.last_verified);
    }
    
    // Convert nested date fields
    if (dataset.addresses) {
      dataset.addresses.forEach((addr: any) => {
        if (addr.period && addr.period.from) {
          addr.period.from = new Date(addr.period.from);
        }
        if (addr.period && addr.period.to) {
          addr.period.to = new Date(addr.period.to);
        }
      });
    }
    
    if (dataset.contacts) {
      dataset.contacts.forEach((contact: any) => {
        if (contact.last_verified) {
          contact.last_verified = new Date(contact.last_verified);
        }
      });
    }
    
    if (dataset.business_relationships) {
      dataset.business_relationships.forEach((rel: any) => {
        if (rel.period && rel.period.from) {
          rel.period.from = new Date(rel.period.from);
        }
        if (rel.period && rel.period.to) {
          rel.period.to = new Date(rel.period.to);
        }
      });
    }
    
    if (dataset.court_cases) {
      dataset.court_cases.forEach((c: any) => {
        if (c.case_date) {
          c.case_date = new Date(c.case_date);
        }
      });
    }
    
    if (dataset.enforcement_proceedings) {
      dataset.enforcement_proceedings.forEach((p: any) => {
        if (p.last_updated) {
          p.last_updated = new Date(p.last_updated);
        }
      });
    }
    
    if (dataset.sanctions) {
      dataset.sanctions.forEach((s: any) => {
        if (s.effective_date) {
          s.effective_date = new Date(s.effective_date);
        }
      });
    }
    
    if (dataset.pep_records) {
      dataset.pep_records.forEach((p: any) => {
        if (p.effective_date) {
          p.effective_date = new Date(p.effective_date);
        }
      });
    }
    
    if (dataset.property && dataset.property.licenses) {
      dataset.property.licenses.forEach((l: any) => {
        if (l.issued_date) {
          l.issued_date = new Date(l.issued_date);
        }
        if (l.expiry_date) {
          l.expiry_date = new Date(l.expiry_date);
        }
      });
    }
    
    if (dataset.property && dataset.property.customs_profile && dataset.property.customs_profile.last_activity) {
      dataset.property.customs_profile.last_activity = new Date(dataset.property.customs_profile.last_activity);
    }
    
    return dataset;
  } catch (error) {
    console.error(`Failed to load golden dataset from ${path}:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function loadData(path: string, dataType: string): Promise<any> {
  try {
    const fs = await import('fs');
    const data = fs.readFileSync(path, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load ${dataType} from ${path}:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function main(): Promise<void> {
  console.log('Starting PREDATOR Analytics Golden QA Validation Framework...\n');

  const options = parseOptions();

  // Create output directory if it doesn't exist
  const fs = await import('fs');
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  console.log(`Test Configuration:`);
  console.log(`  Golden Dataset: ${options.goldenDatasetPath}`);
  console.log(`  Backend Data: ${options.backendDataPath || 'Not provided'}`);
  console.log(`  UI Data: ${options.uiDataPath || 'Not provided'}`);
  console.log(`  Base URL: ${options.baseURL}`);
  console.log(`  Output Directory: ${options.outputDir}`);
  console.log(`  Self-Healing: ${options.enableSelfHealing ? 'Enabled' : 'Disabled'}`);
  console.log(`  System Health Check: ${options.runSystemHealthCheck ? 'Yes' : 'No'}\n`);

  // Load golden dataset
  console.log('Loading golden dataset...');
  const goldenDataset = await loadGoldenDataset(options.goldenDatasetPath);
  console.log(`Golden dataset loaded for IPN: ${goldenDataset.test_ipn}\n`);

  // Initialize orchestrator
  const orchestrator = new GoldenQAOrchestrator(goldenDataset, options.baseURL);

  const startTime = Date.now();
  let report;

  if (options.runSystemHealthCheck) {
    console.log('Running system health check...\n');
    report = await orchestrator.runSystemHealthCheck();
  } else {
    if (!options.backendDataPath || !options.uiDataPath) {
      console.error('Error: Backend data and UI data paths are required for validation.');
      console.error('Use --backend-data and --ui-data options, or run with --health-check for system health only.');
      process.exit(1);
    }

    console.log('Loading backend and UI data...');
    const backendData = await loadData(options.backendDataPath, 'backend data');
    const uiData = await loadData(options.uiDataPath, 'UI data');
    console.log('Data loaded successfully\n');

    console.log('Running Golden QA validation...\n');
    report = await orchestrator.runGoldenValidation(backendData, uiData);
  }

  const duration = Date.now() - startTime;
  console.log(`\nValidation completed in ${(duration / 1000).toFixed(2)} seconds\n`);

  // Generate reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (options.generateJSON) {
    const jsonPath = `${options.outputDir}/golden-qa-report-${timestamp}.json`;
    GoldenQAReportGenerator.generateJSONReport(report, jsonPath);
    console.log(`JSON report generated: ${jsonPath}`);
  }

  if (options.generateMarkdown) {
    const mdPath = `${options.outputDir}/golden-qa-report-${timestamp}.md`;
    GoldenQAReportGenerator.generateMarkdownReport(report, mdPath);
    console.log(`Markdown report generated: ${mdPath}`);
  }

  if (options.generateCSV) {
    const csvPath = `${options.outputDir}/golden-qa-report-${timestamp}.csv`;
    GoldenQAReportGenerator.generateCSVReport(report, csvPath);
    console.log(`CSV report generated: ${csvPath}`);
  }

  // Console output
  if (options.consoleOutput) {
    GoldenQAReportGenerator.generateConsoleReport(report);
  }

  // Handle registry changes if detected
  if (report.registry_changes_detected.length > 0) {
    console.log('\nRegistry changes detected. Would you like to handle them? (This requires manual verification)');
    console.log('Detected changes:');
    for (const change of report.registry_changes_detected) {
      console.log(`  - ${change.registry}: ${change.field}`);
    }
  }

  // Exit with appropriate code
  const exitCode = report.overall_status === 'PASS' ? 0 : 1;
  process.exit(exitCode);
}

function parseOptions(): RunnerOptions {
  return parseArguments();
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
