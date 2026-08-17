/**
 * EvidenceDrawer — Full provenance trail for a single field
 * 
 * Implements Spec Items #16, #17:
 * Shows SOURCE → RAW VALUE → NORMALIZED VALUE → ENTITY → CARD chain.
 * Includes registry name, endpoint, retrieved_at, SHA-256, parser, confidence.
 */
import React from 'react';
import { useDeviceProfile } from '../../hooks/useDeviceProfile';
import { BottomSheet } from './BottomSheet';
import { VerificationStatusBadge, VerificationStatus } from './VerificationStatusBadge';
import { 
  Database, Link2, Clock, Hash, FileCode, 
  ShieldCheck, ArrowDown, Copy
} from 'lucide-react';

export interface EvidenceData {
  fieldLabel: string;
  value: string;
  status: VerificationStatus;
  source: string;
  endpoint?: string;
  retrievedAt: string;
  rawValue?: string;
  normalizedValue?: string;
  sha256?: string;
  parser?: string;
  schemaVersion?: string;
  confidence: number;
  evidenceId?: string;
}

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceData | null;
}

const FlowStep: React.FC<{ label: string; value: string; icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={12} className="text-indigo-400" />
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
    </div>
    <p className="text-sm text-white font-mono break-all">{value}</p>
  </div>
);

const EvidenceContent: React.FC<{ evidence: EvidenceData }> = ({ evidence }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {/* Field Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">{evidence.fieldLabel}</p>
          <p className="text-xl font-bold text-white mt-1">{evidence.value}</p>
        </div>
        <VerificationStatusBadge status={evidence.status} size="lg" />
      </div>

      {/* Provenance Chain */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Ланцюг провенансу</p>
        
        <FlowStep label="Джерело" value={evidence.source} icon={Database} />
        <div className="flex justify-center"><ArrowDown size={14} className="text-slate-600" /></div>
        
        {evidence.endpoint && (
          <>
            <FlowStep label="Ендпоінт" value={evidence.endpoint} icon={Link2} />
            <div className="flex justify-center"><ArrowDown size={14} className="text-slate-600" /></div>
          </>
        )}
        
        {evidence.rawValue && (
          <>
            <FlowStep label="Сире значення" value={evidence.rawValue} icon={FileCode} />
            <div className="flex justify-center"><ArrowDown size={14} className="text-slate-600" /></div>
          </>
        )}
        
        <FlowStep label="Нормалізоване значення" value={evidence.normalizedValue || evidence.value} icon={FileCode} />
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetaCard label="Отримано" value={new Date(evidence.retrievedAt).toLocaleString('uk-UA')} icon={Clock} />
        <MetaCard label="Довіра" value={`${evidence.confidence}%`} icon={ShieldCheck} />
        {evidence.sha256 && (
          <div className="col-span-2">
            <MetaCard 
              label="SHA-256" 
              value={evidence.sha256} 
              icon={Hash} 
              mono 
              onCopy={() => copyToClipboard(evidence.sha256!)}
            />
          </div>
        )}
        {evidence.parser && <MetaCard label="Парсер" value={evidence.parser} icon={FileCode} />}
        {evidence.evidenceId && (
          <MetaCard 
            label="Evidence ID" 
            value={evidence.evidenceId} 
            icon={Database} 
            mono
            onCopy={() => copyToClipboard(evidence.evidenceId!)}
          />
        )}
      </div>
    </div>
  );
};

const MetaCard: React.FC<{ 
  label: string; value: string; icon: React.ElementType; 
  mono?: boolean; onCopy?: () => void; 
}> = ({ label, value, icon: Icon, mono, onCopy }) => (
  <div className="bg-slate-950/60 rounded-lg border border-slate-800/50 p-2.5">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon size={10} className="text-slate-500" />
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      {onCopy && (
        <button onClick={onCopy} className="ml-auto text-slate-600 hover:text-indigo-400" aria-label="Копіювати">
          <Copy size={10} />
        </button>
      )}
    </div>
    <p className={`text-xs text-slate-300 ${mono ? 'font-mono' : ''} break-all`}>{value}</p>
  </div>
);

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ isOpen, onClose, evidence }) => {
  const { isPhone } = useDeviceProfile();

  if (!evidence) return null;

  // On phone: use BottomSheet. On desktop: use side panel.
  if (isPhone) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Провенанс" height="lg">
        <EvidenceContent evidence={evidence} />
      </BottomSheet>
    );
  }

  // Desktop/Tablet: side drawer
  if (!isOpen) return null;

  return (
    <div className="desktop-evidence-rail fixed top-0 right-0 bottom-0 w-[420px] z-40 bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 overflow-y-auto shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database size={14} className="text-indigo-400" />
          Провенанс / Evidence
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-sm">
          ESC
        </button>
      </div>
      <div className="p-5">
        <EvidenceContent evidence={evidence} />
      </div>
    </div>
  );
};
