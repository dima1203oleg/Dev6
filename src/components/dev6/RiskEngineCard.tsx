import React from 'react';
import { ShieldAlert, ExternalLink, ShieldCheck } from 'lucide-react';
import { RiskScoringResult, RiskSignalItem } from '../../types/dataSources';

interface RiskEngineCardProps {
  riskResult?: RiskScoringResult;
}

export const RiskEngineCard: React.FC<RiskEngineCardProps> = ({ riskResult }) => {
  if (!riskResult) return null;

  const { totalScore, riskLevel, signals, meta } = riskResult;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/80 text-rose-400';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-300 border-orange-700/80 text-orange-400';
      case 'MODERATE':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/80 text-amber-400';
      case 'LOW':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/80 text-blue-400';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 text-emerald-400';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-700/50';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-700/50';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-700/50';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-700/50';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Детермінована Оцінка Ризику (Risk Engine v6)
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded border text-xs font-bold tracking-wider ${getLevelColor(riskLevel)}`}>
            РІВЕНЬ: {riskLevel}
          </span>
          <div className="flex items-baseline gap-1 bg-slate-950 px-3 py-1 rounded border border-slate-800">
            <span className="text-xs text-slate-400">БАЛИ:</span>
            <span className="text-base font-extrabold text-white">{totalScore}</span>
            <span className="text-[10px] text-slate-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Виявлені Фактори Ризику ({signals.length})
        </div>

        {signals.length === 0 ? (
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-lg flex items-center gap-3 text-emerald-300 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Факторів підвищеного ризику за перевіреними державними реєстрами не виявлено.</span>
          </div>
        ) : (
          signals.map((sig: RiskSignalItem, idx: number) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getSeverityBadge(sig.severity)}`}>
                    +{sig.weight} PT • {sig.severity}
                  </span>
                  <span className="text-xs font-bold text-white">{sig.title}</span>
                </div>
                <span className="text-[10px] text-slate-500">{sig.recordScope}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-1 border-l-2 border-slate-700">
                {sig.explanation}
              </p>

              {sig.sourceRefs.length > 0 && (
                <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                  <span>Джерело:</span>
                  {sig.sourceRefs.map((ref, rIdx) => (
                    <a
                      key={rIdx}
                      href={ref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                    >
                      <span>{ref}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Meta */}
      <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
        <div>Оцінено на базі <strong className="text-slate-300">{meta?.basedOnRecords || 0}</strong> записів</div>
        <div>Область: <span className="text-slate-300">{meta?.sourceScope || 'Державні реєстри'}</span></div>
      </div>
    </div>
  );
};
