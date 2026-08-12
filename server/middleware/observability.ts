import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

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
export function healthCheck(req: Request, res: Response) {
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
export function readinessCheck(req: Request, res: Response) {
  // Check critical dependencies
  const checks = {
    database: checkDatabase(),
    connectors: checkConnectors(),
  };

  const allReady = Object.values(checks).every(check => check.ready);

  res.status(allReady ? 200 : 503).json({
    status: allReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  });
}

// Liveness check endpoint
export function livenessCheck(req: Request, res: Response) {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

// Get metrics endpoint
export function getMetricsEndpoint(req: Request, res: Response) {
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

function checkDatabase() {
  // In production, check actual database connection
  return {
    ready: true,
    message: 'Database connection healthy',
  };
}

function checkConnectors() {
  // In production, check connector health
  return {
    ready: true,
    message: 'Connectors operational',
  };
}
