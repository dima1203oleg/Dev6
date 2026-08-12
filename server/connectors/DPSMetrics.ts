/**
 * DPS Observability Metrics
 * 
 * Metrics for DPS connector pack observability
 * 
 * Metrics:
 * - dps_requests_total
 * - dps_requests_success_total
 * - dps_requests_failed_total
 * - dps_request_duration_seconds
 * - dps_rate_limit_remaining
 * - dps_circuit_state
 * - dps_upstream_status
 * - dps_records_received
 * - dps_schema_errors
 * - dps_parser_errors
 * - dps_maintenance_events
 */

export interface DPSMetric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export interface DPSMetricsSnapshot {
  requests: {
    total: number;
    success: number;
    failed: number;
    byEndpoint: Record<string, { success: number; failed: number }>;
  };
  duration: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  rateLimit: {
    remaining: number;
    limit: number;
    resetTime: string;
  };
  circuit: {
    state: string;
    failureCount: number;
    successCount: number;
  };
  upstream: {
    status: string;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
  };
  records: {
    received: number;
    byEndpoint: Record<string, number>;
  };
  errors: {
    schema: number;
    parser: number;
    normalization: number;
    entityResolution: number;
    database: number;
  };
  maintenance: {
    events: number;
    inMaintenance: boolean;
    lastDetectedAt: string | null;
    lastRecoveredAt: string | null;
  };
}

export class DPSMetrics {
  private metrics: Map<string, DPSMetric[]> = new Map();
  private durations: number[] = [];
  private snapshot: DPSMetricsSnapshot = {
    requests: {
      total: 0,
      success: 0,
      failed: 0,
      byEndpoint: {}
    },
    duration: {
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0
    },
    rateLimit: {
      remaining: 1000,
      limit: 1000,
      resetTime: ''
    },
    circuit: {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0
    },
    upstream: {
      status: 'UNKNOWN',
      lastSuccessAt: null,
      lastFailureAt: null
    },
    records: {
      received: 0,
      byEndpoint: {}
    },
    errors: {
      schema: 0,
      parser: 0,
      normalization: 0,
      entityResolution: 0,
      database: 0
    },
    maintenance: {
      events: 0,
      inMaintenance: false,
      lastDetectedAt: null,
      lastRecoveredAt: null
    }
  };

  /**
   * Record request start
   */
  recordRequestStart(endpoint: string): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.addMetric('dps_requests_total', 1, { endpoint, status: 'started' });
    return requestId;
  }

  /**
   * Record request success
   */
  recordRequestSuccess(endpoint: string, durationMs: number, recordCount: number = 0): void {
    this.snapshot.requests.total++;
    this.snapshot.requests.success++;
    this.snapshot.requests.byEndpoint[endpoint] = this.snapshot.requests.byEndpoint[endpoint] || { success: 0, failed: 0 };
    this.snapshot.requests.byEndpoint[endpoint].success++;
    
    this.durations.push(durationMs);
    this.updateDurationMetrics();
    
    this.snapshot.records.received += recordCount;
    this.snapshot.records.byEndpoint[endpoint] = (this.snapshot.records.byEndpoint[endpoint] || 0) + recordCount;
    
    this.snapshot.upstream.status = 'OPERATIONAL';
    this.snapshot.upstream.lastSuccessAt = new Date().toISOString();
    
    this.addMetric('dps_requests_success_total', 1, { endpoint });
    this.addMetric('dps_request_duration_seconds', durationMs / 1000, { endpoint });
    this.addMetric('dps_records_received', recordCount, { endpoint });
  }

  /**
   * Record request failure
   */
  recordRequestFailure(endpoint: string, errorType: string, durationMs: number): void {
    this.snapshot.requests.total++;
    this.snapshot.requests.failed++;
    this.snapshot.requests.byEndpoint[endpoint] = this.snapshot.requests.byEndpoint[endpoint] || { success: 0, failed: 0 };
    this.snapshot.requests.byEndpoint[endpoint].failed++;
    
    this.durations.push(durationMs);
    this.updateDurationMetrics();
    
    this.snapshot.upstream.status = errorType;
    this.snapshot.upstream.lastFailureAt = new Date().toISOString();
    
    this.addMetric('dps_requests_failed_total', 1, { endpoint, error_type: errorType });
    this.addMetric('dps_request_duration_seconds', durationMs / 1000, { endpoint, status: 'failed' });
  }

  /**
   * Update duration metrics
   */
  private updateDurationMetrics(): void {
    if (this.durations.length === 0) return;

    const sorted = [...this.durations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    this.snapshot.duration.avg = sum / sorted.length;
    this.snapshot.duration.p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    this.snapshot.duration.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    this.snapshot.duration.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  }

  /**
   * Update rate limit status
   */
  updateRateLimit(remaining: number, limit: number, resetTime: string): void {
    this.snapshot.rateLimit.remaining = remaining;
    this.snapshot.rateLimit.limit = limit;
    this.snapshot.rateLimit.resetTime = resetTime;
    
    this.addMetric('dps_rate_limit_remaining', remaining, { limit: limit.toString() });
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitState(state: string, failureCount: number, successCount: number): void {
    this.snapshot.circuit.state = state;
    this.snapshot.circuit.failureCount = failureCount;
    this.snapshot.circuit.successCount = successCount;
    
    this.addMetric('dps_circuit_state', state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 0.5, { state });
  }

  /**
   * Record schema error
   */
  recordSchemaError(endpoint: string): void {
    this.snapshot.errors.schema++;
    this.addMetric('dps_schema_errors', 1, { endpoint });
  }

  /**
   * Record parser error
   */
  recordParserError(endpoint: string): void {
    this.snapshot.errors.parser++;
    this.addMetric('dps_parser_errors', 1, { endpoint });
  }

  /**
   * Record normalization error
   */
  recordNormalizationError(endpoint: string): void {
    this.snapshot.errors.normalization++;
    this.addMetric('dps_normalization_errors', 1, { endpoint });
  }

  /**
   * Record entity resolution error
   */
  recordEntityResolutionError(endpoint: string): void {
    this.snapshot.errors.entityResolution++;
    this.addMetric('dps_entity_resolution_errors', 1, { endpoint });
  }

  /**
   * Record database error
   */
  recordDatabaseError(endpoint: string): void {
    this.snapshot.errors.database++;
    this.addMetric('dps_database_errors', 1, { endpoint });
  }

  /**
   * Record maintenance event
   */
  recordMaintenanceEvent(event: 'detected' | 'recovered'): void {
    this.snapshot.maintenance.events++;
    
    if (event === 'detected') {
      this.snapshot.maintenance.inMaintenance = true;
      this.snapshot.maintenance.lastDetectedAt = new Date().toISOString();
    } else {
      this.snapshot.maintenance.inMaintenance = false;
      this.snapshot.maintenance.lastRecoveredAt = new Date().toISOString();
    }
    
    this.addMetric('dps_maintenance_events', 1, { event });
    this.addMetric('dps_upstream_status', event === 'detected' ? 0 : 1, { status: event });
  }

  /**
   * Add metric
   */
  private addMetric(name: string, value: number, labels: Record<string, string>): void {
    const metric: DPSMetric = {
      name,
      value,
      labels,
      timestamp: new Date().toISOString()
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);
  }

  /**
   * Get metrics snapshot
   */
  getSnapshot(): DPSMetricsSnapshot {
    return JSON.parse(JSON.stringify(this.snapshot));
  }

  /**
   * Get metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    let output = '';
    
    // Request metrics
    output += `# HELP dps_requests_total Total number of DPS requests\n`;
    output += `# TYPE dps_requests_total counter\n`;
    output += `dps_requests_total ${this.snapshot.requests.total}\n`;
    
    output += `# HELP dps_requests_success_total Total number of successful DPS requests\n`;
    output += `# TYPE dps_requests_success_total counter\n`;
    output += `dps_requests_success_total ${this.snapshot.requests.success}\n`;
    
    output += `# HELP dps_requests_failed_total Total number of failed DPS requests\n`;
    output += `# TYPE dps_requests_failed_total counter\n`;
    output += `dps_requests_failed_total ${this.snapshot.requests.failed}\n`;
    
    // Duration metrics
    output += `# HELP dps_request_duration_seconds Duration of DPS requests in seconds\n`;
    output += `# TYPE dps_request_duration_seconds histogram\n`;
    output += `dps_request_duration_seconds_avg ${this.snapshot.duration.avg}\n`;
    output += `dps_request_duration_seconds_p50 ${this.snapshot.duration.p50}\n`;
    output += `dps_request_duration_seconds_p95 ${this.snapshot.duration.p95}\n`;
    output += `dps_request_duration_seconds_p99 ${this.snapshot.duration.p99}\n`;
    
    // Rate limit metrics
    output += `# HELP dps_rate_limit_remaining Remaining DPS rate limit quota\n`;
    output += `# TYPE dps_rate_limit_remaining gauge\n`;
    output += `dps_rate_limit_remaining ${this.snapshot.rateLimit.remaining}\n`;
    
    // Circuit breaker metrics
    output += `# HELP dps_circuit_state DPS circuit breaker state (0=CLOSED, 0.5=HALF_OPEN, 1=OPEN)\n`;
    output += `# TYPE dps_circuit_state gauge\n`;
    const circuitValue = this.snapshot.circuit.state === 'CLOSED' ? 0 : this.snapshot.circuit.state === 'OPEN' ? 1 : 0.5;
    output += `dps_circuit_state ${circuitValue}\n`;
    
    // Upstream status
    output += `# HELP dps_upstream_status DPS upstream status (0=MAINTENANCE, 1=OPERATIONAL)\n`;
    output += `# TYPE dps_upstream_status gauge\n`;
    const upstreamValue = this.snapshot.maintenance.inMaintenance ? 0 : 1;
    output += `dps_upstream_status ${upstreamValue}\n`;
    
    // Records metrics
    output += `# HELP dps_records_received Total number of records received from DPS\n`;
    output += `# TYPE dps_records_received counter\n`;
    output += `dps_records_received ${this.snapshot.records.received}\n`;
    
    // Error metrics
    output += `# HELP dps_schema_errors Total number of schema validation errors\n`;
    output += `# TYPE dps_schema_errors counter\n`;
    output += `dps_schema_errors ${this.snapshot.errors.schema}\n`;
    
    output += `# HELP dps_parser_errors Total number of parser errors\n`;
    output += `# TYPE dps_parser_errors counter\n`;
    output += `dps_parser_errors ${this.snapshot.errors.parser}\n`;
    
    output += `# HELP dps_maintenance_events Total number of maintenance events\n`;
    output += `# TYPE dps_maintenance_events counter\n`;
    output += `dps_maintenance_events ${this.snapshot.maintenance.events}\n`;
    
    return output;
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics.clear();
    this.durations = [];
    this.snapshot = {
      requests: {
        total: 0,
        success: 0,
        failed: 0,
        byEndpoint: {}
      },
      duration: {
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      rateLimit: {
        remaining: 1000,
        limit: 1000,
        resetTime: ''
      },
      circuit: {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0
      },
      upstream: {
        status: 'UNKNOWN',
        lastSuccessAt: null,
        lastFailureAt: null
      },
      records: {
        received: 0,
        byEndpoint: {}
      },
      errors: {
        schema: 0,
        parser: 0,
        normalization: 0,
        entityResolution: 0,
        database: 0
      },
      maintenance: {
        events: 0,
        inMaintenance: false,
        lastDetectedAt: null,
        lastRecoveredAt: null
      }
    };
  }
}

// Singleton instance
let metricsInstance: DPSMetrics | null = null;

export function getDPSMetrics(): DPSMetrics {
  if (!metricsInstance) {
    metricsInstance = new DPSMetrics();
  }
  return metricsInstance;
}

export function resetDPSMetrics(): void {
  metricsInstance = null;
}
