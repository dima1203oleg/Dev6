import { useState } from "react";
import {
  ShieldAlert, Search, AlertTriangle, Briefcase,
  Clock, TrendingUp, Database, Network, Bot,
  ArrowRight, FileText, RefreshCw, Eye
} from "lucide-react";
import { motion } from "motion/react";
import { OSINT_ENTITIES } from "../osintData";

interface AnalyticsDashboardProps {
  onOpenCommandBar: () => void;
  onSelectTab: (tabId: string) => void;
}

const RISK_ALERTS = [
  { id: 1, level: "CRITICAL", text: "Нова санкція РНБО — відповідність суб'єкту у реєстрі", time: "14 хв тому", entity: "ТОВ МетаЛтд", color: "text-red-400 border-red-500/20 bg-red-500/5" },
  { id: 2, level: "HIGH", text: "Виявлено зв'язок PEP — Кізима І.В.", time: "1 год тому", entity: "Кізима Ігор Вікторович", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
  { id: 3, level: "MEDIUM", text: "Реєстр НАЗК поновлено — 23 нові декларації", time: "3 год тому", entity: null, color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5" },
  { id: 4, level: "INFO", text: "ua.opendatabot поновлено: +18 245 записів ЄДР", time: "6 год тому", entity: null, color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
];

const RECENT_SEARCHES = OSINT_ENTITIES.slice(0, 5).map(e => ({
  id: e.id,
  name: e.name,
  type: e.type,
  riskScore: Math.floor(Math.random() * 50) + 40,
  time: `${Math.floor(Math.random() * 30) + 1} хв тому`
}));

const ACTIVE_CASES = [
  { id: "case-1", name: "Тендерні махінації — МО", entities: 7, progress: 78, risk: "HIGH" },
  { id: "case-2", name: "Banking-12 — АМЛ Скринінг", entities: 3, progress: 42, risk: "CRITICAL" },
  { id: "case-3", name: "Пов'язані офшори — Коваленко", entities: 12, progress: 91, risk: "HIGH" },
];

const STATS = [
  { label: "Суб'єктів перевірено сьогодні", value: 47, icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "Активних кейсів", value: 3, icon: Briefcase, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "High-Risk виявлено", value: 12, icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { label: "Реєстрів підключено", value: "177/177", icon: Database, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
];

export function AnalyticsDashboard({ onOpenCommandBar, onSelectTab }: AnalyticsDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const riskColor = (score: number) =>
    score >= 70 ? "text-red-500 bg-red-500/10 border-red-500/20"
    : score >= 40 ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
    : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-6 border-b border-slate-800/60">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Аналітичний центр</h1>
            <p className="text-sm text-slate-500 mt-1">Огляд активних розслідувань та сповіщень</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onOpenCommandBar}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <Search size={14} />
              Новий пошук
              <kbd className="ml-1 text-[10px] opacity-70 bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`border rounded-xl p-4 ${stat.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-snug">{stat.label}</div>
                  </div>
                  <Icon size={18} className={`${stat.color} opacity-70`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: Cases + Recent */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Cases */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={15} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Активні розслідування</span>
                </div>
                <button
                  onClick={() => onSelectTab("investigation-workspace")}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Всі кейси <ArrowRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-slate-800/40">
                {ACTIVE_CASES.map((c) => (
                  <div key={c.id} className="px-5 py-4 hover:bg-slate-800/30 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{c.name}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        c.risk === "CRITICAL" ? "text-red-400 border-red-500/20 bg-red-500/5"
                        : "text-amber-400 border-amber-500/20 bg-amber-500/5"
                      }`}>{c.risk}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            c.risk === "CRITICAL" ? "bg-gradient-to-r from-red-600 to-red-500"
                            : "bg-gradient-to-r from-amber-600 to-amber-500"
                          }`}
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-mono shrink-0">{c.progress}%</span>
                      <span className="text-xs text-slate-600 shrink-0">{c.entities} суб'єктів</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800/60 flex items-center gap-2">
                <Clock size={15} className="text-slate-500" />
                <span className="text-sm font-semibold text-white">Останні пошуки</span>
              </div>
              <div className="divide-y divide-slate-800/40">
                {RECENT_SEARCHES.map((s) => (
                  <div
                    key={s.id}
                    onClick={onOpenCommandBar}
                    className="px-5 py-3.5 hover:bg-slate-800/30 transition-colors cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:border-blue-500/30 transition-colors">
                        {s.type === "person" ? <span className="text-blue-400 text-xs">👤</span> : <span className="text-emerald-400 text-xs">🏢</span>}
                      </div>
                      <div>
                        <div className="text-sm text-slate-200 group-hover:text-white font-medium transition-colors truncate max-w-[300px]">{s.name}</div>
                        <div className="text-[10px] text-slate-600">{s.time}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskColor(s.riskScore)}`}>
                      {s.riskScore}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Alerts + Quick Nav */}
          <div className="space-y-6">
            {/* Risk Alerts Feed */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800/60 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                <span className="text-sm font-semibold text-white">Сповіщення ризиків</span>
                <div className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="divide-y divide-slate-800/30">
                {RISK_ALERTS.map((alert) => (
                  <div key={alert.id} className={`px-4 py-3.5 border-l-2 ${
                    alert.level === "CRITICAL" ? "border-l-red-500" 
                    : alert.level === "HIGH" ? "border-l-amber-500"
                    : alert.level === "MEDIUM" ? "border-l-yellow-500"
                    : "border-l-blue-500"
                  }`}>
                    <div className={`text-[9px] font-bold tracking-widest mb-1 px-1.5 py-0.5 rounded border inline-block ${alert.color}`}>
                      {alert.level}
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">{alert.text}</p>
                    {alert.entity && (
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <span>→</span>
                        <span className="font-medium text-slate-400">{alert.entity}</span>
                      </p>
                    )}
                    <div className="text-[9px] text-slate-600 mt-1">{alert.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800/60">
                <span className="text-sm font-semibold text-white">Швидкий доступ</span>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { icon: Network, label: "Граф зв'язків", tab: "sandbox", color: "text-indigo-400" },
                  { icon: Bot, label: "ШІ Copilot", tab: "live-analytical-center", color: "text-cyan-400" },
                  { icon: TrendingUp, label: "Геокарта", tab: "maps", color: "text-emerald-400" },
                  { icon: FileText, label: "Медіа форензика", tab: "media-forensics", color: "text-purple-400" },
                  { icon: Database, label: "Реєстри (177)", tab: "registry-health", color: "text-blue-400" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => onSelectTab(item.tab)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer text-xs group"
                    >
                      <Icon size={14} className={`${item.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                      {item.label}
                      <ArrowRight size={11} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
