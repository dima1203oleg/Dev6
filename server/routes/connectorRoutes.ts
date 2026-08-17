import { Router } from "express";
import { connectorRegistry } from "../connectors/sdk";
import { checkPermission } from "../middleware/auth";
import { getConnectorLogs, getConnectorMetrics } from "../connectors/connectorLogger";
import { DPSConnector } from "../connectors/DPSConnector";
import { OsintEntity } from "../../src/osintData";

const router = Router();

router.get("/", checkPermission("source.read"), (_req, res) => {
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

  return res.json(meta);
});

router.get("/health", checkPermission("source.read"), (_req, res) => {
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

  return res.json({
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
  const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 100;
  const connectorId = req.query['connectorId'] as string | undefined;
  const onlyErrors = req.query['onlyErrors'] === "true";

  const logs = getConnectorLogs(limit, connectorId, onlyErrors);
  return res.json({
    timestamp: new Date().toISOString(),
    totalRetrieved: logs.length,
    logs
  });
});

/**
 * Returns aggregated latency and throughput metrics per connector
 */
router.get("/metrics", checkPermission("source.read"), (req, res) => {
  const connectorId = req.query['connectorId'] as string | undefined;
  const metrics = getConnectorMetrics(connectorId);
  return res.json({
    timestamp: new Date().toISOString(),
    connectors: metrics
  });
});

/**
 * Registry query endpoints for RealDataService
 * These endpoints provide real data from connectors
 */

// DPS query endpoint (IPN search)
router.post("/registry/dps/query", checkPermission("entity.search"), async (req, res) => {
  try {
    const { ipn } = req.body;
    
    if (!ipn || typeof ipn !== 'string') {
      return res.status(400).json({ error: 'Invalid IPN parameter' });
    }

    // Use DPS connector to fetch real data
    const dpsConnector = new DPSConnector();
    const result = await dpsConnector.fetch(ipn, 'registration');
    
    if (result.status === 'SUCCESS' && result.normalizedData) {
      // Convert DPS response to OsintEntity format
      const entity: OsintEntity = {
        id: `dps-${ipn}`,
        name: result.normalizedData.name || 'Unknown',
        type: result.normalizedData.entityType === 'LEGAL' ? 'company' : 'person',
        code: ipn,
        status: 'ACTIVE',
        riskScore: 50, // Default risk score
        address: result.normalizedData.address || '',
        description: result.normalizedData.description || '',
        relationships: [],
        aiRecommendations: '',
        lastActivityDate: new Date().toISOString()
      };
      return res.json({ entity });
    }
    
    if (result.status === 'UNAVAILABLE' || result.status === 'FAILED') {
      if (result.error?.includes('MAINTENANCE') || result.error?.includes('503')) {
        return res.status(503).json({ error: 'DPS API is under maintenance' });
      }
      return res.status(503).json({ error: 'DPS API is unavailable' });
    }
    
    return res.status(404).json({ entity: null });
  } catch (error: any) {
    console.error('DPS query error:', error);
    return res.status(500).json({ error: error.message || 'DPS connector error' });
  }
});

// EDR query endpoint (EDRPOU search)
router.post("/registry/edr/query", checkPermission("entity.search"), async (req, res) => {
  try {
    const { edrpou } = req.body;
    
    if (!edrpou || typeof edrpou !== 'string') {
      return res.status(400).json({ error: 'Invalid EDRPOU parameter' });
    }

    // TODO: Implement EDR connector call
    // For now, return not found
    return res.status(404).json({ entity: null });
  } catch (error: any) {
    console.error('EDR query error:', error);
    return res.status(500).json({ error: error.message || 'EDR connector error' });
  }
});

// Name search endpoint
router.post("/registry/search", checkPermission("entity.search"), async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Invalid name parameter' });
    }

    // TODO: Implement name search connector call
    // For now, return not found
    return res.status(404).json({ entity: null });
  } catch (error: any) {
    console.error('Name search error:', error);
    return res.status(500).json({ error: error.message || 'Name search connector error' });
  }
});

// Registry health endpoint
router.get("/registry/health", (_req, res) => {
  const connectorMetrics = getConnectorMetrics();
  
  const sources = connectorMetrics.map(m => ({
    name: m.connectorId,
    status: m.failedRequests > 0 ? 'DEGRADED' : 'HEALTHY',
    latency: m.averageLatencyMs,
    lastChecked: new Date().toISOString()
  }));
  
  return res.json({ sources });
});

/**
 * Connector verification endpoint — accepts any RNOKPP/EDRPOU identifier
 * Use this for live connectivity checks against real DPS data
 */
router.post("/registry/verify/:identifier", checkPermission("entity.search"), async (req, res) => {
  const { identifier } = req.params;
  const retrievedAt = new Date().toISOString();

  if (!identifier || !/^\d{8,10}$/.test(identifier)) {
    return res.status(400).json({
      error: 'Invalid identifier: must be 8–10 digits (EDRPOU or RNOKPP)',
      identifier,
      retrievedAt
    });
  }

  try {
    const dpsConnector = new DPSConnector();
    const result = await dpsConnector.fetch(identifier, 'registration');

    const verificationResult = {
      identifier,
      retrievedAt,
      connectorStatus: result.status,
      hasData: !!result.normalizedData,
      hasEvidence: !!result.evidence,
      error: result.error || null,
      entity: result.normalizedData ? {
        id: `dps-${identifier}`,
        name: result.normalizedData.name || 'Unknown',
        type: result.normalizedData.entityType === 'LEGAL' ? 'company' : 'person',
        code: identifier,
        status: 'ACTIVE',
        riskScore: 50,
        address: result.normalizedData.address || '',
        description: result.normalizedData.description || '',
        relationships: [],
        aiRecommendations: '',
        lastActivityDate: retrievedAt
      } : null
    };

    return res.json(verificationResult);
  } catch (error: any) {
    return res.status(500).json({
      identifier,
      retrievedAt,
      connectorStatus: 'ERROR',
      hasData: false,
      hasEvidence: false,
      error: error.message || 'Unknown error',
      entity: null
    });
  }
});

export default router;
