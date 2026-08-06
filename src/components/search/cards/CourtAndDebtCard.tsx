import React from 'react';
import { CourtCaseData, Fact } from '../../../types/search';
import { FactRow } from '../../ui/FactRow';
import { Landmark } from 'lucide-react';

interface CourtAndDebtCardProps {
  cases: CourtCaseData[];
  onViewEvidence: (fact: Fact) => void;
}

export const CourtAndDebtCard: React.FC<CourtAndDebtCardProps> = ({ cases, onViewEvidence }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Landmark className="text-indigo-400" />
          Судові справи та борги
        </h2>
      </div>
      <div className="p-0">
        {cases.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {cases.map((courtCase, idx) => (
              <div key={idx} className="p-6 space-y-2">
                <FactRow label="Номер справи" fact={courtCase.caseNumber} onViewEvidence={onViewEvidence} />
                <FactRow label="Стадія" fact={courtCase.stage} onViewEvidence={onViewEvidence} />
                <FactRow label="Сторони" fact={courtCase.parties} onViewEvidence={onViewEvidence} />
                <FactRow label="Тип провадження" fact={courtCase.proceedingType} onViewEvidence={onViewEvidence} />
                <FactRow label="Дата" fact={courtCase.date} onViewEvidence={onViewEvidence} />
                {courtCase.debtAmount && (
                  <FactRow label="Сума боргу" fact={courtCase.debtAmount} onViewEvidence={onViewEvidence} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-sm">
            Судових справ та боргів не знайдено.
          </div>
        )}
      </div>
    </div>
  );
};
