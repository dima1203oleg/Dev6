/**
 * Card-Level Production Validation & Data Completeness Certification Framework v1.0
 * UI component for displaying the final certification report
 */

import React from 'react';
import { CertificationReport as CertificationReportType, CardStatus } from '../../lib/cardValidation/types';
import { CheckCircle, AlertTriangle, XCircle, Shield, TrendingUp, Database, Clock, FileText, Award } from 'lucide-react';

interface CertificationReportProps {
  report: CertificationReportType;
  onRetest?: () => void;
}

export const CertificationReport: React.FC<CertificationReportProps> = ({
  report,
  onRetest,
}) => {
  const getStatusColor = (status: CardStatus) => {
    switch (status) {
      case 'PASS':
        return 'text-emerald-400';
      case 'WARNING':
        return 'text-amber-400';
      case 'NO_DATA':
        return 'text-slate-400';
      case 'FAIL':
        return 'text-rose-400';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
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

  const isProductionReady = report.productionHealthIndex.isProductionReady;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Звіт про сертифікацію
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Контрольний профіль: РНОКПП {report.controlProfile.rnokpp}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${isProductionReady ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
              <span className={`text-sm font-bold ${isProductionReady ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isProductionReady ? 'CERTIFIED PRODUCTION READY' : 'NOT PRODUCTION READY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Final Conclusion */}
      <div className={`p-6 rounded-xl border ${isProductionReady ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
        <div className="flex items-start gap-4">
          {isProductionReady ? (
            <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
          )}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Підсумковий висновок</h3>
            <p className="text-sm text-slate-300">{report.finalConclusion}</p>
          </div>
        </div>
      </div>

      {/* Production Health Index */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Production Health Index
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Card Coverage</span>
            </div>
            <div className={`text-2xl font-black ${getHealthColor(report.productionHealthIndex.cardCoverage.overallScore)}`}>
              {report.productionHealthIndex.cardCoverage.overallScore}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {report.productionHealthIndex.cardCoverage.passedCards}/{report.productionHealthIndex.cardCoverage.totalCards} passed
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Data Freshness</span>
            </div>
            <div className={`text-2xl font-black ${getHealthColor(report.productionHealthIndex.dataFreshness)}`}>
              {Math.round(report.productionHealthIndex.dataFreshness)}%
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Source Reliability</span>
            </div>
            <div className={`text-2xl font-black ${getHealthColor(report.productionHealthIndex.sourceReliability)}`}>
              {Math.round(report.productionHealthIndex.sourceReliability)}%
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Overall Health</span>
            </div>
            <div className={`text-2xl font-black ${getHealthColor(report.productionHealthIndex.overallHealth)}`}>
              {report.productionHealthIndex.overallHealth}%
            </div>
          </div>
        </div>
      </div>

      {/* Card Coverage Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Покриття карток
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-400">{report.cardCoverageScore.passedCards}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">PASS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-amber-400">{report.cardCoverageScore.warningCards}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">WARNING</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-slate-400">{report.cardCoverageScore.noDataCards}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">NO DATA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-rose-400">{report.cardCoverageScore.failedCards}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">FAIL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Registries Used */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            Використані реєстри
          </h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {report.registriesUsed.map((registry, index) => (
              <span key={index} className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-300">
                {registry}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Errors Found */}
      {report.errorsFound.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Знайдені помилки ({report.errorsFound.length})
            </h3>
          </div>
          <div className="p-6">
            <ul className="space-y-2">
              {report.errorsFound.map((error, index) => (
                <li key={index} className="text-sm text-rose-300 flex items-start gap-2">
                  <span className="text-rose-400">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Fixes Applied */}
      {report.fixesApplied.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Виконані виправлення ({report.fixesApplied.length})
            </h3>
          </div>
          <div className="p-6">
            <ul className="space-y-2">
              {report.fixesApplied.map((fix, index) => (
                <li key={index} className="text-sm text-emerald-300 flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{fix}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>Згенеровано: {formatDate(report.generatedAt)}</span>
          </div>
          {onRetest && (
            <button
              onClick={onRetest}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Повторити тест
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
