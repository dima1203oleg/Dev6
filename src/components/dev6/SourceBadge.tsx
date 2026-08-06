import React from 'react';
import { Database, ShieldCheck, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Provenance } from '../../types/dataSources';

interface SourceBadgeProps {
  provenance?: Provenance;
  sourceName?: string;
  onClick?: () => void;
  compact?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  provenance,
  sourceName,
  onClick,
  compact = false,
}) => {
  const name = provenance?.source || sourceName || 'Державний реєстр';
  const isCached = provenance?.cached ?? false;
  const isStale = provenance?.stale ?? false;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
        isStale
          ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
          : isCached
          ? 'bg-blue-950/40 text-blue-300 border-blue-800/60 hover:bg-blue-900/50'
          : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50'
      }`}
      title="Натисніть для перегляду provenance (походження даних)"
    >
      <Database className="w-3 h-3 shrink-0" />
      <span className="truncate max-w-[160px] font-medium">{name}</span>

      {isStale ? (
        <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
          <Clock className="w-2.5 h-2.5" /> STALE
        </span>
      ) : isCached ? (
        <span className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
          <RefreshCw className="w-2.5 h-2.5" /> CACHED
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
          <ShieldCheck className="w-2.5 h-2.5" /> LIVE
        </span>
      )}
    </button>
  );
};
