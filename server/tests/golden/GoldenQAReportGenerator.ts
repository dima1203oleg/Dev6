/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Golden QA Report Generator
 */

import { GoldenValidationReport } from './types';
import * as fs from 'fs';

export class GoldenQAReportGenerator {
  static generateJSONReport(
    report: GoldenValidationReport,
    outputPath: string
  ): void {
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  static generateMarkdownReport(
    report: GoldenValidationReport,
    outputPath: string
  ): void {
    let markdown = '# PREDATOR Analytics - Golden QA Validation Report\n\n';
    markdown += `**Test IPN:** ${report.test_ipn}\n`;
    markdown += `**Test Timestamp:** ${report.test_timestamp.toISOString()}\n`;
    markdown += `**Golden Dataset Version:** ${report.golden_dataset_version}\n`;
    markdown += `**Overall Status:** ${this.getStatusEmoji(report.overall_status)} ${report.overall_status}\n\n`;

    // Executive Summary
    markdown += '## Executive Summary\n\n';
    markdown += '| Metric | Count |\n';
    markdown += '|--------|-------|\n';
    markdown += `| Total Fields Checked | ${report.summary.total_fields_checked} |\n`;
    markdown += `| Fields Matched | ${report.summary.fields_matched} |\n`;
    markdown += `| Fields Mismatched | ${report.summary.fields_mismatched} |\n`;
    markdown += `| Fields Missing | ${report.summary.fields_missing} |\n`;
    markdown += `| Fields Extra | ${report.summary.fields_extra} |\n`;
    markdown += `| Technical Errors | ${report.summary.technical_errors} |\n`;
    markdown += `| Registry Changes | ${report.summary.registry_changes} |\n\n`;

    // Category Results
    markdown += '## Category Results\n\n';

    const categories = [
      { name: 'Identification', key: 'identification' },
      { name: 'Addresses', key: 'addresses' },
      { name: 'Contacts', key: 'contacts' },
      { name: 'Business Relationships', key: 'business_relationships' },
      { name: 'Court Cases', key: 'court_cases' },
      { name: 'Enforcement Proceedings', key: 'enforcement_proceedings' },
      { name: 'Sanctions', key: 'sanctions' },
      { name: 'PEP Records', key: 'pep_records' },
      { name: 'Property', key: 'property' }
    ];

    for (const category of categories) {
      const result = report.category_results[category.key as keyof typeof report.category_results];
      markdown += `### ${category.name}\n\n`;
      markdown += `**Status:** ${this.getStatusEmoji(result.status)} ${result.status}\n`;
      markdown += `**Total:** ${result.total} | **Matched:** ${result.matched} | **Mismatched:** ${result.mismatched} | **Missing:** ${result.missing} | **Extra:** ${result.extra}\n\n`;
    }

    // UI Validation
    markdown += '## UI Web Interface Validation\n\n';
    const uiResult = report.ui_validation;
    markdown += `**Status:** ${this.getStatusEmoji(uiResult.status)} ${uiResult.status}\n`;
    markdown += `**Total:** ${uiResult.total} | **Matched:** ${uiResult.matched} | **Mismatched:** ${uiResult.mismatched} | **Missing:** ${uiResult.missing} | **Extra:** ${uiResult.extra}\n\n`;

    // Diagnostics
    if (report.diagnostics.length > 0) {
      markdown += '## Diagnostics\n\n';
      for (const diag of report.diagnostics) {
        markdown += `### ${diag.category} - ${diag.issue_type}\n\n`;
        markdown += `**Severity:** ${diag.severity}\n`;
        markdown += `**Description:** ${diag.description}\n`;
        markdown += `**Affected Fields:** ${diag.affected_fields.join(', ')}\n`;
        markdown += `**Self-Healable:** ${diag.self_healable ? 'Yes' : 'No'}\n`;
        markdown += `**Suggested Actions:**\n`;
        for (const action of diag.suggested_actions) {
          markdown += `- ${action}\n`;
        }
        markdown += '\n';
      }
    }

    // Self-Healing Actions
    if (report.self_healing_actions.length > 0) {
      markdown += '## Self-Healing Actions\n\n';
      for (const action of report.self_healing_actions) {
        markdown += `### ${action.action_type}\n\n`;
        markdown += `**Executed:** ${action.executed ? 'Yes' : 'No'}\n`;
        markdown += `**Success:** ${action.success ? 'Yes' : 'No'}\n`;
        markdown += `**Timestamp:** ${action.timestamp.toISOString()}\n`;
        if (action.result) {
          markdown += `**Result:** ${action.result}\n`;
        }
        markdown += '\n';
      }
    }

    // Registry Changes
    if (report.registry_changes_detected.length > 0) {
      markdown += '## Registry Changes Detected\n\n';
      for (const change of report.registry_changes_detected) {
        markdown += `### ${change.registry}\n\n`;
        markdown += `**Field:** ${change.field}\n`;
        markdown += `**Previous Value:** ${JSON.stringify(change.previous_value)}\n`;
        markdown += `**New Value:** ${JSON.stringify(change.new_value)}\n`;
        markdown += `**Change Date:** ${change.change_date.toISOString()}\n`;
        markdown += `**Verified:** ${change.verified ? 'Yes' : 'No'}\n\n`;
      }
    }

    // Success Criteria
    markdown += '## Success Criteria\n\n';
    markdown += 'The test is considered successful only if:\n\n';
    markdown += '- ✅ All available registries are queried\n';
    markdown += '- ✅ All found data matches actual registry responses\n';
    markdown += '- ✅ Backend and web interface display identical information\n';
    markdown += '- ✅ Each field has a source and Provenance\n';
    markdown += '- ✅ All conflicts are displayed\n';
    markdown += '- ✅ No field is formed by assumption\n';
    markdown += '- ✅ User Provided is not elevated to Verified without independent confirmation\n';
    markdown += '- ✅ Report clearly shows which fields are confirmed, conflicting, unavailable, or missing\n\n';

    // Failure Criteria
    markdown += '## Failure Criteria\n\n';
    markdown += 'The test fails if:\n\n';
    markdown += '- ❌ Field exists without source\n';
    markdown += '- ❌ Fabricated value exists\n';
    markdown += '- ❌ Undocumented fallback exists\n';
    markdown += '- ❌ Conflict exists but is not displayed\n';
    markdown += '- ❌ Stale data exists without label\n';
    markdown += '- ❌ Successful card without actual data\n';
    markdown += '- ❌ UI shows more than backend actually found\n\n';

    fs.writeFileSync(outputPath, markdown, 'utf-8');
  }

  static generateConsoleReport(report: GoldenValidationReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('PREDATOR ANALYTICS - GOLDEN QA VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Test IPN: ${report.test_ipn}`);
    console.log(`Test Timestamp: ${report.test_timestamp.toISOString()}`);
    console.log(`Golden Dataset Version: ${report.golden_dataset_version}`);
    console.log(`Overall Status: ${this.getStatusEmoji(report.overall_status)} ${report.overall_status}\n`);

    console.log('EXECUTIVE SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Total Fields Checked:      ${report.summary.total_fields_checked}`);
    console.log(`Fields Matched:             ${report.summary.fields_matched}`);
    console.log(`Fields Mismatched:          ${report.summary.fields_mismatched}`);
    console.log(`Fields Missing:             ${report.summary.fields_missing}`);
    console.log(`Fields Extra:               ${report.summary.fields_extra}`);
    console.log(`Technical Errors:           ${report.summary.technical_errors}`);
    console.log(`Registry Changes:           ${report.summary.registry_changes}\n`);

    console.log('CATEGORY RESULTS');
    console.log('='.repeat(80));

    const categories = [
      { name: 'Identification', key: 'identification' },
      { name: 'Addresses', key: 'addresses' },
      { name: 'Contacts', key: 'contacts' },
      { name: 'Business Relationships', key: 'business_relationships' },
      { name: 'Court Cases', key: 'court_cases' },
      { name: 'Enforcement Proceedings', key: 'enforcement_proceedings' },
      { name: 'Sanctions', key: 'sanctions' },
      { name: 'PEP Records', key: 'pep_records' },
      { name: 'Property', key: 'property' }
    ];

    for (const category of categories) {
      const result = report.category_results[category.key as keyof typeof report.category_results];
      console.log(`\n${category.name}`);
      console.log('-'.repeat(40));
      console.log(`Status:       ${this.getStatusEmoji(result.status)} ${result.status}`);
      console.log(`Total:        ${result.total}`);
      console.log(`Matched:      ${result.matched}`);
      console.log(`Mismatched:   ${result.mismatched}`);
      console.log(`Missing:      ${result.missing}`);
      console.log(`Extra:        ${result.extra}`);
    }

    console.log(`\nUI Web Interface`);
    console.log('-'.repeat(40));
    console.log(`Status:       ${this.getStatusEmoji(report.ui_validation.status)} ${report.ui_validation.status}`);
    console.log(`Total:        ${report.ui_validation.total}`);
    console.log(`Matched:      ${report.ui_validation.matched}`);
    console.log(`Mismatched:   ${report.ui_validation.mismatched}`);
    console.log(`Missing:      ${report.ui_validation.missing}`);
    console.log(`Extra:        ${report.ui_validation.extra}`);

    if (report.diagnostics.length > 0) {
      console.log('\nDIAGNOSTICS');
      console.log('='.repeat(80));
      for (const diag of report.diagnostics) {
        console.log(`\n${diag.category} - ${diag.issue_type}`);
        console.log(`Severity: ${diag.severity}`);
        console.log(`Description: ${diag.description}`);
        console.log(`Affected Fields: ${diag.affected_fields.join(', ')}`);
        console.log(`Self-Healable: ${diag.self_healable ? 'Yes' : 'No'}`);
      }
    }

    if (report.registry_changes_detected.length > 0) {
      console.log('\nREGISTRY CHANGES DETECTED');
      console.log('='.repeat(80));
      for (const change of report.registry_changes_detected) {
        console.log(`\nRegistry: ${change.registry}`);
        console.log(`Field: ${change.field}`);
        console.log(`Previous: ${JSON.stringify(change.previous_value)}`);
        console.log(`New: ${JSON.stringify(change.new_value)}`);
        console.log(`Verified: ${change.verified ? 'Yes' : 'No'}`);
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  private static getStatusEmoji(status: string): string {
    switch (status) {
      case 'PASS':
        return '✅';
      case 'FAIL':
        return '❌';
      case 'PARTIAL':
        return '⚠️';
      case 'REGISTRY_CHANGE_DETECTED':
        return '🔄';
      default:
        return '❓';
    }
  }

  static generateCSVReport(
    report: GoldenValidationReport,
    outputPath: string
  ): void {
    let csv = 'Category,Field,Expected,Actual,Match,DiscrepancyType,DiscrepancyReason,Source,Timestamp\n';

    // This would need actual validation results to be passed in
    // For now, we'll create a summary CSV
    csv += 'Summary,Total Fields,' + report.summary.total_fields_checked + ',,TRUE,NONE,,,\n';
    csv += 'Summary,Fields Matched,' + report.summary.fields_matched + ',,TRUE,NONE,,,\n';
    csv += 'Summary,Fields Mismatched,' + report.summary.fields_mismatched + ',,FALSE,DATA_MISMATCH,,,\n';
    csv += 'Summary,Fields Missing,' + report.summary.fields_missing + ',,FALSE,MISSING_DATA,,,\n';
    csv += 'Summary,Fields Extra,' + report.summary.fields_extra + ',,FALSE,EXTRA_DATA,,,\n';
    csv += 'Summary,Technical Errors,' + report.summary.technical_errors + ',,FALSE,TECHNICAL_ERROR,,,\n';
    csv += 'Summary,Registry Changes,' + report.summary.registry_changes + ',,FALSE,REGISTRY_CHANGE,,,\n';

    fs.writeFileSync(outputPath, csv, 'utf-8');
  }
}
