import type {
  CryptoSpot,
  CkanDatastoreResponse,
  DataSourceResult,
  FxAnalytics,
  NbuRate,
  OpenDataOverview,
  OpenDataSearchData,
  ProcurementAnalytics,
  ProzorroRecentResponse,
  ProzorroTenderDetail,
  SourceStatus,
} from "./dataTypes";

const request = async <T>(path: string): Promise<DataSourceResult<T>> => {
  const response = await fetch(`/api/v1/data${path}`);
  const body = (await response.json()) as DataSourceResult<T>;
  if (!response.ok && body.ok) {
    throw new Error(`Unexpected data response status ${response.status}`);
  }
  return body;
};

export const dataApi = {
  sources: () => request<SourceStatus[]>("/sources"),
  fxRates: () => request<NbuRate[]>("/fx/rates"),
  fxSeries: (code: string, days: number) =>
    request<FxAnalytics>(`/fx/series?code=${encodeURIComponent(code)}&days=${days}`),
  crypto: () => request<CryptoSpot>("/crypto"),
  openDataOverview: () => request<OpenDataOverview>("/opendata/overview"),
  openDataSearch: (query: string, rows = 20) =>
    request<OpenDataSearchData>(`/opendata/search?q=${encodeURIComponent(query)}&rows=${rows}`),
  openDataDatastore: (resourceId: string) =>
    request<CkanDatastoreResponse>(`/opendata/datastore/${encodeURIComponent(resourceId)}`),
  procurementSearch: (query: string, rows = 20) =>
    request<ProcurementAnalytics>(`/procurement/search?q=${encodeURIComponent(query)}&rows=${rows}`),
  procurementRecent: (rows = 20) => request<ProzorroRecentResponse>(`/procurement/recent?rows=${rows}`),
  procurementTender: (id: string) => request<ProzorroTenderDetail>(`/procurement/tender/${encodeURIComponent(id)}`),
};
