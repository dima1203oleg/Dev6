/**
 * Structured Logger
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Structured logs with run_id, dataset_id, resource_id, record_id, entity_id, fact_id, card_id
 */

export interface LogContext {
  run_id?: string;
  dataset_id?: string;
  resource_id?: string;
  record_id?: string;
  entity_id?: string;
  fact_id?: string;
  card_id?: string;
  request_id?: string;
  stage?: string;
  component?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  context: LogContext;
  message: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export class StructuredLogger {
  private static instance: StructuredLogger;
  private logs: LogEntry[] = [];
  private maxLogEntries: number = 10000;

  private constructor() {}

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  private log(level: LogEntry['level'], context: LogContext, message: string, metadata?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: { ...context },
      message,
      metadata
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      };
    }

    this.logs.push(entry);

    // Trim logs if exceeding max entries
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Also output to console for immediate visibility
    const consoleMessage = `[${entry.timestamp}] [${level}] [${this.formatContext(context)}] ${message}`;
    
    switch (level) {
      case 'DEBUG':
        console.debug(consoleMessage, metadata || '');
        break;
      case 'INFO':
        console.info(consoleMessage, metadata || '');
        break;
      case 'WARN':
        console.warn(consoleMessage, metadata || '');
        break;
      case 'ERROR':
      case 'CRITICAL':
        console.error(consoleMessage, metadata || '', error || '');
        break;
    }
  }

  private formatContext(context: LogContext): string {
    const parts = [
      context.run_id && `run:${context.run_id}`,
      context.dataset_id && `dataset:${context.dataset_id}`,
      context.resource_id && `resource:${context.resource_id}`,
      context.record_id && `record:${context.record_id}`,
      context.entity_id && `entity:${context.entity_id}`,
      context.fact_id && `fact:${context.fact_id}`,
      context.card_id && `card:${context.card_id}`,
      context.request_id && `req:${context.request_id}`,
      context.stage && `stage:${context.stage}`,
      context.component && `comp:${context.component}`
    ].filter(Boolean);

    return parts.join(' ') || 'system';
  }

  debug(context: LogContext, message: string, metadata?: Record<string, any>): void {
    this.log('DEBUG', context, message, metadata);
  }

  info(context: LogContext, message: string, metadata?: Record<string, any>): void {
    this.log('INFO', context, message, metadata);
  }

  warn(context: LogContext, message: string, metadata?: Record<string, any>): void {
    this.log('WARN', context, message, metadata);
  }

  error(context: LogContext, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('ERROR', context, message, metadata, error);
  }

  critical(context: LogContext, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('CRITICAL', context, message, metadata, error);
  }

  // Convenience methods for specific pipeline stages
  logIngestionStart(context: LogContext, datasetCount: number, resourceCount: number): void {
    this.info(context, 'Ingestion started', { datasetCount, resourceCount });
  }

  logIngestionProgress(context: LogContext, processed: number, total: number): void {
    this.info(context, 'Ingestion progress', { processed, total, progress: `${((processed / total) * 100).toFixed(1)}%` });
  }

  logIngestionComplete(context: LogContext, metrics: {
    recordsProcessed: number;
    recordsFailed: number;
    recordsSkipped: number;
    entitiesCreated: number;
    durationMs: number;
  }): void {
    this.info(context, 'Ingestion completed', { ...metrics, durationSec: (metrics.durationMs / 1000).toFixed(2) });
  }

  logDatasetDiscovered(context: LogContext, datasetName: string, resourceCount: number): void {
    this.info(context, 'Dataset discovered', { datasetName, resourceCount });
  }

  logResourceFetched(context: LogContext, resourceName: string, size: number, durationMs: number): void {
    this.info(context, 'Resource fetched', { resourceName, size, durationMs });
  }

  logRecordParsed(context: LogContext, recordId: string, success: boolean): void {
    this.info(context, 'Record parsed', { recordId, success });
  }

  logEntityCreated(context: LogContext, entityId: string, entityType: string): void {
    this.info(context, 'Entity created', { entityId, entityType });
  }

  logEntityMatched(context: LogContext, entityId: string, confidence: number): void {
    this.info(context, 'Entity matched', { entityId, confidence });
  }

  logCardGenerated(context: LogContext, cardId: string, cardType: string, status: string): void {
    this.info(context, 'Card generated', { cardId, cardType, status });
  }

  logEvidenceCreated(context: LogContext, evidenceId: string, factId: string): void {
    this.info(context, 'Evidence created', { evidenceId, factId });
  }

  logValidationResult(context: LogContext, field: string, status: string, confidence?: number): void {
    this.info(context, 'Field validated', { field, status, confidence });
  }

  logTruthValidation(context: LogContext, stage: string, expected: any, actual: any, match: boolean): void {
    this.info(context, 'Truth validation', { stage, expected, actual, match });
  }

  logApiRequest(context: LogContext, endpoint: string, method: string, durationMs: number): void {
    this.info(context, 'API request', { endpoint, method, durationMs });
  }

  logDatabaseQuery(context: LogContext, query: string, durationMs: number, rows: number): void {
    this.debug(context, 'Database query', { query: query.substring(0, 100), durationMs, rows });
  }

  logError(context: LogContext, error: Error, stage?: string): void {
    this.error(context, `Error${stage ? ` in ${stage}` : ''}`, error);
  }

  // Query logs
  getLogs(context?: Partial<LogContext>, level?: LogEntry['level'], limit?: number): LogEntry[] {
    let filtered = this.logs;

    if (context) {
      filtered = filtered.filter(entry => {
        return Object.entries(context).every(([key, value]) => entry.context[key as keyof LogContext] === value);
      });
    }

    if (level) {
      filtered = filtered.filter(entry => entry.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  getLogsByRunId(runId: string): LogEntry[] {
    return this.getLogs({ run_id: runId });
  }

  getLogsByEntityId(entityId: string): LogEntry[] {
    return this.getLogs({ entity_id: entityId });
  }

  getLogsByCardId(cardId: string): LogEntry[] {
    return this.getLogs({ card_id: cardId });
  }

  getErrorLogs(context?: Partial<LogContext>): LogEntry[] {
    return this.getLogs(context, 'ERROR');
  }

  getCriticalLogs(context?: Partial<LogContext>): LogEntry[] {
    return this.getLogs(context, 'CRITICAL');
  }

  // Statistics
  getStatistics(context?: Partial<LogContext>): {
    total: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
    critical: number;
  } {
    const logs = context ? this.getLogs(context) : this.logs;

    return {
      total: logs.length,
      debug: logs.filter(l => l.level === 'DEBUG').length,
      info: logs.filter(l => l.level === 'INFO').length,
      warn: logs.filter(l => l.level === 'WARN').length,
      error: logs.filter(l => l.level === 'ERROR').length,
      critical: logs.filter(l => l.level === 'CRITICAL').length
    };
  }

  // Export logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'run_id', 'dataset_id', 'resource_id', 'record_id', 'entity_id', 'fact_id', 'card_id', 'request_id', 'stage', 'component', 'message', 'duration_ms'];
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        log.context.run_id || '',
        log.context.dataset_id || '',
        log.context.resource_id || '',
        log.context.record_id || '',
        log.context.entity_id || '',
        log.context.fact_id || '',
        log.context.card_id || '',
        log.context.request_id || '',
        log.context.stage || '',
        log.context.component || '',
        `"${log.message.replace(/"/g, '""')}"`,
        log.duration_ms || ''
      ]);
      
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    return '';
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Get log count
  getLogCount(): number {
    return this.logs.length;
  }
}

// Singleton instance
export const logger = StructuredLogger.getInstance();
