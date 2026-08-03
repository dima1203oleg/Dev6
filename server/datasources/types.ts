export interface Provenance {
  source: string;
  sourceName: string;
  sourceUrl: string;
  fetchedAt: string;
  cached: boolean;
  stale: boolean;
  license?: string;
}

export interface DataSourceError {
  code: string;
  message: string;
  sourceUrl: string;
  attemptedAt: string;
}

export type DataSourceResult<T> =
  | { ok: true; data: T; provenance: Provenance }
  | { ok: false; error: DataSourceError };

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
  method?: "GET" | "POST";
  body?: string;
}

export interface NbuRate {
  r030: number;
  txt: string;
  rate: number;
  cc: string;
  exchangedate: string;
  rate_per_unit?: number;
  units?: number;
}

export interface NbuSeriesObservation {
  exchangedate: string;
  cc: string;
  txt: string;
  enname?: string;
  rate: number;
  units?: number;
  rate_per_unit?: number;
}

export interface CkanFacetValue {
  name: string;
  count: number;
}

export interface CkanPackage {
  id: string;
  title: string;
  name: string;
  metadata_modified?: string;
  organization?: { name?: string; title?: string };
  resources?: Array<{ id: string; format?: string; name?: string; url?: string; datastore_active?: boolean }>;
}

export interface CkanSearchResponse {
  success: boolean;
  result: {
    count: number;
    results: CkanPackage[];
    facets?: Record<string, Record<string, number> | CkanFacetValue[]>;
    organization_list?: Array<{ name: string; count: number }>;
  };
}

export interface ProzorroTenderSummary {
  tenderID: string;
  title: string;
  status: string;
  value?: { amount?: number; currency?: string; valueAddedTaxIncluded?: boolean };
  procuringEntity?: {
    identifier?: { id?: string; legalName?: string; scheme?: string };
    address?: { region?: string; locality?: string };
    kind?: string;
    name?: string;
  };
  dateModified?: string;
  dateCreated?: string;
}

export interface ProzorroSearchResponse {
  page: number;
  per_page: number;
  total: number;
  data: ProzorroTenderSummary[];
}

export interface ProzorroTenderDetail {
  tenderID: string;
  title?: string;
  status?: string;
  value?: { amount?: number; currency?: string; valueAddedTaxIncluded?: boolean };
  procuringEntity?: ProzorroTenderSummary["procuringEntity"];
  [key: string]: unknown;
}

export interface WikipediaSearchItem {
  pageid: number;
  title: string;
  snippet: string;
  timestamp?: string;
}

export interface WikipediaSearchResponse {
  query?: { search?: WikipediaSearchItem[] };
}

export interface CryptoSpot {
  bitcoin?: { usd?: number; usd_24h_change?: number };
  ethereum?: { usd?: number; usd_24h_change?: number };
}
