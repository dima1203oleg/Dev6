import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

export interface ApiError {
  code: string;
  message: string;
  source?: string;
  retryable: boolean;
  correlationId?: string;
  evidenceId?: string;
  details?: any;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly source: string;
  public readonly retryable: boolean;
  public readonly statusCode: number;
  public readonly correlationId: string;
  public readonly details?: any;

  constructor(
    code: string,
    message: string,
    source: string = 'APP',
    retryable: boolean = false,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.source = source;
    this.retryable = retryable;
    this.statusCode = statusCode;
    this.correlationId = this.generateCorrelationId();
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      source: this.source,
      retryable: this.retryable,
      correlationId: this.correlationId,
      details: this.details,
    };
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 'VALIDATION', false, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message, 'AUTH', false, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('FORBIDDEN', message, 'AUTH', false, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 'APP', false, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests',
      'RATE_LIMIT',
      true,
      429,
      { retryAfter }
    );
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, details?: any) {
    super('UPSTREAM_FAILURE', message, 'UPSTREAM', true, 502, details);
  }
}

export class InternalError extends AppError {
  constructor(message: string, details?: any) {
    super('INTERNAL_ERROR', message, 'APP', false, 500, details);
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const productionMode = process.env.NODE_ENV === 'production';
  
  // Log error
  console.error(`[ERROR] ${err.name}: ${err.message}`, {
    path: req.path,
    method: req.method,
    correlationId: err instanceof AppError ? err.correlationId : 'unknown',
    stack: productionMode ? undefined : err.stack,
  });

  // Convert to API error
  let apiError: ApiError;
  
  if (err instanceof AppError) {
    apiError = err.toApiError();
  } else {
    // Unknown error - wrap in internal error
    const appError = new InternalError(
      productionMode ? 'An unexpected error occurred' : err.message
    );
    apiError = appError.toApiError();
  }

  // In production, don't expose stack traces or sensitive details
  if (productionMode) {
    delete apiError.details;
  }

  res.status(err instanceof AppError ? err.statusCode : 500).json({
    error: apiError,
  });
}

// Async error wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request correlation ID middleware
export function correlationId(req: Request, res: Response, next: NextFunction) {
  const existingCorrelationId = req.headers['x-correlation-id'] as string;
  const correlationId = existingCorrelationId || 
    `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
}
