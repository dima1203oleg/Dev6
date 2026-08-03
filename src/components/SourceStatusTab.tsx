import React from "react";
import DataState from "./DataState";
import SourceBadge from "./SourceBadge";
import { dataApi } from "../services/dataApi";
import type { DataSourceError, Provenance, SourceStatus } from "../services/dataTypes";

export default function SourceStatusTab() {
  const [state, setState] = React.useState<{
    loading: boolean;
    data?: SourceStatus[];
    provenance?: Provenance;
    error?: DataSourceError;
  }>({ loading: true });
  const load = React.useCallback(async () => {
    setState({ loading: true });
    const result = await dataApi.sources();
    setState(
      "error" in result
        ? { loading: false, error: result.error }
        : { loading: false, data: result.data, provenance: result.provenance },
    );
  }, []);
  React.useEffect(() => {
    void load();
  }, [load]);
  return (
    <main className="space-y-5 p-4 md:p-8">
      <h1 className="text-2xl font-semibold text-white">Стан джерел</h1>
      <DataState loading={state.loading} error={state.error} onRetry={() => void load()}>
        {state.data && (
          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="mb-4">{state.provenance && <SourceBadge provenance={state.provenance} />}</div>
            <div className="space-y-3">
              {state.data.map((source) => (
                <article
                  key={source.source}
                  className="flex flex-wrap justify-between gap-2 border-b border-slate-800 pb-3"
                >
                  <div>
                    <p className="text-sm text-white">{source.source}</p>
                    <p className="text-xs text-slate-400">
                      {source.sourceUrl} · перевірено {source.checkedAt}
                    </p>
                  </div>
                  <p className={source.status === "online" ? "text-sm text-emerald-400" : "text-sm text-amber-300"}>
                    {source.status === "online" ? "доступне" : `недоступне: ${source.error?.message ?? "помилка"}`}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </DataState>
    </main>
  );
}
