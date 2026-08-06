import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, Activity, RefreshCw } from 'lucide-react';

interface SourceMatrixRow {
  sourceId: string;
  sourceName: string;
  category: string;
  accessLevel: string;
  certificationStatus: string;
  sourceStatus: string;
  compatibilityStatus: string;
  isProductionGateOpen: boolean;
  rateLimitReqPerMin: number;
  lastProbe: string;
}

export const SourceRegistryDashboard: React.FC = () => {
  const [sources, setSources] = useState<SourceMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [probingId, setProbingId] = useState<string | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    try {
      // Assuming API endpoint is mapped to /api/v1/admin/sources in server setup
      const res = await fetch('/api/v1/admin/sources');
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
      }
    } catch (e) {
      console.error('Failed to fetch source matrix', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const runProbe = async (sourceId: string) => {
    setProbingId(sourceId);
    try {
      const res = await fetch('/api/v1/admin/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, testIdentifier: 'test' }),
      });
      await res.json();
      await fetchSources(); // Refresh after probe
    } catch (e) {
      console.error(`Probe failed for ${sourceId}`, e);
    }
    setProbingId(null);
  };

  const renderStatusBadge = (status: string, type: 'health' | 'cert') => {
    let color = 'bg-gray-100 text-gray-800 border-gray-200';
    let icon = null;

    if (status === 'CERTIFIED' || status === 'LIVE' || status === 'COMPATIBLE') {
      color = 'bg-green-100 text-green-800 border-green-200';
      icon = <CheckCircle className="w-3 h-3 mr-1" />;
    } else if (status === 'FAILED' || status === 'OFFLINE' || status === 'INCOMPATIBLE') {
      color = 'bg-red-100 text-red-800 border-red-200';
      icon = <XCircle className="w-3 h-3 mr-1" />;
    } else if (status === 'DEGRADED' || status === 'SCHEMA_DRIFT' || status === 'PARTIALLY_COMPATIBLE') {
      color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      icon = <AlertTriangle className="w-3 h-3 mr-1" />;
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
        {icon}
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <ShieldCheck className="w-6 h-6 mr-2 text-indigo-600" />
            MASTER SOURCE MATRIX
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Canonical registry of all data sources, connectors, and their production gates.
          </p>
        </div>
        <button
          onClick={fetchSources}
          className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name & Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Access</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Health</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Certification</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Prod Gate</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sources.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No sources loaded. Run connector factory bootstrap.
                </td>
              </tr>
            )}
            {sources.map((src) => (
              <tr key={src.sourceId} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-600">
                  {src.sourceId}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">{src.sourceName}</div>
                  <div className="text-xs text-slate-500">{src.category}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs">{src.accessLevel}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {renderStatusBadge(src.sourceStatus, 'health')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {renderStatusBadge(src.certificationStatus, 'cert')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {src.isProductionGateOpen ? (
                    <ShieldCheck className="w-5 h-5 text-green-500 mx-auto" title="Production Enabled" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red-500 mx-auto" title="Production Blocked" />
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => runProbe(src.sourceId)}
                    disabled={probingId === src.sourceId}
                    className="inline-flex items-center px-2.5 py-1.5 border border-indigo-200 text-xs font-medium rounded text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none disabled:opacity-50"
                  >
                    {probingId === src.sourceId ? (
                      <Activity className="w-4 h-4 mr-1 animate-pulse" />
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
                    Run QA Matrix
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
