/**
 * Ingestion Run Repository
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Repository for tracking ingestion runs with execution metrics
 */

import { DatabaseClient } from '../DatabaseClient';

export interface IngestionRun {
  run_id: string;
  started_at: Date;
  finished_at?: Date;
  environment: string;
  network_ip?: string;
  network_country?: string;
  source: string;
  datasets_discovered?: number;
  resources_discovered?: number;
  datasets_relevant?: number;
  resources_ingested?: number;
  records_processed?: number;
  records_failed?: number;
  records_skipped?: number;
  duplicates?: number;
  entities_created?: number;
  facts_created?: number;
  evidence_created?: number;
  cards_created?: number;
  cards_passed?: number;
  cards_warning?: number;
  cards_no_data?: number;
  cards_failed?: number;
  truth_tests?: number;
  truth_passed?: number;
  truth_failed?: number;
  production_ready?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class IngestionRunRepository {
  constructor(private db: DatabaseClient) {}

  async create(run: IngestionRun): Promise<void> {
    const query = `
      INSERT INTO ingestion_runs (
        run_id, started_at, environment, network_ip, network_country, source
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await this.db.query(query, [
      run.run_id,
      run.started_at,
      run.environment,
      run.network_ip,
      run.network_country,
      run.source
    ]);
  }

  async findById(runId: string): Promise<IngestionRun | null> {
    const query = 'SELECT * FROM ingestion_runs WHERE run_id = $1';
    const result = await this.db.query(query, [runId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      run_id: row.run_id,
      started_at: row.started_at,
      finished_at: row.finished_at,
      environment: row.environment,
      network_ip: row.network_ip,
      network_country: row.network_country,
      source: row.source,
      datasets_discovered: row.datasets_discovered,
      resources_discovered: row.resources_discovered,
      datasets_relevant: row.datasets_relevant,
      resources_ingested: row.resources_ingested,
      records_processed: row.records_processed,
      records_failed: row.records_failed,
      records_skipped: row.records_skipped,
      duplicates: row.duplicates,
      entities_created: row.entities_created,
      facts_created: row.facts_created,
      evidence_created: row.evidence_created,
      cards_created: row.cards_created,
      cards_passed: row.cards_passed,
      cards_warning: row.cards_warning,
      cards_no_data: row.cards_no_data,
      cards_failed: row.cards_failed,
      truth_tests: row.truth_tests,
      truth_passed: row.truth_passed,
      truth_failed: row.truth_failed,
      production_ready: row.production_ready,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async updateMetrics(runId: string, metrics: Partial<IngestionRun>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(metrics).forEach(([key, value]) => {
      if (key !== 'run_id' && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return;
    }

    values.push(runId);
    const query = `
      UPDATE ingestion_runs
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE run_id = $${paramIndex}
    `;
    
    await this.db.query(query, values);
  }

  async finish(runId: string, productionReady: boolean): Promise<void> {
    const query = `
      UPDATE ingestion_runs
      SET finished_at = NOW(), production_ready = $2, updated_at = NOW()
      WHERE run_id = $1
    `;
    
    await this.db.query(query, [runId, productionReady]);
  }

  async findLatest(): Promise<IngestionRun | null> {
    const query = 'SELECT * FROM ingestion_runs ORDER BY started_at DESC LIMIT 1';
    const result = await this.db.query(query);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      run_id: row.run_id,
      started_at: row.started_at,
      finished_at: row.finished_at,
      environment: row.environment,
      network_ip: row.network_ip,
      network_country: row.network_country,
      source: row.source,
      datasets_discovered: row.datasets_discovered,
      resources_discovered: row.resources_discovered,
      datasets_relevant: row.datasets_relevant,
      resources_ingested: row.resources_ingested,
      records_processed: row.records_processed,
      records_failed: row.records_failed,
      records_skipped: row.records_skipped,
      duplicates: row.duplicates,
      entities_created: row.entities_created,
      facts_created: row.facts_created,
      evidence_created: row.evidence_created,
      cards_created: row.cards_created,
      cards_passed: row.cards_passed,
      cards_warning: row.cards_warning,
      cards_no_data: row.cards_no_data,
      cards_failed: row.cards_failed,
      truth_tests: row.truth_tests,
      truth_passed: row.truth_passed,
      truth_failed: row.truth_failed,
      production_ready: row.production_ready,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
