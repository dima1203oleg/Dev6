/**
 * MASTER PRODUCTION BATTLEFIELD SPECIFICATION v5.0
 * PREDATOR Analytics - Autonomous Production Certification & Continuous Validation Framework
 * 
 * Registry Intelligence Registry
 * 
 * Maintains digital passports for 170+ registry sources with:
 * - Availability tracking
 * - Average RTT
 * - SLA compliance
 * - Failure history
 * - Last successful sync
 * - Last API change
 * - OpenAPI version
 * - Reliability rating
 * - Last verification date
 * - Responsible connector
 */

export interface RegistryPassport {
  id: string;
  category: string;
  provider: string;
  officialSource: boolean;
  connector: string;
  connectorVersion: string;
  apiVersion: string;
  authMethod: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'CERTIFICATE' | 'NONE';
  rateLimit: string;
  retryPolicy: string;
  timeout: number;
  schemaHash: string;
  lastSuccess: string;
  averageLatency: number;
  availability: number;
  sla: string;
  confidence: number;
  dataQualityScore: number;
  healthScore: number;
  lastVerification: string;
  failureHistory: FailureRecord[];
  apiChangeHistory: ApiChangeRecord[];
}

export interface FailureRecord {
  timestamp: string;
  errorType: string;
  errorMessage: string;
  duration: number;
  resolved: boolean;
  resolvedAt?: string;
}

export interface ApiChangeRecord {
  timestamp: string;
  changeType: 'SCHEMA_CHANGE' | 'ENDPOINT_CHANGE' | 'AUTH_CHANGE' | 'RATE_LIMIT_CHANGE';
  description: string;
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  validated: boolean;
}

export interface ConnectorScore {
  connectorId: string;
  registryId: string;
  overallScore: number;
  status: 'CERTIFIED' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'CRITICAL';
  breakdown: {
    availability: number;
    latency: number;
    schemaStability: number;
    errorRate: number;
    dataQuality: number;
  };
  weights: {
    availability: number;
    latency: number;
    schemaStability: number;
    errorRate: number;
    dataQuality: number;
  };
  lastCalculated: string;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

export class RegistryIntelligence {
  private passports: Map<string, RegistryPassport> = new Map();
  private connectorScores: Map<string, ConnectorScore> = new Map();
  private scoreWeights = {
    availability: 0.25,
    latency: 0.15,
    schemaStability: 0.20,
    errorRate: 0.20,
    dataQuality: 0.20
  };

  /**
   * Register a registry passport
   */
  registerPassport(passport: RegistryPassport): void {
    this.passports.set(passport.id, passport);
    console.log(`[REGISTRY INTELLIGENCE] Registered passport: ${passport.id}`);
  }

  /**
   * Update registry health metrics
   */
  async updateHealthMetrics(
    registryId: string,
    latency: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    const passport = this.passports.get(registryId);
    if (!passport) return;

    // Update average latency (exponential moving average)
    passport.averageLatency = this.updateEma(passport.averageLatency, latency, 0.1);

    // Update availability
    if (success) {
      passport.lastSuccess = new Date().toISOString();
      passport.availability = this.updateEma(passport.availability, 1, 0.01);
    } else {
      passport.availability = this.updateEma(passport.availability, 0, 0.01);
      
      // Record failure
      passport.failureHistory.push({
        timestamp: new Date().toISOString(),
        errorType: error ? 'API_ERROR' : 'UNKNOWN',
        errorMessage: error || 'Unknown error',
        duration: 0,
        resolved: false
      });
    }

    // Recalculate health score
    passport.healthScore = this.calculateHealthScore(passport);
    
    // Recalculate connector score
    await this.calculateConnectorScore(registryId);
  }

  /**
   * Record API change
   */
  recordApiChange(
    registryId: string,
    changeType: ApiChangeRecord['changeType'],
    description: string,
    impact: ApiChangeRecord['impact']
  ): void {
    const passport = this.passports.get(registryId);
    if (!passport) return;

    const change: ApiChangeRecord = {
      timestamp: new Date().toISOString(),
      changeType,
      description,
      impact,
      validated: false
    };

    passport.apiChangeHistory.push(change);
    
    // If critical change, mark connector for revalidation
    if (impact === 'CRITICAL' || impact === 'HIGH') {
      console.warn(`[REGISTRY INTELLIGENCE] Critical API change detected for ${registryId}: ${description}`);
      // TODO: Trigger revalidation workflow
    }
  }

  /**
   * Calculate health score for a registry
   */
  private calculateHealthScore(passport: RegistryPassport): number {
    const availabilityScore = passport.availability * 100;
    const latencyScore = this.calculateLatencyScore(passport.averageLatency);
    const dataQualityScore = passport.dataQualityScore * 100;
    const confidenceScore = passport.confidence * 100;
    const failurePenalty = this.calculateFailurePenalty(passport.failureHistory);

    const healthScore = Math.round(
      (availabilityScore * 0.30) +
      (latencyScore * 0.20) +
      (dataQualityScore * 0.25) +
      (confidenceScore * 0.15) +
      (100 - failurePenalty) * 0.10
    );

    return Math.max(0, Math.min(100, healthScore));
  }

  /**
   * Calculate latency score (lower is better)
   */
  private calculateLatencyScore(latency: number): number {
    if (latency < 100) return 100;
    if (latency < 500) return 90;
    if (latency < 1000) return 70;
    if (latency < 2000) return 50;
    if (latency < 5000) return 30;
    return 10;
  }

  /**
   * Calculate failure penalty based on recent failures
   */
  private calculateFailurePenalty(failures: FailureRecord[]): number {
    const recentFailures = failures.filter(f => {
      const age = Date.now() - new Date(f.timestamp).getTime();
      return age < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    return Math.min(100, recentFailures.length * 10);
  }

  /**
   * Calculate connector score
   */
  async calculateConnectorScore(registryId: string): Promise<ConnectorScore> {
    const passport = this.passports.get(registryId);
    if (!passport) {
      throw new Error(`Registry passport not found: ${registryId}`);
    }

    const breakdown = {
      availability: passport.availability * 100,
      latency: this.calculateLatencyScore(passport.averageLatency),
      schemaStability: this.calculateSchemaStability(passport),
      errorRate: this.calculateErrorRate(passport),
      dataQuality: passport.dataQualityScore * 100
    };

    const overallScore = Math.round(
      (breakdown.availability * this.scoreWeights.availability) +
      (breakdown.latency * this.scoreWeights.latency) +
      (breakdown.schemaStability * this.scoreWeights.schemaStability) +
      (breakdown.errorRate * this.scoreWeights.errorRate) +
      (breakdown.dataQuality * this.scoreWeights.dataQuality)
    );

    const status = this.determineConnectorStatus(overallScore);
    const trend = this.calculateTrend(registryId);

    const score: ConnectorScore = {
      connectorId: passport.connector,
      registryId,
      overallScore,
      status,
      breakdown,
      weights: { ...this.scoreWeights },
      lastCalculated: new Date().toISOString(),
      trend
    };

    this.connectorScores.set(registryId, score);
    
    return score;
  }

  /**
   * Calculate schema stability based on API change history
   */
  private calculateSchemaStability(passport: RegistryPassport): number {
    const recentChanges = passport.apiChangeHistory.filter(c => {
      const age = Date.now() - new Date(c.timestamp).getTime();
      return age < 30 * 24 * 60 * 60 * 1000; // Last 30 days
    });

    if (recentChanges.length === 0) return 100;
    
    const penalty = recentChanges.reduce((sum, change) => {
      const impactPenalty = change.impact === 'CRITICAL' ? 30 : 
                           change.impact === 'HIGH' ? 20 :
                           change.impact === 'MEDIUM' ? 10 : 5;
      return sum + impactPenalty;
    }, 0);

    return Math.max(0, 100 - penalty);
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(passport: RegistryPassport): number {
    const totalAttempts = passport.failureHistory.length + 1; // +1 for current success
    const failures = passport.failureHistory.length;
    const errorRate = failures / totalAttempts;
    
    return Math.round((1 - errorRate) * 100);
  }

  /**
   * Determine connector status based on score
   */
  private determineConnectorStatus(score: number): ConnectorScore['status'] {
    if (score >= 95) return 'CERTIFIED';
    if (score >= 85) return 'HEALTHY';
    if (score >= 70) return 'DEGRADED';
    if (score >= 50) return 'UNHEALTHY';
    return 'CRITICAL';
  }

  /**
   * Calculate trend based on historical scores
   */
  private calculateTrend(registryId: string): ConnectorScore['trend'] {
    // TODO: Implement trend calculation based on historical scores
    return 'STABLE';
  }

  /**
   * Get registry passport
   */
  getPassport(registryId: string): RegistryPassport | null {
    return this.passports.get(registryId) || null;
  }

  /**
   * Get connector score
   */
  getConnectorScore(registryId: string): ConnectorScore | null {
    return this.connectorScores.get(registryId) || null;
  }

  /**
   * Get all connector scores
   */
  getAllConnectorScores(): ConnectorScore[] {
    return Array.from(this.connectorScores.values());
  }

  /**
   * Get registries by status
   */
  getRegistriesByStatus(status: ConnectorScore['status']): ConnectorScore[] {
    return Array.from(this.connectorScores.values()).filter(s => s.status === status);
  }

  /**
   * Get registry intelligence summary
   */
  getSummary(): {
    total: number;
    certified: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    critical: number;
    averageScore: number;
  } {
    const scores = Array.from(this.connectorScores.values());
    
    return {
      total: scores.length,
      certified: scores.filter(s => s.status === 'CERTIFIED').length,
      healthy: scores.filter(s => s.status === 'HEALTHY').length,
      degraded: scores.filter(s => s.status === 'DEGRADED').length,
      unhealthy: scores.filter(s => s.status === 'UNHEALTHY').length,
      critical: scores.filter(s => s.status === 'CRITICAL').length,
      averageScore: scores.length > 0 
        ? Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length)
        : 0
    };
  }

  /**
   * Update exponential moving average
   */
  private updateEma(current: number, newValue: number, alpha: number): number {
    return alpha * newValue + (1 - alpha) * current;
  }

  /**
   * Mark connector for revalidation after API change
   */
  markForRevalidation(registryId: string): void {
    console.log(`[REGISTRY INTELLIGENCE] Marking ${registryId} for revalidation`);
    // TODO: Integrate with WorkflowEngine to trigger revalidation DAG
  }
}
