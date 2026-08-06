import { DataSourceResult, Provenance } from './types';

interface CacheEntry<T> {
  data: T;
  provenance: Provenance;
  expiresAt: number;
}

class DataSourceGovernor {
  private cache = new Map<string, CacheEntry<any>>();
  private failureCounts = new Map<string, number>();
  private circuitBreakerUntil = new Map<string, number>();

  public async fetchWithGovernance<T>(
    sourceKey: string,
    sourceName: string,
    sourceUrl: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
    requiredEnvVar?: string
  ): Promise<DataSourceResult<T>> {
    const now = Date.now();
    const attemptedAt = new Date().toISOString();

    // Check env var if required
    if (requiredEnvVar && !process.env[requiredEnvVar]) {
      return {
        ok: false,
        error: {
          code: 'CREDENTIALS_MISSING',
          message: `API key or credential missing for ${sourceName}. Set variable '${requiredEnvVar}' to activate.`,
          sourceUrl,
          attemptedAt,
          requiredEnvVar,
        },
      };
    }

    // Check circuit breaker
    const breakerUntil = this.circuitBreakerUntil.get(sourceKey) || 0;
    if (now < breakerUntil) {
      return {
        ok: false,
        error: {
          code: 'UPSTREAM_FAILURE',
          message: `Circuit breaker active for ${sourceName}. Upstream service temporarily paused.`,
          sourceUrl,
          attemptedAt,
        },
      };
    }

    // Check cache
    const cached = this.cache.get(sourceKey);
    if (cached) {
      const isStale = now > cached.expiresAt;
      if (!isStale) {
        return {
          ok: true,
          data: cached.data,
          provenance: {
            ...cached.provenance,
            cached: true,
            stale: false,
          },
        };
      }
    }

    // Attempt real fetch with retry
    try {
      const data = await this.retryOperation(fetcher, 2, 800);
      const provenance: Provenance = {
        source: sourceName,
        sourceUrl,
        fetchedAt: new Date().toISOString(),
        cached: false,
        stale: false,
      };

      // Store in cache
      this.cache.set(sourceKey, {
        data,
        provenance,
        expiresAt: now + ttlMs,
      });

      // Reset failures
      this.failureCounts.set(sourceKey, 0);

      return {
        ok: true,
        data,
        provenance,
      };
    } catch (err: any) {
      const failures = (this.failureCounts.get(sourceKey) || 0) + 1;
      this.failureCounts.set(sourceKey, failures);

      if (failures >= 5) {
        // Open circuit for 30s
        this.circuitBreakerUntil.set(sourceKey, now + 30000);
      }

      // If we have stale cached data, mark stale instead of failing hard
      if (cached) {
        return {
          ok: true,
          data: cached.data,
          provenance: {
            ...cached.provenance,
            cached: true,
            stale: true,
          },
        };
      }

      return {
        ok: false,
        error: {
          code: err.code || 'UPSTREAM_FAILURE',
          message: err.message || `Upstream request failed for ${sourceName}`,
          sourceUrl,
          attemptedAt,
        },
      };
    }
  }

  private async retryOperation<T>(
    fn: () => Promise<T>,
    retries: number,
    delayMs: number
  ): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) throw err;
      await new Promise((res) => setTimeout(res, delayMs));
      return this.retryOperation(fn, retries - 1, delayMs * 1.5);
    }
  }

  public invalidateCache(sourceKey?: string) {
    if (sourceKey) {
      this.cache.delete(sourceKey);
    } else {
      this.cache.clear();
    }
  }
}

export const dataSourceGovernor = new DataSourceGovernor();
