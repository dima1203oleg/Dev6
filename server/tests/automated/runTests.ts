/**
 * PREDATOR Analytics - Automated Test Framework
 * Main Test Runner
 */

import dotenv from 'dotenv';
import { TestOrchestrator } from './TestOrchestrator';
import { ReportGenerator } from './ReportGenerator';
import { SourceConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Load environment variables
dotenv.config();

interface RunnerOptions {
  environment: 'QA' | 'INTEGRATION' | 'PRODUCTION';
  testIPN: string;
  timeoutMs: number;
  retryCount: number;
  outputDir: string;
  sourceConfigPath: string;
  sourceIds?: string[];
  generateJSON: boolean;
  generateMarkdown: boolean;
  generateCSV: boolean;
  consoleOutput: boolean;
}

async function loadSourceConfigs(configPath: string): Promise<SourceConfig[]> {
  try {
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(fileContent) as any;
    
    if (!config || !config.sources) {
      throw new Error('Invalid source configuration format');
    }
    
    return config.sources as SourceConfig[];
  } catch (error) {
    console.error(`Error loading source configuration: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

function parseArguments(): RunnerOptions {
  const args = process.argv.slice(2);
  const options: RunnerOptions = {
    environment: 'QA',
    testIPN: '3111724753',
    timeoutMs: 30000,
    retryCount: 3,
    outputDir: './test-reports',
    sourceConfigPath: './server/config/sourceMatrix.yaml',
    generateJSON: true,
    generateMarkdown: true,
    generateCSV: true,
    consoleOutput: true,
    sourceIds: undefined
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--environment':
      case '-e':
        options.environment = (args[++i] as 'QA' | 'INTEGRATION' | 'PRODUCTION');
        break;
      case '--ipn':
      case '-i':
        options.testIPN = args[++i];
        break;
      case '--timeout':
      case '-t':
        options.timeoutMs = parseInt(args[++i], 10);
        break;
      case '--retries':
      case '-r':
        options.retryCount = parseInt(args[++i], 10);
        break;
      case '--output':
      case '-o':
        options.outputDir = args[++i];
        break;
      case '--config':
      case '-c':
        options.sourceConfigPath = args[++i];
        break;
      case '--sources':
      case '-s':
        options.sourceIds = args[++i].split(',');
        break;
      case '--no-json':
        options.generateJSON = false;
        break;
      case '--no-markdown':
        options.generateMarkdown = false;
        break;
      case '--no-csv':
        options.generateCSV = false;
        break;
      case '--no-console':
        options.consoleOutput = false;
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
PREDATOR Analytics - Automated Test Runner

Usage: tsx runTests.ts [options]

Options:
  -e, --environment <env>    Test environment (QA, INTEGRATION, PRODUCTION) [default: QA]
  -i, --ipn <ipn>           Test IPN [default: 3111724753]
  -t, --timeout <ms>        Request timeout in milliseconds [default: 30000]
  -r, --retries <count>     Number of retries [default: 3]
  -o, --output <dir>        Output directory for reports [default: ./test-reports]
  -c, --config <path>       Path to source configuration file [default: ./server/config/sourceMatrix.yaml]
  -s, --sources <ids>       Comma-separated list of source IDs to test (tests all if not specified)
  --no-json                 Skip JSON report generation
  --no-markdown             Skip Markdown report generation
  --no-csv                  Skip CSV report generation
  --no-console              Skip console output
  -h, --help                Show this help message

Examples:
  # Run all tests in QA environment
  tsx runTests.ts

  # Run tests for specific sources
  tsx runTests.ts --sources UA-001,UA-002,INT-001

  # Run tests in production environment with custom timeout
  tsx runTests.ts --environment PRODUCTION --timeout 60000

  # Generate only JSON report
  tsx runTests.ts --no-markdown --no-csv
`);
}

async function main(): Promise<void> {
  console.log('Starting PREDATOR Analytics Automated Test Framework...\n');

  const options = parseOptions();

  // Create output directory if it doesn't exist
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  // Load source configurations
  console.log(`Loading source configurations from: ${options.sourceConfigPath}`);
  let sourceConfigs = await loadSourceConfigs(options.sourceConfigPath);

  // Filter sources if specific IDs are provided
  if (options.sourceIds && options.sourceIds.length > 0) {
    sourceConfigs = sourceConfigs.filter(config => 
      options.sourceIds!.includes(config.source_id)
    );
    console.log(`Testing ${sourceConfigs.length} specific sources: ${options.sourceIds.join(', ')}`);
  } else {
    console.log(`Testing all ${sourceConfigs.length} sources`);
  }

  // Initialize test orchestrator
  const orchestrator = new TestOrchestrator(options.testIPN);

  console.log(`\nTest Configuration:`);
  console.log(`  Environment: ${options.environment}`);
  console.log(`  Test IPN: ${options.testIPN}`);
  console.log(`  Timeout: ${options.timeoutMs}ms`);
  console.log(`  Retries: ${options.retryCount}`);
  console.log(`  Output Directory: ${options.outputDir}\n`);

  // Run tests
  console.log('Running tests...\n');
  const startTime = Date.now();
  
  const { sourceReports, summary } = await orchestrator.runTestsForAllSources(
    sourceConfigs,
    options.environment
  );
  
  const duration = Date.now() - startTime;
  console.log(`\nTests completed in ${(duration / 1000).toFixed(2)} seconds\n`);

  // Generate reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (options.generateJSON) {
    const jsonPath = path.join(options.outputDir, `test-report-${timestamp}.json`);
    ReportGenerator.generateJSONReport(sourceReports, summary, jsonPath);
    console.log(`JSON report generated: ${jsonPath}`);
  }

  if (options.generateMarkdown) {
    const mdPath = path.join(options.outputDir, `test-report-${timestamp}.md`);
    ReportGenerator.generateMarkdownReport(sourceReports, summary, mdPath);
    console.log(`Markdown report generated: ${mdPath}`);
  }

  if (options.generateCSV) {
    const csvPath = path.join(options.outputDir, `test-report-${timestamp}.csv`);
    ReportGenerator.generateCSVReport(sourceReports, csvPath);
    console.log(`CSV report generated: ${csvPath}`);
  }

  // Console output
  if (options.consoleOutput) {
    ReportGenerator.generateConsoleReport(sourceReports, summary);
  }

  // Exit with appropriate code
  const exitCode = summary.production_ready_overall ? 0 : 1;
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
