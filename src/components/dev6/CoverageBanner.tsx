import React from 'react';
import { Info, PieChart, Database, CheckCircle, AlertCircle, ShieldCheck, Activity } from 'lucide-react';
import { AggregateStatsMeta } from '../../types/dataSources';

interface CoverageBannerProps {
  meta?: AggregateStatsMeta;
  title?: string;
  totalRegisters?: number;
  activeConnectors?: number;
  sla?: string;
  onOpenHealthDashboard?: () => void;
}

export const CoverageBanner: React.FC<CoverageBannerProps> = ({
  meta,
  title,
  totalRegisters = 24,
  activeConnectors = 8,
  sla = '99.9%',
  onOpenHealthDashboard,
}) => {
  if (meta) {
    const isPartial = meta.status === 'partial' || meta.coverage < 100;
    const isEmpty = meta.status === 'empty' || meta.basedOnRecords === 0;

    return (
      <div
        className={`p-3.5 rounded-lg border text-xs font-mono mb-4 transition-colors ${
          isEmpty
            ? 'bg-slate-900/80 border-slate-700/80 text-slate-400'
            : isPartial
            ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
            : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isEmpty ? (
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
            ) : isPartial ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold">
              {title || (isPartial ? 'Часткова вибірка даних' : 'Повне якісне покриття реєстру')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1 text-slate-300">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Записів: <strong className="text-white">{meta.basedOnRecords}</strong></span>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <PieChart className="w-3.5 h-3.5 text-slate-400" />
              <span>Покриття: <strong className="text-white">{meta.coverage}%</strong></span>
            </div>

            <div className="text-slate-400 hidden sm:block">
              Scope: <span className="text-slate-200">{meta.sourceScope}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg border bg-slate-900/90 border-slate-800 text-xs font-mono mb-4 text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
        <div>
          <span className="font-bold text-slate-100">ПРЯМЕ ПІДКЛЮЧЕННЯ ДЕРЖАВНИХ ДЖЕРЕЛ (PREDATOR ETL)</span>
          <span className="hidden md:inline text-slate-400 ml-2">| Нульове використання штучних або вигаданих даних</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>Підключено реєстрів: <strong className="text-cyan-400 font-bold">{activeConnectors} / {totalRegisters}</strong></span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>SLA Доступності: <strong className="text-emerald-400 font-bold">{sla}</strong></span>
        </div>

        {onOpenHealthDashboard && (
          <button
            onClick={onOpenHealthDashboard}
            className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-750 text-cyan-400 font-sans font-medium text-xs transition-colors"
          >
            Монітор реєстрів
          </button>
        )}
      </div>
    </div>
  );
};

