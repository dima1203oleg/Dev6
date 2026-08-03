import { NbuSeriesObservation } from "../datasources/types";

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

const parseDate = (value: string): number => {
  const [day, month, year] = value.split(".").map(Number);
  return Date.UTC(year, month - 1, day);
};

export const calculateFxAnalytics = (observations: NbuSeriesObservation[], requestedCode = ""): FxAnalytics => {
  const sorted = [...observations].sort((a, b) => parseDate(a.exchangedate) - parseDate(b.exchangedate));
  const series = sorted.map((observation) => ({ date: observation.exchangedate, rate: observation.rate }));
  if (sorted.length === 0) {
    return {
      code: requestedCode,
      observations: 0,
      window: { from: null, to: null },
      latestRate: null,
      absoluteChange: null,
      percentChange: null,
      min: null,
      max: null,
      mean: null,
      annualizedVolatility: null,
      series,
    };
  }
  const rates = sorted.map((item) => item.rate);
  const first = rates[0];
  const latest = rates[rates.length - 1];
  const returns = rates.slice(1).filter((rate, index) => rate > 0 && rates[index] > 0)
    .map((rate, index) => Math.log(rate / rates[index]));
  const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const returnMean = returns.length > 0 ? returns.reduce((sum, value) => sum + value, 0) / returns.length : null;
  const variance = returnMean === null || returns.length < 2
    ? null
    : returns.reduce((sum, value) => sum + (value - returnMean) ** 2, 0) / (returns.length - 1);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const minObservation = sorted.find((item) => item.rate === minRate);
  const maxObservation = sorted.find((item) => item.rate === maxRate);
  return {
    code: sorted[0].cc,
    observations: sorted.length,
    window: { from: sorted[0].exchangedate, to: sorted[sorted.length - 1].exchangedate },
    latestRate: latest,
    absoluteChange: latest - first,
    percentChange: first === 0 ? null : ((latest - first) / first) * 100,
    min: minObservation ? { rate: minRate, date: minObservation.exchangedate } : null,
    max: maxObservation ? { rate: maxRate, date: maxObservation.exchangedate } : null,
    mean,
    annualizedVolatility: variance === null ? null : Math.sqrt(variance) * Math.sqrt(252),
    series,
  };
};
