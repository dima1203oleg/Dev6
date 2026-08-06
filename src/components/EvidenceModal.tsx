import React from 'react';
import { X, Fingerprint, Database, Calendar, Shield, Hash } from 'lucide-react';
import { Fact } from '../types/search';

interface EvidenceModalProps {
  fact: Fact | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ fact, onClose }) => {
  if (!fact) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Fingerprint className="text-indigo-400" />
            Криптографічний доказ факту
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Database size={14} className="text-blue-400" />
                Джерело
              </div>
              <div className="text-sm text-white font-medium">{fact.source}</div>
            </div>
            
            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-400" />
                Час отримання
              </div>
              <div className="text-sm text-white font-medium">
                {new Date(fact.retrievedAt).toLocaleString('uk-UA')}
              </div>
            </div>

            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Shield size={14} className="text-amber-400" />
                Evidence ID
              </div>
              <div className="text-sm text-white font-mono break-all">{fact.evidenceId || 'N/A'}</div>
            </div>

            <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Hash size={14} className="text-purple-400" />
                SHA-256 Hash
              </div>
              <div className="text-xs text-slate-300 font-mono break-all">
                {fact.rawPayload?.provenance?.responseHash || 'Очікує генерації...'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300">Оригінальний запис (Raw Payload)</h3>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto">
              <pre className="text-xs text-emerald-400 font-mono">
                {fact.rawPayload ? JSON.stringify(fact.rawPayload, null, 2) : 'Немає сирих даних.'}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
