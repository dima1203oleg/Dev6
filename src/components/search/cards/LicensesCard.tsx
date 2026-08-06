import React from 'react';
import { LicenseData, Fact } from '../../../types/search';
import { FactRow } from '../../ui/FactRow';
import { FileCheck } from 'lucide-react';

interface LicensesCardProps {
  licenses: LicenseData[];
  onViewEvidence: (fact: Fact) => void;
}

export const LicensesCard: React.FC<LicensesCardProps> = ({ licenses, onViewEvidence }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileCheck className="text-indigo-400" />
          Ліцензії та дозволи
        </h2>
      </div>
      <div className="p-0">
        {licenses.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {licenses.map((license, idx) => (
              <div key={idx} className="p-6 space-y-2">
                <FactRow label="Тип ліцензії" fact={license.type} onViewEvidence={onViewEvidence} />
                <FactRow label="Статус" fact={license.status} onViewEvidence={onViewEvidence} />
                <FactRow label="Орган" fact={license.authority} onViewEvidence={onViewEvidence} />
                <FactRow label="Дата видачі" fact={license.issueDate} onViewEvidence={onViewEvidence} />
                <FactRow label="Дата дії" fact={license.validUntil} onViewEvidence={onViewEvidence} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-sm">
            Дані про ліцензії та дозволи відсутні.
          </div>
        )}
      </div>
    </div>
  );
};
