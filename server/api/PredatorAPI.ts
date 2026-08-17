/**
 * PREDATOR API
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Real API integration with database read/write, card endpoints, evidence, provenance
 */

import express, { Request, Response } from 'express';
import { getDatabaseClient, EntityRepository, EvidenceRepository, CardRepository } from '../database/repositories';
import { getDPSConnector } from '../connectors/DPSConnector';
import { getDPSTokenManager } from '../connectors/DPSTokenManager';
import { getDPSRateLimiter } from '../connectors/DPSRateLimiter';
import { getDPSCircuitBreaker } from '../connectors/DPSCircuitBreaker';
import { getDPSCSVIngestion } from '../connectors/DPSCSVIngestion';

const router = express.Router();
const db = getDatabaseClient();

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const healthy = await db.healthCheck();
    res.json({ 
      status: healthy ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ 
      status: 'DEGRADED', 
      message: 'Database unavailable, using fallback mode',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ENTITY ENDPOINTS
// ============================================

router.get('/entities/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    if (!entityId) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Entity ID is required'
      });
    }
    
    const entityRepo = new EntityRepository(db);
    const entity = await entityRepo.findById(entityId);
    
    if (!entity) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: `Entity ${entityId} not found`
      });
    }
    
    return res.json({
      status: 'SUCCESS',
      data: entity
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/entities/type/:entityType', async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    if (!entityType) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Entity type is required'
      });
    }
    
    const entityRepo = new EntityRepository(db);
    const entities = await entityRepo.findByType(entityType);
    
    return res.json({
      status: 'SUCCESS',
      count: entities.length,
      data: entities
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// CARD ENDPOINTS
// ============================================

router.get('/cards/:cardId', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Card ID is required'
      });
    }
    
    const cardRepo = new CardRepository(db);
    const card = await cardRepo.findById(cardId);
    
    if (!card) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: `Card ${cardId} not found`
      });
    }
    
    // Get card fields
    const fields = await cardRepo.findFieldsByCardId(cardId);
    
    return res.json({
      status: 'SUCCESS',
      data: {
        ...card,
        fields
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/cards/entity/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    if (!entityId) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Entity ID is required'
      });
    }
    
    const cardRepo = new CardRepository(db);
    const cards = await cardRepo.findByEntityId(entityId);
    
    return res.json({
      status: 'SUCCESS',
      count: cards.length,
      data: cards
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Alternative endpoint that accepts entity_id as query parameter (for frontend compatibility)
router.get('/cards', async (req: Request, res: Response) => {
  try {
    const { entity_id } = req.query;
    if (!entity_id) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Entity ID is required'
      });
    }
    
    // PRODUCTION MODE: No demo fallback - return real error if database unavailable
    let cards;
    try {
      const cardRepo = new CardRepository(db);
      cards = await cardRepo.findByEntityId(entity_id as string);
    } catch (dbError) {
      console.error('[PredatorAPI] Database unavailable - DATA_UNAVAILABLE');
      return res.status(503).json({ 
        status: 'DATA_UNAVAILABLE',
        message: 'Database connection failed. No demo data available in production mode.',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
    
    return res.json({
      status: 'SUCCESS',
      count: cards.length,
      data: cards
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create card endpoint
router.post('/cards/create', async (req: Request, res: Response) => {
  try {
    const cardData = req.body;
    if (!cardData || !cardData.card_id || !cardData.entity_id || !cardData.card_type) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Card ID, entity ID, and card type are required'
      });
    }
    
    const cardRepo = new CardRepository(db);
    await cardRepo.createCard(cardData);
    
    return res.json({
      status: 'SUCCESS',
      message: 'Card created successfully'
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/cards/field-provenance/:cardId/:fieldName', async (req: Request, res: Response) => {
  try {
    const { cardId, fieldName } = req.params;
    if (!cardId || !fieldName) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Card ID and field name are required'
      });
    }
    
    const cardRepo = new CardRepository(db);
    const fields = await cardRepo.findFieldsByCardId(cardId);
    
    const field = fields.find(f => f.field_name === fieldName);
    
    if (!field) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: `Field ${fieldName} not found in card ${cardId}`
      });
    }
    
    // Get evidence if available
    let evidence = null;
    if (field.evidence_id) {
      const evidenceRepo = new EvidenceRepository(db);
      const evidenceList = await evidenceRepo.findByFactId(field.evidence_id);
      if (evidenceList.length > 0) {
        evidence = evidenceList[0];
      }
    }
    
    return res.json({
      status: 'SUCCESS',
      data: {
        field,
        evidence
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// EVIDENCE ENDPOINTS
// ============================================

router.get('/evidence/fact/:factId', async (req: Request, res: Response) => {
  try {
    const { factId } = req.params;
    if (!factId) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Fact ID is required'
      });
    }
    
    const evidenceRepo = new EvidenceRepository(db);
    const evidence = await evidenceRepo.findByFactId(factId);
    
    return res.json({
      status: 'SUCCESS',
      count: evidence.length,
      data: evidence
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/evidence/raw-record/:rawRecordId', async (req: Request, res: Response) => {
  try {
    const { rawRecordId } = req.params;
    if (!rawRecordId) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Raw record ID is required'
      });
    }
    
    const evidenceRepo = new EvidenceRepository(db);
    const evidence = await evidenceRepo.findByRawRecordId(rawRecordId);
    
    return res.json({
      status: 'SUCCESS',
      count: evidence.length,
      data: evidence
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// SEARCH ENDPOINT
// ============================================

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { identifier, type = 'COMPANY' } = req.query;
    
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Identifier is required'
      });
    }
    
    let entities: any[] = [];
    
    try {
      if (type === 'COMPANY') {
        // Search by EDRPOU
        const result = await db.query(
          'SELECT e.*, c.edrpou FROM entities e JOIN companies c ON e.entity_id = c.entity_id WHERE c.edrpou = $1',
          [identifier]
        );
        entities = result.rows;
      } else if (type === 'PERSON') {
        // Search by IPN
        const result = await db.query(
          'SELECT e.*, p.ipn, p.full_name FROM entities e JOIN persons p ON e.entity_id = p.entity_id WHERE p.ipn = $1',
          [identifier]
        );
        entities = result.rows;
      } else {
        // Generic search
        const result = await db.query(
          "SELECT * FROM entities WHERE canonical_data::text ILIKE $1",
          [`%${identifier}%`]
        );
        entities = result.rows;
      }
    } catch (dbError) {
      console.error('[PredatorAPI] Database unavailable - DATA_UNAVAILABLE');
      return res.status(503).json({ 
        status: 'DATA_UNAVAILABLE',
        message: 'Database connection failed. No demo data available in production mode.',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
    
    return res.json({
      status: 'SUCCESS',
      count: entities.length,
      data: entities
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST Search endpoint (for frontend compatibility)
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Query is required'
      });
    }
    
    let entities: any[] = [];
    
    try {
      // Try database search first
      const result = await db.query(
        "SELECT * FROM entities WHERE canonical_data::text ILIKE $1",
        [`%${query}%`]
      );
      entities = result.rows;
    } catch (dbError) {
      console.error('[PredatorAPI] Database unavailable - DATA_UNAVAILABLE');
      return res.status(503).json({ 
        status: 'DATA_UNAVAILABLE',
        message: 'Database connection failed. No demo data available in production mode.',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
    
    return res.json({
      status: 'SUCCESS',
      count: entities.length,
      results: entities
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// REGISTRY MATRIX / CONNECTOR STATUS
// ============================================

router.get('/connectors', async (_req: Request, res: Response) => {
  try {
    const connectors = [
      {
        id: 'dps-tax-cabinet',
        name: 'ДПС (tax.gov.ua)',
        category: 'TAX',
        status: 'UPSTREAM_MAINTENANCE',
        authority: 'OFFICIAL_GOVERNMENT',
        lastCheck: new Date().toISOString(),
        latency: null,
        records: 0,
        coverage: 'VAT payers, tax registration',
        availability: false,
        message: 'На період дії воєнного стану обмежено доступ до публічних електронних реєстрів'
      },
      {
        id: 'nais-edr-xml',
        name: 'NAIS EDR XML (Мін\'юст)',
        category: 'REGISTRY',
        status: 'NOT_IMPLEMENTED',
        authority: 'OFFICIAL_GOVERNMENT',
        lastCheck: new Date().toISOString(),
        latency: null,
        records: 0,
        coverage: 'FOP, UO entities',
        availability: false,
        message: 'Requires PostgreSQL database for index storage'
      },
      {
        id: 'edr-full',
        name: 'Єдиний державний реєстр (data.gov.ua)',
        category: 'REGISTRY',
        status: 'SOURCE_UNAVAILABLE',
        authority: 'OFFICIAL_GOVERNMENT',
        lastCheck: new Date().toISOString(),
        latency: null,
        records: 0,
        coverage: 'Company registry',
        availability: false,
        message: 'Resource edr_full_registry not found on data.gov.ua'
      },
      {
        id: 'clarity-edr',
        name: 'Clarity Project API',
        category: 'REGISTRY',
        status: 'NOT_IMPLEMENTED',
        authority: 'COMMERCIAL_API',
        lastCheck: new Date().toISOString(),
        latency: null,
        records: 0,
        coverage: 'Company registry',
        availability: false,
        message: 'API integration not yet implemented'
      },
      {
        id: 'court-registry',
        name: 'Судовий реєстр',
        category: 'LEGAL',
        status: 'NOT_IMPLEMENTED',
        authority: 'OFFICIAL_GOVERNMENT',
        lastCheck: new Date().toISOString(),
        latency: null,
        records: 0,
        coverage: 'Court cases',
        availability: false,
        message: 'Connector not yet implemented'
      },
      {
        id: 'rnbo-sanctions',
        name: 'РНБО (sanctions-t.rnbo.gov.ua)',
        category: 'SANCTIONS',
        status: 'NOT_IMPLEMENTED',
        authority: 'OFFICIAL_GOVERNMENT',
        lastCheck: new Date().toISOString(),
        latency: null,
        records: 0,
        coverage: 'Sanctions list',
        availability: false,
        message: 'Connector not yet implemented'
      },
      {
        id: 'ofac-sanctions',
        name: 'OFAC Sanctions',
        category: 'SANCTIONS',
        status: 'NOT_IMPLEMENTED',
        authority: 'OFFICIAL_GOVERNMENT',
        lastCheck: new Date().toISOString(),
        latency: null,
        records: 0,
        coverage: 'US sanctions list',
        availability: false,
        message: 'Connector not yet implemented'
      },
      {
        id: 'eu-sanctions',
        name: 'EU Sanctions',
        category: 'SANCTIONS',
        status: 'NOT_IMPLEMENTED',
        authority: 'OFFICIAL_GOVERNMENT',
        lastCheck: new Date().toISOString(),
        latency: null,
        records: 0,
        coverage: 'EU sanctions list',
        availability: false,
        message: 'Connector not yet implemented'
      }
    ];

    return res.json({
      status: 'SUCCESS',
      count: connectors.length,
      connectors
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/registries', async (_req: Request, res: Response) => {
  try {
    // Alias for /connectors endpoint
    return res.redirect(307, '/connectors');
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// INGESTION RUN ENDPOINTS
// ============================================

router.get('/ingestion/runs/latest', async (_req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM ingestion_runs ORDER BY started_at DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: 'No ingestion runs found'
      });
    }
    
    return res.json({
      status: 'SUCCESS',
      data: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/ingestion/runs/:runId', async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    if (!runId) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Run ID is required'
      });
    }
    
    const result = await db.query('SELECT * FROM ingestion_runs WHERE run_id = $1', [runId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: `Ingestion run ${runId} not found`
      });
    }
    
    return res.json({
      status: 'SUCCESS',
      data: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// DPS CONNECTOR ENDPOINTS
// ============================================

router.get('/dps/health', async (_req: Request, res: Response) => {
  try {
    const dpsConnector = getDPSConnector();
    const healthStatus = await dpsConnector.health_check();
    
    return res.json({
      status: 'SUCCESS',
      connector: 'ua.dps',
      health: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/dps/fetch/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const { registry = 'registration' } = req.query;
    
    if (!identifier) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Identifier is required'
      });
    }
    
    const dpsConnector = getDPSConnector();
    const result = await dpsConnector.fetch(identifier, registry as string);
    
    return res.json({
      status: 'SUCCESS',
      data: result
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/dps/token/quota', async (_req: Request, res: Response) => {
  try {
    const tokenManager = getDPSTokenManager();
    const quotaStatus = tokenManager.getQuotaStatus();
    
    return res.json({
      status: 'SUCCESS',
      data: quotaStatus
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/dps/rate-limit/status', async (_req: Request, res: Response) => {
  try {
    const rateLimiter = getDPSRateLimiter();
    const status = rateLimiter.getStatus();
    
    return res.json({
      status: 'SUCCESS',
      data: status
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/dps/circuit-breaker/status', async (_req: Request, res: Response) => {
  try {
    const circuitBreaker = getDPSCircuitBreaker();
    const status = circuitBreaker.getStatus();
    
    return res.json({
      status: 'SUCCESS',
      data: status
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/dps/csv/ingest/:exportType', async (req: Request, res: Response) => {
  try {
    const { exportType } = req.params;
    
    if (!exportType) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: 'Export type is required'
      });
    }
    
    const validExportTypes = ['pdv', 'reestr_edpod', 'reestr_searpse', 'reestr_operac_z_tov', 'reestr_nuo', 'rro_cso'];
    if (!validExportTypes.includes(exportType)) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        message: `Invalid export type. Valid types: ${validExportTypes.join(', ')}`
      });
    }
    
    const csvIngestion = getDPSCSVIngestion();
    const result = await csvIngestion.ingestCSV(exportType as any);
    
    return res.json({
      status: 'SUCCESS',
      data: result
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
