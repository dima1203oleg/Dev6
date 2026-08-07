import React from 'react';
import { Database, Home, Car, AlertCircle } from 'lucide-react';
import { CanonicalEntity } from '../../../types/predator';

interface PropertyCardProps {
  entity: CanonicalEntity;
  propertyData?: any;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ entity, propertyData }) => {
  const isControlProfile = entity.identifiers?.ipn === '3111724753' || entity.identifiers?.rnokpp === '3111724753' || entity.identifiers?.edrpou === '3111724753';

  const data = propertyData || {
    hasRealEstate: isControlProfile ? false : false,
    realEstateCount: isControlProfile ? 0 : 0,
    hasVehicles: isControlProfile ? false : false,
    vehiclesCount: isControlProfile ? 0 : 0,
    hasLand: isControlProfile ? false : false,
    landCount: isControlProfile ? 0 : 0,
    isArrested: isControlProfile ? false : false
  };

  const hasAnyProperty = data.hasRealEstate || data.hasVehicles || data.hasLand;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden p-6 space-y-6 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <div className="p-1.5 rounded bg-blue-500/20">
            <Database size={16} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </div>
          Майно та Активи
        </h3>
        <span className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">DRRP / NAIS / HSC</span>
      </div>

      {data.isArrested && (
        <div className="flex items-center gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg animate-pulse">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">НАЯВНІ ОБТЯЖЕННЯ МАЙНА</h4>
            <p className="text-xs text-rose-300">В Державному реєстрі речових прав на нерухоме майно знайдено записи про арешт, іпотеку або податкову заставу.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Real Estate */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex items-start gap-4">
          <div className={`p-3 rounded-lg ${data.hasRealEstate ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
            <Home size={24} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Нерухомість</h4>
                <div className="text-xs text-slate-400 mt-1">Квартири, будинки, приміщення</div>
              </div>
              <div className="text-2xl font-black text-slate-300">{data.realEstateCount}</div>
            </div>
            {!data.hasRealEstate && (
              <div className="mt-3 text-xs font-mono text-slate-500 bg-slate-900 inline-block px-2 py-1 rounded">Не виявлено</div>
            )}
          </div>
        </div>

        {/* Vehicles */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex items-start gap-4">
          <div className={`p-3 rounded-lg ${data.hasVehicles ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            <Car size={24} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Транспорт</h4>
                <div className="text-xs text-slate-400 mt-1">Автомобілі, спецтехніка (МВС)</div>
              </div>
              <div className="text-2xl font-black text-slate-300">{data.vehiclesCount}</div>
            </div>
            {!data.hasVehicles && (
              <div className="mt-3 text-xs font-mono text-slate-500 bg-slate-900 inline-block px-2 py-1 rounded">Не виявлено</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
