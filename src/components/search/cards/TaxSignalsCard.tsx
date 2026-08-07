import React from 'react';
import { AlertCircle, CheckCircle2, Receipt, Scale, FileText, Banknote } from 'lucide-react';
import { CanonicalEntity } from '../../../types/predator';

interface TaxSignalsCardProps {
  entity: CanonicalEntity;
  taxData?: any; // The TaxStatus data if available from the backend
}

export const TaxSignalsCard: React.FC<TaxSignalsCardProps> = ({ entity, taxData }) => {
  // Use real data if available, otherwise fallback to safe empty defaults
  const data = taxData || {
    isVatPayer: false,
    vatPayerNumber: entity.identifiers?.ipn || entity.identifiers?.edrpou || 'НЕВІДОМО',
    hasTaxDebt: false,
    debtAmountUah: 0,
    taxInspectionOffice: 'Дані відсутні',
    lastVerifiedAt: new Date().toISOString(),
    debtType: null
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(amount);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden p-6 space-y-6 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <div className="p-1.5 rounded bg-amber-500/20">
            <Receipt size={16} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          </div>
          Податкові сигнали
        </h3>
        <span className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">STATE TAX SERVICE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Debt Status */}
        <div className={`p-4 rounded-xl border ${data.hasTaxDebt ? 'bg-rose-950/40 border-rose-500/40 shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]' : 'bg-emerald-950/40 border-emerald-500/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'} flex flex-col justify-between`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-mono uppercase tracking-widest ${data.hasTaxDebt ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]'}`}>
              Податковий борг
            </span>
            {data.hasTaxDebt ? <AlertCircle size={18} className="text-rose-400" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {data.hasTaxDebt ? formatCurrency(data.debtAmountUah) : 'ВІДСУТНІЙ'}
            </div>
            {data.hasTaxDebt && (
              <div className="text-xs text-rose-300 mt-1 font-medium">{data.debtType}</div>
            )}
          </div>
        </div>

        {/* VAT Status */}
        <div className={`p-4 rounded-xl border ${data.isVatPayer ? 'bg-blue-950/40 border-blue-500/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' : 'bg-slate-900 border-slate-700/50'} flex flex-col justify-between`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-mono uppercase tracking-widest ${data.isVatPayer ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'text-slate-500'}`}>
              Платник ПДВ
            </span>
            <FileText size={18} className={data.isVatPayer ? 'text-blue-400' : 'text-slate-600'} />
          </div>
          <div>
            <div className={`text-lg font-bold ${data.isVatPayer ? 'text-white' : 'text-slate-500'}`}>
              {data.isVatPayer ? 'АКТИВНИЙ' : 'НЕ ЗАРЕЄСТРОВАНО'}
            </div>
            {data.isVatPayer && (
              <div className="text-xs font-mono text-slate-400 mt-1 select-all">ІПН: {data.vatPayerNumber}</div>
            )}
          </div>
        </div>

        {/* Tax Office */}
        <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex flex-col justify-between md:col-span-1 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Орган ДПС
            </span>
            <Banknote size={18} className="text-slate-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-white uppercase leading-snug">
              {data.taxInspectionOffice}
            </div>
          </div>
        </div>
      </div>

      {data.hasTaxDebt && (
        <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-4 flex gap-3">
          <Scale className="text-rose-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-rose-400">Ризик примусового стягнення</h4>
            <p className="text-xs text-rose-300/80 mt-1">
              Наявність податкового боргу може свідчити про фінансові труднощі суб'єкта та ризик відкриття виконавчого провадження органами Міністерства юстиції.
            </p>
          </div>
        </div>
      )}

      <div className="text-[10px] text-slate-500 font-mono text-right border-t border-slate-800 pt-3 mt-4">
        ОСТАННЄ ОНОВЛЕННЯ: {new Date(data.lastVerifiedAt).toLocaleString('uk-UA')}
      </div>
    </div>
  );
};
