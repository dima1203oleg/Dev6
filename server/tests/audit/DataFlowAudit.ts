/**
 * PREDATOR Analytics - End-to-End Data Flow Audit
 * 
 * Цей модуль проводить аудит всього pipeline від Registry Connectors до React Components
 * для виявлення місць втрати даних між етапами.
 */

import { connectorFactory } from '../../datasources/connectors/ConnectorFactory';
import { intelligenceOrchestrator } from '../../services/IntelligenceOrchestrator';
import { predatorClient } from '../../services/predatorClient';

export interface DataFlowStage {
  stage: string;
  recordCount: number;
  fieldCount: number;
  categories: string[];
  executionTime: number;
  entityId?: string;
  errors: string[];
}

export interface CategoryFlowReport {
  category: string;
  connector: DataFlowStage;
  parser: DataFlowStage;
  normalizer: DataFlowStage;
  entityResolution: DataFlowStage;
  builder: DataFlowStage;
  api: DataFlowStage;
  ui: DataFlowStage;
  lossPoint?: string;
}

export class DataFlowAuditor {
  private auditLog: Map<string, DataFlowStage[]> = new Map();

  /**
   * Завдання 1: Провести End-to-End Audit всього pipeline
   */
  async auditFullPipeline(code: string, identifierType: 'ipn' | 'edrpou'): Promise<{
    overallStages: DataFlowStage[];
    categoryReports: CategoryFlowReport[];
    summary: {
      totalRecordsAtConnector: number;
      totalRecordsAtUI: number;
      dataLossPercentage: number;
      criticalLosses: string[];
    };
  }> {
    console.log(`[DataFlowAudit] Starting audit for ${code} (${identifierType})`);
    const startTime = Date.now();

    const overallStages: DataFlowStage[] = [];
    const categoryReports: CategoryFlowReport[] = [];

    // Stage 1: Registry Connectors
    console.log('[DataFlowAudit] Stage 1: Registry Connectors');
    const connectorStage = await this.auditConnectors(code, identifierType);
    overallStages.push(connectorStage);

    // Stage 2: Parser (part of connector response)
    console.log('[DataFlowAudit] Stage 2: Parser');
    const parserStage = await this.auditParser(code, identifierType);
    overallStages.push(parserStage);

    // Stage 3: Normalizer (part of connector response)
    console.log('[DataFlowAudit] Stage 3: Normalizer');
    const normalizerStage = await this.auditNormalizer(code, identifierType);
    overallStages.push(normalizerStage);

    // Stage 4: Entity Resolution
    console.log('[DataFlowAudit] Stage 4: Entity Resolution');
    const entityResolutionStage = await this.auditEntityResolution(code, identifierType);
    overallStages.push(entityResolutionStage);

    // Stage 5: Entity Card Builder (IntelligenceOrchestrator)
    console.log('[DataFlowAudit] Stage 5: Entity Card Builder');
    const builderStage = await this.auditEntityCardBuilder(code, identifierType);
    overallStages.push(builderStage);

    // Stage 6: REST API
    console.log('[DataFlowAudit] Stage 6: REST API');
    const apiStage = await this.auditRestAPI(code, identifierType);
    overallStages.push(apiStage);

    // Stage 7: Frontend Store (requires frontend audit)
    console.log('[DataFlowAudit] Stage 7: Frontend Store');
    const frontendStage = await this.auditFrontendStore(code, identifierType);
    overallStages.push(frontendStage);

    // Stage 8: React Components (requires component audit)
    console.log('[DataFlowAudit] Stage 8: React Components');
    const uiStage = await this.auditReactComponents(code, identifierType);
    overallStages.push(uiStage);

    // Build category reports
    const categories = this.extractCategories(connectorStage);
    for (const category of categories) {
      const report = await this.buildCategoryFlowReport(category, code, identifierType);
      categoryReports.push(report);
    }

    // Calculate summary
    const totalRecordsAtConnector = connectorStage.recordCount;
    const totalRecordsAtUI = uiStage.recordCount;
    const dataLossPercentage = totalRecordsAtConnector > 0 
      ? ((totalRecordsAtConnector - totalRecordsAtUI) / totalRecordsAtConnector) * 100 
      : 0;

    const criticalLosses = categoryReports
      .filter(r => r.lossPoint)
      .map(r => `${r.category}: loss at ${r.lossPoint}`);

    const duration = Date.now() - startTime;
    console.log(`[DataFlowAudit] Audit completed in ${duration}ms`);

    return {
      overallStages,
      categoryReports,
      summary: {
        totalRecordsAtConnector,
        totalRecordsAtUI,
        dataLossPercentage,
        criticalLosses
      }
    };
  }

  /**
   * Stage 1: Audit Registry Connectors
   */
  private async auditConnectors(code: string, identifierType: 'ipn' | 'edrpou'): Promise<DataFlowStage> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const results = await connectorFactory.queryAll(code, identifierType, 8);
      
      const recordCount = results.reduce((sum: number, r: any) => sum + r.records.length, 0);
      const categories = [...new Set(results.map((r: any) => r.category))] as string[];
      const fieldCount = results.reduce((sum: number, r: any) => {
        return sum + r.records.reduce((recSum: number, rec: any) => {
          return recSum + Object.keys(rec).length;
        }, 0);
      }, 0);

      return {
        stage: 'Registry Connectors',
        recordCount,
        fieldCount,
        categories,
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        stage: 'Registry Connectors',
        recordCount: 0,
        fieldCount: 0,
        categories: [],
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    }
  }

  /**
   * Stage 2: Audit Parser
   */
  private async auditParser(code: string, identifierType: 'ipn' | 'edrpou'): Promise<DataFlowStage> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Parser is integrated into connectors, so we audit the same data
    try {
      const results = await connectorFactory.queryAll(code, identifierType, 8);
      
      const recordCount = results.reduce((sum: number, r: any) => sum + r.records.length, 0);
      const categories = [...new Set(results.map((r: any) => r.category))] as string[];
      const fieldCount = results.reduce((sum: number, r: any) => {
        return sum + r.records.reduce((recSum: number, rec: any) => {
          return recSum + Object.keys(rec).length;
        }, 0);
      }, 0);

      return {
        stage: 'Parser',
        recordCount,
        fieldCount,
        categories,
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        stage: 'Parser',
        recordCount: 0,
        fieldCount: 0,
        categories: [],
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    }
  }

  /**
   * Stage 3: Audit Normalizer
   */
  private async auditNormalizer(code: string, identifierType: 'ipn' | 'edrpou'): Promise<DataFlowStage> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Normalizer is integrated into connectors, so we audit the same data
    try {
      const results = await connectorFactory.queryAll(code, identifierType, 8);
      
      const recordCount = results.reduce((sum: number, r: any) => sum + r.records.length, 0);
      const categories = [...new Set(results.map((r: any) => r.category))] as string[];
      const fieldCount = results.reduce((sum: number, r: any) => {
        return sum + r.records.reduce((recSum: number, rec: any) => {
          return recSum + Object.keys(rec).length;
        }, 0);
      }, 0);

      return {
        stage: 'Normalizer',
        recordCount,
        fieldCount,
        categories,
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        stage: 'Normalizer',
        recordCount: 0,
        fieldCount: 0,
        categories: [],
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    }
  }

  /**
   * Stage 4: Audit Entity Resolution
   */
  private async auditEntityResolution(code: string, identifierType: 'ipn' | 'edrpou'): Promise<DataFlowStage> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const identifiers = identifierType === 'ipn' ? { ipn: code } : { edrpou: code };
      const dossier = await intelligenceOrchestrator.buildDossier(code, identifiers);
      
      const recordCount = dossier.claims.length;
      const categories = [...new Set(dossier.claims.map((c: any) => c.predicate))] as string[];
      const fieldCount = dossier.claims.reduce((sum: number, c: any) => {
        return sum + (c.object ? Object.keys(c.object).length : 0);
      }, 0);

      return {
        stage: 'Entity Resolution',
        recordCount,
        fieldCount,
        categories,
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        stage: 'Entity Resolution',
        recordCount: 0,
        fieldCount: 0,
        categories: [],
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    }
  }

  /**
   * Stage 5: Audit Entity Card Builder
   */
  private async auditEntityCardBuilder(code: string, identifierType: 'ipn' | 'edrpou'): Promise<DataFlowStage> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const identifiers = identifierType === 'ipn' ? { ipn: code } : { edrpou: code };
      const dossier = await intelligenceOrchestrator.buildDossier(code, identifiers);
      
      // Count all data categories in the dossier
      const recordCount = 
        dossier.relationships?.length || 0 +
        dossier.assets?.length || 0 +
        dossier.vehicles?.length || 0 +
        dossier.fines?.length || 0 +
        dossier.courts?.length || 0 +
        dossier.enforcements?.length || 0 +
        dossier.sanctions?.length || 0 +
        dossier.timeline?.length || 0;

      const categories = [
        ...(dossier.relationships?.length > 0 ? ['relationships'] : []),
        ...(dossier.assets?.length > 0 ? ['assets'] : []),
        ...(dossier.vehicles?.length > 0 ? ['vehicles'] : []),
        ...(dossier.fines?.length > 0 ? ['fines'] : []),
        ...(dossier.courts?.length > 0 ? ['courts'] : []),
        ...(dossier.enforcements?.length > 0 ? ['enforcements'] : []),
        ...(dossier.sanctions?.length > 0 ? ['sanctions'] : []),
        ...(dossier.timeline?.length > 0 ? ['timeline'] : [])
      ];

      const fieldCount = recordCount * 5; // Estimate

      return {
        stage: 'Entity Card Builder',
        recordCount,
        fieldCount,
        categories,
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        stage: 'Entity Card Builder',
        recordCount: 0,
        fieldCount: 0,
        categories: [],
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    }
  }

  /**
   * Stage 6: Audit REST API
   */
  private async auditRestAPI(code: string, identifierType: 'ipn' | 'edrpou'): Promise<DataFlowStage> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const identifiers = identifierType === 'ipn' ? { ipn: code } : { edrpou: code };
      const dossier = await predatorClient.getDossier(code, identifiers);
      
      const recordCount = 
        dossier.relationships?.length || 0 +
        dossier.assets?.length || 0 +
        dossier.vehicles?.length || 0 +
        dossier.fines?.length || 0 +
        dossier.courts?.length || 0 +
        dossier.enforcements?.length || 0 +
        dossier.sanctions?.length || 0 +
        dossier.timeline?.length || 0;

      const categories = [
        ...(dossier.relationships?.length > 0 ? ['relationships'] : []),
        ...(dossier.assets?.length > 0 ? ['assets'] : []),
        ...(dossier.vehicles?.length > 0 ? ['vehicles'] : []),
        ...(dossier.fines?.length > 0 ? ['fines'] : []),
        ...(dossier.courts?.length > 0 ? ['courts'] : []),
        ...(dossier.enforcements?.length > 0 ? ['enforcements'] : []),
        ...(dossier.sanctions?.length > 0 ? ['sanctions'] : []),
        ...(dossier.timeline?.length > 0 ? ['timeline'] : [])
      ];

      const fieldCount = recordCount * 5; // Estimate

      return {
        stage: 'REST API',
        recordCount,
        fieldCount,
        categories,
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        stage: 'REST API',
        recordCount: 0,
        fieldCount: 0,
        categories: [],
        executionTime: Date.now() - startTime,
        entityId: code,
        errors
      };
    }
  }

  /**
   * Stage 7: Audit Frontend Store
   * Note: This requires frontend instrumentation
   */
  private async auditFrontendStore(code: string, identifierType: 'ipn' | 'edrpou'): Promise<DataFlowStage> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Placeholder - requires frontend instrumentation
    errors.push('Frontend store audit requires instrumentation in React components');

    return {
      stage: 'Frontend Store',
      recordCount: 0,
      fieldCount: 0,
      categories: [],
      executionTime: Date.now() - startTime,
      entityId: code,
      errors
    };
  }

  /**
   * Stage 8: Audit React Components
   * Note: This requires component instrumentation
   */
  private async auditReactComponents(code: string, identifierType: 'ipn' | 'edrpou'): Promise<DataFlowStage> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Placeholder - requires component instrumentation
    errors.push('React component audit requires instrumentation in components');

    return {
      stage: 'React Components',
      recordCount: 0,
      fieldCount: 0,
      categories: [],
      executionTime: Date.now() - startTime,
      entityId: code,
      errors
    };
  }

  /**
   * Завдання 2: Побудувати Data Flow Report для кожної категорії
   */
  private async buildCategoryFlowReport(
    category: string,
    code: string,
    identifierType: 'ipn' | 'edrpou'
  ): Promise<CategoryFlowReport> {
    const connectorStage = await this.auditConnectors(code, identifierType);
    const parserStage = await this.auditParser(code, identifierType);
    const normalizerStage = await this.auditNormalizer(code, identifierType);
    const entityResolutionStage = await this.auditEntityResolution(code, identifierType);
    const builderStage = await this.auditEntityCardBuilder(code, identifierType);
    const apiStage = await this.auditRestAPI(code, identifierType);
    const uiStage = await this.auditReactComponents(code, identifierType);

    // Find loss point
    let lossPoint: string | undefined;
    const stages = [
      { name: 'connector', stage: connectorStage },
      { name: 'parser', stage: parserStage },
      { name: 'normalizer', stage: normalizerStage },
      { name: 'entityResolution', stage: entityResolutionStage },
      { name: 'builder', stage: builderStage },
      { name: 'api', stage: apiStage },
      { name: 'ui', stage: uiStage }
    ];

    for (let i = 0; i < stages.length - 1; i++) {
      const current = stages[i];
      const next = stages[i + 1];
      
      if (current.stage.recordCount > 0 && next.stage.recordCount === 0) {
        lossPoint = `${current.name} → ${next.name}`;
        break;
      }
    }

    return {
      category,
      connector: connectorStage,
      parser: parserStage,
      normalizer: normalizerStage,
      entityResolution: entityResolutionStage,
      builder: builderStage,
      api: apiStage,
      ui: uiStage,
      lossPoint
    };
  }

  private extractCategories(stage: DataFlowStage): string[] {
    return stage.categories;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(auditResult: any): string {
    let markdown = '# PREDATOR Analytics - Data Flow Audit Report\n\n';
    markdown += `**Entity ID:** ${auditResult.overallStages[0]?.entityId || 'N/A'}\n`;
    markdown += `**Audit Date:** ${new Date().toISOString()}\n\n`;

    markdown += '## Summary\n\n';
    markdown += `- Total Records at Connector: ${auditResult.summary.totalRecordsAtConnector}\n`;
    markdown += `- Total Records at UI: ${auditResult.summary.totalRecordsAtUI}\n`;
    markdown += `- Data Loss Percentage: ${auditResult.summary.dataLossPercentage.toFixed(2)}%\n\n`;

    if (auditResult.summary.criticalLosses.length > 0) {
      markdown += '### Critical Losses\n\n';
      for (const loss of auditResult.summary.criticalLosses) {
        markdown += `- ${loss}\n`;
      }
      markdown += '\n';
    }

    markdown += '## Overall Stages\n\n';
    markdown += '| Stage | Records | Fields | Categories | Execution Time (ms) | Errors |\n';
    markdown += '|-------|---------|--------|------------|-------------------|--------|\n';

    for (const stage of auditResult.overallStages) {
      markdown += `| ${stage.stage} | ${stage.recordCount} | ${stage.fieldCount} | ${stage.categories.join(', ')} | ${stage.executionTime} | ${stage.errors.join(', ') || 'None'} |\n`;
    }

    markdown += '\n## Category Flow Reports\n\n';

    for (const report of auditResult.categoryReports) {
      markdown += `### ${report.category}\n\n`;
      markdown += '| Stage | Records | Fields | Categories | Execution Time (ms) |\n';
      markdown += '|-------|---------|--------|------------|-------------------|\n';
      markdown += `| Connector | ${report.connector.recordCount} | ${report.connector.fieldCount} | ${report.connector.categories.join(', ')} | ${report.connector.executionTime} |\n`;
      markdown += `| Parser | ${report.parser.recordCount} | ${report.parser.fieldCount} | ${report.parser.categories.join(', ')} | ${report.parser.executionTime} |\n`;
      markdown += `| Normalizer | ${report.normalizer.recordCount} | ${report.normalizer.fieldCount} | ${report.normalizer.categories.join(', ')} | ${report.normalizer.executionTime} |\n`;
      markdown += `| Entity Resolution | ${report.entityResolution.recordCount} | ${report.entityResolution.fieldCount} | ${report.entityResolution.categories.join(', ')} | ${report.entityResolution.executionTime} |\n`;
      markdown += `| Builder | ${report.builder.recordCount} | ${report.builder.fieldCount} | ${report.builder.categories.join(', ')} | ${report.builder.executionTime} |\n`;
      markdown += `| API | ${report.api.recordCount} | ${report.api.fieldCount} | ${report.api.categories.join(', ')} | ${report.api.executionTime} |\n`;
      markdown += `| UI | ${report.ui.recordCount} | ${report.ui.fieldCount} | ${report.ui.categories.join(', ')} | ${report.ui.executionTime} |\n\n`;

      if (report.lossPoint) {
        markdown += `**⚠️ Data Loss Detected:** ${report.lossPoint}\n\n`;
      }
    }

    return markdown;
  }
}

export const dataFlowAuditor = new DataFlowAuditor();
