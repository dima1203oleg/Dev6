/**
 * PREDATOR Analytics - REST API Audit
 * 
 * Завдання 4: Перевірити REST API response completeness
 */

import { predatorClient } from '../../services/predatorClient';

export interface APIResponseCheck {
  endpoint: string;
  category: string;
  present: boolean;
  count: number;
  items: any[];
  sources: string[];
  confidence: number;
  provenance: any;
  issues: string[];
}

export class RestAPIAuditor {
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
   * Перевірити REST API response completeness
   */
  async auditRestAPI(code: string, identifierType: 'ipn' | 'edrpou'): Promise<{
    checks: APIResponseCheck[];
    summary: {
      totalRequired: number;
      present: number;
      missing: number;
      emptyResponses: number;
      nullResponses: number;
      undefinedResponses: number;
    };
    issues: string[];
  }> {
    console.log(`[RestAPIAudit] Auditing REST API for ${code} (${identifierType})`);
    
    const checks: APIResponseCheck[] = [];
    const issues: string[] = [];

    try {
      const identifiers = identifierType === 'ipn' ? { ipn: code } : { edrpou: code };
      const dossier = await predatorClient.getDossier(code, identifiers);

      // Перевірити кожну обов'язкову категорію
      for (const category of this.REQUIRED_CATEGORIES) {
        const check = await this.checkCategory(dossier, category);
        checks.push(check);

        if (!check.present) {
          issues.push(`Category '${category}' is missing from API response`);
        }

        // Перевірити на заборонені значення
        if (check.items === null) {
          issues.push(`Category '${category}' returned null (forbidden)`);
        } else if (check.items === undefined) {
          issues.push(`Category '${category}' returned undefined (forbidden)`);
        } else if (Array.isArray(check.items) && check.items.length === 0 && check.count > 0) {
          issues.push(`Category '${category}' returned empty array but count > 0`);
        }
      }

      const present = checks.filter(c => c.present).length;
      const missing = checks.filter(c => !c.present).length;
      const emptyResponses = checks.filter(c => Array.isArray(c.items) && c.items.length === 0).length;
      const nullResponses = checks.filter(c => c.items === null).length;
      const undefinedResponses = checks.filter(c => c.items === undefined).length;

      return {
        checks,
        summary: {
          totalRequired: this.REQUIRED_CATEGORIES.length,
          present,
          missing,
          emptyResponses,
          nullResponses,
          undefinedResponses
        },
        issues
      };
    } catch (error) {
      issues.push(`Failed to audit REST API: ${error instanceof Error ? error.message : String(error)}`);
      return {
        checks: [],
        summary: {
          totalRequired: this.REQUIRED_CATEGORIES.length,
          present: 0,
          missing: this.REQUIRED_CATEGORIES.length,
          emptyResponses: 0,
          nullResponses: 0,
          undefinedResponses: 0
        },
        issues
      };
    }
  }

  private async checkCategory(dossier: any, category: string): Promise<APIResponseCheck> {
    const issues: string[] = [];
    let present = false;
    let count = 0;
    let items: any[] = [];
    let sources: string[] = [];
    let confidence = 0;
    let provenance: any = null;

    switch (category) {
      case 'addresses':
        if (dossier.entity?.attributes?.some((a: any) => a.name === 'address')) {
          present = true;
          items = dossier.entity.attributes.filter((a: any) => a.name === 'address');
          count = items.length;
          sources = items.flatMap((a: any) => a.sources || []);
          confidence = items.reduce((sum: number, a: any) => sum + (a.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No addresses in API response');
        }
        break;

      case 'phones':
        if (dossier.entity?.attributes?.some((a: any) => a.name === 'phone')) {
          present = true;
          items = dossier.entity.attributes.filter((a: any) => a.name === 'phone');
          count = items.length;
          sources = items.flatMap((a: any) => a.sources || []);
          confidence = items.reduce((sum: number, a: any) => sum + (a.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No phones in API response');
        }
        break;

      case 'emails':
        if (dossier.entity?.attributes?.some((a: any) => a.name === 'email')) {
          present = true;
          items = dossier.entity.attributes.filter((a: any) => a.name === 'email');
          count = items.length;
          sources = items.flatMap((a: any) => a.sources || []);
          confidence = items.reduce((sum: number, a: any) => sum + (a.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No emails in API response');
        }
        break;

      case 'companies':
        if (dossier.relationships && dossier.relationships.length > 0) {
          present = true;
          items = dossier.relationships;
          count = items.length;
          sources = items.flatMap((r: any) => r.sources || []);
          confidence = items.reduce((sum: number, r: any) => sum + (r.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No companies/relationships in API response');
        }
        break;

      case 'roles':
        if (dossier.relationships && dossier.relationships.some((r: any) => r.role)) {
          present = true;
          items = dossier.relationships.filter((r: any) => r.role);
          count = items.length;
          sources = items.flatMap((r: any) => r.sources || []);
          confidence = items.reduce((sum: number, r: any) => sum + (r.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No roles in API response');
        }
        break;

      case 'family':
        if (dossier.relationships && dossier.relationships.some((r: any) => r.type === 'family')) {
          present = true;
          items = dossier.relationships.filter((r: any) => r.type === 'family');
          count = items.length;
          sources = items.flatMap((r: any) => r.sources || []);
          confidence = items.reduce((sum: number, r: any) => sum + (r.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No family relationships in API response');
        }
        break;

      case 'vehicles':
        if (dossier.vehicles && dossier.vehicles.length > 0) {
          present = true;
          items = dossier.vehicles;
          count = items.length;
          sources = items.flatMap((v: any) => v.sources || []);
          confidence = items.reduce((sum: number, v: any) => sum + (v.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No vehicles in API response');
        }
        break;

      case 'realEstate':
        if (dossier.assets && dossier.assets.some((a: any) => a.type === 'real_estate')) {
          present = true;
          items = dossier.assets.filter((a: any) => a.type === 'real_estate');
          count = items.length;
          sources = items.flatMap((a: any) => a.sources || []);
          confidence = items.reduce((sum: number, a: any) => sum + (a.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No real estate in API response');
        }
        break;

      case 'courtCases':
        if (dossier.courts && dossier.courts.length > 0) {
          present = true;
          items = dossier.courts;
          count = items.length;
          sources = items.flatMap((c: any) => c.sources || []);
          confidence = items.reduce((sum: number, c: any) => sum + (c.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No court cases in API response');
        }
        break;

      case 'executions':
        if (dossier.enforcements && dossier.enforcements.length > 0) {
          present = true;
          items = dossier.enforcements;
          count = items.length;
          sources = items.flatMap((e: any) => e.sources || []);
          confidence = items.reduce((sum: number, e: any) => sum + (e.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No enforcement proceedings in API response');
        }
        break;

      case 'licenses':
        if (dossier.claims && dossier.claims.some((c: any) => c.predicate.includes('license'))) {
          present = true;
          items = dossier.claims.filter((c: any) => c.predicate.includes('license'));
          count = items.length;
          sources = items.flatMap((c: any) => c.sources || []);
          confidence = items.reduce((sum: number, c: any) => sum + (c.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No licenses in API response');
        }
        break;

      case 'customs':
        if (dossier.claims && dossier.claims.some((c: any) => c.predicate.includes('customs'))) {
          present = true;
          items = dossier.claims.filter((c: any) => c.predicate.includes('customs'));
          count = items.length;
          sources = items.flatMap((c: any) => c.sources || []);
          confidence = items.reduce((sum: number, c: any) => sum + (c.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No customs data in API response');
        }
        break;

      case 'declarations':
        if (dossier.claims && dossier.claims.some((c: any) => c.predicate.includes('declaration'))) {
          present = true;
          items = dossier.claims.filter((c: any) => c.predicate.includes('declaration'));
          count = items.length;
          sources = items.flatMap((c: any) => c.sources || []);
          confidence = items.reduce((sum: number, c: any) => sum + (c.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No declarations in API response');
        }
        break;

      case 'sanctions':
        if (dossier.sanctions && dossier.sanctions.length > 0) {
          present = true;
          items = dossier.sanctions;
          count = items.length;
          sources = items.flatMap((s: any) => s.sources || []);
          confidence = items.reduce((sum: number, s: any) => sum + (s.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No sanctions in API response');
        }
        break;

      case 'pep':
        if (dossier.claims && dossier.claims.some((c: any) => c.predicate.includes('pep'))) {
          present = true;
          items = dossier.claims.filter((c: any) => c.predicate.includes('pep'));
          count = items.length;
          sources = items.flatMap((c: any) => c.sources || []);
          confidence = items.reduce((sum: number, c: any) => sum + (c.confidence || 0), 0) / items.length;
          provenance = items[0]?.provenance || null;
        } else {
          issues.push('No PEP records in API response');
        }
        break;

      default:
        issues.push(`Unknown category: ${category}`);
    }

    return {
      endpoint: `/dossier`,
      category,
      present,
      count,
      items,
      sources,
      confidence,
      provenance,
      issues
    };
  }

  generateMarkdownReport(auditResult: any): string {
    let markdown = '# REST API Audit Report\n\n';
    markdown += `**Audit Date:** ${new Date().toISOString()}\n\n`;

    markdown += '## Summary\n\n';
    markdown += `- Total Required Categories: ${auditResult.summary.totalRequired}\n`;
    markdown += `- Present: ${auditResult.summary.present}\n`;
    markdown += `- Missing: ${auditResult.summary.missing}\n`;
    markdown += `- Empty Responses: ${auditResult.summary.emptyResponses}\n`;
    markdown += `- Null Responses: ${auditResult.summary.nullResponses}\n`;
    markdown += `- Undefined Responses: ${auditResult.summary.undefinedResponses}\n\n`;

    markdown += '## Category Checks\n\n';
    markdown += '| Category | Present | Count | Sources | Confidence | Issues |\n';
    markdown += '|----------|---------|-------|---------|------------|--------|\n';

    for (const check of auditResult.checks) {
      markdown += `| ${check.category} | ${check.present ? '✅' : '❌'} | ${check.count} | ${check.sources.length} | ${check.confidence.toFixed(2)} | ${check.issues.join(', ') || 'None'} |\n`;
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

export const restAPIAuditor = new RestAPIAuditor();
