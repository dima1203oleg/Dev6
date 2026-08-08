/**
 * PREDATOR API
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Real API integration with database read/write, card endpoints, evidence, provenance
 */

import express, { Request, Response } from 'express';
import { getDatabaseClient, EntityRepository, EvidenceRepository, CardRepository } from '../database/repositories';

const router = express.Router();
const db = getDatabaseClient();

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthy = await db.healthCheck();
    res.json({ 
      status: healthy ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'UNHEALTHY', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// ============================================
// ENTITY ENDPOINTS
// ============================================

router.get('/entities/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const entityRepo = new EntityRepository(db);
    const entity = await entityRepo.findById(entityId);
    
    if (!entity) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: `Entity ${entityId} not found`
      });
    }
    
    res.json({
      status: 'SUCCESS',
      data: entity
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/entities/type/:entityType', async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const entityRepo = new EntityRepository(db);
    const entities = await entityRepo.findByType(entityType);
    
    res.json({
      status: 'SUCCESS',
      count: entities.length,
      data: entities
    });
  } catch (error) {
    res.status(500).json({ 
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
    
    res.json({
      status: 'SUCCESS',
      data: {
        ...card,
        fields
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/cards/entity/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const cardRepo = new CardRepository(db);
    const cards = await cardRepo.findByEntityId(entityId);
    
    res.json({
      status: 'SUCCESS',
      count: cards.length,
      data: cards
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/cards/field-provenance/:cardId/:fieldName', async (req: Request, res: Response) => {
  try {
    const { cardId, fieldName } = req.params;
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
    
    res.json({
      status: 'SUCCESS',
      data: {
        field,
        evidence
      }
    });
  } catch (error) {
    res.status(500).json({ 
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
    const evidenceRepo = new EvidenceRepository(db);
    const evidence = await evidenceRepo.findByFactId(factId);
    
    res.json({
      status: 'SUCCESS',
      count: evidence.length,
      data: evidence
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/evidence/raw-record/:rawRecordId', async (req: Request, res: Response) => {
  try {
    const { rawRecordId } = req.params;
    const evidenceRepo = new EvidenceRepository(db);
    const evidence = await evidenceRepo.findByRawRecordId(rawRecordId);
    
    res.json({
      status: 'SUCCESS',
      count: evidence.length,
      data: evidence
    });
  } catch (error) {
    res.status(500).json({ 
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
    const { identifier, type } = req.query;
    
    if (!identifier) {
      return res.status(400).json({ 
        status: 'ERROR',
        message: 'identifier parameter is required'
      });
    }
    
    const entityRepo = new EntityRepository(db);
    let entities = [];
    
    if (type === 'COMPANY') {
      // Search by EDRPOU
      const result = await db.query(
        'SELECT e.*, c.edrpou, c.company_name FROM entities e JOIN companies c ON e.entity_id = c.entity_id WHERE c.edrpou = $1',
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
    
    res.json({
      status: 'SUCCESS',
      count: entities.length,
      data: entities
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// INGESTION RUN ENDPOINTS
// ============================================

router.get('/ingestion/runs/latest', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM ingestion_runs ORDER BY started_at DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: 'No ingestion runs found'
      });
    }
    
    res.json({
      status: 'SUCCESS',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/ingestion/runs/:runId', async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const result = await db.query('SELECT * FROM ingestion_runs WHERE run_id = $1', [runId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: `Ingestion run ${runId} not found`
      });
    }
    
    res.json({
      status: 'SUCCESS',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
