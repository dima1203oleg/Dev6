/**
 * Card-Level Production Validation & Data Completeness Certification Framework v1.0
 * UI component for displaying card validation previews
 */

import React from 'react';
import { CardPreview, CardStatus } from '../../lib/cardValidation/types';
import { CheckCircle, AlertTriangle, XCircle, MinusCircle } from 'lucide-react';

interface CardValidationPreviewProps {
  previews: CardPreview[];
  onCardClick: (cardId: string) => void;
}

export const CardValidationPreview: React.FC<CardValidationPreviewProps> = ({
  previews,
  onCardClick,
}) => {
  const getStatusIcon = (status: CardStatus) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'NO_DATA':
        return <MinusCircle className="w-4 h-4 text-slate-400" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-rose-400" />;
    }
  };

  const getStatusColor = (status: CardStatus) => {
    switch (status) {
      case 'PASS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'WARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'NO_DATA':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'FAIL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Статус інформаційних карток
        </h2>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-950/50 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <div className="col-span-3">Картка</div>
        <div className="col-span-1 text-center">Статус</div>
        <div className="col-span-2 text-center">Заповнення</div>
        <div className="col-span-1 text-center">Джерела</div>
        <div className="col-span-2 text-center">Оновлено</div>
        <div className="col-span-2 text-center">Довіра</div>
        <div className="col-span-1"></div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-800/50">
        {previews.map((preview) => (
          <button
            key={preview.cardId}
            onClick={() => onCardClick(preview.cardId)}
            className="w-full grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors text-left"
          >
            <div className="col-span-3 flex items-center gap-2">
              {getStatusIcon(preview.status)}
              <span className="text-sm text-slate-200 truncate">{preview.cardName}</span>
            </div>
            
            <div className="col-span-1 flex items-center justify-center">
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(
                  preview.status
                )}`}
              >
                {preview.status}
              </span>
            </div>
            
            <div className="col-span-2 flex items-center justify-center">
              <span
                className={`text-sm font-mono font-bold ${getCompletionColor(
                  preview.completionPercentage
                )}`}
              >
                {preview.completionPercentage}%
              </span>
            </div>
            
            <div className="col-span-1 flex items-center justify-center">
              <span className="text-sm font-mono text-slate-300">
                {preview.sourceCount}
              </span>
            </div>
            
            <div className="col-span-2 flex items-center justify-center">
              <span className="text-xs font-mono text-slate-400">
                {formatDate(preview.lastUpdated)}
              </span>
            </div>
            
            <div className="col-span-2 flex items-center justify-center">
              <span
                className={`text-sm font-mono font-bold ${getCompletionColor(
                  preview.confidenceScore
                )}`}
              >
                {preview.confidenceScore}%
              </span>
            </div>
            
            <div className="col-span-1 flex items-center justify-end">
              <span className="text-slate-500 text-xs">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
