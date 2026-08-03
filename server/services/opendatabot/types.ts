import { OpendatabotErrorCode } from "./errors";

export interface OpendatabotRequest {
  id: string;
  endpoint: string;
  contractorCode: string;
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
  timestamp: string;
  payload?: any;
}

export interface OpendatabotResponse<T = any> {
  source: "Opendatabot Live API" | "Opendatabot Sandbox Emulator";
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
    schemaVersion: string;
  };
}

export interface OpendatabotTransaction {
  id: string;
  endpoint: string;
  contractorCode: string;
  status: number;
  latencyMs: number;
  cache: "HIT" | "MISS";
  timestamp: string;
  requestId: string;
}

export interface OpendatabotAuditLog {
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
