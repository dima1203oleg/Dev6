import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Dossier } from "../types";

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (dossier: Dossier) => void;
}

export function CommandBar({ isOpen, onClose, onSelectEntity }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchRes = await fetch("/api/v1/predator/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query, entityType: "AUTO" })
      });

      if (!searchRes.ok) {
        const text = await searchRes.text();
        console.error("Search failed, response text:", text);
        throw new Error("Search failed");
      }
      const dossier = await searchRes.json();
      setIsSearching(false);
      onSelectEntity(dossier);
      onClose();
    } catch (error) {
      console.error("Investigation failed:", error);
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSearch} className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none text-lg"
            placeholder="Search for companies, people, VIN, phone, crypto wallet..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching ? (
             <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
              Enter ↵
            </kbd>
          )}
        </form>
        
        {query.trim().length > 0 && !isSearching && (
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Suggestions
            </div>
            <button 
              className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group"
              onClick={handleSearch}
            >
              <div className="flex items-center text-slate-700 dark:text-slate-300">
                <Search className="w-4 h-4 mr-3 text-slate-400 group-hover:text-indigo-500" />
                <span>Search across databases for <span className="font-semibold text-indigo-600 dark:text-indigo-400">"{query}"</span></span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}
        
        {query.trim().length === 0 && (
           <div className="p-4 text-sm text-slate-500 dark:text-slate-400 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                 <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs">↑</kbd><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs">↓</kbd> Navigate</span>
                 <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs">↵</kbd> Select</span>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
