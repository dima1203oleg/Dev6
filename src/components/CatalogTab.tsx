/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SOLUTIONS } from '../data';
import { OpenSourceSolution } from '../types';
import { MASTER_REGISTRY_CATALOG, RegistrySourceItem } from '../data/masterRegistryCatalogData';
import { 
  Search, Shield, CheckCircle2, Cpu, HelpCircle, 
  Sliders, RefreshCw, Database, ExternalLink,
  BarChart2, Award, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CatalogTab() {
  const [activeCatalogMode, setActiveCatalogMode] = useState<'master-registries' | 'opensource-tech'>('master-registries');

  // Master Registry Filter States
  const [registrySearch, setRegistrySearch] = useState('');
  const [selectedContour, setSelectedContour] = useState<string>('all');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('all');
  const [sortByPriority, setSortByPriority] = useState<boolean>(true);
  const [selectedRegistry, setSelectedRegistry] = useState<RegistrySourceItem | null>(null);
  const [showPreflightDrawer, setShowPreflightDrawer] = useState<boolean>(false);

  // Open Source Solutions Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLicenseType, setSelectedLicenseType] = useState<string>('all');

  // Dynamic compatibility simulator state for Open Source
  const [weights, setWeights] = useState({
    functional: 30,
    security: 20,
    license: 25,
    stack: 15,
    community: 10,
  });

  const categories = ['all', ...Array.from(new Set(SOLUTIONS.map(s => s.category)))];
  const licenseTypes = ['all', ...Array.from(new Set(SOLUTIONS.map(s => s.licenseType)))];

  const authorities = ['all', ...Array.from(new Set(MASTER_REGISTRY_CATALOG.map(r => r.authority)))];

  // Master Registry Filter Logic
  const filteredRegistries = MASTER_REGISTRY_CATALOG.filter(reg => {
    const matchesSearch = reg.name.toLowerCase().includes(registrySearch.toLowerCase()) ||
                          reg.id.toLowerCase().includes(registrySearch.toLowerCase()) ||
                          reg.authority.toLowerCase().includes(registrySearch.toLowerCase()) ||
                          (reg.entities && reg.entities.some(e => e.toLowerCase().includes(registrySearch.toLowerCase())));
    const matchesContour = selectedContour === 'all' || reg.contour === selectedContour;
    const matchesAuthority = selectedAuthority === 'all' || reg.authority === selectedAuthority;
    return matchesSearch && matchesContour && matchesAuthority;
  }).sort((a, b) => {
    if (sortByPriority) {
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    }
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  // Count metrics by contour
  const contourStats = {
    A: MASTER_REGISTRY_CATALOG.filter(r => r.contour === 'A').length,
    B: MASTER_REGISTRY_CATALOG.filter(r => r.contour === 'B').length,
    C: MASTER_REGISTRY_CATALOG.filter(r => r.contour === 'C').length,
    D: MASTER_REGISTRY_CATALOG.filter(r => r.contour === 'D').length,
  };

  const handleResetWeights = () => {
    setWeights({
      functional: 30,
      security: 20,
      license: 25,
      stack: 15,
      community: 10,
    });
  };

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const getDynamicScore = (solution: OpenSourceSolution) => {
    const funcBase = solution.id === 'opensanctions' || solution.id === 'qdrant' || solution.id === 'vllm' || solution.id === 'doctr' ? 10 : 9;
    const secBase = solution.securityRating === 'A' ? 10 : 8;
    const licBase = solution.licenseType === 'Permissive' ? 10 : solution.licenseType === 'Commercial' ? 7 : solution.licenseType === 'Weak Copyleft' ? 8 : 6;
    const stackBase = solution.id === 'qdrant' || solution.id === 'bbot' || solution.id === 'vllm' ? 10 : 9;
    const commBase = solution.id === 'neo4j' || solution.id === 'opensearch' || solution.id === 'airbyte' ? 10 : 8;

    const totalWeight = weights.functional + weights.security + weights.license + weights.stack + weights.community;
    if (totalWeight === 0) return 0;

    const calculated = 
      (funcBase * weights.functional + 
       secBase * weights.security + 
       licBase * weights.license + 
       stackBase * weights.stack + 
       commBase * weights.community) / (totalWeight / 10);

    return Math.round(calculated * 10) / 10;
  };

  const filteredSolutions = SOLUTIONS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.role?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesLicense = selectedLicenseType === 'all' || s.licenseType === selectedLicenseType;
    return matchesSearch && matchesCategory && matchesLicense;
  });

  const getContourBadgeColor = (contour: string) => {
    switch (contour) {
      case 'A': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'B': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'C': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'D': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getPriorityScoreColor = (score?: number) => {
    const val = score || 0;
    if (val >= 25) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val >= 20) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (val >= 15) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  const getSecurityBadgeColor = (rating: 'A' | 'B' | 'C' | 'D') => {
    switch (rating) {
      case 'A': return 'bg-emerald-500/10 text-emerald-400 border-slate-800';
      case 'B': return 'bg-blue-500/10 text-blue-400 border-slate-800';
      case 'C': return 'bg-amber-500/10 text-amber-400 border-slate-800';
      default: return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const getLicenseBadgeColor = (type: string) => {
    switch (type) {
      case 'Permissive': return 'bg-emerald-500/10 text-emerald-400 border-slate-800';
      case 'Weak Copyleft': return 'bg-blue-500/10 text-blue-400 border-slate-800';
      case 'Strong Copyleft': return 'bg-amber-500/10 text-amber-400 border-slate-800';
      case 'Source Available': return 'bg-blue-500/10 text-blue-400 border-slate-800';
      default: return 'bg-rose-500/10 text-rose-400 border-slate-800';
    }
  };

  return (
    <div className="space-y-6" id="catalog-tab-root">
      {/* Catalog Mode Selector Bar */}
      <div className="glass-panel-premium border-slate-800 rounded-2xl p-2.5 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Центр Реєстрів та Екосистеми PREDATOR
            </h2>
            <p className="text-xs text-slate-400">
              Повна карта 177 державних реєстрів України та каталог Open Source технологій.
            </p>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            id="toggle-master-catalog-btn"
            onClick={() => setActiveCatalogMode('master-registries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeCatalogMode === 'master-registries'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Майстер-каталог (177 Реєстрів)
          </button>
          <button
            id="toggle-opensource-tech-btn"
            onClick={() => setActiveCatalogMode('opensource-tech')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeCatalogMode === 'opensource-tech'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Open Source Стек (NEXUS Engine)
          </button>
        </div>
      </div>

      {/* ==================== MODE 1: MASTER REGISTRY CATALOG (177 SOURCES) ==================== */}
      {activeCatalogMode === 'master-registries' && (
        <div className="space-y-6">
          {/* Metrics & Contour Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">Всього Джерел</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-white">{MASTER_REGISTRY_CATALOG.length}</span>
                <span className="text-xs text-emerald-400 font-mono">100% покриття</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedContour(selectedContour === 'A' ? 'all' : 'A')}
              className={`border rounded-2xl p-3 text-left transition-all ${
                selectedContour === 'A' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-emerald-400">Contour A (State/UA)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-emerald-300">{contourStats.A}</span>
                <span className="text-xs text-slate-400">Безкоштовно</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedContour(selectedContour === 'B' ? 'all' : 'B')}
              className={`border rounded-2xl p-3 text-left transition-all ${
                selectedContour === 'B' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-blue-400">Contour B (Global/Int)</span>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-blue-300">{contourStats.B}</span>
                <span className="text-xs text-slate-400">Міжнародні</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedContour(selectedContour === 'C' ? 'all' : 'C')}
              className={`border rounded-2xl p-3 text-left transition-all ${
                selectedContour === 'C' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-amber-400">Contour C (OSINT/Cyber)</span>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-amber-300">{contourStats.C}</span>
                <span className="text-xs text-slate-400">Кіберіндекси</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedContour(selectedContour === 'D' ? 'all' : 'D')}
              className={`border rounded-2xl p-3 text-left transition-all ${
                selectedContour === 'D' ? 'bg-purple-500/10 border-purple-500/50' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-purple-400">Contour D (Commercial)</span>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-purple-300">{contourStats.D}</span>
                <span className="text-xs text-slate-400">Обмежені</span>
              </div>
            </button>
          </div>

          {/* Filter Bar & Controls */}
          <div className="glass-panel-premium border-slate-800 rounded-2xl p-3 space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="master-registry-search-input"
                  type="text"
                  placeholder="Пошук за назвою, кодом, органом чи сутністю..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  className="input-premium pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full placeholder:text-slate-500"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  id="contour-filter-select"
                  value={selectedContour}
                  onChange={(e) => setSelectedContour(e.target.value)}
                  className="input-premium px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Усі контури (A-D)</option>
                  <option value="A">Contour A — Українські Державні</option>
                  <option value="B">Contour B — Міжнародні Корпоративні</option>
                  <option value="C">Contour C — Кібер, OSINT & Тенета</option>
                  <option value="D">Contour D — Комерційні / Спеціальні</option>
                </select>

                <select
                  id="authority-filter-select"
                  value={selectedAuthority}
                  onChange={(e) => setSelectedAuthority(e.target.value)}
                  className="input-premium px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px] truncate"
                >
                  <option value="all">Усі розпорядники ({authorities.length - 1})</option>
                  {authorities.filter(a => a !== 'all').map(auth => (
                    <option key={auth} value={auth}>{auth}</option>
                  ))}
                </select>

                <button
                  id="sort-priority-toggle-btn"
                  onClick={() => setSortByPriority(!sortByPriority)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    sortByPriority
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  {sortByPriority ? 'Сортування: Пріоритет' : 'Сортування: ID'}
                </button>

                <button
                  id="preflight-checklist-btn"
                  onClick={() => setShowPreflightDrawer(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  Pre-flight Чеклист
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
              <span>Відображено: <strong className="text-white font-mono">{filteredRegistries.length}</strong> з {MASTER_REGISTRY_CATALOG.length} державних реєстрів</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Формула пріоритету: Score = BV + CA + AUT + FREE + DU + EC - IC - LR - COST
              </span>
            </div>
          </div>

          {/* Registries Grid */}
          {filteredRegistries.length === 0 ? (
            <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 text-xs font-medium">Реєстрів за заданими критеріями не знайдено</p>
              <p className="text-slate-600 text-xs mt-1">Спробуйте скинути фільтр контурів або пошуковий запит</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="master-registries-grid">
              {filteredRegistries.map((registry) => {
                return (
                  <motion.div
                    key={registry.id}
                    layoutId={`registry-card-${registry.id}`}
                    onClick={() => setSelectedRegistry(registry)}
                    className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                    whileHover={{ y: -2 }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {registry.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${getContourBadgeColor(registry.contour)}`}>
                            CONTOUR {registry.contour}
                          </span>
                          <span className={`text-[10px] font-mono font-bold border px-2 py-0.5 rounded-full ${getPriorityScoreColor(registry.priorityScore)}`}>
                            Score: {registry.priorityScore}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors leading-snug">
                        {registry.name}
                      </h3>

                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        🏛️ {registry.authority}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 space-y-2 text-[11px]">
                      <div className="grid grid-cols-2 gap-1 text-slate-400">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-mono">Доступ</span>
                          <span className="text-slate-300 font-medium truncate block">{registry.accessLevel}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-mono">Формат</span>
                          <span className="text-slate-300 font-medium truncate block">{registry.format}</span>
                        </div>
                      </div>

                      {/* Mini Score Metrics Bar */}
                      <div className="flex items-center justify-between bg-black/30 p-1.5 rounded-lg border border-slate-800/60 text-[10px]">
                        <span className="text-slate-400">BV: <strong className="text-emerald-400 font-mono">{registry.bv}</strong>/5</span>
                        <span className="text-slate-400">CA: <strong className="text-blue-400 font-mono">{registry.ca}</strong>/5</span>
                        <span className="text-slate-400">AUT: <strong className="text-amber-400 font-mono">{registry.aut}</strong>/5</span>
                        <span className="text-blue-400 font-medium flex items-center gap-0.5 group-hover:underline">
                          Детальніше &rarr;
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODE 2: OPEN SOURCE TECH STACK ==================== */}
      {activeCatalogMode === 'opensource-tech' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Side Filters & Dynamic Compatibility Weighting Simulator */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filtering Card */}
            <div className="glass-panel-premium border-slate-800 rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Пошук та Фільтри</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="tech-search-input"
                  type="text"
                  placeholder="Пошук рішення..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-premium pl-9 pr-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">Категорія</label>
                <select
                  id="tech-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-premium px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                >
                  <option value="all">Усі домени ({SOLUTIONS.length})</option>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">Тип ліцензії</label>
                <select
                  id="tech-license-select"
                  value={selectedLicenseType}
                  onChange={(e) => setSelectedLicenseType(e.target.value)}
                  className="input-premium px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                >
                  <option value="all">Усі ліцензії</option>
                  {licenseTypes.filter(l => l !== 'all').map(lic => (
                    <option key={lic} value={lic}>{lic}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Weight Simulator Card */}
            <div className="glass-panel-premium border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Ваги сумісності
                </h3>
                <button
                  onClick={handleResetWeights}
                  className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  скинути
                </button>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Зрілість функцій</span>
                    <span className="text-emerald-400 font-medium">{weights.functional}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={weights.functional}
                    onChange={(e) => handleWeightChange('functional', parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-2xl appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Безпека & Стійкість</span>
                    <span className="text-emerald-400 font-medium">{weights.security}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={weights.security}
                    onChange={(e) => handleWeightChange('security', parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-2xl appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Юридична свобода</span>
                    <span className="text-emerald-400 font-medium">{weights.license}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={weights.license}
                    onChange={(e) => handleWeightChange('license', parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-2xl appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Solutions Grid */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-300">
                Знайдено <span className="text-blue-400 font-mono font-semibold">{filteredSolutions.length}</span> стек-рішень
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="tech-solutions-grid">
              {filteredSolutions.map((sol) => {
                const dynamicScore = getDynamicScore(sol);
                return (
                  <motion.div
                    key={sol.id}
                    className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                    whileHover={{ y: -2 }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full">
                            {sol.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-200 group-hover:text-white mt-1.5 flex items-center gap-1.5">
                            {sol.name}
                            {sol.productionReady?.startsWith('Tak') && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            )}
                          </h3>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs text-slate-500 uppercase font-mono block">Сумісність</span>
                          <span className={`text-base font-mono font-bold ${dynamicScore >= 90 ? 'text-emerald-400' : dynamicScore >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                            {dynamicScore}
                          </span>
                          <span className="text-xs text-slate-600 font-mono">/100</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {sol.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/50">
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <span className={`border px-2 py-0.5 rounded-md ${getLicenseBadgeColor(sol.licenseType || 'Unknown')}`}>
                          {sol.license}
                        </span>
                        <span className={`border px-2 py-0.5 rounded-md ${getSecurityBadgeColor(sol.securityRating || 'D')}`}>
                          Безпека: {sol.securityRating}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MASTER REGISTRY DETAIL MODAL ==================== */}
      <AnimatePresence>
        {selectedRegistry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md" onClick={() => setSelectedRegistry(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      ID: {selectedRegistry.id}
                    </span>
                    <span className={`text-xs font-bold border px-2 py-0.5 rounded-full ${getContourBadgeColor(selectedRegistry.contour)}`}>
                      CONTOUR {selectedRegistry.contour}
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Пріоритет: {selectedRegistry.priority}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white leading-snug">
                    {selectedRegistry.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    🏛️ {selectedRegistry.authority}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Пріоритет Score</span>
                  <span className={`text-2xl font-mono font-bold ${getPriorityScoreColor(selectedRegistry.priorityScore)}`}>
                    {selectedRegistry.priorityScore}
                  </span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4 overflow-y-auto text-xs text-slate-300">
                {/* Priority Matrix Scores Breakdown */}
                <div className="bg-black/40 border border-slate-800 rounded-xl p-3 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4" />
                    Матриця Пріоритезації (Priority Scoring Engine)
                  </h4>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center pt-1">
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">BV (Value)</span>
                      <strong className="text-emerald-400 text-sm font-mono">{selectedRegistry.bv}/5</strong>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">CA (Coverage)</span>
                      <strong className="text-blue-400 text-sm font-mono">{selectedRegistry.ca}/5</strong>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">AUT (Automation)</span>
                      <strong className="text-amber-400 text-sm font-mono">{selectedRegistry.aut}/5</strong>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">FREE (Zero-Cost)</span>
                      <strong className="text-emerald-300 text-sm font-mono">+{selectedRegistry.free}</strong>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">DU (Uniqueness)</span>
                      <strong className="text-purple-400 text-sm font-mono">+{selectedRegistry.du}</strong>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">COST (Penalty)</span>
                      <strong className="text-rose-400 text-sm font-mono">-{selectedRegistry.cost}</strong>
                    </div>
                  </div>
                </div>

                {/* Technical Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wide text-[10px]">Рівень Доступу</span>
                    <p className="text-slate-200">{selectedRegistry.accessLevel}</p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wide text-[10px]">Рівень Автоматизації</span>
                    <p className="text-slate-200">{selectedRegistry.automationLevel}</p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wide text-[10px]">Формат Даних</span>
                    <p className="text-slate-200">{selectedRegistry.format}</p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wide text-[10px]">Офіційне Джерело URL</span>
                    <a
                      href={selectedRegistry.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 truncate"
                    >
                      {selectedRegistry.officialUrl}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Target Entities Covered */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <span className="text-slate-400 font-semibold block uppercase tracking-wide text-[10px]">Сутності Пошуку (Entities Covered)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRegistry.entities.map((entity, i) => (
                      <span key={i} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Automatic Action Recommendation */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 space-y-1.5">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Автономна Рекомендація Дії (Connector Action)
                  </h4>
                  <p className="text-xs text-slate-200 font-semibold">
                    {selectedRegistry.automaticAction}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Джерело відповідає політиці безперервного збору PREDATOR OS. Оновлення синхронізуються за допомогою асинхронних Celery/Redis задач та підключаються через універсальний Connector Framework.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedRegistry(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  Закрити
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== PRE-FLIGHT CHECKLIST DRAWER ==================== */}
      <AnimatePresence>
        {showPreflightDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md" onClick={() => setShowPreflightDrawer(false)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  PREDATOR System Production Pre-flight Checklist (177 Sources Ready)
                </h3>
                <button
                  onClick={() => setShowPreflightDrawer(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 text-xs text-slate-300">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-300">Пріоритет #1: 95 Безкоштовних Реєстрів (Contour A) впроваджено</h4>
                    <p className="text-slate-300 mt-1">
                      Усі 95 наборів відкритих даних Мінʼюсту, ДПС, Судової влади, НАЗК, Прозорро та органів ліцензування інтегровані через автоматичні парсери ZIP/XML/JSON та оновлюються за розкладом.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-300">Пріоритет #2: Contour B (Public Web Scrapers) захищено від блокувань</h4>
                    <p className="text-slate-300 mt-1">
                      42 веб-скрапери офіційних порталів використовують автономний ротатор проксі, headless-браузери Playwright та кешування Snapshots для мінімізації навантаження на держсервери.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-300">Пріоритет #3: Contour C (Авторизовані API та КЕП)</h4>
                    <p className="text-slate-300 mt-1">
                      Шлюзи авторизованого доступу до ЄДРПОУ API, ДРРП та податкових кабінетів готові до роботи з апаратними токенами КЕП/ЕЦП та сертифікованими каналами КСЗІ.
                    </p>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-purple-300">Пріоритет #4: Contour D (Calculated Graph & OSINT Index)</h4>
                    <p className="text-slate-300 mt-1">
                      Автоматичний розрахунок аналітичних індексів (History Diff, PEP Risk Engine, Neo4j Graph Intelligence, Breach Index, Sanctions Match) працює безперервно у фоновому режимі.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowPreflightDrawer(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-xl text-xs font-semibold"
                >
                  Зрозуміло
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
