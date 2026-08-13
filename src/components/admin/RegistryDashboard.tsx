import React, { useEffect, useState } from 'react';
import {
  Database, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Search, Filter, Shield,
  Activity, Zap, Globe, FileText
} from 'lucide-react';

interface RegistrySource {
  id: string;
  name: string;
  category: string;
  owner: string;
  isFree: boolean;
  isAutomatic: boolean;
  searchFields: string[];
  provides: string;
  url: string;
}

interface CatalogStats {
  total: number;
  free: number;
  automatic: number;
  categories: number;
  categoryList: string[];
}

interface ConnectorStats {
  total: number;
  registered: number;
  certified: number;
  live: number;
  degraded: number;
  offline: number;
  notProbed: number;
}

interface ProbeResult {
  ok: boolean;
  latencyMs: number;
  recordsFound: number;
  error?: string;
  probeAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  EDR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  TAX: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  COURT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ENFORCEMENT: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  SANCTIONS: 'bg-red-500/20 text-red-400 border-red-500/30',
  PROPERTY: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  LAND: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  PROCUREMENT: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  TRANSPORT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  LICENSE: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  FINANCE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DECLARATIONS: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  INTERNATIONAL: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  BUDGET: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

function getCategoryStyle(cat: string): string {
  return CATEGORY_COLORS[cat] || 'bg-slate-700/40 text-slate-400 border-slate-600/30';
}

interface MasterTestResult {
  sourceId: string;
  sourceName: string;
  testCode: string;
  timestamp: string;
  success: boolean;
  score: string;
  passedCount: number;
  totalTests: number;
  checks: Record<string, {
    passed: boolean;
    name: string;
    error?: string;
  }>;
}

interface MasterTestReport {
  runId: string;
  timestamp: string;
  testCode: string;
  summary: {
    totalSources: number;
    testedSources: number;
    passedSources: number;
    failedSources: number;
  };
  results: MasterTestResult[];
}

export const RegistryDashboard: React.FC = () => {
  const [sources, setSources] = useState<RegistrySource[]>([]);
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(null);
  const [connectorStats, setConnectorStats] = useState<ConnectorStats | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, ProbeResult>>({});
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [testCode, setTestCode] = useState('14360570');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [probingId, setProbingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'catalog' | 'master'>('catalog');
  const [masterReport, setMasterReport] = useState<MasterTestReport | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catalogRes, statsRes] = await Promise.all([
        fetch('/api/v1/registry/catalog'),
        fetch('/api/v1/registry/stats'),
      ]);
      const catalog = await catalogRes.json();
      const stats = await statsRes.json();

      if (catalog.ok) {
        setSources(catalog.sources || []);
        setCatalogStats(catalog.stats);
      }
      if (stats.ok) {
        setConnectorStats(stats.connectors);
      }
    } catch (err) {
      console.error('Failed to fetch registry data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterReport = async () => {
    setLoadingMaster(true);
    try {
      const res = await fetch('/api/v1/system/master-test-report');
      const data = await res.json();
      if (data.ok) {
        setMasterReport(data.report);
      }
    } catch (err) {
      console.error('Failed to fetch master test report:', err);
    } finally {
      setLoadingMaster(false);
    }
  };

  const runProbeAll = async () => {
    if (!testCode) return;
    setProbing(true);
    try {
      const res = await fetch('/api/v1/registry/probe-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCode }),
      });
      const data = await res.json();
      if (data.ok) {
        setProbeResults(data.results || {});
      }
    } catch (err) {
      console.error('Probe failed:', err);
    } finally {
      setProbing(false);
    }
  };

  const runProbeOne = async (sourceId: string) => {
    setProbingId(sourceId);
    try {
      const res = await fetch('/api/v1/registry/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, testCode }),
      });
      const data = await res.json();
      if (data.ok) {
        setProbeResults(prev => ({ ...prev, [sourceId]: data.result }));
      }
    } catch (err) {
      console.error('Single probe failed:', err);
    } finally {
      setProbingId(null);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchMasterReport();
  }, []);

  const categories = ['ALL', ...Array.from(new Set(sources.map(s => s.category))).sort()];

  const filteredSources = sources.filter(s => {
    const matchSearch = !searchFilter ||
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.owner.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.provides.toLowerCase().includes(searchFilter.toLowerCase());
    const matchCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const liveCount = (Object.values(probeResults) as ProbeResult[]).filter(r => r.ok).length;
  const totalProbed = Object.keys(probeResults).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Database className="text-cyan-400" size={28} />
            PREDATOR Registry Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Production Connector & Compatibility Matrix — Spec v1.0
          </p>
        </div>
        <button
          onClick={() => { fetchData(); fetchMasterReport(); }}
          disabled={loading || loadingMaster}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={14} className={(loading || loadingMaster) ? 'animate-spin' : ''} />
          Оновити
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'catalog' 
              ? 'border-cyan-400 text-cyan-400' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Source Catalog
        </button>
        <button
          onClick={() => setActiveTab('master')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'master' 
              ? 'border-purple-400 text-purple-400' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Shield size={14} />
          Master Test Report
        </button>
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <StatCard label="Всього реєстрів" value={catalogStats?.total ?? '…'} color="text-white" icon={<Globe size={16} />} />
            <StatCard label="Безкоштовні" value={catalogStats?.free ?? '…'} color="text-emerald-400" icon={<CheckCircle size={16} />} />
            <StatCard label="Автоматичні" value={catalogStats?.automatic ?? '…'} color="text-cyan-400" icon={<Zap size={16} />} />
            <StatCard label="Категорії" value={catalogStats?.categories ?? '…'} color="text-blue-400" icon={<Filter size={16} />} />
            <StatCard label="Конекторів" value={connectorStats?.registered ?? '…'} color="text-violet-400" icon={<Activity size={16} />} />
            {totalProbed > 0 && <>
              <StatCard label="LIVE (проб.)" value={`${liveCount}/${totalProbed}`} color="text-emerald-400" icon={<CheckCircle size={16} />} />
              <StatCard label="OFFLINE" value={totalProbed - liveCount} color="text-rose-400" icon={<XCircle size={16} />} />
            </>}
          </div>

          {/* Live Probe Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-cyan-400" />
              Live Probe — Spec §5 Stage 5
            </h2>
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                value={testCode}
                onChange={e => setTestCode(e.target.value)}
                placeholder="ЄДРПОУ або ІПН для тесту"
                className="flex-1 min-w-48 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={runProbeAll}
                disabled={probing || !testCode}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-colors"
              >
                {probing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                {probing ? 'Тестується…' : 'Probe All Sources'}
              </button>
            </div>
            {totalProbed > 0 && (
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-emerald-400">✓ LIVE: {liveCount}</span>
                <span className="text-rose-400">✗ OFFLINE: {totalProbed - liveCount}</span>
                <span className="text-slate-400">TOTAL PROBED: {totalProbed}</span>
                <span className="text-amber-400">COVERAGE: {Math.round(liveCount / totalProbed * 100)}%</span>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Пошук за назвою, ЄДРПОУ, власником..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-600"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-600"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="text-xs text-slate-500">
            Показано: {filteredSources.length} з {sources.length} джерел
          </div>

          {/* Source Table */}
          {loading ? (
            <div className="text-center py-16 text-slate-500">
              <RefreshCw size={32} className="animate-spin mx-auto mb-4" />
              Завантаження каталогу реєстрів...
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold">Реєстр / Джерело</th>
                      <th className="text-left px-4 py-3 font-bold">Категорія</th>
                      <th className="text-left px-4 py-3 font-bold">Власник</th>
                      <th className="text-left px-4 py-3 font-bold">Ідентифікатори</th>
                      <th className="text-left px-4 py-3 font-bold">Надає</th>
                      <th className="text-left px-4 py-3 font-bold">Статус</th>
                      <th className="text-left px-4 py-3 font-bold">Дія</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredSources.map(src => {
                      const probe = probeResults[src.id];
                      return (
                        <tr key={src.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{src.name}</div>
                            <div className="text-slate-500 font-mono text-[10px] mt-0.5">{src.id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getCategoryStyle(src.category)}`}>
                              {src.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 max-w-32 truncate">{src.owner}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {src.searchFields.map(f => (
                                <span key={f} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 max-w-48 text-[11px]">{src.provides}</td>
                          <td className="px-4 py-3">
                            {probe ? (
                              <div className="space-y-0.5">
                                <div className={`flex items-center gap-1 font-bold ${probe.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {probe.ok ? <CheckCircle size={11} /> : <XCircle size={11} />}
                                  {probe.ok ? 'LIVE' : 'OFFLINE'}
                                </div>
                                {probe.ok && (
                                  <div className="text-slate-500 font-mono">
                                    {probe.latencyMs}ms · {probe.recordsFound} records
                                  </div>
                                )}
                                {probe.error && (
                                  <div className="text-rose-600 truncate max-w-32" title={probe.error}>
                                    {probe.error.slice(0, 30)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 font-mono">NOT PROBED</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => runProbeOne(src.id)}
                              disabled={probingId === src.id || !testCode}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {probingId === src.id
                                ? <RefreshCw size={10} className="animate-spin" />
                                : <Zap size={10} />}
                              Probe
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'master' && (
        <div className="space-y-6">
          {loadingMaster ? (
            <div className="text-center py-16 text-slate-500">
              <RefreshCw size={32} className="animate-spin mx-auto mb-4" />
              Завантаження звіту...
            </div>
          ) : !masterReport ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              <AlertTriangle size={32} className="mx-auto mb-4 text-amber-500" />
              Звіт не знайдено. Запустіть Master Test Suite (npm run test:correctness)
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Джерел протестовано" value={`${masterReport.summary.testedSources}/${masterReport.summary.totalSources}`} color="text-white" icon={<Globe size={16} />} />
                <StatCard label="Успішних" value={masterReport.summary.passedSources} color="text-emerald-400" icon={<CheckCircle size={16} />} />
                <StatCard label="Провалених" value={masterReport.summary.failedSources} color="text-rose-400" icon={<XCircle size={16} />} />
                <StatCard label="Run ID" value={masterReport.runId.split('-')[0]} color="text-purple-400" icon={<FileText size={16} />} />
              </div>

              {/* Master Test Results Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold">Джерело</th>
                        <th className="text-center px-4 py-3 font-bold">Статус</th>
                        <th className="text-center px-4 py-3 font-bold">Оцінка</th>
                        <th className="text-left px-4 py-3 font-bold">Деталі перевірок (17 Критеріїв)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {masterReport.results.map((res) => (
                        <tr key={res.sourceId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 align-top min-w-[200px]">
                            <div className="font-semibold text-white">{res.sourceName}</div>
                            <div className="text-slate-500 font-mono text-[10px] mt-0.5">{res.sourceId}</div>
                            <div className="text-slate-600 font-mono text-[10px] mt-1">Test Code: {res.testCode}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-[10px] ${
                              res.success 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {res.success ? <CheckCircle size={10} /> : <XCircle size={10} />}
                              {res.success ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top text-center">
                            <div className="font-mono font-bold text-white">{res.passedCount} / {res.totalTests}</div>
                            <div className="text-slate-500 text-[10px]">{res.score}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2">
                              {Object.entries(res.checks).map(([testId, check]: [string, any]) => (
                                <div key={testId} className="flex items-start gap-2">
                                  <div className="mt-0.5">
                                    {check.passed ? (
                                      <CheckCircle size={12} className="text-emerald-500" />
                                    ) : (
                                      <XCircle size={12} className="text-rose-500" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-mono text-[10px] text-slate-300">
                                      <span className="font-bold text-slate-400 mr-2">{testId}</span>
                                      {check.name}
                                    </div>
                                    {!check.passed && check.error && (
                                      <div className="text-[10px] text-rose-400 mt-0.5 leading-tight">
                                        {check.error}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

function StatCard({ label, value, color, icon }: { label: string; value: any; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}

export default RegistryDashboard;
