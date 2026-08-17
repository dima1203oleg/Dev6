/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-001 — Registry Discovery
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult } from '../types';

export class TEST001_RegistryDiscovery extends BaseTest {
  constructor() {
    super('TEST-001', 'Registry Discovery');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const config = context.source_config;
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check Registry ID
      if (!config.source_id || config.source_id.trim() === '') {
        errors.push('Registry ID is missing or empty');
      } else {
        details['registry_id'] = config.source_id;
        // Validate ID format (e.g., UA-001, INT-001, TEST-001)
        const idPattern = /^[A-Z]{2,4}-\d{3,4}$/;
        if (!idPattern.test(config.source_id)) {
          warnings.push(`Registry ID format may be non-standard: ${config.source_id}`);
        }
      }

      // Check Name
      if (!config.source_name || config.source_name.trim() === '') {
        errors.push('Registry name is missing or empty');
      } else {
        details['registry_name'] = config.source_name;
      }

      // Check Endpoint
      if (!config.endpoint_or_resource || config.endpoint_or_resource.trim() === '') {
        errors.push('Endpoint is missing or empty');
      } else {
        details['endpoint'] = config.endpoint_or_resource;
        if (!this.isValidEndpoint(config.endpoint_or_resource)) {
          errors.push(`Invalid endpoint URL: ${config.endpoint_or_resource}`);
        }
      }

      // Check Access Type
      if (!config.access_level || config.access_level.trim() === '') {
        errors.push('Access type is missing or empty');
      } else {
        details['access_type'] = config.access_level;
        const validAccessTypes = ['FREE_AUTO', 'FREE_API_KEY', 'PAID', 'RESTRICTED', 'PRIVATE'];
        if (!validAccessTypes.includes(config.access_level)) {
          warnings.push(`Non-standard access type: ${config.access_level}`);
        }
      }

      // Check Configuration Status
      details['config_status'] = this.checkConfigStatus(config, warnings);
      details['production_ready'] = config.production_ready;

      // Check required fields
      const requiredFields = [
        'connector_id', 'connector_version', 'protocol', 'format', 'encoding',
        'auth_type', 'supported_entities', 'supported_identifiers'
      ];

      for (const field of requiredFields) {
        if (!config[field as keyof typeof config]) {
          errors.push(`Required field '${field}' is missing`);
        } else {
          details[field] = config[field as keyof typeof config];
        }
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private checkConfigStatus(config: any, warnings: string[]): string {
    const missingFields = [];
    const optionalFields = ['rate_limit', 'update_frequency', 'schema_version'];

    for (const field of optionalFields) {
      if (!config[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      warnings.push(`Optional fields missing: ${missingFields.join(', ')}`);
    }

    return missingFields.length === 0 ? 'COMPLETE' : 'PARTIAL';
  }
}
