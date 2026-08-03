import { Request, Response, NextFunction } from "express";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  role: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  requestId: string;
  result: "SUCCESS" | "DENIED" | "ERROR";
  riskScore: number;
}

// In-memory audit storage with ring-buffer mechanism
const auditLogsBuffer: AuditLogEntry[] = [];
const MAX_AUDIT_LOGS = 2000;

export function recordAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };

  auditLogsBuffer.unshift(fullEntry);
  if (auditLogsBuffer.length > MAX_AUDIT_LOGS) {
    auditLogsBuffer.pop();
  }

  // Console telemetry
  console.log(
    `[AUDIT TRAIL] ${fullEntry.timestamp} | User:${fullEntry.userEmail} (${fullEntry.role}) | Action:${fullEntry.action} | Resource:${fullEntry.resource} | Result:${fullEntry.result}`,
  );
  return fullEntry;
}

export function auditMiddleware(action: string, resource: string) {
  return (req: any, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    const startTime = Date.now();

    res.json = function (body: any) {
      const user = req.user || {
        id: "usr-analyst-001",
        email: "analyst@predator.gov.ua",
        role: "SENIOR_ANALYST",
        tenantId: "tenant-predator-core",
      };

      const isError = res.statusCode >= 400 || (body && body.error);
      const isDenied = res.statusCode === 403;

      recordAuditLog({
        userId: user.id,
        userEmail: user.email,
        role: user.role,
        tenantId: user.tenantId,
        action: action,
        resource: resource,
        resourceId: req.body?.id || req.body?.code || (req.query?.q as string) || undefined,
        ip: req.ip || req.socket.remoteAddress || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "DEV5 Workstation",
        requestId: (req.headers["x-request-id"] as string) || `req-${Date.now()}`,
        result: isDenied ? "DENIED" : isError ? "ERROR" : "SUCCESS",
        riskScore: isError ? 75 : 10,
      });

      return originalJson.call(this, body);
    };

    next();
  };
}

export function getAuditLogs(limit = 100, filterAction?: string): AuditLogEntry[] {
  if (filterAction) {
    return auditLogsBuffer.filter((l) => l.action === filterAction).slice(0, limit);
  }
  return auditLogsBuffer.slice(0, limit);
}
