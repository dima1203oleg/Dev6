import { Router } from 'express';
import { osiService } from '../services/OSIService';
import { comintService } from '../services/ComintService';
import { techintService } from '../services/TechintService';
import { medintService } from '../services/MedintService';
import { socintService } from '../services/SocintService';
import { darkintService } from '../services/DarkintService';
import { entityResolutionEngine } from '../services/EntityResolutionEngine';

const router = Router();

// ─── OSI (Open Web Intelligence) ─────────────────────────────────────────
router.get('/osi/whois', async (req, res) => {
  try {
    const domain = req.query.domain as string;
    if (!domain) return res.status(400).json({ error: 'Domain required' });
    const data = await osiService.whoisLookup(domain);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/osi/archive', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: 'URL required' });
    const data = await osiService.archiveLookup(url);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── COMINT (Communication Intelligence) ─────────────────────────────────
router.get('/comint/breach', async (req, res) => {
  try {
    const query = req.query.q as string;
    const type = req.query.type as 'EMAIL' | 'PHONE' | 'DOMAIN';
    if (!query) return res.status(400).json({ error: 'Query required' });
    const data = await comintService.breachScan(query, type || 'EMAIL');
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/comint/phone', async (req, res) => {
  try {
    const phone = req.query.phone as string;
    const data = await comintService.phoneIntel(phone);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/comint/ip', async (req, res) => {
  try {
    const ip = req.query.ip as string;
    const data = await comintService.ipIntel(ip);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/comint/passivedns', async (req, res) => {
  try {
    const domain = req.query.domain as string;
    const data = await comintService.passiveDNS(domain);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── TECHINT (Technical Intelligence) ────────────────────────────────────
router.get('/techint/subdomains', async (req, res) => {
  try {
    const domain = req.query.domain as string;
    const data = await techintService.subdomainEnum(domain);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/techint/ssl', async (req, res) => {
  try {
    const domain = req.query.domain as string;
    const data = await techintService.sslCertDetails(domain);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/techint/fingerprint', async (req, res) => {
  try {
    const url = req.query.url as string;
    const data = await techintService.webTechFingerprint(url);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/techint/ports', async (req, res) => {
  try {
    const ip = req.query.ip as string;
    const data = await techintService.passivePortInfo(ip);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── MEDINT (Media Intelligence) ─────────────────────────────────────────
router.post('/medint/analyze', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });
    const data = await medintService.extractMetadata(imageUrl);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── SOCINT (Social Intelligence) ────────────────────────────────────────
router.get('/socint/github', async (req, res) => {
  try {
    const username = req.query.username as string;
    const data = await socintService.getGithubProfile(username);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// ─── DARKINT (DarkNet Intelligence) - RED ACCESS REQUIRED ──────────────
router.get('/darkint/pastes', async (req, res) => {
  try {
    const keyword = req.query.q as string;
    const data = await darkintService.searchPastes(keyword);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/darkint/ahmia', async (req, res) => {
  try {
    const keyword = req.query.q as string;
    const data = await darkintService.searchAhmia(keyword);
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
