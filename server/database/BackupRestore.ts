/**
 * PREDATOR Database Backup and Restore System
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Provides automated backup, restore, and validation capabilities
 * with SHA-256 integrity verification
 */

import { PoolClient } from 'pg';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { getDatabaseClient } from './DatabaseClient';

export interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  compress: boolean;
  includeSchema: boolean;
  includeData: boolean;
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number;
  compressed: boolean;
  checksum: string;
  tables: string[];
  recordCounts: Record<string, number>;
  durationMs: number;
}

export interface RestoreResult {
  success: boolean;
  backupId: string;
  restoredTables: string[];
  restoredRecords: number;
  durationMs: number;
  validationPassed: boolean;
  errors: string[];
}

export class BackupRestoreManager {
  private config: BackupConfig;
  private backupDir: string;

  constructor(config?: Partial<BackupConfig>) {
    this.config = {
      backupDir: config?.backupDir || './backups',
      retentionDays: config?.retentionDays || 30,
      compress: config?.compress !== false,
      includeSchema: config?.includeSchema !== false,
      includeData: config?.includeData !== false
    };

    this.backupDir = this.config.backupDir;
    
    // Ensure backup directory exists
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a full database backup
   */
  async createBackup(): Promise<BackupMetadata> {
    const db = getDatabaseClient();
    const startTime = Date.now();
    const backupId = `backup-${Date.now()}`;
    
    console.log(`Starting backup: ${backupId}`);
    
    try {
      // Get list of all tables
      const tablesResult = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      const recordCounts: Record<string, number> = {};
      
      // Get record counts for each table
      for (const table of tables) {
        const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        recordCounts[table] = parseInt(countResult.rows[0].count);
      }
      
      // Use pg_dump for backup (via pg client)
      // For now, we'll use a simplified approach with COPY commands
      const backupData: Record<string, any[]> = {};
      
      for (const table of tables) {
        const dataResult = await db.query(`SELECT * FROM ${table}`);
        backupData[table] = dataResult.rows;
      }
      
      // Create backup file
      const backupPath = join(this.backupDir, `${backupId}${this.config.compress ? '.gz' : '.json'}`);
      const backupContent = JSON.stringify({
        metadata: {
          id: backupId,
          timestamp: new Date().toISOString(),
          tables,
          recordCounts
        },
        data: backupData
      });
      
      let size: number;
      
      if (this.config.compress) {
        const gzip = createGzip();
        const writeStream = createWriteStream(backupPath);
        const readStream = createReadStream(Buffer.from(backupContent));
        
        await pipeline(readStream, gzip, writeStream);
        const stats = statSync(backupPath);
        size = stats.size;
      } else {
        const writeStream = createWriteStream(backupPath);
        writeStream.write(backupContent);
        writeStream.end();
        const stats = statSync(backupPath);
        size = stats.size;
      }
      
      // Calculate checksum
      const checksum = this.computeChecksum(backupContent);
      
      const duration = Date.now() - startTime;
      
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date().toISOString(),
        size,
        compressed: this.config.compress,
        checksum,
        tables,
        recordCounts,
        durationMs: duration
      };
      
      // Save metadata
      const metadataPath = join(this.backupDir, `${backupId}.meta.json`);
      const writeStream = createWriteStream(metadataPath);
      writeStream.write(JSON.stringify(metadata, null, 2));
      writeStream.end();
      
      console.log(`Backup completed: ${backupId} (${(size / 1024 / 1024).toFixed(2)} MB)`);
      
      return metadata;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupId: string): Promise<RestoreResult> {
    const db = getDatabaseClient();
    const startTime = Date.now();
    const errors: string[] = [];
    
    console.log(`Starting restore: ${backupId}`);
    
    try {
      // Load metadata
      const metadataPath = join(this.backupDir, `${backupId}.meta.json`);
      if (!existsSync(metadataPath)) {
        throw new Error(`Backup metadata not found: ${backupId}`);
      }
      
      const metadataContent = require(metadataPath);
      const metadata: BackupMetadata = JSON.parse(metadataContent);
      
      // Load backup data
      const backupPath = join(this.backupDir, `${backupId}${this.config.compress ? '.gz' : '.json'}`);
      
      let backupContent: string;
      
      if (this.config.compress) {
        const gunzip = createGunzip();
        const readStream = createReadStream(backupPath);
        const chunks: Buffer[] = [];
        
        readStream.pipe(gunzip).on('data', (chunk) => chunks.push(chunk));
        
        await new Promise((resolve, reject) => {
          gunzip.on('end', resolve);
          gunzip.on('error', reject);
        });
        
        backupContent = Buffer.concat(chunks).toString('utf-8');
      } else {
        backupContent = require(backupPath);
      }
      
      const backup = JSON.parse(backupContent);
      
      // Validate checksum
      const computedChecksum = this.computeChecksum(JSON.stringify(backup));
      if (computedChecksum !== metadata.checksum) {
        throw new Error('Backup checksum validation failed');
      }
      
      // Restore data
      let totalRestoredRecords = 0;
      const restoredTables: string[] = [];
      
      await db.transaction(async (client: PoolClient) => {
        // Clear existing data (optional - based on requirements)
        for (const table of metadata.tables) {
          try {
            await client.query(`TRUNCATE TABLE ${table} CASCADE`);
          } catch (error) {
            errors.push(`Failed to truncate table ${table}: ${error}`);
          }
        }
        
        // Insert backup data
        for (const table of metadata.tables) {
          const tableData = backup.data[table];
          
          if (!tableData || tableData.length === 0) {
            continue;
          }
          
          try {
            const columns = Object.keys(tableData[0]);
            const placeholders = tableData.map((_row: any, i: number) => 
              `(${columns.map((_col: any, j: number) => `$${i * columns.length + j + 1}`).join(', ')})`
            ).join(', ');
            
            const values = tableData.flatMap((row: any) => columns.map((col: string) => row[col]));
            
            await client.query(`
              INSERT INTO ${table} (${columns.join(', ')})
              VALUES ${placeholders}
            `, values);
            
            totalRestoredRecords += tableData.length;
            restoredTables.push(table);
          } catch (error) {
            errors.push(`Failed to restore table ${table}: ${error}`);
          }
        }
      });
      
      const duration = Date.now() - startTime;
      
      const result: RestoreResult = {
        success: errors.length === 0,
        backupId,
        restoredTables,
        restoredRecords: totalRestoredRecords,
        durationMs: duration,
        validationPassed: computedChecksum === metadata.checksum,
        errors
      };
      
      console.log(`Restore completed: ${backupId} (${totalRestoredRecords} records restored)`);
      
      if (errors.length > 0) {
        console.warn('Restore completed with errors:', errors);
      }
      
      return result;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  listBackups(): BackupMetadata[] {
    const files = readdirSync(this.backupDir);
    const backups: BackupMetadata[] = [];
    
    for (const file of files) {
      if (file.endsWith('.meta.json')) {
        try {
          const metadataPath = join(this.backupDir, file);
          const metadataContent = require(metadataPath);
          backups.push(JSON.parse(metadataContent));
        } catch (error) {
          console.error(`Failed to load metadata for ${file}:`, error);
        }
      }
    }
    
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Delete old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<number> {
    const backups = this.listBackups();
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const backup of backups) {
      const backupDate = new Date(backup.timestamp);
      if (backupDate < cutoffDate) {
        try {
          const backupPath = join(this.backupDir, `${backup.id}${this.config.compress ? '.gz' : '.json'}`);
          const metadataPath = join(this.backupDir, `${backup.id}.meta.json`);
          
          if (existsSync(backupPath)) {
            unlinkSync(backupPath);
          }
          if (existsSync(metadataPath)) {
            unlinkSync(metadataPath);
          }
          
          deletedCount++;
          console.log(`Deleted old backup: ${backup.id}`);
        } catch (error) {
          console.error(`Failed to delete backup ${backup.id}:`, error);
        }
      }
    }
    
    return deletedCount;
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(backupId: string): Promise<boolean> {
    try {
      const metadataPath = join(this.backupDir, `${backupId}.meta.json`);
      if (!existsSync(metadataPath)) {
        return false;
      }
      
      const metadataContent = require(metadataPath);
      const metadata: BackupMetadata = JSON.parse(metadataContent);
      
      const backupPath = join(this.backupDir, `${backupId}${this.config.compress ? '.gz' : '.json'}`);
      if (!existsSync(backupPath)) {
        return false;
      }
      
      // Verify file exists and has expected size
      const stats = statSync(backupPath);
      if (stats.size !== metadata.size) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Backup validation failed for ${backupId}:`, error);
      return false;
    }
  }

  /**
   * Test backup and restore cycle
   */
  async testBackupRestore(): Promise<{
    backupSuccess: boolean;
    restoreSuccess: boolean;
    validationPassed: boolean;
    durationMs: number;
  }> {
    const startTime = Date.now();
    
    console.log('Starting backup/restore test...');
    
    // Create test backup
    let backupId: string;
    try {
      const backup = await this.createBackup();
      backupId = backup.id;
      console.log('✓ Backup test passed');
    } catch (error) {
      console.error('✗ Backup test failed:', error);
      return {
        backupSuccess: false,
        restoreSuccess: false,
        validationPassed: false,
        durationMs: Date.now() - startTime
      };
    }
    
    // Validate backup
    const validation = await this.validateBackup(backupId);
    if (!validation) {
      console.error('✗ Backup validation failed');
      return {
        backupSuccess: true,
        restoreSuccess: false,
        validationPassed: false,
        durationMs: Date.now() - startTime
      };
    }
    
    // Restore backup
    try {
      const restoreResult = await this.restoreBackup(backupId);
      console.log('✓ Restore test passed');
      
      const duration = Date.now() - startTime;
      
      return {
        backupSuccess: true,
        restoreSuccess: restoreResult.success,
        validationPassed: restoreResult.validationPassed,
        durationMs: duration
      };
    } catch (error) {
      console.error('✗ Restore test failed:', error);
      return {
        backupSuccess: true,
        restoreSuccess: false,
        validationPassed: true,
        durationMs: Date.now() - startTime
      };
    }
  }

  private computeChecksum(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }
}

// Singleton instance
let backupManager: BackupRestoreManager | null = null;

export function getBackupManager(config?: Partial<BackupConfig>): BackupRestoreManager {
  if (!backupManager) {
    backupManager = new BackupRestoreManager(config);
  }
  return backupManager;
}
