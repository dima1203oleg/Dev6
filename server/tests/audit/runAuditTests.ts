/**
 * PREDATOR Analytics - End-to-End Data Flow Audit Runner
 * 
 * Головний скрипт для запуску всіх аудитів виправлення data flow
 */

import dotenv from 'dotenv';
import { dataFlowAuditor } from './DataFlowAudit';
import { entityCardBuilderAuditor } from './EntityCardBuilderAudit';
import { restAPIAuditor } from './RestAPIAudit';
import { frontendMappingAuditor } from './FrontendMappingAudit';
import { reactComponentsAuditor } from './ReactComponentsAudit';
import { placeholderRemovalAuditor } from './PlaceholderRemovalAudit';
import { automaticCoverageTest } from './AutomaticCoverageTest';
import { dataConsistencyValidator } from './DataConsistencyValidator';
import { ipnVerificationAuditor } from './IPNVerificationAudit';

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

interface AuditOptions {
  ipn: string;
  identifierType: 'ipn' | 'edrpou';
  outputDir: string;
  runAll: boolean;
  runDataFlow: boolean;
  runEntityCardBuilder: boolean;
  runRestAPI: boolean;
  runFrontendMapping: boolean;
  runReactComponents: boolean;
  runPlaceholderRemoval: boolean;
  runCoverageTest: boolean;
  runConsistency: boolean;
  runIPNVerification: boolean;
  generateMarkdown: boolean;
  consoleOutput: boolean;
}

function parseArguments(): AuditOptions {
  const args = process.argv.slice(2);
  const options: AuditOptions = {
    ipn: '3111724753',
    identifierType: 'ipn',
    outputDir: './audit-reports',
    runAll: true,
    runDataFlow: false,
    runEntityCardBuilder: false,
    runRestAPI: false,
    runFrontendMapping: false,
    runReactComponents: false,
    runPlaceholderRemoval: false,
    runCoverageTest: false,
    runConsistency: false,
    runIPNVerification: false,
    generateMarkdown: true,
    consoleOutput: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--ipn':
      case '-i':
        options.ipn = args[++i];
        break;
      case '--type':
      case '-t':
        options.identifierType = args[++i] as 'ipn' | 'edrpou';
        break;
      case '--output':
      case '-o':
        options.outputDir = args[++i];
        break;
      case '--all':
        options.runAll = true;
        break;
      case '--data-flow':
        options.runDataFlow = true;
        options.runAll = false;
        break;
      case '--entity-card':
        options.runEntityCardBuilder = true;
        options.runAll = false;
        break;
      case '--rest-api':
        options.runRestAPI = true;
        options.runAll = false;
        break;
      case '--frontend-mapping':
        options.runFrontendMapping = true;
        options.runAll = false;
        break;
      case '--react-components':
        options.runReactComponents = true;
        options.runAll = false;
        break;
      case '--placeholder':
        options.runPlaceholderRemoval = true;
        options.runAll = false;
        break;
      case '--coverage':
        options.runCoverageTest = true;
        options.runAll = false;
        break;
      case '--consistency':
        options.runConsistency = true;
        options.runAll = false;
        break;
      case '--ipn-verification':
        options.runIPNVerification = true;
        options.runAll = false;
        break;
      case '--no-markdown':
        options.generateMarkdown = false;
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
PREDATOR Analytics - End-to-End Data Flow Audit Runner

Usage: tsx runAuditTests.ts [options]

Options:
  -i, --ipn <code>              IPN or EDRPOU to audit [default: 3111724753]
  -t, --type <type>             Identifier type: ipn or edrpou [default: ipn]
  -o, --output <dir>            Output directory for reports [default: ./audit-reports]
  --all                         Run all audits (default)
  --data-flow                   Run only Data Flow Audit
  --entity-card                 Run only Entity Card Builder Audit
  --rest-api                    Run only REST API Audit
  --frontend-mapping            Run only Frontend Mapping Audit
  --react-components            Run only React Components Audit
  --placeholder                 Run only Placeholder Removal Audit
  --coverage                    Run only Automatic Coverage Test
  --consistency                 Run only Data Consistency Validator
  --ipn-verification            Run only IPN Verification (acceptance test)
  --no-markdown                 Skip Markdown report generation
  --no-console                  Skip console output
  -h, --help                    Show this help message

Examples:
  # Run all audits for IPN 3111724753
  tsx runAuditTests.ts

  # Run only IPN verification (acceptance test)
  tsx runAuditTests.ts --ipn-verification

  # Run specific audit
  tsx runAuditTests.ts --coverage

  # Run with custom IPN
  tsx runAuditTests.ts -i 1234567890
`);
}

async function main(): Promise<void> {
  console.log('Starting PREDATOR Analytics End-to-End Data Flow Audit...\n');

  const options = parseOptions();

  // Create output directory if it doesn't exist
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  console.log(`Audit Configuration:`);
  console.log(`  IPN: ${options.ipn}`);
  console.log(`  Type: ${options.identifierType}`);
  console.log(`  Output Directory: ${options.outputDir}`);
  console.log(`  Run All: ${options.runAll}\n`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let exitCode = 0;

  try {
    if (options.runAll || options.runIPNVerification) {
      console.log('Running IPN Verification (Acceptance Test)...\n');
      const verificationResult = await ipnVerificationAuditor.verifyIPN(options.ipn);
      
      if (options.generateMarkdown) {
        const mdPath = `${options.outputDir}/ipn-verification-${timestamp}.md`;
        const markdown = ipnVerificationAuditor.generateMarkdownReport(verificationResult);
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`IPN Verification report generated: ${mdPath}`);
      }

      if (options.consoleOutput) {
        console.log(ipnVerificationAuditor.generateMarkdownReport(verificationResult));
      }

      exitCode = verificationResult.overallStatus === 'PASS' ? 0 : 1;
    }

    if (options.runAll || options.runDataFlow) {
      console.log('Running Data Flow Audit...\n');
      const dataFlowResult = await dataFlowAuditor.auditFullPipeline(options.ipn, options.identifierType);
      
      if (options.generateMarkdown) {
        const mdPath = `${options.outputDir}/data-flow-audit-${timestamp}.md`;
        const markdown = dataFlowAuditor.generateMarkdownReport(dataFlowResult);
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`Data Flow Audit report generated: ${mdPath}`);
      }

      if (options.consoleOutput) {
        console.log(dataFlowAuditor.generateMarkdownReport(dataFlowResult));
      }
    }

    if (options.runAll || options.runEntityCardBuilder) {
      console.log('Running Entity Card Builder Audit...\n');
      const builderResult = await entityCardBuilderAuditor.auditEntityCardBuilder(options.ipn, options.identifierType);
      
      if (options.generateMarkdown) {
        const mdPath = `${options.outputDir}/entity-card-builder-audit-${timestamp}.md`;
        const markdown = entityCardBuilderAuditor.generateMarkdownReport(builderResult);
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`Entity Card Builder Audit report generated: ${mdPath}`);
      }

      if (options.consoleOutput) {
        console.log(entityCardBuilderAuditor.generateMarkdownReport(builderResult));
      }
    }

    if (options.runAll || options.runRestAPI) {
      console.log('Running REST API Audit...\n');
      const apiResult = await restAPIAuditor.auditRestAPI(options.ipn, options.identifierType);
      
      if (options.generateMarkdown) {
        const mdPath = `${options.outputDir}/rest-api-audit-${timestamp}.md`;
        const markdown = restAPIAuditor.generateMarkdownReport(apiResult);
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`REST API Audit report generated: ${mdPath}`);
      }

      if (options.consoleOutput) {
        console.log(restAPIAuditor.generateMarkdownReport(apiResult));
      }
    }

    if (options.runAll || options.runFrontendMapping) {
      console.log('Running Frontend Mapping Audit...\n');
      const mappingResult = await frontendMappingAuditor.auditFrontendMapping();
      
      if (options.generateMarkdown) {
        const mdPath = `${options.outputDir}/frontend-mapping-audit-${timestamp}.md`;
        const markdown = frontendMappingAuditor.generateMarkdownReport(mappingResult);
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`Frontend Mapping Audit report generated: ${mdPath}`);
      }

      if (options.consoleOutput) {
        console.log(frontendMappingAuditor.generateMarkdownReport(mappingResult));
      }
    }

    if (options.runAll || options.runReactComponents) {
      console.log('Running React Components Audit...\n');
      const componentsResult = await reactComponentsAuditor.auditReactComponents();
      
      if (options.generateMarkdown) {
        const mdPath = `${options.outputDir}/react-components-audit-${timestamp}.md`;
        const markdown = reactComponentsAuditor.generateMarkdownReport(componentsResult);
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`React Components Audit report generated: ${mdPath}`);
      }

      if (options.consoleOutput) {
        console.log(reactComponentsAuditor.generateMarkdownReport(componentsResult));
      }
    }

    if (options.runAll || options.runPlaceholderRemoval) {
      console.log('Running Placeholder Removal Audit...\n');
      const placeholderResult = await placeholderRemovalAuditor.auditPlaceholderLogic();
      
      if (options.generateMarkdown) {
        const mdPath = `${options.outputDir}/placeholder-removal-audit-${timestamp}.md`;
        const markdown = placeholderRemovalAuditor.generateMarkdownReport(placeholderResult);
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`Placeholder Removal Audit report generated: ${mdPath}`);
      }

      if (options.consoleOutput) {
        console.log(placeholderRemovalAuditor.generateMarkdownReport(placeholderResult));
      }
    }

    if (options.runAll || options.runCoverageTest) {
      console.log('Running Automatic Coverage Test...\n');
      const coverageResult = await automaticCoverageTest.runCoverageTest(options.ipn, options.identifierType);
      
      if (options.generateMarkdown) {
        const mdPath = `${options.outputDir}/coverage-test-${timestamp}.md`;
        const markdown = automaticCoverageTest.generateMarkdownReport(coverageResult);
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`Coverage Test report generated: ${mdPath}`);
      }

      if (options.consoleOutput) {
        console.log(automaticCoverageTest.generateMarkdownReport(coverageResult));
      }

      if (!options.runAll && !options.runIPNVerification) {
        exitCode = coverageResult.exitCode;
      }
    }

    if (options.runAll || options.runConsistency) {
      console.log('Running Data Consistency Validation...\n');
      const consistencyResult = await dataConsistencyValidator.validateConsistency(options.ipn, options.identifierType);
      
      if (options.generateMarkdown) {
        const mdPath = `${options.outputDir}/consistency-validation-${timestamp}.md`;
        const markdown = dataConsistencyValidator.generateMarkdownReport(consistencyResult);
        fs.writeFileSync(mdPath, markdown, 'utf-8');
        console.log(`Consistency Validation report generated: ${mdPath}`);
      }

      if (options.consoleOutput) {
        console.log(dataConsistencyValidator.generateMarkdownReport(consistencyResult));
      }

      if (!options.runAll && !options.runIPNVerification && consistencyResult.shouldBlockBuild) {
        exitCode = 1;
      }
    }

    console.log('\nAudit completed successfully');
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    exitCode = 1;
  }

  process.exit(exitCode);
}

function parseOptions(): AuditOptions {
  return parseArguments();
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
