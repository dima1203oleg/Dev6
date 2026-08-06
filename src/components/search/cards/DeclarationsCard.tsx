import React from 'react';
import { FileBadge, Calendar, DollarSign, Building2, User } from 'lucide-react';

interface DeclarationsCardProps {
  entity: any;
  declarationData?: any;
}

export const DeclarationsCard: React.FC<DeclarationsCardProps> = ({ entity, declarationData }) => {
  const declarations = declarationData?.declarations || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileBadge size={16} className="text-pink-400" />
          Е-Декларації (НАЗК)
        </h3>
      </div>

      {declarations.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Записів у реєстрі декларацій НАЗК не виявлено.
        </div>
      ) : (
        <div className="space-y-4">
          {declarations.map((d: any, i: number) => (
            <div key={i} className="border border-slate-800 rounded-xl p-4 bg-slate-950/50 space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <User size={14} className="text-pink-400"/> {d.declarantName}
                </div>
                <div className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {d.year} рік
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Посада</div>
                  <div className="text-slate-300 mt-1 flex items-start gap-1">
                    <Building2 size={12} className="shrink-0 mt-0.5 text-slate-400"/>
                    {d.position}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Місце роботи</div>
                  <div className="text-slate-300 mt-1">{d.workplace}</div>
                </div>
              </div>
              {d.incomeTotal && (
                <div className="pt-2 border-t border-slate-800/50 flex justify-between items-center text-xs">
                  <span className="text-slate-500 uppercase tracking-widest text-[10px]">Сукупний дохід</span>
                  <span className="text-emerald-400 font-bold flex items-center"><DollarSign size={12}/> {d.incomeTotal} ₴</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
