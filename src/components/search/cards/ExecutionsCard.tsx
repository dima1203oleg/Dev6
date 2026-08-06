import React from 'react';
import { Scale, Gavel, AlertCircle, CheckCircle, FileText, Clock } from 'lucide-react';

interface EnforcementItem {
  vpNumber: string;
  creditor: string;
  debtor: string;
  category: string;
  status: string;
  department: string;
  startDate: string;
}

interface ExecutionsCardProps {
  entity: any;
  legalData?: {
    activeEnforcementsCount?: number;
    enforcementProceedings?: EnforcementItem[];
    isBankrupt?: boolean;
    bankruptcyStage?: string;
  };
}

const STATUS_STYLE: Record<string, string> = {
  ОТКРЫТО: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  ЗАВЕРШЕНО: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  ЗУПИНЕНО: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

export const ExecutionsCard: React.FC<ExecutionsCardProps> = ({ entity, legalData }) => {
  const enforcements = legalData?.enforcementProceedings || [];
  const activeCount = legalData?.activeEnforcementsCount ?? 0;
  const isBankrupt = legalData?.isBankrupt ?? false;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Scale size={16} className="text-amber-400" />
          Виконавчі провадження
        </h3>
        <span className="text-xs text-slate-500 font-mono">АСВП / ЄРБ / МІН'ЮСТ</span>
      </div>

      {/* Bankruptcy Alert */}
      {isBankrupt && (
        <div className="flex items-center gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg animate-pulse">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">ВІДКРИТЕ ПРОВАДЖЕННЯ ПРО БАНКРУТСТВО</h4>
            <p className="text-xs text-rose-300">{legalData?.bankruptcyStage || 'Стадія банкрутства визначається'}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
          <div className={`text-3xl font-black ${activeCount > 0 ? 'text-rose-400' : 'text-white'}`}>{activeCount}</div>
          <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Активних VP</div>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-white">{enforcements.length}</div>
          <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Всього</div>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
          <div className={`text-3xl font-black ${isBankrupt ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isBankrupt ? '!' : '✓'}
          </div>
          <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Банкрутство</div>
        </div>
      </div>

      {enforcements.length === 0 ? (
        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle size={20} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Виконавчих проваджень не виявлено</h4>
            <p className="text-xs text-slate-400">Перевірка в АСВП та Єдиному реєстрі боржників Мін'юсту не виявила активних ВП.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Деталі провадження</div>
          {enforcements.map((item, i) => (
            <div key={i} className="border border-slate-800 rounded-xl p-4 bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gavel size={14} className="text-amber-400" />
                  <span className="text-white font-bold font-mono text-sm">ВП №{item.vpNumber}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${STATUS_STYLE[item.status] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                  {item.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Стягувач</div>
                  <div className="text-white mt-0.5">{item.creditor}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Категорія</div>
                  <div className="text-slate-300 mt-0.5">{item.category}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Відділ ДВС</div>
                  <div className="text-slate-400 mt-0.5">{item.department}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Дата відкриття</div>
                  <div className="text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                    <Clock size={10} />{item.startDate}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
