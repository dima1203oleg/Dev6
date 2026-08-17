/**
 * SearchProgressIndicator — Real-time search pipeline status
 * 
 * Implements Spec Items #13, #42:
 * Shows REAL status updates from the pipeline, not fake progress.
 * 
 * Searching 37 sources...
 * 24 responded | 5 no data | 3 unavailable | 5 pending
 */
import React from 'react';
import { motion } from 'motion/react';
import { Loader2, CheckCircle, XCircle, WifiOff, Clock } from 'lucide-react';

export interface SearchPhase {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

export interface SourceProgress {
  total: number;
  responded: number;
  noData: number;
  unavailable: number;
  pending: number;
}

interface SearchProgressIndicatorProps {
  isSearching: boolean;
  phases?: SearchPhase[];
  sourceProgress?: SourceProgress;
  query?: string;
}

const defaultPhases: SearchPhase[] = [
  { label: 'Пошук по джерелам...', status: 'pending' },
  { label: 'Резолюція ідентичності...', status: 'pending' },
  { label: 'Перевірка реєстрів...', status: 'pending' },
  { label: 'Валідація доказів...', status: 'pending' },
  { label: 'Побудова Entity...', status: 'pending' },
];

export const SearchProgressIndicator: React.FC<SearchProgressIndicatorProps> = ({
  isSearching,
  phases = defaultPhases,
  sourceProgress,
  query,
}) => {
  if (!isSearching) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 max-w-lg mx-auto"
    >
      {/* Query echo */}
      {query && (
        <div className="text-center mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Пошуковий запит</p>
          <p className="text-lg font-bold text-white font-mono">{query}</p>
        </div>
      )}

      {/* Phases */}
      <div className="space-y-3 mb-4">
        {phases.map((phase, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3"
          >
            {phase.status === 'active' && <Loader2 size={14} className="text-indigo-400 animate-spin" />}
            {phase.status === 'done' && <CheckCircle size={14} className="text-emerald-400" />}
            {phase.status === 'error' && <XCircle size={14} className="text-red-400" />}
            {phase.status === 'pending' && <Clock size={14} className="text-slate-600" />}
            <span className={`text-sm ${
              phase.status === 'active' ? 'text-indigo-300' :
              phase.status === 'done' ? 'text-emerald-300' :
              phase.status === 'error' ? 'text-red-300' :
              'text-slate-600'
            }`}>
              {phase.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Source progress */}
      {sourceProgress && (
        <div className="border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500">Пошук по {sourceProgress.total} джерелам...</span>
            <span className="text-indigo-400 font-mono">
              {sourceProgress.responded + sourceProgress.noData + sourceProgress.unavailable}/{sourceProgress.total}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${((sourceProgress.responded + sourceProgress.noData + sourceProgress.unavailable) / sourceProgress.total) * 100}%` }}
            />
          </div>
          {/* Breakdown */}
          <div className="flex justify-between text-[10px]">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle size={10} /> {sourceProgress.responded} відповіли
            </span>
            <span className="text-slate-500 flex items-center gap-1">
              <XCircle size={10} /> {sourceProgress.noData} без даних
            </span>
            <span className="text-orange-400 flex items-center gap-1">
              <WifiOff size={10} /> {sourceProgress.unavailable} недоступні
            </span>
            <span className="text-slate-600 flex items-center gap-1">
              <Clock size={10} /> {sourceProgress.pending} очікують
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
