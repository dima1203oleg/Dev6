/**
 * PREDATOR Analytics - Automatic Coverage Test
 * 
 * Завдання 8: Додати Automatic Coverage Test
 * Після кожної збірки автоматично перевіряти:
 * Connector Count == Builder Count == API Count == UI Count
 */

import { dataFlowAuditor } from './DataFlowAudit';

export interface CoverageTestResult {
  category: string;
  connectorCount: number;
  builderCount: number;
  apiCount: number;
  uiCount: number;
  passed: boolean;
  failurePoint: string;
  details: string;
}

export interface CoverageTestSummary {
  totalCategories: number;
  passed: number;
  failed: number;
  overallPassed: boolean;
  failedCategories: string[];
}

export class AutomaticCoverageTest {
  private REQUIRED_CATEGORIES = [
    'addresses',
    'phones',
    'emails',
    'companies',
    'roles',
    'family',
    'vehicles',
    'realEstate',
    'courtCases',
    'executions',
    'licenses',
    'customs',
    'declarations',
    'sanctions',
    'pep'
  ];

  /**
   * Запустити Automatic Coverage Test
   */
  async runCoverageTest(code: string, identifierType: 'ipn' | 'edrpou'): Promise<{
    results: CoverageTestResult[];
    summary: CoverageTestSummary;
    exitCode: number;
  }> {
    console.log(`[AutomaticCoverageTest] Running coverage test for ${code} (${identifierType})`);
    
    const results: CoverageTestResult[] = [];

    try {
      // Отримати дані з Data Flow Audit
      const auditResult = await dataFlowAuditor.auditFullPipeline(code, identifierType);

      // Перевірити кожну категорію
      for (const categoryReport of auditResult.categoryReports) {
        const result = this.checkCategoryCoverage(categoryReport);
        results.push(result);
      }

      const passed = results.filter(r => r.passed).length;
      const failed = results.filter(r => !r.passed).length;
      const overallPassed = failed === 0;
      const failedCategories = results.filter(r => !r.passed).map(r => r.category);

      const exitCode = overallPassed ? 0 : 1;

      return {
        results,
        summary: {
          totalCategories: results.length,
          passed,
          failed,
          overallPassed,
          failedCategories
        },
        exitCode
      };
    } catch (error) {
      console.error(`[AutomaticCoverageTest] Failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        results: [],
        summary: {
          totalCategories: 0,
          passed: 0,
          failed: 0,
          overallPassed: false,
          failedCategories: []
        },
        exitCode: 1
      };
    }
  }

  private checkCategoryCoverage(categoryReport: any): CoverageTestResult {
    const category = categoryReport.category;
    
    const connectorCount = categoryReport.connector.recordCount;
    const builderCount = categoryReport.builder.recordCount;
    const apiCount = categoryReport.api.recordCount;
    const uiCount = categoryReport.ui.recordCount;

    // Перевірити чи всі кількості рівні
    const counts = [connectorCount, builderCount, apiCount, uiCount];
    const allEqual = counts.every(c => c === counts[0]);

    let failurePoint = '';
    let details = '';

    if (!allEqual) {
      // Знайти де відбулася втрата
      if (connectorCount > builderCount) {
        failurePoint = 'Connector → Builder';
        details = `Lost ${connectorCount - builderCount} records`;
      } else if (builderCount > apiCount) {
        failurePoint = 'Builder → API';
        details = `Lost ${builderCount - apiCount} records`;
      } else if (apiCount > uiCount) {
        failurePoint = 'API → UI';
        details = `Lost ${apiCount - uiCount} records`;
      }
    }

    return {
      category,
      connectorCount,
      builderCount,
      apiCount,
      uiCount,
      passed: allEqual,
      failurePoint,
      details
    };
  }

  /**
   * Запустити тест для конкретної категорії
   */
  async runCategoryTest(
    code: string,
    identifierType: 'ipn' | 'edrpou',
    category: string
  ): Promise<CoverageTestResult> {
    console.log(`[AutomaticCoverageTest] Running category test for ${category}`);

    try {
      const auditResult = await dataFlowAuditor.auditFullPipeline(code, identifierType);
      const categoryReport = auditResult.categoryReports.find(r => r.category === category);

      if (!categoryReport) {
        return {
          category,
          connectorCount: 0,
          builderCount: 0,
          apiCount: 0,
          uiCount: 0,
          passed: false,
          failurePoint: 'Category not found',
          details: 'Category not found in audit results'
        };
      }

      return this.checkCategoryCoverage(categoryReport);
    } catch (error) {
      return {
        category,
        connectorCount: 0,
        builderCount: 0,
        apiCount: 0,
        uiCount: 0,
        passed: false,
        failurePoint: 'Test execution failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Генерувати звіт у форматі для CI/CD
   */
  generateCIReport(testResult: any): string {
    let output = '=== AUTOMATIC COVERAGE TEST RESULTS ===\n\n';
    
    output += `Overall Status: ${testResult.summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}\n`;
    output += `Total Categories: ${testResult.summary.totalCategories}\n`;
    output += `Passed: ${testResult.summary.passed}\n`;
    output += `Failed: ${testResult.summary.failed}\n\n`;

    if (testResult.summary.failedCategories.length > 0) {
      output += 'FAILED CATEGORIES:\n';
      for (const category of testResult.summary.failedCategories) {
        output += `  - ${category}\n`;
      }
      output += '\n';
    }

    output += 'DETAILED RESULTS:\n';
    output += '----------------------------------------\n';

    for (const result of testResult.results) {
      output += `\nCategory: ${result.category}\n`;
      output += `  Connector: ${result.connectorCount}\n`;
      output += `  Builder:   ${result.builderCount}\n`;
      output += `  API:       ${result.apiCount}\n`;
      output += `  UI:        ${result.uiCount}\n`;
      output += `  Status:    ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
      
      if (!result.passed) {
        output += `  Failure Point: ${result.failurePoint}\n`;
        output += `  Details: ${result.details}\n`;
      }
    }

    output += '\n========================================\n';
    output += `Exit Code: ${testResult.exitCode}\n`;

    return output;
  }

  /**
   * Генерувати Markdown звіт
   */
  generateMarkdownReport(testResult: any): string {
    let markdown = '# Automatic Coverage Test Report\n\n';
    markdown += `**Test Date:** ${new Date().toISOString()}\n\n`;

    markdown += '## Summary\n\n';
    markdown += `**Overall Status:** ${testResult.summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}\n`;
    markdown += `- Total Categories: ${testResult.summary.totalCategories}\n`;
    markdown += `- Passed: ${testResult.summary.passed}\n`;
    markdown += `- Failed: ${testResult.summary.failed}\n\n`;

    if (testResult.summary.failedCategories.length > 0) {
      markdown += '### Failed Categories\n\n';
      for (const category of testResult.summary.failedCategories) {
        markdown += `- ❌ ${category}\n`;
      }
      markdown += '\n';
    }

    markdown += '## Detailed Results\n\n';
    markdown += '| Category | Connector | Builder | API | UI | Status | Failure Point | Details |\n';
    markdown += '|----------|-----------|---------|-----|-----|--------|---------------|---------|\n';

    for (const result of testResult.results) {
      markdown += `| ${result.category} | ${result.connectorCount} | ${result.builderCount} | ${result.apiCount} | ${result.uiCount} | ${result.passed ? '✅' : '❌'} | ${result.failurePoint || 'N/A'} | ${result.details || 'N/A'} |\n`;
    }

    markdown += '\n## Exit Code\n\n';
    markdown += `**Exit Code:** ${testResult.exitCode}\n\n`;

    if (!testResult.summary.overallPassed) {
      markdown += '## Failure Analysis\n\n';
      markdown += 'The test failed because record counts are not equal across all stages.\n';
      markdown += 'This indicates data loss somewhere in the pipeline.\n';
      markdown += 'Please review the detailed results above to identify the failure point.\n';
    }

    return markdown;
  }

  /**
   * Запустити тест як частина CI/CD pipeline
   */
  async runAsCITest(code: string = '3111724753'): Promise<number> {
    console.log('[AutomaticCoverageTest] Running as CI test...');

    const result = await this.runCoverageTest(code, 'ipn');
    
    // Вивести звіт в консоль
    console.log(this.generateCIReport(result));

    // Повернути exit code
    return result.exitCode;
  }
}

export const automaticCoverageTest = new AutomaticCoverageTest();
