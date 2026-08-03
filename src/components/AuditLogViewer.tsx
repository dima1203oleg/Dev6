import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "../services/firebaseService";
import { Search, Filter, ShieldAlert, CheckCircle, Database, Eye } from "lucide-react";

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [filterUser, setFilterUser] = useState<string>("");

  useEffect(() => {
    try {
      const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setLogs(data);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore Error: ", error);
          setLoading(false);
        },
      );
      return () => unsubscribe();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== "ALL" && log.action !== filterAction) return false;
    if (filterUser && !log.user?.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "SEARCH":
        return <Search className="w-4 h-4 text-blue-400" />;
      case "AI_REQUEST":
        return <Database className="w-4 h-4 text-purple-400" />;
      case "EXPORT":
        return <Database className="w-4 h-4 text-amber-400" />;
      case "REPORT":
        return <Eye className="w-4 h-4 text-indigo-400" />;
      case "SYSTEM":
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      default:
        return <Database className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "LOGIN":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "SEARCH":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "AI_REQUEST":
        return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      case "EXPORT":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "REPORT":
        return "text-indigo-400 bg-indigo-400/10 border-indigo-400/20";
      case "SYSTEM":
        return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default:
        return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  return (
    <div className="h-full flex flex-col p-6 w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Журнал Аудиту</h1>
          <p className="text-slate-400 text-sm mt-1">Відстеження подій у реальному часі</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Користувач</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Пошук за іменем..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>
        <div className="w-full sm:w-64">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Тип Дії</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
            >
              <option value="ALL">Всі події</option>
              <option value="LOGIN">Вхід (LOGIN)</option>
              <option value="SEARCH">Пошук (SEARCH)</option>
              <option value="AI_REQUEST">ШІ Запит (AI_REQUEST)</option>
              <option value="EXPORT">Експорт (EXPORT)</option>
              <option value="REPORT">Звіт (REPORT)</option>
              <option value="SYSTEM">Система (SYSTEM)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Дата / Час</th>
                <th className="px-6 py-4">Дія</th>
                <th className="px-6 py-4">Користувач</th>
                <th className="px-6 py-4">Деталі</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Завантаження журналу...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>Подій не знайдено</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-slate-400 text-xs">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("uk-UA") : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold tracking-wider ${getActionColor(log.action)}`}
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-slate-300 font-medium">{log.user || "Unknown"}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 w-full truncate">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
