import { describe, expect, it, vi } from "vitest";
import { getCryptoSpot } from "./coingecko";
import * as ckan from "./ckan";
import { getRates } from "./nbu";
import * as prozorro from "./prozorro";
import * as wikipedia from "./wikipedia";

const jsonResponse = (value: unknown, status = 200): Response =>
  new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });

describe("provider validation", () => {
  it("rejects malformed NBU, CoinGecko, CKAN, and Wikipedia payloads", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("bank.gov.ua")) return jsonResponse({ malformed: true });
      if (url.includes("coingecko")) return jsonResponse({ bitcoin: {} });
      if (url.includes("data.gov.ua")) return jsonResponse({ success: true, result: { count: "bad", results: [] } });
      return jsonResponse({ query: {} });
    });
    expect((await getRates()).ok).toBe(false);
    expect((await getCryptoSpot()).ok).toBe(false);
    expect((await ckan.search("malformed-provider-test", 1)).ok).toBe(false);
    expect((await wikipedia.search("malformed-provider-test", 1)).ok).toBe(false);
    fetchMock.mockRestore();
  });

  it("hydrates recent Prozorro ids and reports failed detail fetches", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("descending=1")) {
        return jsonResponse({ data: [{ id: "hydration-a" }, { id: "hydration-b" }] });
      }
      if (url.endsWith("/hydration-a")) {
        return jsonResponse({
          data: {
            tenderID: "hydration-a",
            title: "Реальний тендер",
            status: "active",
            value: { amount: 100, currency: "UAH" },
          },
        });
      }
      return jsonResponse({}, 503);
    });
    const result = await prozorro.recent(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.records).toHaveLength(1);
      expect(result.data.records[0].title).toBe("Реальний тендер");
      expect(result.data.unavailableRecords).toBe(1);
    }
    fetchMock.mockRestore();
  });
});
