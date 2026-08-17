/**
 * SourceHealthStatus — Real-time system status display
 * 
 * Implements Spec Items #43, #53:
 * Shows health of each registered source connector.
 * Status comes from the health/connector system.
 */
import React from 'react';
import { Activity, CheckCircle, AlertTriangle, Wrench, XCircle, Clock, ShieldAlert, AlertOctagon } from 'lucide-react';

export type SourceHealth = 'HEALTHY' | 'DEGRADED' | 'MAINTENANCE' | 'DOWN' | 'AUTH_ERROR' | 'SCHEMA_BROKEN' | 'STALE';

interface SourceStatus {
  name: string;
  health: SourceHealth;
  latency?: number;
  lastChecked?: string;
}

interface SourceHealthStatusProps {
  sources: SourceStatus[];
  compact?: boolean;
}

const healthConfig: Record<SourceHealth, {
  icon: React.ElementType;
  emoji: string;
  label: string;
  dotColor: string;
  textColor: string;
}> = {
  HEALTHY: { icon: CheckCircle, emoji: '🟢', label: 'Онлайн', dotColor: 'bg-emerald-500', textColor: 'text-emerald-400' },
  DEGRADED: { icon: AlertTriangle, emoji: '🟡', label: 'Знижена', dotColor: 'bg-amber-500', textColor: 'text-amber-400' },
  MAINTENANCE: { icon: Wrench, emoji: '🟡', label: 'Обслуговування', dotColor: 'bg-yellow-500', textColor: 'text-yellow-400' },
  DOWN: { icon: XCircle, emoji: '🔴', label: 'Офлайн', dotColor: 'bg-red-500', textColor: 'text-red-400' },
  AUTH_ERROR: { icon: ShieldAlert, emoji: '🔴', label: 'Помилка авториз.', dotColor: 'bg-red-500', textColor: 'text-red-400' },
  SCHEMA_BROKEN: { icon: AlertOctagon, emoji: '🔴', label: 'Зламана схема', dotColor: 'bg-orange-500', textColor: 'text-orange-400' },
  STALE: { icon: Clock, emoji: '⚪', label: 'Застарілі дані', dotColor: 'bg-slate-500', textColor: 'text-slate-400' },
};

export const SourceHealthStatus: React.FC<SourceHealthStatusProps> = ({ sources, compact = false }) => {
  const healthyCount = sources.filter(s => s.health === 'HEALTHY').length;
  const total = sources.length;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Activity size={12} className="text-indigo-400" />
        <span className="text-slate-400">Джерела:</span>
        <span className="text-emerald-400 font-bold">{healthyCount}</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-400">{total}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity size={14} className="text-indigo-400" />
          Статус джерел
        </h3>
        <span className="text-xs text-slate-500">{healthyCount}/{total} онлайн</span>
      </div>
      <div className="divide-y divide-slate-800/30">
        {sources.map((source, i) => {
          const config = healthConfig[source.health];
          return (
            <div key={i} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <span className="text-sm text-slate-300">{source.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {source.latency && (
                  <span className="text-[10px] text-slate-600 font-mono">{source.latency}ms</span>
                )}
                <span className={`text-[10px] font-medium ${config.textColor}`}>{config.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
