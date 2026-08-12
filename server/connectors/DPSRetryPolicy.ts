/**
 * DPS Retry Policy
 * 
 * Implements retry policy with exponential backoff and jitter
 * 
 * Retry Rules:
 * - Retry only for transient infrastructure errors (408, 429, 500, 502, 503, 504)
 * - NO retry for: 400, 401, 403, 404, invalid token, schema mismatch
 * - Exponential backoff with jitter
 * - Maximum retry count
 * - Quota protection (check token availability before retry)
 */

import { DPSRetryPolicyConfig } from './types/dps';

export class DPSRetryPolicy {
  private config: DPSRetryPolicyConfig;

  constructor(config: DPSRetryPolicyConfig) {
    this.config = config;
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    checkQuota?: () => Promise<boolean>
  ): Promise<T> {
    let lastError: Error | undefined;
    let totalDelay = 0;

    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
      try {
        // Check quota before attempt (if quota checker provided)
        if (checkQuota && !(await checkQuota())) {
          throw new Error('TAX_CABINET_QUOTA_EXHAUSTED: No token quota available');
        }

        const result = await fn();
        
        // Success - return result
        if (attempt > 1) {
          console.info(`[DPSRetryPolicy] Success on attempt ${attempt}/${this.config.maxRetries + 1}`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        const statusCode = error.statusCode || error.status || 0;

        // Check if error is retryable
        if (!this.isRetryable(statusCode, error)) {
          console.error(`[DPSRetryPolicy] Non-retryable error on attempt ${attempt}: ${error.message}`);
          throw error;
        }

        // Check if this was the last attempt
        if (attempt >= this.config.maxRetries + 1) {
          console.error(`[DPSRetryPolicy] Max retries (${this.config.maxRetries}) exceeded`);
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);
        totalDelay += delay;

        console.warn(`[DPSRetryPolicy] Retry attempt ${attempt + 1}/${this.config.maxRetries + 1} after ${delay}ms delay (status: ${statusCode})`);
        
        // Wait before retry
        await this.sleep(delay);
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('DPSRetryPolicy: Unknown error');
  }

  /**
   * Check if error is retryable based on status code and error type
   */
  private isRetryable(statusCode: number, error: Error): boolean {
    // Non-retryable status codes
    if (this.config.nonRetryableStatusCodes.includes(statusCode)) {
      return false;
    }

    // Specific error messages that are not retryable
    const nonRetryableMessages = [
      'invalid token',
      'token revoked',
      'token expired',
      'unauthorized',
      'forbidden',
      'not found',
      'bad request',
      'schema mismatch',
      'validation error',
      'TAX_CABINET_QUOTA_EXHAUSTED',
      'TAX_CABINET_TOKENS_EXHAUSTED'
    ];

    const errorMessage = error.message.toLowerCase();
    if (nonRetryableMessages.some(msg => errorMessage.includes(msg))) {
      return false;
    }

    // Retryable status codes
    if (this.config.retryableStatusCodes.includes(statusCode)) {
      return true;
    }

    // Network errors (no status code)
    if (statusCode === 0) {
      return true;
    }

    // Default to non-retryable for unknown status codes
    return false;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: initialDelay * (multiplier ^ (attempt - 1))
    const exponentialDelay = this.config.initialDelay * Math.pow(this.config.multiplier, attempt - 1);
    
    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);
    
    // Add jitter if enabled (random ±20%)
    if (this.config.jitter) {
      const jitterFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      return Math.round(cappedDelay * jitterFactor);
    }
    
    return cappedDelay;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    multiplier: number;
    jitter: boolean;
  } {
    return {
      maxRetries: this.config.maxRetries,
      initialDelay: this.config.initialDelay,
      maxDelay: this.config.maxDelay,
      multiplier: this.config.multiplier,
      jitter: this.config.jitter
    };
  }
}

// Singleton instance
let retryPolicyInstance: DPSRetryPolicy | null = null;

export function getDPSRetryPolicy(config?: DPSRetryPolicyConfig): DPSRetryPolicy {
  if (!retryPolicyInstance) {
    if (!config) {
      config = {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 60000,
        multiplier: 2,
        jitter: true,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        nonRetryableStatusCodes: [400, 401, 403, 404]
      };
    }
    retryPolicyInstance = new DPSRetryPolicy(config);
  }
  return retryPolicyInstance;
}

export function resetDPSRetryPolicy(): void {
  retryPolicyInstance = null;
}
