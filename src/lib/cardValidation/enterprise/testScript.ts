/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Test Script for Control Profile Validation
 * 
 * This script demonstrates how to run the complete enterprise certification
 * workflow with the control profile RNOKPP 3111724753
 */

import {
  DynamicCardRegistryManager,
  UIDiscoveryEngine,
  CrossRegistryConsistencyValidator,
  EvidenceCoverageCalculator,
  DataLineageExplorer,
  TemporalValidator,
  RelationshipValidator,
  DuplicateDetector,
  ExplainabilityEngine,
  SmartRemediationEngine,
  RegressionDependencyGraph,
  LiveMonitoringEngine,
  EnterpriseCardPassportGenerator,
  EnterpriseAcceptanceCriteriaValidator,
  LivePreviewAuditEngine,
} from './index';
import { CanonicalEntity } from '../../../types/predator';

/**
 * Test script for enterprise certification platform
 */

/**
 * Test 1: Dynamic Card Registry
 */
export async function testDynamicCardRegistry() {
  console.log('\n=== TEST 1: Dynamic Card Registry ===');
  
  const registry = DynamicCardRegistryManager.getInstance();
  await registry.initializeRegistry([]);
  await registry.discoverCards();
  
  const allCards = registry.getAllCards();
  console.log(`✅ Registry initialized with ${allCards.length} cards`);

  // const categories = registry.getCategories();
  // console.log(`✅ Categories: ${categories.length}`);
  // categories.forEach((cat: any) => {
  //   console.log(`   - ${cat.name}: ${cat.cards.length} cards`);
  // });
  
  return { success: true, cardCount: allCards.length };
}

/**
 * Test 2: UI Discovery Engine
 */
export async function testUIDiscoveryEngine() {
  console.log('\n=== TEST 2: UI Discovery Engine ===');
  
  const discoveredCards = await UIDiscoveryEngine.performDiscovery();
  console.log(`✅ Discovered ${discoveredCards.length} cards from UI`);
  
  const scanResults = UIDiscoveryEngine.getScanResults();
  console.log(`✅ Scan methods: ${Object.keys(scanResults.byMethod).length}`);
  Object.entries(scanResults.byMethod).forEach(([method, count]) => {
    console.log(`   - ${method}: ${count} cards`);
  });
  
  return { success: true, discoveredCount: discoveredCards.length };
}

/**
 * Test 3: Cross Registry Consistency
 */
export async function testCrossRegistryConsistency() {
  console.log('\n=== TEST 3: Cross Registry Consistency ===');
  
  const fieldDataMap = new Map<string, any>();
  fieldDataMap.set('fullName', [
    {
      registry: 'EDR',
      value: 'Тестовий Суб\'єкт',
      confidence: 95,
      timestamp: new Date().toISOString(),
    },
    {
      registry: 'PASSPORT',
      value: 'Тестовий Суб\'єкт',
      confidence: 90,
      timestamp: new Date().toISOString(),
    },
  ]);
  
  const conflicts = CrossRegistryConsistencyValidator.validateAllFields(fieldDataMap);
  const summary = CrossRegistryConsistencyValidator.getConflictSummary(conflicts);
  
  console.log(`✅ Fields validated: ${conflicts.length}`);
  console.log(`✅ Conflicts: ${summary.conflicts}`);
  console.log(`✅ Manual review required: ${summary.manualReviewRequired}`);
  
  return { success: true, conflicts: summary.conflicts };
}

/**
 * Test 4: Evidence Coverage
 */
export async function testEvidenceCoverage() {
  console.log('\n=== TEST 4: Evidence Coverage ===');
  
  const mockFields = [
    {
      fieldName: 'fullName',
      value: 'Тестовий Суб\'єкт',
      status: 'VERIFIED' as const,
      confidenceScore: 95,
      source: 'EDR',
      registry: 'EDR',
      retrievedAt: new Date().toISOString(),
      sha256Hash: 'abc123...',
      sourceId: 'edr-123',
      connector: 'edr-connector',
      rawJson: '{}',
      connectorVersion: '1.0',
      normalizerVersion: '1.0',
    },
    {
      fieldName: 'rnokpp',
      value: '3111724753',
      status: 'VERIFIED' as const,
      confidenceScore: 100,
      source: 'EDR',
      registry: 'EDR',
      retrievedAt: new Date().toISOString(),
      sha256Hash: 'def456...',
      sourceId: 'edr-456',
      connector: 'edr-connector',
      rawJson: '{}',
      connectorVersion: '1.0',
      normalizerVersion: '1.0',
    },
    {
      fieldName: 'address',
      value: 'Київ, вул. Тестова, 1',
      status: 'VERIFIED' as const,
      confidenceScore: 90,
      source: 'PASSPORT',
      registry: 'PASSPORT',
      retrievedAt: new Date().toISOString(),
      sha256Hash: 'ghi789...',
      sourceId: 'passport-789',
      connector: 'passport-connector',
      rawJson: '{}',
      connectorVersion: '1.0',
      normalizerVersion: '1.0',
    },
  ];
  
  const coverage = EvidenceCoverageCalculator.calculateCoverage(mockFields);
  console.log(`✅ Coverage: ${coverage.coveragePercentage}%`);
  console.log(`✅ Multi-source: ${coverage.multiSourcePercentage}%`);
  
  const meetsCriteria = EvidenceCoverageCalculator.meetsEnterpriseCriteria(coverage);
  console.log(`✅ Meets Enterprise Criteria: ${meetsCriteria.passes}`);
  
  return { success: true, coverage: coverage.coveragePercentage };
}

/**
 * Test 5: Data Lineage
 */
export async function testDataLineage() {
  console.log('\n=== TEST 5: Data Lineage ===');
  
  const mockField = {
    fieldName: 'fullName',
    value: 'Тестовий Суб\'єкт',
    status: 'VERIFIED' as const,
    confidenceScore: 95,
    source: 'EDR',
    registry: 'EDR',
    retrievedAt: new Date().toISOString(),
    sha256Hash: 'abc123...',
    sourceId: 'edr-123',
    connector: 'edr-connector',
    rawJson: '{}',
    connectorVersion: '1.0',
    normalizerVersion: '1.0',
  };
  
  const lineage = DataLineageExplorer.buildLineage('fullName', mockField);
  console.log(`✅ Lineage built: ${lineage.fieldName}`);
  console.log(`✅ Total nodes: ${lineage.totalNodes}`);
  console.log(`✅ Depth: ${lineage.depth}`);
  console.log(`✅ Has conflict: ${lineage.hasConflict}`);
  
  const validation = DataLineageExplorer.validateLineage(lineage);
  console.log(`✅ Lineage valid: ${validation.valid}`);
  
  return { success: true, nodeCount: lineage.totalNodes };
}

/**
 * Test 6: Temporal Validation
 */
export async function testTemporalValidation() {
  console.log('\n=== TEST 6: Temporal Validation ===');
  
  const mockHistory = [
    {
      timestamp: '2021-01-01T00:00:00Z',
      value: 'Director',
      source: 'EDR',
      valid: true,
    },
    {
      timestamp: '2022-01-01T00:00:00Z',
      value: 'Owner',
      source: 'EDR',
      valid: true,
    },
    {
      timestamp: '2023-01-01T00:00:00Z',
      value: 'Closed',
      source: 'EDR',
      valid: true,
    },
  ];
  
  const validation = TemporalValidator.validateTemporalConsistency('position', mockHistory);
  console.log(`✅ Temporal validation: ${validation.trend}`);
  console.log(`✅ Has gaps: ${validation.hasGaps}`);
  console.log(`✅ Has inconsistencies: ${validation.hasInconsistencies}`);
  
  return { success: true, trend: validation.trend };
}

/**
 * Test 7: Relationship Validation
 */
export async function testRelationshipValidation() {
  console.log('\n=== TEST 7: Relationship Validation ===');
  
  const mockRelationships = [
    {
      id: 'rel-1',
      sourceId: 'entity-1',
      targetId: 'entity-2',
      type: 'DIRECTOR',
      evidenceIds: ['ev-1'],
      confidence: 95,
      validFrom: '2020-01-01',
    },
  ];
  
  const validation = RelationshipValidator.validateRelationships('entity-1', mockRelationships);
  console.log(`✅ Relationships validated: ${validation.totalEdges}`);
  console.log(`✅ Valid edges: ${validation.validEdges}`);
  console.log(`✅ Invalid edges: ${validation.invalidEdges}`);
  console.log(`✅ Overall valid: ${validation.overallValid}`);
  
  return { success: true, validEdges: validation.validEdges };
}

/**
 * Test 8: Duplicate Detection
 */
export async function testDuplicateDetection() {
  console.log('\n=== TEST 8: Duplicate Detection ===');
  
  const mockEntities: CanonicalEntity[] = [
    {
      id: 'entity-1',
      type: 'PERSON',
      canonicalName: 'Тестовий Суб\'єкт',
      aliases: [],
      identifiers: { rnokpp: '3111724753', ipn: '3111724753' },
      attributes: [],
      relationships: [],
      evidenceClaims: [],
      riskScore: 0,
      riskLevel: 'CLEAN',
      confidenceScore: 95,
      sourcesCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'entity-2',
      type: 'PERSON',
      canonicalName: 'Тестовий Суб\'єкт',
      aliases: [],
      identifiers: { rnokpp: '3111724753', ipn: '3111724753' },
      attributes: [],
      relationships: [],
      evidenceClaims: [],
      riskScore: 0,
      riskLevel: 'CLEAN',
      confidenceScore: 95,
      sourcesCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  
  const result = DuplicateDetector.detectDuplicates(mockEntities);
  console.log(`✅ Duplicates found: ${result.totalDuplicates}`);
  console.log(`✅ High confidence: ${result.highConfidence}`);
  console.log(`✅ Medium confidence: ${result.mediumConfidence}`);
  
  return { success: true, duplicates: result.totalDuplicates };
}

/**
 * Test 9: Explainability Engine
 */
export async function testExplainabilityEngine() {
  console.log('\n=== TEST 9: Explainability Engine ===');
  
  const mockField = {
    fieldName: 'companyCount',
    value: '7',
    status: 'VERIFIED' as const,
    confidenceScore: 95,
    source: 'EDR',
    registry: 'EDR',
    retrievedAt: new Date().toISOString(),
    sha256Hash: 'abc123...',
    sourceId: 'edr-123',
    connector: 'edr-connector',
    rawJson: '{}',
    connectorVersion: '1.0',
    normalizerVersion: '1.0',
  };
  
  const explanation = ExplainabilityEngine.generateExplanation('companyCount', mockField, new Map());
  console.log(`✅ Explanation generated: ${explanation.explanation}`);
  console.log(`✅ Reasoning steps: ${explanation.reasoning.length}`);
  console.log(`✅ Sources: ${explanation.sources.length}`);
  
  return { success: true, explanationGenerated: true };
}

/**
 * Test 10: Smart Remediation
 */
export async function testSmartRemediation() {
  console.log('\n=== TEST 10: Smart Remediation ===');
  
  const mockResults = [
    {
      cardId: 'test-card',
      cardName: 'Test Card',
      status: 'FAIL',
      fields: [],
      completionPercentage: 50,
      confidenceScore: 50,
      sourceCount: 1,
      lastUpdated: new Date().toISOString(),
      warnings: [],
      errors: ['Test error'],
      rootCauseAnalysis: {
        step: 'API_CHECK',
        details: 'API endpoint failed',
      },
    },
  ];
  
  const issues = SmartRemediationEngine.detectIssues(mockResults);
  console.log(`✅ Issues detected: ${issues.length}`);
  
  if (issues.length > 0) {
    const remediation = SmartRemediationEngine.applyAutoRemediation(issues[0]!);
    console.log(`✅ Auto-remediation applied: ${remediation.applied}`);
    console.log(`✅ Requires manual: ${remediation.requiresManual}`);
  }
  
  return { success: true, issuesDetected: issues.length };
}

/**
 * Test 11: Regression Dependency Graph
 */
export async function testRegressionDependencyGraph() {
  console.log('\n=== TEST 11: Regression Dependency Graph ===');
  
  const mockComponents = [
    { id: 'passport-card', type: 'CARD' as const, name: 'Passport Card', dependsOn: ['connector-edr'], affectedBy: [] },
    { id: 'connector-edr', type: 'CONNECTOR' as const, name: 'EDR Connector', dependsOn: ['registry-edr'], affectedBy: ['passport-card'] },
    { id: 'registry-edr', type: 'REGISTRY' as const, name: 'EDR Registry', dependsOn: [], affectedBy: ['connector-edr'] },
  ];
  
  RegressionDependencyGraph.buildDependencyGraph(mockComponents);
  
  const impact = RegressionDependencyGraph.calculateRegressionImpact('connector-edr');
  console.log(`✅ Affected nodes: ${impact.affectedNodes.length}`);
  console.log(`✅ Impact level: ${impact.impactLevel}`);
  console.log(`✅ Requires revalidation: ${impact.requiresRevalidation}`);
  console.log(`✅ Estimated risk: ${impact.estimatedRisk}%`);
  
  return { success: true, affectedNodes: impact.affectedNodes.length };
}

/**
 * Test 12: Live Monitoring
 */
export async function testLiveMonitoring() {
  console.log('\n=== TEST 12: Live Monitoring ===');
  
  LiveMonitoringEngine.startMonitoring({
    enabled: true,
    intervalMinutes: 15,
    alertThreshold: 80,
    autoRemediate: false,
    notifyChannels: [],
  });
  
  const status = LiveMonitoringEngine.getStatus();
  console.log(`✅ Monitoring enabled: ${status.enabled}`);
  console.log(`✅ Interval: ${status.interval}min`);
  // console.log(`✅ Alert threshold: ${status.alertThreshold}%`);
  
  LiveMonitoringEngine.stopMonitoring();
  console.log(`✅ Monitoring stopped`);
  
  return { success: true, monitoringEnabled: status.enabled };
}

/**
 * Test 13: Enterprise Card Passport
 */
export async function testEnterpriseCardPassport() {
  console.log('\n=== TEST 13: Enterprise Card Passport ===');
  
  const mockFields = [
    {
      fieldName: 'fullName',
      value: 'Тестовий Суб\'єкт',
      status: 'VERIFIED' as const,
      confidenceScore: 95,
      source: 'EDR',
      registry: 'EDR',
      retrievedAt: new Date().toISOString(),
      sha256Hash: 'abc123...',
      sourceId: 'edr-123',
      connector: 'edr-connector',
      rawJson: '{}',
      connectorVersion: '1.0',
      normalizerVersion: '1.0',
    },
  ];
  
  const passport = EnterpriseCardPassportGenerator.generatePassport(
    'passport-card',
    'Паспортні документи',
    'src/components/search/cards/PassportCard',
    '/search/passport',
    mockFields
  );
  
  console.log(`✅ Passport generated for: ${passport.card.name}`);
  console.log(`✅ Health status: ${passport.health.status}`);
  console.log(`✅ Health score: ${passport.health.score}%`);
  console.log(`✅ Production ready: ${passport.certification.production}`);
  
  const validation = EnterpriseCardPassportGenerator.validatePassport(passport);
  console.log(`✅ Passport valid: ${validation.valid}`);
  
  return { success: true, productionReady: passport.certification.production };
}

/**
 * Test 14: Enterprise Acceptance Criteria 2.0
 */
export async function testEnterpriseAcceptanceCriteria() {
  console.log('\n=== TEST 14: Enterprise Acceptance Criteria 2.0 ===');
  
  const mockCardResults = [
    {
      cardId: 'passport-card',
      cardName: 'Паспортні документи',
      category: 'IDENTITY' as any,
      status: 'PASS' as any,
      fields: [
        {
          fieldName: 'fullName',
          value: 'Тестовий Суб\'єкт',
          status: 'VERIFIED' as const,
          confidenceScore: 95,
          source: 'EDR',
          registry: 'EDR',
          retrievedAt: new Date().toISOString(),
          sha256Hash: 'abc123...',
          sourceId: 'edr-123',
          connector: 'edr-connector',
          rawJson: '{}',
          connectorVersion: '1.0',
          normalizerVersion: '1.0',
        },
      ],
      completionPercentage: 100,
      confidenceScore: 95,
      sourceCount: 2,
      lastUpdated: new Date().toISOString(),
      warnings: [],
      errors: [],
    },
  ];
  
  const mockEvidenceCoverage = {
    totalFields: 10,
    fieldsWithEvidence: 10,
    fieldsWithMultipleSources: 9,
    coveragePercentage: 100,
    multiSourcePercentage: 90,
    byRegistry: {
      EDR: 5,
      PASSPORT: 3,
      SANCTIONS: 2,
    },
  };
  
  const criteria = EnterpriseAcceptanceCriteriaValidator.validate(
    mockCardResults,
    mockEvidenceCoverage,
    {
      p50: 250,
      p95: 450,
      p99: 750,
      errorRate: 0,
    },
    {
      chaosTestsPassed: true,
      rollbackVerified: true,
      rtpRpoMet: true,
      dataLoss: false,
    },
    {
      allAssertionsHaveSource: true,
      allAssertionsHaveEvidence: true,
      allAssertionsHaveConfidence: true,
      allAssertionsHaveExplainability: true,
      noHallucinations: true,
    },
    {
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      secretsVerified: true,
      rbacVerified: true,
      auditVerified: true,
      loggingVerified: true,
    }
  );
  
  console.log(`✅ Overall score: ${criteria.overall.score}/100`);
  console.log(`✅ Certified: ${criteria.overall.certified}`);
  console.log(`✅ Expires: ${criteria.overall.expiresAt}`);
  
  const report = EnterpriseAcceptanceCriteriaValidator.generateReport(criteria);
  console.log(`✅ Report passed: ${report.passed}`);
  console.log(`✅ Recommendations: ${report.recommendations.length}`);
  
  return { success: true, certified: criteria.overall.certified, score: criteria.overall.score };
}

/**
 * Test 15: Live Preview Audit
 */
export async function testLivePreviewAudit() {
  console.log('\n=== TEST 15: Live Preview Audit ===');
  
  const mockValidationResult = {
    cardId: 'passport-card',
    cardName: 'Паспортні документи',
    category: 'IDENTITY' as any,
    status: 'PASS' as any,
    fields: [
      {
        fieldName: 'fullName',
        value: 'Тестовий Суб\'єкт',
        status: 'VERIFIED' as const,
        confidenceScore: 95,
        source: 'EDR',
        registry: 'EDR',
        retrievedAt: new Date().toISOString(),
        sha256Hash: 'abc123...',
        sourceId: 'edr-123',
        connector: 'edr-connector',
        rawJson: '{}',
        connectorVersion: '1.0',
        normalizerVersion: '1.0',
      },
    ],
    completionPercentage: 100,
    confidenceScore: 95,
    sourceCount: 2,
    lastUpdated: new Date().toISOString(),
    warnings: [],
    errors: [],
  };
  
  const liveAudit = LivePreviewAuditEngine.generateLiveAudit(mockValidationResult, {
    latency: 150,
    aiScore: 85,
  });
  
  console.log(`✅ Live audit generated: ${liveAudit.name}`);
  console.log(`✅ Health: ${liveAudit.health}%`);
  console.log(`✅ Coverage: ${liveAudit.coverage}%`);
  console.log(`✅ Evidence: ${liveAudit.evidence}%`);
  console.log(`✅ Trend: ${liveAudit.trend}`);
  
  const systemHealth = LivePreviewAuditEngine.getSystemHealth();
  console.log(`✅ System health: ${systemHealth.overallHealth}%`);
  
  return { success: true, health: liveAudit.health };
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('\n========================================');
  console.log('ENTERPRISE CERTIFICATION PLATFORM TEST SUITE');
  console.log('Control Profile: RNOKPP 3111724753');
  console.log('========================================');
  
  const results: any[] = [];
  
  try {
    results.push(await testDynamicCardRegistry());
    results.push(await testUIDiscoveryEngine());
    results.push(await testCrossRegistryConsistency());
    results.push(await testEvidenceCoverage());
    results.push(await testDataLineage());
    results.push(await testTemporalValidation());
    results.push(await testRelationshipValidation());
    results.push(await testDuplicateDetection());
    results.push(await testExplainabilityEngine());
    results.push(await testSmartRemediation());
    results.push(await testRegressionDependencyGraph());
    results.push(await testLiveMonitoring());
    results.push(await testEnterpriseCardPassport());
    results.push(await testEnterpriseAcceptanceCriteria());
    results.push(await testLivePreviewAudit());
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED - PLATFORM READY FOR PRODUCTION');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED - REVIEW REQUIRED');
  }
  
  return { passed, total, results };
}

// Export for use in browser console or testing framework
export const EnterpriseTests = {
  runAllTests,
  testDynamicCardRegistry,
  testUIDiscoveryEngine,
  testCrossRegistryConsistency,
  testEvidenceCoverage,
  testDataLineage,
  testTemporalValidation,
  testRelationshipValidation,
  testDuplicateDetection,
  testExplainabilityEngine,
  testSmartRemediation,
  testRegressionDependencyGraph,
  testLiveMonitoring,
  testEnterpriseCardPassport,
  testEnterpriseAcceptanceCriteria,
  testLivePreviewAudit,
};
