import React from 'react';
import { Key, ServerOff, Clock } from 'lucide-react';
import { DataSourceError } from '../../types/dataSources';

interface DataStatePanelProps {
  status: 'loading' | 'available' | 'partial' | 'unavailable' | 'credentials_missing' | 'rate_limited';
  error?: DataSourceError;
  children?: React.ReactNode;
  onRetry?: () => void;
}

export const DataStatePanel: React.FC<DataStatePanelProps> = ({
  status,
  error,
  children,
  onRetry,
}) => {
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/60 rounded-lg border border-slate-800 text-center animate-pulse">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-mono text-slate-300">Завантаження даних з державного реєстру...</p>
        <p className="text-xs text-slate-500 mt-1">Отримання першоджерел та верифікація provenance</p>
      </div>
    );
  }

  if (status === 'credentials_missing' || error?.code === 'CREDENTIALS_MISSING') {
    return (
      <div className="p-5 bg-amber-950/30 border border-amber-800/60 rounded-lg text-amber-200">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold font-mono text-amber-300">Потрібен API-ключ першоджерела (CREDENTIALS_MISSING)</h4>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              {error?.message || 'Для отримання даних з даного реєстру необхідно налаштувати відповідні змінні середовища.'}
            </p>
            {error?.requiredEnvVar && (
              <div className="inline-block bg-slate-950/80 px-2.5 py-1 rounded text-xs font-mono text-amber-300 border border-amber-900/50">
                Змінна: <span className="text-emerald-400 font-bold">{error.requiredEnvVar}</span>
              </div>
            )}
            <div className="pt-2 flex items-center gap-3">
              <span className="text-[11px] text-amber-400/70">
                Жодні синтетичні дані не показуються. Введіть ключ у налаштуваннях середовища.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unavailable' || error?.code === 'UPSTREAM_FAILURE' || error?.code === 'SERVER_ERROR') {
    return (
      <div className="p-5 bg-rose-950/30 border border-rose-800/60 rounded-lg text-rose-200">
        <div className="flex items-start gap-3">
          <ServerOff className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-semibold font-mono text-rose-300">Джерело даних недоступне (503 UPSTREAM_FAILURE)</h4>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              {error?.message || 'Державний реєстр тимчасово не відповідає або перевищено ліміт запитів.'}
            </p>
            {error?.sourceUrl && (
              <p className="text-[11px] text-rose-400/60 font-mono truncate">
                Upstream URL: {error.sourceUrl}
              </p>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 px-3 py-1 bg-rose-900/50 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs rounded font-mono transition-colors"
              >
                Повторити запит
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'rate_limited' || error?.code === 'RATE_LIMITED') {
    return (
      <div className="p-5 bg-purple-950/30 border border-purple-800/60 rounded-lg text-purple-200">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold font-mono text-purple-300">Перевищено частоту запитів (429 RATE_LIMITED)</h4>
            <p className="text-xs text-purple-200/80">
              {error?.message || 'Шлюз першоджерела обмежив кількість одночасних запитів. Зачекайте декілька секунд.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
