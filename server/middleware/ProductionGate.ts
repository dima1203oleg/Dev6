/**
 * PREDATOR MLIP — Production Gate Middleware
 * Blocks access to sources that are not CERTIFIED or have failing health checks.
 */
import { Request, Response, NextFunction } from 'express';
import { certificationManager } from '../datasources/connectors/CertificationManager';
import { connectorFactory } from '../datasources/connectors/ConnectorFactory';

export function productionGateMiddleware(req: Request, res: Response, next: NextFunction) {
  const sourceId = req.params['sourceId'] || req.query['sourceId'] as string;
  
  if (!sourceId) {
    // If no specific source is targeted, just proceed (e.g. multi-search)
    return next();
  }

  const certStatus = certificationManager.getCertificationStatus(sourceId);
  const healthStatus = certificationManager.getSourceStatus(sourceId);

  // 1. Check Certification
  if (certStatus !== 'CERTIFIED') {
    return res.status(403).json({
      error: 'PRODUCTION_GATE_BLOCKED',
      message: `Source ${sourceId} is not CERTIFIED for production use. Status: ${certStatus}`,
      sourceId,
    });
  }

  // 2. Check Health
  if (healthStatus === 'OFFLINE' || healthStatus === 'SCHEMA_DRIFT' || healthStatus === 'AUTH_FAILED') {
    return res.status(503).json({
      error: 'PRODUCTION_GATE_BLOCKED',
      message: `Source ${sourceId} is failing health checks. Status: ${healthStatus}`,
      sourceId,
    });
  }

  // 3. Verify Connector Exists in Factory
  try {
    connectorFactory.create(sourceId);
  } catch {
    return res.status(404).json({
      error: 'PRODUCTION_GATE_BLOCKED',
      message: `Source ${sourceId} has no active production connector loaded.`,
      sourceId,
    });
  }

  // All checks passed
  next();
}
