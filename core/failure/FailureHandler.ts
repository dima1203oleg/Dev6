/**
 * Failure Handler
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Proper error classification (NO_DATA, SOURCE_UNAVAILABLE, AUTH_ERROR, RATE_LIMIT, etc.)
 */

export type FailureStatus = 
  | 'NO_DATA'
  | 'SOURCE_UNAVAILABLE'
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'SCHEMA_DRIFT'
  | 'MAPPING_ERROR'
  | 'NORMALIZATION_ERROR'
  | 'ENTITY_RESOLUTION_ERROR'
  | 'DATABASE_ERROR'
  | 'API_INTEGRATION_ERROR'
  | 'CARD_INTEGRATION_ERROR'
  | 'DATA_TRUTH_FAILURE';

export interface FailureContext {
  run_id?: string;
  dataset_id?: string;
  resource_id?: string;
  record_id?: string;
  entity_id?: string;
  fact_id?: string;
  card_id?: string;
  field_name?: string;
  timestamp: string;
  error_message: string;
  stack_trace?: string;
  metadata?: Record<string, any>;
}

export interface ClassifiedFailure {
  status: FailureStatus;
  context: FailureContext;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actionable: boolean;
  remediation_steps: string[];
  rca: string;
}

export class FailureHandler {
  static classifyError(error: any, context: Partial<FailureContext>): ClassifiedFailure {
    const fullContext: FailureContext = {
      timestamp: new Date().toISOString(),
      error_message: error.message || String(error),
      stack_trace: error.stack,
      ...context
    };

    // HTTP Error Classification
    if (error.response) {
      const status = error.response.status;
      
      if (status === 404) {
        return {
          status: 'SOURCE_UNAVAILABLE',
          context: fullContext,
          severity: 'HIGH',
          actionable: true,
          remediation_steps: [
            'Verify source URL is correct',
            'Check if source has been moved or deleted',
            'Use fallback data source if available',
            'Update source metadata'
          ],
          rca: 'Source returned HTTP 404 - resource not found'
        };
      }
      
      if (status === 401 || status === 403) {
        return {
          status: 'AUTH_ERROR',
          context: fullContext,
          severity: 'CRITICAL',
          actionable: true,
          remediation_steps: [
            'Verify API credentials are valid',
            'Check if API key has expired',
            'Verify permissions for requested resource',
            'Update authentication credentials'
          ],
          rca: `Source returned HTTP ${status} - authentication/authorization failed`
        };
      }
      
      if (status === 429) {
        return {
          status: 'RATE_LIMIT',
          context: fullContext,
          severity: 'HIGH',
          actionable: true,
          remediation_steps: [
            'Implement exponential backoff',
            'Reduce request frequency',
            'Check rate limit headers',
            'Consider caching responses'
          ],
          rca: 'Source returned HTTP 429 - rate limit exceeded'
        };
      }
      
      if (status === 500 || status === 502 || status === 503 || status === 504) {
        return {
          status: 'SOURCE_UNAVAILABLE',
          context: fullContext,
          severity: 'HIGH',
          actionable: true,
          remediation_steps: [
            'Retry with exponential backoff',
            'Check source status page',
            'Use fallback data source if available',
            'Monitor source availability'
          ],
          rca: `Source returned HTTP ${status} - server error`
        };
      }
    }

    // Network Error Classification
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return {
        status: 'SOURCE_UNAVAILABLE',
        context: fullContext,
        severity: 'HIGH',
        actionable: true,
        remediation_steps: [
          'Check network connectivity',
          'Verify DNS resolution',
          'Check if source is down',
          'Use fallback data source if available'
        ],
        rca: `Network error: ${error.code} - source unreachable`
      };
    }

    // Database Error Classification
    if (error.code && error.code.startsWith('23')) {
      return {
        status: 'DATABASE_ERROR',
        context: fullContext,
        severity: 'CRITICAL',
        actionable: true,
        remediation_steps: [
          'Check database connection',
          'Verify database schema',
          'Check for constraint violations',
          'Review database logs'
        ],
        rca: `Database constraint violation: ${error.code}`
      };
    }

    if (error.code === 'ECONNREFUSED' && context.resource_id?.includes('db') || context.dataset_id?.includes('db')) {
      return {
        status: 'DATABASE_ERROR',
        context: fullContext,
        severity: 'CRITICAL',
        actionable: true,
        remediation_steps: [
          'Check database server is running',
          'Verify connection string',
          'Check database credentials',
          'Review database logs'
        ],
        rca: 'Database connection refused'
      };
    }

    // Schema Drift Classification
    if (error.message && error.message.includes('schema') || error.message.includes('column') || error.message.includes('field')) {
      return {
        status: 'SCHEMA_DRIFT',
        context: fullContext,
        severity: 'HIGH',
        actionable: true,
        remediation_steps: [
          'Update schema mapping',
          'Run schema analyzer',
          'Update field mappings',
          'Test with new schema'
        ],
        rca: 'Schema drift detected - field/column mismatch'
      };
    }

    // Mapping Error Classification
    if (error.message && error.message.includes('mapping') || error.message.includes('transform')) {
      return {
        status: 'MAPPING_ERROR',
        context: fullContext,
        severity: 'HIGH',
        actionable: true,
        remediation_steps: [
          'Review mapping configuration',
          'Update field mappings',
          'Test mapping logic',
          'Validate input/output'
        ],
        rca: 'Mapping error - transformation failed'
      };
    }

    // Normalization Error Classification
    if (error.message && error.message.includes('normalize') || error.message.includes('format')) {
      return {
        status: 'NORMALIZATION_ERROR',
        context: fullContext,
        severity: 'MEDIUM',
        actionable: true,
        remediation_steps: [
          'Review normalization rules',
          'Update format patterns',
          'Test normalization logic',
          'Validate input format'
        ],
        rca: 'Normalization error - format conversion failed'
      };
    }

    // Entity Resolution Error Classification
    if (error.message && error.message.includes('entity') || error.message.includes('resolution') || error.message.includes('match')) {
      return {
        status: 'ENTITY_RESOLUTION_ERROR',
        context: fullContext,
        severity: 'MEDIUM',
        actionable: true,
        remediation_steps: [
          'Review entity resolution rules',
          'Update matching algorithms',
          'Check identifier formats',
          'Review confidence thresholds'
        ],
        rca: 'Entity resolution error - matching failed'
      };
    }

    // API Integration Error Classification
    if (error.message && error.message.includes('API') || error.message.includes('endpoint')) {
      return {
        status: 'API_INTEGRATION_ERROR',
        context: fullContext,
        severity: 'HIGH',
        actionable: true,
        remediation_steps: [
          'Verify API endpoint is correct',
          'Check API documentation',
          'Test API endpoint',
          'Review API integration code'
        ],
        rca: 'API integration error - endpoint call failed'
      };
    }

    // Card Integration Error Classification
    if (error.message && error.message.includes('card') || error.message.includes('render')) {
      return {
        status: 'CARD_INTEGRATION_ERROR',
        context: fullContext,
        severity: 'HIGH',
        actionable: true,
        remediation_steps: [
          'Verify card contract',
          'Check card data structure',
          'Review card rendering logic',
          'Test card generation'
        ],
        rca: 'Card integration error - card generation failed'
      };
    }

    // Data Truth Failure Classification
    if (error.message && error.message.includes('truth') || error.message.includes('mismatch') || error.message.includes('validation')) {
      return {
        status: 'DATA_TRUTH_FAILURE',
        context: fullContext,
        severity: 'CRITICAL',
        actionable: true,
        remediation_steps: [
          'Trace data lineage',
          'Verify each transformation step',
          'Check for data corruption',
          'Review transformation logic'
        ],
        rca: 'Data truth failure - value mismatch detected'
      };
    }

    // Empty Result Classification
    if (error.message && error.message.includes('empty') || error.message.includes('no data') || error.message.includes('not found')) {
      return {
        status: 'NO_DATA',
        context: fullContext,
        severity: 'LOW',
        actionable: false,
        remediation_steps: [
          'Verify search parameters',
          'Check if data exists in source',
          'Review source data availability',
          'Document NO_DATA result'
        ],
        rca: 'No data found - legitimate empty result'
      };
    }

    // Default Classification
    return {
      status: 'SOURCE_UNAVAILABLE',
      context: fullContext,
      severity: 'MEDIUM',
      actionable: true,
      remediation_steps: [
        'Review error logs',
        'Check system status',
        'Verify configuration',
        'Contact support if needed'
      ],
      rca: `Unclassified error: ${error.message}`
    };
  }

  static createNoDataFailure(context: Partial<FailureContext>, reason: string): ClassifiedFailure {
    const fullContext: FailureContext = {
      timestamp: new Date().toISOString(),
      error_message: reason,
      ...context
    };

    return {
      status: 'NO_DATA',
      context: fullContext,
      severity: 'LOW',
      actionable: false,
      remediation_steps: [
        'Document NO_DATA result',
        'Verify search parameters',
        'Check if data exists in source'
      ],
      rca: reason
    };
  }

  static createSourceUnavailableFailure(context: Partial<FailureContext>, reason: string): ClassifiedFailure {
    const fullContext: FailureContext = {
      timestamp: new Date().toISOString(),
      error_message: reason,
      ...context
    };

    return {
      status: 'SOURCE_UNAVAILABLE',
      context: fullContext,
      severity: 'HIGH',
      actionable: true,
      remediation_steps: [
        'Check source availability',
        'Use fallback data source if available',
        'Monitor source status',
        'Retry with backoff'
      ],
      rca: reason
    };
  }

  static isRetryable(failure: ClassifiedFailure): boolean {
    const retryableStatuses: FailureStatus[] = [
      'SOURCE_UNAVAILABLE',
      'RATE_LIMIT',
      'DATABASE_ERROR',
      'API_INTEGRATION_ERROR'
    ];
    
    return retryableStatuses.includes(failure.status);
  }

  static getRetryDelay(failure: ClassifiedFailure, attempt: number): number {
    if (failure.status === 'RATE_LIMIT') {
      // Exponential backoff for rate limit
      return Math.min(1000 * Math.pow(2, attempt), 60000);
    }
    
    if (failure.status === 'SOURCE_UNAVAILABLE') {
      // Longer backoff for source unavailability
      return Math.min(5000 * Math.pow(2, attempt), 300000);
    }
    
    // Default backoff
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }
}
