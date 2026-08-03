import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateFxAnalytics, calculateOpenDataOverview, calculateProcurementAnalytics } from "./index";
import { NbuRate, NbuSeriesObservation, ProzorroSearchResponse } from "../datasources/types";

const fixture = <T>(name: string): T =>
  JSON.parse(readFileSync(new URL(`../datasources/__fixtures__/${name}`, import.meta.url), "utf8")) as T;

describe("FX analytics", () => {
  it("calculates deterministic metrics from the captured NBU series", () => {
    const observations = fixture<NbuSeriesObservation[]>("nbu-usd-series.json").slice(0, 5);
    const result = calculateFxAnalytics(observations);
    expect(result.observations).toBe(5);
    expect(result.latestRate).not.toBeNull();
    expect(result.mean).not.toBeNull();
    expect(result.series).toHaveLength(5);
    expect(result.annualizedVolatility).not.toBeNull();
  });

  it("returns explicit null analytics for an empty series", () => {
    const result = calculateFxAnalytics([]);
    expect(result.observations).toBe(0);
    expect(result.latestRate).toBeNull();
    expect(result.annualizedVolatility).toBeNull();
  });

  it("does not claim volatility for a single observation", () => {
    const observation = fixture<NbuSeriesObservation[]>("nbu-usd-series.json")[0];
    const result = calculateFxAnalytics([observation]);
    expect(result.observations).toBe(1);
    expect(result.absoluteChange).toBe(0);
    expect(result.annualizedVolatility).toBeNull();
  });
});

describe("open data analytics", () => {
  it("uses CKAN total and facets while counting only returned recent results", () => {
    const response = fixture<{
      success: boolean;
      result: {
        count: number;
        results: Array<Record<string, unknown>>;
        facets: Record<string, Record<string, number>>;
      };
    }>("ckan-search.json");
    const result = calculateOpenDataOverview(response as never, new Date("2026-08-03T00:00:00Z"));
    expect(result.totalDatasets).toBe(response.result.count);
    expect(result.basedOnSearchResults).toBe(response.result.results.length);
    expect(result.topOrganizations.length).toBeGreaterThan(0);
  });
});

describe("procurement analytics", () => {
  it("keeps currencies separate and marks saturated upstream totals", () => {
    const response = fixture<ProzorroSearchResponse>("prozorro-search.json");
    const rates = fixture<NbuRate[]>("nbu-rates.json");
    const result = calculateProcurementAnalytics("12345678", response, rates);
    expect(result.upstreamTotalSaturated).toBe(true);
    expect(result.partial).toBe(true);
    expect(result.sumsByCurrency.every((item) => item.basedOnRecords > 0)).toBe(true);
    expect(result.statusBreakdown.every((item) => item.basedOnRecords === result.count)).toBe(true);
  });

  it("returns no exact matches for a non-EDRPOU query", () => {
    const result = calculateProcurementAnalytics("ТОВ", { page: 0, per_page: 1, total: 1, data: [] });
    expect(result.exactEdrpouMatches).toEqual([]);
  });
});
