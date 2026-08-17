/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-018 — Production Data Integrity (Zero Demo/Fallback)
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult } from '../types';
import { fakeDataScanner } from '../../../certification/FakeDataScanner';
import { hardcodedIdentifierScanner } from '../../../certification/HardcodedIdentifierScanner';
import path from 'path';

export class TEST018_ProductionDataIntegrity extends BaseTest {
  constructor() {
    super('TEST-018', 'Production Data Integrity');
  }

  async execute(_context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        // Scan directory for fake/mock data in production
        const scanResult = fakeDataScanner.scanDirectory(path.resolve('.'), true);
        const validation = fakeDataScanner.validateProductionReady(scanResult);

        details['fake_data_findings'] = scanResult.findings.length;
        if (!validation.ready) {
          errors.push(`Fake/mock data or demo data fallbacks detected: ${scanResult.findings.length} findings`);
          scanResult.findings.slice(0, 5).forEach(f => {
            errors.push(`  - ${f.file}:${f.line} -> Pattern "${f.pattern}" found`);
          });
        }

        // Scan directory for hardcoded production identifiers
        const identifierScan = hardcodedIdentifierScanner.scanDirectory(path.resolve('.'));
        const identifierValidation = hardcodedIdentifierScanner.validateProductionReady(identifierScan);

        details['hardcoded_identifiers'] = identifierScan.findings.length;
        if (!identifierValidation.ready) {
          errors.push(`Hardcoded identifiers found in production paths: ${identifierScan.findings.length} findings`);
          identifierScan.findings.slice(0, 5).forEach(f => {
            errors.push(`  - ${f.file}:${f.line} -> Found identifier "${f.identifierValue}"`);
          });
        }

      } catch (error: any) {
        errors.push(`Production Data Integrity check execution failed: ${error.message}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }
}
