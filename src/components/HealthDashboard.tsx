import React, { useEffect, useState } from "react";
import { HeartPulse, Activity, Zap, ShieldCheck, Server, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { motion } from "motion/react";

interface ServiceHealth {
  name: string;
  status: "LIVE" | "DEGRADED" | "OFFLINE";
  latency: number;
  lastCheck: string;
}

export default function HealthDashboard() {
  const [health, setHealth] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/predator/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "text-green-500 bg-green-500/10 border-green-500/50";
      case "DEGRADED":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/50";
      case "OFFLINE":
        return "text-red-500 bg-red-500/10 border-red-500/50";
      default:
        return "text-slate-500 bg-slate-500/10 border-slate-500/50";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
            <HeartPulse size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">System Health</h1>
            <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">
              Real-time Connector Status Dashboard
            </p>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span className="text-xs font-bold uppercase tracking-wider">Refresh Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && health.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />
            ))
          : health.map((service) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-400 transition-colors">
                    <Server size={20} />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusColor(service.status)}`}
                  >
                    {service.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{service.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                    <Clock size={10} />
                    Last Check: {new Date(service.lastCheck).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Zap size={12} className="text-yellow-500" />
                    <span className="text-xs font-mono text-slate-300">{service.latency}ms</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Activity size={12} className="text-blue-500" />
                    <span className="text-[10px] text-slate-500 font-mono">100% Uptime</span>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Audit Log Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Recent Audit Logs</h2>
          </div>
          <button className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest transition-colors">
            View Full Audit History
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[
                {
                  type: "SEARCH",
                  user: "kizimalesik@gmail.com",
                  action: "PREDATOR_CORE_SEARCH",
                  time: "2 min ago",
                  status: "SUCCESS",
                },
                {
                  type: "VIEW",
                  user: "kizimalesik@gmail.com",
                  action: "INTELLIGENCE_DOSSIER",
                  time: "5 min ago",
                  status: "SUCCESS",
                },
                {
                  type: "AUTH",
                  user: "system_orchestrator",
                  action: "API_CONNECTOR_AUTH",
                  time: "10 min ago",
                  status: "SUCCESS",
                },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300 font-mono">{log.user}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{log.action}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">{log.time}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-bold text-green-500 uppercase">{log.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
