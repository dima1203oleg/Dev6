/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Report Generator for UI Integration Tests
 */

import { UIIntegrationTestReport } from './types';
import * as fs from 'fs';

export class UIReportGenerator {
  static generateJSONReport(
    report: UIIntegrationTestReport,
    outputPath: string
  ): void {
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  static generateMarkdownReport(
    report: UIIntegrationTestReport,
    outputPath: string
  ): void {
    let markdown = '# PREDATOR Analytics - UI Integration Test Report\n\n';
    markdown += `**Test IPN:** ${report.test_ipn}\n`;
    markdown += `**Generated:** ${report.timestamp.toISOString()}\n\n`;

    // Summary Section
    markdown += '## Executive Summary\n\n';
    markdown += '| Metric | Count |\n';
    markdown += '|--------|-------|\n';
    markdown += `| Total Scenarios | ${report.summary.total_scenarios} |\n`;
    markdown += `| Passed | ${report.summary.passed} |\n`;
    markdown += `| Failed | ${report.summary.failed} |\n`;
    markdown += `| Overall Passed | ${report.summary.overall_passed ? '✅' : '❌'} |\n\n`;

    if (report.critical_failures.length > 0) {
      markdown += '### Critical Failures\n\n';
      for (const failure of report.critical_failures) {
        markdown += `- ❌ ${failure}\n`;
      }
      markdown += '\n';
    }

    // Scenario Details
    markdown += '## Scenario Results\n\n';

    for (const scenario of report.scenarios) {
      markdown += `### ${scenario.scenario_name}\n\n`;
      markdown += `**Status:** ${scenario.passed ? '✅ PASS' : '❌ FAIL'}\n`;
      markdown += `**Duration:** ${scenario.duration_ms}ms\n\n`;

      markdown += '#### Validation Results\n\n';
      markdown += '| Validation | Status | Errors | Warnings |\n';
      markdown += '|------------|--------|--------|----------|\n';

      const validations = scenario.validation_results;
      markdown += `| IPN Acceptance | ${validations.ipn_acceptance.valid ? '✅' : '❌'} | ${validations.ipn_acceptance.errors.length} | ${validations.ipn_acceptance.warnings.length} |\n`;
      markdown += `| Source Routing | ${validations.source_routing.valid ? '✅' : '❌'} | ${validations.source_routing.errors.length} | ${validations.source_routing.warnings.length} |\n`;
      markdown += `| Raw Response Storage | ${validations.raw_response_storage.valid ? '✅' : '❌'} | ${validations.raw_response_storage.errors.length} | ${validations.raw_response_storage.warnings.length} |\n`;
      markdown += `| Field Verification | ${validations.field_verification.valid ? '✅' : '❌'} | ${validations.field_verification.errors.length} | ${validations.field_verification.warnings.length} |\n`;
      markdown += `| Provenance Display | ${validations.provenance_display.valid ? '✅' : '❌'} | ${validations.provenance_display.errors.length} | ${validations.provenance_display.warnings.length} |\n`;
      markdown += `| Conflict Visibility | ${validations.conflict_visibility.valid ? '✅' : '❌'} | ${validations.conflict_visibility.errors.length} | ${validations.conflict_visibility.warnings.length} |\n`;
      markdown += `| Absence Honesty | ${validations.absence_honesty.valid ? '✅' : '❌'} | ${validations.absence_honesty.errors.length} | ${validations.absence_honesty.warnings.length} |\n`;
      markdown += `| No Fabrication | ${validations.no_fabrication.valid ? '✅' : '❌'} | ${validations.no_fabrication.errors.length} | ${validations.no_fabrication.warnings.length} |\n`;
      markdown += `| Repeatability | ${validations.repeatability.valid ? '✅' : '❌'} | ${validations.repeatability.errors.length} | ${validations.repeatability.warnings.length} |\n\n`;

      // Detailed errors and warnings
      const allErrors = [
        ...validations.ipn_acceptance.errors,
        ...validations.source_routing.errors,
        ...validations.raw_response_storage.errors,
        ...validations.field_verification.errors,
        ...validations.provenance_display.errors,
        ...validations.conflict_visibility.errors,
        ...validations.absence_honesty.errors,
        ...validations.no_fabrication.errors,
        ...validations.repeatability.errors
      ];

      const allWarnings = [
        ...validations.ipn_acceptance.warnings,
        ...validations.source_routing.warnings,
        ...validations.raw_response_storage.warnings,
        ...validations.field_verification.warnings,
        ...validations.provenance_display.warnings,
        ...validations.conflict_visibility.warnings,
        ...validations.absence_honesty.warnings,
        ...validations.no_fabrication.warnings,
        ...validations.repeatability.warnings
      ];

      if (allErrors.length > 0) {
        markdown += '#### Errors\n\n';
        for (const error of allErrors) {
          markdown += `- ❌ ${error}\n`;
        }
        markdown += '\n';
      }

      if (allWarnings.length > 0) {
        markdown += '#### Warnings\n\n';
        for (const warning of allWarnings) {
          markdown += `- ⚠️ ${warning}\n`;
        }
        markdown += '\n';
      }

      if (scenario.notes.length > 0) {
        markdown += '#### Notes\n\n';
        for (const note of scenario.notes) {
          markdown += `- ${note}\n`;
        }
        markdown += '\n';
      }

      markdown += '---\n\n';
    }

    // Test Criteria
    markdown += '## Test Criteria\n\n';
    markdown += '### Success Criteria\n\n';
    markdown += '- Search executes stably\n';
    markdown += '- All found fields have provenance\n';
    markdown += '- All conflicts are visible\n';
    markdown += '- All absent data is honestly marked\n';
    markdown += '- No values are fabricated\n';
    markdown += '- Interface does not hide access restrictions\n';
    markdown += '- Repeat query gives reproducible results\n';
    markdown += '- UI does not claim truth where only partial confirmation exists\n\n';

    markdown += '### Failure Criteria\n\n';
    markdown += '- Field exists without source\n';
    markdown += '- Fabricated value exists\n';
    markdown += '- Undocumented fallback exists\n';
    markdown += '- Conflict exists but is not displayed\n';
    markdown += '- Stale data exists without label\n';
    markdown += '- Successful card without actual data\n';
    markdown += '- UI shows more than backend actually found\n\n';

    fs.writeFileSync(outputPath, markdown, 'utf-8');
  }

  static generateConsoleReport(report: UIIntegrationTestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('PREDATOR ANALYTICS - UI INTEGRATION TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Test IPN: ${report.test_ipn}`);
    console.log(`Generated: ${report.timestamp.toISOString()}\n`);

    console.log('EXECUTIVE SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Total Scenarios:      ${report.summary.total_scenarios}`);
    console.log(`Passed:               ${report.summary.passed}`);
    console.log(`Failed:               ${report.summary.failed}`);
    console.log(`Overall Passed:       ${report.summary.overall_passed ? '✅' : '❌'}\n`);

    if (report.critical_failures.length > 0) {
      console.log('CRITICAL FAILURES');
      console.log('-'.repeat(80));
      for (const failure of report.critical_failures) {
        console.log(`  ❌ ${failure}`);
      }
      console.log();
    }

    console.log('SCENARIO DETAILS');
    console.log('='.repeat(80));

    for (const scenario of report.scenarios) {
      console.log(`\n${scenario.scenario_name}`);
      console.log('-'.repeat(80));
      console.log(`Status:       ${scenario.passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Duration:     ${scenario.duration_ms}ms`);

      const validations = scenario.validation_results;
      const errorCount = Object.values(validations).reduce((sum, v) => sum + v.errors.length, 0);
      const warningCount = Object.values(validations).reduce((sum, v) => sum + v.warnings.length, 0);

      console.log(`Errors:       ${errorCount}`);
      console.log(`Warnings:     ${warningCount}`);

      if (scenario.notes.length > 0) {
        console.log('Notes:');
        for (const note of scenario.notes) {
          console.log(`  - ${note}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}
