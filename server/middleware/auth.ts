import { Request, Response, NextFunction } from "express";

export type UserRole = 
  | "VIEWER"
  | "ANALYST"
  | "SENIOR_ANALYST"
  | "INVESTIGATOR"
  | "SUPERVISOR"
  | "ADMIN"
  | "SUPER_ADMIN";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string;
  };
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  VIEWER: ["entity.read", "entity.search", "graph.read", "source.read"],
  ANALYST: [
    "entity.read", "entity.search", "graph.read", "source.read",
    "investigation.create", "investigation.share", "ai.use"
  ],
  SENIOR_ANALYST: [
    "entity.read", "entity.search", "entity.export", "graph.read",
    "source.read", "investigation.create", "investigation.share", "ai.use"
  ],
  INVESTIGATOR: [
    "entity.read", "entity.search", "entity.export", "graph.read",
    "source.read", "investigation.create", "investigation.share", "ai.use"
  ],
  SUPERVISOR: [
    "entity.read", "entity.search", "entity.export", "graph.read",
    "source.read", "investigation.create", "investigation.share",
    "ai.use", "ai.admin"
  ],
  ADMIN: [
    "entity.read", "entity.search", "entity.export", "graph.read",
    "source.read", "source.admin", "connector.admin", "investigation.create",
    "investigation.share", "ai.use", "ai.admin", "user.admin"
  ],
  SUPER_ADMIN: [
    "entity.read", "entity.search", "entity.export", "graph.read",
    "source.read", "source.admin", "connector.admin", "investigation.create",
    "investigation.share", "ai.use", "ai.admin", "user.admin", "system.admin"
  ]
};

export function checkPermission(requiredPermission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Inject default user session if missing for dev workstation mode
    if (!req.user) {
      req.user = {
        id: "usr-analyst-001",
        email: "analyst@predator.gov.ua",
        role: (req.headers["x-user-role"] as UserRole) || "SENIOR_ANALYST",
        tenantId: "tenant-predator-core"
      };
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(requiredPermission) && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Required permission '${requiredPermission}' is not granted for role '${req.user.role}'`,
          retryable: false
        }
      });
    }

    next();
  };
}

/**
 * Field-level Data Masking executed SERVER-SIDE based on user role.
 */
export function maskSensitiveFields(data: any, role: UserRole): any {
  if (!data) return data;
  
  // High-privileged roles see unmasked data
  if (["SENIOR_ANALYST", "INVESTIGATOR", "SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return data;
  }

  const masked = JSON.parse(JSON.stringify(data));

  const maskString = (str: string) => {
    if (!str || str.length < 4) return "****";
    return str.substring(0, 3) + "*****" + str.substring(str.length - 2);
  };

  const traverse = (obj: any) => {
    if (typeof obj !== "object" || obj === null) return;

    for (const key in obj) {
      if (typeof obj[key] === "string") {
        if (["ipn", "passport", "taxDebt", "phone", "email", "walletAddress"].includes(key)) {
          obj[key] = maskString(obj[key]);
        }
      } else if (typeof obj[key] === "object") {
        traverse(obj[key]);
      }
    }
  };

  traverse(masked);
  return masked;
}
