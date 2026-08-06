import React from 'react';
import { Briefcase, ShoppingCart, Award, Building, Activity, FileText } from 'lucide-react';

interface ProcurementCardProps {
  entity: any;
  procurementData?: any;
}

export const ProcurementCard: React.FC<ProcurementCardProps> = ({ entity, procurementData }) => {
  const tenders = procurementData?.tenders || [];
  const tendersCount = procurementData?.tendersCount || tenders.length;
  const totalValue = procurementData?.totalValue || 0;
  const winsCount = procurementData?.winsCount || procurementData?.wonTendersCount || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Briefcase size={16} className="text-cyan-400" />
          Державні закупівлі (ProZorro)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-emerald-400">{winsCount}</div>
          <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Перемог</div>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-cyan-400">{tendersCount}</div>
          <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Участей</div>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-amber-400">
            {totalValue > 0 ? `${(totalValue / 1000000).toFixed(1)}M ₴` : '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Загальна сума</div>
        </div>
      </div>

      {tendersCount === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Інформації про участь у тендерах ProZorro не знайдено.
        </div>
      ) : tenders.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Знайдено {tendersCount} тендерів. Детальний список недоступний у базовому доступі.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Останні тендери</div>
          {tenders.slice(0, 5).map((t: any, i: number) => (
            <div key={i} className="border border-slate-800 rounded-xl p-4 bg-slate-950/50 space-y-2 text-sm">
              <div className="flex justify-between items-start">
                <div className="font-medium text-white">{t.title}</div>
                <div className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${t.status === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {t.status === 'WIN' ? 'Перемога' : 'Участь'}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1"><Building size={12}/> Замовник: {t.customer}</div>
                <div className="flex items-center gap-1 text-emerald-400"><ShoppingCart size={12}/> {t.amount} ₴</div>
                <div className="flex items-center gap-1"><FileText size={12}/> Дата: {t.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
