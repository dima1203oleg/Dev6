/**
 * PREDATOR Analytics - Automated Test Framework
 * Report Generator
 */

import { SourceTestReport, SummaryReport } from './types';
import * as fs from 'fs';

export class ReportGenerator {
  static generateJSONReport(
    sourceReports: SourceTestReport[],
    summary: SummaryReport,
    outputPath: string
  ): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      sources: sourceReports
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  static generateMarkdownReport(
    sourceReports: SourceTestReport[],
    summary: SummaryReport,
    outputPath: string
  ): void {
    let markdown = '# PREDATOR Analytics - Automated Test Report\n\n';
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;

    // Summary Section
    markdown += '## Executive Summary\n\n';
    markdown += '| Metric | Count |\n';
    markdown += '|--------|-------|\n';
    markdown += `| Total Sources | ${summary.total_sources} |\n`;
    markdown += `| Passed | ${summary.passed} |\n`;
    markdown += `| Passed with Warnings | ${summary.passed_with_warnings} |\n`;
    markdown += `| Partial | ${summary.partial} |\n`;
    markdown += `| Failed | ${summary.failed} |\n`;
    markdown += `| Blocked | ${summary.blocked} |\n`;
    markdown += `| Not Applicable | ${summary.not_applicable} |\n`;
    markdown += `| Needs Work | ${summary.needs_work} |\n`;
    markdown += `| Production Ready | ${summary.production_ready} |\n\n`;

    markdown += '### Production Readiness Criteria\n\n';
    markdown += `- **Critical Sources Passed:** ${summary.critical_sources_passed ? '✅' : '❌'}\n`;
    markdown += `- **Hallucination Free:** ${summary.hallucination_free ? '✅' : '❌'}\n`;
    markdown += `- **All Provenance Complete:** ${summary.all_provenance_complete ? '✅' : '❌'}\n`;
    markdown += `- **Conflicts Documented:** ${summary.conflicts_documented ? '✅' : '❌'}\n`;
    markdown += `- **Results Reproducible:** ${summary.results_reproducible ? '✅' : '❌'}\n`;
    markdown += `- **Logging Complete:** ${summary.logging_complete ? '✅' : '❌'}\n`;
    markdown += `- **Automated Tests Passed:** ${summary.automated_tests_passed ? '✅' : '❌'}\n\n`;

    markdown += `### Overall Production Ready: ${summary.production_ready_overall ? '✅ YES' : '❌ NO'}\n\n`;

    // Source Details
    markdown += '## Source Test Results\n\n';

    for (const report of sourceReports) {
      markdown += `### ${report.registry_id} - ${report.registry_name}\n\n`;
      markdown += `**Endpoint:** ${report.endpoint}\n`;
      markdown += `**Access Type:** ${report.access_type}\n`;
      markdown += `**Final Status:** ${this.formatStatus(report.final_status)}\n\n`;

      markdown += '| Metric | Value |\n';
      markdown += '|--------|-------|\n';
      markdown += `| HTTP Code | ${report.http_code} |\n`;
      markdown += `| Response Time | ${report.response_time_ms}ms |\n`;
      markdown += `| Data Returned | ${report.data_returned ? '✅' : '❌'} |\n`;
      markdown += `| Provenance Complete | ${report.provenance_complete ? '✅' : '❌'} |\n`;
      markdown += `| Freshness Acceptable | ${report.freshness_acceptable ? '✅' : '❌'} |\n`;
      markdown += `| Conflicts Detected | ${report.conflicts_detected} |\n`;
      markdown += `| Confidence Score | ${(report.confidence_score * 100).toFixed(1)}% |\n\n`;

      // Test Results Summary
      markdown += '#### Test Results\n\n';
      markdown += '| Test ID | Test Name | Status | Duration (ms) |\n';
      markdown += '|---------|-----------|--------|-------------|\n';

      for (const testResult of report.test_results) {
        markdown += `| ${testResult.test_id} | ${testResult.test_name} | ${this.formatStatus(testResult.status)} | ${testResult.duration_ms} |\n`;
      }

      markdown += '\n';

      // QA Notes
      if (report.qa_notes.length > 0) {
        markdown += '#### QA Notes\n\n';
        for (const note of report.qa_notes) {
          markdown += `- ${note}\n`;
        }
        markdown += '\n';
      }

      markdown += '---\n\n';
    }

    // Appendix
    markdown += '## Appendix\n\n';
    markdown += '### Test Descriptions\n\n';
    markdown += '| Test ID | Test Name | Description |\n';
    markdown += '|---------|-----------|-------------|\n';
    markdown += '| TEST-001 | Registry Discovery | Validates source configuration and metadata |\n';
    markdown += '| TEST-002 | Connectivity | Checks DNS, HTTPS, TLS, HTTP status, timeout |\n';
    markdown += '| TEST-003 | Authentication | Validates API keys, OAuth, JWT, mTLS |\n';
    markdown += '| TEST-004 | Query Execution | Executes test query and measures performance |\n';
    markdown += '| TEST-005 | Raw Response | Captures and validates raw response data |\n';
    markdown += '| TEST-006 | Schema Validation | Validates response against expected schema |\n';
    markdown += '| TEST-007 | Parser Validation | Validates data parsing and type handling |\n';
    markdown += '| TEST-008 | Data Integrity | Checks for data corruption and encoding issues |\n';
    markdown += '| TEST-009 | Provenance | Validates provenance metadata for all fields |\n';
    markdown += '| TEST-010 | Freshness | Validates data age and cache status |\n';
    markdown += '| TEST-011 | Entity Resolution | Checks for duplicates and entity relationships |\n';
    markdown += '| TEST-012 | Cross Validation | Compares results across sources |\n';
    markdown += '| TEST-013 | No Hallucination | Ensures no fabricated or unconfirmed values |\n';
    markdown += '| TEST-014 | Repeatability | Validates result reproducibility |\n';
    markdown += '| TEST-015 | Performance | Measures latency, throughput, resource usage |\n';
    markdown += '| TEST-016 | Fault Injection | Tests system resilience to failures |\n';
    markdown += '| TEST-017 | Security | Tests for common security vulnerabilities |\n\n';

    fs.writeFileSync(outputPath, markdown, 'utf-8');
  }

  static generateCSVReport(
    sourceReports: SourceTestReport[],
    outputPath: string
  ): void {
    const headers = [
      'Registry ID',
      'Registry Name',
      'Endpoint',
      'Access Type',
      'Final Status',
      'HTTP Code',
      'Response Time (ms)',
      'Data Returned',
      'Provenance Complete',
      'Freshness Acceptable',
      'Conflicts Detected',
      'Confidence Score',
      'QA Notes'
    ];

    let csv = headers.join(',') + '\n';

    for (const report of sourceReports) {
      const row = [
        report.registry_id,
        `"${report.registry_name}"`,
        `"${report.endpoint}"`,
        report.access_type,
        report.final_status,
        report.http_code,
        report.response_time_ms,
        report.data_returned ? 'Yes' : 'No',
        report.provenance_complete ? 'Yes' : 'No',
        report.freshness_acceptable ? 'Yes' : 'No',
        report.conflicts_detected,
        report.confidence_score.toFixed(2),
        `"${report.qa_notes.join('; ')}"`
      ];
      csv += row.join(',') + '\n';
    }

    fs.writeFileSync(outputPath, csv, 'utf-8');
  }

  private static formatStatus(status: string): string {
    const statusEmojis: Record<string, string> = {
      'PASS': '✅ PASS',
      'PASS_WITH_WARNINGS': '⚠️ PASS_WITH_WARNINGS',
      'PARTIAL': '🔶 PARTIAL',
      'FAIL': '❌ FAIL',
      'BLOCKED': '🚫 BLOCKED',
      'NOT_APPLICABLE': '⏭️ NOT_APPLICABLE'
    };
    return statusEmojis[status] || status;
  }

  static generateConsoleReport(
    sourceReports: SourceTestReport[],
    summary: SummaryReport
  ): void {
    console.log('\n' + '='.repeat(80));
    console.log('PREDATOR ANALYTICS - AUTOMATED TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Generated: ${new Date().toISOString()}\n`);

    console.log('EXECUTIVE SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Total Sources:      ${summary.total_sources}`);
    console.log(`Passed:             ${summary.passed}`);
    console.log(`Passed with Warnings: ${summary.passed_with_warnings}`);
    console.log(`Partial:            ${summary.partial}`);
    console.log(`Failed:             ${summary.failed}`);
    console.log(`Blocked:            ${summary.blocked}`);
    console.log(`Not Applicable:     ${summary.not_applicable}`);
    console.log(`Needs Work:         ${summary.needs_work}`);
    console.log(`Production Ready:   ${summary.production_ready}\n`);

    console.log('PRODUCTION READINESS CRITERIA');
    console.log('-'.repeat(80));
    console.log(`Critical Sources Passed:   ${summary.critical_sources_passed ? '✅' : '❌'}`);
    console.log(`Hallucination Free:        ${summary.hallucination_free ? '✅' : '❌'}`);
    console.log(`All Provenance Complete:   ${summary.all_provenance_complete ? '✅' : '❌'}`);
    console.log(`Conflicts Documented:      ${summary.conflicts_documented ? '✅' : '❌'}`);
    console.log(`Results Reproducible:      ${summary.results_reproducible ? '✅' : '❌'}`);
    console.log(`Logging Complete:          ${summary.logging_complete ? '✅' : '❌'}`);
    console.log(`Automated Tests Passed:    ${summary.automated_tests_passed ? '✅' : '❌'}`);
    console.log(`\nOverall Production Ready: ${summary.production_ready_overall ? '✅ YES' : '❌ NO'}`);

    console.log('\n' + '='.repeat(80));
    console.log('SOURCE DETAILS');
    console.log('='.repeat(80));

    for (const report of sourceReports) {
      console.log(`\n${report.registry_id} - ${report.registry_name}`);
      console.log('-'.repeat(80));
      console.log(`Status:       ${this.formatStatus(report.final_status)}`);
      console.log(`Endpoint:     ${report.endpoint}`);
      console.log(`HTTP Code:    ${report.http_code}`);
      console.log(`Response:     ${report.response_time_ms}ms`);
      console.log(`Data:         ${report.data_returned ? '✅' : '❌'}`);
      console.log(`Provenance:   ${report.provenance_complete ? '✅' : '❌'}`);
      console.log(`Freshness:    ${report.freshness_acceptable ? '✅' : '❌'}`);
      console.log(`Conflicts:    ${report.conflicts_detected}`);
      console.log(`Confidence:   ${(report.confidence_score * 100).toFixed(1)}%`);

      if (report.qa_notes.length > 0) {
        console.log('QA Notes:');
        for (const note of report.qa_notes) {
          console.log(`  - ${note}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}
