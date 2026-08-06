import React from 'react';
import { RiskData, Fact } from '../../../types/search';
import { FactRow } from '../../ui/FactRow';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface RiskCardProps {
  data: RiskData;
  onViewEvidence: (fact: Fact) => void;
}

export const RiskCard: React.FC<RiskCardProps> = ({ data, onViewEvidence }) => {
  const score = data.overallScore.value as number;
  const isHighRisk = score > 60;
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {isHighRisk ? <AlertTriangle className="text-red-400" /> : <ShieldCheck className="text-emerald-400" />}
          Оцінка ризиків
        </h2>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-6 mb-8">
           <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-slate-800" strokeWidth="10" />
               <circle 
                 cx="50" cy="50" r="45" fill="none" 
                 stroke="currentColor" 
                 className={isHighRisk ? 'text-red-500' : score > 30 ? 'text-amber-500' : 'text-emerald-500'} 
                 strokeWidth="10" 
                 strokeDasharray="283" 
                 strokeDashoffset={283 - (283 * score) / 100}
               />
             </svg>
             <div className="absolute flex flex-col items-center">
               <span className="text-2xl font-bold text-white">{score}</span>
             </div>
           </div>
           
           <div className="flex-1 space-y-2">
             <FactRow label="Загальний Risk Score" fact={data.overallScore} onViewEvidence={onViewEvidence} />
             <FactRow label="Пояснення" fact={data.explanation} onViewEvidence={onViewEvidence} />
           </div>
        </div>

        {data.factors.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Фактори ризику</h3>
            <div className="divide-y divide-slate-800/50 border border-slate-800 rounded-lg overflow-hidden">
              {data.factors.map((factor, idx) => (
                <div key={idx} className="p-4 bg-slate-950">
                  <FactRow label={`Фактор ${idx + 1}`} fact={factor} onViewEvidence={onViewEvidence} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
