import { config } from "./config";

export class OpendatabotRateLimiter {
  private static instance: OpendatabotRateLimiter;
  private requests: number[] = [];

  private constructor() {}

  public static getInstance(): OpendatabotRateLimiter {
    if (!OpendatabotRateLimiter.instance) {
      OpendatabotRateLimiter.instance = new OpendatabotRateLimiter();
    }
    return OpendatabotRateLimiter.instance;
  }

  /**
   * Checks if a request is allowed and registers it if true.
   * If not allowed, returns the milliseconds to wait.
   */
  public async checkLimit(): Promise<{ allowed: boolean; waitMs: number }> {
    const now = Date.now();
    this.cleanUp(now);

    const hitsIn5s = this.getHitsInWindow(now, 5000);
    const hitsIn60s = this.getHitsInWindow(now, 60000);

    const limit5s = config.OPENDATABOT_RATE_5S;
    const limit60s = config.OPENDATABOT_RATE_1M;

    if (hitsIn5s >= limit5s) {
      const oldestIn5s = this.requests[this.requests.length - limit5s];
      const waitMs = Math.max(0, oldestIn5s + 5000 - now);
      return { allowed: false, waitMs: waitMs + 50 }; // Add a tiny 50ms buffer to be safe
    }

    if (hitsIn60s >= limit60s) {
      const oldestIn60s = this.requests[this.requests.length - limit60s];
      const waitMs = Math.max(0, oldestIn60s + 60000 - now);
      return { allowed: false, waitMs: waitMs + 50 };
    }

    // Register hit
    this.requests.push(now);
    return { allowed: true, waitMs: 0 };
  }

  public getStatus() {
    const now = Date.now();
    this.cleanUp(now);
    const hits5s = this.getHitsInWindow(now, 5000);
    const hits60s = this.getHitsInWindow(now, 60000);
    return {
      limitPerMinute: config.OPENDATABOT_RATE_1M,
      remainingPerMinute: Math.max(0, config.OPENDATABOT_RATE_1M - hits60s),
      limitPer5Sec: config.OPENDATABOT_RATE_5S,
      remainingPer5Sec: Math.max(0, config.OPENDATABOT_RATE_5S - hits5s),
      status: hits60s > config.OPENDATABOT_RATE_1M * 0.8 || hits5s > config.OPENDATABOT_RATE_5S * 0.8 ? "ORANGE" : "GREEN"
    };
  }

  private cleanUp(now: number): void {
    const cutoff = now - 60000;
    this.requests = this.requests.filter(t => t >= cutoff);
  }

  private getHitsInWindow(now: number, windowMs: number): number {
    const cutoff = now - windowMs;
    let count = 0;
    for (let i = this.requests.length - 1; i >= 0; i--) {
      if (this.requests[i] >= cutoff) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}

export const rateLimiter = OpendatabotRateLimiter.getInstance();
