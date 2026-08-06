/**
 * PREDATOR Analytics - Entity Card Builder Audit
 * 
 * Завдання 3: Перевірити EntityCardBuilder на відсутні категорії
 */

import { intelligenceOrchestrator } from '../../services/IntelligenceOrchestrator';

export interface BuilderCategoryCheck {
  category: string;
  present: boolean;
  recordCount: number;
  fieldCount: number;
  sourceCount: number;
  issues: string[];
}

export class EntityCardBuilderAuditor {
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
   * Перевірити EntityCardBuilder на відсутні категорії
   */
  async auditEntityCardBuilder(code: string, identifierType: 'ipn' | 'edrpou'): Promise<{
    checks: BuilderCategoryCheck[];
    summary: {
      totalRequired: number;
      present: number;
      missing: number;
      missingCategories: string[];
    };
    issues: string[];
  }> {
    console.log(`[EntityCardBuilderAudit] Auditing builder for ${code} (${identifierType})`);
    
    const checks: BuilderCategoryCheck[] = [];
    const issues: string[] = [];

    try {
      const identifiers = identifierType === 'ipn' ? { ipn: code } : { edrpou: code };
      const dossier = await intelligenceOrchestrator.buildDossier(code, identifiers);

      // Перевірити кожну обов'язкову категорію
      for (const category of this.REQUIRED_CATEGORIES) {
        const check = await this.checkCategory(dossier, category);
        checks.push(check);

        if (!check.present) {
          issues.push(`Category '${category}' is missing from dossier`);
        }
      }

      // Перевірити додаткові категорії, які можуть бути в dossier
      const additionalChecks = this.checkAdditionalCategories(dossier);
      checks.push(...additionalChecks);

      const present = checks.filter(c => c.present).length;
      const missing = checks.filter(c => !c.present).length;
      const missingCategories = checks.filter(c => !c.present).map(c => c.category);

      return {
        checks,
        summary: {
          totalRequired: this.REQUIRED_CATEGORIES.length,
          present,
          missing,
          missingCategories
        },
        issues
      };
    } catch (error) {
      issues.push(`Failed to audit builder: ${error instanceof Error ? error.message : String(error)}`);
      return {
        checks: [],
        summary: {
          totalRequired: this.REQUIRED_CATEGORIES.length,
          present: 0,
          missing: this.REQUIRED_CATEGORIES.length,
          missingCategories: this.REQUIRED_CATEGORIES
        },
        issues
      };
    }
  }

  private async checkCategory(dossier: any, category: string): Promise<BuilderCategoryCheck> {
    const issues: string[] = [];
    let present = false;
    let recordCount = 0;
    let fieldCount = 0;
    let sourceCount = 0;

    switch (category) {
      case 'addresses':
        // Перевірити addresses в dossier
        if (dossier.entity?.attributes?.some((a: any) => a.name === 'address')) {
          present = true;
          const addresses = dossier.entity.attributes.filter((a: any) => a.name === 'address');
          recordCount = addresses.length;
          fieldCount = addresses.reduce((sum: number, a: any) => sum + Object.keys(a.value || {}).length, 0);
          sourceCount = addresses.reduce((sum: number, a: any) => sum + (a.sources?.length || 0), 0);
        } else {
          issues.push('No addresses found in entity attributes');
        }
        break;

      case 'phones':
        if (dossier.entity?.attributes?.some((a: any) => a.name === 'phone')) {
          present = true;
          const phones = dossier.entity.attributes.filter((a: any) => a.name === 'phone');
          recordCount = phones.length;
          fieldCount = phones.reduce((sum: number, a: any) => sum + Object.keys(a.value || {}).length, 0);
          sourceCount = phones.reduce((sum: number, a: any) => sum + (a.sources?.length || 0), 0);
        } else {
          issues.push('No phones found in entity attributes');
        }
        break;

      case 'emails':
        if (dossier.entity?.attributes?.some((a: any) => a.name === 'email')) {
          present = true;
          const emails = dossier.entity.attributes.filter((a: any) => a.name === 'email');
          recordCount = emails.length;
          fieldCount = emails.reduce((sum: number, a: any) => sum + Object.keys(a.value || {}).length, 0);
          sourceCount = emails.reduce((sum: number, a: any) => sum + (a.sources?.length || 0), 0);
        } else {
          issues.push('No emails found in entity attributes');
        }
        break;

      case 'companies':
        if (dossier.relationships && dossier.relationships.length > 0) {
          present = true;
          recordCount = dossier.relationships.length;
          fieldCount = dossier.relationships.reduce((sum: number, r: any) => sum + Object.keys(r).length, 0);
          sourceCount = dossier.relationships.reduce((sum: number, r: any) => sum + (r.sources?.length || 0), 0);
        } else {
          issues.push('No relationships/companies found');
        }
        break;

      case 'roles':
        if (dossier.relationships && dossier.relationships.some((r: any) => r.role)) {
          present = true;
          const withRoles = dossier.relationships.filter((r: any) => r.role);
          recordCount = withRoles.length;
          fieldCount = withRoles.reduce((sum: number, r: any) => sum + Object.keys(r).length, 0);
          sourceCount = withRoles.reduce((sum: number, r: any) => sum + (r.sources?.length || 0), 0);
        } else {
          issues.push('No roles found in relationships');
        }
        break;

      case 'family':
        if (dossier.relationships && dossier.relationships.some((r: any) => r.type === 'family')) {
          present = true;
          const family = dossier.relationships.filter((r: any) => r.type === 'family');
          recordCount = family.length;
          fieldCount = family.reduce((sum: number, r: any) => sum + Object.keys(r).length, 0);
          sourceCount = family.reduce((sum: number, r: any) => sum + (r.sources?.length || 0), 0);
        } else {
          issues.push('No family relationships found');
        }
        break;

      case 'vehicles':
        if (dossier.vehicles && dossier.vehicles.length > 0) {
          present = true;
          recordCount = dossier.vehicles.length;
          fieldCount = dossier.vehicles.reduce((sum: number, v: any) => sum + Object.keys(v).length, 0);
          sourceCount = dossier.vehicles.reduce((sum: number, v: any) => sum + (v.sources?.length || 0), 0);
        } else {
          issues.push('No vehicles found');
        }
        break;

      case 'realEstate':
        if (dossier.assets && dossier.assets.some((a: any) => a.type === 'real_estate')) {
          present = true;
          const realEstate = dossier.assets.filter((a: any) => a.type === 'real_estate');
          recordCount = realEstate.length;
          fieldCount = realEstate.reduce((sum: number, a: any) => sum + Object.keys(a).length, 0);
          sourceCount = realEstate.reduce((sum: number, a: any) => sum + (a.sources?.length || 0), 0);
        } else {
          issues.push('No real estate found in assets');
        }
        break;

      case 'courtCases':
        if (dossier.courts && dossier.courts.length > 0) {
          present = true;
          recordCount = dossier.courts.length;
          fieldCount = dossier.courts.reduce((sum: number, c: any) => sum + Object.keys(c).length, 0);
          sourceCount = dossier.courts.reduce((sum: number, c: any) => sum + (c.sources?.length || 0), 0);
        } else {
          issues.push('No court cases found');
        }
        break;

      case 'executions':
        if (dossier.enforcements && dossier.enforcements.length > 0) {
          present = true;
          recordCount = dossier.enforcements.length;
          fieldCount = dossier.enforcements.reduce((sum: number, e: any) => sum + Object.keys(e).length, 0);
          sourceCount = dossier.enforcements.reduce((sum: number, e: any) => sum + (e.sources?.length || 0), 0);
        } else {
          issues.push('No enforcement proceedings found');
        }
        break;

      case 'licenses':
        if (dossier.claims && dossier.claims.some((c: any) => c.predicate.includes('license'))) {
          present = true;
          const licenses = dossier.claims.filter((c: any) => c.predicate.includes('license'));
          recordCount = licenses.length;
          fieldCount = licenses.reduce((sum: number, c: any) => sum + Object.keys(c.object || {}).length, 0);
          sourceCount = licenses.reduce((sum: number, c: any) => sum + (c.sources?.length || 0), 0);
        } else {
          issues.push('No licenses found in claims');
        }
        break;

      case 'customs':
        if (dossier.claims && dossier.claims.some((c: any) => c.predicate.includes('customs'))) {
          present = true;
          const customs = dossier.claims.filter((c: any) => c.predicate.includes('customs'));
          recordCount = customs.length;
          fieldCount = customs.reduce((sum: number, c: any) => sum + Object.keys(c.object || {}).length, 0);
          sourceCount = customs.reduce((sum: number, c: any) => sum + (c.sources?.length || 0), 0);
        } else {
          issues.push('No customs data found in claims');
        }
        break;

      case 'declarations':
        if (dossier.claims && dossier.claims.some((c: any) => c.predicate.includes('declaration'))) {
          present = true;
          const declarations = dossier.claims.filter((c: any) => c.predicate.includes('declaration'));
          recordCount = declarations.length;
          fieldCount = declarations.reduce((sum: number, c: any) => sum + Object.keys(c.object || {}).length, 0);
          sourceCount = declarations.reduce((sum: number, c: any) => sum + (c.sources?.length || 0), 0);
        } else {
          issues.push('No declarations found in claims');
        }
        break;

      case 'sanctions':
        if (dossier.sanctions && dossier.sanctions.length > 0) {
          present = true;
          recordCount = dossier.sanctions.length;
          fieldCount = dossier.sanctions.reduce((sum: number, s: any) => sum + Object.keys(s).length, 0);
          sourceCount = dossier.sanctions.reduce((sum: number, s: any) => sum + (s.sources?.length || 0), 0);
        } else {
          issues.push('No sanctions found');
        }
        break;

      case 'pep':
        if (dossier.claims && dossier.claims.some((c: any) => c.predicate.includes('pep'))) {
          present = true;
          const pep = dossier.claims.filter((c: any) => c.predicate.includes('pep'));
          recordCount = pep.length;
          fieldCount = pep.reduce((sum: number, c: any) => sum + Object.keys(c.object || {}).length, 0);
          sourceCount = pep.reduce((sum: number, c: any) => sum + (c.sources?.length || 0), 0);
        } else {
          issues.push('No PEP records found in claims');
        }
        break;

      default:
        issues.push(`Unknown category: ${category}`);
    }

    return {
      category,
      present,
      recordCount,
      fieldCount,
      sourceCount,
      issues
    };
  }

  private checkAdditionalCategories(dossier: any): BuilderCategoryCheck[] {
    const checks: BuilderCategoryCheck[] = [];
    
    // Перевірити timeline
    if (dossier.timeline && dossier.timeline.length > 0) {
      checks.push({
        category: 'timeline',
        present: true,
        recordCount: dossier.timeline.length,
        fieldCount: dossier.timeline.reduce((sum: number, t: any) => sum + Object.keys(t).length, 0),
        sourceCount: dossier.timeline.reduce((sum: number, t: any) => sum + (t.sources?.length || 0), 0),
        issues: []
      });
    }

    // Перевірити fines
    if (dossier.fines && dossier.fines.length > 0) {
      checks.push({
        category: 'fines',
        present: true,
        recordCount: dossier.fines.length,
        fieldCount: dossier.fines.reduce((sum: number, f: any) => sum + Object.keys(f).length, 0),
        sourceCount: dossier.fines.reduce((sum: number, f: any) => sum + (f.sources?.length || 0), 0),
        issues: []
      });
    }

    return checks;
  }

  generateMarkdownReport(auditResult: any): string {
    let markdown = '# Entity Card Builder Audit Report\n\n';
    markdown += `**Entity ID:** ${auditResult.summary.missingCategories.length > 0 ? 'N/A' : 'Checked'}\n`;
    markdown += `**Audit Date:** ${new Date().toISOString()}\n\n`;

    markdown += '## Summary\n\n';
    markdown += `- Total Required Categories: ${auditResult.summary.totalRequired}\n`;
    markdown += `- Present: ${auditResult.summary.present}\n`;
    markdown += `- Missing: ${auditResult.summary.missing}\n\n`;

    if (auditResult.summary.missingCategories.length > 0) {
      markdown += '### Missing Categories\n\n';
      for (const category of auditResult.summary.missingCategories) {
        markdown += `- ❌ ${category}\n`;
      }
      markdown += '\n';
    }

    markdown += '## Category Checks\n\n';
    markdown += '| Category | Present | Records | Fields | Sources | Issues |\n';
    markdown += '|----------|---------|---------|--------|---------|--------|\n';

    for (const check of auditResult.checks) {
      markdown += `| ${check.category} | ${check.present ? '✅' : '❌'} | ${check.recordCount} | ${check.fieldCount} | ${check.sourceCount} | ${check.issues.join(', ') || 'None'} |\n`;
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

export const entityCardBuilderAuditor = new EntityCardBuilderAuditor();
