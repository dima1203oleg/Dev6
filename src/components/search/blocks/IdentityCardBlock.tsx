import React from 'react';
import { IdentityCardData } from '../../../types/search';
import { VerificationStatus } from '../../../types';
import { User, Building, ShieldCheck, CheckCircle } from 'lucide-react';

interface IdentityCardBlockProps {
  data: IdentityCardData;
}

export const IdentityCardBlock: React.FC<IdentityCardBlockProps> = ({ data }) => {
  const Icon = data.entityType === 'COMPANY' ? Building : User;
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Ідентифікаційна картка</h2>
      </div>
      <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
        
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
          <Icon size={32} className="text-slate-400" />
        </div>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-1">{data.fullName}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-400">Ідентифікатор: <strong className="text-slate-200">{data.identifier}</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Тип: <strong className="text-slate-200">{data.entityType}</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Останнє підтвердження: <strong className="text-slate-200">{new Date(data.lastConfirmedAt).toLocaleDateString('uk-UA')}</strong></span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 min-w-[200px]">
           <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
             <span className="text-xs text-slate-500 uppercase tracking-wider">Рівень довіри</span>
             <div className="flex items-center gap-1.5">
               <ShieldCheck size={16} className={data.trustLevel > 80 ? 'text-emerald-400' : 'text-amber-400'} />
               <span className="text-white font-bold">{data.trustLevel}%</span>
             </div>
           </div>
           
           <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
             <span className="text-xs text-slate-500 uppercase tracking-wider">Джерел</span>
             <div className="flex items-center gap-1.5">
               <CheckCircle size={16} className="text-blue-400" />
               <span className="text-white font-bold">{data.sourcesCount}</span>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};
