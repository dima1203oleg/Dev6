/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Live Monitoring Dashboard UI
 */

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Minus, Bell, Play, Pause, RefreshCw } from 'lucide-react';
import { MonitoringAlert } from '../../lib/cardValidation/enterprise/types';
import { LiveMonitoringEngine } from '../../lib/cardValidation/enterprise/liveMonitoring';

export const LiveMonitoringDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [healthHistory, setHealthHistory] = useState<Array<{ timestamp: string; score: number }>>([]);
  const [status, setStatus] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMonitoringData();
    if (autoRefresh) {
      const interval = setInterval(loadMonitoringData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadMonitoringData = () => {
    const currentAlerts = LiveMonitoringEngine.getAlerts();
    const history = LiveMonitoringEngine.getHealthHistory();
    const currentStatus = LiveMonitoringEngine.getStatus();
    
    setAlerts(currentAlerts);
    setHealthHistory(history);
    setStatus(currentStatus);
  };

  const toggleMonitoring = () => {
    if (status?.enabled) {
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
    loadMonitoringData();
  };

  const acknowledgeAlert = (alertId: string) => {
    LiveMonitoringEngine.acknowledgeAlert(alertId);
    loadMonitoringData();
  };

  const resolveAlert = (alertId: string) => {
    LiveMonitoringEngine.resolveAlert(alertId);
    loadMonitoringData();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'LOW':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'MEDIUM':
        return <AlertTriangle className="w-4 h-4" />;
      case 'LOW':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'DEGRADING':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = unresolvedAlerts.filter(a => a.severity === 'CRITICAL');
  const highAlerts = unresolvedAlerts.filter(a => a.severity === 'HIGH');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-400" />
            Live Monitoring Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Continuous Production Certification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMonitoringData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
              autoRefresh ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Auto-Refresh
          </button>
          <button
            onClick={toggleMonitoring}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              status?.enabled ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {status?.enabled ? (
              <>
                <Pause className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Overview */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className={`p-4 rounded-xl border ${status.enabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Status</span>
              <Activity className={`w-4 h-4 ${status.enabled ? 'text-emerald-400' : 'text-slate-400'}`} />
            </div>
            <div className={`text-lg font-bold ${status.enabled ? 'text-emerald-400' : 'text-slate-400'}`}>
              {status.enabled ? 'ACTIVE' : 'INACTIVE'}
            </div>
            <div className="text-xs text-slate-400 mt-1">{status.interval}min interval</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Health</span>
              <Activity className="w-4 h-4 text-slate-500" />
            </div>
            <div className={`text-2xl font-black ${getHealthColor(status.currentHealth || 0)}`}>
              {status.currentHealth || 0}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(status.trend)}
              <span className="text-xs text-slate-400">{status.trend}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Active Alerts</span>
              <Bell className="w-4 h-4 text-slate-500" />
            </div>
            <div className={`text-2xl font-black ${status.activeAlerts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {status.activeAlerts}
            </div>
            <div className="text-xs text-slate-400 mt-1">requiring attention</div>
          </div>

          <div className={`p-4 rounded-xl border ${criticalAlerts.length > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Critical</span>
              <AlertTriangle className="w-4 h-4 text-slate-500" />
            </div>
            <div className={`text-2xl font-black ${criticalAlerts.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {criticalAlerts.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">immediate action</div>
          </div>

          <div className={`p-4 rounded-xl border ${highAlerts.length > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">High</span>
              <AlertTriangle className="w-4 h-4 text-slate-500" />
            </div>
            <div className={`text-2xl font-black ${highAlerts.length > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
              {highAlerts.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">urgent attention</div>
          </div>
        </div>
      )}

      {/* Health History Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Health History
          </h2>
        </div>
        <div className="p-6">
          {healthHistory.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No health history available. Start monitoring to collect data.
            </div>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {healthHistory.slice(-50).map((entry, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      entry.score >= 80 ? 'bg-emerald-400' : entry.score >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ height: `${entry.score}%` }}
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(entry.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Alerts
          </h2>
          <span className="text-xs text-slate-400">{unresolvedAlerts.length} unresolved</span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No alerts recorded.
            </div>
          ) : unresolvedAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-emerald-400 font-medium">All clear</p>
              <p className="text-xs text-slate-400 mt-1">No unresolved alerts</p>
            </div>
          ) : (
            unresolvedAlerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-500">{alert.type}</span>
                      </div>
                      <p className="text-sm text-white">{alert.message}</p>
                      {alert.affectedCards.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          Affected: {alert.affectedCards.join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        {formatDate(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {alert.acknowledged && (
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-700 text-slate-300 uppercase">
                        Acknowledged
                      </span>
                    )}
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1 rounded text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Last Check Info */}
      {status?.lastCheck && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Last check: {formatDate(status.lastCheck)}</span>
          </div>
          <div>
            {autoRefresh && <span>Auto-refreshing every 10s</span>}
          </div>
        </div>
      )}
    </div>
  );
};
