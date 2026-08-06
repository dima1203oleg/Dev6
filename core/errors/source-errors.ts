export class SourceError extends Error {
  constructor(public sourceId: string, message: string) {
    super(`[${sourceId}] ${message}`);
    this.name = 'SourceError';
  }
}

export class SourceUnavailableError extends SourceError {
  constructor(sourceId: string, originalError?: any) {
    super(sourceId, `Source unavailable: ${originalError?.message || originalError || 'Network or service timeout'}`);
    this.name = 'SourceUnavailableError';
  }
}

export class AuthFailedError extends SourceError {
  constructor(sourceId: string) {
    super(sourceId, 'Authentication failed for source');
    this.name = 'AuthFailedError';
  }
}

export class RateLimitedError extends SourceError {
  constructor(sourceId: string, public retryAfterSeconds?: number) {
    super(sourceId, `Rate limit exceeded. Retry after ${retryAfterSeconds || 'unknown'}s`);
    this.name = 'RateLimitedError';
  }
}

export class SchemaDriftError extends SourceError {
  constructor(sourceId: string, public details: string) {
    super(sourceId, `Schema drift detected: ${details}`);
    this.name = 'SchemaDriftError';
  }
}

export class NoMatchError extends SourceError {
  constructor(sourceId: string, public query: string) {
    super(sourceId, `No records found for query: ${query}`);
    this.name = 'NoMatchError';
  }
}
