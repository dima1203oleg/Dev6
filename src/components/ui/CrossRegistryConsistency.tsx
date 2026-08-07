/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Cross Registry Consistency UI
 */

import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight, Scale } from 'lucide-react';
import { ConflictDetection, ConflictResolution } from '../../lib/cardValidation/enterprise/types';

interface CrossRegistryConsistencyProps {
  conflicts: ConflictDetection[];
  onClose: () => void;
}

export const CrossRegistryConsistency: React.FC<CrossRegistryConsistencyProps> = ({ conflicts, onClose }) => {
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());

  const toggleConflict = (fieldName: string) => {
    setExpandedConflicts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  };

  const getConflictsWithConflicts = () => conflicts.filter(c => c.hasConflict);
  const conflictsWithIssues = getConflictsWithConflicts();
  const totalConflicts = conflictsWithIssues.length;
  const requiresManualReview = conflictsWithIssues.filter(c => c.resolution.requiresManualReview).length;

  const getResolutionBadge = (resolution: ConflictResolution) => {
    if (resolution.requiresManualReview) {
      return (
        <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
          Manual Review
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
        Auto-Resolved
      </span>
    );
  };

  const getConflictTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'VALUE_MISMATCH': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      'TIMESTAMP_MISMATCH': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      'STRUCTURE_MISMATCH': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      'MISSING_FIELD': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    };
    return (
      <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${colors[type] || colors.VALUE_MISMATCH}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const getRegistryColor = (registry: string) => {
    const colors: Record<string, string> = {
      'EDR': 'text-emerald-400',
      'COURT': 'text-blue-400',
      'TAX': 'text-purple-400',
      'SANCTIONS': 'text-rose-400',
      'PASSPORT': 'text-amber-400',
      'NOTARY': 'text-cyan-400',
      'CKAN': 'text-pink-400',
      'OSINT': 'text-indigo-400',
      'UNKNOWN': 'text-slate-400',
    };
    return colors[registry] || colors.UNKNOWN;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            Cross Registry Consistency
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Data source conflict detection and resolution
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 border-b border-slate-800 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-black ${totalConflicts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {totalConflicts}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Conflicts</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-black ${requiresManualReview > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {requiresManualReview}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Manual Review</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-white">
            {conflicts.length}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Total Fields</div>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="divide-y divide-slate-800/50">
        {conflicts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No cross-registry data available for consistency check.
          </div>
        ) : conflictsWithIssues.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-emerald-400 font-medium">No conflicts detected</p>
            <p className="text-xs text-slate-400 mt-1">All data sources are consistent</p>
          </div>
        ) : (
          conflictsWithIssues.map((conflict) => (
            <div key={conflict.fieldName} className="border-b border-slate-800/50 last:border-0">
              <button
                onClick={() => toggleConflict(conflict.fieldName)}
                className="w-full px-6 py-4 hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedConflicts.has(conflict.fieldName) ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-medium text-white">{conflict.fieldName}</h3>
                      <p className="text-xs text-slate-400">{conflict.sources.length} sources</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getConflictTypeBadge(conflict.conflictType)}
                    {getResolutionBadge(conflict.resolution)}
                  </div>
                </div>
              </button>

              {expandedConflicts.has(conflict.fieldName) && (
                <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800">
                  {/* Resolution */}
                  <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resolution</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500">Winner:</span>
                        <span className={`text-sm font-medium ml-2 ${getRegistryColor(conflict.resolution.winner)}`}>
                          {conflict.resolution.winner}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500">Priority:</span>
                        <span className="text-sm font-mono font-bold text-white ml-2">
                          {conflict.resolution.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{conflict.resolution.reason}</p>
                  </div>

                  {/* Sources */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Data Sources</h4>
                    <div className="space-y-2">
                      {conflict.sources.map((source, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            source.registry === conflict.resolution.winner
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-slate-500" />
                              <span className={`text-sm font-medium ${getRegistryColor(source.registry)}`}>
                                {source.registry}
                              </span>
                              {source.registry === conflict.resolution.winner && (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              )}
                            </div>
                            <div className={`text-xs font-mono font-bold ${source.confidence >= 80 ? 'text-emerald-400' : source.confidence >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {source.confidence}%
                            </div>
                          </div>
                          <div className="text-xs text-slate-300 font-mono break-all">
                            {typeof source.value === 'object' ? JSON.stringify(source.value) : String(source.value)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(source.timestamp).toLocaleString('uk-UA')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Registry Priority</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">EDR (10)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="text-slate-300">COURT (9)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span className="text-slate-300">TAX (8)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span className="text-slate-300">SANCTIONS (8)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">PASSPORT (9)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300">NOTARY (7)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-slate-300">UNKNOWN (1)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
