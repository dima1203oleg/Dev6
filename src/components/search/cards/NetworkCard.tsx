import React from 'react';
import { Network, Users, GitMerge, ArrowRight } from 'lucide-react';
import { CanonicalEntity } from '../../../types/predator';
import NetworkGraph from '../../NetworkGraph';

interface NetworkCardProps {
  entity: CanonicalEntity;
  dossier: any;
  onSelectEntity?: (id: string, type: string) => void;
}

export const NetworkCard: React.FC<NetworkCardProps> = ({ entity: _entity, dossier, onSelectEntity }) => {
  // Extract related entities from the dossier if available
  const relatedPersons = dossier?.modules?.relatedPersons || [];
  const relatedCompanies = dossier?.modules?.relatedCompanies || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Network size={16} className="text-indigo-400" />
          Мережа Зв'язків
        </h3>
        <span className="text-xs text-slate-500 font-mono">HYDRA GRAPH ENGINE</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Users size={14} /> ФОП та Бенефіціари
            </h4>
            <div className="text-3xl font-black text-white">{relatedPersons.length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Виявлено фізичних осіб</p>
          </div>
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <GitMerge size={14} /> Юридичні особи
            </h4>
            <div className="text-3xl font-black text-white">{relatedCompanies.length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Виявлено компаній</p>
          </div>
          
          <button 
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            Відкрити повний граф <ArrowRight size={14} />
          </button>
        </div>
        
        <div className="lg:col-span-2 h-[300px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950 relative">
           <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg p-2 flex gap-3 text-[10px] font-mono">
             <div className="flex items-center gap-1 text-slate-300">
               <span className="w-2 h-2 rounded-full bg-blue-500"></span> Суб'єкт
             </div>
             <div className="flex items-center gap-1 text-slate-300">
               <span className="w-2 h-2 rounded-full bg-amber-500"></span> Компанія
             </div>
             <div className="flex items-center gap-1 text-slate-300">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Особа
             </div>
           </div>
           
           {/* Reusing existing graph if available, else a placeholder graphic */}
           <div className="w-full h-full flex items-center justify-center text-slate-600">
              <NetworkGraph data={{nodes: [], links: []}} onNodeClick={onSelectEntity} />
           </div>
        </div>
      </div>
    </div>
  );
};
