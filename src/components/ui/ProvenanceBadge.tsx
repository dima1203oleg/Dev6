import React from 'react';
import { Database, ShieldAlert, CheckCircle, Info, HelpCircle } from 'lucide-react';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';

interface ProvenanceBadgeProps {
  source: string;
  confidence?: ConfidenceLevel;
  timestamp?: string;
  className?: string;
}

export function ProvenanceBadge({ source, confidence = 'HIGH', timestamp, className = '' }: ProvenanceBadgeProps) {
  const getConfidenceColors = (level: ConfidenceLevel) => {
    switch (level) {
      case 'HIGH': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LOW': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'UNVERIFIED': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getConfidenceIcon = (level: ConfidenceLevel) => {
    switch (level) {
      case 'HIGH': return <CheckCircle size={10} />;
      case 'MEDIUM': return <Info size={10} />;
      case 'LOW': return <ShieldAlert size={10} />;
      case 'UNVERIFIED': return <HelpCircle size={10} />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[9px] font-mono tracking-wide ${getConfidenceColors(confidence)} ${className}`}>
      <Database size={10} className="opacity-70" />
      <span>{source}</span>
      {timestamp && <span className="opacity-50">| {timestamp}</span>}
    </div>
  );
}
