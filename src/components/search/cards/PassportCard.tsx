import React from 'react';
import { User, Briefcase, Hash, Calendar, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { CanonicalEntity } from '../../../types/predator';

interface PassportCardProps {
  entity: CanonicalEntity;
}

export const PassportCard: React.FC<PassportCardProps> = ({ entity }) => {
  const getIdentifier = (key: string) => {
    return (entity.identifiers as any)?.[key];
  };

  const edrpou = getIdentifier('edrpou');
  const rnokpp = getIdentifier('rnokpp');
  const name = entity.canonicalName || ('fullName' in entity ? entity.fullName : ('name' in entity ? entity.name : 'Невідомо'));
  const type = entity.type;
  
  const statusColors = {
    'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'TERMINATED': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    'BANKRUPT': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'SUSPENDED': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  };

  const statusColor = (statusColors as any)[entity.status || 'ACTIVE'] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
          {type === 'FOP' ? <User size={24} /> : <Briefcase size={24} />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white uppercase">{name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{type === 'FOP' ? 'Фізична особа-підприємець' : 'Юридична особа'}</span>
            <span className="text-slate-600">•</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${statusColor}`}>
              {entity.status || 'ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identifiers */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Hash size={16} className="text-slate-500" />
            Ідентифікаційні дані
          </h3>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            {edrpou && (
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-xs text-slate-500 uppercase tracking-widest">Код ЄДРПОУ</span>
                <span className="text-sm font-mono font-bold text-white select-all bg-slate-900 px-2 py-1 rounded">{edrpou}</span>
              </div>
            )}
            {rnokpp && (
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-xs text-slate-500 uppercase tracking-widest">РНОКПП (ІПН)</span>
                <span className="text-sm font-mono font-bold text-white select-all bg-slate-900 px-2 py-1 rounded">{rnokpp}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 uppercase tracking-widest">Рівень верифікації</span>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle size={14} />
                <span className="text-xs font-bold uppercase">Підтверджено ЄДР</span>
              </div>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            Реєстраційні дані
          </h3>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
              <span className="text-xs text-slate-500 uppercase tracking-widest">Дата реєстрації</span>
              <span className="text-sm font-mono text-slate-300 flex items-center gap-2">
                <Calendar size={12} className="text-slate-500" />
                {entity.createdAt ? new Date(entity.createdAt).toLocaleDateString('uk-UA') : 'Невідомо'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
              <span className="text-xs text-slate-500 uppercase tracking-widest">Орган реєстрації</span>
              <span className="text-xs text-slate-300 text-right max-w-[200px] truncate">
                Державна податкова служба України
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 uppercase tracking-widest">Ризик-статус</span>
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle size={14} />
                <span className="text-xs font-bold uppercase">Потребує уваги</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
