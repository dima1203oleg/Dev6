/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Temporal Risk Dynamics Engine (Snapshot Diff Engine)
 */

import { useState } from 'react';
import { 
  History, TrendingUp, TrendingDown, Activity
} from 'lucide-react';
import { OsintEntity } from '../osintData';

interface TemporalRiskDiffEngineProps {
  entity: OsintEntity;
}

export default function TemporalRiskDiffEngine({ entity }: TemporalRiskDiffEngineProps) {
  const [selectedBaselinePeriod, setSelectedBaselinePeriod] = useState<'q1_2024' | 'q3_2024' | 'q4_2024'>('q1_2024');

  // Generate historical baseline mock based on entity
  const baselineRisk = selectedBaselinePeriod === 'q1_2024' 
    ? Math.max(15, entity.riskScore - 38)
    : selectedBaselinePeriod === 'q3_2024'
      ? Math.max(30, entity.riskScore - 22)
      : Math.max(45, entity.riskScore - 12);

  const currentRisk = entity.riskScore;
  const riskDelta = currentRisk - baselineRisk;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
              Двигун Часової Динаміки Ризику (Diff Engine)
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Порівняння історичного знімку профілю з поточним вектором загроз в реальному часі
            </p>
          </div>
        </div>

        {/* Baseline Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-500 font-mono uppercase px-2 font-bold">Базовий знімок:</span>
          <button
            onClick={() => setSelectedBaselinePeriod('q1_2024')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedBaselinePeriod === 'q1_2024' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Q1 2024
          </button>
          <button
            onClick={() => setSelectedBaselinePeriod('q3_2024')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedBaselinePeriod === 'q3_2024' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Q3 2024
          </button>
          <button
            onClick={() => setSelectedBaselinePeriod('q4_2024')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedBaselinePeriod === 'q4_2024' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Q4 2024
          </button>
        </div>
      </div>

      {/* Comparison Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Baseline Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">
            Історичний Знімок T-0 ({selectedBaselinePeriod.toUpperCase()})
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-200 font-mono">{baselineRisk}%</span>
            <span className="text-xs text-slate-400 font-sans">Початковий індекс</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Бенефіціарів: 1 • Офшорні зв'язки: {entity.isOffshoreFlag ? 'Ні' : 'Ні'}
          </p>
        </div>

        {/* Delta Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1 relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">
            Динаміка Зміни (Delta)
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono flex items-center gap-1 ${riskDelta >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {riskDelta >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {riskDelta >= 0 ? `+${riskDelta}%` : `${riskDelta}%`}
            </span>
            <span className="text-xs text-slate-400 font-sans">
              {riskDelta >= 20 ? 'Критична ескалація' : riskDelta > 0 ? 'Помірне зростання' : 'Зниження ризику'}
            </span>
          </div>
          <p className="text-[11px] text-amber-400 font-mono">
            Виявлено {Math.abs(Math.round(riskDelta / 5))} нових сигналів ризику
          </p>
        </div>

        {/* Current State Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-widest block">
            Поточний Знімок T-1 (Real-time)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-500 font-mono">{currentRisk}%</span>
            <span className="text-xs text-slate-400 font-sans">Поточний індекс</span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono">
            Статус: <span className="font-bold text-rose-400">{entity.status}</span>
          </p>
        </div>
      </div>

      {/* Delta Changes Breakdown Table */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2">
        <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>Журнал Структурних Змін та Зрушень (Diff Log)</span>
        </h4>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] uppercase">+ ДОДАНО</span>
              <span className="text-slate-200">Виявлено транзакційні зв'язки з офшорною юрисдикцією BVI</span>
            </div>
            <span className="text-[10px] text-slate-500">2026-07-18</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase">⚡ ЗМІНЕНО</span>
              <span className="text-slate-200">Зміна номінального директора на нову фізособу (PEP зв'язок)</span>
            </div>
            <span className="text-[10px] text-slate-500">2026-05-02</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] uppercase">+ САНКЦІЇ</span>
              <span className="text-slate-200">Внесення пов'язаної юридичної особи до реєстру РНБО</span>
            </div>
            <span className="text-[10px] text-slate-500">2026-03-12</span>
          </div>
        </div>
      </div>
    </div>
  );
}
