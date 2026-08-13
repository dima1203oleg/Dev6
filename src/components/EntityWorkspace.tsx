import { Dossier } from '../types';
import DossierView from './DossierView';

interface EntityWorkspaceProps {
  dossier: Dossier | null;
  onSelectEntity: (codeOrName: string, type?: string) => void;
  onClearDossier: () => void;
  onOpenCommandBar: () => void;
}

export function EntityWorkspace({ dossier, onSelectEntity, onClearDossier, onOpenCommandBar }: EntityWorkspaceProps) {
  if (!dossier) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 relative overflow-hidden">
        
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>
        
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center relative z-10">
            <span className="text-4xl text-slate-400 dark:text-slate-500 font-light">⌘</span>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-3 z-10">
          PREDATOR Analytics
        </h2>
        
        <p className="text-lg mb-8 text-center text-slate-500 dark:text-slate-400 max-w-md z-10">
          Search entities, explore networks, and analyze risks. Press <kbd className="px-2 py-1 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded font-mono text-sm mx-1 text-slate-700 dark:text-slate-300">⌘K</kbd> to begin.
        </p>
        
        <button 
          onClick={onOpenCommandBar}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors z-10 flex items-center gap-2"
        >
          <span className="text-lg">⌘K</span> 
          <span className="opacity-50">|</span> 
          <span>Global Search</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <DossierView dossier={dossier} onSelectEntity={onSelectEntity} onBack={onClearDossier} />
    </div>
  );
}
