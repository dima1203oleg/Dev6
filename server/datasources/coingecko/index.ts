import { cachedFetch } from "../helpers";
import { TtlCache } from "../cache";
import { CryptoSpot, DataSourceResult } from "../types";

const sourceUrl =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true";
const cache = new TtlCache<CryptoSpot>(120000);

const parse = (value: unknown): CryptoSpot => {
  if (typeof value !== "object" || value === null) throw new Error("CoinGecko payload is not an object");
  const payload = value as Record<string, unknown>;
  for (const id of ["bitcoin", "ethereum"]) {
    const coin = payload[id];
    if (typeof coin !== "object" || coin === null || typeof (coin as Record<string, unknown>).usd !== "number") {
      throw new Error(`CoinGecko payload is missing ${id}.usd`);
    }
  }
  return value as CryptoSpot;
};

export const getCryptoSpot = async (): Promise<DataSourceResult<CryptoSpot>> =>
  cachedFetch(cache, "spot", "coingecko", "CoinGecko", sourceUrl, parse, "CoinGecko API terms");
