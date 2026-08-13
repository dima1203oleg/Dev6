/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Main UI Test Runner
 */

import dotenv from 'dotenv';
import { UIIntegrationTestOrchestrator } from './UIIntegrationTestOrchestrator';
import { UIReportGenerator } from './UIReportGenerator';

// Load environment variables
dotenv.config();

interface RunnerOptions {
  testIPN: string;
  baseURL: string;
  outputDir: string;
  generateJSON: boolean;
  generateMarkdown: boolean;
  consoleOutput: boolean;
  runScenarios: boolean;
}

function parseArguments(): RunnerOptions {
  const args = process.argv.slice(2);
  const options: RunnerOptions = {
    testIPN: '3111724753',
    baseURL: 'http://localhost:3000',
    outputDir: './ui-test-reports',
    generateJSON: true,
    generateMarkdown: true,
    consoleOutput: true,
    runScenarios: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--ipn':
      case '-i':
        options.testIPN = args[++i] || '';
        break;
      case '--url':
      case '-u':
        options.baseURL = args[++i] || '';
        break;
      case '--output':
      case '-o':
        options.outputDir = args[++i] || '';
        break;
      case '--no-json':
        options.generateJSON = false;
        break;
      case '--no-markdown':
        options.generateMarkdown = false;
        break;
      case '--no-console':
        options.consoleOutput = false;
        break;
      case '--no-scenarios':
        options.runScenarios = false;
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
PREDATOR Analytics - UI Integration Test Runner

Usage: tsx runUITests.ts [options]

Options:
  -i, --ipn <ipn>           Test IPN [default: 3111724753]
  -u, --url <url>           Base URL of the application [default: http://localhost:3000]
  -o, --output <dir>        Output directory for reports [default: ./ui-test-reports]
  --no-json                 Skip JSON report generation
  --no-markdown             Skip Markdown report generation
  --no-console              Skip console output
  --no-scenarios            Skip scenario tests (only run validators)
  -h, --help                Show this help message

Examples:
  # Run all UI integration tests
  tsx runUITests.ts

  # Run with custom IPN and URL
  tsx runUITests.ts --ipn 1234567890 --url http://localhost:8080

  # Generate only JSON report
  tsx runUITests.ts --no-markdown
`);
}

async function main(): Promise<void> {
  console.log('Starting PREDATOR Analytics UI Integration Test Framework...\n');

  const options = parseOptions();

  // Create output directory if it doesn't exist
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  console.log(`Test Configuration:`);
  console.log(`  Test IPN: ${options.testIPN}`);
  console.log(`  Base URL: ${options.baseURL}`);
  console.log(`  Output Directory: ${options.outputDir}`);
  console.log(`  Run Scenarios: ${options.runScenarios}\n`);

  // Initialize orchestrator
  const orchestrator = new UIIntegrationTestOrchestrator(options.testIPN, options.baseURL);

  const startTime = Date.now();
  let report;

  if (options.runScenarios) {
    console.log('Running scenario tests...\n');
    report = await orchestrator.runAllScenarios();
  } else {
    console.log('Scenarios skipped. Run with --scenarios to enable.\n');
    console.log('Note: Scenario tests require actual UI interaction.');
    console.log('Use this mode with a provided UI card structure for validation only.\n');
    process.exit(0);
  }

  const duration = Date.now() - startTime;
  console.log(`\nTests completed in ${(duration / 1000).toFixed(2)} seconds\n`);

  // Generate reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (options.generateJSON) {
    const jsonPath = path.join(options.outputDir, `ui-test-report-${timestamp}.json`);
    UIReportGenerator.generateJSONReport(report, jsonPath);
    console.log(`JSON report generated: ${jsonPath}`);
  }

  if (options.generateMarkdown) {
    const mdPath = path.join(options.outputDir, `ui-test-report-${timestamp}.md`);
    UIReportGenerator.generateMarkdownReport(report, mdPath);
    console.log(`Markdown report generated: ${mdPath}`);
  }

  // Console output
  if (options.consoleOutput) {
    UIReportGenerator.generateConsoleReport(report);
  }

  // Exit with appropriate code
  const exitCode = report.summary.overall_passed ? 0 : 1;
  process.exit(exitCode);
}

function parseOptions(): RunnerOptions {
  return parseArguments();
}

// Import fs and path for main function
import * as fs from 'fs';
import * as path from 'path';

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
