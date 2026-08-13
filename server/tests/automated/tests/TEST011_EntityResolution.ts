/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-011 — Entity Resolution
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus } from '../types';

export class TEST011_EntityResolution extends BaseTest {
  constructor() {
    super('TEST-011', 'Entity Resolution');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const endpoint = context.source_config.endpoint_or_resource;
        
        // Fetch response
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PREDATOR-Analytics-Test/1.0'
          }
        });
        
        const body = await response.text();
        
        // Parse JSON
        let jsonData: any;
        try {
          jsonData = JSON.parse(body);
        } catch (parseError) {
          errors.push('Cannot check entity resolution - raw data is not valid JSON');
          return { details, errors, warnings };
        }
        
        // Check for duplicates
        const duplicateCheck = this.checkDuplicates(jsonData);
        details['duplicates_found'] = duplicateCheck.count;
        details['duplicate_ids'] = duplicateCheck.ids;
        
        if (duplicateCheck.count > 0) {
          warnings.push(`Found ${duplicateCheck.count} duplicate records`);
        }
        
        // Check for historical records
        const historicalCheck = this.checkHistoricalRecords(jsonData);
        details['historical_records_found'] = historicalCheck.count;
        details['historical_record_ids'] = historicalCheck.ids;
        
        if (historicalCheck.count > 0) {
          details['has_historical_data'] = true;
        }
        
        // Check for transliteration issues
        const transliterationCheck = this.checkTransliteration(jsonData);
        details['transliteration_issues'] = transliterationCheck.issues;
        
        if (transliterationCheck.issues.length > 0) {
          warnings.push(`Transliteration issues detected: ${transliterationCheck.issues.join(', ')}`);
        }
        
        // Check for name changes
        const nameChangeCheck = this.checkNameChanges(jsonData);
        details['name_changes_detected'] = nameChangeCheck.detected;
        details['name_change_records'] = nameChangeCheck.records;
        
        if (nameChangeCheck.detected) {
          details['has_name_variations'] = true;
        }
        
        // Check for entity relationships
        const relationshipCheck = this.checkEntityRelationships(jsonData);
        details['relationships_found'] = relationshipCheck.count;
        details['relationship_types'] = relationshipCheck.types;
        
        // Overall entity resolution quality
        details['entity_resolution_quality'] = this.calculateQualityScore(
          duplicateCheck.count,
          historicalCheck.count,
          transliterationCheck.issues.length,
          nameChangeCheck.detected
        );
        
      } catch (error) {
        errors.push(`Entity resolution check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private checkDuplicates(data: any): { count: number; ids: string[] } {
    const ids = new Set<string>();
    const duplicates: string[] = [];
    
    const traverse = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
        return;
      }
      
      const id = obj.id || obj.edrpou || obj.ipn || obj.record_id;
      if (id) {
        const idStr = String(id);
        if (ids.has(idStr)) {
          duplicates.push(idStr);
        } else {
          ids.add(idStr);
        }
      }
      
      Object.values(obj).forEach(value => traverse(value));
    };
    
    traverse(data);
    
    return {
      count: duplicates.length,
      ids: [...new Set(duplicates)]
    };
  }

  private checkHistoricalRecords(data: any): { count: number; ids: string[] } {
    const historicalIds: string[] = [];
    
    const traverse = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
        return;
      }
      
      // Check for historical indicators
      const isHistorical = 
        obj.status === 'archived' ||
        obj.status === 'historical' ||
        obj.is_historical === true ||
        obj.historical === true ||
        obj.ended_at !== undefined ||
        obj.closed_at !== undefined;
      
      if (isHistorical) {
        const id = obj.id || obj.edrpou || obj.ipn;
        if (id) {
          historicalIds.push(String(id));
        }
      }
      
      Object.values(obj).forEach(value => traverse(value));
    };
    
    traverse(data);
    
    return {
      count: historicalIds.length,
      ids: [...new Set(historicalIds)]
    };
  }

  private checkTransliteration(data: any): { issues: string[] } {
    const issues: string[] = [];
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, path));
        return;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && (key.includes('name') || key.includes('title'))) {
          // Check for mixed scripts (Cyrillic + Latin)
          const hasCyrillic = /[\u0400-\u04FF]/.test(value);
          const hasLatin = /[a-zA-Z]/.test(value);
          
          if (hasCyrillic && hasLatin) {
            issues.push(`Mixed scripts in ${fieldPath}`);
          }
          
          // Check for common transliteration patterns
          if (hasLatin && /[khgtschshz]/i.test(value)) {
            issues.push(`Possible transliteration in ${fieldPath}`);
          }
        }
        
        if (typeof value === 'object') {
          traverse(value, fieldPath);
        }
      }
    };
    
    traverse(data);
    
    return { issues: [...new Set(issues)] };
  }

  private checkNameChanges(data: any): { detected: boolean; records: string[] } {
    const records: string[] = [];
    
    const traverse = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
        return;
      }
      
      // Check for name change indicators
      const hasNameChange = 
        obj.previous_name !== undefined ||
        obj.former_name !== undefined ||
        obj.name_history !== undefined ||
        obj.alias !== undefined ||
        obj.aka !== undefined;
      
      if (hasNameChange) {
        const id = obj.id || obj.edrpou || obj.ipn;
        if (id) {
          records.push(String(id));
        }
      }
      
      Object.values(obj).forEach(value => traverse(value));
    };
    
    traverse(data);
    
    return {
      detected: records.length > 0,
      records: [...new Set(records)]
    };
  }

  private checkEntityRelationships(data: any): { count: number; types: string[] } {
    const types = new Set<string>();
    
    const traverse = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
        return;
      }
      
      // Check for relationship indicators
      const relationshipFields = [
        'parent_id', 'child_id', 'related_to', 'connected_with',
        'beneficiary', 'owner', 'director', 'founder', 'shareholder'
      ];
      
      for (const field of relationshipFields) {
        if (obj[field] !== undefined) {
          types.add(field);
        }
      }
      
      Object.values(obj).forEach(value => traverse(value));
    };
    
    traverse(data);
    
    return {
      count: types.size,
      types: [...types]
    };
  }

  private calculateQualityScore(
    duplicates: number,
    _historical: number,
    transliteration: number,
    nameChanges: boolean
  ): number {
    let score = 1.0;
    
    // Deduct for duplicates
    score -= Math.min(duplicates * 0.1, 0.3);
    
    // Deduct for transliteration issues
    score -= Math.min(transliteration * 0.05, 0.2);
    
    // Name changes are not necessarily bad
    if (nameChanges) {
      score -= 0.05;
    }
    
    return Math.max(0, score);
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
