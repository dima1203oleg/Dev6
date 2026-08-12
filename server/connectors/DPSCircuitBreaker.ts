/**
 * DPS Circuit Breaker
 * 
 * Implements circuit breaker pattern to prevent cascading failures
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is open, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 * 
 * Transitions:
 * - CLOSED -> OPEN: When failure threshold is reached
 * - OPEN -> HALF_OPEN: After timeout expires
 * - HALF_OPEN -> CLOSED: When success threshold is reached
 * - HALF_OPEN -> OPEN: On failure during testing
 */

import { CircuitBreakerState, DPSCircuitBreakerConfig, DPSCircuitBreakerStatus } from './types/dps';

export class DPSCircuitBreaker {
  private config: DPSCircuitBreakerConfig;
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;
  private nextAttemptTime: Date | null = null;

  constructor(config: DPSCircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      const now = new Date();
      if (this.nextAttemptTime && now < this.nextAttemptTime) {
        throw new Error('CIRCUIT_BREAKER_OPEN: Service unavailable, circuit is open');
      }
      // Transition to HALF_OPEN for testing
      this.transitionToHalfOpen();
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record a successful request
   */
  private recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed request
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'HALF_OPEN') {
      // Failure during testing, go back to OPEN
      this.transitionToOpen();
    } else if (this.state === 'CLOSED') {
      // Check if failure threshold reached
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    }
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = 'OPEN';
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
    this.successCount = 0;
    console.warn(`[DPSCircuitBreaker] Circuit OPEN after ${this.failureCount} failures. Next attempt at ${this.nextAttemptTime.toISOString()}`);
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = 'HALF_OPEN';
    this.successCount = 0;
    console.info(`[DPSCircuitBreaker] Circuit HALF_OPEN, testing service recovery`);
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    console.info(`[DPSCircuitBreaker] Circuit CLOSED, service recovered`);
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): DPSCircuitBreakerStatus {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Manually reset circuit breaker to CLOSED state
   */
  reset(): void {
    this.transitionToClosed();
  }

  /**
   * Force circuit breaker to OPEN state (for testing)
   */
  forceOpen(): void {
    this.transitionToOpen();
  }
}

// Singleton instance
let circuitBreakerInstance: DPSCircuitBreaker | null = null;

export function getDPSCircuitBreaker(config?: DPSCircuitBreakerConfig): DPSCircuitBreaker {
  if (!circuitBreakerInstance) {
    if (!config) {
      config = {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        resetTimeout: 300000
      };
    }
    circuitBreakerInstance = new DPSCircuitBreaker(config);
  }
  return circuitBreakerInstance;
}

export function resetDPSCircuitBreaker(): void {
  circuitBreakerInstance = null;
}
