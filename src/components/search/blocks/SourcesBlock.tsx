import React from 'react';
import { SourceCheckData } from '../../../types/search';
import { CheckCircle, AlertTriangle, XCircle, FileMinus, HelpCircle } from 'lucide-react';

interface SourcesBlockProps {
  sources: SourceCheckData[];
}

export const SourcesBlock: React.FC<SourcesBlockProps> = ({ sources }) => {
  const getIcon = (status: SourceCheckData['status']) => {
    switch (status) {
      case 'CHECKED_MATCH': return <CheckCircle size={16} className="text-emerald-400" />;
      case 'CHECKED_NO_MATCH': return <XCircle size={16} className="text-slate-400" />;
      case 'UNAVAILABLE': return <FileMinus size={16} className="text-red-400" />;
      case 'NEEDS_VERIFICATION': return <AlertTriangle size={16} className="text-amber-400" />;
      case 'UNSUPPORTED': return <HelpCircle size={16} className="text-slate-500" />;
    }
  };

  const getLabel = (status: SourceCheckData['status']) => {
    switch (status) {
      case 'CHECKED_MATCH': return 'Збіг знайдено';
      case 'CHECKED_NO_MATCH': return 'Збігів немає';
      case 'UNAVAILABLE': return 'Тимчасово недоступно';
      case 'NEEDS_VERIFICATION': return 'Потребує верифікації';
      case 'UNSUPPORTED': return 'Не підтримує даний тип';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Перевірені джерела</h2>
      </div>
      <div className="p-0">
        <ul className="divide-y divide-slate-800/50">
          {sources.map((source) => (
            <li key={source.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <span className="text-sm font-medium text-slate-200">{source.name}</span>
              <div className="flex items-center gap-2">
                {getIcon(source.status)}
                <span className="text-xs text-slate-400 w-32 text-right">{getLabel(source.status)}</span>
              </div>
            </li>
          ))}
          {sources.length === 0 && (
            <li className="px-6 py-8 text-center text-slate-500 text-sm">
              Немає даних про джерела.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
