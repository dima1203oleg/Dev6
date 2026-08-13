import { Dossier } from '../types';
import { ShieldAlert, GitCompare, AlertTriangle } from 'lucide-react';

interface ComparisonWorkspaceProps {
  entityA: Dossier;
  entityB: Dossier;
  onClose: () => void;
}

export function ComparisonWorkspace({ entityA, entityB, onClose }: ComparisonWorkspaceProps) {
  const entA = (entityA.entity || {}) as any;
  const entB = (entityB.entity || {}) as any;

  // Extract identifiers and properties
  const nameA = entA.name || entA.fullName || entA.plate || "Об'єкт А";
  const nameB = entB.name || entB.fullName || entB.plate || "Об'єкт Б";
  const riskA = entityA.risk?.score || 0;
  const riskB = entityB.risk?.score || 0;

  // Extract shared elements
  const driversA: any[] = (entityA.risk as any)?.drivers || [];
  const driversB: any[] = (entityB.risk as any)?.drivers || [];
  const commonDrivers = driversA.filter(d => driversB.some(db => (db.name || db.type) === (d.name || d.type)));

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <GitCompare size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Порівняльний аналіз об'єктів
            </h2>
            <p className="text-xs text-slate-400">
              Аналіз перетинів, спільних зв'язків та співпадань ризиків
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer"
        >
          Закрити порівняння
        </button>
      </div>

      {/* Side by Side Main Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entity A Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <span className="text-[10px] font-mono uppercase text-blue-400 tracking-wider">ОСНОВНИЙ ОБ'ЄКТ (А)</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${riskA > 50 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              SCORE: {riskA}/100
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">{nameA}</h3>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">ID / ЄДРПОУ</span>
              <span className="font-mono">{entA.id || entA.rnokpp || entA.edrpou || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">Тип</span>
              <span>{entA.type || 'Фізична особа'}</span>
            </div>
          </div>
        </div>

        {/* Entity B Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <span className="text-[10px] font-mono uppercase text-indigo-400 tracking-wider">ПОРІВНЯЛЬНИЙ ОБ'ЄКТ (Б)</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${riskB > 50 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              SCORE: {riskB}/100
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">{nameB}</h3>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">ID / ЄДРПОУ</span>
              <span className="font-mono">{entB.id || entB.rnokpp || entB.edrpou || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">Тип</span>
              <span>{entB.type || 'Фізична особа'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Insights Section */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-indigo-950/40 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
          <AlertTriangle size={14} /> Виявлені спільні точки та перетини
        </h4>
        {commonDrivers.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Прямих негативних перетинів ризиків не виявлено.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {commonDrivers.map((driver, idx) => (
              <div key={idx} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs space-y-1">
                <div className="font-bold text-red-400 flex items-center gap-1.5">
                  <ShieldAlert size={12} /> {driver.name || driver.type}
                </div>
                <p className="text-slate-400 text-[11px]">{driver.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side by Side Detail Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Entity A Details */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Фактори ризику (А)</h4>
            <div className="space-y-2">
              {driversA.map((d, i) => (
                <div key={i} className="text-xs p-2 bg-slate-800/40 rounded border border-slate-800 flex justify-between">
                  <span>{d.name || d.type}</span>
                  <span className="font-mono text-amber-400">{d.impact ? `+${d.impact}` : (d.severity || 'HIGH')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Entity B Details */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Фактори ризику (Б)</h4>
            <div className="space-y-2">
              {driversB.map((d, i) => (
                <div key={i} className="text-xs p-2 bg-slate-800/40 rounded border border-slate-800 flex justify-between">
                  <span>{d.name || d.type}</span>
                  <span className="font-mono text-amber-400">{d.impact ? `+${d.impact}` : (d.severity || 'HIGH')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
