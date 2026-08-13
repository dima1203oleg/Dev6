import { RnokppValidator } from '../../src/validation/RnokppValidator';
import { IdentifierUtils } from '../../src/utils/IdentifierUtils';
import { sourceDiscoveryService } from '../../services/SourceDiscoveryService';
import { FOPConnector } from '../../connectors/FOPConnector';
import { CourtConnector } from '../../connectors/CourtConnector';
import { SanctionsConnector } from '../../connectors/SanctionsConnector';
import { ProzorroConnector } from '../../connectors/ProzorroConnector';
import { HibpConnector } from '../../connectors/HibpConnector';
import { CrtshConnector } from '../../connectors/CrtshConnector';
import { CrossSourceComparer } from '../../src/engine/CrossSourceComparer';
import { ReportBuilder } from '../../utils/ReportBuilder';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest(rnokpp: string) {
  console.log(`Starting PREDATOR E2E Truth & Completeness Test for Identifier: [MASKED]`);

  // 1. Validation
  const validationResult = RnokppValidator.validate(rnokpp);
  if (!validationResult.isValid) {
    console.error(`Validation failed: ${validationResult.error}`);
    process.exit(1);
  }
  
  const normalizedId = IdentifierUtils.normalizeRnokpp(rnokpp);
  
  // 2. Discovery
  const allSources = sourceDiscoveryService.getAllSources();
  const relevantSources = sourceDiscoveryService.discoverSources(validationResult.type);
  
  console.log(`Found ${allSources.length} total sources, ${relevantSources.length} relevant for this identifier.`);

  // 3. Data Fetch
  const fopConnector = new FOPConnector();
  const courtConnector = new CourtConnector();
  const sanctionsConnector = new SanctionsConnector();
  const prozorroConnector = new ProzorroConnector();
  const hibpConnector = new HibpConnector();
  const crtshConnector = new CrtshConnector();
  
  const responses = [];
  const sourceDetails = [];

  for (const source of allSources) {
    let status = 'SKIPPED';
    let response;
    
    // Always test connectors if their id matches
    if (source.source_id === 'UA-001') {
      response = await fopConnector.fetch(normalizedId);
    } else if (source.source_id === 'UA-002') {
      response = await courtConnector.fetch(normalizedId);
    } else if (source.source_id === 'UA-003') {
      response = await sanctionsConnector.fetch(normalizedId);
    } else if (source.source_id === 'UA-004') {
      response = await prozorroConnector.fetch(normalizedId);
    } else if (source.source_id === 'INT-001') {
      // HIBP is usually email, but let's pass normalizedId (will probably be 404/not found for EDRPOU)
      response = await hibpConnector.fetch(normalizedId);
    } else if (source.source_id === 'INT-002') {
      // crt.sh expects a domain. We'll pass the ID which won't match much, but it proves the API works
      response = await crtshConnector.fetch(normalizedId);
    } else {
       status = 'UNAVAILABLE'; // mocked others for now
    }

    if (response) {
      responses.push(response);
      status = response.status === 'SUCCESS' ? 'MATCH' : 'FAILED';
      if (response.status === 'UNAVAILABLE') status = 'UNAVAILABLE';
    }
    
    sourceDetails.push({
      id: source.source_id,
      name: source.source_name,
      free: source.free,
      relevant: true,
      live: source.live_endpoint,
      status
    });
  }

  // 4. Verification & Resolution
  const comparer = new CrossSourceComparer();
  const comparisonResult = comparer.compare(responses);

  // 5. Reporting
  const matchedSources = sourceDetails.filter(s => s.status === 'MATCH').length;
  const unavailableSources = sourceDetails.filter(s => s.status === 'UNAVAILABLE').length;

  const metadata = {
    identifierType: validationResult.type,
    sourcesConfigured: allSources.length,
    sourcesEvaluated: allSources.length,
    relevant: relevantSources.length,
    queried: relevantSources.filter(s => s.source_id === 'UA-001').length,
    skipped: allSources.length - relevantSources.length,
    noMatch: sourceDetails.filter(s => s.status === 'NO_MATCH').length,
    matched: matchedSources,
    unavailable: unavailableSources,
    finalStatus: matchedSources > 0 && unavailableSources === 0 ? 'VERIFIED' : (matchedSources > 0 ? 'PARTIALLY VERIFIED' : 'FAILED'),
    sourceDetails
  };

  const results = {
    conflicts: comparisonResult.conflicting_fields.length,
    verifiedFacts: comparisonResult.matched_fields.length,
    derivedFacts: 0
  };

  const markdownReport = ReportBuilder.generateMarkdownReport(results, metadata);
  
  const artifactsDir = path.join(__dirname, '../../../../artifacts/e2e/raw');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  
  const reportPath = path.join(artifactsDir, `ControlReport_${Date.now()}.md`);
  fs.writeFileSync(reportPath, markdownReport);
  console.log(`\nTest complete. Report written to ${reportPath}`);
  console.log(`\n${markdownReport}`);
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: tsx ControlTestRunner.ts <RNOKPP>");
  process.exit(1);
}

runTest(arg).catch(console.error);
