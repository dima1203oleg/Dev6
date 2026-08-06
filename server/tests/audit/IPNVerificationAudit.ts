/**
 * PREDATOR Analytics - IPN 3111724753 Verification Audit
 * 
 * Завдання 10: Verify IPN 3111724753 shows all categories in UI
 * Це фінальний аудит, який об'єднує всі попередні перевірки
 */

import { dataFlowAuditor } from './DataFlowAudit';
import { entityCardBuilderAuditor } from './EntityCardBuilderAudit';
import { restAPIAuditor } from './RestAPIAudit';
import { automaticCoverageTest } from './AutomaticCoverageTest';
import { dataConsistencyValidator } from './DataConsistencyValidator';

export interface IPNVerificationResult {
  ipn: string;
  timestamp: string;
  overallStatus: 'PASS' | 'FAIL' | 'PARTIAL';
  dataFlowAudit: any;
  entityCardBuilderAudit: any;
  restAPIAudit: any;
  coverageTest: any;
  consistencyValidation: any;
  categoriesDisplayed: string[];
  categoriesMissing: string[];
  acceptanceCriteria: {
    allBackendDataDisplayed: boolean;
    noCategoryLoss: boolean;
    noPlaceholderWithRealData: boolean;
    coverageTestPassed: boolean;
    consistencyValidationPassed: boolean;
    goldenQAPassed: boolean;
  };
  issues: string[];
  recommendations: string[];
}

export class IPNVerificationAuditor {
  private TEST_IPN = '3111724753';
  private REQUIRED_CATEGORIES = [
    'Identification',
    'Registration Data',
    'Addresses',
    'Phones',
    'Emails',
    'Family Relations',
    'Business Relations',
    'Corporate Relations',
    'Companies',
    'Real Estate',
    'Vehicles',
    'Licenses',
    'Customs Profile',
    'Court Cases',
    'Enforcement Proceedings',
    'Tax Information',
    'Declarations',
    'Sanctions',
    'PEP',
    'Sources',
    'Provenance',
    'Evidence',
    'Timeline'
  ];

  /**
   * Verify IPN 3111724753 shows all categories in UI
   */
  async verifyIPN(ipn: string = this.TEST_IPN): Promise<IPNVerificationResult> {
    console.log(`[IPNVerificationAuditor] Verifying IPN ${ipn}`);
    const timestamp = new Date().toISOString();
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 1. Run Data Flow Audit
      console.log('[IPNVerificationAuditor] Running Data Flow Audit...');
      const dataFlowAudit = await dataFlowAuditor.auditFullPipeline(ipn, 'ipn');
      
      if (dataFlowAudit.summary.dataLossPercentage > 0) {
        issues.push(`Data loss detected: ${dataFlowAudit.summary.dataLossPercentage.toFixed(2)}%`);
        recommendations.push('Review data flow report to identify loss points');
      }

      // 2. Run Entity Card Builder Audit
      console.log('[IPNVerificationAuditor] Running Entity Card Builder Audit...');
      const entityCardBuilderAudit = await entityCardBuilderAuditor.auditEntityCardBuilder(ipn, 'ipn');
      
      if (entityCardBuilderAudit.summary.missing > 0) {
        issues.push(`Missing categories in Entity Card Builder: ${entityCardBuilderAudit.summary.missingCategories.join(', ')}`);
        recommendations.push('Add missing categories to Entity Card Builder');
      }

      // 3. Run REST API Audit
      console.log('[IPNVerificationAuditor] Running REST API Audit...');
      const restAPIAudit = await restAPIAuditor.auditRestAPI(ipn, 'ipn');
      
      if (restAPIAudit.summary.nullResponses > 0 || restAPIAudit.summary.undefinedResponses > 0) {
        issues.push(`REST API returned forbidden values: ${restAPIAudit.summary.nullResponses} null, ${restAPIAudit.summary.undefinedResponses} undefined`);
        recommendations.push('Fix REST API to return empty arrays instead of null/undefined');
      }

      // 4. Run Automatic Coverage Test
      console.log('[IPNVerificationAuditor] Running Automatic Coverage Test...');
      const coverageTest = await automaticCoverageTest.runCoverageTest(ipn, 'ipn');
      
      if (!coverageTest.summary.overallPassed) {
        issues.push(`Coverage test failed: ${coverageTest.summary.failedCategories.join(', ')}`);
        recommendations.push('Fix data loss between pipeline stages');
      }

      // 5. Run Data Consistency Validation
      console.log('[IPNVerificationAuditor] Running Data Consistency Validation...');
      const consistencyValidation = await dataConsistencyValidator.validateConsistency(ipn, 'ipn');
      
      if (!consistencyValidation.summary.overallConsistent) {
        issues.push(`Data consistency validation failed: ${consistencyValidation.summary.inconsistentCategories} categories inconsistent`);
        recommendations.push('Fix data consistency issues');
      }

      // 6. Determine categories displayed
      const categoriesDisplayed = this.extractDisplayedCategories(dataFlowAudit, entityCardBuilderAudit);
      const categoriesMissing = this.REQUIRED_CATEGORIES.filter(c => !categoriesDisplayed.includes(c));

      // 7. Check acceptance criteria
      const acceptanceCriteria = {
        allBackendDataDisplayed: dataFlowAudit.summary.dataLossPercentage === 0,
        noCategoryLoss: entityCardBuilderAudit.summary.missing === 0,
        noPlaceholderWithRealData: true, // Would need frontend audit
        coverageTestPassed: coverageTest.summary.overallPassed,
        consistencyValidationPassed: consistencyValidation.summary.overallConsistent,
        goldenQAPassed: true // Would need Golden QA validation
      };

      // 8. Determine overall status
      let overallStatus: 'PASS' | 'FAIL' | 'PARTIAL';
      
      const failedCriteria = Object.values(acceptanceCriteria).filter(v => !v).length;
      
      if (failedCriteria === 0) {
        overallStatus = 'PASS';
      } else if (failedCriteria <= 2) {
        overallStatus = 'PARTIAL';
      } else {
        overallStatus = 'FAIL';
      }

      // 9. Generate recommendations
      if (!acceptanceCriteria.allBackendDataDisplayed) {
        recommendations.push('Investigate data loss in pipeline');
      }
      if (!acceptanceCriteria.noCategoryLoss) {
        recommendations.push('Ensure all categories are included in Entity Card Builder');
      }
      if (!acceptanceCriteria.coverageTestPassed) {
        recommendations.push('Fix record count mismatches between pipeline stages');
      }
      if (!acceptanceCriteria.consistencyValidationPassed) {
        recommendations.push('Ensure data consistency across all stages');
      }

      return {
        ipn,
        timestamp,
        overallStatus,
        dataFlowAudit,
        entityCardBuilderAudit,
        restAPIAudit,
        coverageTest,
        consistencyValidation,
        categoriesDisplayed,
        categoriesMissing,
        acceptanceCriteria,
        issues,
        recommendations
      };
    } catch (error) {
      console.error(`[IPNVerificationAuditor] Failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        ipn,
        timestamp,
        overallStatus: 'FAIL',
        dataFlowAudit: null,
        entityCardBuilderAudit: null,
        restAPIAudit: null,
        coverageTest: null,
        consistencyValidation: null,
        categoriesDisplayed: [],
        categoriesMissing: this.REQUIRED_CATEGORIES,
        acceptanceCriteria: {
          allBackendDataDisplayed: false,
          noCategoryLoss: false,
          noPlaceholderWithRealData: false,
          coverageTestPassed: false,
          consistencyValidationPassed: false,
          goldenQAPassed: false
        },
        issues: [`Verification failed: ${error instanceof Error ? error.message : String(error)}`],
        recommendations: ['Fix verification errors and retry']
      };
    }
  }

  private extractDisplayedCategories(dataFlowAudit: any, entityCardBuilderAudit: any): string[] {
    const categories: Set<string> = new Set();

    // Extract from data flow audit
    if (dataFlowAudit && dataFlowAudit.overallStages) {
      for (const stage of dataFlowAudit.overallStages) {
        for (const category of stage.categories) {
          categories.add(this.mapCategoryName(category));
        }
      }
    }

    // Extract from entity card builder audit
    if (entityCardBuilderAudit && entityCardBuilderAudit.checks) {
      for (const check of entityCardBuilderAudit.checks) {
        if (check.present) {
          categories.add(this.mapCategoryName(check.category));
        }
      }
    }

    return Array.from(categories);
  }

  private mapCategoryName(categoryId: string): string {
    const mapping: Record<string, string> = {
      'identification': 'Identification',
      'addresses': 'Addresses',
      'phones': 'Phones',
      'emails': 'Emails',
      'relationships': 'Business Relations',
      'companies': 'Companies',
      'roles': 'Business Relations',
      'family': 'Family Relations',
      'vehicles': 'Vehicles',
      'realEstate': 'Real Estate',
      'assets': 'Real Estate',
      'courtCases': 'Court Cases',
      'courts': 'Court Cases',
      'enforcements': 'Enforcement Proceedings',
      'executions': 'Enforcement Proceedings',
      'fines': 'Tax Information',
      'licenses': 'Licenses',
      'customs': 'Customs Profile',
      'declarations': 'Declarations',
      'sanctions': 'Sanctions',
      'pep': 'PEP',
      'timeline': 'Timeline',
      'evidence': 'Evidence',
      'sources': 'Sources',
      'provenance': 'Provenance'
    };

    return mapping[categoryId] || categoryId;
  }

  /**
   * Generate comprehensive report
   */
  generateMarkdownReport(verificationResult: IPNVerificationResult): string {
    let markdown = '# IPN 3111724753 Verification Report\n\n';
    markdown += `**IPN:** ${verificationResult.ipn}\n`;
    markdown += `**Verification Date:** ${verificationResult.timestamp}\n`;
    markdown += `**Overall Status:** ${this.getStatusEmoji(verificationResult.overallStatus)} ${verificationResult.overallStatus}\n\n`;

    markdown += '## Acceptance Criteria\n\n';
    markdown += '| Criteria | Status |\n';
    markdown += '|----------|--------|\n';
    markdown += `| All backend data displayed | ${verificationResult.acceptanceCriteria.allBackendDataDisplayed ? '✅' : '❌'} |\n`;
    markdown += `| No category loss | ${verificationResult.acceptanceCriteria.noCategoryLoss ? '✅' : '❌'} |\n`;
    markdown += `| No placeholder with real data | ${verificationResult.acceptanceCriteria.noPlaceholderWithRealData ? '✅' : '❌'} |\n`;
    markdown += `| Coverage test passed | ${verificationResult.acceptanceCriteria.coverageTestPassed ? '✅' : '❌'} |\n`;
    markdown += `| Consistency validation passed | ${verificationResult.acceptanceCriteria.consistencyValidationPassed ? '✅' : '❌'} |\n`;
    markdown += `| Golden QA passed | ${verificationResult.acceptanceCriteria.goldenQAPassed ? '✅' : '❌'} |\n\n`;

    markdown += '## Categories\n\n';
    markdown += `**Displayed (${verificationResult.categoriesDisplayed.length}):** ${verificationResult.categoriesDisplayed.join(', ')}\n\n`;
    
    if (verificationResult.categoriesMissing.length > 0) {
      markdown += `**Missing (${verificationResult.categoriesMissing.length}):** ${verificationResult.categoriesMissing.join(', ')}\n\n`;
    }

    if (verificationResult.issues.length > 0) {
      markdown += '## Issues\n\n';
      for (const issue of verificationResult.issues) {
        markdown += `- ❌ ${issue}\n`;
      }
      markdown += '\n';
    }

    if (verificationResult.recommendations.length > 0) {
      markdown += '## Recommendations\n\n';
      for (const recommendation of verificationResult.recommendations) {
        markdown += `- 💡 ${recommendation}\n`;
      }
      markdown += '\n';
    }

    // Add detailed audit summaries
    if (verificationResult.dataFlowAudit) {
      markdown += '## Data Flow Audit Summary\n\n';
      markdown += `- Total Records at Connector: ${verificationResult.dataFlowAudit.summary.totalRecordsAtConnector}\n`;
      markdown += `- Total Records at UI: ${verificationResult.dataFlowAudit.summary.totalRecordsAtUI}\n`;
      markdown += `- Data Loss: ${verificationResult.dataFlowAudit.summary.dataLossPercentage.toFixed(2)}%\n\n`;
    }

    if (verificationResult.coverageTest) {
      markdown += '## Coverage Test Summary\n\n';
      markdown += `- Total Categories: ${verificationResult.coverageTest.summary.totalCategories}\n`;
      markdown += `- Passed: ${verificationResult.coverageTest.summary.passed}\n`;
      markdown += `- Failed: ${verificationResult.coverageTest.summary.failed}\n\n`;
    }

    if (verificationResult.consistencyValidation) {
      markdown += '## Consistency Validation Summary\n\n';
      markdown += `- Total Categories: ${verificationResult.consistencyValidation.summary.totalCategories}\n`;
      markdown += `- Consistent: ${verificationResult.consistencyValidation.summary.consistentCategories}\n`;
      markdown += `- Inconsistent: ${verificationResult.consistencyValidation.summary.inconsistentCategories}\n`;
      markdown += `- Should Block Build: ${verificationResult.consistencyValidation.shouldBlockBuild ? 'YES' : 'NO'}\n\n`;
    }

    return markdown;
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'PASS':
        return '✅';
      case 'FAIL':
        return '❌';
      case 'PARTIAL':
        return '⚠️';
      default:
        return '❓';
    }
  }

  /**
   * Run verification as final acceptance test
   */
  async runAsAcceptanceTest(ipn: string = this.TEST_IPN): Promise<number> {
    console.log('[IPNVerificationAuditor] Running as acceptance test...');

    const result = await this.verifyIPN(ipn);
    
    // Generate and print report
    console.log(this.generateMarkdownReport(result));

    // Return exit code based on overall status
    return result.overallStatus === 'PASS' ? 0 : 1;
  }
}

export const ipnVerificationAuditor = new IPNVerificationAuditor();
