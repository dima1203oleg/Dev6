/**
 * PREDATOR Analytics - React Components Data Rendering Audit
 * 
 * Завдання 6: Перевірити React Components data rendering
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ComponentRenderingCheck {
  component: string;
  path: string;
  propsReceived: string[];
  dataReceived: boolean;
  renderedRows: number;
  expectedRows: number;
  hasPlaceholder: boolean;
  placeholderText: string[];
  issues: string[];
}

export class ReactComponentsAuditor {
  private FRONTEND_COMPONENTS = [
    'IdentificationPanel',
    'RegistrationPanel',
    'AddressPanel',
    'PhonePanel',
    'EmailPanel',
    'FamilyPanel',
    'BusinessPanel',
    'CorporatePanel',
    'PropertyPanel',
    'VehiclePanel',
    'CourtPanel',
    'ExecutionPanel',
    'DeclarationPanel',
    'SanctionsPanel',
    'PEPPanel',
    'EvidencePanel',
    'SourcesPanel'
  ];

  private PLACEHOLDER_PATTERNS = [
    'Дані відсутні',
    'Модуль у розробці',
    'Немає інформації',
    'No data available',
    'Module under development',
    'No information',
    'Coming soon',
    'Тільки для прикладу',
    'Demo only'
  ];

  /**
   * Перевірити React Components data rendering
   */
  async auditReactComponents(): Promise<{
    checks: ComponentRenderingCheck[];
    summary: {
      totalComponents: number;
      withData: number;
      withoutData: number;
      withPlaceholders: number;
      renderingIssues: number;
    };
    issues: string[];
  }> {
    console.log('[ReactComponentsAudit] Auditing React components data rendering');
    
    const checks: ComponentRenderingCheck[] = [];
    const issues: string[] = [];

    try {
      // Перевірити кожен компонент
      for (const component of this.FRONTEND_COMPONENTS) {
        const check = await this.checkComponent(component);
        checks.push(check);
        issues.push(...check.issues);
      }

      const withData = checks.filter(c => c.dataReceived).length;
      const withoutData = checks.filter(c => !c.dataReceived).length;
      const withPlaceholders = checks.filter(c => c.hasPlaceholder).length;
      const renderingIssues = checks.filter(c => c.renderedRows === 0 && c.expectedRows > 0).length;

      return {
        checks,
        summary: {
          totalComponents: checks.length,
          withData,
          withoutData,
          withPlaceholders,
          renderingIssues
        },
        issues
      };
    } catch (error) {
      issues.push(`Failed to audit React components: ${error instanceof Error ? error.message : String(error)}`);
      return {
        checks: [],
        summary: {
          totalComponents: 0,
          withData: 0,
          withoutData: 0,
          withPlaceholders: 0,
          renderingIssues: 0
        },
        issues
      };
    }
  }

  private async checkComponent(componentName: string): Promise<ComponentRenderingCheck> {
    const issues: string[] = [];
    const propsReceived: string[] = [];
    const placeholderText: string[] = [];

    try {
      // Знайти файл компонента
      const componentPath = await this.findComponentFile(componentName);
      
      if (!componentPath) {
        issues.push(`Component file not found: ${componentName}`);
        return {
          component: componentName,
          path: 'NOT_FOUND',
          propsReceived,
          dataReceived: false,
          renderedRows: 0,
          expectedRows: 0,
          hasPlaceholder: false,
          placeholderText,
          issues
        };
      }

      const content = fs.readFileSync(componentPath, 'utf-8');

      // Витягти props
      const propsMatch = content.match(/interface\s+\w*Props\s*{([^}]+)}/);
      if (propsMatch) {
        const propsContent = propsMatch[1];
        const propNames = propsContent.match(/(\w+)\s*:/g);
        if (propNames) {
          propsReceived.push(...propNames.map(p => p.replace(':', '').trim()));
        }
      }

      // Перевірити чи компонент отримує дані
      const dataProps = propsReceived.filter(p => 
        p.toLowerCase().includes('data') || 
        p.toLowerCase().includes('items') ||
        p.toLowerCase().includes('records') ||
        p.toLowerCase().includes('entity') ||
        p.toLowerCase().includes('dossier')
      );
      const dataReceived = dataProps.length > 0;

      // Перевірити рендеринг рядків
      const mapCalls = content.match(/\.map\(/g);
      const renderedRows = mapCalls ? mapCalls.length : 0;

      // Очікувана кількість рядків базується на типі компонента
      const expectedRows = this.getExpectedRows(componentName);

      // Перевірити на placeholder текст
      for (const pattern of this.PLACEHOLDER_PATTERNS) {
        if (content.includes(pattern)) {
          placeholderText.push(pattern);
        }
      }
      const hasPlaceholder = placeholderText.length > 0;

      // Перевірити на умовний рендеринг placeholder
      const conditionalPlaceholder = content.match(/if\s*\(\s*\!\w+\s*||\w+\s*&&\s*!\w+\s*\)/);
      if (conditionalPlaceholder) {
        issues.push('Component has conditional placeholder rendering');
      }

      // Перевірити чи компонент рендерить дані коли вони є
      if (dataReceived && renderedRows === 0 && expectedRows > 0) {
        issues.push('Component receives data but renders 0 rows');
      }

      // Перевірити чи компонент має placeholder коли немає даних
      if (!dataReceived && !hasPlaceholder) {
        issues.push('Component has no data but no placeholder message');
      }

      return {
        component: componentName,
        path: componentPath,
        propsReceived,
        dataReceived,
        renderedRows,
        expectedRows,
        hasPlaceholder,
        placeholderText,
        issues
      };
    } catch (error) {
      issues.push(`Failed to check component ${componentName}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        component: componentName,
        path: 'ERROR',
        propsReceived,
        dataReceived: false,
        renderedRows: 0,
        expectedRows: 0,
        hasPlaceholder: false,
        placeholderText,
        issues
      };
    }
  }

  private async findComponentFile(componentName: string): Promise<string | null> {
    const searchPaths = [
      path.join(process.cwd(), 'src', 'components', 'search', 'cards'),
      path.join(process.cwd(), 'src', 'components', 'search', 'blocks'),
      path.join(process.cwd(), 'src', 'components')
    ];

    for (const searchPath of searchPaths) {
      try {
        const files = fs.readdirSync(searchPath);
        const matchingFile = files.find(f => 
          f.toLowerCase().includes(componentName.toLowerCase()) && 
          (f.endsWith('.tsx') || f.endsWith('.ts'))
        );
        
        if (matchingFile) {
          return path.join(searchPath, matchingFile);
        }
      } catch (error) {
        // Directory doesn't exist, continue
      }
    }

    return null;
  }

  private getExpectedRows(componentName: string): number {
    const rowMap: Record<string, number> = {
      'IdentificationPanel': 1,
      'RegistrationPanel': 1,
      'AddressPanel': 5,
      'PhonePanel': 3,
      'EmailPanel': 2,
      'FamilyPanel': 3,
      'BusinessPanel': 5,
      'CorporatePanel': 5,
      'PropertyPanel': 3,
      'VehiclePanel': 2,
      'CourtPanel': 5,
      'ExecutionPanel': 3,
      'DeclarationPanel': 2,
      'SanctionsPanel': 1,
      'PEPPanel': 2,
      'EvidencePanel': 5,
      'SourcesPanel': 5
    };

    return rowMap[componentName] || 1;
  }

  generateMarkdownReport(auditResult: any): string {
    let markdown = '# React Components Data Rendering Audit Report\n\n';
    markdown += `**Audit Date:** ${new Date().toISOString()}\n\n`;

    markdown += '## Summary\n\n';
    markdown += `- Total Components: ${auditResult.summary.totalComponents}\n`;
    markdown += `- With Data: ${auditResult.summary.withData}\n`;
    markdown += `- Without Data: ${auditResult.summary.withoutData}\n`;
    markdown += `- With Placeholders: ${auditResult.summary.withPlaceholders}\n`;
    markdown += `- Rendering Issues: ${auditResult.summary.renderingIssues}\n\n`;

    markdown += '## Component Checks\n\n';
    markdown += '| Component | Path | Props Received | Data Received | Rendered Rows | Expected Rows | Has Placeholder | Placeholder Text | Issues |\n';
    markdown += '|-----------|------|----------------|---------------|---------------|----------------|----------------|-----------------|--------|\n';

    for (const check of auditResult.checks) {
      markdown += `| ${check.component} | ${check.path} | ${check.propsReceived.join(', ') || 'None'} | ${check.dataReceived ? '✅' : '❌'} | ${check.renderedRows} | ${check.expectedRows} | ${check.hasPlaceholder ? '⚠️' : '✅'} | ${check.placeholderText.join(', ') || 'None'} | ${check.issues.join(', ') || 'None'} |\n`;
    }

    if (auditResult.issues.length > 0) {
      markdown += '\n## Issues\n\n';
      for (const issue of auditResult.issues) {
        markdown += `- ${issue}\n`;
      }
    }

    return markdown;
  }
}

export const reactComponentsAuditor = new ReactComponentsAuditor();
