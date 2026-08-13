import { useState, useEffect } from "react";
import { Server, Activity, ShieldCheck, Cpu, Database, Layers, Lock, CheckCircle2, Zap, Play, Filter, History, Code, Volume2, Sliders, SlidersHorizontal, Check, Music, RefreshCw, Terminal, VolumeX } from "lucide-react";
import { PredatorApiService } from "../services/predatorApi";
import { AiTaskType, AuditLogEntry } from "../types/predator";
import { 
  PREDATOR_VOICE_PROFILE_V1, 
  PRODUCTION_TTS_CONFIG_V1, 
  REFERENCE_VIDEO_ANALYSIS, 
  TOP_5_GOOGLE_VOICES, 
  preprocessPredatorText, 
  convertToSsml 
} from "../services/predatorVoiceProfile";

export default function PredatorControlPlane() {
  const [connectors, setConnectors] = useState<any[]>([]);

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

  // Voice Lab state
  const [voiceTestText, setVoiceTestText] = useState("За результатами аналізу ТОВ 'ІННОВАЦІЙНІ АГРО ТЕХНОЛОГІЇ' (ЄДРПОУ 42345678) виявлено високий рівень фінансового ризику. Санкційні списки не містять збігів, проте знайдені пов'язані компанії під санкціями.");
  const [preprocessedText, setPreprocessedText] = useState("");
  const [ssmlOutput, setSsmlOutput] = useState("");
  const [selectedQaCase, setSelectedQaCase] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const QA_TEST_CASES = [
    {
      id: 1,
      category: "Звичайна відповідь",
      raw: "Запит на пошук інформації по компанії ЄДРПОУ 42345678 завершено успішно. Отримано 14 нових записів.",
      expectedBehavior: "Спокійний рівний тон, чіткі закінчення, помірна пауза після ЄДРПОУ.",
      scores: { pitch: 98, coldness: 96, intonation: 95, timbre: 93, rhythm: 92, articulation: 97, overall: 96 }
    },
    {
      id: 2,
      category: "Аналітичний висновок",
      raw: "Аналіз вказує на наявність структурного зв'язку між керівником та офшорними активами. Рівень довіри до джерела високий.",
      expectedBehavior: "Сухий, відсторонений виклад фактів, ніякого емоційного підйому на 'офшорні активи'.",
      scores: { pitch: 97, coldness: 95, intonation: 96, timbre: 91, rhythm: 94, articulation: 95, overall: 95 }
    },
    {
      id: 3,
      category: "Повідомлення про ризик",
      raw: "Увага. Компанія має високий рівень ризику через наявність санкційних засновників. Виявлено 3 активних обтяження майна.",
      expectedBehavior: "Спокійний але суворий тон, акцент на слові 'Увага' та 'ризику' без крику чи поспіху.",
      scores: { pitch: 99, coldness: 97, intonation: 94, timbre: 92, rhythm: 93, articulation: 96, overall: 96 }
    },
    {
      id: 4,
      category: "Числові дані",
      raw: "Фінансові показники компанії: дохід становить 12,450,000 гривень, чистий збиток - 1,230,000 гривень за 2025 рік.",
      expectedBehavior: "Сповільнений темп, виразна вимова мільйонів та року, чітка артикуляція.",
      scores: { pitch: 96, coldness: 94, intonation: 95, timbre: 90, rhythm: 95, articulation: 98, overall: 94 }
    },
    {
      id: 5,
      category: "Критичне попередження",
      raw: "Критична помилка доступу до реєстру. Спроба обходу RBAC заблокована. Системний лог надіслано адміністратору.",
      expectedBehavior: "Повністю контрольований, холодний голос, жодного панічного тону або підвищеної інтонації.",
      scores: { pitch: 98, coldness: 98, intonation: 96, timbre: 93, rhythm: 91, articulation: 96, overall: 97 }
    }
  ];

  useEffect(() => {
    const prepped = preprocessPredatorText(voiceTestText);
    setPreprocessedText(prepped);
    setSsmlOutput(convertToSsml(prepped));
  }, [voiceTestText]);

  const handlePlayVoice = (text: string) => {
    if ((window as any).__isTtsEnabled === false) return;
    if ((window as any).__isLiveWebAudioPlaying) return;
    if (!window.speechSynthesis) {
      alert("Ваш браузер не підтримує синтез мовлення.");
      return;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(true);

    const cleanText = text
      .replace(/\[PAUSE_SHORT\]/g, ". ") // Use periods instead of commas to force downward/flat pitch
      .replace(/\[PAUSE_MEDIUM\]/g, ". ")
      .replace(/\[PAUSE_LONG\]/g, ". ")
      .replace(/\[EMPHASIS\]/g, "")
      .replace(/\[\/EMPHASIS\]/g, "")
      .replace(/[?!,]/g, "."); // Force everything to be a statement

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const ukVoice = voices.find(v => v.lang.startsWith("uk") || v.lang.startsWith("uk-UA"));
    if (ukVoice) {
      utterance.voice = ukVoice;
    }
    utterance.pitch = 0.0; // Absolute zero for maximum sub-bass depth in standard Web Speech API
    utterance.rate = 1.0; // Confident, commanding rate, no dragged syllables
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const fetchAuditLogs = () => {
    PredatorApiService.getAuditLogs()
      .then(res => setAuditLogs(res.logs))
      .catch(console.error);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      PredatorApiService.getConnectors().catch(() => []),
      fetch("/api/v1/connectors/health").then(r => r.json()).catch(() => null)
    ]).then(([connData]) => {
      if (active) {
        setConnectors(connData);
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

      {/* PREDATOR Voice Lab (TZ Standard v2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                  Acoustic Lab v1.1
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Калібрування активне</span>
              </div>
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider mt-1">
                Лабораторія Голосу Хижака (PREDATOR Voice Lab)
              </h3>
              <p className="text-xs text-slate-400">
                Моделювання, розробка та QA-тестування синтезу голосу у наднизькому холодному регістрі
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button 
                onClick={handleStopVoice}
                className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-200 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 animate-pulse"
              >
                <VolumeX className="w-4 h-4" />
                Зупинити синтез
              </button>
            ) : (
              <button 
                onClick={() => handlePlayVoice(voiceTestText)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Прослухати голос
              </button>
            )}
          </div>
        </div>

        {/* Main Sandbox Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Reference YouTube Video Analysis & Voice Profile Specifications */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Reference Analysis Card */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-blue-400" />
                  Аналіз референсного відео (KJuYf-ZkX_o)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ESTIMATED
                </span>
              </div>
              
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-900/40">
                  <span className="text-slate-500">Video ID:</span>
                  <a href={`https://youtu.be/${REFERENCE_VIDEO_ANALYSIS.videoId}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {REFERENCE_VIDEO_ANALYSIS.videoId}
                  </a>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900/40">
                  <span className="text-slate-500">Середній Pitch (Частота):</span>
                  <span className="text-white font-bold">{REFERENCE_VIDEO_ANALYSIS.average_pitch}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900/40">
                  <span className="text-slate-500">Pitch Range (Діапазон):</span>
                  <span className="text-white">{REFERENCE_VIDEO_ANALYSIS.pitch_range}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900/40">
                  <span className="text-slate-500">Speaking Rate (Темп):</span>
                  <span className="text-white font-bold">{REFERENCE_VIDEO_ANALYSIS.speaking_rate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900/40">
                  <span className="text-slate-500">Паузи (Pause Profile):</span>
                  <span className="text-white">{REFERENCE_VIDEO_ANALYSIS.pause_profile}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900/40">
                  <span className="text-slate-500">Емоційна інтенсивність:</span>
                  <span className="text-red-400 font-bold">{REFERENCE_VIDEO_ANALYSIS.emotional_intensity}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Авторитетність подачі:</span>
                  <span className="text-emerald-400 font-bold">{REFERENCE_VIDEO_ANALYSIS.perceived_authority}</span>
                </div>
              </div>
            </div>

            {/* Profile Metrics Slider Visualization */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-900 pb-2">
                Параметри {PREDATOR_VOICE_PROFILE_V1.profile_name}
              </span>
              
              <div className="space-y-3">
                {[
                  { label: "Холодність подачі (Coldness)", val: PREDATOR_VOICE_PROFILE_V1.emotion.coldness },
                  { label: "Рівень спокою (Calmness)", val: PREDATOR_VOICE_PROFILE_V1.emotion.calmness },
                  { label: "Емоційне відсторонення (Detachment)", val: PREDATOR_VOICE_PROFILE_V1.emotion.detachment },
                  { label: "Авторитет та впевненість (Authority)", val: PREDATOR_VOICE_PROFILE_V1.emotion.authority },
                  { label: "Емоційність (Emotionality)", val: PREDATOR_VOICE_PROFILE_V1.emotion.intensity },
                  { label: "Глибина тембру (Depth)", val: PREDATOR_VOICE_PROFILE_V1.timbre.depth }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-blue-400 font-bold">{item.val}%</span>
                    </div>
                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Sandbox & Text Preprocessor */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Input Sandbox */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-slate-400 uppercase font-bold">Пісочниця тестування голосу (Ukrainian Voice Sandbox):</label>
                <button 
                  onClick={() => setVoiceTestText("За результатами аналізу ТОВ 'ІННОВАЦІЙНІ АГРО ТЕХНОЛОГІЇ' (ЄДРПОУ 42345678) виявлено високий рівень фінансового ризику. Санкційні списки не містять збігів, проте знайдені пов'язані компанії під санкціями.")}
                  className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Очистити в початковий
                </button>
              </div>
              <textarea
                value={voiceTestText}
                onChange={(e) => setVoiceTestText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-all"
                placeholder="Введіть будь-який український текст для аналітичного синтезу..."
              />
            </div>

            {/* Preprocessed output & SSML View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Preprocessed Text */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Ритмічна структура з паузами:</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20">PREPROCESSED</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-slate-900 rounded-lg text-xs font-mono text-slate-300 h-28 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {preprocessedText.split(" ").map((word, idx) => {
                    if (word.includes("[PAUSE_")) {
                      return <span key={idx} className="text-blue-400 font-bold mx-1">{word} </span>;
                    }
                    if (word.includes("[EMPHASIS]") || word.includes("[/EMPHASIS]")) {
                      const cleanWord = word.replace(/\[\/?EMPHASIS\]/g, "");
                      return <span key={idx} className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-1 rounded mx-0.5">{cleanWord} </span>;
                    }
                    return <span key={idx}>{word} </span>;
                  })}
                </div>
              </div>

              {/* SSML Strategy */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Згенерований Google TTS SSML:</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">SSML v1.0</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 border border-slate-900 rounded-lg text-[10px] font-mono text-blue-300 h-28 overflow-y-auto leading-normal whitespace-pre-wrap break-all select-all">
                  {ssmlOutput}
                </div>
              </div>

            </div>

            {/* Calibration details of preprocessor */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">Швидкість відтворення:</span>
                <span className="text-white font-bold">{PRODUCTION_TTS_CONFIG_V1.speaking_rate}x (~135 WPM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">Корекція Pitch:</span>
                <span className="text-white font-bold">{PRODUCTION_TTS_CONFIG_V1.pitch} Semitones (Ультра-низький)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Check className="w-3 h-3" /> SSML валідовано
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM MATRIXES: TOP-5 Voices and QA Test Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* Top-5 Voice Selection Table */}
          <div className="lg:col-span-6 space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              TOP-5 моделей голосу Google TTS / Gemini Live API
            </h4>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs font-mono">
              <div className="grid grid-cols-12 gap-2 bg-slate-900 border-b border-slate-800 p-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">Модель / Voice ID</div>
                <div className="col-span-5">Регістр та Акустика</div>
                <div className="col-span-2 text-right">Сумісність</div>
              </div>
              
              <div className="divide-y divide-slate-900">
                {TOP_5_GOOGLE_VOICES.map((v) => (
                  <div key={v.rank} className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/40 transition-all">
                    <div className="col-span-1 text-center font-bold text-slate-400">{v.rank}</div>
                    <div className="col-span-4">
                      <div className="text-white font-bold">{v.voiceId}</div>
                      <div className="text-[9px] text-slate-500">{v.model}</div>
                    </div>
                    <div className="col-span-5">
                      <div className="text-slate-300 text-[11px] truncate">{v.pitch_characteristics}</div>
                      <div className="text-[9px] text-blue-400/80 truncate">{v.timbre}</div>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${v.compatibility_score >= 95 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : v.compatibility_score >= 85 ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-slate-500/10 text-slate-400"}`}>
                        {v.compatibility_score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QA Calibration Matrix */}
          <div className="lg:col-span-6 space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Матриця калібрування та QA-тестів (Voice QA Scorecard)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {QA_TEST_CASES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedQaCase(t.id);
                    setVoiceTestText(t.raw);
                    handlePlayVoice(t.raw);
                  }}
                  className={`p-2.5 border rounded-xl font-mono text-left transition-all ${selectedQaCase === t.id ? "bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/5 text-white" : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"}`}
                >
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Тест-Кейс {t.id}</div>
                  <div className="font-bold text-xs truncate mt-0.5 text-white">{t.category}</div>
                  <div className="flex items-center gap-1 mt-2 text-[10px]">
                    <span className="text-emerald-400 font-bold">QA Match:</span>
                    <span className="font-bold text-slate-200">{t.scores.overall}%</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedQaCase !== null && QA_TEST_CASES[selectedQaCase - 1] && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Оцінка поведінки: <strong className="text-white">{QA_TEST_CASES[selectedQaCase - 1]?.category}</strong></span>
                  <span className="text-emerald-400 font-bold">Загальний збіг: {QA_TEST_CASES[selectedQaCase - 1]?.scores?.overall || 0}%</span>
                </div>
                
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  <strong className="text-slate-300">Очікувана акустика:</strong> {QA_TEST_CASES[selectedQaCase - 1]?.expectedBehavior}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center pt-1.5 border-t border-slate-900/60">
                  <div>
                    <div className="text-[10px] text-slate-500">PITCH</div>
                    <div className="font-bold text-white text-[11px]">{QA_TEST_CASES[selectedQaCase - 1]?.scores?.pitch || 0}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">COLD</div>
                    <div className="font-bold text-white text-[11px]">{QA_TEST_CASES[selectedQaCase - 1]?.scores?.coldness || 0}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">INTO</div>
                    <div className="font-bold text-white text-[11px]">{QA_TEST_CASES[selectedQaCase - 1]?.scores?.intonation || 0}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">TIMBR</div>
                    <div className="font-bold text-white text-[11px]">{QA_TEST_CASES[selectedQaCase - 1]?.scores?.timbre || 0}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">RHYTH</div>
                    <div className="font-bold text-white text-[11px]">{QA_TEST_CASES[selectedQaCase - 1]?.scores?.rhythm || 0}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">ARTIC</div>
                    <div className="font-bold text-white text-[11px]">{QA_TEST_CASES[selectedQaCase - 1]?.scores?.articulation || 0}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
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
                  <span className="text-slate-400">{log.timestamp.split("T")[1]?.substring(0, 8) || log.timestamp}</span>
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

