/**
 * MASTER PRODUCTION BATTLEFIELD SPECIFICATION v5.0
 * PREDATOR Analytics - Autonomous Production Certification & Continuous Validation Framework
 * 
 * SLO/SLA Compliance Engine
 * 
 * Continuously monitors:
 * - Availability
 * - Latency
 * - Error Budget
 * - MTTR (Mean Time To Recovery)
 * - MTBF (Mean Time Between Failures)
 * - Freshness
 * - Data Delay
 * 
 * If any SLO is violated, certification is automatically revoked until revalidation.
 */

export interface SLODefinition {
  id: string;
  name: string;
  description: string;
  target: number; // percentage or value
  window: string; // e.g., "24h", "7d", "30d"
  measurement: 'AVAILABILITY' | 'LATENCY' | 'ERROR_RATE' | 'ERROR_BUDGET' | 'MTTR' | 'MTBF' | 'FRESHNESS' | 'DATA_DELAY';
  unit: 'percent' | 'ms' | 'seconds' | 'hours' | 'count';
  critical: boolean;
}

export interface SLOMeasurement {
  sloId: string;
  timestamp: string;
  value: number;
  target: number;
  compliant: boolean;
  windowStart: string;
  windowEnd: string;
}

export interface SLOStatus {
  sloId: string;
  name: string;
  current: number;
  target: number;
  compliant: boolean;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  window: string;
  lastMeasurement: string;
}

export interface SLAViolation {
  violationId: string;
  sloId: string;
  sloName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  value: number;
  target: number;
  deviation: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  certificationRevoked: boolean;
}

export class SLOComplianceEngine {
  private sloDefinitions: Map<string, SLODefinition> = new Map();
  private measurements: Map<string, SLOMeasurement[]> = new Map();
  private violations: Map<string, SLAViolation> = new Map();
  private certificationStatus: 'VALID' | 'REVOKED' = 'VALID';

  constructor() {
    this.initializeDefaultSLOs();
  }

  /**
   * Initialize default SLO definitions
   */
  private initializeDefaultSLOs(): void {
    const defaultSLOs: SLODefinition[] = [
      {
        id: 'slo-availability',
        name: 'System Availability',
        description: 'Overall system availability',
        target: 99.95,
        window: '30d',
        measurement: 'AVAILABILITY',
        unit: 'percent',
        critical: true
      },
      {
        id: 'slo-latency-p95',
        name: 'P95 Latency',
        description: '95th percentile response time',
        target: 500,
        window: '24h',
        measurement: 'LATENCY',
        unit: 'ms',
        critical: true
      },
      {
        id: 'slo-error-rate',
        name: 'Error Rate',
        description: 'Percentage of failed requests',
        target: 1.0,
        window: '24h',
        measurement: 'ERROR_RATE',
        unit: 'percent',
        critical: true
      },
      {
        id: 'slo-mttr',
        name: 'Mean Time To Recovery',
        description: 'Average time to recover from failures',
        target: 60,
        window: '30d',
        measurement: 'MTTR',
        unit: 'minutes',
        critical: true
      },
      {
        id: 'slo-data-freshness',
        name: 'Data Freshness',
        description: 'Maximum age of data from registries',
        target: 24,
        window: '24h',
        measurement: 'FRESHNESS',
        unit: 'hours',
        critical: false
      },
      {
        id: 'slo-data-delay',
        name: 'Data Processing Delay',
        description: 'Time from data ingestion to availability',
        target: 300,
        window: '1h',
        measurement: 'DATA_DELAY',
        unit: 'seconds',
        critical: false
      }
    ];

    for (const slo of defaultSLOs) {
      this.sloDefinitions.set(slo.id, slo);
      this.measurements.set(slo.id, []);
    }

    console.log(`[SLO ENGINE] Initialized ${defaultSLOs.length} SLO definitions`);
  }

  /**
   * Record SLO measurement
   */
  recordMeasurement(sloId: string, value: number, windowStart: string, windowEnd: string): void {
    const slo = this.sloDefinitions.get(sloId);
    if (!slo) {
      throw new Error(`SLO not found: ${sloId}`);
    }

    const compliant = this.isCompliant(slo, value);

    const measurement: SLOMeasurement = {
      sloId,
      timestamp: new Date().toISOString(),
      value,
      target: slo.target,
      compliant,
      windowStart,
      windowEnd
    };

    const measurements = this.measurements.get(sloId) || [];
    measurements.push(measurement);
    
    // Keep only last 100 measurements per SLO
    if (measurements.length > 100) {
      measurements.shift();
    }
    
    this.measurements.set(sloId, measurements);

    // Check for violation
    if (!compliant && slo.critical) {
      this.recordViolation(slo, value);
    }

    console.log(`[SLO ENGINE] Measurement recorded: ${sloId} = ${value} ${slo.unit} (${compliant ? 'COMPLIANT' : 'VIOLATION'})`);
  }

  /**
   * Check if measurement is compliant with SLO
   */
  private isCompliant(slo: SLODefinition, value: number): boolean {
    switch (slo.measurement) {
      case 'AVAILABILITY':
      case 'ERROR_RATE':
        return value >= slo.target;
      case 'LATENCY':
      case 'MTTR':
      case 'FRESHNESS':
      case 'DATA_DELAY':
        return value <= slo.target;
      default:
        return true;
    }
  }

  /**
   * Record SLO violation
   */
  private recordViolation(slo: SLODefinition, value: number): void {
    const violationId = this.generateViolationId();
    const deviation = this.calculateDeviation(slo, value);
    const severity = this.determineSeverity(slo, deviation);

    const violation: SLAViolation = {
      violationId,
      sloId: slo.id,
      sloName: slo.name,
      severity,
      value,
      target: slo.target,
      deviation,
      timestamp: new Date().toISOString(),
      resolved: false,
      certificationRevoked: slo.critical
    };

    this.violations.set(violationId, violation);

    if (slo.critical) {
      this.revokeCertification();
      console.error(`[SLO ENGINE] CRITICAL SLO VIOLATION: ${slo.name} - Certification REVOKED`);
    } else {
      console.warn(`[SLO ENGINE] SLO violation: ${slo.name} - ${severity}`);
    }
  }

  /**
   * Calculate deviation from target
   */
  private calculateDeviation(slo: SLODefinition, value: number): number {
    switch (slo.measurement) {
      case 'AVAILABILITY':
      case 'ERROR_RATE':
        return slo.target - value;
      case 'LATENCY':
      case 'MTTR':
      case 'FRESHNESS':
      case 'DATA_DELAY':
        return value - slo.target;
      default:
        return 0;
    }
  }

  /**
   * Determine violation severity
   */
  private determineSeverity(slo: SLODefinition, deviation: number): SLAViolation['severity'] {
    const relativeDeviation = Math.abs(deviation / slo.target);
    
    if (relativeDeviation > 0.5) return 'CRITICAL';
    if (relativeDeviation > 0.25) return 'HIGH';
    if (relativeDeviation > 0.1) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Revoke certification due to SLO violation
   */
  private revokeCertification(): void {
    this.certificationStatus = 'REVOKED';
    // TODO: Notify ProductionStateMachine to transition to REVALIDATION
  }

  /**
   * Restore certification after SLO compliance restored
   */
  restoreCertification(): void {
    // Check if all critical SLOs are compliant
    const allCompliant = this.checkAllCriticalSLOsCompliant();
    
    if (allCompliant) {
      this.certificationStatus = 'VALID';
      console.log('[SLO ENGINE] Certification restored - all critical SLOs compliant');
    }
  }

  /**
   * Check if all critical SLOs are compliant
   */
  private checkAllCriticalSLOsCompliant(): boolean {
    for (const [sloId, slo] of this.sloDefinitions) {
      if (slo.critical) {
        const measurements = this.measurements.get(sloId) || [];
        if (measurements.length === 0) return false;
        
        const latest = measurements[measurements.length - 1];
        if (!latest.compliant) return false;
      }
    }
    
    return true;
  }

  /**
   * Get current SLO status
   */
  getSLOStatus(sloId: string): SLOStatus | null {
    const slo = this.sloDefinitions.get(sloId);
    if (!slo) return null;

    const measurements = this.measurements.get(sloId) || [];
    if (measurements.length === 0) {
      return {
        sloId,
        name: slo.name,
        current: 0,
        target: slo.target,
        compliant: true,
        trend: 'STABLE',
        window: slo.window,
        lastMeasurement: 'N/A'
      };
    }

    const latest = measurements[measurements.length - 1];
    const trend = this.calculateTrend(measurements);

    return {
      sloId,
      name: slo.name,
      current: latest.value,
      target: slo.target,
      compliant: latest.compliant,
      trend,
      window: slo.window,
      lastMeasurement: latest.timestamp
    };
  }

  /**
   * Calculate trend from measurements
   */
  private calculateTrend(measurements: SLOMeasurement[]): SLOStatus['trend'] {
    if (measurements.length < 3) return 'STABLE';

    const recent = measurements.slice(-5);
    const values = recent.map(m => m.value);
    
    // Simple linear regression to determine trend
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (Math.abs(slope) < 0.01) return 'STABLE';
    
    // For latency/MTTR/freshness, lower is better
    const slo = this.sloDefinitions.get(measurements[0].sloId);
    if (!slo) return 'STABLE';
    
    const isLowerBetter = ['LATENCY', 'MTTR', 'FRESHNESS', 'DATA_DELAY'].includes(slo.measurement);
    
    if (isLowerBetter) {
      return slope < 0 ? 'IMPROVING' : 'DECLINING';
    } else {
      return slope > 0 ? 'IMPROVING' : 'DECLINING';
    }
  }

  /**
   * Get all SLO statuses
   */
  getAllSLOStatuses(): SLOStatus[] {
    const statuses: SLOStatus[] = [];
    
    for (const sloId of this.sloDefinitions.keys()) {
      const status = this.getSLOStatus(sloId);
      if (status) {
        statuses.push(status);
      }
    }
    
    return statuses;
  }

  /**
   * Get active violations
   */
  getActiveViolations(): SLAViolation[] {
    return Array.from(this.violations.values()).filter(v => !v.resolved);
  }

  /**
   * Resolve a violation
   */
  resolveViolation(violationId: string): void {
    const violation = this.violations.get(violationId);
    if (!violation) return;

    violation.resolved = true;
    violation.resolvedAt = new Date().toISOString();

    console.log(`[SLO ENGINE] Violation resolved: ${violationId}`);

    // Check if certification can be restored
    this.restoreCertification();
  }

  /**
   * Get certification status
   */
  getCertificationStatus(): 'VALID' | 'REVOKED' {
    return this.certificationStatus;
  }

  /**
   * Get SLO compliance summary
   */
  getComplianceSummary(): {
    total: number;
    compliant: number;
    nonCompliant: number;
    criticalCompliant: number;
    criticalTotal: number;
    certificationStatus: 'VALID' | 'REVOKED';
  } {
    const statuses = this.getAllSLOStatuses();
    const criticalSLOs = Array.from(this.sloDefinitions.values()).filter(s => s.critical);
    
    return {
      total: statuses.length,
      compliant: statuses.filter(s => s.compliant).length,
      nonCompliant: statuses.filter(s => !s.compliant).length,
      criticalCompliant: statuses.filter(s => s.compliant && this.sloDefinitions.get(s.sloId)?.critical).length,
      criticalTotal: criticalSLOs.length,
      certificationStatus: this.certificationStatus
    };
  }

  /**
   * Generate violation ID
   */
  private generateViolationId(): string {
    return `VIOL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Add custom SLO definition
   */
  addSLODefinition(slo: SLODefinition): void {
    this.sloDefinitions.set(slo.id, slo);
    this.measurements.set(slo.id, []);
    console.log(`[SLO ENGINE] Added SLO definition: ${slo.id}`);
  }

  /**
   * Get SLO definition
   */
  getSLODefinition(sloId: string): SLODefinition | null {
    return this.sloDefinitions.get(sloId) || null;
  }

  /**
   * Get all SLO definitions
   */
  getAllSLODefinitions(): SLODefinition[] {
    return Array.from(this.sloDefinitions.values());
  }
}
