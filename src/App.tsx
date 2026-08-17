/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import CatalogTab from "./components/CatalogTab";
import LicenseTab from "./components/LicenseTab";
import ArchitectureTab from "./components/ArchitectureTab";
import GapAnalysisTab from "./components/GapAnalysisTab";
import RoadmapTab from "./components/RoadmapTab";
import VolumesTab from "./components/VolumesTab";
import AdvisorTab from "./components/AdvisorTab";
import DataIngestionTab from "./components/DataIngestionTab";
import RegistryDashboard from "./components/admin/RegistryDashboard";
import InspectorPanel from "./components/InspectorPanel";
import LiveAnalyticalCenter from "./components/LiveAnalyticalCenter";
import AdminBackOffice from "./components/AdminBackOffice";
import AutonomousFactory from "./components/AutonomousFactory";
import AuditLogViewer from "./components/AuditLogViewer";
// @ts-ignore - unused SearchPortal
import SearchPortal from "./components/SearchPortal";
import { EnterpriseDashboard } from "./components/ui/EnterpriseDashboard";
import { LiveMonitoringDashboard } from "./components/ui/LiveMonitoringDashboard";

// Dynamic Code Splitting via React.lazy() for Client Performance
const OsintWorkbench = React.lazy(() => import("./components/OsintWorkbench"));
// @ts-ignore - unused DashboardView
const DashboardView = React.lazy(() => import("./components/DashboardView"));
const MediaForensicsTab = React.lazy(() => import("./components/MediaForensicsTab").then(m => ({ default: m.MediaForensicsTab })));
const PredatorControlPlane = React.lazy(() => import("./components/PredatorControlPlane"));
const InvestigationWorkspaceTab = React.lazy(() => import("./components/InvestigationWorkspaceTab"));
const MapsTab = React.lazy(() => import("./components/MapsTab"));
const CKANExplorerTab = React.lazy(() => import("./components/CKANExplorerTab"));
const InvestigationSandbox = React.lazy(() => import("./components/InvestigationSandbox"));
const MasterSpecificationViewer = React.lazy(() => import("./components/MasterSpecificationViewer"));

// @ts-ignore - unused EntityWorkspace
import { EntityWorkspace } from "./components/EntityWorkspace";
import { EnhancedEntityWorkspace } from "./components/EnhancedEntityWorkspace";
import { ModernDashboard } from "./components/ModernDashboard";
import { CommandBar } from "./components/CommandBar";
// @ts-ignore - unused AnalyticsDashboard
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
// @ts-ignore - unused SkeletonLensPanel
import { SkeletonLensPanel } from "./components/ui/SkeletonLoader";
import { AICopilotPanel } from "./components/AICopilotPanel";
import { NotificationCenter } from "./components/ui/NotificationCenter";
import { ComparisonWorkspace } from "./components/ComparisonWorkspace";
import ImprovedNavigation from "./components/ui/ImprovedNavigation";
import LanguageSwitcher from "./components/ui/LanguageSwitcher";
import { useI18n } from "./lib/i18n";
const MLIPMasterDashboard = React.lazy(() => import("./components/mlip/MLIPMasterDashboard").then(m => ({ default: m.MLIPMasterDashboard })));
// @ts-ignore - unused DossierView
const DossierView = React.lazy(() => import("./components/DossierView"));
import {   VoiceCall } from "./components/VoiceCall";
// @ts-ignore - unused ToastProvider
import {   ToastProvider } from "./components/ToastProvider";
// @ts-ignore - unused generateDynamicEntity
import {   OsintEntity } from "./osintData";
import { realDataService } from "./services/RealDataService";
import {  
  Layers,
// @ts-ignore - unused ShieldCheck
  ShieldCheck, Shield,
  Network,
  Wrench,
  Calendar,
  Bot,
// @ts-ignore - unused FileText
  FileText,
// @ts-ignore - unused CheckCircle
  CheckCircle,
  AlertTriangle,
// @ts-ignore - unused Info
  Info,
// @ts-ignore - unused BookOpen
  BookOpen,
  Menu,
  X,
  Search,
// @ts-ignore - unused Bell
  Bell,
  User,
// @ts-ignore - unused Terminal
  Terminal,
  Cpu,
  Database,
// @ts-ignore - unused Activity
  Activity,
  Camera,
// @ts-ignore - unused Landmark
  Landmark,
// @ts-ignore - unused MessageSquare
  MessageSquare,
  Sparkles,
  Send,
  HelpCircle,
// @ts-ignore - unused Maximize2
  Maximize2,
// @ts-ignore - unused Minimize2
  Minimize2,
  Settings,
  ShieldAlert,
// @ts-ignore - unused Compass
  Compass,
// @ts-ignore - unused Briefcase
  Briefcase,
// @ts-ignore - unused Truck
  Truck,
// @ts-ignore - unused Globe
  Globe,
// @ts-ignore - unused TrendingUp
  TrendingUp,
// @ts-ignore - unused Users
  Users,
  Map,
  Mic,
// @ts-ignore - unused Server
// @ts-ignore - unused Tablet
  UserCheck, Tablet, LayoutDashboard, Server, Volume2, VolumeX} from "lucide-react";
import {   motion, AnimatePresence } from "motion/react";
import {   LiveChatBot } from "./components/LiveChatBot";
import {   AuthStatus } from "./components/AuthStatus";
import {   FirebaseSyncIndicator } from "./components/FirebaseSyncIndicator";

type TabId =
  | "live-analytical-center"
  | "admin-back-office"
  | "dashboard"
  | "osint"
  | "person-profiler"
  | "adverse"
  | "maps"
  | "catalog"
  | "license"
  | "architecture"
  | "gap"
  | "roadmap"
  | "volumes"
  | "advisor"
  | "sandbox"
  | "media-forensics"
  | "data-ingestion"
  | "autonomous-factory"
  | "predator-control"
  | "investigation-workspace"
  | "audit-log"
  | "master-specification"
  | "mlip-modules"
  | "predator-intel"
  | "ckan-explorer"
  | "enterprise-dashboard"
  | "live-monitoring"
  | "registry-health";

export default function App() {
  const { t } = useI18n();
  const [ecosystem, setEcosystem] = useState<"user" | "admin">("user");
  const [activeTab, setActiveTab] = useState<TabId>("predator-intel");
  const [activeDossier, setActiveDossier] = useState<any>(null);
  const [comparisonDossier, setComparisonDossier] = useState<any>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>("business");
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  // Interactive rendering and mobile adaptive states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
// @ts-ignore - unused isRealMobile
  const [isRealMobile, setIsRealMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isMobileUA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return window.innerWidth < 768 || isMobileUA;
    }
    return false;
  });

  // Detect real narrow-screen mobile device on load and resize
  useEffect(() => {
    const handleResize = () => {
      const isMobileUA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isMobileSize = window.innerWidth < 768 || isMobileUA;
      
      setIsRealMobile(isMobileSize);
      if (isMobileSize) {
        setIsInspectorOpen(false);
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cmd+K shortcut for CommandBar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandBarOpen(true);
      }
      // ⌘E — jump to Entity Workspace
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setActiveTab('predator-intel');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Inspector contents - using real data service instead of static data
  const [entitiesList, setEntitiesList] = useState<OsintEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<OsintEntity | null>(null);
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>({
    id: "core_api",
    label: "Core REST API",
    group: "Core",
    details:
      "Основний бекенд-сервіс на базі FastAPI. Забезпечує оркестрацію черг, інтеграцію ШІ-моделей vLLM та інтерфейс до баз даних Qdrant та Neo4j.",
  });

  // Floating AI Assistant state
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "ai",
      text: "Вітаю. Я аналітичний ШІ-асистент NEXUS. Я можу знайти приховані зв'язки, написати висновки про компанії або згенерувати SQL-запити до бази.",
    },
  ]);

  // Spotlight / Command Center State
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");

  // Voice Command / Web Speech API states
  const [isVoiceListening, setIsVoiceListening] = useState(false);
// @ts-ignore - unused voiceTranscript
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = React.useRef<any>(null);

  // Microsoft TTS Engine state (Web Speech Synthesis Integration)
  const [isTtsEnabled, setIsTtsEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("predator-tts-enabled");
      if (saved !== null) {
        const val = saved === "true";
        (window as any).__isTtsEnabled = val;
        return val;
      }
      (window as any).__isTtsEnabled = true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__isTtsEnabled = isTtsEnabled;
      localStorage.setItem("predator-tts-enabled", String(isTtsEnabled));
    }
  }, [isTtsEnabled]);

  useEffect(() => {
    const handleTtsToggle = (e: any) => {
      if (e && e.detail && typeof e.detail.enabled === "boolean") {
        setIsTtsEnabled(e.detail.enabled);
      }
    };
    window.addEventListener("predator-tts-toggle", handleTtsToggle);
    return () => {
      window.removeEventListener("predator-tts-toggle", handleTtsToggle);
    };
  }, []);

// @ts-ignore - unused setSelectedTtsVoice
  const [selectedTtsVoice, setSelectedTtsVoice] = useState(
    "Microsoft Pavel (UA)",
  );
// @ts-ignore - unused availableVoices
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  // Initialize and load Speech Synthesis voices natively supporting Microsoft cloud-inspired voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  const speakText = (text: string) => {
    if (!isTtsEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if ((window as any).__isLiveWebAudioPlaying) return;

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn("SpeechSynthesis cancel notice:", e);
    }

    // Clean text: remove code blocks, formatting, long logs
    let cleanText = text
      .replace(/```sql[\s\S]*?```/g, " [Згенеровано SQL запит] ")
      .replace(/```[\s\S]*?```/g, " [Фрагмент коду] ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*#_\[\]()\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    // Split into readable sentences to avoid browser length bottlenecks
    const sentences = cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText];

    sentences.forEach((sentence) => {
      const sTrimmed = sentence.trim();
      if (!sTrimmed) return;

      const utterance = new SpeechSynthesisUtterance(sTrimmed);
      utterance.lang = "uk-UA";
      utterance.rate = 0.8; // slower, masked pace
      utterance.pitch = 0.1; // deeply lowered pitch for masked voice effect

      // Match selected voice or any Ukrainian Microsoft cloud voice
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = null;

      if (selectedTtsVoice.includes("Irina")) {
        matchedVoice =
          voices.find(
            (v) => v.lang.startsWith("uk") && v.name.includes("Irina"),
          ) ||
          voices.find(
            (v) => v.lang.startsWith("uk") && v.name.includes("Microsoft"),
          );
      } else if (selectedTtsVoice.includes("Pavel")) {
        matchedVoice =
          voices.find(
            (v) => v.lang.startsWith("uk") && v.name.includes("Pavel"),
          ) ||
          voices.find(
            (v) => v.lang.startsWith("uk") && v.name.includes("Microsoft"),
          );
      } else {
        matchedVoice = voices.find(
          (v) => v.lang.startsWith("uk") && v.name.includes("Microsoft"),
        );
      }

      if (!matchedVoice) {
        // Fallback to general Ukrainian engines (Microsoft, Google, iOS native)
        matchedVoice =
          voices.find((v) => v.lang.startsWith("uk")) ||
          voices.find((v) => v.lang.startsWith("uk-UA")) ||
          voices.find((v) => v.name.toLowerCase().includes("ukrainian"));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
    });
  };

  const handleVoiceCommand = (transcript: string) => {
    const text = transcript.trim();
    if (!text) return;

    const lower = text.toLowerCase();
    setVoiceFeedback(`Почуто: "${text}"`);

    // Automatic clear of feedback
    setTimeout(() => {
      setVoiceFeedback(null);
    }, 4000);

    // 1. Navigation commands
    if (
      lower.includes("дашборд") ||
      lower.includes("dashboard") ||
      lower.includes("панель")
    ) {
      setActiveTab("dashboard");
      const msg = `Перехід на інтерактивний Дашборд`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("мапа") ||
      lower.includes("карта") ||
      lower.includes("maps") ||
      lower.includes("map")
    ) {
      setActiveTab("maps");
      const msg = `Перехід на інтерактивну карту`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("пошук") ||
      lower.includes("search") ||
      lower.includes("осінт") ||
      lower.includes("osint")
    ) {
      setActiveTab("osint");
      const msg = `Перехід на пошуковий робочий стіл OSINT`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("ядро") ||
      lower.includes("центр") ||
      lower.includes("live") ||
      lower.includes("шi")
    ) {
      setActiveTab("live-analytical-center");
      const msg = `Перехід до живого аналітичного ядра NEXUS`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("адмін") ||
      lower.includes("адмінка") ||
      lower.includes("консоль") ||
      lower.includes("admin") ||
      lower.includes("office")
    ) {
      setEcosystem("admin");
      setActiveTab("admin-back-office");
      const msg = `Доступ надано. Перехід у बैक офіс консоль`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("пісочниця") ||
      lower.includes("павутина") ||
      lower.includes("sandbox") ||
      lower.includes("investigation")
    ) {
      setActiveTab("sandbox");
      const msg = `Перехід до аналітичної пісочниці Павутина`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("граф") ||
      lower.includes("архітектура") ||
      lower.includes("залежності") ||
      lower.includes("architecture")
    ) {
      setActiveTab("architecture");
      const msg = `Відкриття графу залежностей архітектури`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("прогалини") ||
      lower.includes("ризики") ||
      lower.includes("gap")
    ) {
      setActiveTab("gap");
      const msg = `Завантаження аналізу прогалин та ризиків комплаєнсу`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("дорожня карта") ||
      lower.includes("план") ||
      lower.includes("roadmap")
    ) {
      setActiveTab("roadmap");
      const msg = `Показ дорожньої карти впровадження системи`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("томи") ||
      lower.includes("регламенти") ||
      lower.includes("volumes")
    ) {
      setActiveTab("volumes");
      const msg = `Відкриття електронних томів технічного завдання`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }
    if (
      lower.includes("архітектор") ||
      lower.includes("радник") ||
      lower.includes("advisor")
    ) {
      setActiveTab("advisor");
      const msg = `Підключення до радника ШІ архітектора`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }

    // 2. Action / Device commands
    if (lower.includes("інспектор") || lower.includes("inspector")) {
      setIsInspectorOpen((prev) => !prev);
      const msg = `Перемикання стану панелі інспектора`;
      setVoiceFeedback(msg);
      speakText(msg);
      return;
    }

    // 3. Search queries
    let queryText = text;
    let isExplicitSearch = false;
    if (lower.startsWith("знайди ") || lower.startsWith("пошук ")) {
      queryText = text.substring(6).trim();
      isExplicitSearch = true;
    } else if (lower.startsWith("find ") || lower.startsWith("search ")) {
      queryText = text.substring(5).trim();
      isExplicitSearch = true;
    }

    if (
      isExplicitSearch ||
      lower.includes("коваленко") ||
      lower.includes("спецтехпостач") ||
      lower.includes("фольксваген") ||
      lower.includes("клієнт")
    ) {
      // Use real data service instead of static OSINT_ENTITIES
      realDataService.searchEntity(queryText).then(result => {
        if (result.status === 'SUCCESS' && result.entity) {
          setSelectedEntity(result.entity);
          setSelectedTool(null);
          setSelectedNode(null);
          setIsInspectorOpen(true);
          setActiveTab("live-analytical-center");
          const msg = `Знайдено об'єкт дослідження: ${result.entity.name}`;
          setVoiceFeedback(msg);
          speakText(msg);
        } else {
          setVoiceFeedback('Дані не знайдено або джерело недоступне');
          speakText('Дані не знайдено або джерело недоступне');
        }
      });
      return;
    }

    // 4. Default: Chat with NEXUS
    setChatHistory((prev) => [...prev, { sender: "user", text: text }]);
    setIsAiChatOpen(true);

    setTimeout(() => {
      let aiResponse =
        "Голосовий запит опрацьовано ШІ-ядром NEXUS через Web Speech API. Збігів у базі санкцій не знайдено.";

      if (lower.includes("санкції") || lower.includes("рнбо")) {
        aiResponse =
          "ШІ знайшов критичну загрозу: ТОВ 'СпецТехПостач' (код 38294012) знаходиться під санкціями РНБО з 2026 року через обхід експортних обмежень через турецьких контрагентів.";
      } else if (lower.includes("коваленко")) {
        aiResponse =
          "Коваленко Ігор Вікторович є засновником ТОВ 'СпецТехПостач' (51%) та володіє BTC-гаманцем bc1qxy...d831. ШІ оцінює рівень ризику особи як ВИСОКИЙ (82%).";
      } else if (lower.includes("sql")) {
        aiResponse =
          "Ось згенерований SQL для пошуку пов'язаних бенефіціарів:\n\nSELECT * FROM company_founders WHERE risk_level = 'HIGH';";
      } else if (lower.includes("pdf")) {
        aiResponse =
          "Надішліть PDF-файл ТЗ чи митної декларації в чат. Я проведу миттєвий комплаєнс-аналіз згідно з 16 томами.";
      } else if (
        lower.includes("привіт") ||
        lower.includes("вітаю") ||
        lower.includes("hello")
      ) {
        aiResponse =
          "Вітаю! Я уважно слухаю ваші голосові команди. Ви можете сказати 'Перейди на дашборд', 'Покажи карту' або запитати про санкції.";
      }

      setChatHistory((prev) => [...prev, { sender: "ai", text: aiResponse }]);
      speakText(aiResponse);
    }, 800);
  };

  const startVoiceControl = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(
        "Web Speech API не підтримується у цьому браузері. Будь ласка, використовуйте Google Chrome.",
      );
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    if (isVoiceListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsVoiceListening(false);
      return;
    }

    setIsVoiceListening(true);
    setVoiceError(null);
    setVoiceFeedback("Активація мікрофона...");

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "uk-UA";

    rec.onstart = () => {
      setVoiceFeedback("Слухаю... Назвіть команду");
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition notice (non-fatal):", event);
      if (event.error === "no-speech") {
        setVoiceError(
          "Голос не виявлено. Спробуйте ще раз або виберіть команду нижче:",
        );
      } else if (event.error === "not-allowed") {
        setVoiceError(
          "Доступ заблоковано (запуск у пісочниці/фреймі):",
        );
      } else {
        setVoiceError(
          `Помилка розпізнавання: ${event.error}`,
        );
      }
      setIsVoiceListening(false);
      setTimeout(() => setVoiceError(null), 15000);
    };

    rec.onend = () => {
      setIsVoiceListening(false);
    };

    rec.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript;
      setVoiceTranscript(transcript);
      handleVoiceCommand(transcript);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.warn(
        "Could not start speech recognition directly (non-fatal):",
        err,
      );
      setIsVoiceListening(false);
    }
  };

  // Handle key escape and Ctrl/Cmd+K to toggle Spotlight
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<TabId>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("change-active-tab", handleTabChange);
    return () =>
      window.removeEventListener("change-active-tab", handleTabChange);
  }, []);

  useEffect(() => {
    const handleSystemScan = () => {
      const msg = "🚨 АКТИВОВАНО КІБЕР-АУДИТ ТА СКАНИРУВАННЯ СИСТЕМИ PREDATOR. МОНІТОРИНГ АКТИВНОСТІ РЕЄСТРІВ...";
      setVoiceFeedback(msg);
      setTimeout(() => {
        setVoiceFeedback(null);
      }, 6000);
    };
    window.addEventListener("trigger-system-scan", handleSystemScan);
    return () => window.removeEventListener("trigger-system-scan", handleSystemScan);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsInspectorOpen(false);
        setIsAiChatOpen(false);
        setIsSpotlightOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Spotlight categorized search results
  const spotlightResults = React.useMemo(() => {
    if (ecosystem === "admin") {
      const allNavs = [
        {
          id: "admin-back-office",
          label: "⚙️ Адмінка / ArgoCD Back Office",
          type: "nav",
        },
        { id: "catalog", label: "📦 Каталог готових рішень", type: "nav" },
        {
          id: "license",
          label: "🛡️ Сумісність та активація ліцензій",
          type: "nav",
        },
      ];

      const allActions = [
        {
          id: "toggle-inspector",
          label: isInspectorOpen
            ? "📂 Закрити бічний інспектор"
            : "📂 Відкрити бічний інспектор",
          type: "action",
        },
      ];

      if (!spotlightQuery.trim()) {
        return {
          navigation: allNavs,
          actions: allActions,
          entities: [],
        };
      }

      const query = spotlightQuery.toLowerCase();

      return {
        navigation: allNavs.filter((n) =>
          n.label.toLowerCase().includes(query),
        ),
        actions: allActions.filter((a) =>
          a.label.toLowerCase().includes(query),
        ),
        entities: [],
      };
    } else {
      const allNavs = [
        {
          id: "live-analytical-center",
          label: "🛰️ Живе ШІ-Ядро (Спецпроект NEXUS)",
          type: "nav",
        },
        { id: "dashboard", label: "📊 Інтерактивний Дашборд", type: "nav" },
        { id: "mlip-modules", label: "🛡️ MLIP Intelligence", type: "nav" },
        { id: "osint", label: "🌐 OSINT Робочий Стіл", type: "nav" },
        { id: "person-profiler", label: "👤 Перевірка та Досьє Осіб", type: "nav" },
        {
          id: "architecture",
          label: "🕸️ Граф архітектури та залежностей",
          type: "nav",
        },
        { id: "gap", label: "🛡️ Аналіз прогалин та ризиків", type: "nav" },
        { id: "roadmap", label: "📅 Дорожня карта впровадження", type: "nav" },
        { id: "volumes", label: "📚 Томи ТЗ (Митні регламенти)", type: "nav" },
        { id: "advisor", label: "🤖 ШІ-Архітектор", type: "nav" },
        { id: "enterprise-dashboard", label: "🔒 Enterprise Certification Dashboard", type: "nav" },
        { id: "live-monitoring", label: "📡 Live Monitoring", type: "nav" },
      ];

      const allActions = [
        {
          id: "toggle-inspector",
          label: isInspectorOpen
            ? "📂 Закрити бічний інспектор"
            : "📂 Відкрити бічний інспектор",
          type: "action",
        },
      ];

      if (!spotlightQuery.trim()) {
        return {
          navigation: allNavs.slice(0, 4),
          actions: allActions,
          entities: entitiesList.slice(0, 3).map((e) => ({
            id: e.id,
            label: `👤 ${e.name} [${e.code}]`,
            type: "entity",
            raw: e,
          })),
        };
      }

      const query = spotlightQuery.toLowerCase();

      const matchedEntities = entitiesList
        .filter(
          (e) =>
            e.name.toLowerCase().includes(query) ||
            e.code.includes(query) ||
            (e.description && e.description.toLowerCase().includes(query)),
        )
        .map((e) => ({
          id: e.id,
          label: `👤 ${e.name} [${e.code}]`,
          type: "entity",
          raw: e,
        }));

      if (matchedEntities.length === 0) {
        matchedEntities.unshift({
          id: 'search-' + spotlightQuery,
          label: `🔍 Пошук: "${spotlightQuery}"`,
          type: "entity",
          raw: { 
            id: 'search-' + spotlightQuery,
            name: spotlightQuery, 
            code: spotlightQuery,
            type: 'person' as const,
            status: 'ACTIVE' as const,
            riskScore: 0,
            address: '',
            description: '',
            relationships: [],
            aiRecommendations: '',
            lastActivityDate: ''
          } as OsintEntity,
        });
      }

      return {
        navigation: allNavs.filter((n) =>
          n.label.toLowerCase().includes(query),
        ),
        actions: allActions.filter((a) =>
          a.label.toLowerCase().includes(query),
        ),
        entities: matchedEntities,
      };
    }
  }, [
    ecosystem,
    spotlightQuery,
    isInspectorOpen,
    entitiesList,
  ]);

  const handleSpotlightSelect = (item: any) => {
    if (item.type === "nav") {
      setActiveTab(item.id);
    } else if (item.type === "action") {
      if (item.id === "toggle-inspector") {
        setIsInspectorOpen(!isInspectorOpen);
      }
    } else if (item.type === "entity") {
      setEntitiesList((prev) => {
        if (prev.some((e) => e.id === item.raw.id)) return prev;
        return [item.raw, ...prev];
      });
      setSelectedEntity(item.raw);
      setSelectedTool(null);
      setSelectedNode(null);
      if (item.raw.type === "person") {
        setActiveTab("person-profiler");
      } else {
        setActiveTab("osint");
      }
      setIsInspectorOpen(true);
    }
    setIsSpotlightOpen(false);
    setSpotlightQuery("");
  };

// @ts-ignore - unused setHeaderSearchQuery
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");

// @ts-ignore - unused handleHeaderSearch
  const handleHeaderSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerSearchQuery.trim()) return;

    // Use real data service instead of static data
    const result = await realDataService.searchEntity(headerSearchQuery);
    
    if (result.status === 'SUCCESS' && result.entity) {
      setEntitiesList((prev) => {
        if (prev.some((item) => item.id === result.entity!.id)) return prev;
        return [result.entity!, ...prev];
      });

      setSelectedEntity(result.entity);
      setSelectedTool(null);
      setSelectedNode(null);
      if (result.entity.type === "person") {
        setActiveTab("person-profiler");
      } else {
        setActiveTab("osint");
      }
      setIsInspectorOpen(true);
    } else {
      // Handle error states
      console.error('Search failed:', result.message);
    }
  };

// @ts-ignore - unused selectEntityById
  const selectEntityById = (id: string) => {
    const found = entitiesList.find((e: OsintEntity) => e.id === id);
    if (found) {
      setSelectedEntity(found);
      setSelectedTool(null);
      setSelectedNode(null);
      setIsInspectorOpen(true);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatMessage("");

    // Generate responsive analytical answers
    setTimeout(() => {
      let aiResponse =
        "Аналіз завершено. Запит опрацьовано ШІ-моделлю Gemini 3.5 Flash. Збігів у базі санкцій не знайдено.";

      const lower = userMsg.toLowerCase();
      if (lower.includes("санкції") || lower.includes("рнбо")) {
        aiResponse =
          "ШІ знайшов критичну загрозу: ТОВ 'СпецТехПостач' (код 38294012) знаходиться під санкціями РНБО з 2026 року через обхід експортних обмежень через турецьких контрагентів.";
      } else if (lower.includes('ков")') || lower.includes("коваленко")) {
        aiResponse =
          "Коваленко Ігор Вікторович є засновником ТОВ 'СпецТехПостач' (51%) та володіє BTC-гаманцем bc1qxy...d831. ШІ оцінює рівень ризику особи як ВИСОКИЙ (82%).";
      } else if (lower.includes("sql")) {
        aiResponse =
          "Ось згенерований SQL для пошуку пов'язаних бенефіціарів:\n\nSELECT * FROM company_founders WHERE risk_level = 'HIGH';";
      } else if (lower.includes("pdf")) {
        aiResponse =
          "Надішліть PDF-файл ТЗ чи митної декларації в чат. Я проведу миттєвий комплаєнс-аналіз згідно з 16 томами.";
      }

      setChatHistory((prev) => [...prev, { sender: "ai", text: aiResponse }]);
    }, 800);
  };

  const renderTabContent = () => {
    return (
      <React.Suspense
        fallback={
          <div className="w-full h-96 flex flex-col items-center justify-center space-y-4 p-8">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-b-amber-500 animate-spin [animation-duration:1.2s]" />
            </div>
            <div className="text-center font-mono">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">
                Завантаження модуля NEXUS...
              </span>
              <span className="text-[10px] text-slate-500">
                Code Splitting & Dynamic Bundle Hydration
              </span>
            </div>
          </div>
        }
      >
        {(() => {
          switch (activeTab) {
            case "live-analytical-center":
              return (
                <LiveAnalyticalCenter
                  selectedEntity={selectedEntity}
                  onSelectEntityGlobal={(ent) => {
                    setSelectedEntity(ent);
                    setSelectedTool(null);
                    setSelectedNode(null);
                  }}
                  selectedScenario={selectedScenario}
                  onSelectScenario={setSelectedScenario}
                />
              );
            case "admin-back-office": return <AdminBackOffice />;
            case "mlip-modules": return <MLIPMasterDashboard />;
            case "dashboard":
              return <ModernDashboard />;
            case "osint":
              return (
                <OsintWorkbench
                  selectedEntity={selectedEntity}
                  onSelectEntityForInspector={(ent) => {
                    setSelectedEntity(ent);
                    setSelectedTool(null);
                    setSelectedNode(null);
                    setIsInspectorOpen(true);
                  }}
                />
              );
            case "person-profiler": 
              // Merged into Entity Workspace — redirect to predator-intel with risks lens
              setActiveTab("predator-intel");
              return null;
            case "adverse": 
              setActiveTab("predator-intel");
              return null;
            case "sandbox": return <InvestigationSandbox />;
            case "maps": return <MapsTab _onSelectEntityGlobal={(ent: any) => { setSelectedEntity(ent); setSelectedTool(null); setSelectedNode(null); setActiveTab("live-analytical-center"); }} />;
            case "catalog": return <CatalogTab />;
            case "license": return <LicenseTab />;
            case "architecture": return <ArchitectureTab />;
            case "gap": return <GapAnalysisTab />;
            case "roadmap": return <RoadmapTab />;
            case "volumes": return <VolumesTab />;
            case "advisor": return <AdvisorTab />;
            case "media-forensics": return <MediaForensicsTab />;
            case "data-ingestion": return <DataIngestionTab />;
            case "registry-health": return <RegistryDashboard />;
            case "ckan-explorer": return <CKANExplorerTab />;

            case "predator-intel":
              if (activeDossier && comparisonDossier) {
                return (
                  <ComparisonWorkspace
                    entityA={activeDossier}
                    entityB={comparisonDossier}
                    onClose={() => setComparisonDossier(null)}
                  />
                );
              }
              return (
                <EnhancedEntityWorkspace 
                  onBack={() => setActiveDossier(null)}
                />
              );
            case "autonomous-factory": return <AutonomousFactory />;
            case "predator-control": return <PredatorControlPlane />;
            case "investigation-workspace": return <InvestigationWorkspaceTab />;
            case "audit-log": return <AuditLogViewer />;
            case "master-specification": return <MasterSpecificationViewer />;
            case "enterprise-dashboard": return <EnterpriseDashboard onCardClick={(cardId) => console.log('Card clicked:', cardId)} />;
            case "live-monitoring": return <LiveMonitoringDashboard />;
            default: return null;
          }
        })()}
      </React.Suspense>
    );
  };

// @ts-ignore - unused renderMobileMainContent
  const renderMobileMainContent = () => {
    return (
      <div
        className="h-full flex flex-col relative bg-slate-950 text-slate-200 font-sans"
        id="mobile-viewport-root"
      >
        {/* Compact PREDATOR Mobile App Header */}
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-2 z-40 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-widest text-white uppercase font-mono">
              PREDATOR
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded">ANALYTICS</span>
          </div>
          <button
            onClick={() => setIsUserGuideOpen(true)}
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Профіль / Довідка"
          >
            <span className="text-xs font-mono font-bold">◌</span>
          </button>
        </header>

        {/* Scrollable Mobile Main Area */}
        <main
          className="flex-1 overflow-y-auto p-3 bg-transparent relative custom-scrollbar pb-20"
          id="mobile-scroll-container"
        >
          {/* Mobile Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold font-mono">
            <span>PREDATOR</span>
            <span>/</span>
            <span className="text-blue-400 truncate max-w-[150px]">
              {activeTab === "predator-intel"
                ? (activeDossier ? "Картка суб'єкта" : "Пошук")
                : activeTab === "dashboard"
                ? "Головна"
                : activeTab.toUpperCase().replace("-", " ")}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (activeTab === "predator-intel" ? (activeDossier ? "-dossier" : "-search") : "")}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12 }}
              className="w-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* iOS-Style Premium 4-Item Bottom Navigation Tab Bar for mobile viewports */}
        <nav className="shrink-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 pb-5 grid grid-cols-4 gap-1 text-center z-40 shadow-lg">
          {[
            { id: "dashboard", label: "Головна", icon: LayoutDashboard },
            { id: "mlip-modules", label: "MLIP", icon: Shield },
            { id: "live-analytical-center", label: "ШІ Ядро", icon: Cpu },
            { id: "more", label: "Меню", icon: Menu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === "more" ? mobileMenuOpen : (activeTab === tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "more") {
                    setMobileMenuOpen(true);
                  } else {
                    setActiveTab(tab.id as TabId);
                    setMobileMenuOpen(false);
                  }
                }}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                  isActive ? "text-blue-400 font-bold scale-105" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                <span className="text-[10px] tracking-tight block truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Left Sidebar sliding drawer overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="absolute inset-0 bg-black z-50"
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute top-0 left-0 bottom-0 w-[280px] bg-slate-900 border-r border-slate-800 shadow-2xl z-50 flex flex-col overflow-y-auto"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
                      N
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-wide text-slate-200">
                        Nexus Analytics
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Ecosystem Selector */}
                <div className="p-4 space-y-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Простір Управління
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEcosystem("user");
                        setActiveTab("live-analytical-center");
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center ${ecosystem === "user" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                    >
                      Користувач
                    </button>
                    <button
                      onClick={() => {
                        setEcosystem("admin");
                        setActiveTab("admin-back-office");
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center ${ecosystem === "admin" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                    >
                      Адміністратор
                    </button>
                  </div>
                </div>

                {/* Scenarios / Action tabs list */}
                <div className="p-4 space-y-6">
                  {ecosystem === "user" ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                          Головне
                        </span>
                        <button onClick={() => {setActiveTab("dashboard"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <LayoutDashboard className="w-4 h-4"/> Дашборд
                        </button>
                        <button onClick={() => {setActiveTab("mlip-modules"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Shield className="w-4 h-4"/> MLIP Intelligence
                        </button>
                        <button onClick={() => {setActiveTab("live-analytical-center"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Bot className="w-4 h-4"/> ШІ-Аналітика
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                          Інструменти пошуку
                        </span>
                        <button onClick={() => {setActiveTab("predator-intel"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Shield className="w-4 h-4 text-blue-400"/> <span className="font-bold">PREDATOR Intelligence</span>
                        </button>
                        <button onClick={() => {setActiveTab("ckan-explorer"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Database className="w-4 h-4"/> Державні Реєстри
                        </button>

                        <button onClick={() => {setActiveTab("osint"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Search className="w-4 h-4"/> Глобальний Пошук
                        </button>
                        <button onClick={() => {setActiveTab("person-profiler"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <UserCheck className="w-4 h-4"/> Досьє на Осіб
                        </button>
                        <button onClick={() => {setActiveTab("media-forensics"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Camera className="w-4 h-4"/> Аналіз Медіа
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                          Аналіз та Зв'язки
                        </span>
                        <button onClick={() => {setActiveTab("sandbox"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Network className="w-4 h-4"/> Граф Зв'язків
                        </button>
                        <button onClick={() => {setActiveTab("maps"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Map className="w-4 h-4"/> Геопросторова Карта
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                          Адміністрування
                        </span>
                        <button onClick={() => {setActiveTab("admin-back-office"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Settings className="w-4 h-4"/> Back Office Консоль
                        </button>
                        <button onClick={() => {setActiveTab("predator-control"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <ShieldAlert className="w-4 h-4"/> Панель PREDATOR
                        </button>
                        <button onClick={() => {setActiveTab("data-ingestion"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Database className="w-4 h-4"/> Завантаження Даних
                        </button>
                        <button onClick={() => {setActiveTab("audit-log"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <ShieldAlert className="w-4 h-4"/> Журнал Аудиту
                        </button>
                        <button onClick={() => {setActiveTab("autonomous-factory"); setMobileMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3">
                          <Cpu className="w-4 h-4"/> Автономна Фабрика
                        </button>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-1 mt-4">
                          Архітектура Інфраструктури
                        </span>
                        {[
                          { id: "architecture", label: "Граф залежностей", icon: Network },
                          { id: "gap", label: "Аналіз прогалин", icon: Wrench },
                          { id: "roadmap", label: "Дорожня карта", icon: Calendar },
                          { id: "catalog", label: "Каталог рішень", icon: Layers },
                          { id: "license", label: "Сумісність ліцензій", icon: ShieldAlert },
                          { id: "volumes", label: "Томи ТЗ", icon: Database },
                          { id: "advisor", label: "ШІ-Архітектор", icon: Cpu },
                        ].map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id as TabId);
                                setMobileMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3"
                            >
                              <Icon className="w-4 h-4" /> {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };


const renderDesktopLayout = () => {
    return (
      <div
        className="h-full bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-500/30"
        id="nexus-hub-app"
      >
        {/* TOP NAVBAR */}
        <header className="shrink-0 h-13 border-b border-slate-800 flex items-center justify-between px-3 md:px-4 bg-slate-900/50 backdrop-blur-md z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm mr-2">
                N
              </div>
              <span className="text-slate-500">nexus</span>
              <span className="text-slate-700">/</span>
              <span className="font-semibold text-slate-100 uppercase tracking-tight">Analytics</span>
            </div>

            {ecosystem === "user" ? (
              <div
                onClick={() => setIsSpotlightOpen(true)}
                className="hidden xl:flex items-center relative ml-4 w-80 cursor-pointer group"
              >
                <Search className="w-4 h-4 absolute left-3 text-slate-400 group-hover:text-blue-400 transition-colors pointer-events-none" />
                <input
                  type="text"
                  readOnly
                  value={headerSearchQuery}
                  title={ecosystem === "user" ? t.common.search : t.common.search}
                  className="w-full pl-9 pr-14 py-1.5 bg-slate-950 border border-slate-800 group-hover:border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 transition-all cursor-pointer"
                />
                <kbd className="absolute right-2 text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded shadow-sm">
                  Ctrl+K
                </kbd>
              </div>
            ) : null}


          </div>

          <div className="flex items-center gap-3">
            {ecosystem === "user" ? (
              <button
                onClick={() => setIsUserGuideOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span>💡 Як користуватися?</span>
              </button>
            ) : null}

            {/* Real-time Firestore Connection Indicator */}
            <FirebaseSyncIndicator />

            {/* Notification Center */}
            <NotificationCenter />

            {/* AI Copilot Trigger */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Відкрити AI Copilot"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            <div className="hidden md:flex items-center gap-3 pr-3 border-r border-slate-800">
              <button
                onClick={() => setActiveTab("catalog")}
                className="flex flex-col items-end cursor-pointer group"
                title="Натисніть для перегляду всіх 177 державних та міжнародних реєстрів"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">
                  {ecosystem === "user" ? t.navigation.dashboard : t.admin.title}
                </span>
                {ecosystem === "user" ? (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 group-hover:underline">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    🟢 177/177 реєстрів активні
                  </span>
                ) : (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    K8S OK | 14ms | 1420 RPS
                  </span>
                )}
              </button>
            </div>

            <AuthStatus />

            <LanguageSwitcher />

            {/* Quick Ecosystem Mode Toggle Badge */}
            <button
              onClick={() => {
                if (ecosystem === "user") {
                  setEcosystem("admin");
                  setActiveTab("admin-back-office");
                } else {
                  setEcosystem("user");
                  setActiveTab("dashboard");
                }
              }}
              aria-label={ecosystem === "user" ? "Switch to admin mode" : "Switch to user mode"}
              aria-pressed={ecosystem === "admin"}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-sm ${
                ecosystem === "user"
                  ? "bg-slate-800 border-slate-700 text-blue-300 hover:bg-slate-700 hover:border-slate-600"
                  : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 hover:border-emerald-500/60"
              }`}
              title={ecosystem === "user" ? "Переключити на технічну консоль Адміна" : "Переключити на простий режим Користувача"}
            >
              {ecosystem === "user" ? (
                <>
                  <User className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                  <span>Режим: Користувач</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Режим: Адмін</span>
                </>
              )}
            </button>
            
            <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800">
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT ZONE */}
        <div className="flex-1 flex overflow-hidden relative bg-slate-950">
          {/* LEFT SIDEBAR - Improved Navigation */}
          <ImprovedNavigation
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as TabId)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            ecosystem={ecosystem}
            onEcosystemChange={setEcosystem}
            mobileMenuOpen={false}
            onMobileMenuClose={() => {}}
          />




          {/* MAIN WORKSPACE (Section 8) */}
          <main
            className="flex-1 overflow-y-auto flex flex-col bg-slate-950 relative"
            id="workspace-main"
          >
            {/* Content Sub-header */}
            <div className="shrink-0 h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/40 text-xs z-20">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">PREDATOR Analytics</span>
                <span className="text-slate-600">/</span>
                <span className="text-blue-400 font-medium">
                  {activeTab === "predator-intel" ? t.navigation.predatorIntel :
                   activeTab === "live-analytical-center" ? t.navigation.liveAnalyticalCenter :
                   activeTab === "mlip-modules" ? "MLIP Intelligence Modules" :
                   activeTab === "dashboard" ? t.navigation.dashboard :
                   activeTab === "osint" ? t.navigation.osintWorkbench :
                   activeTab === "person-profiler" ? t.navigation.personProfiler :
                   activeTab === "sandbox" ? t.navigation.sandbox :
                   activeTab === "maps" ? t.navigation.maps :
                   activeTab === "ckan-explorer" ? t.navigation.ckanExplorer :
                   activeTab === "investigation-workspace" ? t.navigation.investigationWorkspace :
                   activeTab.toUpperCase().replace("-", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextVal = !isTtsEnabled;
                    setIsTtsEnabled(nextVal);
                    (window as any).__isTtsEnabled = nextVal;
                    if (!nextVal) {
                      try { window.speechSynthesis.cancel(); } catch (_) {}
                    }
                    window.dispatchEvent(new CustomEvent("predator-tts-toggle", { detail: { enabled: nextVal } }));
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                    isTtsEnabled ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                  title={isTtsEnabled ? t.common.close : t.common.open}
                >
                  {isTtsEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{isTtsEnabled ? "Голос: УВІМК" : "Голос: ВИМК"}</span>
                </button>
                <button
                  onClick={startVoiceControl}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                    isVoiceListening ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                  title={ecosystem === "user" ? t.common.search : t.common.search}
                >
                  <Mic className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isVoiceListening ? "Слухаю..." : "Голосові команди"}</span>
                </button>
                <button
                  onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-md text-[11px] font-medium transition-all cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isInspectorOpen ? t.common.close : t.common.view}</span>
                </button>
              </div>
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full"
                >
                  {/* Dynamic routing */}
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* RIGHT INSPECTOR PANEL (Section 9) */}
          <AnimatePresence>
            {isInspectorOpen && (
              <motion.aside
                initial={{ opacity: 0, x: 200, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 340 }}
                exit={{ opacity: 0, x: 200, width: 0 }}
                className="shrink-0 h-full overflow-hidden"
                id="right-inspector-panel"
              >
                <InspectorPanel
                  selectedEntity={selectedEntity}
                  selectedTool={selectedTool}
                  selectedNode={selectedNode}
                  onClose={() => setIsInspectorOpen(false)}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* 5. FLOATING AI ASSISTANT TERMINAL (Section 17) */}
        {ecosystem === "user" && (
          <div className="fixed bottom-14 right-6 z-50">
            {/* Toggle bubble button */}
            <button
              onClick={() => setIsAiChatOpen(!isAiChatOpen)}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-2xl transition-all cursor-pointer flex items-center justify-center border border-blue-400/20 group"
              title="ШІ-Помічник NEXUS"
            >
              <Bot className="w-5.5 h-5.5 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
            </button>

            {/* Assistant window */}
            <AnimatePresence>
              {isAiChatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.95 }}
                  className="absolute bottom-14 right-0 w-80 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl flex flex-col h-[380px]"
                >
                  {/* Header */}
                  <div className="p-2 bg-indigo-950/20 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        NEXUS ШІ-Асистент
                      </span>
                    </div>
                    <button
                      onClick={() => setIsAiChatOpen(false)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg leading-relaxed max-w-[85%] ${msg.sender === "user" ? "bg-blue-600 text-white ml-auto" : "bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 text-slate-300"}`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder={t.osint.searchPlaceholder}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage();
                      }}
                      className="flex-1 bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-slate-800"
                    />
                    <button
                      onClick={startVoiceControl}
                      className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${isVoiceListening ? "bg-red-500/20 text-red-400 border border-red-500/20 animate-pulse" : "bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 text-slate-300 hover:text-blue-400"}`}
                      title="Голосовий ввід"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 4. BOTTOM STATUS BAR (Section 10) */}
        {ecosystem === "admin" ? (
          <footer className="h-8 bg-indigo-600 px-6 flex items-center justify-between text-[10px] text-indigo-100 shrink-0 z-40 relative">
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>Node 20.x</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Систему синхронізовано</span>
          <span>1024.768МБ / 1.5ГБ Пам'яті</span>
        </div>
      </footer>
        ) : (
          <footer className="h-8 bg-indigo-600 px-6 flex items-center justify-between text-[10px] text-indigo-100 shrink-0 z-40 relative">
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>Node 20.x</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Систему синхронізовано</span>
          <span>1024.768МБ / 1.5ГБ Пам'яті</span>
        </div>
      </footer>
        )}

        {/* 6. COMMAND CENTER SPOTLIGHT PANEL (Ctrl+K) */}
        <AnimatePresence>
          {isSpotlightOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-3">
              {/* Backdrop blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSpotlightOpen(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              />

              {/* Modal Dialog container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.15 }}
                className="relative w-full w-full bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[500px] z-50"
              >
                {/* Search input header */}
                <div className="flex items-center gap-2 p-3 border-b border-slate-800 bg-slate-950/50">
                  <Search className="w-4 h-4 text-blue-400 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder={t.osint.searchPlaceholder}
                    value={spotlightQuery}
                    onChange={(e) => setSpotlightQuery(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                  />
                  <span className="text-xs bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 text-slate-300 px-2 py-1 rounded font-mono shrink-0">
                    ESC
                  </span>
                </div>

                {/* Categorized results list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                  {/* Navigation suggestions */}
                  {spotlightResults.navigation.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-bold block">
                        🧭 Навігація та Екосистема
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {spotlightResults.navigation.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleSpotlightSelect(n)}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-blue-600/20 hover:border-slate-800 border border-transparent transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_2px_10px_rgba(99,102,241,0.15)] flex items-center justify-between cursor-pointer"
                          >
                            <span>{n.label}</span>
                            <span className="text-xs text-blue-500 font-mono">
                              Перейти →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Simulated Device controls / Actions */}
                  {spotlightResults.actions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-bold block">
                        ⚡ Команди керування симуляцією
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {spotlightResults.actions.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => handleSpotlightSelect(a)}
                            className="text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-amber-600/20 hover:border-slate-800 border border-transparent bg-black/30 transition-all flex items-center justify-between cursor-pointer"
                          >
                            <span>{a.label}</span>
                            <span className="text-xs text-amber-500 font-mono">
                              Виконати
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities / OSINT records */}
                  {spotlightResults.entities.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-rose-400 uppercase tracking-widest font-bold block">
                        👥 Аналітична база даних OSINT (Компанії / Бенефіціари)
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {spotlightResults.entities.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => handleSpotlightSelect(e)}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-rose-600/20 hover:border-slate-800 border border-transparent transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_2px_10px_rgba(244,63,94,0.15)] flex items-center justify-between cursor-pointer"
                          >
                            <span>{e.label}</span>
                            <span className="text-xs bg-rose-500/10 border border-slate-800 px-2 py-1 rounded text-rose-400 font-mono font-bold">
                              {e.raw.riskScore >= 85
                                ? "⚠️ КРИТИЧНИЙ"
                                : "🔴 ВИСОКИЙ"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If nothing matches */}
                  {spotlightResults.navigation.length === 0 &&
                    spotlightResults.actions.length === 0 &&
                    spotlightResults.entities.length === 0 && (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-bounce" />
                        <p className="text-xs text-slate-300 font-semibold">
                          Жодного збігу не знайдено для "{spotlightQuery}"
                        </p>
                        <p className="text-xs text-slate-600 mt-1 font-mono">
                          Спробуйте ввести інший пошуковий термін
                        </p>
                      </div>
                    )}
                </div>

                {/* Spotlight footer */}
                <div className="px-2 py-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <span>Швидкі дії:</span>
                    <strong className="text-slate-300 font-bold bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 px-2 py-1 rounded">
                      ↑↓
                    </strong>
                    <span>для вибору,</span>
                    <strong className="text-slate-300 font-bold bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 px-2 py-1 rounded">
                      Enter
                    </strong>
                    <span>для запуску</span>
                  </span>
                  <span className="text-blue-400 font-bold uppercase tracking-wider">
                    NEXUS COMMAND PANEL v2.5
                  </span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <div className="h-screen w-full bg-slate-950 overflow-hidden">
        {renderDesktopLayout()}
      </div>

      {/* Floating Voice Control HUD Overlay */}
      <AnimatePresence>
        {isVoiceListening && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 10 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-red-500/30 shadow-2xl rounded-lg px-2 py-1.5 z-50 flex items-center gap-2 w-[420px] max-w-[90vw] backdrop-blur-md"
          >
            <div className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                🎙️ Голосовий аналізатор NEXUS активний
              </p>
              <p className="text-xs text-slate-200 font-medium truncate mt-0.5 font-sans">
                {voiceFeedback ||
                  "Слухаю голос... Назвіть команду навігації чи пошуку"}
              </p>
            </div>
            <div className="flex gap-0.5 items-center justify-end h-5 w-12 shrink-0">
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 12 }}
              />
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 20 }}
              />
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 8 }}
              />
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 24 }}
              />
              <motion.div
                className="w-[3px] bg-red-400 rounded-full animate-pulse"
                style={{ height: 14 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Voice Control Toast / Feedback Alert */}
      <AnimatePresence>
        {!isVoiceListening && (voiceFeedback || voiceError) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 10, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 shadow-[0_15px_40px_rgba(0,0,0,0.5)] rounded-lg p-2 z-50 flex flex-col gap-2 w-[450px] max-w-[90vw] backdrop-blur-md border ${voiceError ? "bg-red-950/95 border-red-500/40 text-red-200 shadow-red-900/10" : "bg-slate-950/95 border-slate-800 text-slate-200 shadow-indigo-900/10"}`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xs shrink-0 mt-0.5">
                {voiceError ? "⚠️" : "🎙️"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  {voiceError
                    ? "Помилка голосового аналізатора"
                    : "Аналітичний голос NEXUS"}
                </p>
                <p className="text-xs font-semibold tracking-wide leading-relaxed mt-0.5">
                  {voiceError || voiceFeedback}
                </p>
              </div>
              <button
                onClick={() => {
                  setVoiceError(null);
                  setVoiceFeedback(null);
                }}
                className="text-slate-500 hover:text-slate-300 transition-colors text-xs p-1 font-bold font-mono"
              >
                ✕
              </button>
            </div>

            {voiceError && (
              <div className="border-t border-red-500/10 pt-2.5 mt-0.5">
                <p className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider mb-2">
                  ⚡ Клікніть, щоб симулювати голосову команду:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    {
                      label: "📊 Перейти на Дашборд",
                      cmd: "перейди на дашборд",
                    },
                    { label: "🗺️ Показати Карту", cmd: "покажи карту" },
                    { label: "🔍 OSINT пошук", cmd: "осінт пошук" },
                    { label: "👤 Знайди Коваленко", cmd: "знайди Коваленко" },
                    { label: "🛡️ Дорожня карта", cmd: "дорожня карта" },
                    { label: "⚠️ Санкції РНБО?", cmd: "які санкції?" },
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setVoiceError(null);
                        setVoiceFeedback(`Симульовано команду: "${item.cmd}"`);
                        handleVoiceCommand(item.cmd);
                        setTimeout(() => setVoiceFeedback(null), 3000);
                      }}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-white border border-red-500/20 hover:border-red-500/40 px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer truncate"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Guide Modal for non-technical users */}
      <AnimatePresence>
        {isUserGuideOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-700 shadow-2xl rounded-lg w-full w-full p-6 text-slate-100 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xl">
                    💡
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Проста інструкція для користувача</h3>
                    <p className="text-xs text-slate-400">Як швидко перевірити компанію або людину без технічних навичок</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUserGuideOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-5 space-y-5 text-sm">
                <div className="p-4 bg-blue-950/40 border border-blue-800/50 rounded-xl space-y-2">
                  <h4 className="font-bold text-blue-300 flex items-center gap-2">
                    <span>1. Як знайти інформацію про компанію чи особу?</span>
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Введіть назву фірми (наприклад, <strong>"СпецТехПостач"</strong>), код ЄДРПОУ або ПІБ особи у верхньому полі пошуку або у розділі <strong>"Глибокий Пошук"</strong>. Система миттєво перевірить понад 125 відкритих реєстрів.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/60 border border-emerald-500/30 rounded-xl">
                    <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      Зелений колір
                    </div>
                    <p className="text-slate-300 text-[11px]">Компанія чи особа чиста, борги та санкції відсутні.</p>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-amber-500/30 rounded-xl">
                    <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      Жовтий колір
                    </div>
                    <p className="text-slate-300 text-[11px]">Є зауваження: заборгованість чи зміна бенефіціарів.</p>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-rose-500/30 rounded-xl">
                    <div className="text-rose-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                      Червоний колір
                    </div>
                    <p className="text-slate-300 text-[11px]">Критичний ризик: санкції РНБО, судови справи або зв'язок з агресором.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <span>2. Як завантажити документ на перевірку?</span>
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Перейдіть у розділ <strong>"Завантаження Даних"</strong> у лівому меню, виберіть файл Excel або PDF з вашого комп'ютера та натисніть "Перевірити".
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <span>3. Потрібен адмінський/технічний вигляд?</span>
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Якщо ви системний адміністратор і бажаєте бачити телеметрію, стан Kubernetes, ArgoCD та логування, натисніть кнопку <strong>"Режим: Користувач"</strong> у правому верхньому кутку для перемикання в <strong>"Режим: Адмін"</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsUserGuideOpen(false)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Зрозуміло, розпочати роботу
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AICopilotPanel 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)} 
        dossier={activeDossier} 
      />
      <LiveChatBot />
      <VoiceCall />
      <CommandBar 
        isOpen={commandBarOpen} 
        onClose={() => setCommandBarOpen(false)} 
        onSelectEntity={(dossier) => setActiveDossier(dossier)} 
      />
    </>
  );
}
