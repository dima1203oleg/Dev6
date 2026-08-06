import React from 'react';
import { FamilyLinkData, Fact } from '../../../types/search';
import { FactRow } from '../../ui/FactRow';
import { Users, AlertTriangle } from 'lucide-react';

interface FamilyLinksCardProps {
  links: FamilyLinkData[];
  onViewEvidence: (fact: Fact) => void;
}

export const FamilyLinksCard: React.FC<FamilyLinksCardProps> = ({ links, onViewEvidence }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="text-indigo-400" />
          Сім'я та пов'язані особи
        </h2>
      </div>
      <div className="p-0">
        {links.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {links.map((link, idx) => (
              <div key={idx} className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-bold text-white">{link.name.value}</span>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {link.relationType.value}
                  </span>
                  {link.note === 'CONFLICT' && (
                    <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <AlertTriangle size={12} /> Конфлікт даних
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <FactRow label="Зв'язок" fact={link.relationType} onViewEvidence={onViewEvidence} />
                  <FactRow label="Особа" fact={link.name} onViewEvidence={onViewEvidence} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-sm">
            Підтверджених родинних зв'язків не знайдено.
          </div>
        )}
      </div>
    </div>
  );
};
