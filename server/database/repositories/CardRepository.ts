/**
 * Card Repository
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Repository for card instances with contract validation
 */

import { DatabaseClient } from '../DatabaseClient';

export interface CardInstance {
  card_id: string;
  entity_id: string;
  card_type: string;
  card_data: any;
  status: 'PASS' | 'WARNING' | 'NO_DATA' | 'SOURCE_UNAVAILABLE' | 'AUTH_ERROR' | 'RATE_LIMIT' | 
          'SCHEMA_DRIFT' | 'MAPPING_ERROR' | 'NORMALIZATION_ERROR' | 'ENTITY_RESOLUTION_ERROR' | 
          'DATABASE_ERROR' | 'API_INTEGRATION_ERROR' | 'CARD_INTEGRATION_ERROR' | 'DATA_TRUTH_FAILURE';
  minimum_confidence?: number;
  actual_confidence?: number;
  empty_allowed?: boolean;
  empty_reason?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CardField {
  card_id: string;
  field_name: string;
  field_value?: string;
  field_status: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL';
  field_confidence?: number;
  evidence_id?: string;
  validation_result?: any;
  created_at?: Date;
  updated_at?: Date;
}

export class CardRepository {
  constructor(private db: DatabaseClient) {}

  async createCard(card: CardInstance): Promise<void> {
    const query = `
      INSERT INTO card_instances (
        card_id, entity_id, card_type, card_data, status,
        minimum_confidence, actual_confidence, empty_allowed, empty_reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    await this.db.query(query, [
      card.card_id,
      card.entity_id,
      card.card_type,
      JSON.stringify(card.card_data),
      card.status,
      card.minimum_confidence,
      card.actual_confidence,
      card.empty_allowed,
      card.empty_reason
    ]);
  }

  async findById(cardId: string): Promise<CardInstance | null> {
    const query = 'SELECT * FROM card_instances WHERE card_id = $1';
    const result = await this.db.query(query, [cardId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      card_id: row.card_id,
      entity_id: row.entity_id,
      card_type: row.card_type,
      card_data: row.card_data,
      status: row.status,
      minimum_confidence: row.minimum_confidence,
      actual_confidence: row.actual_confidence,
      empty_allowed: row.empty_allowed,
      empty_reason: row.empty_reason,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async findByEntityId(entityId: string): Promise<CardInstance[]> {
    const query = 'SELECT * FROM card_instances WHERE entity_id = $1';
    const result = await this.db.query(query, [entityId]);
    
    return result.rows.map(row => ({
      card_id: row.card_id,
      entity_id: row.entity_id,
      card_type: row.card_type,
      card_data: row.card_data,
      status: row.status,
      minimum_confidence: row.minimum_confidence,
      actual_confidence: row.actual_confidence,
      empty_allowed: row.empty_allowed,
      empty_reason: row.empty_reason,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  async updateCardStatus(cardId: string, status: CardInstance['status'], emptyReason?: string): Promise<void> {
    const query = `
      UPDATE card_instances
      SET status = $2, empty_reason = $3, updated_at = NOW()
      WHERE card_id = $1
    `;
    
    await this.db.query(query, [cardId, status, emptyReason]);
  }

  async createField(field: CardField): Promise<void> {
    const query = `
      INSERT INTO card_fields (card_id, field_name, field_value, field_status, field_confidence, evidence_id, validation_result)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    await this.db.query(query, [
      field.card_id,
      field.field_name,
      field.field_value,
      field.field_status,
      field.field_confidence,
      field.evidence_id,
      field.validation_result ? JSON.stringify(field.validation_result) : null
    ]);
  }

  async findFieldsByCardId(cardId: string): Promise<CardField[]> {
    const query = 'SELECT * FROM card_fields WHERE card_id = $1 ORDER BY field_name';
    const result = await this.db.query(query, [cardId]);
    
    return result.rows.map(row => ({
      card_id: row.card_id,
      field_name: row.field_name,
      field_value: row.field_value,
      field_status: row.field_status,
      field_confidence: row.field_confidence,
      evidence_id: row.evidence_id,
      validation_result: row.validation_result,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  async updateFieldStatus(cardId: string, fieldName: string, status: CardField['field_status'], fieldValue?: string): Promise<void> {
    const query = `
      UPDATE card_fields
      SET field_status = $3, field_value = $4, updated_at = NOW()
      WHERE card_id = $1 AND field_name = $2
    `;
    
    await this.db.query(query, [cardId, fieldName, status, fieldValue]);
  }

  async countByStatus(status: CardInstance['status']): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM card_instances WHERE status = $1';
    const result = await this.db.query(query, [status]);
    return parseInt(result.rows[0].count);
  }

  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM card_instances';
    const result = await this.db.query(query);
    return parseInt(result.rows[0].count);
  }
}
