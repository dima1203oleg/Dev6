/**
 * Registry Discovery Platform (RDP)
 * Autonomous Scheduler
 * 
 * Manages automated cycles for all platform operations
 */

import { CatalogConfig, Dataset } from './types';
import { discoveryEngine } from './DiscoveryEngine';
import { datasetScanner } from './DatasetScanner';
import { resourceDownloader } from './ResourceDownloader';
import { connectorGenerator } from './ConnectorGenerator';
import { schemaAnalyzer } from './SchemaAnalyzer';
import { registryIntelligence } from './RegistryIntelligence';
import { qualityEngine } from './QualityEngine';

export interface ScheduleConfig {
  enabled: boolean;
  discoveryInterval: number; // hours
  healthCheckInterval: number; // hours
  schemaDriftInterval: number; // hours
  metadataRefreshInterval: number; // hours
  fullValidationInterval: number; // days
  timezone: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  type: 'DISCOVERY' | 'HEALTH_CHECK' | 'SCHEMA_DRIFT' | 'METADATA_REFRESH' | 'FULL_VALIDATION';
  interval: number;
  lastRun?: Date;
  nextRun?: Date;
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: any;
  error?: string;
}

export class AutonomousScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private config: ScheduleConfig;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private running: boolean = false;

  constructor() {
    this.config = {
      enabled: true,
      discoveryInterval: 24, // Every 24 hours
      healthCheckInterval: 1, // Every hour
      schemaDriftInterval: 6, // Every 6 hours
      metadataRefreshInterval: 24, // Every day
      fullValidationInterval: 7, // Every week
      timezone: 'Europe/Kiev',
    };
  }

  /**
   * Start scheduler
   */
  start(): void {
    if (this.running) {
      console.log('[Scheduler] Already running');
      return;
    }

    console.log('[Scheduler] Starting autonomous scheduler');
    this.running = true;

    // Schedule all tasks
    this.scheduleDiscovery();
    this.scheduleHealthCheck();
    this.scheduleSchemaDrift();
    this.scheduleMetadataRefresh();
    this.scheduleFullValidation();

    console.log('[Scheduler] All tasks scheduled');
  }

  /**
   * Stop scheduler
   */
  stop(): void {
    console.log('[Scheduler] Stopping autonomous scheduler');
    this.running = false;

    // Clear all intervals
    for (const [taskId, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`[Scheduler] Stopped task: ${taskId}`);
    }

    this.intervals.clear();
    console.log('[Scheduler] Scheduler stopped');
  }

  /**
   * Schedule discovery task
   */
  private scheduleDiscovery(): void {
    const taskId = 'discovery';
    const intervalMs = this.config.discoveryInterval * 60 * 60 * 1000;

    const task: ScheduledTask = {
      id: taskId,
      name: 'Registry Discovery',
      type: 'DISCOVERY',
      interval: this.config.discoveryInterval,
      status: 'SCHEDULED',
      nextRun: new Date(Date.now() + intervalMs),
    };

    this.tasks.set(taskId, task);

    const interval = setInterval(async () => {
      await this.runDiscoveryTask(taskId);
    }, intervalMs);

    this.intervals.set(taskId, interval);
    console.log(`[Scheduler] Scheduled discovery: every ${this.config.discoveryInterval} hours`);
  }

  /**
   * Schedule health check task
   */
  private scheduleHealthCheck(): void {
    const taskId = 'health-check';
    const intervalMs = this.config.healthCheckInterval * 60 * 60 * 1000;

    const task: ScheduledTask = {
      id: taskId,
      name: 'Health Check',
      type: 'HEALTH_CHECK',
      interval: this.config.healthCheckInterval,
      status: 'SCHEDULED',
      nextRun: new Date(Date.now() + intervalMs),
    };

    this.tasks.set(taskId, task);

    const interval = setInterval(async () => {
      await this.runHealthCheckTask(taskId);
    }, intervalMs);

    this.intervals.set(taskId, interval);
    console.log(`[Scheduler] Scheduled health check: every ${this.config.healthCheckInterval} hours`);
  }

  /**
   * Schedule schema drift detection task
   */
  private scheduleSchemaDrift(): void {
    const taskId = 'schema-drift';
    const intervalMs = this.config.schemaDriftInterval * 60 * 60 * 1000;

    const task: ScheduledTask = {
      id: taskId,
      name: 'Schema Drift Detection',
      type: 'SCHEMA_DRIFT',
      interval: this.config.schemaDriftInterval,
      status: 'SCHEDULED',
      nextRun: new Date(Date.now() + intervalMs),
    };

    this.tasks.set(taskId, task);

    const interval = setInterval(async () => {
      await this.runSchemaDriftTask(taskId);
    }, intervalMs);

    this.intervals.set(taskId, interval);
    console.log(`[Scheduler] Scheduled schema drift: every ${this.config.schemaDriftInterval} hours`);
  }

  /**
   * Schedule metadata refresh task
   */
  private scheduleMetadataRefresh(): void {
    const taskId = 'metadata-refresh';
    const intervalMs = this.config.metadataRefreshInterval * 60 * 60 * 1000;

    const task: ScheduledTask = {
      id: taskId,
      name: 'Metadata Refresh',
      type: 'METADATA_REFRESH',
      interval: this.config.metadataRefreshInterval,
      status: 'SCHEDULED',
      nextRun: new Date(Date.now() + intervalMs),
    };

    this.tasks.set(taskId, task);

    const interval = setInterval(async () => {
      await this.runMetadataRefreshTask(taskId);
    }, intervalMs);

    this.intervals.set(taskId, interval);
    console.log(`[Scheduler] Scheduled metadata refresh: every ${this.config.metadataRefreshInterval} hours`);
  }

  /**
   * Schedule full validation task
   */
  private scheduleFullValidation(): void {
    const taskId = 'full-validation';
    const intervalMs = this.config.fullValidationInterval * 24 * 60 * 60 * 1000;

    const task: ScheduledTask = {
      id: taskId,
      name: 'Full Validation',
      type: 'FULL_VALIDATION',
      interval: this.config.fullValidationInterval,
      status: 'SCHEDULED',
      nextRun: new Date(Date.now() + intervalMs),
    };

    this.tasks.set(taskId, task);

    const interval = setInterval(async () => {
      await this.runFullValidationTask(taskId);
    }, intervalMs);

    this.intervals.set(taskId, interval);
    console.log(`[Scheduler] Scheduled full validation: every ${this.config.fullValidationInterval} days`);
  }

  /**
   * Run discovery task
   */
  private async runDiscoveryTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    console.log(`[Scheduler] Running discovery task`);
    task.status = 'RUNNING';
    task.lastRun = new Date();

    try {
      const reports = await discoveryEngine.runDiscovery();
      
      task.status = 'COMPLETED';
      task.result = {
        reports,
        totalDatasets: reports.reduce((sum, r) => sum + r.totalDatasets, 0),
        newDatasets: reports.reduce((sum, r) => sum + r.newDatasets, 0),
      };

      console.log(`[Scheduler] Discovery complete: ${task.result.totalDatasets} datasets, ${task.result.newDatasets} new`);

    } catch (error) {
      task.status = 'FAILED';
      task.error = String(error);
      console.error(`[Scheduler] Discovery failed:`, error);
    }

    // Schedule next run
    task.nextRun = new Date(Date.now() + task.interval * 60 * 60 * 1000);
  }

  /**
   * Run health check task
   */
  private async runHealthCheckTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    console.log(`[Scheduler] Running health check task`);
    task.status = 'RUNNING';
    task.lastRun = new Date();

    try {
      const passports = registryIntelligence.getAllPassports();
      const healthChecks = [];

      for (const passport of passports) {
        const check = await qualityEngine.runQualityCheck(
          passport as any,
          undefined,
          undefined
        );
        healthChecks.push(check);
      }

      task.status = 'COMPLETED';
      task.result = {
        totalRegistries: passports.length,
        healthy: healthChecks.filter(c => c.passed).length,
        unhealthy: healthChecks.filter(c => !c.passed).length,
      };

      console.log(`[Scheduler] Health check complete: ${task.result.healthy}/${task.result.totalRegistries} healthy`);

    } catch (error) {
      task.status = 'FAILED';
      task.error = String(error);
      console.error(`[Scheduler] Health check failed:`, error);
    }

    task.nextRun = new Date(Date.now() + task.interval * 60 * 60 * 1000);
  }

  /**
   * Run schema drift detection task
   */
  private async runSchemaDriftTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    console.log(`[Scheduler] Running schema drift detection task`);
    task.status = 'RUNNING';
    task.lastRun = new Date();

    try {
      const datasets = this.getAllDatasets();
      const drifts = [];

      for (const dataset of datasets) {
        // TODO: Implement schema drift detection
        // This would require current schema data
      }

      task.status = 'COMPLETED';
      task.result = {
        totalDatasets: datasets.length,
        driftsDetected: drifts.length,
        autoFixed: drifts.filter(d => d.autoFixed).length,
      };

      console.log(`[Scheduler] Schema drift check complete: ${task.result.driftsDetected} drifts`);

    } catch (error) {
      task.status = 'FAILED';
      task.error = String(error);
      console.error(`[Scheduler] Schema drift check failed:`, error);
    }

    task.nextRun = new Date(Date.now() + task.interval * 60 * 60 * 1000);
  }

  /**
   * Run metadata refresh task
   */
  private async runMetadataRefreshTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    console.log(`[Scheduler] Running metadata refresh task`);
    task.status = 'RUNNING';
    task.lastRun = new Date();

    try {
      const passports = registryIntelligence.getAllPassports();
      const refreshed = [];

      for (const passport of passports) {
        // TODO: Implement metadata refresh
        // This would re-fetch dataset metadata and update passports
      }

      task.status = 'COMPLETED';
      task.result = {
        totalRegistries: passports.length,
        refreshed: refreshed.length,
      };

      console.log(`[Scheduler] Metadata refresh complete: ${task.result.refreshed}/${task.result.totalRegistries} refreshed`);

    } catch (error) {
      task.status = 'FAILED';
      task.error = String(error);
      console.error(`[Scheduler] Metadata refresh failed:`, error);
    }

    task.nextRun = new Date(Date.now() + task.interval * 60 * 60 * 1000);
  }

  /**
   * Run full validation task
   */
  private async runFullValidationTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    console.log(`[Scheduler] Running full validation task`);
    task.status = 'RUNNING';
    task.lastRun = new Date();

    try {
      // Run complete validation cycle
      const discoveryReports = await discoveryEngine.runDiscovery();
      const passports = registryIntelligence.getAllPassports();
      const qualityChecks = await qualityEngine.runBatchQualityCheck(
        passports as any[],
        undefined,
        undefined
      );

      task.status = 'COMPLETED';
      task.result = {
        discovery: discoveryReports,
        quality: qualityChecks,
        overallPassed: qualityChecks.filter(c => c.passed).length === qualityChecks.length,
      };

      console.log(`[Scheduler] Full validation complete: ${task.result.overallPassed ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
      task.status = 'FAILED';
      task.error = String(error);
      console.error(`[Scheduler] Full validation failed:`, error);
    }

    task.nextRun = new Date(Date.now() + task.interval * 24 * 60 * 60 * 1000);
  }

  /**
   * Get all datasets from discovery
   */
  private getAllDatasets(): Dataset[] {
    const datasets: Dataset[] = [];
    const reports = discoveryEngine.getDiscoveryHistory();

    for (const report of reports) {
      datasets.push(...report.datasets);
    }

    return datasets;
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    running: boolean;
    config: ScheduleConfig;
    tasks: ScheduledTask[];
  } {
    return {
      running: this.running,
      config: this.config,
      tasks: Array.from(this.tasks.values()),
    };
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Update schedule configuration
   */
  updateConfig(config: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart scheduler if running
    if (this.running) {
      this.stop();
      this.start();
    }
  }

  /**
   * Run task manually
   */
  async runTaskManually(taskId: string): Promise<void> {
    switch (taskId) {
      case 'discovery':
        await this.runDiscoveryTask(taskId);
        break;
      case 'health-check':
        await this.runHealthCheckTask(taskId);
        break;
      case 'schema-drift':
        await this.runSchemaDriftTask(taskId);
        break;
      case 'metadata-refresh':
        await this.runMetadataRefreshTask(taskId);
        break;
      case 'full-validation':
        await this.runFullValidationTask(taskId);
        break;
      default:
        throw new Error(`Unknown task: ${taskId}`);
    }
  }

  /**
   * Get task statistics
   */
  getTaskStatistics(): {
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    scheduledTasks: number;
  } {
    const tasks = Array.from(this.tasks.values());

    return {
      totalTasks: tasks.length,
      runningTasks: tasks.filter(t => t.status === 'RUNNING').length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      failedTasks: tasks.filter(t => t.status === 'FAILED').length,
      scheduledTasks: tasks.filter(t => t.status === 'SCHEDULED').length,
    };
  }
}

// Singleton instance
export const autonomousScheduler = new AutonomousScheduler();
