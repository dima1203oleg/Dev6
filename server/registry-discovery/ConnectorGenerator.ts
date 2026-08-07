/**
 * Registry Discovery Platform (RDP)
 * Automatic Connector Generator
 * 
 * Automatically builds connectors, transformers, normalizers, and mappings
 * without manual programming
 */

import { Dataset, Schema, ConnectorConfig, Transformation, FieldMapping, ScheduleConfig } from './types';
import { ScanResult } from './DatasetScanner';

export interface GeneratedConnector {
  connector: ConnectorConfig;
  transformer: string;
  normalizer: string;
  mapping: FieldMapping[];
  validationRules: any[];
  status: 'GENERATED' | 'TESTED' | 'DEPLOYED' | 'ERROR';
  generatedAt: Date;
}

export class ConnectorGenerator {
  private connectorRegistry: Map<string, ConnectorConfig> = new Map();
  private generatedConnectors: Map<string, GeneratedConnector> = new Map();

  /**
   * Generate connector from dataset and scan result
   */
  async generateConnector(dataset: Dataset, scanResult: ScanResult): Promise<GeneratedConnector> {
    console.log(`[ConnectorGenerator] Generating connector for: ${dataset.id}`);

    const connectorId = `connector-${dataset.catalogId}-${dataset.id}`;
    
    try {
      // Build connector configuration
      const connector = this.buildConnectorConfig(dataset, scanResult, connectorId);
      
      // Generate transformer code
      const transformer = this.generateTransformer(dataset, scanResult);
      
      // Generate normalizer code
      const normalizer = this.generateNormalizer(dataset, scanResult);
      
      // Generate field mappings
      const mapping = this.generateMapping(dataset, scanResult);
      
      // Generate validation rules
      const validationRules = this.generateValidationRules(dataset, scanResult);

      const generated: GeneratedConnector = {
        connector,
        transformer,
        normalizer,
        mapping,
        validationRules,
        status: 'GENERATED',
        generatedAt: new Date(),
      };

      this.generatedConnectors.set(connectorId, generated);
      this.connectorRegistry.set(connectorId, connector);

      console.log(`[ConnectorGenerator] Connector generated: ${connectorId}`);
      return generated;

    } catch (error) {
      console.error(`[ConnectorGenerator] Failed to generate connector:`, error);
      throw error;
    }
  }

  /**
   * Build connector configuration
   */
  private buildConnectorConfig(dataset: Dataset, scanResult: ScanResult, connectorId: string): ConnectorConfig {
    const config: ConnectorConfig = {
      id: connectorId,
      registryId: dataset.id,
      name: `${dataset.title} Connector`,
      type: this.determineConnectorType(dataset, scanResult),
      baseUrl: dataset.url,
      endpoint: this.determineEndpoint(dataset, scanResult),
      authentication: this.determineAuthentication(dataset),
      pagination: this.determinePagination(dataset, scanResult),
      filters: this.determineFilters(dataset),
      transformations: this.determineTransformations(dataset, scanResult),
      mapping: [], // Will be filled separately
      schedule: this.determineSchedule(dataset),
      status: 'ACTIVE',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return config;
  }

  /**
   * Determine connector type
   */
  private determineConnectorType(dataset: Dataset, scanResult: ScanResult): 'CKAN' | 'REST' | 'SOAP' | 'FILE' | 'DATABASE' {
    if (scanResult.hasDataStore) return 'CKAN';
    if (dataset.resourceType === 'api') return 'REST';
    if (dataset.format === 'DUMP') return 'FILE';
    return 'REST';
  }

  /**
   * Determine endpoint
   */
  private determineEndpoint(dataset: Dataset, scanResult: ScanResult): string | undefined {
    if (scanResult.hasDataStore) {
      return `/api/3/action/datastore_search`;
    }
    return undefined;
  }

  /**
   * Determine authentication
   */
  private determineAuthentication(dataset: Dataset): any {
    // Most public registries don't require authentication
    return {
      type: 'NONE',
    };
  }

  /**
   * Determine pagination strategy
   */
  private determinePagination(dataset: Dataset, scanResult: ScanResult): any {
    if (scanResult.hasDataStore) {
      return {
        type: 'LIMIT_OFFSET',
        limitParam: 'limit',
        offsetParam: 'offset',
        maxLimit: 10000,
      };
    }
    return {
      type: 'NONE',
    };
  }

  /**
   * Determine filters
   */
  private determineFilters(dataset: Dataset): any {
    return {};
  }

  /**
   * Determine transformations
   */
  private determineTransformations(dataset: Dataset, scanResult: ScanResult): Transformation[] {
    const transformations: Transformation[] = [];

    // Add type casting transformations based on schema
    if (scanResult.schema) {
      for (const field of scanResult.schema.fields) {
        if (field.type !== 'string') {
          transformations.push({
            type: 'TYPE_CAST',
            field: field.name,
            config: { targetType: field.type },
          });
        }
      }
    }

    return transformations;
  }

  /**
   * Determine schedule
   */
  private determineSchedule(dataset: Dataset): ScheduleConfig {
    // Default to daily for most registries
    return {
      enabled: true,
      frequency: 'DAILY',
      timezone: 'Europe/Kiev',
    };
  }

  /**
   * Generate transformer code
   */
  private generateTransformer(dataset: Dataset, scanResult: ScanResult): string {
    const code = `
/**
 * Auto-generated transformer for ${dataset.title}
 * Generated at: ${new Date().toISOString()}
 */

export function transformRecord(record: any): any {
  const transformed = { ...record };

  // Apply transformations
  ${this.generateTransformationCode(dataset, scanResult)}

  return transformed;
}

export function transformBatch(records: any[]): any[] {
  return records.map(transformRecord);
}
`;

    return code;
  }

  /**
   * Generate transformation code
   */
  private generateTransformationCode(dataset: Dataset, scanResult: ScanResult): string {
    const code: string[] = [];

    if (scanResult.schema) {
      for (const field of scanResult.schema.fields) {
        if (field.type === 'integer') {
          code.push(`  if (transformed.${field.name} !== undefined) {`);
          code.push(`    transformed.${field.name} = parseInt(transformed.${field.name}, 10);`);
          code.push(`  }`);
        } else if (field.type === 'float' || field.type === 'decimal') {
          code.push(`  if (transformed.${field.name} !== undefined) {`);
          code.push(`    transformed.${field.name} = parseFloat(transformed.${field.name});`);
          code.push(`  }`);
        } else if (field.type === 'datetime') {
          code.push(`  if (transformed.${field.name} !== undefined) {`);
          code.push(`    transformed.${field.name} = new Date(transformed.${field.name});`);
          code.push(`  }`);
        }
      }
    }

    return code.join('\n');
  }

  /**
   * Generate normalizer code
   */
  private generateNormalizer(dataset: Dataset, scanResult: ScanResult): string {
    const code = `
/**
 * Auto-generated normalizer for ${dataset.title}
 * Generated at: ${new Date().toISOString()}
 */

export function normalizeRecord(record: any): any {
  const normalized = { ...record };

  // Normalize field names
  ${this.generateNormalizationCode(dataset, scanResult)}

  // Remove null/undefined values
  Object.keys(normalized).forEach(key => {
    if (normalized[key] === null || normalized[key] === undefined) {
      delete normalized[key];
    }
  });

  return normalized;
}

export function normalizeBatch(records: any[]): any[] {
  return records.map(normalizeRecord);
}
`;

    return code;
  }

  /**
   * Generate normalization code
   */
  private generateNormalizationCode(dataset: Dataset, scanResult: ScanResult): string {
    const code: string[] = [];

    if (scanResult.schema) {
      for (const field of scanResult.schema.fields) {
        // Convert to camelCase
        const camelCase = this.toCamelCase(field.name);
        if (camelCase !== field.name) {
          code.push(`  if (normalized.${field.name} !== undefined) {`);
          code.push(`    normalized.${camelCase} = normalized.${field.name};`);
          code.push(`    delete normalized.${field.name};`);
          code.push(`  }`);
        }

        // Trim strings
        if (field.type === 'string') {
          code.push(`  if (typeof normalized.${field.name} === 'string') {`);
          code.push(`    normalized.${field.name} = normalized.${field.name}.trim();`);
          code.push(`  }`);
        }
      }
    }

    return code.join('\n');
  }

  /**
   * Convert to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, c => c.toLowerCase());
  }

  /**
   * Generate field mappings
   */
  private generateMapping(dataset: Dataset, scanResult: ScanResult): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    if (scanResult.schema) {
      for (const field of scanResult.schema.fields) {
        const targetField = this.toCamelCase(field.name);
        
        mappings.push({
          sourceField: field.name,
          targetField,
          transformation: {
            type: 'RENAME',
            field: field.name,
            target: targetField,
          },
          required: !field.nullable,
          default: field.type === 'string' ? '' : null,
        });
      }
    }

    return mappings;
  }

  /**
   * Generate validation rules
   */
  private generateValidationRules(dataset: Dataset, scanResult: ScanResult): any[] {
    const rules: any[] = [];

    if (scanResult.schema) {
      for (const field of scanResult.schema.fields) {
        const rule: any = {
          field: field.name,
          type: field.type,
          nullable: field.nullable,
        };

        if (field.type === 'string') {
          rule.maxLength = 1000;
        } else if (field.type === 'integer') {
          rule.min = -2147483648;
          rule.max = 2147483647;
        } else if (field.type === 'float') {
          rule.min = -3.4028235e38;
          rule.max = 3.4028235e38;
        }

        rules.push(rule);
      }
    }

    return rules;
  }

  /**
   * Batch generate connectors
   */
  async generateBatch(datasets: Dataset[], scanResults: ScanResult[]): Promise<GeneratedConnector[]> {
    console.log(`[ConnectorGenerator] Batch generating ${datasets.length} connectors`);

    const generated: GeneratedConnector[] = [];
    const scanMap = new Map(scanResults.map(s => [s.dataset.id, s]));

    for (const dataset of datasets) {
      const scanResult = scanMap.get(dataset.id);
      if (!scanResult) {
        console.warn(`[ConnectorGenerator] No scan result for dataset: ${dataset.id}`);
        continue;
      }

      try {
        const connector = await this.generateConnector(dataset, scanResult);
        generated.push(connector);
      } catch (error) {
        console.error(`[ConnectorGenerator] Failed to generate connector for ${dataset.id}:`, error);
      }
    }

    console.log(`[ConnectorGenerator] Batch generation complete: ${generated.length}/${datasets.length} successful`);
    return generated;
  }

  /**
   * Get generated connector
   */
  getConnector(connectorId: string): GeneratedConnector | undefined {
    return this.generatedConnectors.get(connectorId);
  }

  /**
   * Get all generated connectors
   */
  getAllConnectors(): GeneratedConnector[] {
    return Array.from(this.generatedConnectors.values());
  }

  /**
   * Update connector status
   */
  updateConnectorStatus(connectorId: string, status: GeneratedConnector['status']): void {
    const connector = this.generatedConnectors.get(connectorId);
    if (connector) {
      connector.status = status;
    }
  }

  /**
   * Export connector to file
   */
  exportConnector(connectorId: string): string {
    const connector = this.generatedConnectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    return JSON.stringify(connector, null, 2);
  }

  /**
   * Import connector from file
   */
  importConnector(data: string): GeneratedConnector {
    const connector = JSON.parse(data) as GeneratedConnector;
    this.generatedConnectors.set(connector.connector.id, connector);
    this.connectorRegistry.set(connector.connector.id, connector.connector);
    return connector;
  }

  /**
   * Get connector registry
   */
  getConnectorRegistry(): ConnectorConfig[] {
    return Array.from(this.connectorRegistry.values());
  }
}

// Singleton instance
export const connectorGenerator = new ConnectorGenerator();
