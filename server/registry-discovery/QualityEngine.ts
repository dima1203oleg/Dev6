/**
 * Registry Discovery Platform (RDP)
 * Registry Quality Engine
 * 
 * Calculates and tracks quality metrics for all registries
 */

import { QualityMetrics, Dataset, ScanResult, DownloadResult } from './types';

export interface QualityCheck {
  registryId: string;
  timestamp: Date;
  metrics: QualityMetrics;
  passed: boolean;
  threshold: number;
  issues: string[];
}

export class QualityEngine {
  private qualityHistory: Map<string, QualityCheck[]> = new Map();
  private threshold: number = 70; // Default quality threshold

  /**
   * Set quality threshold
   */
  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  /**
   * Run quality check on registry
   */
  async runQualityCheck(
    dataset: Dataset,
    scanResult?: ScanResult,
    downloadResult?: DownloadResult
  ): Promise<QualityCheck> {
    console.log(`[QualityEngine] Running quality check for: ${dataset.id}`);

    const metrics = await this.calculateMetrics(dataset, scanResult, downloadResult);
    const passed = metrics.overallScore >= this.threshold;
    const issues = this.identifyIssues(metrics);

    const check: QualityCheck = {
      registryId: dataset.id,
      timestamp: new Date(),
      metrics,
      passed,
      threshold: this.threshold,
      issues,
    };

    // Store in history
    const history = this.qualityHistory.get(dataset.id) || [];
    this.qualityHistory.set(dataset.id, [...history, check]);

    console.log(`[QualityEngine] Quality check complete: ${metrics.overallScore}% (${passed ? 'PASSED' : 'FAILED'})`);
    return check;
  }

  /**
   * Calculate quality metrics
   */
  async calculateMetrics(
    dataset: Dataset,
    scanResult?: ScanResult,
    downloadResult?: DownloadResult
  ): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      availability: await this.measureAvailability(dataset),
      completeness: this.measureCompleteness(dataset, scanResult),
      freshness: this.measureFreshness(dataset),
      integrity: this.measureIntegrity(dataset, downloadResult),
      consistency: this.measureConsistency(dataset, scanResult),
      apiStability: this.measureAPIStability(dataset),
      avgResponseTime: this.measureResponseTime(dataset, downloadResult),
      errorRate: this.measureErrorRate(downloadResult),
      metadataQuality: this.measureMetadataQuality(dataset),
      fieldCoverage: this.measureFieldCoverage(dataset, scanResult),
      overallScore: 0,
    };

    metrics.overallScore = this.calculateOverallScore(metrics);
    return metrics;
  }

  /**
   * Measure availability
   */
  private async measureAvailability(dataset: Dataset): Promise<number> {
    try {
      const start = Date.now();
      const response = await fetch(dataset.url, { method: 'HEAD' });
      const responseTime = Date.now() - start;

      if (response.ok) {
        // Score based on response time
        if (responseTime < 500) return 100;
        if (responseTime < 1000) return 80;
        if (responseTime < 2000) return 60;
        return 40;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Measure completeness
   */
  private measureCompleteness(dataset: Dataset, scanResult?: ScanResult): number {
    let score = 0;

    // Title (20 points)
    if (dataset.title) score += 20;

    // Description (20 points)
    if (dataset.description && dataset.description.length > 50) score += 20;

    // Tags (15 points)
    if (dataset.tags.length >= 3) score += 15;
    else if (dataset.tags.length >= 1) score += 10;

    // Organization (15 points)
    if (dataset.organization) score += 15;

    // License (10 points)
    if (dataset.license) score += 10;

    // Schema (20 points)
    if (scanResult?.schema && scanResult.schema.fields.length > 0) score += 20;

    return score;
  }

  /**
   * Measure freshness
   */
  private measureFreshness(dataset: Dataset): number {
    const now = new Date();
    const modified = new Date(dataset.modified);
    const daysSinceUpdate = (now.getTime() - modified.getTime()) / (1000 * 60 * 60 * 24);

    // Score based on data freshness
    if (daysSinceUpdate <= 1) return 100;
    if (daysSinceUpdate <= 7) return 90;
    if (daysSinceUpdate <= 30) return 70;
    if (daysSinceUpdate <= 90) return 50;
    if (daysSinceUpdate <= 180) return 30;
    if (daysSinceUpdate <= 365) return 20;
    return 10;
  }

  /**
   * Measure integrity
   */
  private measureIntegrity(dataset: Dataset, downloadResult?: DownloadResult): number {
    let score = 50; // Base score;

    // Hash verification (30 points)
    if (dataset.hash) score += 30;

    // Download success (20 points)
    if (downloadResult?.success) score += 20;

    return score;
  }

  /**
   * Measure consistency
   */
  private measureConsistency(dataset: Dataset, scanResult?: ScanResult): number {
    let score = 50; // Base score

    // Schema consistency (30 points)
    if (scanResult?.schema) score += 30;

    // DataStore consistency (20 points)
    if (dataset.datastoreActive) score += 20;

    return score;
  }

  /**
   * Measure API stability
   */
  private measureAPIStability(dataset: Dataset): number {
    // Check historical error rate
    const history = this.qualityHistory.get(dataset.id) || [];
    if (history.length === 0) return 100;

    const recentChecks = history.slice(-10);
    const successRate = recentChecks.filter(c => c.metrics.errorRate === 0).length / recentChecks.length;

    return Math.round(successRate * 100);
  }

  /**
   * Measure response time
   */
  private measureResponseTime(_dataset: Dataset, downloadResult?: DownloadResult): number {
    if (downloadResult) {
      return downloadResult.downloadTime;
    }

    // Measure current response time
    try {
      const start = Date.now();
      fetch(_dataset.url, { method: 'HEAD' });
      return Date.now() - start;
    } catch (error) {
      return 9999; // High value for failed requests
    }
  }

  /**
   * Measure error rate
   */
  private measureErrorRate(downloadResult?: DownloadResult): number {
    if (downloadResult?.success) return 0;
    if (downloadResult?.error) return 100;
    return 0;
  }

  /**
   * Measure metadata quality
   */
  private measureMetadataQuality(dataset: Dataset): number {
    let score = 0;

    // Title (25 points)
    if (dataset.title && dataset.title.length > 5) score += 25;

    // Description (25 points)
    if (dataset.description && dataset.description.length > 100) score += 25;

    // Tags (25 points)
    if (dataset.tags.length >= 3) score += 25;
    else if (dataset.tags.length >= 1) score += 15;

    // Organization (25 points)
    if (dataset.organization) score += 25;

    return score;
  }

  /**
   * Measure field coverage
   */
  private measureFieldCoverage(_dataset: Dataset, scanResult?: ScanResult): number {
    if (scanResult?.schema) {
      const fieldCount = scanResult.schema.fields.length;
      // More fields = better coverage (max 100 at 20 fields)
      return Math.min(fieldCount * 5, 100);
    }
    return 50;
  }

  /**
   * Calculate overall score
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
   * Identify quality issues
   */
  private identifyIssues(metrics: QualityMetrics): string[] {
    const issues: string[] = [];

    if (metrics.availability < 80) {
      issues.push(`Low availability: ${metrics.availability}%`);
    }

    if (metrics.completeness < 70) {
      issues.push(`Incomplete metadata: ${metrics.completeness}%`);
    }

    if (metrics.freshness < 50) {
      issues.push(`Stale data: ${metrics.freshness}% freshness`);
    }

    if (metrics.integrity < 70) {
      issues.push(`Data integrity issues: ${metrics.integrity}%`);
    }

    if (metrics.consistency < 70) {
      issues.push(`Inconsistent data: ${metrics.consistency}%`);
    }

    if (metrics.apiStability < 80) {
      issues.push(`API instability: ${metrics.apiStability}%`);
    }

    if (metrics.errorRate > 10) {
      issues.push(`High error rate: ${metrics.errorRate}%`);
    }

    if (metrics.metadataQuality < 60) {
      issues.push(`Poor metadata: ${metrics.metadataQuality}%`);
    }

    if (metrics.fieldCoverage < 50) {
      issues.push(`Low field coverage: ${metrics.fieldCoverage}%`);
    }

    if (metrics.avgResponseTime > 2000) {
      issues.push(`Slow response time: ${metrics.avgResponseTime}ms`);
    }

    return issues;
  }

  /**
   * Batch quality check
   */
  async runBatchQualityCheck(
    datasets: Dataset[],
    scanResults?: ScanResult[],
    downloadResults?: DownloadResult[]
  ): Promise<QualityCheck[]> {
    console.log(`[QualityEngine] Running batch quality check for ${datasets.length} registries`);

    const checks: QualityCheck[] = [];
    const scanMap = new Map(scanResults?.map(s => [s.dataset.id, s]) || []);
    const downloadMap = new Map(downloadResults?.map(d => [d.dataset.id, d]) || []);

    for (const dataset of datasets) {
      const scanResult = scanMap.get(dataset.id);
      const downloadResult = downloadMap.get(dataset.id);

      try {
        const check = await this.runQualityCheck(dataset, scanResult, downloadResult);
        checks.push(check);
      } catch (error) {
        console.error(`[QualityEngine] Failed to check ${dataset.id}:`, error);
      }
    }

    console.log(`[QualityEngine] Batch check complete: ${checks.filter(c => c.passed).length}/${datasets.length} passed`);
    return checks;
  }

  /**
   * Get quality history
   */
  getQualityHistory(datasetId: string): QualityCheck[] {
    return this.qualityHistory.get(datasetId) || [];
  }

  /**
   * Get latest quality check
   */
  getLatestCheck(datasetId: string): QualityCheck | undefined {
    const history = this.qualityHistory.get(datasetId);
    if (history && history.length > 0) {
      return history[history.length - 1];
    }
    return undefined;
  }

  /**
   * Get quality trend
   */
  getQualityTrend(datasetId: string): 'IMPROVING' | 'STABLE' | 'DEGRADING' {
    const history = this.qualityHistory.get(datasetId);
    if (!history || history.length < 3) return 'STABLE';

    const recent = history.slice(-5);
    const scores = recent.map(c => c.metrics.overallScore);

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (avgSecond > avgFirst + 5) return 'IMPROVING';
    if (avgSecond < avgFirst - 5) return 'DEGRADING';
    return 'STABLE';
  }

  /**
   * Get quality statistics
   */
  getQualityStatistics(): {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    averageScore: number;
    byThreshold: Record<string, number>;
  } {
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let totalScore = 0;
    const byThreshold: Record<string, number> = {};

    for (const checks of this.qualityHistory.values()) {
      for (const check of checks) {
        totalChecks++;
        if (check.passed) passedChecks++;
        else failedChecks++;
        totalScore += check.metrics.overallScore;

        const thresholdRange = `${Math.floor(check.metrics.overallScore / 10) * 10}-${Math.floor(check.metrics.overallScore / 10) * 10 + 9}`;
        byThreshold[thresholdRange] = (byThreshold[thresholdRange] || 0) + 1;
      }
    }

    return {
      totalChecks,
      passedChecks,
      failedChecks,
      averageScore: totalChecks > 0 ? totalScore / totalChecks : 0,
      byThreshold,
    };
  }

  /**
   * Clear quality history
   */
  clearHistory(datasetId?: string): void {
    if (datasetId) {
      this.qualityHistory.delete(datasetId);
    } else {
      this.qualityHistory.clear();
    }
  }

  /**
   * Export quality report
   */
  exportQualityReport(): string {
    const stats = this.getQualityStatistics();
    const report = {
      timestamp: new Date(),
      threshold: this.threshold,
      statistics: stats,
      registries: Array.from(this.qualityHistory.entries()).map(([id, checks]) => ({
        registryId: id,
        latestCheck: checks[checks.length - 1],
        trend: this.getQualityTrend(id),
      })),
    };

    return JSON.stringify(report, null, 2);
  }
}

// Singleton instance
export const qualityEngine = new QualityEngine();
