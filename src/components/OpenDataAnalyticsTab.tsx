import React from "react";
import DataState from "./DataState";
import SourceBadge from "./SourceBadge";
import { dataApi } from "../services/dataApi";
import type {
  CkanDatastoreResponse,
  DataSourceError,
  OpenDataOverview,
  OpenDataSearchData,
  Provenance,
} from "../services/dataTypes";

export default function OpenDataAnalyticsTab() {
  const [query, setQuery] = React.useState("");
  const [preview, setPreview] = React.useState<{
    resourceId: string;
    loading: boolean;
    data?: CkanDatastoreResponse;
    error?: DataSourceError;
  }>({ resourceId: "", loading: false });
  const [state, setState] = React.useState<{
    loading: boolean;
    data?: OpenDataOverview | OpenDataSearchData;
    provenance?: Provenance;
    error?: DataSourceError;
  }>({ loading: true });
  const load = React.useCallback(async (value: string) => {
    setState({ loading: true });
    const result = value ? await dataApi.openDataSearch(value, 50) : await dataApi.openDataOverview();
    setState(
      "error" in result
        ? { loading: false, error: result.error }
        : { loading: false, data: result.data, provenance: result.provenance },
    );
  }, []);
  React.useEffect(() => {
    void load("");
  }, [load]);
  const overview = state.data && "totalDatasets" in state.data ? state.data : undefined;
  const results = state.data && "datasets" in state.data ? state.data : undefined;
  const datasets =
    results?.datasets ??
    overview?.searchResults.map((dataset) => ({
      id: dataset.id,
      title: dataset.title,
      organizationTitle: dataset.organization?.title,
      metadataModified: dataset.metadata_modified,
      resourceFormats: dataset.resources.map((resource) => resource.format ?? "").filter(Boolean),
      url: `https://data.gov.ua/dataset/${dataset.name}`,
      resources: dataset.resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        format: resource.format,
        url: resource.url,
        datastoreActive: resource.datastore_active,
      })),
    })) ??
    [];
  const loadPreview = async (resourceId: string) => {
    setPreview({ resourceId, loading: true });
    const result = await dataApi.openDataDatastore(resourceId);
    setPreview(
      "error" in result
        ? { resourceId, loading: false, error: result.error }
        : { resourceId, loading: false, data: result.data },
    );
  };
  return (
    <main className="space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">Відкриті дані</h1>
        <p className="mt-1 text-sm text-slate-400">Каталог data.gov.ua без синтетичних записів.</p>
      </header>
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void load(query.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук наборів"
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <button className="rounded-lg bg-cyan-700 px-4 py-2 text-sm text-white">Знайти</button>
        </form>
      </section>
      <DataState
        loading={state.loading}
        error={state.error}
        empty={Boolean(results && results.datasets.length === 0)}
        onRetry={() => void load(query.trim())}
      >
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          {state.provenance && <SourceBadge provenance={state.provenance} />}
          {overview && (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <p>
                Наборів: <b>{overview.totalDatasets.toLocaleString("uk-UA")}</b>
              </p>
              <p>
                Змінено за 30 днів: <b>{overview.modifiedLast30Days}</b>
              </p>
              <p>
                Вибірка: <b>{overview.basedOnSearchResults}</b>
              </p>
            </div>
          )}
          {results && (
            <div className="mt-4 space-y-2">
              {datasets.map((dataset) => (
                <article key={dataset.id} className="rounded-lg border border-slate-800 p-3">
                  <a
                    href={dataset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-white hover:text-cyan-300"
                  >
                    {dataset.title}
                  </a>
                  <p className="mt-1 text-xs text-slate-400">
                    {dataset.organizationTitle ?? "Організація не вказана"} ·{" "}
                    {dataset.metadataModified ?? "дата недоступна"} ·{" "}
                    {dataset.resourceFormats.join(", ") || "формати недоступні"}
                  </p>
                  <div className="mt-3 space-y-2">
                    {dataset.resources.length === 0 && (
                      <p className="text-xs text-slate-500">Ресурси не опубліковані.</p>
                    )}
                    {dataset.resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400"
                      >
                        <span>
                          {resource.name ?? resource.id} · {resource.format ?? "формат недоступний"}
                        </span>
                        {resource.datastoreActive ? (
                          <button type="button" onClick={() => void loadPreview(resource.id)} className="text-cyan-400">
                            Переглянути записи
                          </button>
                        ) : (
                          <span>Datastore відсутній</span>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
          {preview.resourceId && (
            <div className="mt-5 rounded-lg border border-cyan-900/50 p-3">
              <h2 className="text-sm font-semibold text-white">Попередній перегляд записів</h2>
              <DataState loading={preview.loading} error={preview.error}>
                {preview.data && (
                  <>
                    <p className="my-2 text-xs text-slate-400">Всього записів: {preview.data.total}</p>
                    <pre className="max-h-80 overflow-auto text-xs text-slate-300">
                      {JSON.stringify(preview.data.records, null, 2)}
                    </pre>
                  </>
                )}
              </DataState>
            </div>
          )}
        </section>
      </DataState>
    </main>
  );
}
