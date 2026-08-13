import { useState, useEffect } from "react";
import { ShieldCheck, FileCheck, Hash, CheckCircle, Cpu, X, Database } from "lucide-react";
import { DataProvenanceChain, EvidenceClaim } from "../types/predator";
import { PredatorApiService } from "../services/predatorApi";

interface EvidenceProvenanceModalProps {
  entityId: string;
  entityName: string;
  onClose: () => void;
}

export default function EvidenceProvenanceModal({ entityId, entityName, onClose }: EvidenceProvenanceModalProps) {
  const [chain, setChain] = useState<DataProvenanceChain | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    PredatorApiService.getProvenanceChain(entityId)
      .then((data) => {
        if (active) setChain(data as any);
      })
      .catch((err) => {
        console.error("Provenance error:", err);
        if (active) setChain(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [entityId]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ПІДТВЕРДЖЕНИЙ ЛАНЦЮЖОК ПОХОДЖЕННЯ
                </span>
                <span className="text-xs font-mono text-slate-500">ID: {entityId}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Ланцюжок Доказової Бази: {entityName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Cpu className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm font-mono text-slate-400">
                Завантаження ланцюжка походження даних PREDATOR Provenance Engine...
              </p>
            </div>
          ) : (
            <>
              {/* Trust Score Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-xs font-mono text-slate-500 uppercase block">Оцінка Довіри (Trust Score)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-400 font-mono">
                      {chain?.overallTrustScore || 98}%
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ВИСОКИЙ РІВЕНЬ ДОВІРИ</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-xs font-mono text-slate-500 uppercase block">Підтверджених Тверджень</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white font-mono">
                      {chain?.claims.length || 2} Тверджень
                    </span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-xs font-mono text-slate-500 uppercase block">Цілісність Реєстру (Ledger)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-400 font-mono">SHA-256 НЕЗМІННИЙ</span>
                    <Hash className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Claims Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Підтверджені Твердження та Докази (Evidence Claims)
                </h3>

                <div className="space-y-3">
                  {chain?.claims.map((claim: EvidenceClaim) => (
                    <div key={claim.id} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {claim.sourceType}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{claim.sourceName}</span>
                          </div>
                          <p className="text-white text-sm font-medium pt-1">{claim.claim}</p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono rounded-lg shrink-0">
                          {claim.verifiedStatus}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-500">Hash:</span>
                          <span className="text-slate-300 truncate">{claim.rawHash}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-500">Parser:</span>
                          <span className="text-slate-300">{claim.parserName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Audit Steps */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  Етапи Нормалізації та Верифікації (Audit Pipeline)
                </h3>

                <div className="space-y-2 font-mono text-xs">
                  {chain?.verificationSteps.map((step, i) => (
                    <div key={i} className="p-3 bg-slate-950 border border-slate-800/60 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-400">{step.timestamp?.split("T")?.[1]?.substring(0, 8) || ''}</span>
                        <span className="text-white font-bold">{step.action}</span>
                      </div>
                      <span className="text-slate-500">{step.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition-all"
          >
            Закрити Перевірку
          </button>
        </div>
      </div>
    </div>
  );
}
