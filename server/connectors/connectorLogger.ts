export interface ConnectorLogEntry {
  id: string;
  requestId: string;
  connectorId: string;
  connectorName: string;
  timestamp: string;
  durationMs: number;
  endpoint: string;
  method: string;
  request: {
    headers?: Record<string, string>;
    queryParams?: Record<string, any>;
    body?: any;
  };
  response: {
    statusCode: number;
    success: boolean;
    bodySize?: number;
    dataPreview?: any;
    error?: {
      code?: string;
      message?: string;
      details?: any;
    };
  };
  retryCount?: number;
  isEmulated?: boolean;
}

export interface ConnectorAggregatedMetrics {
  connectorId: string;
  connectorName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRatePercentage: number;
  averageLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  lastRequestTimestamp: string | null;
}

const MAX_LOG_ENTRIES = 1000;
const logsBuffer: ConnectorLogEntry[] = [];

// Sensitive field patterns to redact from logs
const SENSITIVE_KEY_REGEX = /^(authorization|bearer|token|api_?key|sec_?key|secret|password|passwd|auth|credential|cookie|private_?key|jwt|x-api-key)$/i;
const SENSITIVE_VALUE_REGEX = /(api_?key|token|secret|auth|bearer|key)=([^&"'\s]+)/gi;

/**
 * Sanitizes any URL by redacting sensitive query parameter values
 */
export function sanitizeUrl(urlStr: string): string {
  try {
    return urlStr.replace(SENSITIVE_VALUE_REGEX, "$1=[REDACTED]");
  } catch {
    return urlStr;
  }
}

/**
 * Recursively redacts sensitive credentials from headers, query params, and payload objects
 */
export function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 5 || obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Redact strings that look like bearer tokens or API key parameter strings
    if (obj.startsWith("Bearer ") || obj.startsWith("Basic ")) {
      return "[REDACTED_CREDENTIAL]";
    }
    return sanitizeUrl(obj);
  }

  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.slice(0, 10).map(item => sanitizeObject(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else if (typeof value === "string") {
      if (key.toLowerCase().includes("key") || key.toLowerCase().includes("token") || key.toLowerCase().includes("auth")) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeUrl(value);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Creates a safe data preview for logging (truncates large arrays or strings)
 */
function createSafePreview(data: any): any {
  if (!data) return null;
  const sanitized = sanitizeObject(data);
  
  if (typeof sanitized === "object" && !Array.isArray(sanitized)) {
    const keys = Object.keys(sanitized);
    if (keys.length > 10) {
      const truncated: Record<string, any> = {};
      keys.slice(0, 10).forEach(k => {
        truncated[k] = sanitized[k];
      });
      truncated["_truncated"] = `Total keys: ${keys.length}`;
      return truncated;
    }
  }
  return sanitized;
}

/**
 * Records a structured connector log entry with sanitization and outputs standard JSON telemetry.
 */
export function logConnectorEvent(
  entryInput: Omit<ConnectorLogEntry, "id" | "timestamp">
): ConnectorLogEntry {
  const fullEntry: ConnectorLogEntry = {
    ...entryInput,
    id: `connlog-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    endpoint: sanitizeUrl(entryInput.endpoint),
    request: {
      headers: entryInput.request.headers ? sanitizeObject(entryInput.request.headers) : undefined,
      queryParams: entryInput.request.queryParams ? sanitizeObject(entryInput.request.queryParams) : undefined,
      body: entryInput.request.body ? createSafePreview(entryInput.request.body) : undefined,
    },
    response: {
      ...entryInput.response,
      dataPreview: entryInput.response.dataPreview ? createSafePreview(entryInput.response.dataPreview) : undefined,
      error: entryInput.response.error ? sanitizeObject(entryInput.response.error) : undefined,
    },
  };

  // Add to ring buffer
  logsBuffer.unshift(fullEntry);
  if (logsBuffer.length > MAX_LOG_ENTRIES) {
    logsBuffer.pop();
  }

  // Cloud Logging JSON stdout logging
  console.log(
    JSON.stringify({
      severity: fullEntry.response.success ? "INFO" : "ERROR",
      logType: "CONNECTOR_TELEMETRY",
      requestId: fullEntry.requestId,
      connectorId: fullEntry.connectorId,
      connectorName: fullEntry.connectorName,
      endpoint: fullEntry.endpoint,
      method: fullEntry.method,
      statusCode: fullEntry.response.statusCode,
      latencyMs: fullEntry.durationMs,
      success: fullEntry.response.success,
      isEmulated: fullEntry.isEmulated || false,
      timestamp: fullEntry.timestamp,
    })
  );

  return fullEntry;
}

/**
 * Retrieves connector log entries with optional limits and filters
 */
export function getConnectorLogs(
  limit = 100,
  connectorId?: string,
  onlyErrors = false
): ConnectorLogEntry[] {
  let filtered = logsBuffer;
  if (connectorId) {
    filtered = filtered.filter(l => l.connectorId === connectorId);
  }
  if (onlyErrors) {
    filtered = filtered.filter(l => !l.response.success);
  }
  return filtered.slice(0, limit);
}

/**
 * Computes aggregated latency and request metrics for all or a specific connector
 */
export function getConnectorMetrics(connectorId?: string): ConnectorAggregatedMetrics[] {
  const map = new Map<string, {
    name: string;
    total: number;
    success: number;
    failed: number;
    latencies: number[];
    lastTimestamp: string | null;
  }>();

  for (const log of logsBuffer) {
    if (connectorId && log.connectorId !== connectorId) continue;

    let stats = map.get(log.connectorId);
    if (!stats) {
      stats = {
        name: log.connectorName,
        total: 0,
        success: 0,
        failed: 0,
        latencies: [],
        lastTimestamp: log.timestamp,
      };
      map.set(log.connectorId, stats);
    }

    stats.total += 1;
    if (log.response.success) {
      stats.success += 1;
    } else {
      stats.failed += 1;
    }
    stats.latencies.push(log.durationMs);
    if (!stats.lastTimestamp || log.timestamp > stats.lastTimestamp) {
      stats.lastTimestamp = log.timestamp;
    }
  }

  const results: ConnectorAggregatedMetrics[] = [];
  for (const [id, stats] of map.entries()) {
    const total = stats.total;
    const avgLatency = total > 0 ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / total) : 0;
    const minLatency = stats.latencies.length > 0 ? Math.min(...stats.latencies) : 0;
    const maxLatency = stats.latencies.length > 0 ? Math.max(...stats.latencies) : 0;

    results.push({
      connectorId: id,
      connectorName: stats.name,
      totalRequests: total,
      successfulRequests: stats.success,
      failedRequests: stats.failed,
      successRatePercentage: total > 0 ? Math.round((stats.success / total) * 100) : 100,
      averageLatencyMs: avgLatency,
      minLatencyMs: minLatency,
      maxLatencyMs: maxLatency,
      lastRequestTimestamp: stats.lastTimestamp,
    });
  }

  return results;
}

/**
 * Utility wrapper function to execute connector requests with automatic latency tracking and sanitizing structured logging.
 */
export async function executeWithConnectorLogging<T>(
  params: {
    requestId?: string;
    connectorId: string;
    connectorName: string;
    endpoint: string;
    method?: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, any>;
    body?: any;
    retryCount?: number;
    isEmulated?: boolean;
  },
  fn: () => Promise<{ statusCode?: number; data: T; rawSize?: number }>
): Promise<T> {
  const reqId = params.requestId || `req-conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const method = params.method || "GET";
  const startTime = Date.now();

  try {
    const result = await fn();
    const durationMs = Date.now() - startTime;
    const statusCode = result.statusCode || 200;

    logConnectorEvent({
      requestId: reqId,
      connectorId: params.connectorId,
      connectorName: params.connectorName,
      durationMs,
      endpoint: params.endpoint,
      method,
      request: {
        headers: params.headers,
        queryParams: params.queryParams,
        body: params.body,
      },
      response: {
        statusCode,
        success: statusCode >= 200 && statusCode < 400,
        bodySize: result.rawSize || (result.data ? JSON.stringify(result.data).length : 0),
        dataPreview: result.data,
      },
      retryCount: params.retryCount || 0,
      isEmulated: params.isEmulated || false,
    });

    return result.data;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const statusCode = err.statusCode || err.status || 500;

    logConnectorEvent({
      requestId: reqId,
      connectorId: params.connectorId,
      connectorName: params.connectorName,
      durationMs,
      endpoint: params.endpoint,
      method,
      request: {
        headers: params.headers,
        queryParams: params.queryParams,
        body: params.body,
      },
      response: {
        statusCode,
        success: false,
        error: {
          code: err.code || "CONNECTOR_ERROR",
          message: err.message || "Connector execution failed",
          details: err.details || err.stack,
        },
      },
      retryCount: params.retryCount || 0,
      isEmulated: params.isEmulated || false,
    });

    throw err;
  }
}
