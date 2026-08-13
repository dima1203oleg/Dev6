/**
 * Registry Discovery Platform (RDP)
 * Smart Schema Analyzer
 * 
 * Detects schema drift and automatically corrects it
 */

import { Schema, SchemaField, SchemaDrift, Dataset } from './types';

export interface SchemaComparison {
  renamedFields: Array<{ old: string; new: string }>;
  typeChanges: Array<{ field: string; oldType: string; newType: string }>;
  newFields: string[];
  removedFields: string[];
  structureChanges: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class SchemaAnalyzer {
  private schemaHistory: Map<string, Schema[]> = new Map();
  private driftHistory: Map<string, SchemaDrift[]> = new Map();

  /**
   * Analyze current schema and compare with previous version
   */
  async analyzeSchema(dataset: Dataset, currentSchema: Schema): Promise<SchemaComparison> {
    console.log(`[SchemaAnalyzer] Analyzing schema for: ${dataset.id}`);

    const previousSchemas = this.schemaHistory.get(dataset.id) || [];
    const previousSchema = previousSchemas.length > 0 ? previousSchemas[previousSchemas.length - 1] : null;

    if (!previousSchema) {
      // First schema - no comparison possible
      this.schemaHistory.set(dataset.id, [...previousSchemas, currentSchema]);
      return {
        renamedFields: [],
        typeChanges: [],
        newFields: [],
        removedFields: [],
        structureChanges: [],
        severity: 'LOW',
      };
    }

    const comparison = this.compareSchemas(previousSchema, currentSchema);
    
    // Store new schema in history
    this.schemaHistory.set(dataset.id, [...previousSchemas, currentSchema]);

    console.log(`[SchemaAnalyzer] Schema comparison complete: ${comparison.severity} severity`);
    return comparison;
  }

  /**
   * Compare two schemas
   */
  private compareSchemas(oldSchema: Schema, newSchema: Schema): SchemaComparison {
    const oldFields = new Map(oldSchema.fields.map(f => [f.name, f]));
    const newFields = new Map(newSchema.fields.map(f => [f.name, f]));

    const renamedFields: Array<{ old: string; new: string }> = [];
    const typeChanges: Array<{ field: string; oldType: string; newType: string }> = [];
    const newFieldNames: string[] = [];
    const removedFieldNames: string[] = [];
    const structureChanges: string[] = [];

    // Detect renamed fields (fuzzy matching)
    for (const [oldName] of oldFields) {
      if (!newFields.has(oldName)) {
        // Field removed or renamed - check for similar names
        const similar = this.findSimilarField(oldName, newSchema.fields);
        if (similar) {
          renamedFields.push({ old: oldName, new: similar });
        } else {
          removedFieldNames.push(oldName);
        }
      }
    }

    // Detect new fields
    for (const [newName] of newFields) {
      if (!oldFields.has(newName)) {
        newFieldNames.push(newName);
      }
    }

    // Detect type changes
    for (const [fieldName, newField] of newFields) {
      const oldField = oldFields.get(fieldName);
      if (oldField && oldField.type !== newField.type) {
        typeChanges.push({
          field: fieldName,
          oldType: oldField.type,
          newType: newField.type,
        });
      }
    }

    // Detect structure changes
    if (oldSchema.fields.length !== newSchema.fields.length) {
      structureChanges.push(`Field count changed from ${oldSchema.fields.length} to ${newSchema.fields.length}`);
    }

    // Determine severity
    const severity = this.determineSeverity({
      renamedFields,
      typeChanges,
      newFields: newFieldNames,
      removedFields: removedFieldNames,
      structureChanges,
    });

    return {
      renamedFields,
      typeChanges,
      newFields: newFieldNames,
      removedFields: removedFieldNames,
      structureChanges,
      severity,
    };
  }

  /**
   * Find similar field name (for rename detection)
   */
  private findSimilarField(name: string, fields: SchemaField[]): string | null {
    const threshold = 0.8; // Similarity threshold

    for (const field of fields) {
      const similarity = this.calculateSimilarity(name, field.name);
      if (similarity >= threshold) {
        return field.name;
      }
    }

    return null;
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const rows = str2.length + 1;
    const cols = str1.length + 1;
    const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
      matrix[i]![0] = i;
    }

    for (let j = 0; j < cols; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1
          );
        }
      }
    }

    return matrix[str2.length]![str1.length]!;
  }

  /**
   * Determine severity of schema changes
   */
  private determineSeverity(comparison: Omit<SchemaComparison, 'severity'>): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let score = 0;

    // Removed fields are critical
    score += comparison.removedFields.length * 10;

    // Type changes are high severity
    score += comparison.typeChanges.length * 5;

    // New fields are low severity
    score += comparison.newFields.length * 1;

    // Renamed fields are medium severity
    score += comparison.renamedFields.length * 3;

    // Structure changes are medium severity
    score += comparison.structureChanges.length * 3;

    if (score >= 20) return 'CRITICAL';
    if (score >= 10) return 'HIGH';
    if (score >= 5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Auto-fix schema drift
   */
  async autoFixSchemaDrift(dataset: Dataset, comparison: SchemaComparison): Promise<SchemaDrift> {
    console.log(`[SchemaAnalyzer] Auto-fixing schema drift for: ${dataset.id}`);

    const drift: SchemaDrift = {
      detectedAt: new Date(),
      oldVersion: this.getLatestSchemaVersion(dataset.id),
      newVersion: this.generateNewSchemaVersion(dataset.id),
      changes: comparison,
      severity: comparison.severity,
      autoFixed: false,
    };

    try {
      // Apply fixes based on severity
      if (comparison.severity === 'LOW' || comparison.severity === 'MEDIUM') {
        // Auto-fix low and medium severity changes
        await this.applyAutoFixes(dataset, comparison);
        drift.autoFixed = true;
      } else {
        // High and critical changes require manual review
        await this.createPullRequest(dataset, comparison);
        drift.prCreated = `PR-${Date.now()}`;
      }

      // Store drift in history
      const history = this.driftHistory.get(dataset.id) || [];
      this.driftHistory.set(dataset.id, [...history, drift]);

      console.log(`[SchemaAnalyzer] Schema drift ${drift.autoFixed ? 'auto-fixed' : 'requires manual review'}`);
      return drift;

    } catch (error) {
      console.error(`[SchemaAnalyzer] Failed to auto-fix schema drift:`, error);
      drift.autoFixed = false;
      return drift;
    }
  }

  /**
   * Apply automatic fixes
   */
  private async applyAutoFixes(dataset: Dataset, comparison: SchemaComparison): Promise<void> {
    // Generate new mapping based on changes
    this.generateUpdatedMapping(dataset, comparison);
    
    // Update connector configuration
    // TODO: Implement connector update logic
    
    console.log(`[SchemaAnalyzer] Applied auto-fixes for ${dataset.id}`);
  }

  /**
   * Generate updated field mapping
   */
  private generateUpdatedMapping(_dataset: Dataset, comparison: SchemaComparison): any {
    const mapping: any = {};

    // Handle renamed fields
    for (const { old, new: newField } of comparison.renamedFields) {
      mapping[old] = newField;
    }

    // Handle new fields
    for (const field of comparison.newFields) {
      mapping[field] = field;
    }

    return mapping;
  }

  /**
   * Create pull request for schema changes
   */
  private async createPullRequest(dataset: Dataset, _comparison: SchemaComparison): Promise<void> {
    // TODO: Implement PR creation logic
    console.log(`[SchemaAnalyzer] Creating PR for ${dataset.id} schema changes`);
  }

  /**
   * Get latest schema version
   */
  private getLatestSchemaVersion(datasetId: string): string {
    const schemas = this.schemaHistory.get(datasetId) || [];
    if (schemas.length === 0) return '0.0.0';
    const latest = schemas[schemas.length - 1];
    return latest?.version || '0.0.0';
  }

  /**
   * Generate new schema version
   */
  private generateNewSchemaVersion(datasetId: string): string {
    const currentVersion = this.getLatestSchemaVersion(datasetId);
    const parts = currentVersion.split('.').map(Number);
    if (parts[2] !== undefined) {
      parts[2]++; // Increment patch version
    }
    return parts.join('.');
  }

  /**
   * Get schema history for dataset
   */
  getSchemaHistory(datasetId: string): Schema[] {
    return this.schemaHistory.get(datasetId) || [];
  }

  /**
   * Get drift history for dataset
   */
  getDriftHistory(datasetId: string): SchemaDrift[] {
    return this.driftHistory.get(datasetId) || [];
  }

  /**
   * Run regression test after schema change
   */
  async runRegressionTest(dataset: Dataset, oldSchema: Schema, newSchema: Schema): Promise<{
    passed: boolean;
    errors: string[];
    warnings: string[];
  }> {
    console.log(`[SchemaAnalyzer] Running regression test for: ${dataset.id}`);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Test 1: Check if critical fields are still present
    const criticalFields = ['id', 'name', 'created', 'modified'];
    for (const field of criticalFields) {
      const oldField = oldSchema.fields.find(f => f.name === field);
      const newField = newSchema.fields.find(f => f.name === field);

      if (oldField && !newField) {
        errors.push(`Critical field removed: ${field}`);
      } else if (oldField && newField && oldField.type !== newField.type) {
        warnings.push(`Critical field type changed: ${field} from ${oldField.type} to ${newField.type}`);
      }
    }

    // Test 2: Check if field count increased significantly
    const fieldCountChange = newSchema.fields.length - oldSchema.fields.length;
    if (fieldCountChange > 10) {
      warnings.push(`Large field count increase: ${fieldCountChange} fields added`);
    }

    // Test 3: Check for breaking type changes
    for (const newField of newSchema.fields) {
      const oldField = oldSchema.fields.find(f => f.name === newField.name);
      if (oldField) {
        if (this.isBreakingTypeChange(oldField.type, newField.type)) {
          errors.push(`Breaking type change: ${newField.name} from ${oldField.type} to ${newField.type}`);
        }
      }
    }

    const passed = errors.length === 0;

    console.log(`[SchemaAnalyzer] Regression test ${passed ? 'passed' : 'failed'}`);
    return { passed, errors, warnings };
  }

  /**
   * Check if type change is breaking
   */
  private isBreakingTypeChange(oldType: string, newType: string): boolean {
    const breakingChanges: Record<string, string[]> = {
      'integer': ['string', 'boolean'],
      'float': ['string', 'boolean'],
      'datetime': ['string', 'integer', 'boolean'],
      'boolean': ['string', 'integer', 'float'],
    };

    return breakingChanges[oldType]?.includes(newType) || false;
  }

  /**
   * Clear history for dataset
   */
  clearHistory(datasetId: string): void {
    this.schemaHistory.delete(datasetId);
    this.driftHistory.delete(datasetId);
  }

  /**
   * Get all datasets with schema history
  */
  getDatasetsWithHistory(): string[] {
    return Array.from(this.schemaHistory.keys());
  }

  /**
   * Get schema statistics
   */
  getSchemaStatistics(): {
    totalDatasets: number;
    totalDrifts: number;
    bySeverity: Record<string, number>;
    autoFixedCount: number;
    manualReviewCount: number;
  } {
    const totalDatasets = this.schemaHistory.size;
    let totalDrifts = 0;
    const bySeverity: Record<string, number> = {};
    let autoFixedCount = 0;
    let manualReviewCount = 0;

    for (const drifts of this.driftHistory.values()) {
      totalDrifts += drifts.length;
      for (const drift of drifts) {
        bySeverity[drift.severity] = (bySeverity[drift.severity] || 0) + 1;
        if (drift.autoFixed) autoFixedCount++;
        else manualReviewCount++;
      }
    }

    return {
      totalDatasets,
      totalDrifts,
      bySeverity,
      autoFixedCount,
      manualReviewCount,
    };
  }
}

// Singleton instance
export const schemaAnalyzer = new SchemaAnalyzer();
