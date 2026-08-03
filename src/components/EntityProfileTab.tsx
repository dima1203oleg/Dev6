import React from "react";
import DataState from "./DataState";
import SourceBadge from "./SourceBadge";
import { dataApi } from "../services/dataApi";
import type { DataSourceError, EntityProfileData, Provenance } from "../services/dataTypes";

export default function EntityProfileTab({
  initialQuery = "",
  onSelectTab,
}: {
  initialQuery?: string;
  onSelectTab?: (tab: string) => void;
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [submitted, setSubmitted] = React.useState(initialQuery);
  const [state, setState] = React.useState<{
    loading: boolean;
    data?: EntityProfileData;
    provenance?: Provenance;
    error?: DataSourceError;
  }>({ loading: false });
  const load = React.useCallback(async (value: string) => {
    if (!value.trim()) return;
    setState({ loading: true });
    const result = await dataApi.entityProfile(value.trim());
    setState(
      "error" in result
        ? { loading: false, error: result.error }
        : { loading: false, data: result.data, provenance: result.provenance },
    );
  }, []);
  React.useEffect(() => {
    if (submitted) void load(submitted);
  }, [load, submitted]);
  const profile = state.data;
  return (
    <main className="space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">Досьє суб'єкта</h1>
        <p className="mt-1 text-sm text-slate-400">
          Факти з Prozorro, data.gov.ua та української Вікіпедії без композитного ризикового бала.
        </p>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(query.trim());
        }}
        className="flex gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Назва компанії або ЄДРПОУ"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
        <button className="rounded-lg bg-cyan-700 px-4 py-2 text-sm text-white">Побудувати</button>
      </form>
      <DataState
        loading={state.loading}
        error={state.error}
        empty={Boolean(profile && !profile.procurement.ok && !profile.openData.ok && !profile.wikipedia.ok)}
        onRetry={() => void load(submitted)}
      >
        {profile && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="font-semibold text-white">Результати для: {profile.query}</h2>
                {state.provenance && <SourceBadge provenance={state.provenance} />}
              </div>
            </section>
            <SourceBlock title="Prozorro" source={profile.procurement}>
              {profile.procurement.ok && (
                <>
                  <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                    <p>
                      Тендерів у вибірці: <b className="text-white">{profile.procurement.data.analytics.count}</b>
                    </p>
                    <p>
                      Період:{" "}
                      <b className="text-white">
                        {profile.procurement.data.firstTenderDate ?? "недоступний"} —{" "}
                        {profile.procurement.data.lastTenderDate ?? "недоступний"}
                      </b>
                    </p>
                    <p>
                      ЄДРПОУ-збігів:{" "}
                      <b className="text-white">{profile.procurement.data.analytics.exactEdrpouMatches.length}</b>
                    </p>
                    <p>
                      Всього upstream:{" "}
                      <b className="text-white">
                        {profile.procurement.data.analytics.upstreamTotalSaturated
                          ? `≥ ${profile.procurement.data.analytics.upstreamTotal}`
                          : profile.procurement.data.analytics.upstreamTotal}
                      </b>
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {profile.procurement.data.analytics.records.map((tender) => (
                      <button
                        type="button"
                        key={tender.tenderID}
                        onClick={() => onSelectTab?.(`tender:${tender.tenderID}`)}
                        className="block w-full rounded-lg border border-slate-800 p-3 text-left hover:border-cyan-700"
                      >
                        <p className="text-sm text-white">{tender.title}</p>
                        <p className="text-xs text-slate-400">
                          {tender.tenderID} · {tender.status} ·{" "}
                          {tender.value?.amount?.toLocaleString("uk-UA") ?? "сума недоступна"}{" "}
                          {tender.value?.currency ?? ""}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 text-xs text-slate-400">
                    Топ замовників у повернутій вибірці:{" "}
                    {profile.procurement.data.topCounterpartEntities
                      .map((item) => `${item.name} (${item.count})`)
                      .join(", ") || "недоступно"}
                  </div>
                </>
              )}
            </SourceBlock>
            <SourceBlock title="Відкриті дані data.gov.ua" source={profile.openData}>
              {profile.openData.ok && (
                <div className="space-y-2">
                  {profile.openData.data.datasets.map((dataset) => (
                    <a
                      key={dataset.id}
                      href={dataset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border border-slate-800 p-3 hover:border-cyan-700"
                    >
                      <p className="text-sm text-white">{dataset.title}</p>
                      <p className="text-xs text-slate-400">
                        {dataset.organizationTitle ?? "Організація недоступна"} ·{" "}
                        {dataset.metadataModified ?? "дата недоступна"} ·{" "}
                        {dataset.resourceFormats.join(", ") || "формати недоступні"}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </SourceBlock>
            <SourceBlock title="Українська Вікіпедія" source={profile.wikipedia}>
              {profile.wikipedia.ok && (
                <div className="space-y-3">
                  {profile.wikipedia.data.map((article) => (
                    <a
                      key={article.pageid}
                      href={`https://uk.wikipedia.org/?curid=${article.pageid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border border-slate-800 p-3 hover:border-cyan-700"
                    >
                      <p className="text-sm text-white">{article.title}</p>
                      <p
                        className="mt-1 text-xs text-slate-400"
                        dangerouslySetInnerHTML={{ __html: article.snippet }}
                      />
                    </a>
                  ))}
                </div>
              )}
            </SourceBlock>
          </div>
        )}
      </DataState>
    </main>
  );
}

function SourceBlock({
  title,
  source,
  children,
}: {
  title: string;
  source: { ok: boolean; provenance?: Provenance; error?: DataSourceError };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="mb-4 flex flex-wrap justify-between gap-3">
        <h2 className="font-semibold text-white">{title}</h2>
        {source.ok && source.provenance && <SourceBadge provenance={source.provenance} />}
      </div>
      {source.ok ? (
        children
      ) : (
        <p className="text-sm text-amber-300">
          Джерело недоступне: {source.error?.message ?? "помилка без опису"} ({source.error?.code ?? "unknown"})
        </p>
      )}
    </section>
  );
}
