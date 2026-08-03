import { cachedFetch } from "../helpers";
import { TtlCache } from "../cache";
import { DataSourceResult, ProzorroSearchResponse, ProzorroTenderDetail, ProzorroTenderSummary } from "../types";
import { fetchJson, toDataSourceError } from "../http";

const SEARCH_URL = "https://prozorro.gov.ua/api/search/tenders";
const RECENT_URL = "https://public.api.openprocurement.org/api/2.5/tenders";
const searchCache = new TtlCache<ProzorroSearchResponse>(300000);
const recentCache = new TtlCache<ProzorroTenderSummary[]>(180000);

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
    value: typeof item.value === "object" && item.value !== null ? {
      amount: typeof (item.value as Record<string, unknown>).amount === "number" ? (item.value as Record<string, unknown>).amount as number : undefined,
      currency: typeof (item.value as Record<string, unknown>).currency === "string" ? (item.value as Record<string, unknown>).currency as string : undefined,
      valueAddedTaxIncluded: typeof (item.value as Record<string, unknown>).valueAddedTaxIncluded === "boolean"
        ? (item.value as Record<string, unknown>).valueAddedTaxIncluded as boolean : undefined,
    } : undefined,
    procuringEntity: typeof item.procuringEntity === "object" && item.procuringEntity !== null
      ? item.procuringEntity as ProzorroTenderSummary["procuringEntity"] : undefined,
    dateModified: typeof item.dateModified === "string" ? item.dateModified : undefined,
    dateCreated: typeof item.dateCreated === "string" ? item.dateCreated : undefined,
  };
};

const parseSearch = (value: unknown): ProzorroSearchResponse => {
  if (typeof value !== "object" || value === null) throw new Error("Prozorro search payload is not an object");
  const payload = value as Record<string, unknown>;
  if (typeof payload.page !== "number" || typeof payload.per_page !== "number" || typeof payload.total !== "number" || !Array.isArray(payload.data)) {
    throw new Error("Prozorro search payload is invalid");
  }
  return {
    page: payload.page,
    per_page: payload.per_page,
    total: payload.total,
    data: payload.data.map(parseTender),
  };
};

const parseRecent = (value: unknown): ProzorroTenderSummary[] => {
  if (typeof value !== "object" || value === null || !Array.isArray((value as Record<string, unknown>).data)) {
    throw new Error("Prozorro recent payload is invalid");
  }
  return ((value as Record<string, unknown>).data as unknown[]).map((item) => {
    if (typeof item !== "object" || item === null || typeof (item as Record<string, unknown>).id !== "string") {
      throw new Error("Prozorro recent item is invalid");
    }
    const id = (item as Record<string, unknown>).id as string;
    return { tenderID: id, title: id, status: "unknown" };
  });
};

export const search = async (query: string, rows: number): Promise<DataSourceResult<ProzorroSearchResponse>> => {
  const sourceUrl = SEARCH_URL;
  const cached = searchCache.read(`${query}:${rows}`);
  if (cached && !cached.stale) {
    return { ok: true, data: cached.value, provenance: { source: "prozorro", sourceName: "Prozorro public search", sourceUrl, fetchedAt: cached.fetchedAt, cached: true, stale: false } };
  }
  try {
    const response = await fetchJson<unknown>(SEARCH_URL, {
      method: "POST",
      body: JSON.stringify({ filters: [], text: query }),
    });
    const parsed = parseSearch(response.data);
    const fetchedAt = response.fetchedAt;
    searchCache.write(`${query}:${rows}`, parsed, fetchedAt);
    return { ok: true, data: { ...parsed, data: parsed.data.slice(0, rows) }, provenance: { source: "prozorro", sourceName: "Prozorro public search", sourceUrl, fetchedAt, cached: false, stale: false } };
  } catch (error) {
    if (cached) return { ok: true, data: cached.value, provenance: { source: "prozorro", sourceName: "Prozorro public search", sourceUrl, fetchedAt: cached.fetchedAt, cached: true, stale: true } };
    return { ok: false, error: toDataSourceError(error, sourceUrl) };
  }
};

export const recent = async (rows: number): Promise<DataSourceResult<ProzorroTenderSummary[]>> => {
  const sourceUrl = `${RECENT_URL}?descending=1&limit=${rows}`;
  return cachedFetch(recentCache, String(rows), "prozorro", "OpenProcurement chronological feed", sourceUrl, parseRecent);
};

export const detail = async (id: string): Promise<DataSourceResult<ProzorroTenderDetail>> => {
  const sourceUrl = `${RECENT_URL}/${encodeURIComponent(id)}`;
  try {
    const response = await fetchJson<unknown>(sourceUrl);
    if (typeof response.data !== "object" || response.data === null) throw new Error("Prozorro detail payload is invalid");
    const payload = response.data as Record<string, unknown>;
    const tender = payload.data;
    if (typeof tender !== "object" || tender === null || typeof (tender as Record<string, unknown>).tenderID !== "string") {
      throw new Error("Prozorro detail is missing tender data");
    }
    return { ok: true, data: tender as ProzorroTenderDetail, provenance: { source: "prozorro", sourceName: "OpenProcurement tender detail", sourceUrl, fetchedAt: response.fetchedAt, cached: false, stale: false } };
  } catch (error) {
    return { ok: false, error: toDataSourceError(error, sourceUrl) };
  }
};
