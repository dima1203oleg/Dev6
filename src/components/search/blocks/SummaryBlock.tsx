import React from 'react';
import { SummaryBlockData } from '../../../types/search';
import { EntityType, VerificationStatus } from '../../../types';
import { AlertTriangle, CheckCircle, HelpCircle, XCircle, FileMinus, ShieldAlert } from 'lucide-react';

interface SummaryBlockProps {
  data: SummaryBlockData;
}

export const SummaryBlock: React.FC<SummaryBlockProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Короткий підсумок</h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Type & Status */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Об'єкт пошуку</div>
          <div className="text-sm font-bold text-white mb-1">
            {data.entityType === EntityType.PERSON ? 'Фізична особа' : 
             data.entityType === EntityType.COMPANY ? 'Юридична особа' : 
             data.entityType === EntityType.FOP ? 'ФОП' : 'Об\'єкт'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {data.keyStatus === VerificationStatus.CONFIRMED ? (
              <span className="text-emerald-400 flex items-center gap-1 text-xs font-medium"><CheckCircle size={14} /> ВЕРИФІКОВАНО</span>
            ) : data.keyStatus === VerificationStatus.CONFLICT ? (
              <span className="text-amber-400 flex items-center gap-1 text-xs font-medium"><AlertTriangle size={14} /> КОНФЛІКТ</span>
            ) : data.keyStatus === VerificationStatus.SINGLE_SOURCE ? (
              <span className="text-blue-400 flex items-center gap-1 text-xs font-medium"><HelpCircle size={14} /> ОДНЕ ДЖЕРЕЛО</span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1 text-xs font-medium"><XCircle size={14} /> НЕВІДОМО</span>
            )}
          </div>
        </div>

        {/* Matches */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
           <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Наявність даних</div>
           <div className="space-y-2">
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Прямі збіги</span>
                {data.hasMatches ? <CheckCircle size={16} className="text-emerald-400" /> : <FileMinus size={16} className="text-slate-600" />}
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Підтверджені зв'язки</span>
                {data.hasConfirmedLinks ? <CheckCircle size={16} className="text-emerald-400" /> : <FileMinus size={16} className="text-slate-600" />}
             </div>
           </div>
        </div>

        {/* Warnings */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
           <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Сигнали уваги</div>
           <div className="space-y-2">
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Ризики</span>
                {data.hasRisks ? <ShieldAlert size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-emerald-400" />}
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Конфлікти даних</span>
                {data.hasConflicts ? <AlertTriangle size={16} className="text-amber-400" /> : <CheckCircle size={16} className="text-emerald-400" />}
             </div>
           </div>
        </div>

        {/* Incompleteness */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
           <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Повнота картини</div>
           <div className="flex flex-col justify-center h-full pt-1">
             {data.hasUnavailableSources ? (
               <div className="flex items-start gap-2 text-amber-400 text-sm">
                 <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                 <span>Частина джерел наразі недоступна. Картина може бути неповною.</span>
               </div>
             ) : (
               <div className="flex items-start gap-2 text-emerald-400 text-sm">
                 <CheckCircle size={16} className="shrink-0 mt-0.5" />
                 <span>Усі релевантні джерела опитано.</span>
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};
