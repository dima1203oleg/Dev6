import React from "react";
import { Search, TrendingDown, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DataState from "./DataState";
import SourceBadge from "./SourceBadge";
import { dataApi } from "../services/dataApi";
import type { CryptoSpot, FxAnalytics, NbuRate, Provenance } from "../services/dataTypes";
import { useData } from "../hooks/useData";

interface DashboardViewProps {
  onSelectTab: (tabId: string) => void;
  onSelectEntity: (entityId: string) => void;
}

const formatNumber = (value: number | null | undefined, digits = 2): string =>
  typeof value === "number" ? value.toLocaleString("uk-UA", { maximumFractionDigits: digits }) : "—";

function Panel({ title, children, provenance }: { title: string; children: React.ReactNode; provenance?: Provenance }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">{title}</h2>
        {provenance && <SourceBadge provenance={provenance} />}
      </div>
      {children}
    </section>
  );
}

function FxCard({ code, rate, analytics }: { code: string; rate?: NbuRate; analytics?: FxAnalytics }) {
  const change = analytics?.percentChange;
  const positive = typeof change === "number" && change >= 0;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{code}</span>
        {typeof change === "number" &&
          (positive ? (
            <TrendingUp size={15} className="text-emerald-400" />
          ) : (
            <TrendingDown size={15} className="text-rose-400" />
          ))}
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">
        {formatNumber(rate?.rate, 4)} <span className="text-xs font-normal text-slate-500">UAH</span>
      </p>
      <p className={`mt-1 text-xs ${positive ? "text-emerald-400" : "text-rose-400"}`}>
        {typeof change === "number" ? `${positive ? "+" : ""}${formatNumber(change)}% за вікно` : "Зміна недоступна"}
      </p>
    </div>
  );
}

export default function DashboardView({ onSelectTab }: DashboardViewProps) {
  const [days, setDays] = React.useState(90);
  const rates = useData(() => dataApi.fxRates(), []);
  const usd = useData(() => dataApi.fxSeries("USD", days), [days]);
  const eur = useData(() => dataApi.fxSeries("EUR", days), [days]);
  const crypto = useData(() => dataApi.crypto(), []);
  const openData = useData(() => dataApi.openDataOverview(), []);
  const recent = useData(() => dataApi.procurementRecent(10), []);
  const [query, setQuery] = React.useState("");
  const [submittedQuery, setSubmittedQuery] = React.useState("");
  const procurement = useData(
    () =>
      submittedQuery
        ? dataApi.procurementSearch(submittedQuery, 20)
        : Promise.resolve({ ok: true as const, data: undefined, provenance: undefined as never }),
    [submittedQuery],
  );
  const rateMap = new Map((rates.data ?? []).map((rate) => [rate.cc, rate]));
  const cryptoData: CryptoSpot | undefined = crypto.data;

  return (
    <main className="space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Predator Analytics</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Реальна аналітика</h1>
          <p className="mt-1 text-sm text-slate-400">
            Кожен показник має перевірене джерело або позначений як недоступний.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectTab("procurement")}
          className="rounded-lg border border-cyan-700 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-950/40"
        >
          Відкрити закупівлі
        </button>
      </header>

      <DataState
        loading={rates.loading || usd.loading || eur.loading}
        error={rates.error ?? usd.error ?? eur.error}
        onRetry={() => {
          void rates.reload();
        }}
      >
        <Panel title="Курсова панель" provenance={rates.provenance}>
          <div className="mb-4 flex flex-wrap gap-2">
            {[30, 90, 180, 365].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`rounded px-3 py-1 text-xs ${days === value ? "bg-cyan-700 text-white" : "bg-slate-800 text-slate-400"}`}
              >
                {value} днів
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <FxCard code="USD" rate={rateMap.get("USD")} analytics={usd.data} />
            <FxCard code="EUR" rate={rateMap.get("EUR")} analytics={eur.data} />
          </div>
          <DataState loading={usd.loading} error={usd.error}>
            {usd.data && (
              <div className="mt-5">
                <div className="mb-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-4">
                  <span>
                    Мін: <b className="text-white">{formatNumber(usd.data.min?.rate, 4)}</b>
                  </span>
                  <span>
                    Макс: <b className="text-white">{formatNumber(usd.data.max?.rate, 4)}</b>
                  </span>
                  <span>
                    Середнє: <b className="text-white">{formatNumber(usd.data.mean, 4)}</b>
                  </span>
                  <span>
                    Спостережень: <b className="text-white">{usd.data.observations}</b>
                  </span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usd.data.series}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155" }} />
                      <Line type="monotone" dataKey="rate" name="USD/UAH" stroke="#22d3ee" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </DataState>
        </Panel>
      </DataState>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataState loading={crypto.loading} error={crypto.error}>
          <Panel title="Крипто-спот" provenance={crypto.provenance}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["bitcoin", "ethereum"] as const).map((coin) => {
                const value = cryptoData?.[coin];
                return (
                  <div key={coin} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase text-slate-400">{coin}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">${formatNumber(value?.usd, 2)}</p>
                    <p
                      className={`mt-1 text-xs ${(value?.usd_24h_change ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {formatNumber(value?.usd_24h_change)}% за 24 год
                    </p>
                  </div>
                );
              })}
            </div>
          </Panel>
        </DataState>

        <DataState loading={openData.loading} error={openData.error}>
          <Panel title="Каталог відкритих даних" provenance={openData.provenance}>
            {openData.data && (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Усього наборів</p>
                  <p className="text-3xl font-semibold text-white">
                    {openData.data.totalDatasets.toLocaleString("uk-UA")}
                  </p>
                  <p className="text-xs text-slate-500">
                    за фасетами CKAN; вибірка: {openData.data.basedOnSearchResults}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs text-slate-400">Організації</p>
                    {openData.data.topOrganizations.slice(0, 5).map((item) => (
                      <p key={item.name} className="truncate text-slate-300">
                        {item.name}: {item.count}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-slate-400">Формати</p>
                    {openData.data.topResourceFormats.slice(0, 5).map((item) => (
                      <p key={item.name} className="text-slate-300">
                        {item.name}: {item.count}
                      </p>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Змінено за 30 днів у повернутій вибірці:{" "}
                  <b className="text-white">{openData.data.modifiedLast30Days}</b>
                </p>
              </div>
            )}
          </Panel>
        </DataState>
      </div>

      <DataState loading={recent.loading} error={recent.error}>
        <Panel title="Останні публічні закупівлі" provenance={recent.provenance}>
          {recent.data && (
            <div className="space-y-3">
              {recent.data.records.length === 0 ? (
                <DataState empty>{null}</DataState>
              ) : (
                recent.data.records.map((tender) => (
                  <button
                    key={tender.tenderID}
                    type="button"
                    onClick={() => onSelectTab(`tender:${tender.internalId ?? tender.tenderID}`)}
                    className="block w-full rounded-lg border border-slate-800 p-3 text-left hover:border-cyan-700"
                  >
                    <p className="text-sm text-white">{tender.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {tender.status} · {tender.value?.amount?.toLocaleString("uk-UA") ?? "сума недоступна"}{" "}
                      {tender.value?.currency ?? ""}
                    </p>
                  </button>
                ))
              )}
              {recent.data.unavailableRecords > 0 && (
                <p className="text-xs text-amber-300">
                  Недоступно для гідратації: {recent.data.unavailableRecords} записів
                </p>
              )}
            </div>
          )}
        </Panel>
      </DataState>

      <Panel title="Пошук закупівель">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Текст або ЄДРПОУ"
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm text-white"
          >
            <Search size={15} />
            Пошук
          </button>
        </form>
        {submittedQuery && (
          <DataState
            loading={procurement.loading}
            error={procurement.error}
            empty={Boolean(procurement.data && procurement.data.count === 0)}
          >
            {procurement.data && (
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <span>
                  Записів: <b>{procurement.data.count}</b>
                </span>
                <span>
                  Вибірка часткова: <b>{procurement.data.partial ? "так" : "ні"}</b>
                </span>
                <span>
                  Всього upstream:{" "}
                  <b>
                    {procurement.data.upstreamTotalSaturated
                      ? `≥ ${procurement.data.upstreamTotal}`
                      : procurement.data.upstreamTotal}
                  </b>
                </span>
              </div>
            )}
          </DataState>
        )}
      </Panel>
    </main>
  );
}
