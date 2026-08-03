import { governor } from "./requestGovernor";
import { deduplicator } from "./deduplication";
import { opendatabotClient } from "./client";
import { auditHub } from "./audit";
import { config } from "./config";
import { OpendatabotResponse } from "./types";

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
 * Main entry point to query the Opendatabot Connector Hub.
 * Coordinates Request Governing, Rate Limiting, Deduplication, and Auditing.
 */
export async function queryOpendatabot<T = any>(
  endpoint: string,
  contractorCode: string,
  priority: "P0" | "P1" | "P2" | "P3" | "P4" = "P0",
): Promise<OpendatabotResponse<T>> {
  const code = (contractorCode || "").trim();
  const reqHash = deduplicator.generateHash(endpoint, code);
  const startTime = Date.now();
  const requestId = `req_odb_${crypto.randomUUID()}`;

  // List of endpoint mappings inside Opendatabot REST specification
  const endpointMappings: Record<string, string> = {
    edr: `v3/company/${encodeURIComponent(code)}`,
    history: `v3/company/${encodeURIComponent(code)}/history`,
    debtors: `v3/debtors?query=${encodeURIComponent(code)}`,
    court: `v3/court?query=${encodeURIComponent(code)}`,
    enforcements: `v3/enforcements?query=${encodeURIComponent(code)}`,
    sanctions: `v3/sanctions?query=${encodeURIComponent(code)}`,
    pep: `v3/pep?query=${encodeURIComponent(code)}`,
    real_estate: `v3/realestate?query=${encodeURIComponent(code)}`,
  };

  const apiPath = endpointMappings[endpoint] || `v3/${endpoint}/${encodeURIComponent(code)}`;

  try {
    const result = await deduplicator.executeCoalesced(reqHash, async () => {
      return await governor.submit(endpoint, code, priority, async () => {
        return await opendatabotClient.query<T>(endpoint, code, apiPath);
      });
    });

    const latencyMs = Date.now() - startTime;

    // Log transaction and audit trail
    auditHub.logTransaction({
      endpoint: apiPath,
      contractorCode: code,
      status: 200,
      latencyMs,
      cache: "MISS",
      requestId,
    });

    auditHub.logAudit({
      entityId: code,
      operation: `QUERY_ODB_${endpoint.toUpperCase()}`,
      endpoint: apiPath,
      requestId,
      status: 200,
      latencyMs,
      retryCount: 0,
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
      requestId,
    });

    auditHub.logAudit({
      entityId: code,
      operation: `QUERY_ODB_${endpoint.toUpperCase()}_FAILED`,
      endpoint: apiPath,
      requestId,
      status,
      latencyMs,
      retryCount: 0,
    });

    throw err;
  }
}
