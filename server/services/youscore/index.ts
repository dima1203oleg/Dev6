import { governor } from "./requestGovernor";
import { deduplicator } from "./deduplication";
import { youScoreClient } from "./client";
import { auditHub } from "./audit";
import { config } from "./config";
import { YouScoreResponse } from "./types";

export * from "./config";
export * from "./errors";
export * from "./types";
export * from "./rateLimiter";
export * from "./circuitBreaker";
export * from "./retry";
export * from "./deduplication";
export * from "./requestGovernor";
export * from "./client";
export * from "./health";
export * from "./audit";

/**
 * Main entry point to query the YouScore Connector Hub.
 * Coordinates Request Governing, Rate Limiting, Deduplication, and Auditing.
 */
export async function queryYouScore<T = any>(
  endpoint: string,
  contractorCode: string,
  priority: "P0" | "P1" | "P2" | "P3" | "P4" = "P0",
  emulatorFallbackFn?: () => T
): Promise<YouScoreResponse<T>> {
  const code = (contractorCode || "").trim();
  const reqHash = deduplicator.generateHash(endpoint, code);
  const startTime = Date.now();
  const requestId = `req_${Math.random().toString(36).substring(2, 11)}`;

  // List of endpoint mappings inside YouScore OpenAPI specification
  const endpointMappings: Record<string, string> = {
    usr: `v1/usr/${encodeURIComponent(code)}`,
    history: `v1/history/${encodeURIComponent(code)}`,
    shareholders: `v1/shareholders/${encodeURIComponent(code)}`,
    vat: `v1/vat/${encodeURIComponent(code)}`,
    singleTax: `v1/singleTax/${encodeURIComponent(code)}`,
    taxDebt: `v1/taxDebt/${encodeURIComponent(code)}`,
    expressAnalysis: `v1/expressAnalysis/${encodeURIComponent(code)}`,
    finmon: `v1/expressAnalysis/finmon/${encodeURIComponent(code)}`,
    aggressors: `v1/expressAnalysis/aggressors/${encodeURIComponent(code)}`,
    marketScoring: `v1/marketScoring/${encodeURIComponent(code)}`,
    financialScoring: `v1/financialScoring/${encodeURIComponent(code)}`,
    staff: `v1/staff/${encodeURIComponent(code)}`,
    court: `v1/court/${encodeURIComponent(code)}`,
    enforcement: `v1/enforcement/${encodeURIComponent(code)}`,
    sanctions: `v1/sanctions?query=${encodeURIComponent(code)}`,
    peps: `v1/peps?query=${encodeURIComponent(code)}`,
    vehicles: `v1/vehicles/check?query=${encodeURIComponent(code)}`
  };

  const apiPath = endpointMappings[endpoint] || `v1/${endpoint}/${encodeURIComponent(code)}`;

  try {
    // 1. Check deduplication first to coalasce concurrent identical requests (Section 20 & 21)
    const result = await deduplicator.executeCoalesced(reqHash, async () => {
      // 2. Submit task into the Request Governor Queue to enforce concurrency limits and rate limits (Section 8, 9, 12, 13)
      return await governor.submit(endpoint, code, priority, async () => {
        return await youScoreClient.query<T>(endpoint, code, apiPath, emulatorFallbackFn);
      });
    });

    const latencyMs = Date.now() - startTime;

    // Log transaction and audit trail (Section 55 & 59)
    auditHub.logTransaction({
      endpoint: apiPath,
      contractorCode: code,
      status: 200,
      latencyMs,
      cache: "MISS",
      requestId
    });

    auditHub.logAudit({
      entityId: code,
      operation: `QUERY_${endpoint.toUpperCase()}`,
      endpoint: apiPath,
      requestId,
      status: 200,
      latencyMs,
      retryCount: 0
    });

    return result;

  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const status = err.status || 500;

    auditHub.logTransaction({
      endpoint: apiPath,
      contractorCode: code,
      status,
      latencyMs,
      cache: "MISS",
      requestId
    });

    auditHub.logAudit({
      entityId: code,
      operation: `QUERY_${endpoint.toUpperCase()}_FAILED`,
      endpoint: apiPath,
      requestId,
      status,
      latencyMs,
      retryCount: 0
    });

    throw err;
  }
}
