import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "./auth";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RateLimitStore>();

// Rate limit configuration per endpoint type
const RATE_LIMITS = {
  default: { maxRequests: 100, windowMs: 60000 },
  search: { maxRequests: 50, windowMs: 60000 },
  probe: { maxRequests: 20, windowMs: 60000 },
  admin: { maxRequests: 30, windowMs: 60000 },
  ai: { maxRequests: 10, windowMs: 60000 },
};

// Rate limit multipliers per user role
const ROLE_MULTIPLIERS: Record<UserRole, number> = {
  VIEWER: 1,
  ANALYST: 2,
  SENIOR_ANALYST: 3,
  INVESTIGATOR: 3,
  SUPERVISOR: 5,
  ADMIN: 10,
  SUPER_ADMIN: 20,
};

export function createRateLimiter(
  maxRequests = 100, 
  windowMs = 60000,
  endpointType: 'default' | 'search' | 'probe' | 'admin' | 'ai' = 'default'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const user = (req as AuthenticatedRequest).user;
    const now = Date.now();
    
    // Get base limits for endpoint type
    const baseLimits = RATE_LIMITS[endpointType];
    let effectiveMax = baseLimits.maxRequests;
    let effectiveWindow = baseLimits.windowMs;
    
    // Apply role multiplier if user is authenticated
    if (user && ROLE_MULTIPLIERS[user.role]) {
      effectiveMax = Math.floor(effectiveMax * ROLE_MULTIPLIERS[user.role]);
    }
    
    // Create unique key for IP + endpoint type
    const key = `${ip}:${endpointType}`;
    
    let record = requestCounts.get(key);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + effectiveWindow
      };
      requestCounts.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader("X-RateLimit-Limit", effectiveMax);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, effectiveMax - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
    res.setHeader("X-RateLimit-Endpoint", endpointType);

    if (record.count > effectiveMax) {
      return res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many requests. Limit is ${effectiveMax} requests per ${effectiveWindow / 1000}s for ${endpointType} endpoint.`,
          retryable: true,
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }
      });
    }

    next();
  };
}

// Specific rate limiters for different endpoint types
export const searchRateLimiter = createRateLimiter(50, 60000, 'search');
export const probeRateLimiter = createRateLimiter(20, 60000, 'probe');
export const adminRateLimiter = createRateLimiter(30, 60000, 'admin');
export const aiRateLimiter = createRateLimiter(10, 60000, 'ai');
