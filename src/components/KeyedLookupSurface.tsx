import React from "react";
import DataState from "./DataState";
import type { DataSourceError } from "../services/dataTypes";

export default function KeyedLookupSurface({
  title,
  envVar,
  endpoint,
}: {
  title: string;
  envVar: string;
  endpoint: string;
}) {
  const [query, setQuery] = React.useState("");
  const [state, setState] = React.useState<{ loading: boolean; data?: unknown; error?: DataSourceError }>({
    loading: false,
  });
  const load = async () => {
    if (!query.trim()) return;
    setState({ loading: true });
    try {
      const response = await fetch(`${endpoint}?q=${encodeURIComponent(query.trim())}`);
      const body = (await response.json()) as { ok: boolean; data?: unknown; error?: DataSourceError };
      setState(body.ok ? { loading: false, data: body.data } : { loading: false, error: body.error });
    } catch (error) {
      setState({
        loading: false,
        error: {
          code: "client_error",
          message: error instanceof Error ? error.message : "Запит не виконано",
          sourceUrl: endpoint,
          attemptedAt: new Date().toISOString(),
        },
      });
    }
  };
  return (
    <main className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="text-sm text-slate-400">
        Для роботи налаштуйте {envVar} на сервері. Ключ не зберігається у браузері.
      </p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ЄДРПОУ або назва"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-cyan-700 px-4 py-2 text-sm text-white"
        >
          Запит
        </button>
      </div>
      <DataState loading={state.loading} error={state.error}>
        {state.data !== undefined && (
          <pre className="max-h-[32rem] overflow-auto rounded-lg border border-slate-800 p-4 text-xs text-slate-300">
            {JSON.stringify(state.data, null, 2)}
          </pre>
        )}
      </DataState>
    </main>
  );
}
