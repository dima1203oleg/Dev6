/**
 * Data Truth Validation Engine
 * 
 * Verifies that values are preserved through the pipeline:
 * RAW → PARSER → NORMALIZED → CANONICAL → DATABASE → API → UI
 */

export interface PipelineStage {
  name: string;
  value: any;
  timestamp: string;
}

export interface TruthValidationResult {
  field: string;
  pipeline_stages: PipelineStage[];
  status: 'PASS' | 'DATA_TRUTH_FAILURE' | 'INCOMPLETE';
  consistency_score: number;
  mismatches: {
    stage1: string;
    stage2: string;
    expected: any;
    actual: any;
  }[];
  errors: string[];
}

export class DataTruthValidationEngine {
  /**
   * Validate truth for a single field through pipeline stages
   */
  validateField(
    field: string,
    rawValue: any,
    normalizedValue: any,
    canonicalValue: any,
    databaseValue: any = 'PENDING_DB_INTEGRATION',
    apiValue: any = 'PENDING_API_INTEGRATION',
    uiValue: any = 'PENDING_UI_INTEGRATION'
  ): TruthValidationResult {
    console.log(`[DataTruthValidation] Validating field: ${field}`);

    const stages: PipelineStage[] = [
      { name: 'RAW', value: rawValue, timestamp: new Date().toISOString() },
      { name: 'NORMALIZED', value: normalizedValue, timestamp: new Date().toISOString() },
      { name: 'CANONICAL', value: canonicalValue, timestamp: new Date().toISOString() },
      { name: 'DATABASE', value: databaseValue, timestamp: new Date().toISOString() },
      { name: 'API', value: apiValue, timestamp: new Date().toISOString() },
      { name: 'UI', value: uiValue, timestamp: new Date().toISOString() },
    ];

    const mismatches: {
      stage1: string;
      stage2: string;
      expected: any;
      actual: any;
    }[] = [];
    const errors: string[] = [];

    // Compare RAW → NORMALIZED
    if (!this.valuesMatch(rawValue, normalizedValue)) {
      mismatches.push({
        stage1: 'RAW',
        stage2: 'NORMALIZED',
        expected: rawValue,
        actual: normalizedValue,
      });
      errors.push(`Value changed from RAW to NORMALIZED`);
    }

    // Compare NORMALIZED → CANONICAL
    if (!this.valuesMatch(normalizedValue, canonicalValue)) {
      mismatches.push({
        stage1: 'NORMALIZED',
        stage2: 'CANONICAL',
        expected: normalizedValue,
        actual: canonicalValue,
      });
      errors.push(`Value changed from NORMALIZED to CANONICAL`);
    }

    // Compare CANONICAL → DATABASE
    if (databaseValue !== 'PENDING_DB_INTEGRATION' && !this.valuesMatch(canonicalValue, databaseValue)) {
      mismatches.push({
        stage1: 'CANONICAL',
        stage2: 'DATABASE',
        expected: canonicalValue,
        actual: databaseValue,
      });
      errors.push(`Value changed from CANONICAL to DATABASE`);
    }

    // Compare DATABASE → API
    if (apiValue !== 'PENDING_API_INTEGRATION' && !this.valuesMatch(databaseValue, apiValue)) {
      mismatches.push({
        stage1: 'DATABASE',
        stage2: 'API',
        expected: databaseValue,
        actual: apiValue,
      });
      errors.push(`Value changed from DATABASE to API`);
    }

    // Compare API → UI
    if (uiValue !== 'PENDING_UI_INTEGRATION' && !this.valuesMatch(apiValue, uiValue)) {
      mismatches.push({
        stage1: 'API',
        stage2: 'UI',
        expected: apiValue,
        actual: uiValue,
      });
      errors.push(`Value changed from API to UI`);
    }

    // Determine status
    let status: 'PASS' | 'DATA_TRUTH_FAILURE' | 'INCOMPLETE';
    if (mismatches.length > 0) {
      status = 'DATA_TRUTH_FAILURE';
    } else if (databaseValue === 'PENDING_DB_INTEGRATION' || apiValue === 'PENDING_API_INTEGRATION' || uiValue === 'PENDING_UI_INTEGRATION') {
      status = 'INCOMPLETE';
    } else {
      status = 'PASS';
    }

    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(stages, mismatches);

    console.log(`[DataTruthValidation] Result: ${status} (consistency: ${consistencyScore}%)`);

    return {
      field,
      pipeline_stages: stages,
      status,
      consistency_score: consistencyScore,
      mismatches,
      errors,
    };
  }

  /**
   * Validate multiple fields
   */
  validateFields(data: {
    [field: string]: {
      raw: any;
      normalized: any;
      canonical: any;
      database?: any;
      api?: any;
      ui?: any;
    };
  }): TruthValidationResult[] {
    const results: TruthValidationResult[] = [];

    for (const [field, values] of Object.entries(data)) {
      const result = this.validateField(
        field,
        values.raw,
        values.normalized,
        values.canonical,
        values.database,
        values.api,
        values.ui
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Check if two values match
   */
  private valuesMatch(value1: any, value2: any): boolean {
    // Handle null/undefined
    if (value1 === null || value1 === undefined) {
      return value2 === null || value2 === undefined;
    }
    if (value2 === null || value2 === undefined) {
      return false;
    }

    // Handle strings (normalize whitespace and case for comparison)
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.trim().toLowerCase() === value2.trim().toLowerCase();
    }

    // Handle numbers
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return Math.abs(value1 - value2) < 0.0001;
    }

    // Handle booleans
    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
      return value1 === value2;
    }

    // Handle arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) return false;
      return value1.every((v, i) => this.valuesMatch(v, value2[i]));
    }

    // Handle objects
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const keys1 = Object.keys(value1);
      const keys2 = Object.keys(value2);
      if (keys1.length !== keys2.length) return false;
      return keys1.every(key => this.valuesMatch(value1[key], value2[key]));
    }

    // Direct comparison for other types
    return value1 === value2;
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(stages: PipelineStage[], mismatches: any[]): number {
    if (stages.length === 0) return 0;

    const totalComparisons = stages.length - 1;
    if (totalComparisons === 0) return 100;

    const successfulComparisons = totalComparisons - mismatches.length;
    return Math.round((successfulComparisons / totalComparisons) * 100);
  }

  /**
   * Get overall validation summary
   */
  getSummary(results: TruthValidationResult[]): {
    total: number;
    passed: number;
    failed: number;
    incomplete: number;
    overall_status: 'PASS' | 'DATA_TRUTH_FAILURE' | 'INCOMPLETE';
    average_consistency: number;
  } {
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'DATA_TRUTH_FAILURE').length;
    const incomplete = results.filter(r => r.status === 'INCOMPLETE').length;

    const averageConsistency = total > 0
      ? Math.round(results.reduce((sum, r) => sum + r.consistency_score, 0) / total)
      : 0;

    let overallStatus: 'PASS' | 'DATA_TRUTH_FAILURE' | 'INCOMPLETE';
    if (failed > 0) {
      overallStatus = 'DATA_TRUTH_FAILURE';
    } else if (incomplete > 0) {
      overallStatus = 'INCOMPLETE';
    } else {
      overallStatus = 'PASS';
    }

    return {
      total,
      passed,
      failed,
      incomplete,
      overall_status: overallStatus,
      average_consistency: averageConsistency,
    };
  }
}
