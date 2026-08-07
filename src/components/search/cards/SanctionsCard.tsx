import React from 'react';
import { Shield, ShieldAlert, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { CanonicalEntity } from '../../../types/predator';

interface SanctionsCardProps {
  entity: CanonicalEntity;
  sanctionsData?: any;
}

export const SanctionsCard: React.FC<SanctionsCardProps> = ({ entity, sanctionsData }) => {
  const data = sanctionsData || {
    isSanctionedRnbo: false,
    rnboSanctions: [],
    isSanctionedOfac: false,
    isSanctionedEu: false,
    hasRuByIranConnection: false,
    isPep: false
  };

  const hasAnySanctions = data.isSanctionedRnbo || data.isSanctionedOfac || data.isSanctionedEu;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden p-6 space-y-6 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <div className={`p-1.5 rounded ${hasAnySanctions ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
            <Shield size={16} className={`${hasAnySanctions ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
          </div>
          Санкції та Чорні Списки
        </h3>
        <span className="text-xs text-slate-500 font-mono">RNBO / OFAC / EU</span>
      </div>

      {!hasAnySanctions && !data.hasRuByIranConnection ? (
        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Санкційні обмеження відсутні</h4>
            <p className="text-xs text-slate-400">Об'єкт відсутній у базах даних РНБО України, OFAC (США), реєстрах Євросоюзу та Великобританії. Зв'язків з РФ/РБ/Іраном не виявлено.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
            <AlertOctagon size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">ВИЯВЛЕНО САНКЦІЇ АБО ТОКСИЧНІ ЗВ'ЯЗКИ</h4>
            <p className="text-xs text-rose-300">Категорично не рекомендується співпраця. Взаємодія може призвести до вторинних санкцій або кримінальної відповідальності.</p>
          </div>
        </div>
      )}

      <div className="border border-slate-800 rounded-lg divide-y divide-slate-800 text-sm">
        <div className="p-4 flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-2">
            Реєстр РНБО України
          </span>
          <span className={`font-bold font-mono ${data.isSanctionedRnbo ? 'text-rose-500' : 'text-emerald-400'}`}>
            {data.isSanctionedRnbo ? 'ПІДСАНКЦІЙНА ОСОБА' : 'CLEAN'}
          </span>
        </div>
        
        {data.isSanctionedRnbo && data.rnboSanctions?.length > 0 && (
          <div className="p-4 bg-slate-950/50 space-y-3">
            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Деталі Указів РНБО</div>
            {data.rnboSanctions.map((s: any, i: number) => (
              <div key={i} className="text-xs border-l-2 border-rose-500 pl-3 space-y-1">
                <div className="text-white font-mono">{s.decreeNumber} від {s.decreeDate}</div>
                <div className="text-rose-400">{s.sanctionType}</div>
                <div className="text-slate-500 italic">{s.reason}</div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 flex items-center justify-between">
          <span className="text-slate-400 font-medium">OFAC SDN List (США)</span>
          <span className={`font-bold font-mono ${data.isSanctionedOfac ? 'text-rose-500' : 'text-emerald-400'}`}>
            {data.isSanctionedOfac ? 'У СПИСКУ' : 'CLEAN'}
          </span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Зв'язок з РФ / РБ / Іран</span>
          <span className={`font-bold font-mono ${data.hasRuByIranConnection ? 'text-rose-500' : 'text-emerald-400'}`}>
            {data.hasRuByIranConnection ? 'ВИЯВЛЕНО' : 'CLEAN'}
          </span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-slate-400 font-medium">База даних НАЗК (PEP-статус)</span>
          <span className={`font-mono ${data.isPep ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
            {data.isPep ? 'ВИСОКИЙ РИЗИК (PEP)' : 'Ні (Not a PEP)'}
          </span>
        </div>
      </div>
    </div>
  );
};
