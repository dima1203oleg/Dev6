/**
 * Evidence Repository
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Repository for evidence with complete provenance tracking
 */

import { DatabaseClient } from '../DatabaseClient';

export interface Evidence {
  evidence_id: string;
  fact_id: string;
  source: string;
  dataset_id: string;
  resource_id: string;
  raw_record_id: string;
  raw_hash: string;
  parser_version?: string;
  mapping_version?: string;
  normalizer_version?: string;
  entity_resolution_version?: string;
  card_contract_version?: string;
  timestamp: Date;
  confidence?: number;
  created_at?: Date;
}

export class EvidenceRepository {
  constructor(private db: DatabaseClient) {}

  async create(evidence: Evidence): Promise<void> {
    const query = `
      INSERT INTO evidence (
        evidence_id, fact_id, source, dataset_id, resource_id, raw_record_id,
        raw_hash, parser_version, mapping_version, normalizer_version,
        entity_resolution_version, card_contract_version, timestamp, confidence
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    
    await this.db.query(query, [
      evidence.evidence_id,
      evidence.fact_id,
      evidence.source,
      evidence.dataset_id,
      evidence.resource_id,
      evidence.raw_record_id,
      evidence.raw_hash,
      evidence.parser_version,
      evidence.mapping_version,
      evidence.normalizer_version,
      evidence.entity_resolution_version,
      evidence.card_contract_version,
      evidence.timestamp,
      evidence.confidence
    ]);
  }

  async findByFactId(factId: string): Promise<Evidence[]> {
    const query = 'SELECT * FROM evidence WHERE fact_id = $1 ORDER BY timestamp DESC';
    const result = await this.db.query(query, [factId]);
    
    return result.rows.map(row => ({
      evidence_id: row.evidence_id,
      fact_id: row.fact_id,
      source: row.source,
      dataset_id: row.dataset_id,
      resource_id: row.resource_id,
      raw_record_id: row.raw_record_id,
      raw_hash: row.raw_hash,
      parser_version: row.parser_version,
      mapping_version: row.mapping_version,
      normalizer_version: row.normalizer_version,
      entity_resolution_version: row.entity_resolution_version,
      card_contract_version: row.card_contract_version,
      timestamp: row.timestamp,
      confidence: row.confidence,
      created_at: row.created_at
    }));
  }

  async findByRawRecordId(rawRecordId: string): Promise<Evidence[]> {
    const query = 'SELECT * FROM evidence WHERE raw_record_id = $1';
    const result = await this.db.query(query, [rawRecordId]);
    
    return result.rows.map(row => ({
      evidence_id: row.evidence_id,
      fact_id: row.fact_id,
      source: row.source,
      dataset_id: row.dataset_id,
      resource_id: row.resource_id,
      raw_record_id: row.raw_record_id,
      raw_hash: row.raw_hash,
      parser_version: row.parser_version,
      mapping_version: row.mapping_version,
      normalizer_version: row.normalizer_version,
      entity_resolution_version: row.entity_resolution_version,
      card_contract_version: row.card_contract_version,
      timestamp: row.timestamp,
      confidence: row.confidence,
      created_at: row.created_at
    }));
  }

  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM evidence';
    const result = await this.db.query(query);
    return parseInt(result.rows[0].count);
  }

  async delete(evidenceId: string): Promise<void> {
    const query = 'DELETE FROM evidence WHERE evidence_id = $1';
    await this.db.query(query, [evidenceId]);
  }
}
