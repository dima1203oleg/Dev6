import { describe, expect, it } from "vitest";
import { getCryptoSpot } from "./coingecko";
import { getRates, getSeries } from "./nbu";
import * as ckan from "./ckan";
import * as prozorro from "./prozorro";

describe.skipIf(process.env.LIVE_TESTS !== "1")("live upstream contracts", () => {
  it("keeps the NBU rates contract", async () => {
    const result = await getRates();
    expect(result.ok).toBe(true);
    if (result.ok) expect(Array.isArray(result.data)).toBe(true);
  });

  it("keeps the NBU historical series contract", async () => {
    const result = await getSeries("USD", 7);
    expect(result.ok).toBe(true);
    if (result.ok) expect(Array.isArray(result.data)).toBe(true);
  });

  it("keeps the CoinGecko contract", async () => {
    const result = await getCryptoSpot();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.bitcoin?.usd).toEqual(expect.any(Number));
  });

  it("keeps the CKAN contract", async () => {
    const result = await ckan.search("Україна", 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.result.count).toEqual(expect.any(Number));
  });

  it("keeps the Prozorro search contract", async () => {
    const result = await prozorro.search("Україна", 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(Array.isArray(result.data.data)).toBe(true);
  });
});
