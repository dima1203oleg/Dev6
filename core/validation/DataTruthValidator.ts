/**
 * Data Truth Validator
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * RAW→PARSER→NORMALIZER→CANONICAL→ENTITY→DB→API→UI comparison
 */

export interface PipelineStage {
  name: 'RAW' | 'PARSER' | 'NORMALIZER' | 'CANONICAL' | 'ENTITY' | 'DB' | 'API' | 'UI';
  data: any;
  timestamp: string;
  version?: string;
}

export interface TruthComparisonResult {
  field_name: string;
  raw_value: any;
  stages: {
    stage: PipelineStage['name'];
    value: any;
    match_with_previous: boolean;
    transformation?: string;
  }[];
  overall_match: boolean;
  confidence: number;
  issues: string[];
}

export interface TruthValidationReport {
  entity_id: string;
  record_id: string;
  comparisons: TruthComparisonResult[];
  summary: {
    total_fields: number;
    matching_fields: number;
    mismatching_fields: number;
    missing_fields: number;
    overall_truth_score: number;
  };
  timestamp: string;
}

export class DataTruthValidator {
  private pipelineStages: Map<string, PipelineStage[]> = new Map(); // entity_id -> stages

  /**
   * Record a pipeline stage for an entity
   */
  recordStage(entityId: string, stage: PipelineStage): void {
    if (!this.pipelineStages.has(entityId)) {
      this.pipelineStages.set(entityId, []);
    }
    
    const stages = this.pipelineStages.get(entityId)!;
    
    // Remove existing stage if present (replace with new version)
    const existingIndex = stages.findIndex(s => s.name === stage.name);
    if (existingIndex >= 0) {
      stages[existingIndex] = stage;
    } else {
      stages.push(stage);
    }
    
    // Sort stages in pipeline order
    const stageOrder = ['RAW', 'PARSER', 'NORMALIZER', 'CANONICAL', 'ENTITY', 'DB', 'API', 'UI'];
    stages.sort((a, b) => stageOrder.indexOf(a.name) - stageOrder.indexOf(b.name));
  }

  /**
   * Validate truth across pipeline stages for an entity
   */
  validateTruth(entityId: string, recordId: string): TruthValidationReport {
    const stages = this.pipelineStages.get(entityId);
    
    if (!stages || stages.length === 0) {
      return {
        entity_id: entityId,
        record_id: recordId,
        comparisons: [],
        summary: {
          total_fields: 0,
          matching_fields: 0,
          mismatching_fields: 0,
          missing_fields: 0,
          overall_truth_score: 0
        },
        timestamp: new Date().toISOString()
      };
    }

    // Get all field names across all stages
    const allFields = new Set<string>();
    for (const stage of stages) {
      if (stage.data && typeof stage.data === 'object') {
        Object.keys(stage.data).forEach(key => allFields.add(key));
      }
    }

    const comparisons: TruthComparisonResult[] = [];

    for (const fieldName of allFields) {
      const comparison = this.compareField(fieldName, stages);
      comparisons.push(comparison);
    }

    // Calculate summary
    const summary = this.calculateSummary(comparisons);

    return {
      entity_id: entityId,
      record_id: recordId,
      comparisons,
      summary,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Compare a single field across all stages
   */
  private compareField(fieldName: string, stages: PipelineStage[]): TruthComparisonResult {
    const result: TruthComparisonResult = {
      field_name: fieldName,
      raw_value: this.getFieldValue(stages, 'RAW', fieldName),
      stages: [],
      overall_match: true,
      confidence: 1.0,
      issues: []
    };

    let previousValue: any = result.raw_value;
    let matchCount = 0;
    let totalStages = 0;

    for (const stage of stages) {
      const value = this.getFieldValue(stages, stage.name, fieldName);
      const match = this.compareValues(previousValue, value);
      const transformation = this.detectTransformation(previousValue, value);

      result.stages.push({
        stage: stage.name,
        value,
        match_with_previous: match,
        transformation
      });

      if (!match) {
        result.overall_match = false;
        result.issues.push(`Mismatch at ${stage.name}: ${previousValue} → ${value}${transformation ? ` (${transformation})` : ''}`);
      } else {
        matchCount++;
      }

      previousValue = value;
      totalStages++;
    }

    // Calculate confidence based on match ratio
    result.confidence = totalStages > 0 ? matchCount / totalStages : 0;

    return result;
  }

  /**
   * Get field value from a specific stage
   */
  private getFieldValue(stages: PipelineStage[], stageName: PipelineStage['name'], fieldName: string): any {
    const stage = stages.find(s => s.name === stageName);
    if (!stage || !stage.data || typeof stage.data !== 'object') {
      return null;
    }
    return stage.data[fieldName];
  }

  /**
   * Compare two values for equality
   */
  private compareValues(value1: any, value2: any): boolean {
    if (value1 === value2) return true;
    if (value1 === null || value2 === null) return false;
    if (typeof value1 !== typeof value2) return false;

    if (typeof value1 === 'number') {
      return Math.abs(value1 - value2) < 0.0001; // Floating point comparison
    }

    if (typeof value1 === 'string') {
      return value1.toLowerCase() === value2.toLowerCase(); // Case-insensitive comparison
    }

    if (Array.isArray(value1) && Array.isArray(value2)) {
      return JSON.stringify(value1) === JSON.stringify(value2);
    }

    if (typeof value1 === 'object') {
      return JSON.stringify(value1) === JSON.stringify(value2);
    }

    return false;
  }

  /**
   * Detect transformation between two values
   */
  private detectTransformation(value1: any, value2: any): string | undefined {
    if (value1 === value2) return undefined;
    if (value1 === null || value2 === null) return undefined;

    // Case transformations
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      if (value1.toLowerCase() === value2.toLowerCase()) {
        return 'case_normalization';
      }
      if (value1.trim() === value2) {
        return 'trim';
      }
      if (value1 === value2.trim()) {
        return 'trim';
      }
    }

    // Number transformations
    if (typeof value1 === 'string' && typeof value2 === 'number') {
      if (!isNaN(parseFloat(value1)) && parseFloat(value1) === value2) {
        return 'type_conversion';
      }
    }

    // Date transformations
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      const date1 = new Date(value1);
      const date2 = new Date(value2);
      if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
        if (date1.getTime() === date2.getTime()) {
          return 'date_format_normalization';
        }
      }
    }

    // Array transformations
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length === value2.length) {
        return 'array_reordering';
      }
    }

    return 'value_transformation';
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(comparisons: TruthComparisonResult[]): {
    total_fields: number;
    matching_fields: number;
    mismatching_fields: number;
    missing_fields: number;
    overall_truth_score: number;
  } {
    const total_fields = comparisons.length;
    const matching_fields = comparisons.filter(c => c.overall_match).length;
    const mismatching_fields = comparisons.filter(c => !c.overall_match).length;
    const missing_fields = comparisons.filter(c => c.raw_value === null).length;
    const overall_truth_score = total_fields > 0 ? matching_fields / total_fields : 0;

    return {
      total_fields,
      matching_fields,
      mismatching_fields,
      missing_fields,
      overall_truth_score
    };
  }

  /**
   * Validate truth for multiple entities
   */
  validateMultipleTruths(entityIds: string[]): Map<string, TruthValidationReport> {
    const reports = new Map<string, TruthValidationReport>();

    for (const entityId of entityIds) {
      const report = this.validateTruth(entityId, 'unknown');
      reports.set(entityId, report);
    }

    return reports;
  }

  /**
   * Get overall truth statistics across all entities
   */
  getOverallStatistics(): {
    total_entities: number;
    average_truth_score: number;
    entities_with_perfect_truth: number;
    entities_with_truth_issues: number;
  } {
    const entityIds = Array.from(this.pipelineStages.keys());
    const reports = this.validateMultipleTruths(entityIds);

    const total_entities = reports.size;
    const truthScores = Array.from(reports.values()).map(r => r.summary.overall_truth_score);
    const average_truth_score = truthScores.length > 0 
      ? truthScores.reduce((sum, score) => sum + score, 0) / truthScores.length 
      : 0;
    const entities_with_perfect_truth = truthScores.filter(s => s === 1.0).length;
    const entities_with_truth_issues = truthScores.filter(s => s < 1.0).length;

    return {
      total_entities,
      average_truth_score,
      entities_with_perfect_truth,
      entities_with_truth_issues
    };
  }

  /**
   * Clear all pipeline stages
   */
  clear(): void {
    this.pipelineStages.clear();
  }

  /**
   * Get pipeline stages for an entity
   */
  getStages(entityId: string): PipelineStage[] | null {
    return this.pipelineStages.get(entityId) || null;
  }

  /**
   * Export truth validation report as JSON
   */
  exportReport(entityId: string, recordId: string): string {
    const report = this.validateTruth(entityId, recordId);
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export all reports as JSON
   */
  exportAllReports(): string {
    const entityIds = Array.from(this.pipelineStages.keys());
    const reports: TruthValidationReport[] = [];

    for (const entityId of entityIds) {
      reports.push(this.validateTruth(entityId, 'unknown'));
    }

    return JSON.stringify({
      reports,
      summary: this.getOverallStatistics(),
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// Singleton instance
export const dataTruthValidator = new DataTruthValidator();
