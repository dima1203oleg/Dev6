/**
 * ConfidenceIndicator — Shows confidence score with breakdown
 * 
 * Implements Spec Item #19:
 * Confidence is NOT a decorative number. It shows:
 * - Overall score + label (High/Medium/Low)
 * - On click/expand: sub-scores (identifier match, freshness, corroboration, conflict penalty)
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface ConfidenceBreakdown {
  identifierMatch: number;
  sourceAuthority: number;
  freshness: number;
  corroboration: number;
  conflictPenalty: number;
}

interface ConfidenceIndicatorProps {
  score: number;
  breakdown?: ConfidenceBreakdown;
  compact?: boolean;
}

function getConfidenceLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Високий', color: 'text-emerald-400' };
  if (score >= 70) return { label: 'Середній', color: 'text-amber-400' };
  if (score >= 50) return { label: 'Низький', color: 'text-orange-400' };
  return { label: 'Критичний', color: 'text-red-400' };
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  breakdown,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { label, color } = getConfidenceLabel(score);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <ShieldCheck size={14} className={color} />
        <span className={`text-sm font-bold ${color}`}>{score}%</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
        onClick={() => breakdown && setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className={color} />
          <span className="text-sm text-slate-400">Рівень довіри</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${color}`}>{score}%</span>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-800 ${color}`}>{label}</span>
          {breakdown && (
            isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />
          )}
        </div>
      </button>

      {/* Breakdown */}
      {isExpanded && breakdown && (
        <div className="px-4 pb-3 border-t border-slate-800/50 pt-3 space-y-2">
          <BreakdownRow label="Збіг ідентифікатора" value={breakdown.identifierMatch} />
          <BreakdownRow label="Авторитетність джерела" value={breakdown.sourceAuthority} />
          <BreakdownRow label="Свіжість даних" value={breakdown.freshness} />
          <BreakdownRow label="Кросвалідація" value={breakdown.corroboration} />
          <BreakdownRow label="Штраф за конфлікти" value={-breakdown.conflictPenalty} isNegative />
        </div>
      )}
    </div>
  );
};

const BreakdownRow: React.FC<{ label: string; value: number; isNegative?: boolean }> = ({ label, value, isNegative }) => {
  const color = isNegative 
    ? 'text-red-400' 
    : value >= 90 ? 'text-emerald-400' : value >= 70 ? 'text-amber-400' : 'text-red-400';
  
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${isNegative ? 'bg-red-500' : value >= 90 ? 'bg-emerald-500' : value >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${Math.abs(value)}%` }}
          />
        </div>
        <span className={`font-mono font-bold ${color} w-10 text-right`}>
          {isNegative ? `-${Math.abs(value)}` : value}%
        </span>
      </div>
    </div>
  );
};
