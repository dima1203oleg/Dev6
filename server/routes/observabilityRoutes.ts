/**
 * Observability Routes for PREDATOR Analytics System
 * 
 * Provides endpoints for metrics, alerts, and health checks.
 */

import express from 'express';
import { metricsCollector } from '../observability/MetricsCollector';
import { alertManager, AlertSeverity, AlertCategory } from '../observability/AlertManager';

const router = express.Router();

/**
 * GET /metrics
 * Returns metrics in Prometheus format
 */
router.get('/metrics', (_req, res) => {
  try {
    const metrics = metricsCollector.getPrometheusMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error: any) {
    console.error('[Metrics] Error generating metrics:', error);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

/**
 * GET /metrics/summary
 * Returns metrics summary statistics
 */
router.get('/metrics/summary', (_req, res) => {
  try {
    const summary = metricsCollector.getSummary();
    res.json(summary);
  } catch (error: any) {
    console.error('[Metrics] Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get metrics summary' });
  }
});

/**
 * GET /metrics/history
 * Returns metric history
 */
router.get('/metrics/history', (req, res) => {
  try {
    const { name, limit } = req.query;
    const history = metricsCollector.getMetricHistory(
      name as string,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(history);
  } catch (error: any) {
    console.error('[Metrics] Error getting history:', error);
    res.status(500).json({ error: 'Failed to get metrics history' });
  }
});

/**
 * GET /alerts
 * Returns alerts (active by default)
 */
router.get('/alerts', (req, res) => {
  try {
    const { severity, category, source, all } = req.query;
    
    if (all === 'true') {
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : undefined;
      const alerts = alertManager.getAllAlerts(limit);
      res.json(alerts);
    } else {
      const alerts = alertManager.getActiveAlerts({
        severity: severity as AlertSeverity,
        category: category as AlertCategory,
        source: source as string,
      });
      res.json(alerts);
    }
  } catch (error: any) {
    console.error('[Alerts] Error getting alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * POST /alerts/:id/resolve
 * Resolves an alert
 */
router.post('/alerts/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    alertManager.resolveAlert(id);
    res.json({ success: true, message: 'Alert resolved' });
  } catch (error: any) {
    console.error('[Alerts] Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

/**
 * GET /alerts/statistics
 * Returns alert statistics
 */
router.get('/alerts/statistics', (_req, res) => {
  try {
    const stats = alertManager.getStatistics();
    res.json(stats);
  } catch (error: any) {
    console.error('[Alerts] Error getting statistics:', error);
    res.status(500).json({ error: 'Failed to get alert statistics' });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: metricsCollector.getSummary(),
    alerts: alertManager.getStatistics(),
  };
  res.json(health);
});

/**
 * GET /health/live
 * Liveness probe
 */
router.get('/health/live', (_req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * GET /health/ready
 * Readiness probe
 */
router.get('/health/ready', (_req, res) => {
  // Check if critical services are ready
  const isReady = true; // TODO: Add actual readiness checks
  
  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

export default router;
