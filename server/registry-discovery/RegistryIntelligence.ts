/**
 * Registry Discovery Platform (RDP)
 * Registry Intelligence
 * 
 * Creates and maintains registry passports with comprehensive metadata
 */

import { RegistryPassport, Dataset, QualityMetrics, ScanResult, DownloadResult } from './types';

export class RegistryIntelligence {
  private passports: Map<string, RegistryPassport> = new Map();
  private qualityMetrics: Map<string, QualityMetrics> = new Map();

  /**
   * Create registry passport from dataset
   */
  async createPassport(dataset: Dataset, scanResult?: ScanResult, downloadResult?: DownloadResult): Promise<RegistryPassport> {
    console.log(`[RegistryIntelligence] Creating passport for: ${dataset.id}`);

    const qualityScore = await this.calculateQualityScore(dataset, scanResult, downloadResult);

    const passport: RegistryPassport = {
      registryId: dataset.id,
      name: dataset.title,
      ownerOrg: typeof dataset.organization === 'string' ? dataset.organization : (dataset.organization?.name || 'Unknown'),
      url: dataset.url,
      api: this.determineAPI(dataset, scanResult),
      type: this.determineType(dataset),
      format: dataset.format,
      license: dataset.license || 'Unknown',
      updateFrequency: this.determineUpdateFrequency(dataset),
      lastCheck: new Date(),
      recordCount: downloadResult?.records?.length || scanResult?.estimatedRecords || 0,
      datastoreActive: dataset.datastoreActive,
      authentication: 'NONE',
      rateLimit: 1000, // Default rate limit
      healthScore: qualityScore.availability,
      dataQualityScore: qualityScore.overallScore,
      coverageScore: qualityScore.fieldCoverage,
      confidence: this.calculateConfidence(dataset, scanResult, downloadResult),
      schemaVersion: scanResult?.schema?.version || '1.0',
      connectorVersion: '1.0.0',
      status: this.determineStatus(qualityScore),
      discoveredAt: new Date(),
      integratedAt: undefined,
    };

    this.passports.set(dataset.id, passport);
    this.qualityMetrics.set(dataset.id, qualityScore);

    console.log(`[RegistryIntelligence] Passport created: ${passport.name} (${passport.status})`);
    return passport;
  }

  /**
   * Determine API endpoint
   */
  private determineAPI(dataset: Dataset, _scanResult?: ScanResult): string {
    if (dataset.datastoreActive) {
      return `${dataset.url}/api/3/action/datastore_search`;
    }
    return dataset.url;
  }

  /**
   * Determine registry type
   */
  private determineType(dataset: Dataset): any {
    if (dataset.datastoreActive) return 'CKAN';
    if (dataset.resourceType === 'api') return 'REST_API';
    return 'FILE';
  }

  /**
   * Determine update frequency
   */
  private determineUpdateFrequency(_dataset: Dataset): string {
    // Default to daily for most registries
    return 'DAILY';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(dataset: Dataset, scanResult?: ScanResult, downloadResult?: DownloadResult): number {
    let confidence = 50; // Base confidence

    // DataStore availability
    if (dataset.datastoreActive) confidence += 20;

    // Schema availability
    if (scanResult?.schema) confidence += 15;

    // Download success
    if (downloadResult?.success) confidence += 10;

    // Metadata quality
    if (dataset.description) confidence += 5;

    return Math.min(confidence, 100);
  }

  /**
   * Determine status based on quality
   */
  private determineStatus(quality: QualityMetrics): RegistryPassport['status'] {
    if (quality.overallScore >= 80) return 'ACTIVE';
    if (quality.overallScore >= 60) return 'DEGRADED';
    if (quality.overallScore >= 40) return 'INACTIVE';
    return 'ERROR';
  }

  /**
   * Calculate quality score
   */
  async calculateQualityScore(dataset: Dataset, scanResult?: ScanResult, downloadResult?: DownloadResult): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      availability: this.calculateAvailability(dataset, downloadResult),
      completeness: this.calculateCompleteness(dataset, scanResult),
      freshness: this.calculateFreshness(dataset),
      integrity: this.calculateIntegrity(dataset, downloadResult),
      consistency: this.calculateConsistency(dataset, scanResult),
      apiStability: this.calculateAPIStability(dataset),
      avgResponseTime: downloadResult?.downloadTime || 0,
      errorRate: downloadResult?.success ? 0 : 100,
      metadataQuality: this.calculateMetadataQuality(dataset),
      fieldCoverage: this.calculateFieldCoverage(dataset, scanResult),
      overallScore: 0,
    };

    // Calculate overall score
    metrics.overallScore = this.calculateOverallScore(metrics);

    return metrics;
  }

  /**
   * Calculate availability
   */
  private calculateAvailability(_dataset: Dataset, downloadResult?: DownloadResult): number {
    if (downloadResult?.success) return 100;
    return 0;
  }

  /**
   * Calculate completeness
   */
  private calculateCompleteness(dataset: Dataset, _scanResult?: ScanResult): number {
    let score = 50;

    if (dataset.description) score += 20;
    if (dataset.tags.length > 0) score += 15;
    if (dataset.organization) score += 15;

    return score;
  }

  /**
   * Calculate freshness
   */
  private calculateFreshness(dataset: Dataset): number {
    const now = new Date();
    const modified = new Date(dataset.modified);
    const daysSinceUpdate = (now.getTime() - modified.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate <= 1) return 100;
    if (daysSinceUpdate <= 7) return 80;
    if (daysSinceUpdate <= 30) return 60;
    if (daysSinceUpdate <= 90) return 40;
    return 20;
  }

  /**
   * Calculate integrity
   */
  private calculateIntegrity(dataset: Dataset, _downloadResult?: DownloadResult): number {
    if (dataset.hash) return 100;
    return 50;
  }

  /**
   * Calculate consistency
   */
  private calculateConsistency(_dataset: Dataset, scanResult?: ScanResult): number {
    if (scanResult?.schema) return 100;
    return 50;
  }

  /**
   * Calculate API stability
   */
  private calculateAPIStability(dataset: Dataset): number {
    if (dataset.datastoreActive) return 100;
    return 70;
  }

  /**
   * Calculate metadata quality
   */
  private calculateMetadataQuality(dataset: Dataset): number {
    let score = 0;

    if (dataset.title) score += 25;
    if (dataset.description) score += 25;
    if (dataset.tags.length > 0) score += 25;
    if (dataset.organization) score += 25;

    return score;
  }

  /**
   * Calculate field coverage
   */
  private calculateFieldCoverage(_dataset: Dataset, scanResult?: ScanResult): number {
    if (scanResult?.schema && scanResult.schema.fields.length > 0) {
      return Math.min(scanResult.schema.fields.length * 5, 100);
    }
    return 50;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      availability: 0.2,
      completeness: 0.15,
      freshness: 0.1,
      integrity: 0.1,
      consistency: 0.1,
      apiStability: 0.1,
      errorRate: 0.1,
      metadataQuality: 0.1,
      fieldCoverage: 0.05,
    };

    let score = 0;
    score += metrics.availability * weights.availability;
    score += metrics.completeness * weights.completeness;
    score += metrics.freshness * weights.freshness;
    score += metrics.integrity * weights.integrity;
    score += metrics.consistency * weights.consistency;
    score += metrics.apiStability * weights.apiStability;
    score += (100 - metrics.errorRate) * weights.errorRate;
    score += metrics.metadataQuality * weights.metadataQuality;
    score += metrics.fieldCoverage * weights.fieldCoverage;

    return Math.round(score);
  }

  /**
   * Update passport
   */
  async updatePassport(datasetId: string, updates: Partial<RegistryPassport>): Promise<void> {
    const passport = this.passports.get(datasetId);
    if (passport) {
      const updated = { ...passport, ...updates };
      this.passports.set(datasetId, updated);
    }
  }

  /**
   * Get passport
   */
  getPassport(datasetId: string): RegistryPassport | undefined {
    return this.passports.get(datasetId);
  }

  /**
   * Get all passports
   */
  getAllPassports(): RegistryPassport[] {
    return Array.from(this.passports.values());
  }

  /**
   * Get passports by status
   */
  getPassportsByStatus(status: RegistryPassport['status']): RegistryPassport[] {
    return this.getAllPassports().filter(p => p.status === status);
  }

  /**
   * Get quality metrics
   */
  getQualityMetrics(datasetId: string): QualityMetrics | undefined {
    return this.qualityMetrics.get(datasetId);
  }

  /**
   * Get passport statistics
   */
  getPassportStatistics(): {
    total: number;
    byStatus: Record<string, number>;
    averageHealth: number;
    averageQuality: number;
    averageConfidence: number;
    datastoreActive: number;
  } {
    const passports = this.getAllPassports();
    const byStatus: Record<string, number> = {};

    let totalHealth = 0;
    let totalQuality = 0;
    let totalConfidence = 0;
    let datastoreActive = 0;

    for (const passport of passports) {
      byStatus[passport.status] = (byStatus[passport.status] || 0) + 1;
      totalHealth += passport.healthScore;
      totalQuality += passport.dataQualityScore;
      totalConfidence += passport.confidence;
      if (passport.datastoreActive) datastoreActive++;
    }

    return {
      total: passports.length,
      byStatus,
      averageHealth: passports.length > 0 ? totalHealth / passports.length : 0,
      averageQuality: passports.length > 0 ? totalQuality / passports.length : 0,
      averageConfidence: passports.length > 0 ? totalConfidence / passports.length : 0,
      datastoreActive,
    };
  }

  /**
   * Export passports to JSON
   */
  exportPassports(): string {
    return JSON.stringify(this.getAllPassports(), null, 2);
  }

  /**
   * Import passports from JSON
   */
  importPassports(data: string): void {
    const passports = JSON.parse(data) as RegistryPassport[];
    for (const passport of passports) {
      this.passports.set(passport.registryId, passport);
    }
  }

  /**
   * Mark registry as integrated
   */
  markIntegrated(datasetId: string): void {
    this.updatePassport(datasetId, { integratedAt: new Date() });
  }

  /**
   * Set registry error
   */
  setError(datasetId: string, error: string): void {
    this.updatePassport(datasetId, { 
      status: 'ERROR',
      lastError: error,
    });
  }

  /**
   * Clear passports
   */
  clearPassports(): void {
    this.passports.clear();
    this.qualityMetrics.clear();
  }
}

// Singleton instance
export const registryIntelligence = new RegistryIntelligence();
