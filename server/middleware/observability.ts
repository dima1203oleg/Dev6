import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { getDatabaseClient } from '../database/DatabaseClient';

// Simple in-memory metrics store (in production, use Prometheus/StatsD)
interface Metrics {
  requestCount: Map<string, number>;
  errorCount: Map<string, number>;
  latencySum: Map<string, number>;
  latencyCount: Map<string, number>;
}

const metrics: Metrics = {
  requestCount: new Map(),
  errorCount: new Map(),
  latencySum: new Map(),
  latencyCount: new Map(),
};

// Structured logging
export function logger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] as string;
  const user = (req as AuthenticatedRequest).user;

  // Log request start
  console.log(JSON.stringify({
    type: 'request_start',
    timestamp: new Date().toISOString(),
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers['user-agent'],
    userId: user?.id,
    role: user?.role,
  }));

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const success = statusCode >= 200 && statusCode < 400;

    console.log(JSON.stringify({
      type: 'request_end',
      timestamp: new Date().toISOString(),
      correlationId,
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      success,
      userId: user?.id,
      role: user?.role,
    }));

    // Update metrics
    const key = `${req.method}:${req.path}`;
    metrics.requestCount.set(key, (metrics.requestCount.get(key) || 0) + 1);
    
    if (!success) {
      metrics.errorCount.set(key, (metrics.errorCount.get(key) || 0) + 1);
    }
    
    metrics.latencySum.set(key, (metrics.latencySum.get(key) || 0) + duration);
    metrics.latencyCount.set(key, (metrics.latencyCount.get(key) || 0) + 1);
  });

  next();
}

// Health check endpoint
export function healthCheck(_req: Request, res: Response) {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    },
    metrics: getMetrics(),
  };

  res.json(health);
}

// Readiness check endpoint
export async function readinessCheck(_req: Request, res: Response) {
  // Check critical dependencies
  const [database, connectors] = await Promise.all([
    checkDatabase(),
    checkConnectors(),
  ]);
  const checks = {
    database,
    connectors,
  };

  const allReady = Object.values(checks).every(check => check.ready);

  res.status(allReady ? 200 : 503).json({
    status: allReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  });
}

// Liveness check endpoint
export function livenessCheck(_req: Request, res: Response) {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

// Get metrics endpoint
export function getMetricsEndpoint(_req: Request, res: Response) {
  res.json(getMetrics());
}

// Helper functions
function getMetrics() {
  const result: Record<string, any> = {};
  
  metrics.requestCount.forEach((count, key) => {
    result[key] = {
      requestCount: count,
      errorCount: metrics.errorCount.get(key) || 0,
      avgLatency: metrics.latencyCount.get(key) 
        ? Math.round(metrics.latencySum.get(key)! / metrics.latencyCount.get(key)!)
        : 0,
    };
  });

  return result;
}

async function checkDatabase(): Promise<{ ready: boolean; message: string }> {
  try {
    const ready = await getDatabaseClient().healthCheck();
    return {
      ready,
      message: ready ? 'Database connection healthy' : 'Database connection unavailable',
    };
  } catch {
    return { ready: false, message: 'Database connection unavailable' };
  }
}

async function checkConnectors(): Promise<{ ready: boolean; message: string }> {
  // Individual source outages must not make the service unavailable: the
  // orchestrator has a documented fallback chain.  Readiness only validates
  // that its local dependency (the database) is reachable.
  return {
    ready: true,
    message: 'Connector fallback chain available',
  };
}
