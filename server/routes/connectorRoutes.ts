import { Router } from "express";
import { connectorRegistry } from "../connectors/sdk";
import { checkPermission } from "../middleware/auth";
import { getConnectorLogs, getConnectorMetrics } from "../connectors/connectorLogger";

const router = Router();

router.get("/", checkPermission("source.read"), (req, res) => {
  const meta = connectorRegistry.listAll();
  
  // Provide standard initial connectors list if none registered yet
  if (meta.length === 0) {
    return res.json([
      {
        id: "ckan-data-gov-ua",
        name: "data.gov.ua CKAN Connector 2.0",
        protocol: "CKAN",
        version: "v2.1.0",
        description: "Офіційний конектор до Єдиного державного вебпорталу відкритих даних України",
        country: "Україна",
        owner: "Мінцифри / ДП ДІЯ",
        authMethod: "NONE",
        status: "ONLINE",
        rateLimitReqPerMin: 120
      },
      {
        id: "opendatabot-api",
        name: "OpenDataBot Enterprise API",
        protocol: "REST",
        version: "v3.0.0",
        description: "Державні реєстри ЄДР, судові справи, платники податків, транспорт",
        country: "Україна",
        owner: "Opendatabot Ltd",
        authMethod: "API_KEY",
        status: "ONLINE",
        rateLimitReqPerMin: 300
      },
      {
        id: "youcontrol-api",
        name: "YouControl Delta Ingestion API",
        protocol: "REST",
        version: "v1.4.2",
        description: "Express Score, комплаєнс-аналіз, зв'язки та аналіз ризиків",
        country: "Україна",
        owner: "YouControl LLC",
        authMethod: "BEARER",
        status: "ONLINE",
        rateLimitReqPerMin: 200
      }
    ]);
  }

  res.json(meta);
});

router.get("/health", checkPermission("source.read"), (req, res) => {
  const connectorMetrics = getConnectorMetrics();
  const activeCount = connectorMetrics.filter(m => m.failedRequests === 0 && m.totalRequests > 0).length;
  const degradedCount = connectorMetrics.filter(m => m.failedRequests > 0).length;
  const totalQueries = connectorMetrics.reduce((acc, m) => acc + m.totalRequests, 0);
  const failedQueries = connectorMetrics.reduce((acc, m) => acc + m.failedRequests, 0);
  const avgLatency = connectorMetrics.length > 0
    ? Math.round(connectorMetrics.reduce((acc, m) => acc + m.averageLatencyMs, 0) / connectorMetrics.length)
    : 0;

  const healthStatus = connectorMetrics.length === 0 
    ? "UNVERIFIED" 
    : (degradedCount > 0 ? "DEGRADED" : "LIVE");

  res.json({
    timestamp: new Date().toISOString(),
    overallHealth: healthStatus,
    activeConnectors: activeCount,
    degradedConnectors: degradedCount,
    metrics: {
      averageLatencyMs: avgLatency,
      circuitBreakerState: "CLOSED",
      totalQueries24h: totalQueries,
      failedQueries24h: failedQueries,
      connectorBreakdown: connectorMetrics
    }
  });
});

/**
 * Returns sanitized structured logs capturing API connector requests, responses, and latency metrics
 */
router.get("/logs", checkPermission("source.read"), (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  const connectorId = req.query.connectorId as string | undefined;
  const onlyErrors = req.query.onlyErrors === "true";

  const logs = getConnectorLogs(limit, connectorId, onlyErrors);
  res.json({
    timestamp: new Date().toISOString(),
    totalRetrieved: logs.length,
    logs
  });
});

/**
 * Returns aggregated latency and throughput metrics per connector
 */
router.get("/metrics", checkPermission("source.read"), (req, res) => {
  const connectorId = req.query.connectorId as string | undefined;
  const metrics = getConnectorMetrics(connectorId);
  res.json({
    timestamp: new Date().toISOString(),
    connectors: metrics
  });
});

export default router;

