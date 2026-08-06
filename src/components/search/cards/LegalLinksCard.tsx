import React from 'react';
import { LegalLinkData, Fact } from '../../../types/search';
import { FactRow } from '../../ui/FactRow';
import { Network } from 'lucide-react';

interface LegalLinksCardProps {
  links: LegalLinkData[];
  onViewEvidence: (fact: Fact) => void;
}

export const LegalLinksCard: React.FC<LegalLinksCardProps> = ({ links, onViewEvidence }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Network className="text-indigo-400" />
          Юридичні зв'язки
        </h2>
      </div>
      <div className="p-0">
        {links.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {links.map((link, idx) => (
              <div key={idx} className="p-6 space-y-2">
                <FactRow label="Роль" fact={link.role} onViewEvidence={onViewEvidence} />
                <FactRow label="Пов'язаний об'єкт" fact={link.targetName} onViewEvidence={onViewEvidence} />
                <FactRow label="Дата" fact={link.date} onViewEvidence={onViewEvidence} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-sm">
            Підтверджених юридичних зв'язків не знайдено.
          </div>
        )}
      </div>
    </div>
  );
};
