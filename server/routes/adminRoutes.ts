import { Router } from 'express';
import { connectorFactory } from '../datasources/connectors/ConnectorFactory';
import { certificationManager } from '../datasources/connectors/CertificationManager';
import { matrixRunner } from '../datasources/qa/MatrixRunner';

const router = Router();

// ─── SOURCE REGISTRY (Dashboard) ──────────────────────────────────────────
router.get('/sources', async (_req, res) => {
  try {
    const stats = connectorFactory.getDashboardStats();
    const matrix = connectorFactory.getCompatibilityMatrix();
    
    // Enrich with certification status
    const enrichedMatrix = matrix.map(m => ({
      ...m,
      certificationStatus: certificationManager.getCertificationStatus(m.sourceId),
      sourceStatus: certificationManager.getSourceStatus(m.sourceId),
      isProductionGateOpen: 
        m.compatibilityStatus === 'LIVE_OK' && 
        certificationManager.getCertificationStatus(m.sourceId) === 'CERTIFIED'
    }));

    res.json({
      success: true,
      stats,
      sources: enrichedMatrix,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── CONNECTOR QA & PROBE ────────────────────────────────────────────────
router.post('/probe', async (req, res) => {
  const { sourceId, testIdentifier } = req.body;
  if (!sourceId || !testIdentifier) {
    return res.status(400).json({ success: false, error: 'sourceId and testIdentifier required' });
  }

  try {
    const connector = connectorFactory.create(sourceId);
    
    // Run full QA matrix
    const testResults = await matrixRunner.runMatrix(connector, testIdentifier);
    
    // Evaluate certification based on test results
    const certStatus = certificationManager.evaluateCertification(sourceId, testResults, connector);
    
    // Run live probe for stats
    const probeResults = await connectorFactory.runLiveProbe(sourceId, testIdentifier);

    return res.json({
      success: true,
      sourceId,
      certificationStatus: certStatus,
      testResults,
      probeResults,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
