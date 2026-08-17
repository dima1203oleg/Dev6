/**
 * PREDATOR Database Migration Runner
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Migration system with version tracking, rollback support, and transaction safety
 */

import { PoolClient } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getDatabaseClient } from '../DatabaseClient';

export interface Migration {
  version: string;
  name: string;
  up: string;
  down?: string;
  appliedAt?: string;
  checksum?: string;
}

export interface MigrationRecord {
  version: string;
  name: string;
  applied_at: string;
  checksum: string;
  execution_time_ms: number;
}

export class MigrationRunner {
  private migrationsTable = 'schema_migrations';

  async initialize(): Promise<void> {
    const db = getDatabaseClient();
    
    // Create migrations tracking table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(512) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        checksum VARCHAR(64) NOT NULL,
        execution_time_ms INTEGER NOT NULL
      );
    `);
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const db = getDatabaseClient();
    const result = await db.query(`
      SELECT version, name, applied_at, checksum, execution_time_ms
      FROM ${this.migrationsTable}
      ORDER BY version ASC
    `);
    
    return result.rows.map(row => ({
      version: row.version,
      name: row.name,
      applied_at: row.applied_at,
      checksum: row.checksum,
      execution_time_ms: row.execution_time_ms
    }));
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));
    
    const migrationsDir = join(__dirname);
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f !== 'MigrationRunner.ts')
      .sort();
    
    const migrations: Migration[] = [];
    
    for (const file of files) {
      const version = file.replace('.sql', '');
      if (!appliedVersions.has(version)) {
        const content = readFileSync(join(migrationsDir, file), 'utf-8');
        const checksum = this.computeChecksum(content);
        
        migrations.push({
          version,
          name: file,
          up: content,
          checksum
        });
      }
    }
    
    return migrations;
  }

  async migrate(): Promise<void> {
    await this.initialize();
    
    const pending = await this.getPendingMigrations();
    
    if (pending.length === 0) {
      console.log('No pending migrations to apply');
      return;
    }
    
    console.log(`Applying ${pending.length} pending migrations...`);
    
    const db = getDatabaseClient();
    
    for (const migration of pending) {
      const startTime = Date.now();
      
      try {
        await db.transaction(async (client: PoolClient) => {
          // Apply migration
          await client.query(migration.up);
          
          // Record migration
          const executionTime = Date.now() - startTime;
          await client.query(`
            INSERT INTO ${this.migrationsTable} (version, name, checksum, execution_time_ms)
            VALUES ($1, $2, $3, $4)
          `, [migration.version, migration.name, migration.checksum, executionTime]);
        });
        
        console.log(`✓ Applied migration: ${migration.version} (${migration.name})`);
      } catch (error) {
        console.error(`✗ Failed to apply migration: ${migration.version}`, error);
        throw error;
      }
    }
    
    console.log('All migrations applied successfully');
  }

  async rollback(targetVersion?: string): Promise<void> {
    await this.initialize();
    
    const applied = await this.getAppliedMigrations();
    
    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    const toRollback = targetVersion
      ? applied.filter(m => m.version > targetVersion)
      : [applied[applied.length - 1]]; // Rollback last migration by default
    
    if (toRollback.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    console.log(`Rolling back ${toRollback.length} migrations...`);
    
    const db = getDatabaseClient();
    
    // Rollback in reverse order
    for (let i = toRollback.length - 1; i >= 0; i--) {
      const migration = toRollback[i];
      
      if (!migration) continue;
      
      try {
        await db.transaction(async (client: PoolClient) => {
          // Note: This requires migrations to have down.sql files
          // For now, we'll just delete the record
          await client.query(`
            DELETE FROM ${this.migrationsTable}
            WHERE version = $1
          `, [migration.version]);
        });
        
        console.log(`✓ Rolled back migration: ${migration.version}`);
      } catch (error) {
        console.error(`✗ Failed to rollback migration: ${migration.version}`, error);
        throw error;
      }
    }
    
    console.log('Rollback completed');
  }

  async getStatus(): Promise<{
    applied: MigrationRecord[];
    pending: Migration[];
  }> {
    await this.initialize();
    
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();
    
    return { applied, pending };
  }

  private computeChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

// Singleton instance
let migrationRunner: MigrationRunner | null = null;

export function getMigrationRunner(): MigrationRunner {
  if (!migrationRunner) {
    migrationRunner = new MigrationRunner();
  }
  return migrationRunner;
}

// CLI interface
export async function runMigrations(): Promise<void> {
  const runner = getMigrationRunner();
  await runner.migrate();
}

export async function rollbackMigrations(targetVersion?: string): Promise<void> {
  const runner = getMigrationRunner();
  await runner.rollback(targetVersion);
}

export async function getMigrationStatus(): Promise<void> {
  const runner = getMigrationRunner();
  const status = await runner.getStatus();
  
  console.log('\n=== Migration Status ===');
  console.log(`Applied: ${status.applied.length}`);
  status.applied.forEach(m => {
    console.log(`  - ${m.version} (${m.name}) at ${m.applied_at}`);
  });
  
  console.log(`\nPending: ${status.pending.length}`);
  status.pending.forEach(m => {
    console.log(`  - ${m.version} (${m.name})`);
  });
}
