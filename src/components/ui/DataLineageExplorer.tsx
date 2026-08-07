/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Data Lineage Explorer UI
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Database, Code, Server, Brain, Shield, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { DataLineage, LineageNode } from '../../lib/cardValidation/enterprise/types';

interface DataLineageExplorerProps {
  lineage: DataLineage;
  onClose: () => void;
}

export const DataLineageExplorer: React.FC<DataLineageExplorerProps> = ({ lineage, onClose }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([lineage.root.id]));

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getNodeIcon = (type: LineageNode['type']) => {
    switch (type) {
      case 'FIELD':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'REGISTRY':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'CONNECTOR':
        return <Code className="w-4 h-4 text-purple-400" />;
      case 'RAW_JSON':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'NORMALIZER':
        return <Server className="w-4 h-4 text-cyan-400" />;
      case 'DATABASE':
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 'ANALYTICS':
        return <Brain className="w-4 h-4 text-pink-400" />;
      case 'RISK_ENGINE':
        return <Shield className="w-4 h-4 text-rose-400" />;
      case 'FRONTEND':
        return <FileText className="w-4 h-4 text-slate-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusIcon = (status: LineageNode['status']) => {
    switch (status) {
      case 'VALID':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'INVALID':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'CONFLICT':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStatusColor = (status: LineageNode['status']) => {
    switch (status) {
      case 'VALID':
        return 'text-emerald-400';
      case 'INVALID':
        return 'text-rose-400';
      case 'CONFLICT':
        return 'text-amber-400';
    }
  };

  const renderNode = (node: LineageNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer ${
            depth === 0 ? 'bg-slate-800/30' : ''
          }`}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <div className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <div className="shrink-0">{getNodeIcon(node.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">{node.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 uppercase">
                {node.type}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <div className="shrink-0">{getStatusIcon(node.status)}</div>
            <div className={`text-xs font-mono ${getStatusColor(node.status)}`}>
              {node.confidence}%
            </div>
            {node.hash && (
              <div className="text-xs font-mono text-slate-500 max-w-[80px] truncate">
                {node.hash.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="border-l border-slate-700 ml-4 pl-2 mt-1">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Data Lineage Explorer
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Field: {lineage.fieldName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Lineage Stats */}
      <div className="px-6 py-4 border-b border-slate-800 grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-black text-white">{lineage.totalNodes}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Total Nodes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-white">{lineage.depth}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Depth</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-black ${lineage.hasConflict ? 'text-rose-400' : 'text-emerald-400'}`}>
            {lineage.hasConflict ? 'CONFLICT' : 'CLEAN'}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Status</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-blue-400">
            {lineage.root.confidence}%
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Confidence</div>
        </div>
      </div>

      {/* Lineage Tree */}
      <div className="p-6">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          {renderNode(lineage.root)}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-300">Registry</span>
          </div>
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-300">Connector</span>
          </div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300">Normalizer</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-300">Database</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-slate-300">Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400" />
            <span className="text-xs text-slate-300">Risk Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-300">Frontend</span>
          </div>
        </div>
      </div>
    </div>
  );
};
