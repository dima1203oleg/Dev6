/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Map as MapIcon, Globe, Compass, MapPin, Activity, ShieldAlert, TrendingUp, 
  Layers, Search, Briefcase, User, Terminal, ArrowRight, RefreshCw, 
  Zap, CheckCircle, Sliders, Eye, EyeOff, AlertTriangle, Sparkles, Navigation,
  ExternalLink, Key, Info, Check, MapPinOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapsTabProps {
  onSelectEntityGlobal?: (entity: OsintEntity) => void;
}

interface MapLocation {
  id: string;
  name: string;
  city: string;
  sector: string;
  x: number; // Ukraine SVG view coordinate
  y: number; // Ukraine SVG view coordinate
  kyivX?: number; // Kyiv inset coordinate
  kyivY?: number; // Kyiv inset coordinate
  lat: number;
  lng: number;
  address: string;
  riskScore: number;
  status: 'ACTIVE' | 'LIQUIDATED' | 'SANCTIONED' | 'SUSPICIOUS';
}

const MAP_LOCATIONS: Record<string, MapLocation> = {
  'comp-1': {
    id: 'comp-1',
    name: "ТОВ 'СпецТехПостач'",
    city: 'Київ',
    sector: 'Центральний сектор',
    x: 270,
    y: 100,
    kyivX: 235,
    kyivY: 85,
    lat: 50.4475,
    lng: 30.5375,
    address: "вул. Михайла Грушевського, 15, Київ",
    riskScore: 94,
    status: 'SANCTIONED'
  },
  'person-1': {
    id: 'person-1',
    name: 'Коваленко Ігор Вікторович',
    city: 'Козин',
    sector: 'Київська область',
    x: 285,
    y: 120,
    kyivX: 275,
    kyivY: 125,
    lat: 50.2178,
    lng: 30.6865,
    address: 'смт Козин, вул. Старокиївська, 72',
    riskScore: 82,
    status: 'SUSPICIOUS'
  },
  'comp-2': {
    id: 'comp-2',
    name: "ТОВ 'Арсенал Сек'юріті'",
    city: 'Львів',
    sector: 'Західний сектор',
    x: 95,
    y: 115,
    lat: 49.8335,
    lng: 23.9982,
    address: 'вул. Героїв УПА, 73, Львів',
    riskScore: 45,
    status: 'ACTIVE'
  },
  'wallet-1': {
    id: 'wallet-1',
    name: 'BTC Wallet / Node',
    city: 'Одеса (Серверний вузол)',
    sector: 'Південний сектор',
    x: 420,
    y: 70,
    lat: 46.4825,
    lng: 30.7233,
    address: 'вул. Дерибасівська, 1, Одеса',
    riskScore: 89,
    status: 'SUSPICIOUS'
  }
};

// Sub-component for Google Map Markers with InfoWindow anchor pattern
function LocationMarker({ 
  loc, 
  isSelected, 
  onSelect,
  onSelectEntityGlobal 
}: { 
  key?: string;
  loc: MapLocation; 
  isSelected: boolean; 
  onSelect: (id: string) => void;
  onSelectEntityGlobal?: (entity: OsintEntity) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (isSelected) {
      setInfoOpen(true);
    }
  }, [isSelected]);

  const pinColor = loc.riskScore >= 75 ? '#f43f5e' : loc.riskScore >= 50 ? '#f59e0b' : '#10b981';
  const entity = OSINT_ENTITIES.find(e => e.id === loc.id);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: loc.lat, lng: loc.lng }}
        title={loc.name}
        onClick={() => {
          onSelect(loc.id);
          setInfoOpen(!infoOpen);
        }}
      >
        <Pin 
          background={pinColor} 
          borderColor="#020617" 
          glyphColor="#ffffff"
          scale={isSelected ? 1.3 : 1.0}
        />
      </AdvancedMarker>

      {infoOpen && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="p-2 max-w-xs font-sans text-slate-900">
            <div className="flex items-center justify-between gap-2 mb-1.5 border-b pb-1">
              <span className="font-bold text-xs uppercase tracking-tight text-slate-800">{loc.city}</span>
              <span 
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: pinColor }}
              >
                {loc.riskScore}% Ризик
              </span>
            </div>
            <h4 className="font-bold text-sm leading-tight text-slate-950 mb-1">{loc.name}</h4>
            <p className="text-xs text-slate-600 mb-2 font-mono">{loc.address}</p>
            {entity && onSelectEntityGlobal && (
              <button
                onClick={() => onSelectEntityGlobal(entity)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1 px-2 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Activity className="w-3 h-3" />
                <span>Досьє в ШІ-Ядрі</span>
              </button>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

// Sub-component for Google Maps view controller
function MapController({ selectedLoc }: { selectedLoc?: MapLocation }) {
  const map = useMap();
  useEffect(() => {
    if (map && selectedLoc) {
      map.panTo({ lat: selectedLoc.lat, lng: selectedLoc.lng });
      map.setZoom(13);
    }
  }, [map, selectedLoc]);
  return null;
}

// Sub-component for Google Maps Polylines & Connection Vectors
function MapVectorOverlay({ showRoutes, showFlows }: { showRoutes: boolean; showFlows: boolean }) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;

    const polylines: google.maps.Polyline[] = [];

    if (showRoutes) {
      // Kyiv to Kozyn
      const poly1 = new mapsLib.Polyline({
        path: [
          { lat: MAP_LOCATIONS['comp-1'].lat, lng: MAP_LOCATIONS['comp-1'].lng },
          { lat: MAP_LOCATIONS['person-1'].lat, lng: MAP_LOCATIONS['person-1'].lng }
        ],
        geodesic: true,
        strokeColor: '#f43f5e',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map
      });
      polylines.push(poly1);
    }

    if (showFlows) {
      // Kyiv to Odesa BTC Node
      const poly2 = new mapsLib.Polyline({
        path: [
          { lat: MAP_LOCATIONS['comp-1'].lat, lng: MAP_LOCATIONS['comp-1'].lng },
          { lat: MAP_LOCATIONS['wallet-1'].lat, lng: MAP_LOCATIONS['wallet-1'].lng }
        ],
        geodesic: true,
        strokeColor: '#f59e0b',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        map
      });

      // Kyiv to Lviv
      const poly3 = new mapsLib.Polyline({
        path: [
          { lat: MAP_LOCATIONS['comp-1'].lat, lng: MAP_LOCATIONS['comp-1'].lng },
          { lat: MAP_LOCATIONS['comp-2'].lat, lng: MAP_LOCATIONS['comp-2'].lng }
        ],
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        map
      });

      polylines.push(poly2, poly3);
    }

    return () => {
      polylines.forEach(p => p.setMap(null));
    };
  }, [map, mapsLib, showRoutes, showFlows]);

  return null;
}

export default function MapsTab({ onSelectEntityGlobal }: MapsTabProps) {
  // View mode state
  const [activeViewMode, setActiveViewMode] = useState<'google' | 'tactical'>(hasValidKey ? 'google' : 'tactical');

  // State management
  const [mapZoom, setMapZoom] = useState<'ukraine' | 'kyiv' | 'lviv' | 'global'>('ukraine');
  const [mapShowRoutes, setMapShowRoutes] = useState(true);
  const [mapShowFlows, setMapShowFlows] = useState(true);
  const [mapShowHeatmap, setMapShowHeatmap] = useState(true);
  const [mapShowRadar, setMapShowRadar] = useState(true);
  const [hoveredMapEntityId, setHoveredMapEntityId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('comp-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  // Maps Grounding search state
  const [groundingQuery, setGroundingQuery] = useState('');
  const [isGroundingSearching, setIsGroundingSearching] = useState(false);
  const [groundingResult, setGroundingResult] = useState<string | null>(null);

  // Tactical simulation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [activeLayersCount, setActiveLayersCount] = useState(3);

  // Memoized entity based on selection
  const selectedEntity = useMemo(() => {
    return OSINT_ENTITIES.find(e => e.id === selectedEntityId) || OSINT_ENTITIES[0];
  }, [selectedEntityId]);

  const selectedLoc = MAP_LOCATIONS[selectedEntityId];

  // Handle Google Maps Grounding Search with Gemini
  const handleGroundingSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groundingQuery.trim()) return;
    setIsGroundingSearching(true);
    setGroundingResult(null);

    try {
      const res = await fetch('/api/media-forensics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'grounding',
          prompt: `Користувач запитує геопросторову OSINT перевірку з прив'язкою до Google Maps: "${groundingQuery}". Проаналізуй адресу, локацію чи компанію, знайди точні координати, найближчі об'єкти інфраструктури та ризики у цьому районі. Дай чітку відповідь українською мовою.`
        })
      });
      const data = await res.json();
      setGroundingResult(data.text || "Дані гео-пошуку отримано.");
    } catch (err: any) {
      setGroundingResult("Помилка запиту гео-пошуку. Спробуйте ще раз.");
    } finally {
      setIsGroundingSearching(false);
    }
  };

  // Handle tactical radar scan simulation
  const startTacticalScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanMessage("Ініціалізація ШІ-Сенсорів NEXUS...");
    
    setTimeout(() => {
      setScanMessage("Тріангуляція крипто-транзакцій та митних накладних...");
    }, 1200);

    setTimeout(() => {
      setScanMessage("Звірка з супутниковими даними Sentinel-2...");
    }, 2400);

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage("Сканування завершено! Виявлено 4 активні аномалії.");
      setTimeout(() => setScanMessage(null), 3000);
    }, 3600);
  };

  // Filter locations list by search query and risk filters
  const filteredLocations = useMemo(() => {
    return Object.values(MAP_LOCATIONS).filter(loc => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = loc.name.toLowerCase().includes(query) || 
                              loc.city.toLowerCase().includes(query) ||
                              loc.address.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (riskFilter === 'high') {
        if (loc.riskScore < 75) return false;
      } else if (riskFilter === 'medium') {
        if (loc.riskScore < 50 || loc.riskScore >= 75) return false;
      } else if (riskFilter === 'low') {
        if (loc.riskScore >= 50) return false;
      }

      return true;
    });
  }, [searchQuery, riskFilter]);

  // Count active layers
  useEffect(() => {
    let count = 0;
    if (mapShowHeatmap) count++;
    if (mapShowRoutes) count++;
    if (mapShowFlows) count++;
    if (mapShowRadar) count++;
    setActiveLayersCount(count);
  }, [mapShowHeatmap, mapShowRoutes, mapShowFlows, mapShowRadar]);

  return (
    <div className="space-y-6" id="maps-tab-root">
      
      {/* Top Banner & Mode Switcher */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Globe className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide font-mono flex items-center gap-2">
              Геопросторова Картографія та Супутниковий Моніторинг
              <span className="text-[10px] bg-blue-600/30 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                GMP V3.6
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Інтеграція з Google Maps Platform, гео-пошук з Gemini Maps Grounding та векторна аналітика
            </p>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveViewMode('google')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === 'google'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Google Maps</span>
            {hasValidKey && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveViewMode('tactical')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeViewMode === 'tactical'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Тактична Сітка</span>
          </button>
        </div>
      </div>

      {/* API Key Setup Banner if key is missing and user is in Google Maps mode */}
      {!hasValidKey && activeViewMode === 'google' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
                <Key className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-300 font-mono uppercase tracking-wider flex items-center gap-2">
                  Потрібен API Ключ Google Maps Platform
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Для активації інтерактивних векторних карт, супутникових знімків High-Res та Google Places Autocomplete додайте ключ у секрети AI Studio:
                </p>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside font-mono pt-1">
                  <li>Отримайте ключ на <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-bold">Google Cloud Console</a></li>
                  <li>Відкрийте <strong>Settings (⚙️)</strong> у верхньому правому куті AI Studio → <strong>Secrets</strong></li>
                  <li>Введіть назву ключа: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 border border-slate-800">GOOGLE_MAPS_PLATFORM_KEY</code></li>
                  <li>Вставте ключ та натисніть Enter (додаток оновиться автоматично)</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setActiveViewMode('tactical')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono rounded-xl border border-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              Перейти до Тактичної Сітки ➔
            </button>
          </div>
        </motion.div>
      )}

      {/* Upper HUD with visual map statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2" id="maps-hud-stats">
        <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-2 flex items-center justify-between shadow-2xl shadow-black/40">
          <div>
            <span className="text-xs text-slate-300 font-mono font-bold uppercase tracking-widest block">АКТИВНІ ГЕО-ВУЗЛИ</span>
            <span className="text-lg font-black text-white tracking-tight mt-1 block">4 Точки інтересу</span>
            <span className="text-xs text-blue-400 font-mono mt-0.5 block">Київ, Львів, Козин, Одеса</span>
          </div>
          <div className="p-2.5 rounded-2xl border border-slate-800 bg-blue-500/10 text-blue-400">
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-2 flex items-center justify-between shadow-2xl shadow-black/40">
          <div>
            <span className="text-xs text-slate-300 font-mono font-bold uppercase tracking-widest block">АКТИВНІСТЬ ТРАНЗАКЦІЙ</span>
            <span className="text-lg font-black text-amber-400 tracking-tight mt-1 block">2 Потоки коштів</span>
            <span className="text-xs text-amber-500/80 font-mono mt-0.5 block">Виявлено виведення в BTC Ledger</span>
          </div>
          <div className="p-2.5 rounded-2xl border border-slate-800 bg-amber-500/10 text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-2 flex items-center justify-between shadow-2xl shadow-black/40">
          <div>
            <span className="text-xs text-slate-300 font-mono font-bold uppercase tracking-widest block">РІВЕНЬ ЗАГРОЗИ СЕКТОРУ</span>
            <span className="text-lg font-black text-rose-500 tracking-tight mt-1 block">94% Критичний</span>
            <span className="text-xs text-rose-400 font-mono mt-0.5 block">ТОВ СпецТехПостач (Київ)</span>
          </div>
          <div className="p-2.5 rounded-2xl border border-slate-800 bg-rose-500/10 text-rose-500">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-2 flex items-center justify-between shadow-2xl shadow-black/40">
          <div>
            <span className="text-xs text-slate-300 font-mono font-bold uppercase tracking-widest block">АКТИВНІ ШАРИ ДАНИХ</span>
            <span className="text-lg font-black text-blue-400 tracking-tight mt-1 block">{activeLayersCount} / 4 шарів</span>
            <span className="text-xs text-slate-500 font-mono mt-0.5 block">Векторні карти & супутники</span>
          </div>
          <div className="p-2.5 rounded-2xl border border-slate-800 bg-blue-500/10 text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Grid: Map canvas, settings & side metadata drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
        
        {/* Left Column: Interactive Map Canvas (Span 8) */}
        <div className="xl:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-3 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          
          {/* Header controls of the Map */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-2 z-10 relative">
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-blue-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Геопросторова Платформа "NEXUS-MAPS"
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {activeViewMode === 'google' ? 'Google Maps Platform — Супутникові дані & Векторний шар' : 'Тактичний векторний растр'}
                </p>
              </div>
            </div>

            {/* Quick Zoom presets */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/60">
              <button
                onClick={() => {
                  setMapZoom('ukraine');
                  setSelectedEntityId('comp-1');
                }}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mapZoom === 'ukraine' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-slate-300 hover:text-slate-200'
                }`}
              >
                Україна
              </button>
              <button
                onClick={() => {
                  setMapZoom('kyiv');
                  setSelectedEntityId('comp-1');
                }}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mapZoom === 'kyiv' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-slate-300 hover:text-slate-200'
                }`}
              >
                Київ
              </button>
              <button
                onClick={() => {
                  setMapZoom('lviv');
                  setSelectedEntityId('comp-2');
                }}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mapZoom === 'lviv' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-slate-300 hover:text-slate-200'
                }`}
              >
                Львів
              </button>
              <button
                onClick={() => {
                  setMapZoom('global');
                  setSelectedEntityId('wallet-1');
                }}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mapZoom === 'global' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-slate-300 hover:text-slate-200'
                }`}
              >
                Одеса
              </button>
            </div>
          </div>

          {/* Map Stage Container */}
          <div className="relative h-[480px] bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden mt-3 shadow-inner">
            
            {/* GOOGLE MAPS MODE */}
            {activeViewMode === 'google' && hasValidKey && (
              <APIProvider apiKey={API_KEY} version="weekly">
                <GoogleMap
                  defaultCenter={{ lat: selectedLoc?.lat || 50.4501, lng: selectedLoc?.lng || 30.5234 }}
                  defaultZoom={10}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                >
                  <MapController selectedLoc={selectedLoc} />
                  <MapVectorOverlay showRoutes={mapShowRoutes} showFlows={mapShowFlows} />
                  {filteredLocations.map(loc => (
                    <LocationMarker
                      key={loc.id}
                      loc={loc}
                      isSelected={selectedEntityId === loc.id}
                      onSelect={(id) => setSelectedEntityId(id)}
                      onSelectEntityGlobal={onSelectEntityGlobal}
                    />
                  ))}
                </GoogleMap>
              </APIProvider>
            )}

            {/* GOOGLE MAPS MISSING KEY FALLBACK SCREEN */}
            {activeViewMode === 'google' && !hasValidKey && (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full animate-pulse">
                  <MapPinOff className="w-10 h-10" />
                </div>
                <div className="max-w-md space-y-2">
                  <h4 className="text-base font-bold text-white font-mono uppercase">Google Maps Чекає Активації</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Додайте секрет <code className="text-amber-300">GOOGLE_MAPS_PLATFORM_KEY</code> для запуску супутникових та інтерактивних карт Google.
                  </p>
                </div>
                <button
                  onClick={() => setActiveViewMode('tactical')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  Відкрити Тактичну Векторну Картку ➔
                </button>
              </div>
            )}

            {/* TACTICAL SVG MAP MODE */}
            {activeViewMode === 'tactical' && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Top Indicator Panel inside Map */}
                <div className="absolute top-2 left-3 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-2xl text-xs font-mono text-slate-300 z-20 flex items-center gap-2 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Тактичний шар: NEXUS VECTOR GRID</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-blue-400 font-bold">{mapZoom === 'ukraine' ? 'GRID: 500x280' : mapZoom === 'kyiv' ? 'INSET: KYIV_METRO' : mapZoom === 'lviv' ? 'INSET: LVIV_CENTER' : 'VIRTUAL: SOUTH_NODE'}</span>
                </div>

                {/* Tactical Compass Rose Overlay */}
                <div className="absolute bottom-4 right-4 text-slate-800/40 pointer-events-none select-none z-10 w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M 50,5 L 53,40 L 50,50 L 47,40 Z" fill="rgba(99, 102, 241, 0.4)" />
                    <path d="M 50,95 L 53,60 L 50,50 L 47,60 Z" fill="rgba(244, 63, 94, 0.4)" />
                    <text x="50" y="15" textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="bold">N</text>
                    <text x="50" y="93" textAnchor="middle" fill="#f43f5e" fontSize="10" fontWeight="bold">S</text>
                  </svg>
                </div>

                {/* Background Map Visual Canvas */}
                <svg 
                  className="w-full h-full cursor-grab active:cursor-grabbing transition-all duration-700 select-none z-10" 
                  viewBox={
                    mapZoom === 'kyiv' 
                      ? '200 65 110 80' 
                      : mapZoom === 'lviv' 
                        ? '65 95 60 50' 
                        : '0 0 500 280'
                  }
                  fill="none"
                >
                  <defs>
                    <radialGradient id="tab-heat-high" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="tab-heat-medium" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                      <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </radialGradient>
                    
                    <pattern id="tab-map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0f172a" strokeWidth="0.5" />
                    </pattern>
                  </defs>

                  {/* Grid backdrop overlay */}
                  <rect width="500" height="280" fill="url(#tab-map-grid)" />

                  {/* Grid Coordinate text */}
                  {(mapZoom === 'ukraine' || mapZoom === 'global') && (
                    <g className="opacity-20" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3">
                      <line x1="100" y1="0" x2="100" y2="280" />
                      <text x="105" y="15" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">24°E</text>
                      
                      <line x1="200" y1="0" x2="200" y2="280" />
                      <text x="205" y="15" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">30°E</text>
                      
                      <line x1="300" y1="0" x2="300" y2="280" />
                      <text x="305" y="15" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">36°E</text>
                      
                      <line x1="400" y1="0" x2="400" y2="280" />
                      <text x="405" y="15" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">42°E</text>
                      
                      <line x1="0" y1="80" x2="500" y2="80" />
                      <text x="5" y="75" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">50°N</text>
                      
                      <line x1="0" y1="180" x2="500" y2="180" />
                      <text x="5" y="175" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">46°N</text>
                    </g>
                  )}

                  {/* Dynamic Tactical Radar Sweeping Beacon */}
                  {mapShowRadar && mapZoom === 'ukraine' && (
                    <line 
                      x1="250" 
                      y1="140" 
                      x2="500" 
                      y2="140" 
                      stroke="rgba(99, 102, 241, 0.15)" 
                      strokeWidth="2" 
                      className="origin-[250px_140px] animate-spin" 
                      style={{ animationDuration: '10s' }} 
                    />
                  )}

                  {/* Stylized Ukraine Vector Boundaries */}
                  {mapZoom !== 'lviv' && mapZoom !== 'kyiv' && (
                    <g id="tab-ukraine-boundary-mesh">
                      <path 
                        d="M 50,110 L 80,95 L 110,95 L 140,110 L 170,105 L 210,95 L 250,90 L 290,95 L 340,90 L 380,100 L 415,110 L 440,130 L 420,155 L 435,175 L 405,190 L 375,200 L 350,215 L 315,220 L 295,250 L 285,250 L 280,225 L 260,220 L 235,225 L 220,210 L 200,195 L 170,195 L 140,185 L 110,170 L 80,165 L 60,140 Z" 
                        className="fill-slate-900/65 stroke-slate-800 transition-all duration-700" 
                        strokeWidth="1.5" 
                      />
                    </g>
                  )}

                  {/* LAYER 1: Threat Heatmap Gradients */}
                  {mapShowHeatmap && (
                    <g id="tab-threat-heatmap-layer">
                      {mapZoom !== 'lviv' && (
                        <circle 
                          cx={mapZoom === 'kyiv' ? 235 : 270} 
                          cy={mapZoom === 'kyiv' ? 85 : 100} 
                          r={mapZoom === 'kyiv' ? 32 : 55} 
                          fill="url(#tab-heat-high)" 
                          className="animate-pulse" 
                        />
                      )}
                      {mapZoom !== 'lviv' && (
                        <circle 
                          cx={mapZoom === 'kyiv' ? 275 : 285} 
                          cy={mapZoom === 'kyiv' ? 125 : 120} 
                          r={mapZoom === 'kyiv' ? 24 : 36} 
                          fill="url(#tab-heat-high)" 
                          className="animate-pulse" 
                          style={{ animationDelay: '500ms' }}
                        />
                      )}
                      {mapZoom === 'ukraine' && (
                        <circle cx="420" cy="70" r="30" fill="url(#tab-heat-medium)" className="animate-pulse" />
                      )}
                    </g>
                  )}

                  {/* INTERACTIVE COMPONENT PINS AND LABELS */}
                  <g id="tab-pins-mesh">
                    {filteredLocations.map((loc) => {
                      if (mapZoom === 'kyiv' && loc.id === 'comp-2') return null;
                      if (mapZoom === 'kyiv' && loc.id === 'wallet-1') return null;
                      if (mapZoom === 'lviv' && loc.id !== 'comp-2') return null;

                      let cx = loc.x;
                      let cy = loc.y;
                      if (mapZoom === 'kyiv' && loc.kyivX && loc.kyivY) {
                        cx = loc.kyivX;
                        cy = loc.kyivY;
                      }

                      const isHovered = hoveredMapEntityId === loc.id;
                      const isSelected = selectedEntityId === loc.id;
                      const riskColor = loc.riskScore >= 75 ? '#f43f5e' : loc.riskScore >= 50 ? '#f59e0b' : '#10b981';
                      
                      return (
                        <g 
                          key={loc.id}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedEntityId(loc.id);
                          }}
                          onMouseEnter={() => setHoveredMapEntityId(loc.id)}
                          onMouseLeave={() => setHoveredMapEntityId(null)}
                        >
                          {isSelected && (
                            <g>
                              <circle cx={cx} cy={cy} r="16" fill="none" stroke={riskColor} strokeWidth="1" className="animate-ping opacity-35" />
                            </g>
                          )}

                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={isHovered || isSelected ? "7.5" : "6"} 
                            fill="#020617" 
                            stroke={riskColor} 
                            strokeWidth={isHovered || isSelected ? "3" : "2"} 
                            className="transition-all duration-300"
                          />
                          <circle cx={cx} cy={cy} r="2.5" fill={riskColor} />

                          <g className="transition-all duration-300 pointer-events-none">
                            <rect 
                              x={cx - 24} 
                              y={cy + 8.5} 
                              width="48" 
                              height="11.5" 
                              rx="3" 
                              fill="rgba(2, 6, 23, 0.85)" 
                              stroke={isSelected ? "rgba(99, 102, 241, 0.5)" : "rgba(30, 41, 59, 0.6)"} 
                              strokeWidth="0.5" 
                            />
                            <text 
                              x={cx} 
                              y={cy + 16.5} 
                              textAnchor="middle" 
                              fill={isSelected ? "#a5b4fc" : "#94a3b8"} 
                              fontSize="5.5" 
                              fontWeight="bold" 
                              fontFamily="monospace"
                            >
                              {loc.name.replace(/ТОВ |"|'/g, '').slice(0, 10)}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            )}

            {/* Bottom HUD Indicators */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-2xl text-[8.5px] font-mono text-slate-400 z-20 flex items-center gap-1.5 uppercase select-none backdrop-blur-md">
              <Navigation className="w-3 h-3 text-blue-400" />
              <span>ФОКУС: {selectedLoc ? `${selectedLoc.lat.toFixed(4)}° N, ${selectedLoc.lng.toFixed(4)}° E (${selectedLoc.city})` : '30.5238° E, 50.4501° N'}</span>
            </div>
          </div>

          {/* Gemini Maps Grounding Search Box */}
          <div className="mt-3 bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Gemini Maps Grounding — Гео-пошук об'єктів</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Real-time Location Verification</span>
            </div>

            <form onSubmit={handleGroundingSearch} className="flex gap-2">
              <input
                type="text"
                value={groundingQuery}
                onChange={(e) => setGroundingQuery(e.target.value)}
                placeholder="Введіть адресу чи об'єкт для пошуку (напр. 'вул. Грушевського 15, Київ')..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
              />
              <button
                type="submit"
                disabled={isGroundingSearching}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                {isGroundingSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Шукати</span>
              </button>
            </form>

            {groundingResult && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/90 border border-blue-900/50 p-3 rounded-xl text-xs text-slate-300 font-sans leading-relaxed space-y-1"
              >
                <div className="flex items-center gap-1.5 text-blue-400 font-mono font-bold uppercase text-[10px]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Результат ШІ-Перевірки Локації</span>
                </div>
                <p className="whitespace-pre-line">{groundingResult}</p>
              </motion.div>
            )}
          </div>

          {/* Active Layers Toggles & Settings Board */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-2.5 mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 z-10 relative">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">Карта тепла</span>
                <span className="text-[10px] text-slate-500 font-mono">Ареоли загрози</span>
              </div>
              <button
                onClick={() => setMapShowHeatmap(!mapShowHeatmap)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${mapShowHeatmap ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${mapShowHeatmap ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">Митні вектори</span>
                <span className="text-[10px] text-slate-500 font-mono">Логістика товарів</span>
              </div>
              <button
                onClick={() => setMapShowRoutes(!mapShowRoutes)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${mapShowRoutes ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${mapShowRoutes ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">Крипто-потоки</span>
                <span className="text-[10px] text-slate-500 font-mono">Транзакційні шляхи</span>
              </div>
              <button
                onClick={() => setMapShowFlows(!mapShowFlows)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${mapShowFlows ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${mapShowFlows ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">Тактичний радар</span>
                <span className="text-[10px] text-slate-500 font-mono">Промінь розгортки</span>
              </div>
              <button
                onClick={() => setMapShowRadar(!mapShowRadar)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${mapShowRadar ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${mapShowRadar ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Search, Active list & Selected Node Dossier (Span 4) */}
        <div className="xl:col-span-4 space-y-4">
          
          {/* Node Selector & Filter Box */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-mono font-bold uppercase tracking-widest block">
                ФІЛЬТРАЦІЯ ГЕО-ВУЗЛІВ
              </span>
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
            </div>

            <div className="relative">
              <input 
                type="text" 
                placeholder="Пошук точки на карті..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-sans"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2" />
            </div>

            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/60 text-xs font-mono">
              <button
                onClick={() => setRiskFilter('all')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${riskFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}
              >
                Всі
              </button>
              <button
                onClick={() => setRiskFilter('high')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${riskFilter === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'}`}
              >
                Критичні
              </button>
              <button
                onClick={() => setRiskFilter('medium')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${riskFilter === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400'}`}
              >
                Середні
              </button>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
              {filteredLocations.map(loc => {
                const isSelected = selectedEntityId === loc.id;
                const riskColorText = loc.riskScore >= 75 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : loc.riskScore >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                
                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      setSelectedEntityId(loc.id);
                    }}
                    className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'bg-blue-600/20 border-blue-500/50 shadow' 
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`p-1.5 rounded-lg bg-black/40 border border-slate-800 text-slate-300 ${isSelected ? 'text-blue-400' : ''}`}>
                        {loc.id === 'comp-1' || loc.id === 'comp-2' ? <Briefcase className="w-3.5 h-3.5" /> : loc.id === 'person-1' ? <User className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-200 truncate">{loc.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{loc.city}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${riskColorText}`}>
                      {loc.riskScore}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Node Detailed OSINT Dossier Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-blue-400 font-mono font-bold uppercase tracking-widest block">
                ДОСЬЄ ВУЗЛА В РЕАЛЬНОМУ ЧАСІ
              </span>
              <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded font-mono uppercase font-black">
                {selectedEntity.status}
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <h4 className="text-xs font-bold text-slate-200">{selectedEntity.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">
                  {selectedEntity.type === 'company' ? 'Юридична особа' : selectedEntity.type === 'person' ? 'Фізична особа' : 'Криптовалютна адреса'} • Код {selectedEntity.code}
                </p>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300 font-mono">
                <div className="flex gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Географічна адреса</span>
                    <span className="text-slate-200 font-sans leading-relaxed text-xs">{selectedEntity.address}</span>
                  </div>
                </div>

                {selectedLoc && (
                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>GPS Координати:</span>
                    <span className="text-blue-400 font-bold">{selectedLoc.lat.toFixed(4)}, {selectedLoc.lng.toFixed(4)}</span>
                  </div>
                )}
              </div>

              <div className="text-xs leading-relaxed text-slate-300 font-sans italic">
                "{selectedEntity.description}"
              </div>

              {onSelectEntityGlobal && (
                <button
                  onClick={() => onSelectEntityGlobal(selectedEntity)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold uppercase tracking-widest py-2 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>Аналізувати в ШІ-Ядрі</span>
                </button>
              )}
            </div>
          </div>

          {/* Tactical controls */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-3">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">
              СУПУТНИКОВЕ СКАНУВАННЯ NEXUS
            </span>

            {isScanning ? (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-1.5">
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs text-indigo-300 font-mono font-bold uppercase animate-pulse">
                  {scanMessage || "Сканування..."}
                </span>
              </div>
            ) : scanMessage ? (
              <div className="bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/40 text-emerald-400 text-xs font-mono leading-relaxed text-center">
                {scanMessage}
              </div>
            ) : (
              <button
                onClick={startTacticalScan}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Запустити Супутникове Сканування</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
