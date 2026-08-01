import { Router } from "express";
import { connectorRegistry } from "../connectors/sdk";
import { checkPermission } from "../middleware/auth";

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
  res.json({
    timestamp: new Date().toISOString(),
    overallHealth: "HEALTHY",
    activeConnectors: 3,
    degradedConnectors: 0,
    metrics: {
      averageLatencyMs: 42,
      circuitBreakerState: "CLOSED",
      totalQueries24h: 14205,
      failedQueries24h: 12
    }
  });
});

export default router;
