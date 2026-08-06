import { Router } from 'express';
import {
  fetchEdrFull,
  fetchTaxStatus,
  fetchCourtAndLegalProfile,
  fetchSanctionsAndCompliance,
  fetchLicensesAndRegistries,
  calculateDeterministicRiskScore,
} from '../datasources';

const router = Router();

// Helper to handle DataSourceResult and map to proper HTTP status codes
function sendDataSourceResponse(res: any, result: any) {
  if (result.ok) {
    return res.status(200).json(result);
  }

  const code = result.error?.code;
  let statusCode = 500;

  if (code === 'BAD_REQUEST') statusCode = 400;
  else if (code === 'CREDENTIALS_MISSING') statusCode = 401;
  else if (code === 'NO_RECORDS') statusCode = 204;
  else if (code === 'RATE_LIMITED') statusCode = 429;
  else if (code === 'UPSTREAM_FAILURE' || code === 'TIMEOUT') statusCode = 503;

  if (statusCode === 204) {
    return res.status(204).send();
  }

  return res.status(statusCode).json(result);
}

// EDR Full Profile
router.get('/edr/full', async (req, res) => {
  const code = (req.query.code || req.query.edrpou) as string;
  const result = await fetchEdrFull(code);
  return sendDataSourceResponse(res, result);
});

// Tax Status
router.get('/tax/status', async (req, res) => {
  const code = (req.query.code || req.query.edrpou) as string;
  const result = await fetchTaxStatus(code);
  return sendDataSourceResponse(res, result);
});

// Court & Enforcement Profile
router.get('/court/profile', async (req, res) => {
  const code = (req.query.code || req.query.edrpou) as string;
  const result = await fetchCourtAndLegalProfile(code);
  return sendDataSourceResponse(res, result);
});

// Sanctions & Compliance Profile
router.get('/sanctions/compliance', async (req, res) => {
  const code = (req.query.code || req.query.edrpou) as string;
  const result = await fetchSanctionsAndCompliance(code);
  return sendDataSourceResponse(res, result);
});

// State Registries & Licenses Profile
router.get('/licenses/registries', async (req, res) => {
  const code = (req.query.code || req.query.edrpou) as string;
  const result = await fetchLicensesAndRegistries(code);
  return sendDataSourceResponse(res, result);
});

// Full Company Dossier & Risk Evaluation
router.get('/company/dossier', async (req, res) => {
  const code = (req.query.code || req.query.edrpou) as string;
  if (!code) {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Параметр code або edrpou є обов\'язковим.',
        attemptedAt: new Date().toISOString(),
      },
    });
  }

  const [edrRes, taxRes, courtRes, sanctionsRes, licensesRes] = await Promise.all([
    fetchEdrFull(code),
    fetchTaxStatus(code),
    fetchCourtAndLegalProfile(code),
    fetchSanctionsAndCompliance(code),
    fetchLicensesAndRegistries(code),
  ]);

  const edr = edrRes.ok ? edrRes.data : undefined;
  const tax = taxRes.ok ? taxRes.data : undefined;
  const legal = courtRes.ok ? courtRes.data : undefined;
  const sanctions = sanctionsRes.ok ? sanctionsRes.data : undefined;
  const licenses = licensesRes.ok ? licensesRes.data : undefined;

  const riskResult = calculateDeterministicRiskScore(code, edr, tax, legal, sanctions, licenses);

  return res.status(200).json({
    ok: true,
    data: {
      edrpou: code,
      edr,
      tax,
      legal,
      sanctions,
      licenses,
      risk: riskResult,
    },
    provenance: {
      source: 'PREDATOR Multi-Registry Unified Dossier Engine',
      sourceUrl: `https://data.gov.ua/dataset/edr?code=${code}`,
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    },
  });
});

export default router;
