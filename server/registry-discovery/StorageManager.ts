/**
 * Registry Discovery Platform (RDP)
 * Data Storage Architecture
 * 
 * Manages structured storage for all platform data
 */

import * as fs from 'fs';
import * as path from 'path';
import { RegistryPassport, Schema, SchemaDrift, ConnectorConfig, HealthReport, ProductionStatus } from './types';

export class StorageManager {
  private basePath: string;
  private directories: string[];

  constructor(basePath: string = './data/registry-discovery') {
    this.basePath = basePath;
    this.directories = [
      'catalog',
      'raw',
      'processed',
      'normalized',
      'evidence',
      'logs',
      'registry-passports',
      'schema-history',
      'connectors',
      'mappings',
    ];

    this.initialize();
  }

  /**
   * Initialize storage directories
   */
  private initialize(): void {
    console.log(`[StorageManager] Initializing storage at ${this.basePath}`);

    // Create base directory
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    // Create subdirectories
    for (const dir of this.directories) {
      const dirPath = path.join(this.basePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`[StorageManager] Created directory: ${dir}`);
      }
    }

    console.log(`[StorageManager] Storage initialized with ${this.directories.length} directories`);
  }

  /**
   * Store catalog data
   */
  async storeCatalog(catalogId: string, data: any): Promise<void> {
    const filePath = path.join(this.basePath, 'catalog', `${catalogId}.json`);
    await this.writeJSON(filePath, data);
  }

  /**
   * Load catalog data
   */
  async loadCatalog(catalogId: string): Promise<any> {
    const filePath = path.join(this.basePath, 'catalog', `${catalogId}.json`);
    return await this.readJSON(filePath);
  }

  /**
   * Store raw dataset data
   */
  async storeRawData(datasetId: string, data: Buffer | any): Promise<void> {
    const filePath = path.join(this.basePath, 'raw', `${datasetId}.json`);
    if (Buffer.isBuffer(data)) {
      fs.writeFileSync(filePath, data);
    } else {
      await this.writeJSON(filePath, data);
    }
  }

  /**
   * Load raw dataset data
   */
  async loadRawData(datasetId: string): Promise<any> {
    const filePath = path.join(this.basePath, 'raw', `${datasetId}.json`);
    return await this.readJSON(filePath);
  }

  /**
   * Store processed dataset data
   */
  async storeProcessedData(datasetId: string, data: any[]): Promise<void> {
    const filePath = path.join(this.basePath, 'processed', `${datasetId}.json`);
    await this.writeJSON(filePath, data);
  }

  /**
   * Load processed dataset data
   */
  async loadProcessedData(datasetId: string): Promise<any[]> {
    const filePath = path.join(this.basePath, 'processed', `${datasetId}.json`);
    return await this.readJSON(filePath);
  }

  /**
   * Store normalized dataset data
   */
  async storeNormalizedData(datasetId: string, data: any[]): Promise<void> {
    const filePath = path.join(this.basePath, 'normalized', `${datasetId}.json`);
    await this.writeJSON(filePath, data);
  }

  /**
   * Load normalized dataset data
   */
  async loadNormalizedData(datasetId: string): Promise<any[]> {
    const filePath = path.join(this.basePath, 'normalized', `${datasetId}.json`);
    return await this.readJSON(filePath);
  }

  /**
   * Store evidence data
   */
  async storeEvidence(datasetId: string, evidence: any): Promise<void> {
    const filePath = path.join(this.basePath, 'evidence', `${datasetId}.json`);
    await this.writeJSON(filePath, evidence);
  }

  /**
   * Load evidence data
   */
  async loadEvidence(datasetId: string): Promise<any> {
    const filePath = path.join(this.basePath, 'evidence', `${datasetId}.json`);
    return await this.readJSON(filePath);
  }

  /**
   * Store registry passport
   */
  async storeRegistryPassport(passport: RegistryPassport): Promise<void> {
    const filePath = path.join(this.basePath, 'registry-passports', `${passport.registryId}.json`);
    await this.writeJSON(filePath, passport);
  }

  /**
   * Load registry passport
   */
  async loadRegistryPassport(registryId: string): Promise<RegistryPassport | null> {
    const filePath = path.join(this.basePath, 'registry-passports', `${registryId}.json`);
    try {
      return await this.readJSON(filePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Store all registry passports
   */
  async storeAllPassports(passports: RegistryPassport[]): Promise<void> {
    const filePath = path.join(this.basePath, 'registry-passports', 'registry_passports.json');
    await this.writeJSON(filePath, passports);
  }

  /**
   * Load all registry passports
   */
  async loadAllPassports(): Promise<RegistryPassport[]> {
    const filePath = path.join(this.basePath, 'registry-passports', 'registry_passports.json');
    try {
      return await this.readJSON(filePath);
    } catch (error) {
      return [];
    }
  }

  /**
   * Store schema
   */
  async storeSchema(datasetId: string, schema: Schema): Promise<void> {
    const filePath = path.join(this.basePath, 'schema-history', `${datasetId}-v${schema.version}.json`);
    await this.writeJSON(filePath, schema);
  }

  /**
   * Load schema
   */
  async loadSchema(datasetId: string, version?: string): Promise<Schema | null> {
    if (version) {
      const filePath = path.join(this.basePath, 'schema-history', `${datasetId}-v${version}.json`);
      return await this.readJSON(filePath);
    }

    // Load latest schema
    const schemaDir = path.join(this.basePath, 'schema-history');
    const files = fs.readdirSync(schemaDir)
      .filter(f => f.startsWith(`${datasetId}-v`))
      .sort()
      .reverse();

    if (files.length === 0) return null;

    const latestFile = files[0];
    if (!latestFile) return null;
    const filePath = path.join(schemaDir, latestFile);
    return await this.readJSON(filePath);
  }

  /**
   * Store schema drift
   */
  async storeSchemaDrift(datasetId: string, drift: SchemaDrift): Promise<void> {
    const filePath = path.join(this.basePath, 'schema-history', `${datasetId}-drift-${Date.now()}.json`);
    await this.writeJSON(filePath, drift);
  }

  /**
   * Store connector configuration
   */
  async storeConnector(connector: ConnectorConfig): Promise<void> {
    const filePath = path.join(this.basePath, 'connectors', `${connector.id}.json`);
    await this.writeJSON(filePath, connector);
  }

  /**
   * Load connector configuration
   */
  async loadConnector(connectorId: string): Promise<ConnectorConfig | null> {
    const filePath = path.join(this.basePath, 'connectors', `${connectorId}.json`);
    try {
      return await this.readJSON(filePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Store field mapping
   */
  async storeMapping(datasetId: string, mapping: any): Promise<void> {
    const filePath = path.join(this.basePath, 'mappings', `${datasetId}.json`);
    await this.writeJSON(filePath, mapping);
  }

  /**
   * Load field mapping
   */
  async loadMapping(datasetId: string): Promise<any> {
    const filePath = path.join(this.basePath, 'mappings', `${datasetId}.json`);
    return await this.readJSON(filePath);
  }

  /**
   * Store log entry
   */
  async storeLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, metadata?: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    const logPath = path.join(this.basePath, 'logs', `${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(logPath, logLine);
  }

  /**
   * Store health report
   */
  async storeHealthReport(report: HealthReport): Promise<void> {
    const filePath = path.join(this.basePath, 'processed', 'health_report.json');
    await this.writeJSON(filePath, report);
  }

  /**
   * Store production status
   */
  async storeProductionStatus(status: ProductionStatus): Promise<void> {
    const filePath = path.join(this.basePath, 'processed', 'production_status.json');
    await this.writeJSON(filePath, status);
  }

  /**
   * Load health report
   */
  async loadHealthReport(): Promise<HealthReport> {
    const filePath = path.join(this.basePath, 'processed', 'health_report.json');
    return await this.readJSON(filePath);
  }

  /**
   * Load production status
   */
  async loadProductionStatus(): Promise<ProductionStatus> {
    const filePath = path.join(this.basePath, 'processed', 'production_status.json');
    return await this.readJSON(filePath);
  }

  /**
   * Write JSON file
   */
  private async writeJSON(filePath: string, data: any): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Read JSON file
   */
  private async readJSON(filePath: string): Promise<any> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStatistics(): {
    basePath: string;
    directories: string[];
    totalFiles: number;
    totalSize: number;
    byDirectory: Record<string, { files: number; size: number }>;
  } {
    const byDirectory: Record<string, { files: number; size: number }> = {};
    let totalFiles = 0;
    let totalSize = 0;

    for (const dir of this.directories) {
      const dirPath = path.join(this.basePath, dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        let dirSize = 0;

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          dirSize += stats.size;
        }

        byDirectory[dir] = {
          files: files.length,
          size: dirSize,
        };

        totalFiles += files.length;
        totalSize += dirSize;
      }
    }

    return {
      basePath: this.basePath,
      directories: this.directories,
      totalFiles,
      totalSize,
      byDirectory,
    };
  }

  /**
   * Clear directory
   */
  async clearDirectory(directory: string): Promise<void> {
    const dirPath = path.join(this.basePath, directory);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        fs.unlinkSync(filePath);
      }
      console.log(`[StorageManager] Cleared directory: ${directory}`);
    }
  }

  /**
   * Clear all storage
   */
  async clearAll(): Promise<void> {
    for (const dir of this.directories) {
      await this.clearDirectory(dir);
    }
    console.log('[StorageManager] Cleared all storage');
  }

  /**
   * Backup storage
   */
  async backup(backupPath: string): Promise<void> {
    console.log(`[StorageManager] Creating backup at ${backupPath}`);
    
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Copy all directories
    for (const dir of this.directories) {
      const sourceDir = path.join(this.basePath, dir);
      const targetDir = path.join(backupPath, dir);

      if (fs.existsSync(sourceDir)) {
        this.copyDirectory(sourceDir, targetDir);
      }
    }

    console.log('[StorageManager] Backup complete');
  }

  /**
   * Copy directory recursively
   */
  private copyDirectory(source: string, target: string): void {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);

      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  /**
   * Restore from backup
   */
  async restore(backupPath: string): Promise<void> {
    console.log(`[StorageManager] Restoring from ${backupPath}`);

    // Clear current storage
    await this.clearAll();

    // Restore from backup
    for (const dir of this.directories) {
      const sourceDir = path.join(backupPath, dir);
      const targetDir = path.join(this.basePath, dir);

      if (fs.existsSync(sourceDir)) {
        this.copyDirectory(sourceDir, targetDir);
      }
    }

    console.log('[StorageManager] Restore complete');
  }
}

// Singleton instance
export const storageManager = new StorageManager();
