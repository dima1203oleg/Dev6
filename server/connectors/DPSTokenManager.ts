/**
 * DPS Token Manager
 * 
 * Manages DPS API tokens with 1000 requests/day limit
 * Implements secure token storage, quota tracking, and automatic rotation
 * 
 * CRITICAL: 1000 requests/day per token, after which token is auto-cancelled
 */

import crypto from 'crypto';
import { DPSTokenUsage, DPSTokenManagerConfig } from './types/dps';

export class DPSTokenManager {
  private config: DPSTokenManagerConfig;
  private tokenUsage: Map<string, DPSTokenUsage> = new Map();
  private tokenHashes: string[] = [];
  private currentIndex = 0;

  constructor(config: DPSTokenManagerConfig) {
    this.config = config;
    this.initializeTokens();
  }

  /**
   * Initialize token hashes from raw tokens
   * Never store raw tokens in memory or logs
   */
  private initializeTokens(): void {
    this.tokenHashes = this.config.tokens.map(token => 
      crypto.createHash('sha256').update(token).digest('hex')
    );
  }

  /**
   * Get next available token with quota protection
   * @throws Error if all tokens are exhausted
   */
  async getToken(): Promise<string> {
    // Check if all tokens are exhausted
    if (this.tokenHashes.length === 0) {
      throw new Error('TAX_CABINET_TOKENS_EXHAUSTED: No tokens available');
    }

    // Try to find a token with available quota
    for (let i = 0; i < this.tokenHashes.length; i++) {
      const tokenHash = this.tokenHashes[this.currentIndex];
      if (!tokenHash) continue;
      const usage = this.tokenUsage.get(tokenHash);

      if (!usage) {
        // First time using this token
        this.tokenUsage.set(tokenHash, {
          tokenHash,
          requestCount: 0,
          lastResetDate: new Date(),
          remainingQuota: this.config.maxRequestsPerDay,
          quotaPercentage: 0,
          status: 'ACTIVE'
        });
        const token = this.config.tokens[this.currentIndex];
        if (token) return token;
        continue;
      }

      // Check if quota is available
      if (usage.remainingQuota > 0) {
        // Check if we need to reset counter (new day)
        if (this.isNewDay(usage.lastResetDate)) {
          usage.requestCount = 0;
          usage.remainingQuota = this.config.maxRequestsPerDay;
          usage.quotaPercentage = 0;
          usage.lastResetDate = new Date();
          usage.status = 'ACTIVE';
        }

        // Check quota percentage
        const percentage = (usage.requestCount / this.config.maxRequestsPerDay) * 100;
        usage.quotaPercentage = percentage;

        // Update status based on thresholds
        if (percentage >= this.config.criticalThreshold) {
          usage.status = 'CRITICAL';
          this.logWarning(`Token ${(tokenHash || '').substring(0, 8)}... at CRITICAL quota: ${percentage.toFixed(1)}%`);
        } else if (percentage >= this.config.highWarningThreshold) {
          usage.status = 'WARNING';
          this.logWarning(`Token ${(tokenHash || '').substring(0, 8)}... at HIGH WARNING quota: ${percentage.toFixed(1)}%`);
        } else if (percentage >= this.config.warningThreshold) {
          usage.status = 'WARNING';
        }

        // Check if exhausted
        if (usage.requestCount >= this.config.maxRequestsPerDay) {
          usage.status = 'EXHAUSTED';
          usage.remainingQuota = 0;
          this.logError(`Token ${(tokenHash || '').substring(0, 8)}... EXHAUSTED`);

          // Move to next token
          this.currentIndex = (this.currentIndex + 1) % this.tokenHashes.length;
          continue;
        }

        // Use this token
        usage.requestCount++;
        usage.remainingQuota--;
        const token = this.config.tokens[this.currentIndex];
        if (token) return token;
      }

      // Token exhausted, move to next
      this.currentIndex = (this.currentIndex + 1) % this.tokenHashes.length;
    }

    // All tokens exhausted
    throw new Error('TAX_CABINET_TOKENS_EXHAUSTED: All tokens have reached daily quota limit');
  }

  /**
   * Record successful API call
   */
  recordSuccess(tokenHash: string): void {
    const usage = this.tokenUsage.get(tokenHash);
    if (usage) {
      // Already incremented in getToken()
    }
  }

  /**
   * Record failed API call
   */
  recordFailure(tokenHash: string, error: Error): void {
    const usage = this.tokenUsage.get(tokenHash);
    if (usage) {
      // Don't increment counter on failure
      // But log the error
      this.logError(`Token ${(tokenHash || '').substring(0, 8)}... failed: ${error.message}`);
    }
  }

  /**
   * Check if date has changed (new day)
   */
  private isNewDay(lastReset: Date): boolean {
    const now = new Date();
    return lastReset.getDate() !== now.getDate() ||
           lastReset.getMonth() !== now.getMonth() ||
           lastReset.getFullYear() !== now.getFullYear();
  }

  /**
   * Get token usage statistics
   */
  getTokenUsage(): DPSTokenUsage[] {
    return Array.from(this.tokenUsage.values());
  }

  /**
   * Get overall quota status
   */
  getQuotaStatus(): {
    totalTokens: number;
    activeTokens: number;
    exhaustedTokens: number;
    totalRemainingQuota: number;
    totalRequestsToday: number;
  } {
    const usages = this.getTokenUsage();
    const activeTokens = usages.filter(u => u.status === 'ACTIVE').length;
    const exhaustedTokens = usages.filter(u => u.status === 'EXHAUSTED').length;
    const totalRemainingQuota = usages.reduce((sum, u) => sum + u.remainingQuota, 0);
    const totalRequestsToday = usages.reduce((sum, u) => sum + u.requestCount, 0);

    return {
      totalTokens: this.tokenHashes.length,
      activeTokens,
      exhaustedTokens,
      totalRemainingQuota,
      totalRequestsToday
    };
  }

  /**
   * Force reset all counters (for testing or manual intervention)
   */
  resetAllCounters(): void {
    this.tokenUsage.clear();
    this.currentIndex = 0;
    this.logWarning('All token counters reset manually');
  }

  /**
   * Mark token as exhausted (e.g., due to API cancellation)
   */
  markTokenExhausted(tokenHash: string): void {
    const usage = this.tokenUsage.get(tokenHash);
    if (usage) {
      usage.status = 'EXHAUSTED';
      usage.remainingQuota = 0;
      this.logError(`Token ${tokenHash.substring(0, 8)}... marked as EXHAUSTED`);
    }
  }

  /**
   * Calculate token hash from raw token
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Logging helpers
   */
  private logWarning(message: string): void {
    console.warn(`[DPSTokenManager] ${message}`);
  }

  private logError(message: string): void {
    console.error(`[DPSTokenManager] ${message}`);
  }
}

// Singleton instance
let tokenManagerInstance: DPSTokenManager | null = null;

export function getDPSTokenManager(config?: DPSTokenManagerConfig): DPSTokenManager {
  if (!tokenManagerInstance) {
    if (!config) {
      throw new Error('DPSTokenManager config required for first initialization');
    }
    tokenManagerInstance = new DPSTokenManager(config);
  }
  return tokenManagerInstance;
}

export function resetDPSTokenManager(): void {
  tokenManagerInstance = null;
}
