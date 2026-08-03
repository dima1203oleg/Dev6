import React from "react";
import { User, Landmark, Briefcase, Activity, ChevronRight, ShieldCheck } from "lucide-react";
import { CanonicalEntity } from "../types/predator";

export interface DossierCardProps {
  entity: CanonicalEntity;
  onClick: () => void;
}

export const DossierCard: React.FC<DossierCardProps> = ({ entity, onClick }) => {
  const Icon = entity.type === "PERSON" ? User : entity.type === "FOP" ? Briefcase : Landmark;

  return (
    <div
      onClick={onClick}
      className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={80} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Icon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {entity.canonicalName}
                </h3>
                {entity.confidenceScore >= 95 && <ShieldCheck size={16} className="text-green-500" />}
              </div>
              <div className="text-xs text-slate-500 font-mono tracking-widest uppercase mt-1">
                {entity.type} • {entity.sourcesCount} Sources
              </div>
            </div>
          </div>
          <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-mono text-slate-400 uppercase tracking-widest border border-slate-700">
            ID MATCH: {entity.confidenceScore}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {entity.identifiers.edrpou && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">ЄДРПОУ</span>
              <span className="text-sm text-slate-300 font-mono">{entity.identifiers.edrpou}</span>
            </div>
          )}
          {entity.identifiers.ipn && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">РНОКПП</span>
              <span className="text-sm text-slate-300 font-mono">{entity.identifiers.ipn}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity size={12} className="text-blue-400" />
            <span>Identity Confirmed</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400 text-xs font-bold group-hover:gap-2 transition-all">
            VIEW DOSSIER
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DossierCard;
