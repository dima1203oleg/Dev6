/**
 * PREDATOR Analytics - Frontend Mapping Audit
 * 
 * Завдання 5: Перевірити Frontend mapping consistency
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MappingDiscrepancy {
  backendField: string;
  frontendField: string;
  component: string;
  type: 'name_mismatch' | 'missing_field' | 'extra_field' | 'type_mismatch';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface FrontendComponentCheck {
  component: string;
  path: string;
  props: string[];
  receivedData: string[];
  renderedFields: string[];
  issues: string[];
}

export class FrontendMappingAuditor {
  private COMMON_DISCREPANCIES = [
    { backend: 'addresses', frontend: ['addressList', 'locations', 'address'] },
    { backend: 'phones', frontend: ['phoneNumbers', 'contacts', 'phone'] },
    { backend: 'emails', frontend: ['emailAddresses', 'contacts', 'email'] },
    { backend: 'properties', frontend: ['realEstate', 'assets', 'property'] },
    { backend: 'vehicles', frontend: ['transport', 'cars', 'vehicle'] },
    { backend: 'companies', frontend: ['business', 'organizations', 'company'] },
    { backend: 'roles', frontend: ['positions', 'appointments', 'role'] },
    { backend: 'family', frontend: ['relatives', 'familyMembers', 'relations'] }
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
   * Перевірити Frontend mapping consistency
   */
  async auditFrontendMapping(): Promise<{
    discrepancies: MappingDiscrepancy[];
    componentChecks: FrontendComponentCheck[];
    summary: {
      totalDiscrepancies: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    issues: string[];
  }> {
    console.log('[FrontendMappingAudit] Auditing frontend mapping consistency');
    
    const discrepancies: MappingDiscrepancy[] = [];
    const componentChecks: FrontendComponentCheck[] = [];
    const issues: string[] = [];

    try {
      // Перевірити кожен компонент
      for (const component of this.FRONTEND_COMPONENTS) {
        const check = await this.checkComponent(component);
        componentChecks.push(check);
        issues.push(...check.issues);
      }

      // Перевірити загальні розбіжності назв
      for (const discrepancy of this.COMMON_DISCREPANCIES) {
        const found = await this.checkDiscrepancy(discrepancy.backend, discrepancy.frontend);
        discrepancies.push(...found);
      }

      const critical = discrepancies.filter(d => d.severity === 'critical').length;
      const high = discrepancies.filter(d => d.severity === 'high').length;
      const medium = discrepancies.filter(d => d.severity === 'medium').length;
      const low = discrepancies.filter(d => d.severity === 'low').length;

      return {
        discrepancies,
        componentChecks,
        summary: {
          totalDiscrepancies: discrepancies.length,
          critical,
          high,
          medium,
          low
        },
        issues
      };
    } catch (error) {
      issues.push(`Failed to audit frontend mapping: ${error instanceof Error ? error.message : String(error)}`);
      return {
        discrepancies: [],
        componentChecks: [],
        summary: {
          totalDiscrepancies: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        issues
      };
    }
  }

  private async checkComponent(componentName: string): Promise<FrontendComponentCheck> {
    const issues: string[] = [];
    const props: string[] = [];
    const receivedData: string[] = [];
    const renderedFields: string[] = [];

    try {
      // Знайти файл компонента
      const componentPath = await this.findComponentFile(componentName);
      
      if (!componentPath) {
        issues.push(`Component file not found: ${componentName}`);
        return {
          component: componentName,
          path: 'NOT_FOUND',
          props,
          receivedData,
          renderedFields,
          issues
        };
      }

      const content = fs.readFileSync(componentPath, 'utf-8');

      // Витягти props з компонента
      const propsMatch = content.match(/interface\s+\w*Props\s*{([^}]+)}/);
      if (propsMatch) {
        const propsContent = propsMatch[1];
        if (propsContent) {
          const propNames = propsContent.match(/(\w+)\s*:/g);
          if (propNames) {
            props.push(...propNames.map(p => p.replace(':', '').trim()));
          }
        }
      }

      // Витягти використані дані (data, entity, dossier, etc.)
      const dataMatches = content.match(/(?:props\.|{)(\w+)(?:\.|})/g);
      if (dataMatches) {
        receivedData.push(...dataMatches.map(m => m.replace(/props\.|{|}/g, '').split('.')[0] || '').filter(Boolean));
      }

      // Витягти відображені поля
      const fieldMatches = content.match(/\{(\w+)\}/g);
      if (fieldMatches) {
        renderedFields.push(...fieldMatches.map(m => m.replace(/[{}]/g, '')));
      }

      // Перевірити на розбіжності
      const backendFields = this.getExpectedBackendFields(componentName);
      for (const backendField of backendFields) {
        const hasMapping = props.some(p => p.toLowerCase().includes(backendField.toLowerCase())) ||
                          receivedData.some(d => d.toLowerCase().includes(backendField.toLowerCase()));
        
        if (!hasMapping) {
          issues.push(`Backend field '${backendField}' not mapped in component`);
        }
      }

      return {
        component: componentName,
        path: componentPath,
        props,
        receivedData,
        renderedFields,
        issues
      };
    } catch (error) {
      issues.push(`Failed to check component ${componentName}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        component: componentName,
        path: 'ERROR',
        props,
        receivedData,
        renderedFields,
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

  private getExpectedBackendFields(componentName: string): string[] {
    const fieldMap: Record<string, string[]> = {
      'IdentificationPanel': ['fullName', 'ipn', 'birthDate', 'gender', 'citizenship'],
      'RegistrationPanel': ['edrpou', 'status', 'registrationDate', 'address'],
      'AddressPanel': ['addresses', 'addressList', 'locations'],
      'PhonePanel': ['phones', 'phoneNumbers', 'contacts'],
      'EmailPanel': ['emails', 'emailAddresses'],
      'FamilyPanel': ['family', 'relatives', 'familyMembers'],
      'BusinessPanel': ['companies', 'business', 'organizations'],
      'CorporatePanel': ['companies', 'business', 'organizations'],
      'PropertyPanel': ['properties', 'realEstate', 'assets'],
      'VehiclePanel': ['vehicles', 'transport', 'cars'],
      'CourtPanel': ['courtCases', 'courts'],
      'ExecutionPanel': ['executions', 'enforcements'],
      'DeclarationPanel': ['declarations'],
      'SanctionsPanel': ['sanctions'],
      'PEPPanel': ['pep', 'pepRecords'],
      'EvidencePanel': ['evidence', 'sources', 'provenance'],
      'SourcesPanel': ['sources', 'provenance']
    };

    return fieldMap[componentName] || [];
  }

  private async checkDiscrepancy(backendField: string, frontendFields: string[]): Promise<MappingDiscrepancy[]> {
    const discrepancies: MappingDiscrepancy[] = [];

    // Перевірити чи backendField використовується в frontend
    for (const frontendField of frontendFields) {
      const found = await this.searchFrontendForField(frontendField);
      
      if (found) {
        // Перевірити чи є мапінг між backend та frontend
        const hasMapping = await this.checkMappingExists(backendField, frontendField);
        
        if (!hasMapping) {
          discrepancies.push({
            backendField,
            frontendField,
            component: found.component,
            type: 'name_mismatch',
            severity: 'high',
            description: `Backend field '${backendField}' may be mapped as '${frontendField}' but explicit mapping not found`
          });
        }
      }
    }

    return discrepancies;
  }

  private async searchFrontendForField(fieldName: string): Promise<{ component: string; path: string } | null> {
    const searchPaths = [
      path.join(process.cwd(), 'src', 'components', 'search'),
      path.join(process.cwd(), 'src', 'services'),
      path.join(process.cwd(), 'src', 'lib')
    ];

    for (const searchPath of searchPaths) {
      try {
        this.searchDirectory(searchPath, fieldName);
      } catch (error) {
        // Directory doesn't exist
      }
    }

    return null;
  }

  private searchDirectory(dir: string, fieldName: string): void {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.searchDirectory(filePath, fieldName);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes(fieldName)) {
          console.log(`Found '${fieldName}' in ${filePath}`);
        }
      }
    }
  }

  private async checkMappingExists(backendField: string, frontendField: string): Promise<boolean> {
    // Перевірити чи є явний мапінг в DTO або маппер файлах
    const mapperPaths = [
      path.join(process.cwd(), 'src', 'services'),
      path.join(process.cwd(), 'src', 'lib'),
      path.join(process.cwd(), 'server', 'services')
    ];

    for (const mapperPath of mapperPaths) {
      try {
        const files = fs.readdirSync(mapperPath);
        for (const file of files) {
          if (file.toLowerCase().includes('mapper') || file.toLowerCase().includes('dto')) {
            const filePath = path.join(mapperPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // Перевірити на мапінг
            const mappingPattern = new RegExp(`${backendField}\\s*[:=]\\s*${frontendField}|${frontendField}\\s*[:=]\\s*${backendField}`, 'i');
            if (mappingPattern.test(content)) {
              return true;
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist
      }
    }

    return false;
  }

  generateMarkdownReport(auditResult: any): string {
    let markdown = '# Frontend Mapping Audit Report\n\n';
    markdown += `**Audit Date:** ${new Date().toISOString()}\n\n`;

    markdown += '## Summary\n\n';
    markdown += `- Total Discrepancies: ${auditResult.summary.totalDiscrepancies}\n`;
    markdown += `- Critical: ${auditResult.summary.critical}\n`;
    markdown += `- High: ${auditResult.summary.high}\n`;
    markdown += `- Medium: ${auditResult.summary.medium}\n`;
    markdown += `- Low: ${auditResult.summary.low}\n\n`;

    if (auditResult.discrepancies.length > 0) {
      markdown += '## Mapping Discrepancies\n\n';
      markdown += '| Backend Field | Frontend Field | Component | Type | Severity | Description |\n';
      markdown += '|---------------|----------------|-----------|------|----------|-------------|\n';

      for (const discrepancy of auditResult.discrepancies) {
        markdown += `| ${discrepancy.backendField} | ${discrepancy.frontendField} | ${discrepancy.component} | ${discrepancy.type} | ${discrepancy.severity} | ${discrepancy.description} |\n`;
      }
    }

    markdown += '\n## Component Checks\n\n';
    markdown += '| Component | Path | Props | Received Data | Rendered Fields | Issues |\n';
    markdown += '|-----------|------|-------|---------------|----------------|--------|\n';

    for (const check of auditResult.componentChecks) {
      markdown += `| ${check.component} | ${check.path} | ${check.props.join(', ') || 'None'} | ${check.receivedData.join(', ') || 'None'} | ${check.renderedFields.join(', ') || 'None'} | ${check.issues.join(', ') || 'None'} |\n`;
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

export const frontendMappingAuditor = new FrontendMappingAuditor();
