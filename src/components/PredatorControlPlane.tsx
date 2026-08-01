import React, { useState, useEffect } from "react";
import { Server, Activity, ShieldCheck, Cpu, Database, Layers, Lock, FileText, CheckCircle2, Zap, ArrowUpRight, Play, Filter, History, Code } from "lucide-react";
import { PredatorApiService } from "../services/predatorApi";
import { AiTaskType, AuditLogEntry } from "../types/predator";

export default function PredatorControlPlane() {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // AI Task Router state
  const [selectedTask, setSelectedTask] = useState<AiTaskType>("RISK_ANALYSIS");
  const [aiPrompt, setAiPrompt] = useState("Проаналізуй рівень ризику компанії ТОВ 'ІННОВАЦІЙНІ АГРО ТЕХНОЛОГІЇ' (ЄДРПОУ 42345678)");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Query DSL state
  const [dslField, setDslField] = useState("edrpou");
  const [dslOp, setDslOp] = useState<"eq" | "contains" | "gte">("eq");
  const [dslValue, setDslValue] = useState("42345678");
  const [dslResult, setDslResult] = useState<any>(null);
  const [dslLoading, setDslLoading] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchAuditLogs = () => {
    setLogsLoading(true);
    PredatorApiService.getAuditLogs()
      .then(res => setAuditLogs(res.logs))
      .catch(console.error)
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      PredatorApiService.getConnectors().catch(() => []),
      fetch("/api/v1/connectors/health").then(r => r.json()).catch(() => null)
    ]).then(([connData, healthData]) => {
      if (active) {
        setConnectors(connData);
        setHealth(healthData);
        setLoading(false);
      }
    });

    fetchAuditLogs();
    return () => { active = false; };
  }, []);

  const handleRunAiTask = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await PredatorApiService.executeAiTask(selectedTask, aiPrompt);
      setAiResult(res);
      fetchAuditLogs();
    } catch (err: any) {
      setAiResult({ error: err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunDslQuery = async () => {
    setDslLoading(true);
    setDslResult(null);
    try {
      const res = await PredatorApiService.executeQueryDsl({
        resourceId: "company_registry",
        filters: [{ field: dslField, operator: dslOp, value: dslValue }],
        limit: 10
      });
      setDslResult(res);
      fetchAuditLogs();
    } catch (err: any) {
      setDslResult({ error: err.message });
    } finally {
      setDslLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
              <Server className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  PREDATOR Analytics Engine v2.0
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-400 font-bold">ПАНЕЛЬ УПРАВЛІННЯ АКТИВНА</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                Панель Управління Аналітика Даних та Розвідки (PREDATOR Control Plane)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAuditLogs}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-mono font-bold transition-all border border-slate-700 flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              Оновити Телеметрію
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-mono uppercase font-bold">Графовий Рушій PREDATOR</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">1,450,890</div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Індексація Графа
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-mono uppercase font-bold">Затримка AI Маршрутизатора</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">42 ms</div>
          <span className="text-xs font-mono text-purple-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Реєстр Задач Активний
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-mono uppercase font-bold">Реєстр Походження Даних</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">SHA-256</div>
          <span className="text-xs font-mono text-slate-400">0 Неперевірених Тверджень</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-mono uppercase font-bold">Рольова Безпека (RBAC)</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">АКТИВНО</div>
          <span className="text-xs font-mono text-amber-400">Серверне Маскування Полів</span>
        </div>
      </div>

      {/* AI Task Router Interactive Gateway */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                Інтерактивний Шлюз та Маршрутизатор AI Задач (AI Task Router)
              </h3>
              <p className="text-xs text-slate-400">
                Виконання аналітичних задач через реєстр Gemini з верифікацією RBAC та політик конфіденційності
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <label className="text-xs font-mono text-slate-400 uppercase font-bold">Оберіть AI Задачу:</label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value as AiTaskType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
            >
              {[
                { id: "RISK_ANALYSIS", label: "RISK_ANALYSIS (Аналіз Ризику)" },
                { id: "ENTITY_RESOLUTION", label: "ENTITY_RESOLUTION (Співставлення Сутностей)" },
                { id: "ENTITY_EXTRACTION", label: "ENTITY_EXTRACTION (Вилучення Сутностей)" },
                { id: "SUMMARIZATION", label: "SUMMARIZATION (Саммаризація)" },
                { id: "INVESTIGATION", label: "INVESTIGATION (Комплексне Розслідування)" },
                { id: "SQL_GENERATION", label: "SQL_GENERATION (Генерація SQL-запитів)" },
                { id: "OCR", label: "OCR (Розпізнавання Тексту)" },
                { id: "CLASSIFICATION", label: "CLASSIFICATION (Класифікація)" }
              ].map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-3">
            <label className="text-xs font-mono text-slate-400 uppercase font-bold">Промпт Запиту до AI Router:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleRunAiTask}
                disabled={aiLoading}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shrink-0"
              >
                <Play className="w-4 h-4" />
                {aiLoading ? "Запуск..." : "Виконати"}
              </button>
            </div>
          </div>
        </div>

        {aiResult && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="text-purple-400 font-bold">Модель: {aiResult.modelUsed || "N/A"}</span>
              <span>Затримка: {aiResult.latencyMs}ms | Privacy: {aiResult.privacyLevel || "STRICT"}</span>
            </div>
            <p className="text-slate-200 text-sm font-mono whitespace-pre-wrap">{aiResult.text || JSON.stringify(aiResult)}</p>
          </div>
        )}
      </div>

      {/* Safe Query DSL Visual Builder */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                Візуальний Конструктор Безпечних Запитів (Safe Query DSL Builder)
              </h3>
              <p className="text-xs text-slate-400">
                Безпечне формування параметризованих SQL-запитів з автоматичним захистом від SQL-ін'єкцій
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase font-bold">Поле Пошуку:</label>
            <input
              type="text"
              value={dslField}
              onChange={(e) => setDslField(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase font-bold">Оператор:</label>
            <select
              value={dslOp}
              onChange={(e) => setDslOp(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
            >
              <option value="eq">ДОРІВНЮЄ (=)</option>
              <option value="contains">МІСТИТЬ (LIKE)</option>
              <option value="gte">БІЛЬШЕ АБО ДОРІВНЮЄ (&gt;=)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase font-bold">Значення:</label>
            <input
              type="text"
              value={dslValue}
              onChange={(e) => setDslValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
            />
          </div>
          <button
            onClick={handleRunDslQuery}
            disabled={dslLoading}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {dslLoading ? "Генерація..." : "Згенерувати План"}
          </button>
        </div>

        {dslResult && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs">
            <div className="text-emerald-400 font-bold">Згенерований SQL План (Параметризований):</div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-blue-300">
              {dslResult.queryPlan?.sql}
            </div>
            <div className="text-slate-400">Параметри: {JSON.stringify(dslResult.queryPlan?.params)}</div>
          </div>
        )}
      </div>

      {/* Connectors Registry Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                Універсальні Драйвери Конекторів (Connector SDK Drivers)
              </h3>
              <p className="text-xs text-slate-400">
                Зареєстровані адаптери відкритих даних та API державних реєстрів України
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {connectors.map((conn) => (
            <div key={conn.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {conn.protocol}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {conn.status}
                </span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">{conn.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{conn.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-900 flex justify-between text-[11px] font-mono text-slate-500">
                <span>{conn.owner}</span>
                <span>{conn.version}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Audit Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                Журнал Аудиту Безпеки (Live Security Audit Trail)
              </h3>
              <p className="text-xs text-slate-400">
                Реєстрація дій користувачів, ролей, токенів та перевірок доступу в реальному часі
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 py-4 text-center">Записи аудиту відсутні</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-950 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-400">{log.timestamp.split("T")[1].substring(0, 8)}</span>
                  <span className="text-purple-400 font-bold">[{log.role}]</span>
                  <span className="text-white font-bold">{log.action}</span>
                  <span className="text-slate-400">({log.resource})</span>
                </div>
                <span className="text-emerald-400 font-bold">{log.result}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

