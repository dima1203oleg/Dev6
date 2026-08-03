import React from "react";
import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import type { DataSourceError } from "../services/dataTypes";

interface DataStateProps {
  loading?: boolean;
  error?: DataSourceError;
  empty?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}

export default function DataState({ loading = false, error, empty = false, onRetry, children }: DataStateProps) {
  if (loading) {
    return (
      <div className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-400">
        <LoaderCircle className="animate-spin text-cyan-400" size={18} />
        Завантаження реальних даних…
      </div>
    );
  }
  if (error) {
    const credentialsMissing = error.code === "credentials_missing";
    return (
      <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-amber-900/60 bg-amber-950/20 p-6 text-center text-sm text-amber-200">
        <AlertTriangle size={18} />
        <p>{credentialsMissing ? `Потрібен ключ API: ${error.message}` : `Джерело недоступне: ${error.message}`}</p>
        <p className="text-xs text-amber-300/70">Код: {error.code}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 rounded border border-amber-700 px-3 py-1.5 text-xs hover:bg-amber-900/40">
            <RefreshCw size={13} />
            Повторити
          </button>
        )}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
        Для цього запиту реальних записів не знайдено.
      </div>
    );
  }
  return <>{children}</>;
}
