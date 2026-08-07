/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Enterprise Card Passport UI
 */

import React, { useState } from 'react';
import { 
  Shield, Activity, Award, Lock, Zap, Database, 
  FileText, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react';
import { EnterpriseCardPassport } from '../../lib/cardValidation/enterprise/types';

interface EnterpriseCardPassportProps {
  passport: EnterpriseCardPassport;
  onClose: () => void;
}

export const EnterpriseCardPassportUI: React.FC<EnterpriseCardPassportProps> = ({ passport, onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['health', 'quality']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'DEGRADED':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'UNHEALTHY':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getCertificationBadge = () => {
    if (passport.certification.production) {
      return (
        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
          Production Ready
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase">
        Not Production Ready
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Enterprise Card Passport
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {passport.card.name} ({passport.card.id})
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getCertificationBadge()}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Card Metadata */}
      <div className="px-6 py-4 border-b border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-xs text-slate-500 block mb-1">Version</span>
          <span className="text-sm font-mono text-white">{passport.card.version}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block mb-1">Build</span>
          <span className="text-sm font-mono text-slate-300">{passport.card.build}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block mb-1">Route</span>
          <span className="text-sm text-slate-300">{passport.card.route}</span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block mb-1">Component</span>
          <span className="text-sm text-slate-300 truncate">{passport.card.component}</span>
        </div>
      </div>

      {/* Health Section */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('health')}
          className="w-full px-6 py-4 hover:bg-slate-800/50 transition-colors text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('health') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-white">Health</span>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-bold border uppercase ${getStatusColor(passport.health.status)}`}>
            {passport.health.status}
          </div>
        </button>

        {expandedSections.has('health') && (
          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/30">
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className={`text-2xl font-black ${getScoreColor(passport.health.score)}`}>
                {passport.health.score}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Score</div>
            </div>
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className="text-2xl font-black text-slate-300">
                {passport.health.latency}ms
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Latency</div>
            </div>
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className={`text-2xl font-black ${getScoreColor(passport.health.freshness)}`}>
                {passport.health.freshness}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Freshness</div>
            </div>
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className={`text-2xl font-black ${getStatusColor(passport.health.status).split(' ')[0]}`}>
                {passport.health.status === 'HEALTHY' ? '✓' : passport.health.status === 'DEGRADED' ? '!' : '✗'}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Status</div>
            </div>
          </div>
        )}
      </div>

      {/* Quality Section */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('quality')}
          className="w-full px-6 py-4 hover:bg-slate-800/50 transition-colors text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('quality') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Quality</span>
          </div>
          <div className={`text-sm font-bold ${getScoreColor(passport.quality.completeness)}`}>
            {Math.round((passport.quality.completeness + passport.quality.accuracy + passport.quality.consistency) / 3)}%
          </div>
        </button>

        {expandedSections.has('quality') && (
          <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-slate-950/30">
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className={`text-2xl font-black ${getScoreColor(passport.quality.completeness)}`}>
                {passport.quality.completeness}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Completeness</div>
            </div>
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className={`text-2xl font-black ${getScoreColor(passport.quality.accuracy)}`}>
                {passport.quality.accuracy}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Accuracy</div>
            </div>
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className={`text-2xl font-black ${getScoreColor(passport.quality.consistency)}`}>
                {passport.quality.consistency}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Consistency</div>
            </div>
          </div>
        )}
      </div>

      {/* Security Section */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('security')}
          className="w-full px-6 py-4 hover:bg-slate-800/50 transition-colors text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('security') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Lock className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-white">Security</span>
          </div>
          <div className="flex items-center gap-2">
            {passport.security.pii && (
              <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase">
                PII
              </span>
            )}
          </div>
        </button>

        {expandedSections.has('security') && (
          <div className="px-6 py-4 grid grid-cols-2 gap-4 bg-slate-950/30">
            <div className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Encryption</span>
              </div>
              <span className="text-sm font-mono text-white">{passport.security.encryption}</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Permissions</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {passport.security.permissions.map((perm, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Section */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('performance')}
          className="w-full px-6 py-4 hover:bg-slate-800/50 transition-colors text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('performance') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Performance</span>
          </div>
          <div className="text-sm font-bold text-slate-300">
            {passport.performance.api + passport.performance.db}ms
          </div>
        </button>

        {expandedSections.has('performance') && (
          <div className="px-6 py-4 grid grid-cols-4 gap-4 bg-slate-950/30">
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className="text-2xl font-black text-slate-300">
                {passport.performance.render}ms
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Render</div>
            </div>
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className="text-2xl font-black text-slate-300">
                {passport.performance.api}ms
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">API</div>
            </div>
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className="text-2xl font-black text-slate-300">
                {passport.performance.db}ms
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">DB</div>
            </div>
            <div className="text-center p-3 bg-slate-900 rounded-lg">
              <div className="text-2xl font-black text-slate-300">
                {passport.performance.graph}ms
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Graph</div>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Section */}
      <div className="border-b border-slate-800">
        <button
          onClick={() => toggleSection('evidence')}
          className="w-full px-6 py-4 hover:bg-slate-800/50 transition-colors text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('evidence') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Database className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-white">Evidence</span>
          </div>
          <div className={`text-sm font-bold ${getScoreColor(passport.evidence.confidence)}`}>
            {passport.evidence.confidence}%
          </div>
        </button>

        {expandedSections.has('evidence') && (
          <div className="px-6 py-4 bg-slate-950/30">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Sources</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {passport.evidence.sources.map((source, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Hashes</span>
                </div>
                <div className="text-xs text-slate-400">
                  {Object.keys(passport.evidence.hashes).length} fields hashed
                </div>
              </div>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Overall Confidence</span>
                <span className={`text-lg font-bold ${getScoreColor(passport.evidence.confidence)}`}>
                  {passport.evidence.confidence}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certification Section */}
      <div>
        <button
          onClick={() => toggleSection('certification')}
          className="w-full px-6 py-4 hover:bg-slate-800/50 transition-colors text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {expandedSections.has('certification') ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Certification</span>
          </div>
          {passport.certification.production ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400" />
          )}
        </button>

        {expandedSections.has('certification') && (
          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/30">
            <div className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Last Pass</span>
              </div>
              <span className="text-xs font-mono text-slate-300">
                {new Date(passport.certification.lastPass).toLocaleDateString()}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Regression</span>
              </div>
              <span className="text-xs font-mono text-slate-300">
                {new Date(passport.certification.regression).toLocaleDateString()}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Chaos Test</span>
              </div>
              <span className="text-xs font-mono text-slate-300">
                {new Date(passport.certification.chaos).toLocaleDateString()}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400 uppercase tracking-wider">Production</span>
              </div>
              <span className={`text-sm font-bold ${passport.certification.production ? 'text-emerald-400' : 'text-rose-400'}`}>
                {passport.certification.production ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
