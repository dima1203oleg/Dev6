import { cachedFetch } from "../helpers";
import { TtlCache } from "../cache";
import { DataSourceResult, NbuRate, NbuSeriesObservation } from "../types";

const BASE_URL = "https://bank.gov.ua";
const ratesCache = new TtlCache<NbuRate[]>(180000);
const seriesCache = new TtlCache<NbuSeriesObservation[]>(300000);

const parseRates = (value: unknown): NbuRate[] => {
  if (!Array.isArray(value)) throw new Error("NBU rates payload is not an array");
  const rates = value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      r030: Number(item.r030),
      txt: String(item.txt ?? ""),
      rate: Number(item.rate),
      cc: String(item.cc ?? "").toUpperCase(),
      exchangedate: String(item.exchangedate ?? ""),
      rate_per_unit: item.rate_per_unit === undefined ? undefined : Number(item.rate_per_unit),
      units: item.units === undefined ? undefined : Number(item.units),
    }));
  if (rates.some((item) => !item.cc || !Number.isFinite(item.rate) || !item.exchangedate)) {
    throw new Error("NBU rates payload contains invalid observations");
  }
  return rates;
};

const parseSeries = (value: unknown): NbuSeriesObservation[] => {
  if (!Array.isArray(value)) throw new Error("NBU series payload is not an array");
  const series = value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      exchangedate: String(item.exchangedate ?? ""),
      cc: String(item.cc ?? "").toUpperCase(),
      txt: String(item.txt ?? ""),
      enname: item.enname === undefined ? undefined : String(item.enname),
      rate: Number(item.rate),
      units: item.units === undefined ? undefined : Number(item.units),
      rate_per_unit: item.rate_per_unit === undefined ? undefined : Number(item.rate_per_unit),
    }));
  if (series.some((item) => !item.cc || !Number.isFinite(item.rate) || !/^\d{2}\.\d{2}\.\d{4}$/.test(item.exchangedate))) {
    throw new Error("NBU series payload contains invalid observations");
  }
  return series;
};

export const getRates = async (): Promise<DataSourceResult<NbuRate[]>> => {
  const sourceUrl = `${BASE_URL}/NBUStatService/v1/statdirectory/exchange?json`;
  return cachedFetch(ratesCache, "all", "nbu", "Національний банк України", sourceUrl, parseRates, "NBU public data");
};

export const getSeries = async (code: string, days: number): Promise<DataSourceResult<NbuSeriesObservation[]>> => {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  const format = (date: Date): string => date.toISOString().slice(0, 10).replaceAll("-", "");
  const sourceUrl = `${BASE_URL}/NBU_Exchange/exchange_site?start=${format(start)}&end=${format(end)}&valcode=${encodeURIComponent(code)}&sort=exchangedate&order=desc&json`;
  return cachedFetch(seriesCache, `${code}:${days}`, "nbu", "Національний банк України", sourceUrl, parseSeries, "NBU public data");
};
