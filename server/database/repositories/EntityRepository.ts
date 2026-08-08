/**
 * Entity Repository
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Repository for canonical entities with CRUD operations
 */

import { DatabaseClient } from '../DatabaseClient';

export interface Entity {
  entity_id: string;
  entity_type: string;
  canonical_data: any;
  confidence?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class EntityRepository {
  constructor(private db: DatabaseClient) {}

  async create(entity: Entity): Promise<void> {
    const query = `
      INSERT INTO entities (entity_id, entity_type, canonical_data, confidence)
      VALUES ($1, $2, $3, $4)
    `;
    
    await this.db.query(query, [
      entity.entity_id,
      entity.entity_type,
      JSON.stringify(entity.canonical_data),
      entity.confidence
    ]);
  }

  async findById(entityId: string): Promise<Entity | null> {
    const query = 'SELECT * FROM entities WHERE entity_id = $1';
    const result = await this.db.query(query, [entityId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      entity_id: row.entity_id,
      entity_type: row.entity_type,
      canonical_data: row.canonical_data,
      confidence: row.confidence,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async findByType(entityType: string): Promise<Entity[]> {
    const query = 'SELECT * FROM entities WHERE entity_type = $1';
    const result = await this.db.query(query, [entityType]);
    
    return result.rows.map(row => ({
      entity_id: row.entity_id,
      entity_type: row.entity_type,
      canonical_data: row.canonical_data,
      confidence: row.confidence,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  async update(entity: Entity): Promise<void> {
    const query = `
      UPDATE entities
      SET canonical_data = $2, confidence = $3, updated_at = NOW()
      WHERE entity_id = $1
    `;
    
    await this.db.query(query, [
      entity.entity_id,
      JSON.stringify(entity.canonical_data),
      entity.confidence
    ]);
  }

  async upsert(entity: Entity): Promise<void> {
    await this.db.upsert('entities', entity, ['entity_id']);
  }

  async delete(entityId: string): Promise<void> {
    const query = 'DELETE FROM entities WHERE entity_id = $1';
    await this.db.query(query, [entityId]);
  }

  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM entities';
    const result = await this.db.query(query);
    return parseInt(result.rows[0].count);
  }

  async countByType(entityType: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM entities WHERE entity_type = $1';
    const result = await this.db.query(query, [entityType]);
    return parseInt(result.rows[0].count);
  }
}
