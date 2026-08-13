/**
 * PREDATOR RDP Database Client
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * PostgreSQL client with connection pooling, transactions, and error handling
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class DatabaseClient {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ...config
    };

    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: this.config.max,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      client.release();
      console.log('Database connection established');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    console.log('Database connection closed');
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async upsert(table: string, data: any, conflictColumns: string[]): Promise<void> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const conflictClause = conflictColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (${conflictColumns.join(', ')})
      DO UPDATE SET ${conflictClause}
    `;
    
    await this.query(query, values);
  }

  async initializeSchema(): Promise<void> {
    try {
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');
      
      await this.query(schema);
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Schema initialization failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  getPool(): Pool {
    return this.pool;
  }
}

// Singleton instance
let dbClient: DatabaseClient | null = null;

export function getDatabaseClient(): DatabaseClient {
  if (!dbClient) {
    const config: DatabaseConfig = {
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'predator',
      user: process.env['DB_USER'] || 'dima1203',
      password: process.env['DB_PASSWORD'] || '',
      ssl: process.env['DB_SSL'] === 'true'
    };

    dbClient = new DatabaseClient(config);
  }

  return dbClient;
}

export async function initializeDatabase(): Promise<void> {
  const client = getDatabaseClient();
  await client.connect();
  await client.initializeSchema();
}
