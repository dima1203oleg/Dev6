import { YouScoreRateLimiter } from "./rateLimiter";
import { YouScoreCircuitBreaker } from "./circuitBreaker";
import { YouScoreError } from "./errors";
import { config } from "./config";

interface QueueItem {
  id: string;
  endpoint: string;
  contractorCode: string;
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
  apiCallFn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  submittedAt: number;
}

export class YouScoreRequestGovernor {
  private static instance: YouScoreRequestGovernor;
  private queue: QueueItem[] = [];
  private activeCount = 0;
  private maxConcurrency = config.YOUSCORE_MAX_CONCURRENT_REQUESTS;

  private constructor() {
    // Start periodic process loop
    setInterval(() => this.processQueue(), 100);
  }

  public static getInstance(): YouScoreRequestGovernor {
    if (!YouScoreRequestGovernor.instance) {
      YouScoreRequestGovernor.instance = new YouScoreRequestGovernor();
    }
    return YouScoreRequestGovernor.instance;
  }

  /**
   * Submits an API call to the Request Governor queue.
   */
  public submit<T>(
    endpoint: string,
    contractorCode: string,
    priority: "P0" | "P1" | "P2" | "P3" | "P4",
    apiCallFn: () => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const item: QueueItem = {
        id: `req_${Math.random().toString(36).substring(2, 11)}`,
        endpoint,
        contractorCode,
        priority,
        apiCallFn,
        resolve,
        reject,
        submittedAt: Date.now()
      };

      this.queue.push(item);
      // Sort the queue by priority (P0 highest, P4 lowest) and submission time
      this.sortQueue();
      
      // Trigger execution attempt
      this.processQueue();
    });
  }

  private sortQueue(): void {
    const priorityWeights = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
    this.queue.sort((a, b) => {
      const weightDiff = priorityWeights[a.priority] - priorityWeights[b.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.submittedAt - b.submittedAt;
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;
    if (this.activeCount >= this.maxConcurrency) return;

    // Check circuit breaker (Section 18)
    const circuitBreaker = YouScoreCircuitBreaker.getInstance();
    if (!circuitBreaker.canRequest()) {
      // Circuit is open, we can't send requests right now
      return;
    }

    // Check rate limiter (Section 10)
    const rateLimiter = YouScoreRateLimiter.getInstance();
    const rateCheck = await rateLimiter.checkLimit();

    if (!rateCheck.allowed) {
      // Rate limit hit, reschedule check after the waitMs
      console.warn(`[YouScoreRequestGovernor] Rate limited. Postponing queue processing by ${rateCheck.waitMs}ms`);
      setTimeout(() => this.processQueue(), rateCheck.waitMs);
      return;
    }

    // Dequeue highest priority item
    const item = this.queue.shift();
    if (!item) return;

    this.activeCount++;

    try {
      // Execute the request
      const result = await item.apiCallFn();
      circuitBreaker.onSuccess();
      item.resolve(result);
    } catch (err: any) {
      circuitBreaker.onFailure();
      item.reject(err);
    } finally {
      this.activeCount--;
      // Keep processing
      this.processQueue();
    }
  }

  public getQueueDepth(): number {
    return this.queue.length;
  }
}

export const governor = YouScoreRequestGovernor.getInstance();
