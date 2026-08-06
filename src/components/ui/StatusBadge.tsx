import React from 'react';
import { FactStatus } from '../../types/search';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, FileMinus } from 'lucide-react';

interface StatusBadgeProps {
  status: FactStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle size={12} />
          Підтверджено
        </span>
      );
    case 'DERIVED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <HelpCircle size={12} />
          Похідне
        </span>
      );
    case 'CONFLICTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle size={12} />
          Конфлікт
        </span>
      );
    case 'NO_MATCH':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <XCircle size={12} />
          Не знайдено
        </span>
      );
    case 'UNAVAILABLE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <FileMinus size={12} />
          Недоступно
        </span>
      );
    default:
      return null;
  }
};
