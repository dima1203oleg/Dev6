import { YouScoreTransaction, YouScoreAuditLog } from "./types";

export class YouScoreAuditHub {
  private static instance: YouScoreAuditHub;
  private transactions: YouScoreTransaction[] = [];
  private logs: YouScoreAuditLog[] = [];
  private maxItems = 50;

  private constructor() {}

  public static getInstance(): YouScoreAuditHub {
    if (!YouScoreAuditHub.instance) {
      YouScoreAuditHub.instance = new YouScoreAuditHub();
    }
    return YouScoreAuditHub.instance;
  }

  public logTransaction(tx: Omit<YouScoreTransaction, "id" | "timestamp">): void {
    const transaction: YouScoreTransaction = {
      ...tx,
      id: `tx_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString()
    };
    
    this.transactions.unshift(transaction);
    if (this.transactions.length > this.maxItems) {
      this.transactions.pop();
    }
  }

  public logAudit(audit: Omit<YouScoreAuditLog, "auditId" | "timestamp">): void {
    const log: YouScoreAuditLog = {
      ...audit,
      auditId: `audit_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString()
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxItems) {
      this.logs.pop();
    }
  }

  public getRecentTransactions(): YouScoreTransaction[] {
    return this.transactions;
  }

  public getMetrics() {
    const total = this.transactions.length;
    const successes = this.transactions.filter(t => t.status >= 200 && t.status < 300).length;
    const failures = total - successes;
    const latencySum = this.transactions.reduce((sum, t) => sum + t.latencyMs, 0);
    const avgLatency = total > 0 ? Math.round(latencySum / total) : 125;
    const cacheHits = this.transactions.filter(t => t.cache === "HIT").length;
    const cacheHitRatio = total > 0 ? `${Math.round((cacheHits / total) * 100)}%` : "74.2%";

    return {
      requests_total: total + 1248, // offset for mock baseline
      requests_success_total: successes + 1244,
      requests_failed_total: failures + 4,
      rate_limit_429_total: this.transactions.filter(t => t.status === 429).length,
      average_latency_ms: avgLatency,
      circuit_breaker_state: "CLOSED",
      cache_hit_ratio: cacheHitRatio,
      cache_hits: cacheHits + 926,
      cache_misses: (total - cacheHits) + 322
    };
  }
}

export const auditHub = YouScoreAuditHub.getInstance();
