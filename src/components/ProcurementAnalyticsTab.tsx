import React from "react";
import DataState from "./DataState";
import SourceBadge from "./SourceBadge";
import { dataApi } from "../services/dataApi";
import type { ProcurementAnalytics, ProzorroRecentResponse } from "../services/dataTypes";
import TenderDetailView from "./TenderDetailView";
import { useData } from "../hooks/useData";

export default function ProcurementAnalyticsTab({
  tenderId,
  onSelectTab,
}: {
  tenderId?: string;
  onSelectTab?: (tab: string) => void;
}) {
  return tenderId ? (
    <TenderDetailView tenderId={tenderId} onBack={() => onSelectTab?.("procurement")} />
  ) : (
    <ProcurementList onSelectTab={onSelectTab} />
  );
}

function ProcurementList({ onSelectTab }: { onSelectTab?: (tab: string) => void }) {
  const [query, setQuery] = React.useState("");
  const [submitted, setSubmitted] = React.useState("");
  const recent = useData<ProzorroRecentResponse>(() => dataApi.procurementRecent(20), []);
  const search = useData<ProcurementAnalytics>(
    () =>
      submitted
        ? dataApi.procurementSearch(submitted, 100)
        : Promise.resolve({ ok: true as const, data: undefined, provenance: undefined as never }),
    [submitted],
  );
  return (
    <main className="space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">Публічні закупівлі</h1>
        <p className="mt-1 text-sm text-slate-400">Реальні тендери Prozorro та агрегати за повернутою вибіркою.</p>
      </header>
      <DataState loading={recent.loading} error={recent.error} onRetry={() => void recent.reload()}>
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div className="mb-4 flex justify-between">
            <h2 className="font-semibold text-white">Останні тендери</h2>
            {recent.provenance && <SourceBadge provenance={recent.provenance} />}
          </div>
          <div className="space-y-2">
            {recent.data?.records.map((tender) => (
              <button
                type="button"
                key={tender.tenderID}
                onClick={() => onSelectTab?.(`tender:${tender.internalId ?? tender.tenderID}`)}
                className="block w-full rounded-lg border border-slate-800 p-3 text-left hover:border-cyan-700"
              >
                <p className="text-sm text-white">{tender.title}</p>
                <p className="text-xs text-slate-400">
                  {tender.status} · {tender.value?.amount?.toLocaleString("uk-UA") ?? "сума недоступна"}{" "}
                  {tender.value?.currency ?? ""}
                </p>
              </button>
            ))}
          </div>
          {recent.data && recent.data.unavailableRecords > 0 && (
            <p className="mt-3 text-xs text-amber-300">Не вдалося отримати деталі: {recent.data.unavailableRecords}</p>
          )}
        </section>
      </DataState>
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(query.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Текст або точний ЄДРПОУ"
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <button className="rounded-lg bg-cyan-700 px-4 py-2 text-sm text-white">Знайти</button>
        </form>
        {submitted && (
          <DataState
            loading={search.loading}
            error={search.error}
            empty={Boolean(search.data && search.data.count === 0)}
            onRetry={() => void search.reload()}
          >
            {search.data && (
              <div className="mt-5 space-y-4 text-sm text-slate-300">
                <p>
                  Повернуто записів: <b className="text-white">{search.data.count}</b> · upstream:{" "}
                  <b className="text-white">
                    {search.data.upstreamTotalSaturated ? `≥ ${search.data.upstreamTotal}` : search.data.upstreamTotal}
                  </b>{" "}
                  · часткова: <b className="text-white">{search.data.partial ? "так" : "ні"}</b>
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h3 className="mb-2 text-xs text-slate-500">Суми за валютами</h3>
                    {search.data.sumsByCurrency.map((item) => (
                      <p key={item.currency}>
                        {item.currency}: {item.amount.toLocaleString("uk-UA")} ({item.basedOnRecords})
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs text-slate-500">Статуси</h3>
                    {search.data.statusBreakdown.map((item) => (
                      <p key={item.status}>
                        {item.status}: {item.count}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs text-slate-500">Регіони</h3>
                    {search.data.regionBreakdown.map((item) => (
                      <p key={item.region}>
                        {item.region}: {item.count}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-xs text-slate-500">Конвертація за курсом НБУ</h3>
                  {search.data.currencyConversions.map((conversion) => (
                    <p key={`${conversion.fromCurrency}-${conversion.toCurrency}`} className="text-sm">
                      {conversion.fromCurrency} → {conversion.toCurrency}: {conversion.amount.toLocaleString("uk-UA")} ·
                      курс {conversion.sourceRate.toLocaleString("uk-UA")} на {conversion.sourceRateDate} · записів{" "}
                      {conversion.basedOnRecords}
                    </p>
                  ))}
                </div>
                <div>
                  <h3 className="mb-2 text-xs text-slate-500">ЄДРПОУ збіги</h3>
                  {search.data.exactEdrpouMatches.length === 0 ? (
                    <p className="text-sm text-slate-400">Точних збігів не знайдено.</p>
                  ) : (
                    search.data.exactEdrpouMatches.map((tender) => (
                      <button
                        type="button"
                        key={tender.tenderID}
                        onClick={() => onSelectTab?.(`tender:${tender.internalId ?? tender.tenderID}`)}
                        className="block text-left text-sm text-white hover:text-cyan-300"
                      >
                        {tender.tenderID}: {tender.title}
                      </button>
                    ))
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-xs text-slate-500">Повернуті тендери</h3>
                  <div className="space-y-2">
                    {search.data.records.map((tender) => (
                      <button
                        type="button"
                        key={tender.tenderID}
                        onClick={() => onSelectTab?.(`tender:${tender.internalId ?? tender.tenderID}`)}
                        className="block w-full rounded-lg border border-slate-800 p-3 text-left hover:border-cyan-700"
                      >
                        <p className="text-sm text-white">{tender.title}</p>
                        <p className="text-xs text-slate-400">
                          {tender.tenderID} · {tender.status} ·{" "}
                          {tender.value?.amount?.toLocaleString("uk-UA") ?? "сума недоступна"}{" "}
                          {tender.value?.currency ?? ""} · {tender.procuringEntity?.name ?? "замовник недоступний"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                {search.provenance && <SourceBadge provenance={search.provenance} />}
              </div>
            )}
          </DataState>
        )}
      </section>
    </main>
  );
}
