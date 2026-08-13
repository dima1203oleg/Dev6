import React from 'react';
import { MapPin, Database, LandPlot } from 'lucide-react';

interface LandCardProps {
  entity: any;
  landData?: any;
}

export const LandCard: React.FC<LandCardProps> = ({ entity: _entity, landData }) => {
  const plots = landData?.plots || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <LandPlot size={16} className="text-lime-400" />
          Земельний кадастр (Держгеокадастр)
        </h3>
      </div>

      {plots.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Записів про земельні ділянки не знайдено.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plots.map((p: any, i: number) => (
            <div key={i} className="border border-slate-800 rounded-xl p-4 bg-slate-950/50 space-y-2 text-sm">
              <div className="text-white font-mono font-bold flex items-center gap-2">
                <Database size={14} className="text-lime-400"/> {p.cadastralNumber}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Площа</div>
                  <div className="text-slate-300">{p.area} га</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Тип власності</div>
                  <div className="text-slate-300">{p.ownershipType}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Місцезнаходження</div>
                  <div className="text-slate-300 flex items-start gap-1">
                    <MapPin size={12} className="mt-0.5 shrink-0" />
                    {p.location}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500 uppercase tracking-widest text-[10px]">Цільове призначення</div>
                  <div className="text-slate-300">{p.purpose}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
