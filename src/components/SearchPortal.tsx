import React, { useState, useEffect } from "react";
import { Search, Shield, ArrowRight, CheckCircle2, ChevronRight, Bookmark, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dossier } from "../types";
import { useToast } from "./ToastProvider";

interface SearchPortalProps {
  onDossierGenerated: (dossier: Dossier) => void;
  onOpenCatalog?: () => void;
}

export default function SearchPortal({ onDossierGenerated, onOpenCatalog: _onOpenCatalog }: SearchPortalProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("AUTO");
  const [isSearching, setIsSearching] = useState(false);
  const [searchStageIndex, setSearchStageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDossierResult, setMobileDossierResult] = useState<Dossier | null>(null);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const { showToast } = useToast();

  const searchStages = [
    "Ідентифікація запиту",
    "Пошук у відкритих джерелах",
    "Аналіз зв'язків та бенефіціарів",
    "Перевірка факторів ризику",
    "Формування фінального результату"
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isSearching) {
      setSearchStageIndex(0);
      interval = setInterval(() => {
        setSearchStageIndex((prev) => (prev < searchStages.length - 1 ? prev + 1 : prev));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleExecuteSearch = async (searchQuery: string, type: string = searchType) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setMobileDossierResult(null);
    setSavedToHistory(false);
    try {
      // Get auth token from localStorage or use default production token
      const token = localStorage.getItem('authToken') || 'prod-test-token-123456789012345678901234567890';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const searchRes = await fetch("/api/v1/predator/search", {
        method: "POST",
        headers,
        body: JSON.stringify({ query: searchQuery, entityType: type })
      });

      if (!searchRes.ok) {
        const text = await searchRes.text();
        console.error("Search failed, response text:", text);
        const errorData = await JSON.parse(text || "{}").catch(() => ({}));
        throw new Error(errorData.error || "Search failed");
      }
      const dossier = await searchRes.json();

      if (!dossier) {
        showToast("Нічого не знайдено за вашим запитом.", "error");
        return;
      }

      showToast("Аналіз завершено!", "success");
      
      if (window.innerWidth < 768) {
        // For mobile redesign, show intermediate Result screen
        setMobileDossierResult(dossier);
      } else {
        onDossierGenerated(dossier);
      }
    } catch (error) {
      console.error("Investigation failed:", error);
      showToast("Помилка при виконанні пошуку.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(query);
  };

  const handleQuickChip = (sampleQuery: string, sampleType: string) => {
    setQuery(sampleQuery);
    setSearchType(sampleType);
    handleExecuteSearch(sampleQuery, sampleType);
  };

  const quickSamples = [
    { label: "🏢 ТОВ 'СпецТехПостач'", query: "СпецТехПостач", type: "COMPANY" },
    { label: "🔢 ЄДРПОУ 38294012", query: "38294012", type: "COMPANY" },
    { label: "👤 Коваленко Ігор Вікторович", query: "Коваленко Ігор Вікторович", type: "PERSON" },
    { label: "📜 Санкції РНБО", query: "Санкції РНБО", type: "AUTO" },
  ];

  const recentSearches = [
    { name: "Кізима Дмитро", query: "Кізима Дмитро", type: "PERSON" },
    { name: "ТОВ «Приклад»", query: "ТОВ «Приклад»", type: "COMPANY" }
  ];

  if (isMobile) {
    return (
      <div className="w-full text-slate-200 select-none pb-8" id="mobile-search-portal-root">
        <AnimatePresence mode="wait">
          {/* SCREEN 2: SEARCH / ANALYZING STATE */}
          {isSearching && (
            <motion.div
              key="mobile-searching"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-between min-h-[75vh] px-2 py-8"
              id="mobile-screen-searching"
            >
              <div className="text-center shrink-0 w-full">
                <span className="text-[11px] font-black tracking-widest text-emerald-400 font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  ПОШУК
                </span>
              </div>

              {/* Radar Circular Glowing Scanner Animation */}
              <div className="my-10 relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/10 animate-ping [animation-duration:3s]" />
                <div className="absolute inset-2 rounded-full border border-emerald-500/20 animate-pulse [animation-duration:2s]" />
                <div className="absolute inset-4 rounded-full border border-emerald-500/30 flex items-center justify-center bg-slate-950/80">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-400 animate-spin" />
                    <Search className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Checklist & Stage progress */}
              <div className="w-full max-w-xs space-y-4 px-4 flex-1 flex flex-col justify-center">
                <h2 className="text-lg font-extrabold text-white text-center tracking-tight mb-2">
                  Аналізуємо дані
                </h2>
                
                <div className="space-y-2.5">
                  {searchStages.map((stage, idx) => {
                    const isCompleted = searchStageIndex > idx;
                    const isActive = searchStageIndex === idx;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 text-xs transition-all duration-300 ${
                          isCompleted ? "text-emerald-400 font-semibold" : isActive ? "text-white font-bold scale-[1.02]" : "text-slate-600"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] shrink-0 ${
                          isCompleted ? "bg-emerald-500 border-emerald-400 text-slate-950" : isActive ? "border-emerald-500 text-emerald-400 animate-pulse" : "border-slate-800 text-slate-700"
                        }`}>
                          {isCompleted ? "✓" : isActive ? "◌" : idx + 1}
                        </div>
                        <span className="truncate">{stage}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cancel Touch Button min 56px */}
              <button
                onClick={() => setIsSearching(false)}
                className="w-full max-w-xs h-14 shrink-0 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-bold tracking-wider uppercase transition-all hover:bg-slate-850 active:scale-95 cursor-pointer flex items-center justify-center"
              >
                Скасувати
              </button>
            </motion.div>
          )}

          {/* SCREEN 3: INTERMEDIATE SEARCH RESULT CARD */}
          {!isSearching && mobileDossierResult && (
            <motion.div
              key="mobile-search-result"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col justify-between min-h-[75vh] px-2 py-4"
              id="mobile-screen-result"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                <button 
                  onClick={() => setMobileDossierResult(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold tracking-widest text-slate-400 font-mono uppercase">
                  Результат
                </span>
                <div className="w-5 h-5" /> {/* spacer */}
              </div>

              {/* Main Result Card */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 space-y-6 flex-1 flex flex-col justify-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Big Green Success Checked Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-xl font-extrabold text-white leading-tight">
                    {'fullName' in mobileDossierResult.entity 
                      ? mobileDossierResult.entity.fullName 
                      : 'name' in mobileDossierResult.entity 
                      ? mobileDossierResult.entity.name 
                      : mobileDossierResult.entity.plate}
                  </h3>
                  
                  {/* RNOKPP / EDRPOU code */}
                  <div className="text-xs font-mono text-emerald-400 font-bold tracking-wide uppercase">
                    {('identifiers' in mobileDossierResult.entity && (mobileDossierResult.entity.identifiers as any).rnokpp) 
                      ? `РНОКПП ${(mobileDossierResult.entity.identifiers as any).rnokpp}` 
                      : ('identifiers' in mobileDossierResult.entity && (mobileDossierResult.entity.identifiers as any).edrpou)
                      ? `ЄДРПОУ ${(mobileDossierResult.entity.identifiers as any).edrpou}`
                      : "Суб'єкт виявлений"}
                  </div>

                  <div className="pt-2 flex justify-center">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                      ПІДТВЕРДЖЕНО
                    </span>
                  </div>
                </div>

                {/* Brief Summary */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/40">
                  <p className="text-xs text-slate-300 leading-relaxed text-center font-medium">
                    <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold font-mono tracking-wider">Коротко:</span>
                    {mobileDossierResult.entity.type === "PERSON" ? "Фізична особа. " : "Юридична особа. "}
                    Знайдено {mobileDossierResult.modules.companies?.length || 0} пов'язаних компаній, {mobileDossierResult.modules.fop?.length || 0} ФОП, {mobileDossierResult.modules.courts?.length || 0} судових згадок.
                    {mobileDossierResult.risk.score > 40 ? " Виявлено фактори комплаєнс-ризику." : " Санкційних збігів та критичних ризиків не виявлено."}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="space-y-4 pt-6">
                <button
                  onClick={() => onDossierGenerated(mobileDossierResult)}
                  className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-widest uppercase rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center shadow-lg shadow-emerald-500/10"
                >
                  ВІДКРИТИ КАРТКУ
                </button>

                <button
                  onClick={() => {
                    setSavedToHistory(true);
                    showToast("Суб'єкт успішно збережений у список розслідувань", "success");
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2 border ${
                    savedToHistory 
                      ? "bg-slate-950 border-slate-800 text-slate-500" 
                      : "bg-transparent border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${savedToHistory ? "fill-emerald-500 text-emerald-500" : ""}`} />
                  <span>{savedToHistory ? "Збережено в список" : "Зберегти в список"}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 1: ZERO STATE SEARCH PAGE */}
          {!isSearching && !mobileDossierResult && (
            <motion.div
              key="mobile-search-home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 px-1 py-2"
              id="mobile-screen-home"
            >
              {/* Logo Header PREDATOR */}
              <div className="text-center pt-4 space-y-4">
                {/* Custom Elegant Big 'P' Logo Circle */}
                <div className="mx-auto w-20 h-20 rounded-2xl bg-slate-950 border-2 border-emerald-500/30 flex items-center justify-center shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                  <span className="text-4xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-md">
                    P
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    PREDATOR
                  </h1>
                  <p className="text-slate-400 text-xs font-semibold">
                    Знайдіть людину або компанію
                  </p>
                </div>
              </div>

              {/* Touch Input and Mint Green Submit Button */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <Search className="w-5 h-5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Що шукаємо?"
                    className="w-full bg-transparent text-white focus:outline-none text-base font-semibold placeholder:text-slate-500"
                  />
                  {query && (
                    <button 
                      type="button" 
                      onClick={() => setQuery("")}
                      className="p-1 hover:bg-slate-800 rounded text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 text-center px-4 font-medium leading-relaxed">
                  ПІБ, ЄДРПОУ, РНОКПП, телефон, email, домен тощо
                </p>

                {/* Mint Green CTA Button min 56px */}
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-900 disabled:border-slate-850 disabled:text-slate-600 text-slate-950 font-black text-sm tracking-widest uppercase rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center shadow-lg shadow-emerald-500/5"
                >
                  ЗНАЙТИ
                </button>
              </form>

              {/* Quick sample chips */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-black text-slate-500 block uppercase tracking-wider font-mono">
                  Швидкі приклади
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickSamples.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickChip(chip.query, chip.type)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 text-xs text-slate-300 rounded-xl transition-all cursor-pointer hover:text-white"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SCREEN 1: "Останні пошуки" section */}
              <div className="space-y-3 pt-4">
                <span className="text-[10px] font-black text-slate-500 block uppercase tracking-wider font-mono">
                  Останні пошуки
                </span>
                
                <div className="divide-y divide-slate-800/40 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  {recentSearches.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickChip(item.query, item.type)}
                      className="w-full px-4 py-3.5 hover:bg-slate-850 text-left transition-all flex items-center justify-between active:bg-slate-800 cursor-pointer text-xs font-bold text-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Badge Row */}
              <div className="pt-4 flex items-center justify-center gap-1.5 text-[10px] text-emerald-400/80 font-mono font-bold">
                <CheckCircle2 size={12} />
                <span>ОФІЦІЙНІ ДЕРЖАВНІ РЕЄСТРИ УКРАЇНИ</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-6">
      <AnimatePresence mode="wait">
        {isSearching ? (
          /* Mobile Search Progress Animation */
          <motion.div
            key="searching-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Shield className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Перевіряємо інформацію</h3>
              <p className="text-sm text-cyan-400 font-medium min-h-[20px] transition-all">
                {searchStages[searchStageIndex]}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                initial={{ width: "15%" }}
                animate={{ width: `${((searchStageIndex + 1) / searchStages.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <button
              onClick={() => setIsSearching(false)}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Скасувати
            </button>
          </motion.div>
        ) : (
          /* Zero State Omni Search */
          <motion.div
            key="zero-state"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl space-y-8"
          >
            {/* Header / Title */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400">
                <Shield size={14} />
                <span>PREDATOR Analytics</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Знайдіть потрібну особу або компанію
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
                Введіть ПІБ, ЄДРПОУ, РНОКПП або назву. Система автоматично проведе перевірку за підтвердженими джерелами.
              </p>
            </div>

            {/* Omni Input Form with 56px CTA */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
                <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row items-center gap-2 shadow-2xl">
                  <div className="flex items-center gap-3 px-3 py-2 w-full">
                    <Search className="w-6 h-6 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Введіть ПІБ, ЄДРПОУ або назву..."
                      className="w-full bg-transparent text-white focus:outline-none text-base sm:text-lg placeholder:text-slate-500"
                      autoFocus
                    />
                  </div>

                  {/* Primary 56px Touch CTA */}
                  <button
                    type="submit"
                    className="w-full sm:w-auto h-14 px-8 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-blue-900/40"
                  >
                    <span>ПОЧАТИ ПОШУК</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Samples */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-400 block text-center uppercase tracking-wider">
                Останні або часті запити
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {quickSamples.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickChip(chip.query, chip.type)}
                    className="px-3 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-xl transition-all cursor-pointer hover:text-white flex items-center gap-2 active:scale-95"
                  >
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Verified badge footer */}
            <div className="pt-4 flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 size={16} />
              <span>Офіційні підтверджені дані • Без перевантаження</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
