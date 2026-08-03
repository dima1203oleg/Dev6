export type {
  CryptoSpot,
  DataSourceDependency,
  DataSourceError,
  DataSourceResult,
  NbuRate,
  OpenDataSearchData,
  ProzorroRecentResponse,
  ProzorroSearchResponse,
  ProzorroTenderDetail,
  Provenance,
} from "../../server/datasources/types";
export type { OpenDataOverview } from "../../server/analytics/opendata";
export type { ProcurementAnalytics } from "../../server/analytics/procurement";

export interface FxAnalytics {
  code: string;
  observations: number;
  window: { from: string | null; to: string | null };
  latestRate: number | null;
  absoluteChange: number | null;
  percentChange: number | null;
  min: { rate: number; date: string } | null;
  max: { rate: number; date: string } | null;
  mean: number | null;
  annualizedVolatility: number | null;
  series: Array<{ date: string; rate: number }>;
}

export interface SourceStatus {
  source: string;
  status: "online" | "unavailable";
  checkedAt: string;
  sourceUrl: string;
  stale: boolean;
  error?: import("../../server/datasources/types").DataSourceError;
}
