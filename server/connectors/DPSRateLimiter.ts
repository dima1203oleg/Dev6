/**
 * DPS Rate Limiter
 * 
 * Implements rate limiting for DPS API calls:
 * - 60 requests per minute
 * - 1000 requests per hour
 * - 1000 requests per day (enforced by Token Manager)
 * 
 * Uses sliding window algorithm for accurate rate limiting
 */

import { DPSRateLimiterConfig, DPSRateLimitStatus } from './types/dps';

interface RateLimitWindow {
  count: number;
  resetTime: Date;
}

export class DPSRateLimiter {
  private config: DPSRateLimiterConfig;
  private minuteWindow: RateLimitWindow;
  private hourWindow: RateLimitWindow;
  private requestTimestamps: number[] = [];

  constructor(config: DPSRateLimiterConfig) {
    this.config = config;
    const now = new Date();
    this.minuteWindow = {
      count: 0,
      resetTime: new Date(now.getTime() + 60000) // 1 minute
    };
    this.hourWindow = {
      count: 0,
      resetTime: new Date(now.getTime() + 3600000) // 1 hour
    };
  }

  /**
   * Check if request is allowed under rate limits
   */
  async checkLimit(): Promise<DPSRateLimitStatus> {
    const now = Date.now();

    // Clean up old timestamps
    this.cleanupTimestamps(now);

    // Check minute limit
    if (this.minuteWindow.count >= this.config.requestsPerMinute) {
      return {
        allowed: false,
        remainingQuota: 0,
        resetTime: this.minuteWindow.resetTime,
        reason: `MINUTE_LIMIT_EXCEEDED: ${this.minuteWindow.count}/${this.config.requestsPerMinute} requests in last minute`
      };
    }

    // Check hour limit
    if (this.hourWindow.count >= this.config.requestsPerHour) {
      return {
        allowed: false,
        remainingQuota: 0,
        resetTime: this.hourWindow.resetTime,
        reason: `HOUR_LIMIT_EXCEEDED: ${this.hourWindow.count}/${this.config.requestsPerHour} requests in last hour`
      };
    }

    // Check day limit (via request timestamps)
    const dayAgo = now - 86400000; // 24 hours
    const dayRequests = this.requestTimestamps.filter(ts => ts > dayAgo).length;
    if (dayRequests >= this.config.requestsPerDay) {
      const oldestTimestamp = this.requestTimestamps[0];
      if (oldestTimestamp) {
        const resetTime = new Date(oldestTimestamp + 86400000);
        return {
          allowed: false,
          remainingQuota: 0,
          resetTime,
          reason: `DAY_LIMIT_EXCEEDED: ${dayRequests}/${this.config.requestsPerDay} requests in last 24 hours`
        };
      }
    }

    // Request allowed
    return {
      allowed: true,
      remainingQuota: this.config.requestsPerMinute - this.minuteWindow.count - 1,
      resetTime: this.minuteWindow.resetTime
    };
  }

  /**
   * Record a successful request
   */
  recordRequest(): void {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.minuteWindow.count++;
    this.hourWindow.count++;
  }

  /**
   * Clean up old timestamps and reset windows if needed
   */
  private cleanupTimestamps(now: number): void {
    // Reset minute window if needed
    if (now >= this.minuteWindow.resetTime.getTime()) {
      this.minuteWindow.count = 0;
      this.minuteWindow.resetTime = new Date(now + 60000);
    }

    // Reset hour window if needed
    if (now >= this.hourWindow.resetTime.getTime()) {
      this.hourWindow.count = 0;
      this.hourWindow.resetTime = new Date(now + 3600000);
    }

    // Clean up old timestamps (keep last 24 hours)
    const dayAgo = now - 86400000;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > dayAgo);
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    minute: { count: number; limit: number; resetTime: Date };
    hour: { count: number; limit: number; resetTime: Date };
    day: { count: number; limit: number };
  } {
    const now = Date.now();
    const dayAgo = now - 86400000;
    const dayCount = this.requestTimestamps.filter(ts => ts > dayAgo).length;

    return {
      minute: {
        count: this.minuteWindow.count,
        limit: this.config.requestsPerMinute,
        resetTime: this.minuteWindow.resetTime
      },
      hour: {
        count: this.hourWindow.count,
        limit: this.config.requestsPerHour,
        resetTime: this.hourWindow.resetTime
      },
      day: {
        count: dayCount,
        limit: this.config.requestsPerDay
      }
    };
  }

  /**
   * Reset all counters (for testing)
   */
  reset(): void {
    const now = new Date();
    this.minuteWindow = {
      count: 0,
      resetTime: new Date(now.getTime() + 60000)
    };
    this.hourWindow = {
      count: 0,
      resetTime: new Date(now.getTime() + 3600000)
    };
    this.requestTimestamps = [];
  }
}

// Singleton instance
let rateLimiterInstance: DPSRateLimiter | null = null;

export function getDPSRateLimiter(config?: DPSRateLimiterConfig): DPSRateLimiter {
  if (!rateLimiterInstance) {
    if (!config) {
      config = {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 1000,
        backoffInitialDelay: 1000,
        backoffMaxDelay: 60000,
        backoffMultiplier: 2
      };
    }
    rateLimiterInstance = new DPSRateLimiter(config);
  }
  return rateLimiterInstance;
}

export function resetDPSRateLimiter(): void {
  rateLimiterInstance = null;
}
