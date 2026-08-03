import { OpendatabotTransaction, OpendatabotAuditLog } from "./types";

export class OpendatabotAuditHub {
  private static instance: OpendatabotAuditHub;
  private transactions: OpendatabotTransaction[] = [];
  private logs: OpendatabotAuditLog[] = [];
  private maxItems = 50;

  private constructor() {}

  public static getInstance(): OpendatabotAuditHub {
    if (!OpendatabotAuditHub.instance) {
      OpendatabotAuditHub.instance = new OpendatabotAuditHub();
    }
    return OpendatabotAuditHub.instance;
  }

  public logTransaction(tx: Omit<OpendatabotTransaction, "id" | "timestamp">): void {
    const transaction: OpendatabotTransaction = {
      ...tx,
      id: `tx_odb_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
    };

    this.transactions.unshift(transaction);
    if (this.transactions.length > this.maxItems) {
      this.transactions.pop();
    }
  }

  public logAudit(audit: Omit<OpendatabotAuditLog, "auditId" | "timestamp">): void {
    const log: OpendatabotAuditLog = {
      ...audit,
      auditId: `audit_odb_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxItems) {
      this.logs.pop();
    }
  }

  public getRecentTransactions(): OpendatabotTransaction[] {
    return this.transactions;
  }

  public getMetrics() {
    const total = this.transactions.length;
    const successes = this.transactions.filter((t) => t.status >= 200 && t.status < 300).length;
    const failures = total - successes;
    const latencySum = this.transactions.reduce((sum, t) => sum + t.latencyMs, 0);
    const avgLatency = total > 0 ? Math.round(latencySum / total) : 0;
    const cacheHits = this.transactions.filter((t) => t.cache === "HIT").length;
    const cacheHitRatio = total > 0 ? `${Math.round((cacheHits / total) * 100)}%` : "0%";

    return {
      requests_total: total,
      requests_success_total: successes,
      requests_failed_total: failures,
      rate_limit_429_total: this.transactions.filter((t) => t.status === 429).length,
      average_latency_ms: avgLatency,
      circuit_breaker_state: "CLOSED",
      cache_hit_ratio: cacheHitRatio,
      cache_hits: cacheHits,
      cache_misses: total - cacheHits,
    };
  }
}

export const auditHub = OpendatabotAuditHub.getInstance();
