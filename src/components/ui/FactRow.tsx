import React from 'react';
import { Fact } from '../../types/search';
import { StatusBadge } from './StatusBadge';
import { FileText, Database, Calendar } from 'lucide-react';

interface FactRowProps {
  label: string;
  fact: Fact;
  onViewEvidence?: (fact: Fact) => void;
}

export const FactRow: React.FC<FactRowProps> = ({ label, fact, onViewEvidence }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-800/50 last:border-0 gap-3">
      <div className="flex-1">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-sm text-slate-200 font-medium break-all">
          {typeof fact.value === 'boolean' ? (fact.value ? 'Так' : 'Ні') : fact.value}
        </div>
        {fact.explanation && (
          <div className="text-xs text-slate-400 mt-1 italic">{fact.explanation}</div>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-3 sm:justify-end min-w-[300px]">
        <StatusBadge status={fact.status} />
        
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/30 px-2 py-1 rounded-md" title="Джерело">
          <Database size={12} className="text-blue-400" />
          <span className="truncate max-w-[100px]">{fact.source}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/30 px-2 py-1 rounded-md" title="Дата актуальності">
          <Calendar size={12} className="text-slate-400" />
          <span>{new Date(fact.retrievedAt).toLocaleDateString('uk-UA')}</span>
        </div>

        {fact.evidenceId && (
          <button
            onClick={() => onViewEvidence && onViewEvidence(fact)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 py-1 rounded-md transition-colors"
            title="Переглянути доказ"
          >
            <FileText size={12} />
            <span>Доказ</span>
          </button>
        )}
      </div>
    </div>
  );
};
