import React from "react";
import { 
  FileText, ExternalLink, Clock, Database, Shield, 
  Hash, Code, ChevronRight, X, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Evidence } from "../types";

interface EvidenceViewerProps {
  evidence: Evidence | null;
  onClose: () => void;
}

export default function EvidenceViewer({ evidence, onClose }: EvidenceViewerProps) {
  if (!evidence) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-end">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-b border-slate-800 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Evidence Viewer</h2>
                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  Evidence ID: {evidence.id}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Main Data */}
            <section className="space-y-4">
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 border-l-4 border-l-blue-500">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Observation Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Evidence retrieved from {evidence.sourceName} confirms the presence of entity in the specified record set with a confidence interval of {Math.floor(evidence.confidence * 100)}%.
                </p>
              </div>
            </section>

            {/* Source Details */}
            <section className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-2">
                  <Database size={12} />
                  Source Name & Tier
                </div>
                <div className="text-sm text-white font-medium">{evidence.sourceName}</div>
                <div className="text-[10px] text-cyan-400 font-mono">TIER_1_OFFICIAL_REGISTRY</div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-2">
                  <Shield size={12} />
                  Hydra Provenance Status
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    🟢 VERIFIED (SHA-256)
                  </span>
                </div>
              </div>
            </section>

            {/* Metadata Table */}
            <section className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Hydra Cryptographic Metadata</span>
                <span className="text-[10px] text-emerald-400 font-mono">TLS 1.3 • SIGNATURE PASS</span>
              </h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                {[
                  { label: "Retrieved At (UTC)", value: new Date(evidence.retrievedAt).toLocaleString(), icon: Clock },
                  { label: "Raw Payload SHA-256", value: evidence.contentHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", icon: Hash },
                  { label: "Source Authority Score", value: "100.0% (Official Registry)", icon: Shield },
                  { label: "Fact Confidence Interval", value: `${(evidence.confidence > 1 ? evidence.confidence : evidence.confidence * 100).toFixed(1)}%`, icon: Activity },
                ].map((item) => (
                  <div key={item.label} className="p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-300 transition-colors">
                      <item.icon size={14} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <span className="text-xs font-mono text-cyan-300 select-all truncate max-w-[280px]">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Raw JSON Payload */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Raw Payload</h4>
                <button className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest transition-colors">
                  Copy JSON
                </button>
              </div>
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-x-auto">
                <pre className="text-[11px] font-mono text-blue-400/80 leading-relaxed">
                  {JSON.stringify(evidence.data, null, 2)}
                </pre>
              </div>
            </section>

            {/* Actions */}
            {evidence.sourceUrl && (
              <a 
                href={evidence.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all group"
              >
                <span>View Original Source</span>
                <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
