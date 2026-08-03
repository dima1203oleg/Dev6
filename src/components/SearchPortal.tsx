import React, { useState } from "react";
import { Search, Globe, User, Briefcase, Truck, Shield, Sparkles, Landmark, Database } from "lucide-react";
import { motion } from "motion/react";
import { Dossier } from "../types";
import { useToast } from "./ToastProvider";

interface SearchPortalProps {
  onDossierGenerated: (dossier: Dossier) => void;
}

export default function SearchPortal({ onDossierGenerated }: SearchPortalProps) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("AUTO");
  const [isSearching, setIsSearching] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Step 1: Integrated Intelligence Search & Dossier Generation
      const searchRes = await fetch("/api/v2/intelligence/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, type: searchType }),
      });

      if (!searchRes.ok) throw new Error("Search failed");
      const dossier = await searchRes.json();

      if (!dossier) {
        showToast("Нічого не знайдено за вашим запитом.", "error");
        return;
      }

      showToast("Досьє сформовано успішно!", "success");
      onDossierGenerated(dossier);
    } catch (error) {
      console.error("Investigation failed:", error);
      showToast("Помилка при проведенні розслідування.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const types = [
    { id: "PERSON", label: "Фізична особа", icon: User },
    { id: "COMPANY", label: "Юридична особа", icon: Landmark },
    { id: "FOP", label: "ФОП", icon: Briefcase },
    { id: "VEHICLE", label: "Автомобіль", icon: Truck },
    { id: "AUTO", label: "Автоматично", icon: Sparkles },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter text-slate-100 sm:text-6xl">
            DEV6 <span className="text-blue-500">INTELLIGENCE</span> OS
          </h1>
          <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
            Professional Evidence-Based Investigation System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="pl-4 text-slate-500">
              <Search size={24} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введіть ПІБ, ЄДРПОУ, назву компанії, ФОП, номер авто або інший ідентифікатор"
              className="w-full p-6 bg-transparent text-slate-100 focus:outline-none text-lg placeholder:text-slate-600"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSearching}
              className="m-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "ЗНАЙТИ"
              )}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {types.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSearchType(type.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  searchType === type.id
                    ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                    : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-8 flex justify-center gap-4 text-xs font-mono text-slate-600">
          <div className="flex items-center gap-1">
            <Shield size={12} />
            <span>REAL DATA ONLY</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Globe size={12} />
            <span>EXTERNAL CONNECTORS ACTIVE</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Database size={12} />
            <span>EVIDENCE-FIRST</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
