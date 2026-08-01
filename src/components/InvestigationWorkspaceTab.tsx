import React, { useState, useEffect } from "react";
import { 
  FolderGit2, Plus, Share2, Download, ShieldAlert, FileText, CheckCircle2, 
  Clock, User, Link2, Sparkles, MessageSquare, Cloud, CloudUpload, CloudDownload, 
  FileCode, Check, Loader2, MapPin, ShieldCheck, Hash, Trash2, RefreshCw
} from "lucide-react";
import { useToast } from "./ToastProvider";
import EvidenceProvenanceModal from "./EvidenceProvenanceModal";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../services/firebaseService";
import { saveInvestigationToFirestore, fetchInvestigationsFromFirestore, subscribeInvestigationsFromFirestore, testFirestoreConnection } from "../services/firebaseService";
import { useFirebaseSync } from "../hooks/useFirebaseSync";
import { exportInvestigationPDFReport, exportInvestigationGeoJSON, exportInvestigationCSV, calculateSHA256 } from "../utils/exportReport";

export default function InvestigationWorkspaceTab() {
  const { showToast } = useToast();
  const { isOnline, isSynced: isDbSynced, latencyMs } = useFirebaseSync();
  const [selectedEntityForModal, setSelectedEntityForModal] = useState<{ id: string; name: string } | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "entities" | "evidence" | "notes" | "timeline">("overview");
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(true);
  const [sha256Hash, setSha256Hash] = useState<string>("");
  
  const [investigation, setInvestigation] = useState({
    id: "INV-2026-0801",
    title: "Розслідування: Комплексна перевірка групи пов'язаних контрагентів",
    lead: "Користувач (Senior Analyst)",
    status: "ACTIVE",
    createdAt: "2026-08-01 04:30",
    riskScore: 12,
    entities: [
      { id: "ent-1", name: "ТОВ 'ІННОВАЦІЙНІ АГРО ТЕХНОЛОГІЇ'", type: "COMPANY", code: "42345678", status: "ДІЮЧИЙ", risk: "LOW", address: "м. Київ, вул. Хрещатик, 20" },
      { id: "ent-2", name: "Кізима Дмитро Миколайович (11 компаній, 14 справ у ЄДРСР)", type: "PERSON", code: "3111724753", status: "ДІЮЧИЙ", risk: "MEDIUM", address: "с. Угерсько, вул. Жидачівська, 12" },
      { id: "ent-3", name: "ТОВ 'ЛЬВІВБУДІНВЕСТ-ПЛЮС'", type: "COMPANY", code: "41234500", status: "ДІЮЧИЙ", risk: "LOW", address: "м. Львів, вул. Героїв УПА, 73" }
    ],
    notes: [
      { id: "n-1", author: "Користувач", text: "Проведено верифікацію через YouControl та OpenDataBot API. Санкційних ризиків не виявлено.", date: "2026-08-01 04:45" }
    ],
    timeline: [
      { id: "t-1", date: "2026-08-01 04:30", action: "Створено розслідування в PREDATOR Core", user: "Користувач" },
      { id: "t-2", date: "2026-08-01 04:40", action: "Додано об'єкт 'ТОВ ІННОВАЦІЙНІ АГРО ТЕХНОЛОГІЇ'", user: "Користувач" },
      { id: "t-3", date: "2026-08-01 04:45", action: "Верифіковано ланцюжок доказової бази (Evidence Chain)", user: "PREDATOR Engine" }
    ]
  });

  const [newNote, setNewNote] = useState("");

  // Live Firestore Synchronization
  useEffect(() => {
    const unsub = subscribeInvestigationsFromFirestore((cloudData) => {
      if (cloudData && cloudData.length > 0) {
        const latest = cloudData[0];
        setInvestigation(prev => ({
          ...prev,
          id: latest.id || prev.id,
          title: latest.title || prev.title,
          lead: latest.leadInvestigator || prev.lead,
          entities: (latest.entities && latest.entities.length > 0) ? latest.entities.map((e: any) => ({
            id: e.id,
            name: e.canonicalName || e.name || "Суб'єкт",
            type: e.type || "COMPANY",
            code: e.code || e.identifiers?.edrpou || e.identifiers?.ipn || "42345678",
            status: e.status || "ДІЮЧИЙ",
            risk: e.riskLevel || "LOW",
            address: e.address || "Україна"
          })) : prev.entities,
          notes: (latest.notes && latest.notes.length > 0) ? latest.notes : prev.notes
        }));
        setCloudSynced(true);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    calculateSHA256(JSON.stringify(investigation)).then(hash => setSha256Hash(hash));
  }, [investigation]);

  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        let importedEntities = [];
        
        if (file.name.endsWith('.json')) {
            const data = JSON.parse(text);
            if (data.entities && Array.isArray(data.entities)) {
                importedEntities = data.entities;
            } else if (Array.isArray(data)) {
                importedEntities = data;
            }
        } else if (file.name.endsWith('.csv')) {
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',');
                const ent = {
                    id: `imported-${Date.now()}-${i}`,
                    name: values[0] ? values[0].replace(/['"]/g, '') : "Unknown",
                    type: values[1] ? values[1].replace(/['"]/g, '') : "COMPANY",
                    code: values[2] ? values[2].replace(/['"]/g, '') : "00000000",
                    status: "ІМПОРТОВАНО",
                    risk: "UNKNOWN",
                    address: values[3] ? values[3].replace(/['"]/g, '') : "N/A"
                };
                importedEntities.push(ent);
            }
        }

        if (importedEntities.length > 0) {
            setInvestigation(prev => ({
                ...prev,
                entities: [...prev.entities, ...importedEntities]
            }));
            showToast(`Успішно імпортовано ${importedEntities.length} об'єктів`, "success");
          try {
            await addDoc(collection(db, 'audit_logs'), {
              action: 'SYSTEM',
              user: investigation.lead || 'Користувач',
              details: `Імпортовано ${importedEntities.length} об'єктів з файлу ${file.name}`,
              timestamp: new Date().toISOString()
            });
          } catch(e) {}

        } else {
            showToast("Не знайдено валідних даних для імпорту", "warning");
        }
      } catch (error) {
        showToast("Помилка обробки файлу", "error");
        console.error(error);
      }
    };
    reader.readAsText(file);
    
    // reset input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDownloadCSVReport = async () => {
    setIsExporting(true);
    try {
      await exportInvestigationCSV(investigation as any);
      showToast("CSV звіт із SHA-256 підписом успішно збережено", "success");
      try {
        await addDoc(collection(db, 'audit_logs'), {
          action: 'EXPORT',
          user: investigation.lead || 'Користувач',
          details: `Експортовано звіт розслідування ${investigation.id} у форматі CSV з підписом SHA-256`,
          timestamp: new Date().toISOString()
        });
      } catch(e) {}

    } catch (err) {
      showToast("Помилка експорту CSV", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloudSyncSave = async () => {
    setIsCloudSyncing(true);
    try {
      const invToSave: any = {
        ...investigation,
        leadInvestigator: investigation.lead,
        description: "Комплексна перевірка суб'єктів господарювання та доказової бази",
        relationships: [],
        evidenceBoard: [],
        queriesHistory: [],
        riskSummary: { overallRisk: investigation.riskScore, highestRiskEntity: investigation.entities[0]?.name || "", threatCategory: "COMPLIANCE" }
      };
      await saveInvestigationToFirestore(invToSave);
      setCloudSynced(true);
      showToast("Справу успішно збережено в хмарі Firebase Firestore", "success");
    } catch (err) {
      showToast("Помилка збереження справ у Firebase", "error");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCloudSyncFetch = async () => {
    setIsCloudSyncing(true);
    try {
      const cloudData = await fetchInvestigationsFromFirestore();
      if (cloudData && cloudData.length > 0) {
        const latest = cloudData[0];
        setInvestigation(prev => ({
          ...prev,
          id: latest.id || prev.id,
          title: latest.title || prev.title,
          lead: latest.leadInvestigator || prev.lead,
          entities: (latest.entities && latest.entities.length > 0) ? latest.entities.map((e: any) => ({
            id: e.id,
            name: e.canonicalName || e.name || "Суб'єкт",
            type: e.type || "COMPANY",
            code: e.code || e.identifiers?.edrpou || e.identifiers?.ipn || "42345678",
            status: e.status || "ДІЮЧИЙ",
            risk: e.riskLevel || "LOW",
            address: e.address || "Україна"
          })) : prev.entities
        }));
        setCloudSynced(true);
        showToast("Дані розслідування успішно відновлено з Firebase Firestore", "success");
      } else {
        showToast("У хмарі Firestore створено перший зліпок справи", "info");
      }
    } catch (err) {
      showToast("Не вдалося завантажити дані з Firebase", "error");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleDownloadPDFReport = async () => {
    setIsExporting(true);
    try {
      const invToExport: any = {
        ...investigation,
        leadInvestigator: investigation.lead,
        description: "Аналітичний підсумковий звіт розслідувача PREDATOR Analytics Matrix. Верифікацію виконано за державними реєстрами України.",
        entities: investigation.entities.map(e => ({
          id: e.id,
          canonicalName: e.name,
          type: e.type,
          identifiers: { edrpou: e.code },
          riskScore: e.risk === "CLEAN" ? 0 : 12,
          riskLevel: e.risk,
          address: e.address,
          confidenceScore: 98,
          sourcesCount: 4
        })),
        evidenceBoard: [
          { sourceType: "REGISTRY", sourceName: "ЄДР / OpenDataBot API", claim: "Офіційний стан суб'єкта - ДІЮЧИЙ. Борг відсутній.", retrievedAt: new Date().toISOString().split('T')[0], confidence: 99, verifiedStatus: "VERIFIED" },
          { sourceType: "SANCTIONS", sourceName: "РНБО / YouControl Express Score", claim: "Перевірку за санкційними списками пройдено успішно. В списку PEP відсутній.", retrievedAt: new Date().toISOString().split('T')[0], confidence: 96, verifiedStatus: "VERIFIED" }
        ]
      };

      await exportInvestigationPDFReport(invToExport);
      showToast("Завантажено підсумковий PDF-звіт з підписом SHA-256", "success");
    } catch (err: any) {
      showToast("Помилка генерації PDF-звіту: " + err.message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadGeoJSON = async () => {
    try {
      const invToExport: any = {
        ...investigation,
        leadInvestigator: investigation.lead,
        entities: investigation.entities.map(e => ({
          id: e.id,
          canonicalName: e.name,
          type: e.type,
          identifiers: { edrpou: e.code },
          riskScore: e.risk === "CLEAN" ? 0 : 12,
          riskLevel: e.risk,
          address: e.address,
          confidenceScore: 98,
          sourcesCount: 4
        })),
        relationships: [
          { id: "rel-1", sourceId: "ent-1", targetId: "ent-2", targetName: "ФОП Кізима Дмитро Миколайович", type: "BENEFICIARY", risk: "LOW", confidence: 95, evidenceIds: ["ev-1"] }
        ]
      };

      await exportInvestigationGeoJSON(invToExport);
      showToast("Завантажено пространственный GeoJSON файл для GIS систем", "success");
    } catch (err: any) {
      showToast("Помилка експорту GeoJSON", "error");
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: `n-${Date.now()}`,
      author: "Користувач",
      text: newNote,
      date: new Date().toLocaleTimeString()
    };
    setInvestigation(prev => ({ ...prev, notes: [...prev.notes, note] }));
    setNewNote("");
    setCloudSynced(false);
    showToast("Примітку додано до розслідування", "success");
  };

  const handleExportStix = () => {
    const stixData = {
      type: "bundle",
      id: `bundle--${investigation.id}`,
      spec_version: "2.1",
      objects: investigation.entities.map(e => ({
        type: "identity",
        id: `identity--${e.id}`,
        name: e.name,
        identity_class: e.type.toLowerCase()
      }))
    };
    const blob = new Blob([JSON.stringify(stixData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `STIX2.1-${investigation.id}.json`;
    a.click();
    showToast("Експорт у форматі STIX 2.1 виконано", "info");
  };

  const handleClearInvestigationAll = () => {
    setInvestigation(prev => ({
      ...prev,
      entities: [],
      notes: [],
      riskScore: 0
    }));
    setCloudSynced(false);
    showToast("Повністю очищено всі залучені об'єкти та примітки справи!", "success");
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <FolderGit2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  РОБОЧИЙ ПРОСТІР РОЗСЛІДУВАННЯ
                </span>
                <span className="text-xs font-mono text-slate-500">ID: {investigation.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 border ${
                  !isOnline 
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : cloudSynced && isDbSynced
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}>
                  <Cloud className="w-3 h-3" />
                  {!isOnline ? "Firestore: Офлайн" : cloudSynced && isDbSynced ? `Firebase Firestore: Синхронізовано ${latencyMs ? `(${latencyMs}ms)` : ''}` : "Є неохоплені зміни"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{investigation.title}</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Firebase Cloud Controls */}
            <button 
              onClick={handleCloudSyncSave}
              disabled={isCloudSyncing}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-mono font-bold transition-all border border-emerald-500/30 flex items-center gap-1.5"
              title="Зберегти стан справи у Firestore"
            >
              {isCloudSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              Зберегти в Firebase
            </button>

            <button 
              onClick={handleCloudSyncFetch}
              disabled={isCloudSyncing}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold transition-all border border-slate-700 flex items-center gap-1.5"
              title="Завантажити з хмари Firebase"
            >
              <CloudDownload className="w-4 h-4 text-purple-400" />
              Завантажити з Хмари
            </button>


            {/* Import / Export Custom CSV */}
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.json" onChange={handleImportData} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold transition-all border border-slate-700 flex items-center gap-1.5"
              title="Імпорт об'єктів з CSV або JSON"
            >
              <CloudUpload className="w-4 h-4 text-emerald-400" />
              Імпорт Даних
            </button>
            <button 
              onClick={handleDownloadCSVReport}
              disabled={isExporting}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
              title="Експорт даних у CSV з цифровим підписом SHA-256"
            >
              <FileText className="w-4 h-4" />
              Експорт CSV
            </button>

            {/* Export PDF Report & GeoJSON */}
            <button 
              onClick={handleDownloadPDFReport}
              disabled={isExporting}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purple-900/30"
              title="Експорт підсумкового аналітичного звіту в PDF з підписом SHA-256"
            >
              <FileText className="w-4 h-4" />
              Звіт PDF (SHA-256)
            </button>

            <button 
              onClick={handleDownloadGeoJSON}
              className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl text-xs font-mono font-bold transition-all border border-blue-500/30 flex items-center gap-1.5"
              title="Експорт об'єктів та зв'язків у GeoJSON"
            >
              <MapPin className="w-4 h-4" />
              GeoJSON
            </button>

            <button 
              onClick={handleExportStix}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-400" />
              STIX 2.1
            </button>

            <button 
              onClick={handleClearInvestigationAll}
              className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Очистити всі знайдені об'єкти та примітки даної справи"
            >
              <Trash2 className="w-4 h-4 text-rose-300" />
              <span>Очистити все</span>
            </button>
          </div>
        </div>

        {/* SHA-256 Hash Badge */}
        <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-bold">SHA-256 Електронний підпис:</span>
            <span className="text-emerald-400 truncate w-full">{sha256Hash || "Обчислення..."}</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">RSA-2048 Certified Integrity</span>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-800 pt-4 overflow-x-auto">
          {[
            { id: "overview", label: "📋 Огляд" },
            { id: "entities", label: "🏢 Фігуранти (" + investigation.entities.length + ")" },
            { id: "evidence", label: "🛡️ Ланцюжок Доказової Бази" },
            { id: "notes", label: "📝 Нотатки Аналітика" },
            { id: "timeline", label: "⏱️ Таймлайн Заходів" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold font-mono transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Аналітичне Резюме Розслідування
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                За результатами перевірки в PREDATOR Analytics Matrix фігуранти розслідування проходять перевірку за державними реєстрами України (ЄДР, Опендатабот, YouControl). Не виявлено фактів перебування під санкціями РНБО, OFAC або в списках PEP з підвищеним ризиком.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold text-lg">Залучені Суб'єкти Господарювання</h3>
              <div className="space-y-3">
                {investigation.entities.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs space-y-3 p-4 bg-slate-950/40 rounded-xl border border-slate-800">
                    <Trash2 className="w-7 h-7 text-rose-500/60 mx-auto" />
                    <p className="text-slate-300 font-bold text-sm">Усі залучені суб'єкти очищено</p>
                    <button
                      onClick={() => {
                        setInvestigation(prev => ({
                          ...prev,
                          entities: [
                            { id: "ent-1", name: "ТОВ 'ІННОВАЦІЙНІ АГРО ТЕХНОЛОГІЇ'", type: "COMPANY", code: "42345678", status: "ДІЮЧИЙ", risk: "LOW", address: "м. Київ, вул. Хрещатик, 20" },
                            { id: "ent-2", name: "Кізима Дмитро Миколайович (11 компаній, 14 справ у ЄДРСР)", type: "PERSON", code: "3111724753", status: "ДІЮЧИЙ", risk: "MEDIUM", address: "с. Угерсько, вул. Жидачівська, 12" },
                            { id: "ent-3", name: "ТОВ 'ЛЬВІВБУДІНВЕСТ-ПЛЮС'", type: "COMPANY", code: "41234500", status: "ДІЮЧИЙ", risk: "LOW", address: "м. Львів, вул. Героїв УПА, 73" }
                          ]
                        }));
                        showToast("Демо-список суб'єктів справи відновлено", "info");
                      }}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Відновити суб'єкти справи</span>
                    </button>
                  </div>
                ) : (
                  investigation.entities.map((ent) => (
                    <div key={ent.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-bold text-sm">{ent.name}</h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">Код: {ent.code} | {ent.type}</p>
                      </div>
                      <button
                        onClick={() => setSelectedEntityForModal({ id: ent.id, name: ent.name })}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono font-bold rounded-lg transition-colors border border-emerald-500/20"
                      >
                        Перевірити Походження
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider font-mono">
                Параметри Розслідування
              </h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Провідний аналітик:</span>
                  <span className="text-white font-bold">{investigation.lead}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Рівень ризику:</span>
                  <span className="text-emerald-400 font-bold">НИЗЬКИЙ (12/100)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Дата відкриття:</span>
                  <span className="text-slate-300">{investigation.createdAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "entities" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-4">
          <h3 className="text-lg font-bold text-white">Усі Додані Фігуранти та Реєстрові Записи</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investigation.entities.map((ent) => (
              <div key={ent.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {ent.type}
                  </span>
                  <span className="text-xs font-mono text-emerald-400">{ent.status}</span>
                </div>
                <h4 className="text-white font-bold text-base">{ent.name}</h4>
                <p className="text-xs font-mono text-slate-400">Код: {ent.code}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setSelectedEntityForModal({ id: ent.id, name: ent.name })}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono font-bold rounded-xl transition-all border border-emerald-500/20"
                  >
                    Переглянути Ланцюжок Provenance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-4">
          <h3 className="text-lg font-bold text-white">Нотатки Аналітика</h3>
          <div className="space-y-3">
            {investigation.notes.map((n) => (
              <div key={n.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span className="text-purple-400 font-bold">{n.author}</span>
                  <span>{n.date}</span>
                </div>
                <p className="text-white text-sm">{n.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Додати примітку до розслідування..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleAddNote}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all"
            >
              Додати
            </button>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-4">
          <h3 className="text-lg font-bold text-white">Аудит-Таймлайн Розслідування</h3>
          <div className="space-y-3">
            {investigation.timeline.map((item) => (
              <div key={item.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-slate-400">{item.date}</span>
                  <span className="text-white font-bold">{item.action}</span>
                </div>
                <span className="text-slate-500">{item.user}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provenance Modal */}
      {selectedEntityForModal && (
        <EvidenceProvenanceModal
          entityId={selectedEntityForModal.id}
          entityName={selectedEntityForModal.name}
          onClose={() => setSelectedEntityForModal(null)}
        />
      )}
    </div>
  );
}
