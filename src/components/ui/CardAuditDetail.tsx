/**
 * Card-Level Production Validation & Data Completeness Certification Framework v1.0
 * UI component for displaying detailed card audit information
 */

import React, { useState } from 'react';
import { CardValidationResult, FieldAudit, CardStatus } from '../../lib/cardValidation/types';
import { ChevronDown, ChevronRight, Hash, Database, Clock, Shield, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface CardAuditDetailProps {
  validationResult: CardValidationResult;
  onClose: () => void;
}

export const CardAuditDetail: React.FC<CardAuditDetailProps> = ({
  validationResult,
  onClose,
}) => {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleField = (fieldName: string) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: CardStatus) => {
    const styles = {
      PASS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      WARNING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      NO_DATA: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      FAIL: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    };
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getFieldStatusBadge = (status: string) => {
    const styles = {
      VERIFIED: 'bg-emerald-500/10 text-emerald-400',
      UNVERIFIED: 'bg-amber-500/10 text-amber-400',
      CONFLICT: 'bg-rose-500/10 text-rose-400',
      MISSING: 'bg-slate-500/10 text-slate-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles[status as keyof typeof styles] || styles.UNVERIFIED}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA', {
      year: 'numeric',
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
          <h2 className="text-lg font-bold text-white">{validationResult.cardName}</h2>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(validationResult.status)}
            <span className="text-sm text-slate-400">
              Заповнення: <span className="font-bold text-white">{validationResult.completionPercentage}%</span>
            </span>
            <span className="text-sm text-slate-400">
              Довіра: <span className="font-bold text-white">{validationResult.confidenceScore}%</span>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Warnings and Errors */}
      {(validationResult.warnings.length > 0 || validationResult.errors.length > 0) && (
        <div className="px-6 py-4 border-b border-slate-800 space-y-3">
          {validationResult.warnings.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-400 mb-1">Попередження</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {validationResult.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {validationResult.errors.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-400 mb-1">Помилки</h4>
                <ul className="text-xs text-slate-300 space-y-1">
                  {validationResult.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Root Cause Analysis */}
      {validationResult.rootCauseAnalysis && (
        <div className="px-6 py-4 border-b border-slate-800">
          <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Root Cause Analysis
          </h4>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Крок</span>
              <span className="text-xs font-mono text-white">{validationResult.rootCauseAnalysis.step}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Статус</span>
              <span className={`text-xs font-mono ${validationResult.rootCauseAnalysis.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {validationResult.rootCauseAnalysis.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Деталі</span>
              <span className="text-xs text-slate-300 max-w-[300px] text-right truncate">{validationResult.rootCauseAnalysis.details}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Час</span>
              <span className="text-xs font-mono text-slate-400">{formatDate(validationResult.rootCauseAnalysis.timestamp)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Field Audit */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Аудит полів ({validationResult.fields.length})
        </h4>
        
        <div className="space-y-2">
          {validationResult.fields.map((field, index) => (
            <div key={index} className="border border-slate-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleField(field.fieldName)}
                className="w-full px-4 py-3 bg-slate-950/50 hover:bg-slate-800/50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {expandedFields.has(field.fieldName) ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm font-medium text-white">{field.fieldName}</span>
                  {getFieldStatusBadge(field.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{field.source}</span>
                </div>
              </button>
              
              {expandedFields.has(field.fieldName) && (
                <div className="px-4 py-4 bg-slate-950/30 space-y-3 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Значення</span>
                      <span className="text-sm font-mono text-white break-all">{String(field.value)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Джерело</span>
                      <span className="text-sm text-slate-300">{field.source}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Реєстр</span>
                      <span className="text-sm text-slate-300">{field.registry}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Конектор</span>
                      <span className="text-sm text-slate-300">{field.connector}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Отримано</span>
                      <span className="text-xs font-mono text-slate-400">{formatDate(field.retrievedAt)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Confidence</span>
                      <span className="text-sm font-mono text-white">{field.confidenceScore}%</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Версія конектора</span>
                      <span className="text-xs font-mono text-slate-400">{field.connectorVersion}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Версія нормалізатора</span>
                      <span className="text-xs font-mono text-slate-400">{field.normalizerVersion}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">SHA-256 Hash</span>
                    <span className="text-xs font-mono text-slate-400 break-all">{field.sha256Hash}</span>
                  </div>
                  
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Raw JSON</span>
                    <pre className="text-xs font-mono bg-slate-950 p-3 rounded overflow-x-auto text-slate-300 max-h-32 overflow-y-auto">
                      {field.rawJson}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
