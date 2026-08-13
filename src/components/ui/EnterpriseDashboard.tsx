/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Main Enterprise Dashboard UI
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, TrendingUp, AlertTriangle, CheckCircle, 
  Database, FileText, Play, Pause, RefreshCw
} from 'lucide-react';
import { LiveCardAudit } from '../../lib/cardValidation/enterprise/types';
import { LivePreviewAuditEngine } from '../../lib/cardValidation/enterprise/livePreviewAudit';
import { LiveMonitoringEngine } from '../../lib/cardValidation/enterprise/liveMonitoring';

interface EnterpriseDashboardProps {
  onCardClick?: (cardId: string) => void;
}

export const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ onCardClick }) => {
  const [liveAudits, setLiveAudits] = useState<LiveCardAudit[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      // In production, this would load actual data
      const audits = LivePreviewAuditEngine.getAllLiveAudits();
      const health = LivePreviewAuditEngine.getSystemHealth();
      const status = LiveMonitoringEngine.getStatus();
      
      setLiveAudits(audits);
      setSystemHealth(health);
      setMonitoringStatus(status);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleMonitoring = () => {
    if (monitoringStatus?.enabled) {
      LiveMonitoringEngine.stopMonitoring();
    } else {
      LiveMonitoringEngine.startMonitoring({
        enabled: true,
        intervalMinutes: 15,
        alertThreshold: 80,
        autoRemediate: false,
        notifyChannels: [],
      });
    }
    loadDashboardData();
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-rose-500/10 border-rose-500/30';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'DEGRADING':
        return <TrendingUp className="w-4 h-4 text-rose-400 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            Enterprise Certification Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Continuous Production Certification Platform v2.0
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={toggleMonitoring}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              monitoringStatus?.enabled
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {monitoringStatus?.enabled ? (
              <>
                <Pause className="w-4 h-4" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Monitoring
              </>
            )}
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border ${getHealthBg(systemHealth.overallHealth)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Overall Health</span>
              <Shield className="w-4 h-4 text-slate-500" />
            </div>
            <div className={`text-3xl font-black ${getHealthColor(systemHealth.overallHealth)}`}>
              {systemHealth.overallHealth}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {systemHealth.totalCards} cards monitored
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Healthy</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {systemHealth.healthyCards}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {Math.round((systemHealth.healthyCards / systemHealth.totalCards) * 100)}% of total
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Degraded</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-400">
              {systemHealth.degradedCards}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Requires attention
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Unhealthy</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-3xl font-black text-rose-400">
              {systemHealth.unhealthyCards}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Critical issues
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Status */}
      {monitoringStatus && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${monitoringStatus.enabled ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                <Activity className={`w-5 h-5 ${monitoringStatus.enabled ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Continuous Monitoring</h3>
                <p className="text-xs text-slate-400">
                  {monitoringStatus.enabled ? 'Active' : 'Inactive'} • {monitoringStatus.interval}min interval
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-lg font-bold ${getHealthColor(monitoringStatus.currentHealth || 0)}`}>
                  {monitoringStatus.currentHealth || 0}%
                </div>
                <div className="text-xs text-slate-400">Current Health</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  {getTrendIcon(monitoringStatus.trend)}
                  <span className="text-sm font-medium text-slate-300">{monitoringStatus.trend}</span>
                </div>
                <div className="text-xs text-slate-400">Trend</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-300">
                  {monitoringStatus.activeAlerts}
                </div>
                <div className="text-xs text-slate-400">Active Alerts</div>
              </div>
              {monitoringStatus.lastCheck && (
                <div className="text-center">
                  <div className="text-xs font-mono text-slate-400">
                    {new Date(monitoringStatus.lastCheck).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-slate-500">Last Check</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Card Audits */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Live Card Audits
          </h2>
          <span className="text-xs text-slate-400">{liveAudits.length} cards</span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {liveAudits.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No card audits available. Run certification to generate audits.
            </div>
          ) : (
            liveAudits.map((audit) => (
              <button
                key={audit.cardId}
                onClick={() => onCardClick?.(audit.cardId)}
                className="w-full px-6 py-4 hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getHealthBg(audit.health)}`}>
                      <Shield className={`w-5 h-5 ${getHealthColor(audit.health)}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{audit.name}</h3>
                      <p className="text-xs text-slate-400">{audit.cardId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getHealthColor(audit.health)}`}>
                        {audit.health}%
                      </div>
                      <div className="text-xs text-slate-400">Health</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">
                        {audit.coverage}%
                      </div>
                      <div className="text-xs text-slate-400">Coverage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-400">
                        {audit.evidence}%
                      </div>
                      <div className="text-xs text-slate-400">Evidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-300">
                        {audit.sources}
                      </div>
                      <div className="text-xs text-slate-400">Sources</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-400">
                        {audit.latency}ms
                      </div>
                      <div className="text-xs text-slate-400">Latency</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(audit.trend)}
                        <span className="text-sm font-medium text-slate-300">{audit.trend}</span>
                      </div>
                      <div className="text-xs text-slate-400">Trend</div>
                    </div>
                    <div className="text-slate-500">
                      <span className="text-xs">→</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Data Lineage</h3>
              <p className="text-xs text-slate-400">Explore data flow</p>
            </div>
          </div>
        </button>

        <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cross-Registry</h3>
              <p className="text-xs text-slate-400">Check consistency</p>
            </div>
          </div>
        </button>

        <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Card Passports</h3>
              <p className="text-xs text-slate-400">View details</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
