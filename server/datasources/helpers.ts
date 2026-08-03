import { TtlCache } from "./cache";
import { fetchJson, toDataSourceError } from "./http";
import { DataSourceResult, Provenance } from "./types";

export const cachedFetch = async <T>(
  cache: TtlCache<T>,
  key: string,
  source: string,
  sourceName: string,
  sourceUrl: string,
  parser: (value: unknown) => T,
  license?: string,
): Promise<DataSourceResult<T>> => {
  const cached = cache.read(key);
  if (cached && !cached.stale) {
    return {
      ok: true,
      data: cached.value,
      provenance: { source, sourceName, sourceUrl, fetchedAt: cached.fetchedAt, cached: true, stale: false, license },
    };
  }

  try {
    const response = await fetchJson<unknown>(sourceUrl);
    const data = parser(response.data);
    const stored = cache.write(key, data, response.fetchedAt);
    return {
      ok: true,
      data,
      provenance: { source, sourceName, sourceUrl, fetchedAt: stored.fetchedAt, cached: false, stale: false, license },
    };
  } catch (error) {
    if (cached) {
      return {
        ok: true,
        data: cached.value,
        provenance: { source, sourceName, sourceUrl, fetchedAt: cached.fetchedAt, cached: true, stale: true, license },
      };
    }
    return { ok: false, error: toDataSourceError(error, sourceUrl) };
  }
};

export const provenanceFor = (
  source: string,
  sourceName: string,
  sourceUrl: string,
  fetchedAt: string,
  cached = false,
  stale = false,
  license?: string,
): Provenance => ({ source, sourceName, sourceUrl, fetchedAt, cached, stale, license });
