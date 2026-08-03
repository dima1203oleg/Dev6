// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardView from "./DashboardView";

const provenance = {
  source: "test",
  sourceName: "Тестове реальне джерело",
  sourceUrl: "https://example.test",
  fetchedAt: new Date().toISOString(),
  cached: false,
  stale: false,
};

vi.mock("../services/dataApi", () => ({
  dataApi: {
    fxRates: vi.fn(async () => ({
      ok: true,
      data: [{ cc: "USD", rate: 41, txt: "Долар", exchangedate: "03.08.2026", r030: 840 }],
      provenance,
    })),
    fxSeries: vi.fn(async (code: string) => ({
      ok: true,
      data: {
        code,
        observations: 1,
        window: { from: "03.08.2026", to: "03.08.2026" },
        latestRate: 41,
        absoluteChange: 0,
        percentChange: 0,
        min: { rate: 41, date: "03.08.2026" },
        max: { rate: 41, date: "03.08.2026" },
        mean: 41,
        annualizedVolatility: null,
        series: [{ date: "03.08.2026", rate: 41 }],
      },
      provenance,
    })),
    crypto: vi.fn(async () => ({
      ok: true,
      data: { bitcoin: { usd: 60000, usd_24h_change: 1 }, ethereum: { usd: 3000, usd_24h_change: -1 } },
      provenance,
    })),
    openDataOverview: vi.fn(async () => ({
      ok: true,
      data: {
        totalDatasets: 1,
        topOrganizations: [],
        topResourceFormats: [],
        modifiedLast30Days: 1,
        basedOnSearchResults: 1,
        searchResults: [],
      },
      provenance,
    })),
    procurementRecent: vi.fn(async () => ({ ok: true, data: { records: [], unavailableRecords: 0 }, provenance })),
    procurementSearch: vi.fn(async () => ({
      ok: true,
      data: {
        query: "test",
        records: [],
        count: 0,
        upstreamTotal: 0,
        upstreamTotalSaturated: false,
        partial: false,
        sumsByCurrency: [],
        statusBreakdown: [],
        regionBreakdown: [],
        exactEdrpouMatches: [],
        currencyConversions: [],
      },
      provenance,
    })),
  },
}));

describe("DashboardView", () => {
  it("renders real-source panels and provenance", async () => {
    render(<DashboardView onSelectTab={vi.fn()} onSelectEntity={vi.fn()} />);
    expect(await screen.findByText("Реальна аналітика")).toBeTruthy();
    expect((await screen.findAllByText("Тестове реальне джерело")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Курсова панель")).toBeTruthy();
  });
});
