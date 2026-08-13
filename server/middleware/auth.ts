import crypto from 'crypto';
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

interface ApiTokenPrincipal {
  token: string;
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

function parseApiTokens(): ApiTokenPrincipal[] {
  const raw = process.env['AUTH_TOKENS'];
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ApiTokenPrincipal => {
      if (typeof item !== 'object' || item === null) return false;
      const candidate = item as Partial<ApiTokenPrincipal>;
      return typeof candidate.token === 'string'
        && candidate.token.length >= 32
        && typeof candidate.id === 'string'
        && typeof candidate.email === 'string'
        && typeof candidate.tenantId === 'string'
        && typeof candidate.role === 'string'
        && Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, candidate.role);
    });
  } catch {
    return [];
  }
}

function tokensMatch(left: string, right: string): boolean {
  const leftHash = crypto.createHash('sha256').update(left).digest();
  const rightHash = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

/**
 * Resolves a bearer token into a server-controlled principal.  In production
 * this is deliberately the only source of identity; client supplied role
 * headers are ignored.
 */
export function authenticateApiRequest(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    const presentedToken = header.slice('Bearer '.length).trim();
    const principal = parseApiTokens().find((candidate) => tokensMatch(candidate.token, presentedToken));
    if (principal) {
      req.user = {
        id: principal.id,
        email: principal.email,
        role: principal.role,
        tenantId: principal.tenantId,
      };
    }
  }
  next();
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
    const productionMode = process.env['NODE_ENV'] === 'production';
    
    // In production mode, require authentication
    if (productionMode && !req.user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required in production mode",
          retryable: false
        }
      });
    }

    // Development-only local principal.  Roles supplied by the browser are
    // never trusted; test role override must be explicitly enabled.
    if (!req.user && !productionMode) {
      const configuredRole = process.env['ALLOW_DEV_ROLE_OVERRIDE'] === 'true'
        ? req.headers['x-user-role'] as UserRole
        : undefined;
      req.user = {
        id: "usr-analyst-001",
        email: "analyst@predator.gov.ua",
        role: configuredRole && ROLE_PERMISSIONS[configuredRole] ? configuredRole : "SENIOR_ANALYST",
        tenantId: "tenant-predator-core"
      };
    }

    // If still no user after dev mode injection, deny
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
          retryable: false
        }
      });
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

    return next();
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const productionMode = process.env['NODE_ENV'] === 'production';
  
  if (productionMode && !req.user) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        retryable: false
      }
    });
  }

  // In development mode, allow without auth for testing
  if (!productionMode) {
    return next();
  }

  next();
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
