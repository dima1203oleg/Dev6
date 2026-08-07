/**
 * MASTER PRODUCTION BATTLEFIELD SPECIFICATION v5.0
 * PREDATOR Analytics - Autonomous Production Certification & Continuous Validation Framework
 * 
 * Continuous Registry Intelligence Monitoring
 * 
 * For each of 170+ sources, maintains passport with:
 * - Availability
 * - Average RTT
 * - SLA
 * - Failure history
 * - Last successful sync
 * - Last API change
 * - OpenAPI version
 * - Reliability rating
 * - Last verification date
 * - Responsible connector
 * 
 * If contract change detected, system automatically marks connector for revalidation.
 */

export interface RegistryMonitor {
  registryId: string;
  monitoringEnabled: boolean;
  checkInterval: number; // seconds
  lastCheck: string;
  nextCheck: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  metrics: {
    availability: number;
    averageLatency: number;
    errorRate: number;
    successCount: number;
    failureCount: number;
    lastSuccess: string;
    lastFailure: string;
  };
  contract: {
    version: string;
    lastChecked: string;
    changeDetected: boolean;
    changeDescription?: string;
    changeSeverity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
  sla: {
    target: number;
    current: number;
    compliant: boolean;
    violationCount: number;
  };
  alerts: RegistryAlert[];
}

export interface RegistryAlert {
  alertId: string;
  registryId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  type: 'AVAILABILITY' | 'LATENCY' | 'ERROR_RATE' | 'CONTRACT_CHANGE' | 'SLA_VIOLATION';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface MonitoringSchedule {
  scheduleId: string;
  registryId: string;
  interval: number;
  active: boolean;
  lastExecution: string;
  nextExecution: string;
}

export class ContinuousRegistryIntelligence {
  private monitors: Map<string, RegistryMonitor> = new Map();
  private schedules: Map<string, MonitoringSchedule> = new Map();
  private alerts: Map<string, RegistryAlert> = new Map();
  private monitoringInterval: number = 300; // 5 minutes default

  /**
   * Start monitoring for a registry
   */
  startMonitoring(
    registryId: string,
    checkInterval: number = 300
  ): RegistryMonitor {
    const monitor: RegistryMonitor = {
      registryId,
      monitoringEnabled: true,
      checkInterval,
      lastCheck: new Date().toISOString(),
      nextCheck: new Date(Date.now() + checkInterval * 1000).toISOString(),
      status: 'UNKNOWN',
      metrics: {
        availability: 100,
        averageLatency: 0,
        errorRate: 0,
        successCount: 0,
        failureCount: 0,
        lastSuccess: '',
        lastFailure: ''
      },
      contract: {
        version: '1.0',
        lastChecked: new Date().toISOString(),
        changeDetected: false
      },
      sla: {
        target: 99.5,
        current: 100,
        compliant: true,
        violationCount: 0
      },
      alerts: []
    };

    this.monitors.set(registryId, monitor);

    // Create monitoring schedule
    const schedule: MonitoringSchedule = {
      scheduleId: this.generateScheduleId(),
      registryId,
      interval: checkInterval,
      active: true,
      lastExecution: new Date().toISOString(),
      nextExecution: new Date(Date.now() + checkInterval * 1000).toISOString()
    };

    this.schedules.set(schedule.scheduleId, schedule);

    console.log(`[REGISTRY INTELLIGENCE] Started monitoring: ${registryId} (interval: ${checkInterval}s)`);

    return monitor;
  }

  /**
   * Stop monitoring for a registry
   */
  stopMonitoring(registryId: string): void {
    const monitor = this.monitors.get(registryId);
    if (monitor) {
      monitor.monitoringEnabled = false;
      
      // Deactivate schedule
      for (const [scheduleId, schedule] of this.schedules) {
        if (schedule.registryId === registryId) {
          schedule.active = false;
        }
      }
      
      console.log(`[REGISTRY INTELLIGENCE] Stopped monitoring: ${registryId}`);
    }
  }

  /**
   * Perform health check for a registry
   */
  async performHealthCheck(registryId: string): Promise<void> {
    const monitor = this.monitors.get(registryId);
    if (!monitor || !monitor.monitoringEnabled) return;

    monitor.lastCheck = new Date().toISOString();
    monitor.nextCheck = new Date(Date.now() + monitor.checkInterval * 1000).toISOString();

    try {
      // TODO: Implement actual health check
      const result = await this.checkRegistryHealth(registryId);
      
      // Update metrics
      if (result.healthy) {
        monitor.metrics.successCount++;
        monitor.metrics.lastSuccess = new Date().toISOString();
        monitor.status = 'HEALTHY';
      } else {
        monitor.metrics.failureCount++;
        monitor.metrics.lastFailure = new Date().toISOString();
        monitor.status = result.severity === 'CRITICAL' ? 'UNHEALTHY' : 'DEGRADED';
        this.createAlert(registryId, result.severity, 'AVAILABILITY', result.message);
      }

      // Update availability
      const total = monitor.metrics.successCount + monitor.metrics.failureCount;
      monitor.metrics.availability = total > 0 
        ? (monitor.metrics.successCount / total) * 100 
        : 100;

      // Update latency
      if (result.latency) {
        monitor.metrics.averageLatency = this.updateEma(
          monitor.metrics.averageLatency,
          result.latency,
          0.1
        );
      }

      // Update error rate
      monitor.metrics.errorRate = total > 0 
        ? (monitor.metrics.failureCount / total) * 100 
        : 0;

      // Check SLA compliance
      this.checkSLACompliance(monitor);

      // Check for contract changes
      await this.checkContractChanges(monitor);

      console.log(`[REGISTRY INTELLIGENCE] Health check complete: ${registryId} - ${monitor.status}`);

    } catch (error) {
      console.error(`[REGISTRY INTELLIGENCE] Health check failed: ${registryId}`, error);
      monitor.metrics.failureCount++;
      monitor.metrics.lastFailure = new Date().toISOString();
      monitor.status = 'UNHEALTHY';
      this.createAlert(registryId, 'CRITICAL', 'ERROR_RATE', `Health check error: ${String(error)}`);
    }
  }

  /**
   * Check registry health (placeholder implementation)
   */
  private async checkRegistryHealth(registryId: string): Promise<{
    healthy: boolean;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    latency?: number;
  }> {
    // TODO: Implement actual health check logic
    // This would call the registry's health endpoint or test a sample query
    
    return {
      healthy: true,
      severity: 'LOW',
      message: 'Registry responding normally'
    };
  }

  /**
   * Check SLA compliance
   */
  private checkSLACompliance(monitor: RegistryMonitor): void {
    monitor.sla.current = monitor.metrics.availability;
    monitor.sla.compliant = monitor.sla.current >= monitor.sla.target;

    if (!monitor.sla.compliant) {
      monitor.sla.violationCount++;
      this.createAlert(
        monitor.registryId,
        'HIGH',
        'SLA_VIOLATION',
        `SLA violation: ${monitor.sla.current}% < ${monitor.sla.target}%`
      );
    }
  }

  /**
   * Check for contract changes
   */
  private async checkContractChanges(monitor: RegistryMonitor): Promise<void> {
    monitor.contract.lastChecked = new Date().toISOString();

    // TODO: Implement actual contract change detection
    // This would compare current API contract with last known version
    
    // Placeholder: no change detected
    monitor.contract.changeDetected = false;
  }

  /**
   * Create an alert
   */
  private createAlert(
    registryId: string,
    severity: RegistryAlert['severity'],
    type: RegistryAlert['type'],
    message: string
  ): void {
    const alertId = this.generateAlertId();
    
    const alert: RegistryAlert = {
      alertId,
      registryId,
      severity,
      type,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.set(alertId, alert);

    // Add to monitor's alerts
    const monitor = this.monitors.get(registryId);
    if (monitor) {
      monitor.alerts.push(alert);
    }

    console.log(`[REGISTRY INTELLIGENCE] Alert created: ${alertId} - ${message}`);

    // If contract change detected, mark for revalidation
    if (type === 'CONTRACT_CHANGE') {
      this.markForRevalidation(registryId);
    }
  }

  /**
   * Mark registry for revalidation
   */
  private markForRevalidation(registryId: string): void {
    console.log(`[REGISTRY INTELLIGENCE] Marking ${registryId} for revalidation due to contract change`);
    // TODO: Integrate with ContinuousCertification to trigger revalidation
  }

  /**
   * Run all scheduled checks
   */
  async runScheduledChecks(): Promise<void> {
    const now = Date.now();
    let checksRun = 0;

    for (const [scheduleId, schedule] of this.schedules) {
      if (!schedule.active) continue;

      const nextExecution = new Date(schedule.nextExecution).getTime();
      
      if (now >= nextExecution) {
        await this.performHealthCheck(schedule.registryId);
        
        // Update schedule
        schedule.lastExecution = new Date().toISOString();
        schedule.nextExecution = new Date(now + schedule.interval * 1000).toISOString();
        
        checksRun++;
      }
    }

    if (checksRun > 0) {
      console.log(`[REGISTRY INTELLIGENCE] Ran ${checksRun} scheduled health checks`);
    }
  }

  /**
   * Get monitor for a registry
   */
  getMonitor(registryId: string): RegistryMonitor | null {
    return this.monitors.get(registryId) || null;
  }

  /**
   * Get all monitors
   */
  getAllMonitors(): RegistryMonitor[] {
    return Array.from(this.monitors.values());
  }

  /**
   * Get monitors by status
   */
  getMonitorsByStatus(status: RegistryMonitor['status']): RegistryMonitor[] {
    return Array.from(this.monitors.values()).filter(m => m.status === status);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): RegistryAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  /**
   * Get alerts by registry
   */
  getAlertsByRegistry(registryId: string): RegistryAlert[] {
    return Array.from(this.alerts.values()).filter(a => a.registryId === registryId && !a.resolved);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`[REGISTRY INTELLIGENCE] Alert acknowledged: ${alertId}`);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`[REGISTRY INTELLIGENCE] Alert resolved: ${alertId}`);
    }
  }

  /**
   * Get monitoring summary
   */
  getSummary(): {
    totalRegistries: number;
    monitoring: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
    activeAlerts: number;
    slaViolations: number;
    averageAvailability: number;
  } {
    const monitors = Array.from(this.monitors.values());
    const activeAlerts = this.getActiveAlerts();

    return {
      totalRegistries: monitors.length,
      monitoring: monitors.filter(m => m.monitoringEnabled).length,
      healthy: monitors.filter(m => m.status === 'HEALTHY').length,
      degraded: monitors.filter(m => m.status === 'DEGRADED').length,
      unhealthy: monitors.filter(m => m.status === 'UNHEALTHY').length,
      unknown: monitors.filter(m => m.status === 'UNKNOWN').length,
      activeAlerts: activeAlerts.length,
      slaViolations: monitors.reduce((sum, m) => sum + m.sla.violationCount, 0),
      averageAvailability: monitors.length > 0
        ? Math.round(monitors.reduce((sum, m) => sum + m.metrics.availability, 0) / monitors.length)
        : 0
    };
  }

  /**
   * Update exponential moving average
   */
  private updateEma(current: number, newValue: number, alpha: number): number {
    return alpha * newValue + (1 - alpha) * current;
  }

  /**
   * Generate schedule ID
   */
  private generateScheduleId(): string {
    return `SCHED-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `ALERT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.monitors.clear();
    this.schedules.clear();
    this.alerts.clear();
  }
}
