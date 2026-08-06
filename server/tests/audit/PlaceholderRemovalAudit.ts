/**
 * PREDATOR Analytics - Placeholder Logic Removal Audit
 * 
 * Завдання 7: Видалити Placeholder Logic для реальних даних
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PlaceholderCheck {
  component: string;
  path: string;
  hasPlaceholder: boolean;
  placeholderCondition: string;
  placeholderText: string[];
  issues: string[];
  suggestedFix: string;
}

export class PlaceholderRemovalAuditor {
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

  /**
   * Видалити Placeholder Logic для реальних даних
   */
  async auditPlaceholderLogic(): Promise<{
    checks: PlaceholderCheck[];
    summary: {
      totalComponents: number;
      withPlaceholders: number;
      needsFix: number;
      fixed: number;
    };
    issues: string[];
  }> {
    console.log('[PlaceholderRemovalAudit] Auditing placeholder logic');
    
    const checks: PlaceholderCheck[] = [];
    const issues: string[] = [];

    try {
      // Перевірити кожен компонент
      for (const component of this.FRONTEND_COMPONENTS) {
        const check = await this.checkComponent(component);
        checks.push(check);
        issues.push(...check.issues);
      }

      const withPlaceholders = checks.filter(c => c.hasPlaceholder).length;
      const needsFix = checks.filter(c => c.issues.length > 0).length;
      const fixed = checks.filter(c => c.issues.length === 0).length;

      return {
        checks,
        summary: {
          totalComponents: checks.length,
          withPlaceholders,
          needsFix,
          fixed
        },
        issues
      };
    } catch (error) {
      issues.push(`Failed to audit placeholder logic: ${error instanceof Error ? error.message : String(error)}`);
      return {
        checks: [],
        summary: {
          totalComponents: 0,
          withPlaceholders: 0,
          needsFix: 0,
          fixed: 0
        },
        issues
      };
    }
  }

  private async checkComponent(componentName: string): Promise<PlaceholderCheck> {
    const issues: string[] = [];
    const placeholderText: string[] = [];
    let placeholderCondition = '';

    try {
      // Знайти файл компонента
      const componentPath = await this.findComponentFile(componentName);
      
      if (!componentPath) {
        issues.push(`Component file not found: ${componentName}`);
        return {
          component: componentName,
          path: 'NOT_FOUND',
          hasPlaceholder: false,
          placeholderCondition,
          placeholderText,
          issues,
          suggestedFix: 'Create component file'
        };
      }

      const content = fs.readFileSync(componentPath, 'utf-8');

      // Перевірити на placeholder текст
      for (const pattern of this.PLACEHOLDER_PATTERNS) {
        if (content.includes(pattern)) {
          placeholderText.push(pattern);
        }
      }
      const hasPlaceholder = placeholderText.length > 0;

      // Перевірити умову placeholder
      const conditionalPatterns = [
        /if\s*\(\s*!\w+\s*\)/,
        /if\s*\(\s*\w+\s*&&\s*!\w+\s*\)/,
        /if\s*\(\s*\w+\.length\s*===\s*0\s*\)/,
        /if\s*\(\s*!\w+\.length\s*\)/,
        /{\s*\w+\s*&&\s*!\w+\s*\?/,
        /{\s*!\w+\s*&&/
      ];

      for (const pattern of conditionalPatterns) {
        const match = content.match(pattern);
        if (match) {
          placeholderCondition = match[0];
          break;
        }
      }

      // Перевірити чи placeholder показується коли є дані
      if (hasPlaceholder && placeholderCondition) {
        // Перевірити чи умова правильна
        const hasDataCheck = placeholderCondition.includes('!') || placeholderCondition.includes('=== 0');
        
        if (!hasDataCheck) {
          issues.push('Placeholder condition does not check for absence of data');
        }
      }

      // Перевірити чи placeholder показується коли API повернув порожній масив
      const emptyArrayCheck = content.match(/if\s*\(\s*\w+\.length\s*===\s*0\s*\)/);
      if (emptyArrayCheck && placeholderText.length > 0) {
        // Це коректно - placeholder тільки коли порожньо
      } else if (placeholderText.length > 0 && !emptyArrayCheck) {
        issues.push('Placeholder text found but no proper empty array check');
      }

      // Сформувати пропозицію виправлення
      let suggestedFix = '';
      if (issues.length > 0) {
        suggestedFix = this.generateSuggestedFix(componentName, content, placeholderCondition, placeholderText);
      }

      return {
        component: componentName,
        path: componentPath,
        hasPlaceholder,
        placeholderCondition,
        placeholderText,
        issues,
        suggestedFix
      };
    } catch (error) {
      issues.push(`Failed to check component ${componentName}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        component: componentName,
        path: 'ERROR',
        hasPlaceholder: false,
        placeholderCondition,
        placeholderText,
        issues,
        suggestedFix: 'Fix component file'
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

  private generateSuggestedFix(
    componentName: string,
    content: string,
    placeholderCondition: string,
    placeholderText: string[]
  ): string {
    if (placeholderText.length === 0) {
      return 'No placeholder text found';
    }

    const dataProp = this.getDataPropName(componentName);
    
    return `Replace placeholder logic with:
{!${dataProp} || ${dataProp}.length === 0 ? (
  <div className="text-muted">Дані відсутні</div>
) : (
  // Render actual data
)}`;
  }

  private getDataPropName(componentName: string): string {
    const propMap: Record<string, string> = {
      'IdentificationPanel': 'data',
      'RegistrationPanel': 'data',
      'AddressPanel': 'addresses',
      'PhonePanel': 'phones',
      'EmailPanel': 'emails',
      'FamilyPanel': 'family',
      'BusinessPanel': 'companies',
      'CorporatePanel': 'companies',
      'PropertyPanel': 'properties',
      'VehiclePanel': 'vehicles',
      'CourtPanel': 'courtCases',
      'ExecutionPanel': 'executions',
      'DeclarationPanel': 'declarations',
      'SanctionsPanel': 'sanctions',
      'PEPPanel': 'pep',
      'EvidencePanel': 'evidence',
      'SourcesPanel': 'sources'
    };

    return propMap[componentName] || 'data';
  }

  /**
   * Видалити placeholder логіку з компонента
   */
  async removePlaceholderLogic(componentName: string): Promise<boolean> {
    try {
      const componentPath = await this.findComponentFile(componentName);
      
      if (!componentPath) {
        console.error(`Component file not found: ${componentName}`);
        return false;
      }

      let content = fs.readFileSync(componentPath, 'utf-8');

      // Видалити placeholder текст
      for (const pattern of this.PLACEHOLDER_PATTERNS) {
        content = content.replace(new RegExp(pattern, 'g'), '');
      }

      // Видалити placeholder умови
      content = content.replace(/if\s*\(\s*!\w+\s*\)\s*{[\s\S]*?}/g, '');
      content = content.replace(/if\s*\(\s*\w+\.length\s*===\s*0\s*\)\s*{[\s\S]*?}/g, '');

      fs.writeFileSync(componentPath, content, 'utf-8');
      console.log(`Removed placeholder logic from ${componentName}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove placeholder logic from ${componentName}:`, error);
      return false;
    }
  }

  generateMarkdownReport(auditResult: any): string {
    let markdown = '# Placeholder Logic Removal Audit Report\n\n';
    markdown += `**Audit Date:** ${new Date().toISOString()}\n\n`;

    markdown += '## Summary\n\n';
    markdown += `- Total Components: ${auditResult.summary.totalComponents}\n`;
    markdown += `- With Placeholders: ${auditResult.summary.withPlaceholders}\n`;
    markdown += `- Needs Fix: ${auditResult.summary.needsFix}\n`;
    markdown += `- Fixed: ${auditResult.summary.fixed}\n\n`;

    markdown += '## Component Checks\n\n';
    markdown += '| Component | Path | Has Placeholder | Condition | Placeholder Text | Issues | Suggested Fix |\n';
    markdown += '|-----------|------|----------------|-----------|-----------------|--------|---------------|\n';

    for (const check of auditResult.checks) {
      markdown += `| ${check.component} | ${check.path} | ${check.hasPlaceholder ? '⚠️' : '✅'} | ${check.placeholderCondition || 'None'} | ${check.placeholderText.join(', ') || 'None'} | ${check.issues.join(', ') || 'None'} | ${check.suggestedFix || 'None'} |\n`;
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

export const placeholderRemovalAuditor = new PlaceholderRemovalAuditor();
