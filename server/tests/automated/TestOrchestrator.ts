/**
 * PREDATOR Analytics - Automated Test Framework
 * Main Test Orchestrator
 */

import { TEST001_RegistryDiscovery } from './tests/TEST001_RegistryDiscovery';
import { TEST002_Connectivity } from './tests/TEST002_Connectivity';
import { TEST003_Authentication } from './tests/TEST003_Authentication';
import { TEST004_QueryExecution } from './tests/TEST004_QueryExecution';
import { TEST005_RawResponse } from './tests/TEST005_RawResponse';
import { TEST006_SchemaValidation } from './tests/TEST006_SchemaValidation';
import { TEST007_ParserValidation } from './tests/TEST007_ParserValidation';
import { TEST008_DataIntegrity } from './tests/TEST008_DataIntegrity';
import { TEST009_Provenance } from './tests/TEST009_Provenance';
import { TEST010_Freshness } from './tests/TEST010_Freshness';
import { TEST011_EntityResolution } from './tests/TEST011_EntityResolution';
import { TEST012_CrossValidation } from './tests/TEST012_CrossValidation';
import { TEST013_NoHallucination } from './tests/TEST013_NoHallucination';
import { TEST014_Repeatability } from './tests/TEST014_Repeatability';
import { TEST015_Performance } from './tests/TEST015_Performance';
import { TEST016_FaultInjection } from './tests/TEST016_FaultInjection';
import { TEST017_Security } from './tests/TEST017_Security';
import { TEST018_ProductionDataIntegrity } from './tests/TEST018_ProductionDataIntegrity';

import { SourceConfig, TestContext, SourceTestReport, SummaryReport, FinalStatus } from './types';
import { BaseTest } from './BaseTest';

export class TestOrchestrator {
  private tests: BaseTest[];
  private testIPN: string;

  constructor(testIPN: string = '3111724753', skipTests?: string[]) {
    this.testIPN = testIPN;
    
    // Initialize all tests
    const allTests = [
      new TEST001_RegistryDiscovery(),
      new TEST002_Connectivity(),
      new TEST003_Authentication(),
      new TEST004_QueryExecution(),
      new TEST005_RawResponse(),
      new TEST006_SchemaValidation(),
      new TEST007_ParserValidation(),
      new TEST008_DataIntegrity(),
      new TEST009_Provenance(),
      new TEST010_Freshness(),
      new TEST011_EntityResolution(),
      new TEST012_CrossValidation(),
      new TEST013_NoHallucination(),
      new TEST014_Repeatability(),
      new TEST015_Performance(),
      new TEST016_FaultInjection(),
      new TEST017_Security(),
      new TEST018_ProductionDataIntegrity()
    ];

    // Filter out skipped tests
    if (skipTests && skipTests.length > 0) {
      this.tests = allTests.filter(test => !skipTests.includes((test as any).testId));
    } else {
      this.tests = allTests;
    }
  }

  async runTestsForSource(
    sourceConfig: SourceConfig,
    environment: 'QA' | 'INTEGRATION' | 'PRODUCTION' = 'QA',
    timeoutMs: number = 30000,
    retryCount: number = 3
  ): Promise<SourceTestReport> {
    const context: TestContext = {
      source_config: sourceConfig,
      test_ipn: this.testIPN,
      start_time: new Date(),
      timeout_ms: timeoutMs,
      retry_count: retryCount,
      environment
    };

    const testResults = [];
    const qaNotes: string[] = [];
    let httpCode = 0;
    let responseTimeMs = 0;
    let dataReturned = false;
    let provenanceComplete = false;
    let freshnessAcceptable = false;
    let conflictsDetected = 0;
    let confidenceScore = 0;

    // Run all tests
    for (const test of this.tests) {
      try {
        const result = await test.execute(context);
        testResults.push(result);

        // Extract key metrics from test results
        if (result.test_id === 'TEST-004') {
          httpCode = result.details['http_code'] || 0;
          responseTimeMs = result.details['execution_time_ms'] || 0;
          dataReturned = result.details['query_status'] === 'SUCCESS';
        }

        if (result.test_id === 'TEST-009') {
          provenanceComplete = result.details['provenance_complete'];
        }

        if (result.test_id === 'TEST-010') {
          freshnessAcceptable = result.details['freshness_acceptable'];
        }

        if (result.test_id === 'TEST-012') {
          conflictsDetected = result.details['conflicts_found'] || 0;
        }

        if (result.test_id === 'TEST-009') {
          confidenceScore = result.details['average_confidence'] || 0;
        }

        // Collect QA notes from warnings and errors
        if (result.warnings.length > 0) {
          qaNotes.push(`${result.test_id}: ${result.warnings.join('; ')}`);
        }

        if (result.errors.length > 0) {
          qaNotes.push(`${result.test_id}: ${result.errors.join('; ')}`);
        }

      } catch (error) {
        qaNotes.push(`${test.constructor.name}: Test execution failed - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Determine final status
    const finalStatus = this.determineFinalStatus(testResults, qaNotes);

    return {
      registry_id: sourceConfig.source_id,
      registry_name: sourceConfig.source_name,
      endpoint: sourceConfig.endpoint_or_resource,
      access_type: sourceConfig.access_level,
      query_status: this.getQueryStatus(testResults),
      http_code: httpCode,
      response_time_ms: responseTimeMs,
      data_returned: dataReturned,
      provenance_complete: provenanceComplete,
      freshness_acceptable: freshnessAcceptable,
      conflicts_detected: conflictsDetected,
      confidence_score: confidenceScore,
      final_status: finalStatus,
      qa_notes: qaNotes,
      test_results: testResults
    };
  }

  async runTestsForAllSources(
    sourceConfigs: SourceConfig[],
    environment: 'QA' | 'INTEGRATION' | 'PRODUCTION' = 'QA'
  ): Promise<{ sourceReports: SourceTestReport[]; summary: SummaryReport }> {
    const sourceReports: SourceTestReport[] = [];

    // Clear cross-validation data before running tests
    TEST012_CrossValidation.clearComparisonData();

    // Run tests for each source
    for (const sourceConfig of sourceConfigs) {
      console.log(`Testing source: ${sourceConfig.source_id} - ${sourceConfig.source_name}`);
      const report = await this.runTestsForSource(sourceConfig, environment);
      sourceReports.push(report);
    }

    // Generate summary report
    const summary = this.generateSummary(sourceReports);

    return { sourceReports, summary };
  }

  private determineFinalStatus(testResults: any[], _qaNotes: string[]): FinalStatus {
    const failedTests = testResults.filter(r => r.status === 'FAIL');
    const warningTests = testResults.filter(r => r.status === 'PASS_WITH_WARNINGS');
    const blockedTests = testResults.filter(r => r.status === 'BLOCKED');

    if (blockedTests.length > 0) {
      return 'BLOCKED';
    }

    if (failedTests.length > 0) {
      // Check if critical tests failed
      const criticalTestIds = ['TEST-001', 'TEST-002', 'TEST-003', 'TEST-004', 'TEST-013'];
      const criticalFailures = failedTests.filter(r => criticalTestIds.includes(r.test_id));
      
      if (criticalFailures.length > 0) {
        return 'FAIL';
      }
      
      return 'PARTIAL';
    }

    if (warningTests.length > 0) {
      return 'PASS_WITH_WARNINGS';
    }

    return 'PASS';
  }

  private getQueryStatus(testResults: any[]): any {
    const queryTest = testResults.find(r => r.test_id === 'TEST-004');
    return queryTest ? queryTest.status : 'NOT_APPLICABLE';
  }

  private generateSummary(sourceReports: SourceTestReport[]): SummaryReport {
    const summary: SummaryReport = {
      total_sources: sourceReports.length,
      passed: 0,
      passed_with_warnings: 0,
      partial: 0,
      failed: 0,
      blocked: 0,
      not_applicable: 0,
      needs_work: 0,
      using_fallback: 0,
      provenance_violations: 0,
      has_conflicts: 0,
      production_ready: 0,
      critical_sources_passed: true,
      hallucination_free: true,
      all_provenance_complete: true,
      conflicts_documented: true,
      results_reproducible: true,
      logging_complete: true,
      automated_tests_passed: true,
      production_ready_overall: false
    };

    for (const report of sourceReports) {
      switch (report.final_status) {
        case 'PASS':
          summary.passed++;
          summary.production_ready++;
          break;
        case 'PASS_WITH_WARNINGS':
          summary.passed_with_warnings++;
          summary.production_ready++;
          break;
        case 'PARTIAL':
          summary.partial++;
          summary.needs_work++;
          break;
        case 'FAIL':
          summary.failed++;
          summary.needs_work++;
          break;
        case 'BLOCKED':
          summary.blocked++;
          summary.needs_work++;
          break;
        case 'NOT_APPLICABLE':
          summary.not_applicable++;
          break;
      }

      if (!report.provenance_complete) {
        summary.provenance_violations++;
        summary.all_provenance_complete = false;
      }

      if (report.conflicts_detected > 0) {
        summary.has_conflicts++;
      }

      // Check for hallucination
      const hallucinationTest = report.test_results.find(r => r.test_id === 'TEST-013');
      if (hallucinationTest && hallucinationTest.status === 'FAIL') {
        summary.hallucination_free = false;
      }

      // Check for critical source failures
      if (report.final_status === 'FAIL' || report.final_status === 'BLOCKED') {
        summary.critical_sources_passed = false;
      }

      // Check automated tests
      const failedTests = report.test_results.filter(r => r.status === 'FAIL');
      if (failedTests.length > 0) {
        summary.automated_tests_passed = false;
      }
    }

    // Determine overall production readiness
    summary.production_ready_overall = 
      summary.critical_sources_passed &&
      summary.hallucination_free &&
      summary.all_provenance_complete &&
      summary.conflicts_documented &&
      summary.results_reproducible &&
      summary.logging_complete &&
      summary.automated_tests_passed &&
      summary.needs_work === 0;

    return summary;
  }
}
