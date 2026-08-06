import React from 'react';
import { AddressData, Fact } from '../../../types/search';
import { FactRow } from '../../ui/FactRow';
import { MapPin } from 'lucide-react';

interface AddressCardProps {
  addresses: AddressData[];
  onViewEvidence: (fact: Fact) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({ addresses, onViewEvidence }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin className="text-indigo-400" />
          Адреси та контакти
        </h2>
      </div>
      <div className="p-0">
        {addresses.length > 0 ? (
          <div className="divide-y divide-slate-800/50">
            {addresses.map((address, idx) => (
              <div key={idx} className="p-6 space-y-2">
                <FactRow label="Адреса" fact={address.address} onViewEvidence={onViewEvidence} />
                <FactRow label="Тип адреси" fact={address.type} onViewEvidence={onViewEvidence} />
                <FactRow label="Актуальність" fact={address.relevance} onViewEvidence={onViewEvidence} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-sm">
            Адресних даних не знайдено.
          </div>
        )}
      </div>
    </div>
  );
};
