// scripts/test_pipeline.ts
import { DiscoveryEngine } from '../core/discovery/DiscoveryEngine';
import { InvestigationOrchestrator } from '../core/orchestrator/InvestigationOrchestrator';
import { EvidenceEngine } from '../core/evidence/EvidenceEngine';
import { EntityResolutionEngine } from '../core/resolution/EntityResolutionEngine';
import { GraphEngine } from '../core/graph/GraphEngine';
import { RiskEngine } from '../core/analytics/RiskEngine';

async function runTest() {
  console.log("--- Starting Core Pipeline Functional Test ---");
  
  const evidenceEngine = new EvidenceEngine();
  const discoveryEngine = new DiscoveryEngine(evidenceEngine);
  const resolutionEngine = new EntityResolutionEngine();
  const graphEngine = new GraphEngine();
  const riskEngine = new RiskEngine();
  const orchestrator = new InvestigationOrchestrator(
    discoveryEngine, 
    resolutionEngine, 
    graphEngine, 
    riskEngine
  );
  
  const identifier = "12345678"; // Test EDRPOU
  
  console.log(`[TEST] Starting investigation for: ${identifier}`);
  
  try {
    const invId = await orchestrator.startInvestigation(identifier);
    console.log(`[TEST] Investigation ${invId} initiated successfully.`);
  } catch (error) {
    console.error(`[TEST] Pipeline failed:`, error);
  }
  
  console.log("--- Core Pipeline Functional Test Finished ---");
}

runTest();
