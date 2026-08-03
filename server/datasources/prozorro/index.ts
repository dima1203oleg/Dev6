import { TtlCache } from "../cache";
import {
  DataSourceResult,
  ProzorroRecentResponse,
  ProzorroSearchResponse,
  ProzorroTenderDetail,
  ProzorroTenderSummary,
} from "../types";
import { fetchJson, toDataSourceError } from "../http";

const SEARCH_URL = "https://prozorro.gov.ua/api/search/tenders";
const RECENT_URL = "https://public.api.openprocurement.org/api/2.5/tenders";
const searchCache = new TtlCache<ProzorroSearchResponse>(300000);
const recentCache = new TtlCache<ProzorroRecentResponse>(180000);
const detailCache = new TtlCache<ProzorroTenderDetail>(300000);

const parseTender = (value: unknown): ProzorroTenderSummary => {
  if (typeof value !== "object" || value === null) throw new Error("Prozorro tender is not an object");
  const item = value as Record<string, unknown>;
  if (typeof item.tenderID !== "string" || typeof item.title !== "string" || typeof item.status !== "string") {
    throw new Error("Prozorro tender is missing required fields");
  }
  return {
    tenderID: item.tenderID,
    title: item.title,
    status: item.status,
    value:
      typeof item.value === "object" && item.value !== null
        ? {
            amount:
              typeof (item.value as Record<string, unknown>).amount === "number"
                ? ((item.value as Record<string, unknown>).amount as number)
                : undefined,
            currency:
              typeof (item.value as Record<string, unknown>).currency === "string"
                ? ((item.value as Record<string, unknown>).currency as string)
                : undefined,
            valueAddedTaxIncluded:
              typeof (item.value as Record<string, unknown>).valueAddedTaxIncluded === "boolean"
                ? ((item.value as Record<string, unknown>).valueAddedTaxIncluded as boolean)
                : undefined,
          }
        : undefined,
    procuringEntity:
      typeof item.procuringEntity === "object" && item.procuringEntity !== null
        ? (item.procuringEntity as ProzorroTenderSummary["procuringEntity"])
        : undefined,
    dateModified: typeof item.dateModified === "string" ? item.dateModified : undefined,
    dateCreated: typeof item.dateCreated === "string" ? item.dateCreated : undefined,
  };
};

const parseSearch = (value: unknown): ProzorroSearchResponse => {
  if (typeof value !== "object" || value === null) throw new Error("Prozorro search payload is not an object");
  const payload = value as Record<string, unknown>;
  if (
    typeof payload.page !== "number" ||
    typeof payload.per_page !== "number" ||
    typeof payload.total !== "number" ||
    !Array.isArray(payload.data)
  ) {
    throw new Error("Prozorro search payload is invalid");
  }
  return {
    page: payload.page,
    per_page: payload.per_page,
    total: payload.total,
    data: payload.data.map(parseTender),
  };
};

const parseRecentIds = (value: unknown): string[] => {
  if (typeof value !== "object" || value === null || !Array.isArray((value as Record<string, unknown>).data)) {
    throw new Error("Prozorro recent payload is invalid");
  }
  return ((value as Record<string, unknown>).data as unknown[]).slice(0, 20).map((item) => {
    if (typeof item !== "object" || item === null || typeof (item as Record<string, unknown>).id !== "string") {
      throw new Error("Prozorro recent item is invalid");
    }
    const id = (item as Record<string, unknown>).id as string;
    return id;
  });
};

export const search = async (query: string, rows: number): Promise<DataSourceResult<ProzorroSearchResponse>> => {
  const sourceUrl = SEARCH_URL;
  const cached = searchCache.read(`${query}:${rows}`);
  if (cached && !cached.stale) {
    return {
      ok: true,
      data: cached.value,
      provenance: {
        source: "prozorro",
        sourceName: "Prozorro public search",
        sourceUrl,
        fetchedAt: cached.fetchedAt,
        cached: true,
        stale: false,
      },
    };
  }
  try {
    const response = await fetchJson<unknown>(SEARCH_URL, {
      method: "POST",
      body: JSON.stringify({ filters: [], text: query }),
    });
    const parsed = parseSearch(response.data);
    const fetchedAt = response.fetchedAt;
    searchCache.write(`${query}:${rows}`, parsed, fetchedAt);
    return {
      ok: true,
      data: { ...parsed, data: parsed.data.slice(0, rows) },
      provenance: {
        source: "prozorro",
        sourceName: "Prozorro public search",
        sourceUrl,
        fetchedAt,
        cached: false,
        stale: false,
        request: { method: "POST", body: { filters: [], text: query } },
      },
    };
  } catch (error) {
    if (cached)
      return {
        ok: true,
        data: cached.value,
        provenance: {
          source: "prozorro",
          sourceName: "Prozorro public search",
          sourceUrl,
          fetchedAt: cached.fetchedAt,
          cached: true,
          stale: true,
          request: { method: "POST", body: { filters: [], text: query } },
        },
      };
    return { ok: false, error: toDataSourceError(error, sourceUrl) };
  }
};

export const recent = async (rows: number): Promise<DataSourceResult<ProzorroRecentResponse>> => {
  const cappedRows = Math.min(rows, 20);
  const sourceUrl = `${RECENT_URL}?descending=1&limit=${cappedRows}`;
  const cached = recentCache.read(String(cappedRows));
  if (cached && !cached.stale) {
    return {
      ok: true,
      data: cached.value,
      provenance: {
        source: "prozorro",
        sourceName: "OpenProcurement chronological feed",
        sourceUrl,
        fetchedAt: cached.fetchedAt,
        cached: true,
        stale: false,
      },
    };
  }
  try {
    const response = await fetchJson<unknown>(sourceUrl);
    const ids = parseRecentIds(response.data);
    const records: ProzorroTenderSummary[] = [];
    let nextIndex = 0;
    const worker = async (): Promise<void> => {
      while (nextIndex < ids.length) {
        const id = ids[nextIndex];
        nextIndex += 1;
        const result = await detail(id);
        if (result.ok) {
          const item = result.data;
          if (typeof item.title === "string" && typeof item.status === "string") {
            records.push({
              tenderID: item.tenderID,
              title: item.title,
              status: item.status,
              value: item.value,
              procuringEntity: item.procuringEntity,
              dateModified: typeof item.dateModified === "string" ? item.dateModified : undefined,
              dateCreated: typeof item.dateCreated === "string" ? item.dateCreated : undefined,
            });
          }
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(5, ids.length) }, () => worker()));
    const data: ProzorroRecentResponse = {
      records,
      unavailableRecords: ids.length - records.length,
    };
    recentCache.write(String(cappedRows), data, response.fetchedAt);
    return {
      ok: true,
      data,
      provenance: {
        source: "prozorro",
        sourceName: "OpenProcurement chronological feed",
        sourceUrl,
        fetchedAt: response.fetchedAt,
        cached: false,
        stale: false,
      },
    };
  } catch (error) {
    if (cached) {
      return {
        ok: true,
        data: cached.value,
        provenance: {
          source: "prozorro",
          sourceName: "OpenProcurement chronological feed",
          sourceUrl,
          fetchedAt: cached.fetchedAt,
          cached: true,
          stale: true,
        },
      };
    }
    return { ok: false, error: toDataSourceError(error, sourceUrl) };
  }
};

export const detail = async (id: string): Promise<DataSourceResult<ProzorroTenderDetail>> => {
  const sourceUrl = `${RECENT_URL}/${encodeURIComponent(id)}`;
  const cached = detailCache.read(id);
  if (cached && !cached.stale) {
    return {
      ok: true,
      data: cached.value,
      provenance: {
        source: "prozorro",
        sourceName: "OpenProcurement tender detail",
        sourceUrl,
        fetchedAt: cached.fetchedAt,
        cached: true,
        stale: false,
      },
    };
  }
  try {
    const response = await fetchJson<unknown>(sourceUrl);
    if (typeof response.data !== "object" || response.data === null)
      throw new Error("Prozorro detail payload is invalid");
    const payload = response.data as Record<string, unknown>;
    const tender = payload.data;
    if (
      typeof tender !== "object" ||
      tender === null ||
      typeof (tender as Record<string, unknown>).tenderID !== "string"
    ) {
      throw new Error("Prozorro detail is missing tender data");
    }
    const parsed = parseTender(tender);
    if (typeof parsed.title !== "string" || typeof parsed.status !== "string") {
      throw new Error("Prozorro detail is missing title or status");
    }
    const data = { ...(tender as Record<string, unknown>), ...parsed } as ProzorroTenderDetail;
    detailCache.write(id, data, response.fetchedAt);
    return {
      ok: true,
      data,
      provenance: {
        source: "prozorro",
        sourceName: "OpenProcurement tender detail",
        sourceUrl,
        fetchedAt: response.fetchedAt,
        cached: false,
        stale: false,
      },
    };
  } catch (error) {
    if (cached) {
      return {
        ok: true,
        data: cached.value,
        provenance: {
          source: "prozorro",
          sourceName: "OpenProcurement tender detail",
          sourceUrl,
          fetchedAt: cached.fetchedAt,
          cached: true,
          stale: true,
        },
      };
    }
    return { ok: false, error: toDataSourceError(error, sourceUrl) };
  }
};

export const probe = async (): Promise<DataSourceResult<null>> => {
  const sourceUrl = `${RECENT_URL}?descending=1&limit=1`;
  try {
    const response = await fetchJson<unknown>(sourceUrl, { retries: 0 });
    parseRecentIds(response.data);
    return {
      ok: true,
      data: null,
      provenance: {
        source: "prozorro",
        sourceName: "OpenProcurement chronological feed",
        sourceUrl,
        fetchedAt: response.fetchedAt,
        cached: false,
        stale: false,
      },
    };
  } catch (error) {
    return { ok: false, error: toDataSourceError(error, sourceUrl) };
  }
};
