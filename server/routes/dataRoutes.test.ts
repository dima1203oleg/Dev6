import request from "supertest";
import { describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";

const ok = <T>(data: T, source = "test") => ({
  ok: true as const,
  data,
  provenance: {
    source,
    sourceName: source,
    sourceUrl: `https://${source}.example`,
    fetchedAt: "2026-08-03T00:00:00.000Z",
    cached: false,
    stale: false,
  },
});

vi.mock("../datasources/nbu", () => ({
  getRates: vi.fn(async () =>
    ok([{ r030: 840, txt: "Долар США", rate: 41, cc: "USD", exchangedate: "03.08.2026" }], "nbu"),
  ),
  getSeries: vi.fn(async () => ok([{ exchangedate: "03.08.2026", cc: "USD", txt: "Долар США", rate: 41 }], "nbu")),
}));
vi.mock("../datasources/coingecko", () => ({
  getCryptoSpot: vi.fn(async () => ok({ bitcoin: { usd: 60000 }, ethereum: { usd: 3000 } }, "coingecko")),
}));
vi.mock("../datasources/ckan", () => ({
  search: vi.fn(async () => ok({ success: true, result: { count: 1, results: [], facets: {} } }, "ckan")),
}));
vi.mock("../datasources/prozorro", () => ({
  search: vi.fn(async () => ok({ page: 0, per_page: 1, total: 1, data: [] }, "prozorro")),
  recent: vi.fn(async () => ok({ records: [], unavailableRecords: 0 }, "prozorro")),
  detail: vi.fn(async () => ok({ tenderID: "UA-1" }, "prozorro")),
}));
vi.mock("../datasources/wikipedia", () => ({
  search: vi.fn(async () => ok([], "wikipedia")),
}));

describe("data routes", () => {
  it("returns uniform envelopes for keyless public data", async () => {
    const { app } = await import("../../server");
    const response = await request(app).get("/api/v1/data/fx/rates");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.provenance.source).toBe("nbu");
  });

  it("rejects invalid parameters", async () => {
    const { app } = await import("../../server");
    const response = await request(app).get("/api/v1/data/fx/series?days=9999");
    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error.code).toBe("invalid_days");
  });

  it("returns 503 with the error envelope when a provider is unavailable", async () => {
    const ckan = await import("../datasources/ckan");
    vi.mocked(ckan.search).mockResolvedValueOnce({
      ok: false,
      error: {
        code: "timeout",
        message: "timeout",
        sourceUrl: "https://data.gov.ua",
        attemptedAt: "2026-08-03T00:00:00.000Z",
      },
    });
    const { app } = await import("../../server");
    const response = await request(app).get("/api/v1/data/opendata/search");
    expect(response.status).toBe(503);
    expect(response.body.ok).toBe(false);
    expect(response.body.error.code).toBe("timeout");
  });

  it("normalizes CKAN search and exposes hydrated recent metadata", async () => {
    const { app } = await import("../../server");
    const openData = await request(app).get("/api/v1/data/opendata/search?q=ua&rows=1");
    expect(openData.status).toBe(200);
    expect(openData.body.data).toMatchObject({ query: "ua", total: 1, datasets: [] });
    const recent = await request(app).get("/api/v1/data/procurement/recent?rows=1");
    expect(recent.status).toBe(200);
    expect(recent.body.data).toEqual({ records: [], unavailableRecords: 0 });
  });
});
