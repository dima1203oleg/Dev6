import React from "react";
import DataState from "./DataState";
import SourceBadge from "./SourceBadge";
import { dataApi } from "../services/dataApi";

export default function RealtimeAssetPriceWidget() {
  const [state, setState] = React.useState<Awaited<ReturnType<typeof dataApi.crypto>> | null>(null);
  const [rates, setRates] = React.useState<Awaited<ReturnType<typeof dataApi.fxRates>> | null>(null);
  const load = React.useCallback(async () => {
    const [crypto, fx] = await Promise.all([dataApi.crypto(), dataApi.fxRates()]);
    setState(crypto);
    setRates(fx);
  }, []);
  React.useEffect(() => {
    void load();
  }, [load]);
  const loading = state === null || rates === null;
  const error = state && "error" in state ? state.error : rates && "error" in rates ? rates.error : undefined;
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-200">Ринкові показники</h2>
      <DataState loading={loading} error={error} onRetry={() => void load()}>
        {state && rates && "data" in state && "data" in rates && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["bitcoin", "ethereum"] as const).map((coin) => (
                <div key={coin} className="rounded-lg border border-slate-800 p-3">
                  <p className="text-xs text-slate-400">{coin}</p>
                  <p className="text-lg text-white">${state.data[coin].usd.toLocaleString("uk-UA")}</p>
                  <p className="text-xs text-slate-400">{state.data[coin].usd_24h_change.toFixed(2)}% / 24 год</p>
                </div>
              ))}
              {rates.data
                .filter((rate) => rate.cc === "USD")
                .map((rate) => (
                  <div key={rate.cc} className="rounded-lg border border-slate-800 p-3">
                    <p className="text-xs text-slate-400">USD/UAH</p>
                    <p className="text-lg text-white">
                      {rate.rate.toLocaleString("uk-UA", { maximumFractionDigits: 4 })}
                    </p>
                    <p className="text-xs text-slate-400">{rate.exchangedate}</p>
                  </div>
                ))}
            </div>
            <div className="mt-3 space-y-1">
              {state.provenance && <SourceBadge provenance={state.provenance} />}
              {rates.provenance && <SourceBadge provenance={rates.provenance} />}
            </div>
          </>
        )}
      </DataState>
    </section>
  );
}
