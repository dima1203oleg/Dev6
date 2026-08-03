import { NbuRate, ProzorroSearchResponse, ProzorroTenderSummary } from "../datasources/types";

export interface CurrencyAggregate {
  currency: string;
  amount: number;
  basedOnRecords: number;
}

export interface ProcurementAnalytics {
  query: string;
  records: ProzorroTenderSummary[];
  count: number;
  upstreamTotal: number;
  upstreamTotalSaturated: boolean;
  partial: boolean;
  sumsByCurrency: CurrencyAggregate[];
  statusBreakdown: Array<{ status: string; count: number; basedOnRecords: number }>;
  regionBreakdown: Array<{ region: string; count: number; basedOnRecords: number }>;
  exactEdrpouMatches: ProzorroTenderSummary[];
  currencyConversions: Array<{
    fromCurrency: string;
    toCurrency: "UAH" | "USD";
    sourceRate: number;
    sourceRateDate: string;
    amount: number;
    basedOnRecords: number;
  }>;
}

type CurrencyConversion = ProcurementAnalytics["currencyConversions"][number];

const aggregateCounts = (
  values: string[],
  fallback: string,
): Array<{ status: string; count: number; basedOnRecords: number }> =>
  Object.entries(
    values.reduce<Record<string, number>>((result, value) => {
      const key = value || fallback;
      result[key] = (result[key] ?? 0) + 1;
      return result;
    }, {}),
  ).map(([status, count]) => ({ status, count, basedOnRecords: values.length }));

const parseEdrpou = (query: string): string | null => (/^\d{8}$/.test(query.trim()) ? query.trim() : null);

export const calculateProcurementAnalytics = (
  query: string,
  response: ProzorroSearchResponse,
  nbuRates: NbuRate[] = [],
): ProcurementAnalytics => {
  const records = response.data;
  const sums = records.reduce<Record<string, { amount: number; count: number }>>((result, tender) => {
    const currency = tender.value?.currency;
    const amount = tender.value?.amount;
    if (currency && typeof amount === "number" && Number.isFinite(amount)) {
      result[currency] = {
        amount: (result[currency]?.amount ?? 0) + amount,
        count: (result[currency]?.count ?? 0) + 1,
      };
    }
    return result;
  }, {});
  const usdRate = nbuRates.find((rate) => rate.cc === "USD");
  const conversions: CurrencyConversion[] = usdRate
    ? Object.entries(sums).flatMap(([currency, aggregate]): CurrencyConversion[] => {
        if (currency === "USD") {
          return [
            {
              fromCurrency: currency,
              toCurrency: "UAH" as const,
              sourceRate: usdRate.rate,
              sourceRateDate: usdRate.exchangedate,
              amount: aggregate.amount * usdRate.rate,
              basedOnRecords: aggregate.count,
            },
          ];
        }
        if (currency === "UAH") {
          return [
            {
              fromCurrency: currency,
              toCurrency: "USD" as const,
              sourceRate: usdRate.rate,
              sourceRateDate: usdRate.exchangedate,
              amount: aggregate.amount / usdRate.rate,
              basedOnRecords: aggregate.count,
            },
          ];
        }
        return [];
      })
    : [];
  return {
    query,
    records,
    count: records.length,
    upstreamTotal: response.total,
    upstreamTotalSaturated: response.total >= 10000,
    partial: response.total > records.length || response.total >= 10000,
    sumsByCurrency: Object.entries(sums).map(([currency, aggregate]) => ({
      currency,
      amount: aggregate.amount,
      basedOnRecords: aggregate.count,
    })),
    statusBreakdown: aggregateCounts(
      records.map((record) => record.status),
      "unknown",
    ),
    regionBreakdown: aggregateCounts(
      records.map((record) => record.procuringEntity?.address?.region ?? ""),
      "unknown",
    ).map(({ status, count, basedOnRecords }) => ({ region: status, count, basedOnRecords })),
    exactEdrpouMatches: parseEdrpou(query)
      ? records.filter((record) => record.procuringEntity?.identifier?.id === parseEdrpou(query))
      : [],
    currencyConversions: conversions,
  };
};
