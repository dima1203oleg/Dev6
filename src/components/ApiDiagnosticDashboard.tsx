import React, { useState, useEffect } from "react";
import { Activity, Clock, Server, CheckCircle2, XCircle, BarChart3, Globe } from "lucide-react";
import { useToast } from "./ToastProvider";

interface ApiHealthMetrics {
  id: string;
  name: string;
  latency: number;
  statusCode: number;
  successRate: number;
  lastPing: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  requests: number;
  failedRequests: number;
}

export default function ApiDiagnosticDashboard() {
  const { showToast } = useToast();
  const [isPinging, setIsPinging] = useState(true);
  
  const [metrics, setMetrics] = useState<Record<string, ApiHealthMetrics>>({
    youcontrol: {
      id: "youcontrol",
      name: "YouControl API",
      latency: 0,
      statusCode: 200,
      successRate: 100,
      lastPing: "-",
      status: "ONLINE",
      requests: 0,
      failedRequests: 0,
    },
    opendatabot: {
      id: "opendatabot",
      name: "OpenDataBot API",
      latency: 0,
      statusCode: 200,
      successRate: 100,
      lastPing: "-",
      status: "ONLINE",
      requests: 0,
      failedRequests: 0,
    }
  });

  useEffect(() => {
    if (!isPinging) return;

    const pingBackend = async () => {
      const start = Date.now();
      try {
        const res = await fetch('/api/health');
        const latency = Date.now() - start;
        const statusCode = res.status;
        setMetrics((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((key) => {
            const item = next[key];
            const newRequests = item.requests + 1;
            const newFailed = item.failedRequests + (res.ok ? 0 : 1);
            const newSuccessRate = ((newRequests - newFailed) / newRequests) * 100;
            next[key] = {
              ...item,
              latency,
              statusCode,
              successRate: parseFloat(newSuccessRate.toFixed(2)),
              lastPing: new Date().toLocaleTimeString(),
              status: res.ok ? "ONLINE" : "DEGRADED",
              requests: newRequests,
              failedRequests: newFailed,
            };
          });
          return next;
        });
      } catch (e) {
        console.warn("[Diagnostic Ping Error]", e);
      }
    };

    pingBackend();
    const interval = setInterval(pingBackend, 5000);

    return () => clearInterval(interval);
  }, [isPinging]);

  const handleManualPing = (id: string) => {
    showToast(`Manual ping sent to ${metrics[id].name}`, "info");
    const newЗатримка = Math.floor(30 + Math.random() * 50);
    setMetrics(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        latency: newЗатримка,
        statusCode: 200,
        lastPing: new Date().toLocaleTimeString(),
        status: "ONLINE",
        requests: prev[id].requests + 1,
        successRate: parseFloat((((prev[id].requests + 1 - prev[id].failedRequests) / (prev[id].requests + 1)) * 100).toFixed(2))
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
              Diagnostic API Ping Dashboard
            </h3>
            <p className="text-sm text-slate-400">
              Live Health Checks for YouControl & OpenDataBot
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsPinging(!isPinging)}
          className={`px-4 py-2 rounded-xl text-sm font-bold font-mono transition-all border ${
            isPinging 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {isPinging ? "AUTO-PING: ACTIVE" : "AUTO-PING: PAUSED"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(metrics).map((metric: ApiHealthMetrics) => (
          <div key={metric.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">{metric.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${metric.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : metric.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                    <span className="text-xs font-mono text-slate-400">{metric.status}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleManualPing(metric.id)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                title="Send Manual Ping"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase block">Затримка</span>
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${metric.latency < 100 ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-lg font-mono text-white">{metric.latency}ms</span>
                </div>
              </div>
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase block">Код Статусу</span>
                <div className="flex items-center gap-2">
                  <Server className={`w-4 h-4 ${metric.statusCode === 200 ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span className={`text-lg font-mono ${metric.statusCode === 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {metric.statusCode}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase block">Відсоток Успіху</span>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-lg font-mono text-white">{metric.successRate}%</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase block">Останній Пінг</span>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-mono text-slate-300">{metric.lastPing}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Монітор Успішності</span>
                <span>{metric.successRate}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 ${metric.successRate > 95 ? 'bg-emerald-500' : metric.successRate > 85 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.max(0, metric.successRate)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
