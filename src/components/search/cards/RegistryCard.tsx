import React from 'react';
import { RegistryCardData, Fact } from '../../../types/search';
import { FactRow } from '../../ui/FactRow';
import { Building2 } from 'lucide-react';

interface RegistryCardProps {
  data: RegistryCardData;
  onViewEvidence: (fact: Fact) => void;
}

export const RegistryCard: React.FC<RegistryCardProps> = ({ data, onViewEvidence }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="text-indigo-400" />
          Реєстраційні дані
        </h2>
      </div>
      <div className="p-6 pt-2">
        <FactRow label="Номер реєстрації" fact={data.registrationNumber} onViewEvidence={onViewEvidence} />
        <FactRow label="Дата реєстрації" fact={data.registrationDate} onViewEvidence={onViewEvidence} />
        <FactRow label="Статус" fact={data.status} onViewEvidence={onViewEvidence} />
        <FactRow label="Вид діяльності (КВЕД)" fact={data.activityCategory} onViewEvidence={onViewEvidence} />
      </div>
    </div>
  );
};
