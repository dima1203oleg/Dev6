export interface CacheEntry<T> {
  value: T;
  fetchedAt: string;
  expiresAt: number;
}

export interface CacheRead<T> {
  value: T;
  fetchedAt: string;
  cached: boolean;
  stale: boolean;
}

export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  public read(key: string): CacheRead<T> | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    return {
      value: entry.value,
      fetchedAt: entry.fetchedAt,
      cached: true,
      stale: Date.now() >= entry.expiresAt,
    };
  }

  public write(key: string, value: T, fetchedAt: string = new Date().toISOString()): CacheRead<T> {
    this.entries.set(key, { value, fetchedAt, expiresAt: Date.now() + this.ttlMs });
    return { value, fetchedAt, cached: false, stale: false };
  }

  public clear(): void {
    this.entries.clear();
  }
}
