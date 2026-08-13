import { useState, useEffect } from "react";
import {
  Cpu,
  AlertTriangle,
  RefreshCw,
  Send,
  Radio,
  Bot,
  Terminal,
  Zap,
  Code,
  Database,
  Globe,
  Compass,
  Search,
  Activity,
  Sparkles,
  RotateCcw,
  Lock,
  Unlock,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  INITIAL_AGENTS,
  INITIAL_DISCOVERED_SOURCES,
  INITIAL_ARTIFACTS,
  INITIAL_DRIFTS,
  ALL_48_ENGINES,
  INITIAL_STORAGE_NODES,
  INITIAL_MEMORY_LOGS
} from "../data/autonomousData";
import {
  AgentStatus,
  DiscoveredSource,
  GeneratedConnectorArtifact,
  SchemaDriftEvent,
  FunctionalEngine,
  PolyglotStorageNode,
  AIMemoryLog
} from "../types/autonomous";

export default function AutonomousFactory() {
  const [activeSubTab, setActiveSubTab] = useState<
    | "swarm"
    | "discovery"
    | "workbench"
    | "self-healing"
    | "storage"
    | "engines"
    | "memory"
  >("swarm");

  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);
  const [isFactoryRunning, _setIsFactoryRunning] = useState<boolean>(true);
  const [vramUsage, setVramUsage] = useState<number>(6.4); // GB
  const [cpuUsage, setCpuUsage] = useState<number>(34); // %

  // Swarm States
  const [agents, _setAgents] = useState<AgentStatus[]>(INITIAL_AGENTS);
  const [swarmCommand, setSwarmCommand] = useState<string>("");
  const [isExecutingSwarm, setIsExecutingSwarm] = useState<boolean>(false);
  const [swarmLogs, setSwarmLogs] = useState<string[]>([
    "[CEO Agent]: PREDATOR Autonomous Engine initialized.",
    "[Discovery Agent]: Scanning data.gov.ua, Prozorro, Court Register OData...",
    "[Monitoring Agent]: All 48 functional engines operating in normal SLA range.",
    "[Evolution Agent]: Vector cache synced with 1,480 successful connector patterns."
  ]);

  // Global Discovery States
  const [discoveredSources, setDiscoveredSources] = useState<DiscoveredSource[]>(INITIAL_DISCOVERED_SOURCES);
  const [discoveryQuery, setDiscoveryQuery] = useState<string>("");
  const [selectedProtocolFilter, setSelectedProtocolFilter] = useState<string>("ALL");
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);

  // Workbench Artifact States
  const [artifacts, setArtifacts] = useState<GeneratedConnectorArtifact[]>(INITIAL_ARTIFACTS);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>("");
  const [artifactActiveTab, setArtifactActiveTab] = useState<"connector" | "parser" | "schema" | "etl" | "tests" | "docker" | "helm">("connector");
  const [genSourceName, _setGenSourceName] = useState<string>("");
  const [genProtocol, _setGenProtocol] = useState<string>("REST API");
  const [genSampleUrl, _setGenSampleUrl] = useState<string>("");
  const [isGeneratingConnector, setIsGeneratingConnector] = useState<boolean>(false);

  // Self Healing States
  const [drifts, setDrifts] = useState<SchemaDriftEvent[]>(INITIAL_DRIFTS);
  const [healingTargetSource, setHealingTargetSource] = useState<string>("Єдиний судовий реєстр (OData)");
  const [healingDriftDetails, setHealingDriftDetails] = useState<string>("Нове обов'язкове поле `judge_signature_hash` у структурі відповіді API");
  const [isHealing, setIsHealing] = useState<boolean>(false);

  // Storage Router & Engines
  const [storageNodes] = useState<PolyglotStorageNode[]>(INITIAL_STORAGE_NODES);
  const [engines] = useState<FunctionalEngine[]>(ALL_48_ENGINES);
  const [engineCategoryFilter, setEngineCategoryFilter] = useState<string>("ALL");

  // Memory Matrix
  const [memoryLogs] = useState<AIMemoryLog[]>(INITIAL_MEMORY_LOGS);

  // Firestore sync for agent_tasks if needed
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "agent_tasks"),
      (snapshot) => {
        // Can sync tasks or agent logs if present
      },
      (error) => {
        console.warn("Firestore agent_tasks sync warning:", error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // VRAM & CPU simulation loop
  useEffect(() => {
    if (!isFactoryRunning || killSwitchActive) return;
    const interval = setInterval(() => {
      setVramUsage(prev => Number((5.8 + Math.random() * 2.1).toFixed(1)));
      setCpuUsage(prev => Math.floor(25 + Math.random() * 35));
    }, 4000);
    return () => clearInterval(interval);
  }, [isFactoryRunning, killSwitchActive]);

  // Execute Swarm Command
  const handleRunSwarmCommand = async () => {
    if (!swarmCommand.trim()) return;
    setIsExecutingSwarm(true);
    const cmd = swarmCommand;
    setSwarmCommand("");

    try {
      const res = await fetch("/api/autonomous/swarm-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, activeAgentsCount: agents.length }),
      });
      if (res.ok) {
        const data = await res.json();
        setSwarmLogs(prev => [
          `> COMMAND: ${cmd}`,
          ...(data.logs || []),
          `[Council Verdict]: ${data.councilVerdict || 'APPROVED'} (Confidence: ${data.confidence || 99}%)`,
          ...prev
        ]);
      } else {
        setSwarmLogs(prev => [`[Swarm Executed]: ${cmd}`, ...prev]);
      }
    } catch (err: any) {
      setSwarmLogs(prev => [`[Swarm Executed Local]: ${cmd}`, ...prev]);
    } finally {
      setIsExecutingSwarm(false);
    }
  };

  // Run Real Discovery via API
  const handleTriggerDiscovery = async () => {
    setIsDiscovering(true);
    try {
      const res = await fetch("/api/autonomous/discover-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryKeywords: discoveryQuery || "Державні реєстри України, відкриті дані, судові рішення, закупівлі Prozorro, митниця",
          protocolFilter: selectedProtocolFilter === "ALL" ? "" : selectedProtocolFilter,
        }),
      });
      if (res.ok) {
        const newSources: DiscoveredSource[] = await res.json();
        setDiscoveredSources(prev => [...newSources, ...prev]);
      }
    } catch (err: any) {
      console.error("Discovery trigger error:", err);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Generate Connector Artifacts via API
  const handleGenerateConnector = async (source?: DiscoveredSource) => {
    setIsGeneratingConnector(true);
    const targetName = source ? source.name : (genSourceName || "Новий Драйвер Джерела");
    const targetProtocol = source ? source.protocol : genProtocol;
    const targetUrl = source ? source.url : (genSampleUrl || "https://api.gov.ua/v1/data");

    try {
      const res = await fetch("/api/autonomous/generate-connector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceName: targetName,
          protocol: targetProtocol,
          sampleUrl: targetUrl,
          authType: source ? source.authMethod : "None"
        }),
      });
      if (res.ok) {
        const newArtifact: GeneratedConnectorArtifact = await res.json();
        setArtifacts(prev => [newArtifact, ...prev]);
        setSelectedArtifactId(newArtifact.id);
        setActiveSubTab("workbench");
      }
    } catch (err: any) {
      console.error("Connector generation error:", err);
    } finally {
      setIsGeneratingConnector(false);
    }
  };

  // Trigger Self-Healing Diagnostic via API
  const handleTriggerSelfHealing = async () => {
    setIsHealing(true);
    try {
      const res = await fetch("/api/autonomous/self-heal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceName: healingTargetSource,
          driftDetails: healingDriftDetails,
          severity: "HIGH"
        }),
      });
      if (res.ok) {
        const healResult = await res.json();
        const newDrift: SchemaDriftEvent = {
          id: `drift-${Date.now()}`,
          sourceId: "src-healed",
          sourceName: healingTargetSource,
          detectedAt: "Щойно",
          driftType: healResult.driftType || "FIELD_MUTATED",
          severity: "HIGH",
          details: healingDriftDetails,
          autoPatchStatus: "SELF_HEALED",
          patchCode: healResult.patchCode
        };
        setDrifts(prev => [newDrift, ...prev]);
      }
    } catch (err: any) {
      console.error("Self heal trigger error:", err);
    } finally {
      setIsHealing(false);
    }
  };

  const selectedArtifact = artifacts.find(a => a.id === selectedArtifactId) || artifacts[0];

  const filteredDiscoveredSources = discoveredSources.filter(s => {
    if (selectedProtocolFilter !== "ALL" && s.protocol !== selectedProtocolFilter) return false;
    if (discoveryQuery) {
      const q = discoveryQuery.toLowerCase();
      return (s.name?.toLowerCase().includes(q) || false) || (s['owner']?.toLowerCase().includes(q) || false) || s['detectedEntities'].some((e: string) => e.toLowerCase().includes(q));
    }
    return true;
  });

  const filteredEngines = engines.filter(e => {
    if (engineCategoryFilter === "ALL") return true;
    return e['category'] === engineCategoryFilter;
  });

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600/30 to-indigo-600/20 border border-blue-500/30 rounded-xl text-blue-400 shadow-lg shadow-blue-500/10">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold font-display text-white tracking-wide">
                  Autonomous Data Discovery & Connector Evolution Engine
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AGENTIC SWARM 2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 w-full">
                Саморозвивна AI-фабрика конекторів для PREDATOR Analytics: Автономне дослідження джерел, аналіз схем, генерація ETL, тестування, моніторинг та само-відновлення (Self-Healing).
              </p>
            </div>
          </div>

          {/* System Hardware Status */}
          <div className="flex items-center gap-3 bg-black/40 border border-slate-800 rounded-lg p-2.5 px-4 font-mono text-xs">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">CPU:</span>
              <span className="text-cyan-300 font-bold">{cpuUsage}%</span>
            </div>
            <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">VRAM:</span>
              <span className="text-purple-300 font-bold">{vramUsage} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setKillSwitchActive(!killSwitchActive)}
                className={`px-3 py-1 rounded text-[11px] font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                  killSwitchActive
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/50 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {killSwitchActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {killSwitchActive ? "KILL SWITCH ACTIVE" : "EMERGENCY STOP"}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab("swarm")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeSubTab === "swarm"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Bot className="w-4 h-4 text-blue-300" />
            25 AI Agents Swarm
          </button>

          <button
            onClick={() => setActiveSubTab("discovery")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeSubTab === "discovery"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Globe className="w-4 h-4 text-cyan-300" />
            Global Discovery Engine
            <span className="ml-1 bg-cyan-500/20 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
              {discoveredSources.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("workbench")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeSubTab === "workbench"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Code className="w-4 h-4 text-amber-300" />
            Connector Workbench
            <span className="ml-1 bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
              {artifacts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("self-healing")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeSubTab === "self-healing"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <RotateCcw className="w-4 h-4 text-emerald-300" />
            Self-Healing & Drift
            {drifts.length > 0 && (
              <span className="ml-1 bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-mono animate-pulse">
                {drifts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("storage")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeSubTab === "storage"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Database className="w-4 h-4 text-purple-300" />
            Polyglot Storage Router
          </button>

          <button
            onClick={() => setActiveSubTab("engines")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeSubTab === "engines"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4 text-rose-300" />
            48 Core Engines
          </button>

          <button
            onClick={() => setActiveSubTab("memory")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
              activeSubTab === "memory"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/30"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Brain className="w-4 h-4 text-sky-300" />
            AI Memory Matrix
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {/* SUBTAB 1: 25 AI AGENTS SWARM */}
        {activeSubTab === "swarm" && (
          <motion.div
            key="tab-swarm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Swarm Command Prompt Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
              <label className="text-xs font-mono font-bold text-blue-400 flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4" /> SWARM COMMAND ORCHESTRATOR
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={swarmCommand}
                  onChange={(e) => setSwarmCommand(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunSwarmCommand()}
                  placeholder="Введіть автономну директиву для агентів (наприклад: 'Просканувати відкриті реєстри ЄС та згенерувати OData конектор')..."
                  className="w-full bg-black/60 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  onClick={handleRunSwarmCommand}
                  disabled={isExecutingSwarm}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-lg shadow-lg shadow-blue-600/30 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {isExecutingSwarm ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isExecutingSwarm ? "ВИКОНАННЯ..." : "ЗАПУСТИТИ SWARM"}
                </button>
              </div>
            </div>

            {/* 25 Agents Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-mono font-bold text-slate-300 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  МУЛЬТИАГЕНТНИЙ СВАРМ (25 СПЕЦІАЛІЗОВАНИХ AI АГЕНТІВ)
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {agents.filter(a => a.status === 'busy').length} АКТИВНІ В ПАРАЛЕЛЬНОМУ РЕЖИМІ
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 rounded-xl p-3.5 transition-all hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                            <Bot className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-white tracking-wide truncate">
                            {agent.name}
                          </span>
                        </div>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            agent.status === "busy"
                              ? "bg-emerald-400 animate-ping"
                              : "bg-slate-600"
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-blue-400/80 uppercase mt-1 block">
                        [{agent['category']}]
                      </span>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {agent['currentTask']}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 font-mono text-[10px] space-y-1 text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>CONFIDENCE:</span>
                        <span className="text-emerald-400 font-bold">{agent['confidence']}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>COMPLETED JOBS:</span>
                        <span className="text-blue-400 font-bold">{agent['completedJobs']}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Swarm Decision Stream Logs */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 font-mono text-xs">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                <span className="text-slate-300 font-bold flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  ПОТОК ЖИВИХ КУРСОРІВ ТА РІШЕНЬ СВАРМУ
                </span>
                <span className="text-slate-500 text-[10px]">Real-time Decision Bus</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar text-slate-300">
                {swarmLogs.map((log, idx) => (
                  <div key={idx} className="hover:bg-slate-800/40 px-2 py-1 rounded text-[11px] flex items-start gap-2">
                    <span className="text-blue-400 select-none">›</span>
                    <span className="leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: GLOBAL DISCOVERY ENGINE */}
        {activeSubTab === "discovery" && (
          <motion.div
            key="tab-discovery"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Search and Trigger Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-md">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={discoveryQuery}
                    onChange={(e) => setDiscoveryQuery(e.target.value)}
                    placeholder="Пошук відкритих реєстрів, CKAN, OData, S3, Parquet, GitHub..."
                    className="w-full bg-black/60 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <select
                    value={selectedProtocolFilter}
                    onChange={(e) => setSelectedProtocolFilter(e.target.value)}
                    className="w-full bg-black/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="ALL">Всі Протоколи (38+ Supported)</option>
                    <option value="CKAN">CKAN Open Data</option>
                    <option value="OData">OData Protocol</option>
                    <option value="REST API">REST API / OpenAPI</option>
                    <option value="Parquet/ORC">Parquet / ORC Data Lake</option>
                    <option value="HuggingFace/Kaggle">HuggingFace / Kaggle</option>
                    <option value="S3">S3 Bucket / Object Store</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={handleTriggerDiscovery}
                    disabled={isDiscovering}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs py-2 px-4 rounded-lg shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isDiscovering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                    {isDiscovering ? "СКАНУВАННЯ..." : "ЗАПУСТИТИ ДИСКАВЕРІ"}
                  </button>
                </div>
              </div>
            </div>

            {/* Discovered Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDiscoveredSources.map((source) => (
                <div
                  key={source.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all hover:shadow-xl hover:shadow-cyan-500/5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white line-clamp-2">
                        {source.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                        {source.protocol}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                      <span>{source['country']}</span>
                      <span>•</span>
                      <span>{source['owner']}</span>
                    </div>

                    <div className="mt-3 bg-black/40 rounded-lg p-2.5 font-mono text-[11px] space-y-1.5 border border-slate-800/80">
                      <div className="flex justify-between">
                        <span className="text-slate-400">БІЗНЕС-ЦІННІСТЬ:</span>
                        <span className="text-emerald-400 font-bold">{source['businessValue']}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">АНАЛІТИЧНА ЦІННІСТЬ:</span>
                        <span className="text-blue-400 font-bold">{source['analyticalValue']}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">РИЗИК РЕЙТИНГ:</span>
                        <span className={source['riskScore'] > 20 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                          {source['riskScore']}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">ВИЯВЛЕНІ СУТНОСТІ:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {source['detectedEntities'].map((ent: string, i: number) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {ent}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">РЕКОМЕНДОВАНЕ СХОВИЩЕ:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {source['recommendedStorage'].map((st: string, i: number) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      Скановано: {source['lastScanned']}
                    </span>
                    <button
                      onClick={() => handleGenerateConnector(source)}
                      disabled={isGeneratingConnector}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded shadow flex items-center gap-1.5 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      АВТО-КОНЕКТОР
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: CONNECTOR WORKBENCH */}
        {activeSubTab === "workbench" && selectedArtifact && (
          <motion.div
            key="tab-workbench"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Artifact Selector Header */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold uppercase">
                  ЗГЕНЕРОВАНИЙ КОНЕКТОР АРТЕФАКТ:
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedArtifact['sourceName']} ({selectedArtifact['version']})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedArtifactId}
                  onChange={(e) => setSelectedArtifactId(e.target.value)}
                  className="bg-black/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                >
                  {artifacts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a['sourceName']} [{a['status']}]
                    </option>
                  ))}
                </select>

                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedArtifact['status']}
                </span>
              </div>
            </div>

            {/* Artifact Code Tabs */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex flex-wrap items-center gap-1 bg-black/40 p-2 border-b border-slate-800">
                <button
                  onClick={() => setArtifactActiveTab("connector")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    artifactActiveTab === "connector" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Connector Driver (.ts)
                </button>
                <button
                  onClick={() => setArtifactActiveTab("parser")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    artifactActiveTab === "parser" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Parser Normalizer (.ts)
                </button>
                <button
                  onClick={() => setArtifactActiveTab("schema")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    artifactActiveTab === "schema" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  JSON Schema (.json)
                </button>
                <button
                  onClick={() => setArtifactActiveTab("etl")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    artifactActiveTab === "etl" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  ETL Pipeline (.yaml)
                </button>
                <button
                  onClick={() => setArtifactActiveTab("tests")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    artifactActiveTab === "tests" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Unit Tests (.spec.ts)
                </button>
                <button
                  onClick={() => setArtifactActiveTab("docker")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    artifactActiveTab === "docker" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Dockerfile
                </button>
                <button
                  onClick={() => setArtifactActiveTab("helm")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all ${
                    artifactActiveTab === "helm" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Helm Chart (.yaml)
                </button>
              </div>

              <div className="p-4 font-mono text-xs bg-black/80 text-emerald-400 overflow-x-auto min-h-[300px]">
                <pre className="leading-relaxed whitespace-pre-wrap">
                  {artifactActiveTab === "connector" && selectedArtifact['connectorCode']}
                  {artifactActiveTab === "parser" && selectedArtifact['parserCode']}
                  {artifactActiveTab === "schema" && selectedArtifact['jsonSchema']}
                  {artifactActiveTab === "etl" && selectedArtifact['etlPipelineYaml']}
                  {artifactActiveTab === "tests" && selectedArtifact['unitTestsCode']}
                  {artifactActiveTab === "docker" && selectedArtifact['dockerfile']}
                  {artifactActiveTab === "helm" && selectedArtifact['helmChartYaml']}
                </pre>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: SELF-HEALING & SCHEMA DRIFT */}
        {activeSubTab === "self-healing" && (
          <motion.div
            key="tab-self-healing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Trigger Healing Simulation Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 backdrop-blur-md space-y-3">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> СИМУЛЯЦІЯ DRIFT DETECTION ТА СAМO-ВІДНОВЛЕННЯ
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={healingTargetSource}
                  onChange={(e) => setHealingTargetSource(e.target.value)}
                  placeholder="Цільове джерело (наприклад: Судовий реєстр API)"
                  className="bg-black/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={healingDriftDetails}
                  onChange={(e) => setHealingDriftDetails(e.target.value)}
                  placeholder="Опис зміни API (наприклад: змінено тип поля float->decimal)"
                  className="bg-black/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleTriggerSelfHealing}
                  disabled={isHealing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs py-2 px-4 rounded-lg shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isHealing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isHealing ? "ГЕНЕРАЦІЯ ПАТЧА..." : "ЗАПУСТИТИ SELF-HEAL"}
                </button>
              </div>
            </div>

            {/* Drifts Log List */}
            <div className="space-y-3">
              <h4 className="text-sm font-mono font-bold text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                ІСТОРІЯ ВИЯВЛЕНИХ ЗМІН (SCHEMA DRIFT EVENTS)
              </h4>

              {drifts.map((drift) => (
                <div key={drift.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 font-mono text-xs font-bold">
                        {drift.driftType}
                      </span>
                      <div>
                        <h5 className="text-sm font-bold text-white">{drift.sourceName}</h5>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{drift.details}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {drift.autoPatchStatus}
                    </span>
                  </div>

                  {drift['patchCode'] && (
                    <div className="bg-black/70 rounded-lg p-3 border border-slate-800/80 font-mono text-xs text-emerald-400">
                      <span className="text-[10px] text-slate-500 block mb-1">// AUTO-GENERATED EVOLUTION PATCH CODE:</span>
                      <pre className="whitespace-pre-wrap">{drift['patchCode']}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SUBTAB 5: POLYGLOT STORAGE ROUTER */}
        {activeSubTab === "storage" && (
          <motion.div
            key="tab-storage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {storageNodes.map((node, i) => (
                <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold font-mono text-purple-300 flex items-center gap-2">
                      <Database className="w-4 h-4" /> {node['type']}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {node['health']}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                    {node['role']}
                  </p>

                  <div className="bg-black/40 rounded-lg p-2.5 font-mono text-xs space-y-1 border border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-slate-500">RECORDS:</span>
                      <span className="text-white font-bold">{node['recordCount']}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">STORAGE:</span>
                      <span className="text-purple-300 font-bold">{node['storageUsed']}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">LATENCY:</span>
                      <span className="text-amber-300 font-bold">{node['latencyMs']}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SUBTAB 6: 48 CORE FUNCTIONAL ENGINES */}
        {activeSubTab === "engines" && (
          <motion.div
            key="tab-engines"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "Discovery", "Intelligence", "Generation", "Pipeline", "Testing", "Monitoring", "Security", "Governance", "Evolution", "Operations"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setEngineCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                    engineCategoryFilter === cat ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Engines Fleet Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEngines.map((eng) => (
                <div key={eng.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{eng.id.toString().padStart(2, '0')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {eng['category']}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-white tracking-wide">
                    {eng.name}
                  </h5>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {eng['description']}
                  </p>

                  <div className="pt-2 border-t border-slate-800/60 font-mono text-[10px] flex justify-between text-slate-400">
                    <span>{eng['metrics']}</span>
                    <span className="text-emerald-400 font-bold">{eng['health']}% SLA</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SUBTAB 7: AI MEMORY MATRIX */}
        {activeSubTab === "memory" && (
          <motion.div
            key="tab-memory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <h4 className="text-sm font-mono font-bold text-sky-400 flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4" /> ВЕКТОРНИЙ КЕШ ПАМ'ЯТІ ТА ЕВОЛЮЦІЇ (EPISODIC AI MEMORY)
              </h4>

              <div className="space-y-3">
                {memoryLogs.map((log) => (
                  <div key={log.id} className="bg-black/50 border border-slate-800 rounded-lg p-3.5 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sky-300 font-bold">{log['summary']}</span>
                      <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-400 font-sans leading-relaxed">{log['details']}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {log['tags'].map((tag: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
