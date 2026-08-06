/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-012 — Cross Validation
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus } from '../types';

export class TEST012_CrossValidation extends BaseTest {
  private static comparisonData: Map<string, any> = new Map();

  constructor() {
    super('TEST-012', 'Cross Validation');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const endpoint = context.source_config.endpoint_or_resource;
        const sourceId = context.source_config.source_id;
        
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
          errors.push('Cannot perform cross validation - raw data is not valid JSON');
          return { details, errors, warnings };
        }
        
        // Store current source data for comparison
        TEST012_CrossValidation.comparisonData.set(sourceId, jsonData);
        
        // Compare with other sources
        const comparison = this.compareWithOtherSources(sourceId, jsonData);
        
        details.sources_compared = comparison.sourcesCompared;
        details.matches_found = comparison.matches;
        details.discrepancies_found = comparison.discrepancies;
        details.contradiction_records = comparison.contradictions;
        
        if (comparison.contradictions.length > 0) {
          warnings.push(`Contradictions detected with other sources: ${comparison.contradictions.join(', ')}`);
          details.contradiction_engine_triggered = true;
        } else {
          details.contradiction_engine_triggered = false;
        }
        
        // Check for data consistency
        const consistencyCheck = this.checkDataConsistency(jsonData);
        details.internal_consistency = consistencyCheck.consistent;
        details.internal_inconsistencies = consistencyCheck.inconsistencies;
        
        if (!consistencyCheck.consistent) {
          warnings.push(`Internal inconsistencies found: ${consistencyCheck.inconsistencies.join(', ')}`);
        }
        
        // Check for expected fields based on entity type
        const entityCheck = this.checkEntityFields(jsonData, context);
        details.expected_fields_present = entityCheck.present;
        details.expected_fields_missing = entityCheck.missing;
        
        if (entityCheck.missing.length > 0) {
          warnings.push(`Missing expected entity fields: ${entityCheck.missing.join(', ')}`);
        }
        
      } catch (error) {
        errors.push(`Cross validation failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private compareWithOtherSources(currentSourceId: string, currentData: any): {
    sourcesCompared: number;
    matches: string[];
    discrepancies: string[];
    contradictions: string[];
  } {
    const result = {
      sourcesCompared: 0,
      matches: [] as string[],
      discrepancies: [] as string[],
      contradictions: [] as string[]
    };
    
    // Get current source identifiers
    const currentIds = this.extractIdentifiers(currentData);
    
    // Compare with other sources
    for (const [otherSourceId, otherData] of TEST012_CrossValidation.comparisonData.entries()) {
      if (otherSourceId === currentSourceId) continue;
      
      result.sourcesCompared++;
      
      const otherIds = this.extractIdentifiers(otherData);
      
      // Check for matching identifiers
      const matchingIds = currentIds.filter(id => otherIds.includes(id));
      
      if (matchingIds.length > 0) {
        result.matches.push(`${otherSourceId}: ${matchingIds.length} matches`);
        
        // Check for data discrepancies on matching IDs
        const discrepancies = this.findDiscrepancies(currentData, otherData, matchingIds);
        if (discrepancies.length > 0) {
          result.discrepancies.push(`${otherSourceId}: ${discrepancies.length} discrepancies`);
          result.contradictions.push(`${otherSourceId}: ${discrepancies.join(', ')}`);
        }
      }
    }
    
    return result;
  }

  private extractIdentifiers(data: any): string[] {
    const ids = new Set<string>();
    
    const traverse = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
        return;
      }
      
      const id = obj.id || obj.edrpou || obj.ipn || obj.tax_id;
      if (id) {
        ids.add(String(id));
      }
      
      Object.values(obj).forEach(value => traverse(value));
    };
    
    traverse(data);
    
    return [...ids];
  }

  private findDiscrepancies(data1: any, data2: any, matchingIds: string[]): string[] {
    const discrepancies: string[] = [];
    
    // Extract data for matching IDs from both sources
    const data1Records = this.extractRecordsById(data1, matchingIds);
    const data2Records = this.extractRecordsById(data2, matchingIds);
    
    for (const id of matchingIds) {
      const record1 = data1Records.get(id);
      const record2 = data2Records.get(id);
      
      if (record1 && record2) {
        const fieldDifferences = this.compareRecords(record1, record2);
        if (fieldDifferences.length > 0) {
          discrepancies.push(`${id}: ${fieldDifferences.join(', ')}`);
        }
      }
    }
    
    return discrepancies;
  }

  private extractRecordsById(data: any, ids: string[]): Map<string, any> {
    const records = new Map<string, any>();
    
    const traverse = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
        return;
      }
      
      const id = obj.id || obj.edrpou || obj.ipn || obj.tax_id;
      if (id && ids.includes(String(id))) {
        records.set(String(id), obj);
      }
      
      Object.values(obj).forEach(value => traverse(value));
    };
    
    traverse(data);
    
    return records;
  }

  private compareRecords(record1: any, record2: any): string[] {
    const differences: string[] = [];
    
    const allKeys = new Set([...Object.keys(record1), ...Object.keys(record2)]);
    
    for (const key of allKeys) {
      const value1 = record1[key];
      const value2 = record2[key];
      
      if (value1 !== value2) {
        differences.push(`${key} (${JSON.stringify(value1)} vs ${JSON.stringify(value2)})`);
      }
    }
    
    return differences;
  }

  private checkDataConsistency(data: any): { consistent: boolean; inconsistencies: string[] } {
    const inconsistencies: string[] = [];
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, path));
        return;
      }
      
      // Check for logical inconsistencies
      if (obj.status === 'active' && obj.ended_at) {
        inconsistencies.push(`${path || 'root'}: Active entity with end date`);
      }
      
      if (obj.status === 'inactive' && !obj.ended_at && !obj.closed_at) {
        inconsistencies.push(`${path || 'root'}: Inactive entity without end date`);
      }
      
      if (obj.start_date && obj.end_date) {
        const start = new Date(obj.start_date);
        const end = new Date(obj.end_date);
        if (start > end) {
          inconsistencies.push(`${path || 'root'}: Start date > end date`);
        }
      }
      
      for (const [key, value] of Object.entries(obj)) {
        const fieldPath = path ? `${path}.${key}` : key;
        if (typeof value === 'object') {
          traverse(value, fieldPath);
        }
      }
    };
    
    traverse(data);
    
    return {
      consistent: inconsistencies.length === 0,
      inconsistencies
    };
  }

  private checkEntityFields(data: any, context: TestContext): { present: string[]; missing: string[] } {
    const supportedEntities = context.source_config.supported_entities;
    const expectedFields: string[] = [];
    
    if (supportedEntities.includes('COMPANY')) {
      expectedFields.push('name', 'edrpou', 'status');
    }
    
    if (supportedEntities.includes('PERSON')) {
      expectedFields.push('name', 'ipn');
    }
    
    if (supportedEntities.includes('FOP')) {
      expectedFields.push('name', 'edrpou', 'ipn');
    }
    
    const present: string[] = [];
    const missing: string[] = [];
    
    const traverse = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item));
        return;
      }
      
      for (const field of expectedFields) {
        if (field in obj && obj[field] !== null && obj[field] !== undefined) {
          if (!present.includes(field)) {
            present.push(field);
          }
        }
      }
      
      Object.values(obj).forEach(value => traverse(value));
    };
    
    traverse(data);
    
    for (const field of expectedFields) {
      if (!present.includes(field)) {
        missing.push(field);
      }
    }
    
    return { present, missing };
  }

  public static clearComparisonData(): void {
    TEST012_CrossValidation.comparisonData.clear();
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
