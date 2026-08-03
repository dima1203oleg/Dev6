import { YouScoreErrorCode } from "./errors";

export interface YouScoreRequest {
  id: string;
  endpoint: string;
  contractorCode: string;
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
  timestamp: string;
  payload?: any;
}

export interface YouScoreResponse<T = any> {
  source: "YouScore Live OpenAPI";
  status: "SUCCESS" | "RATE_LIMITED" | "ERROR";
  connected: boolean;
  endpoint: string;
  contractorCode: string;
  retrievedAt: string;
  data: T;
  freshness: "FRESH" | "AGING" | "STALE" | "SOURCE_NOT_UPDATED" | "UNKNOWN";
  evidence?: {
    evidenceId: string;
    contentHash: string;
  };
}

export interface YouScoreTransaction {
  id: string;
  endpoint: string;
  contractorCode: string;
  status: number;
  latencyMs: number;
  cache: "HIT" | "MISS";
  timestamp: string;
  requestId: string;
}

export interface YouScoreAuditLog {
  auditId: string;
  userId?: string;
  caseId?: string;
  entityId: string;
  operation: string;
  endpoint: string;
  requestId: string;
  timestamp: string;
  status: number;
  latencyMs: number;
  retryCount: number;
}
