import { useState, useEffect } from "react";
import { Server, CheckCircle2, AlertTriangle, Database, RefreshCw, Network, Layers, ShieldCheck, ShieldAlert } from "lucide-react";
import { DataApiService } from "../services/dataApi";
import { motion } from "motion/react";

export default function RegistryHealthDashboard() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await DataApiService.getSystemSources();
      if (res.ok && res.data?.sources) {
        setSources(res.data.sources);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
    const interval = setInterval(fetchSources, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalRecords = sources.reduce((acc, curr) => acc + (curr.recordsCount || 0), 0);
  const healthyCount = sources.filter(s => s.status === 'HEALTHY').length;
  const degradedCount = sources.filter(s => s.status === 'DEGRADED').length;

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-950/50">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Server className="text-cyan-400 w-8 h-8" />
            REGISTRY CONTROL CENTER
          </h2>
          <p className="text-slate-400 mt-2 text-lg">
            PREDATOR Health Monitoring & Autonomous Discovery Loop
          </p>
        </div>
        <button 
          onClick={fetchSources} 
          className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-xl flex items-center gap-2 text-slate-200 transition-all shadow-xl shadow-black/20"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} /> 
          Синхронізувати стан
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
          <Database className="text-cyan-400 w-10 h-10 mb-4" />
          <div className="text-4xl font-bold text-slate-100 font-mono tracking-tight">{sources.length}</div>
          <div className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wider">Підключено джерел</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/60 backdrop-blur-md border border-emerald-900/30 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          <CheckCircle2 className="text-emerald-400 w-10 h-10 mb-4" />
          <div className="text-4xl font-bold text-emerald-100 font-mono tracking-tight">{healthyCount}</div>
          <div className="text-sm font-medium text-emerald-400/70 mt-1 uppercase tracking-wider">Активних (Healthy)</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/60 backdrop-blur-md border border-amber-900/30 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <AlertTriangle className="text-amber-400 w-10 h-10 mb-4" />
          <div className="text-4xl font-bold text-amber-100 font-mono tracking-tight">{degradedCount}</div>
          <div className="text-sm font-medium text-amber-400/70 mt-1 uppercase tracking-wider">Деградованих</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-slate-900/60 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
          <Layers className="text-indigo-400 w-10 h-10 mb-4" />
          <div className="text-4xl font-bold text-slate-100 font-mono tracking-tight">{(totalRecords / 1000000).toFixed(1)}M</div>
          <div className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wider">Записів в індексі</div>
        </motion.div>
      </div>

      <div className="bg-[#0b1329]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2 text-lg">
            <Network className="text-cyan-500 w-5 h-5" />
            LIVE CONNECTOR STATUS (ALL {sources.length} MODULES)
          </h3>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              API Gateway Active
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold tracking-wider">STATUS</th>
                <th className="p-4 font-semibold tracking-wider">SOURCE MODULE</th>
                <th className="p-4 font-semibold tracking-wider">AUTHORITY / PROVIDER</th>
                <th className="p-4 font-semibold tracking-wider">FORMAT & PROTOCOL</th>
                <th className="p-4 font-semibold tracking-wider text-right">RECORDS COUNT</th>
                <th className="p-4 font-semibold tracking-wider text-right">LAST SYNC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sources.map((source, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: idx * 0.02 }}
                  key={source.id} 
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="p-4">
                    {source.status === 'HEALTHY' ? (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline-block">Healthy</span>
                      </div>
                    ) : source.status === 'DEGRADED' ? (
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline-block">Degraded</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-400">
                        <ShieldAlert className="w-5 h-5" />
                        <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline-block">Issue</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {source.name}
                  </td>
                  <td className="p-4 text-slate-400 text-xs">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      {source.authority}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-slate-900 border border-slate-700/50 text-slate-300 rounded text-xs font-mono">
                      {source.format}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-300 group-hover:text-cyan-300 transition-colors">
                    {source.recordsCount.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-slate-400 text-xs font-mono">
                    {source.lastAttemptAt ? new Date(source.lastAttemptAt).toISOString().replace('T', ' ').substring(0, 19) : 'NEVER'}
                  </td>
                </motion.tr>
              ))}
              {sources.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    No registry sources found. Check API connection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
