/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Real-Time Asset Price & Market Dynamics Indicator Widget
 */

import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  RefreshCw,
  Zap,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Globe,
  Clock,
  ShieldAlert,
  BarChart2,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface AssetPriceData {
  id: string;
  symbol: string;
  name: string;
  category: "crypto" | "fiat" | "commodity" | "sanctioned_index";
  price: number;
  currency: string;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  history: number[];
  lastTickDirection?: "up" | "down" | "flat";
  lastTickTime?: string;
  riskImpactLevel: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  notes: string;
}

const INITIAL_ASSETS: AssetPriceData[] = [
  {
    id: "btc",
    symbol: "BTC / USD",
    name: "Bitcoin (Crypto Node)",
    category: "crypto",
    price: 64850.25,
    currency: "$",
    change24h: +3.42,
    high24h: 65400.0,
    low24h: 62900.5,
    volume24h: "$28.4B",
    history: [62800, 63100, 63400, 62900, 64200, 64500, 64850],
    riskImpactLevel: "CRITICAL",
    notes: "Висока корисність у крипто-міксерах та транскордонних відмиваннях",
  },
  {
    id: "eth",
    symbol: "ETH / USD",
    name: "Ethereum (Smart Contracts)",
    category: "crypto",
    price: 3420.8,
    currency: "$",
    change24h: -1.15,
    high24h: 3490.0,
    low24h: 3380.0,
    volume24h: "$14.2B",
    history: [3480, 3460, 3440, 3410, 3430, 3400, 3420],
    riskImpactLevel: "HIGH",
    notes: "Моніторинг ліквідності у смарт-контрактах Tornado/DeFi",
  },
  {
    id: "usdt_uah",
    symbol: "USDT / UAH",
    name: "Tether P2P (Україна)",
    category: "fiat",
    price: 41.85,
    currency: "₴",
    change24h: +0.48,
    high24h: 42.1,
    low24h: 41.6,
    volume24h: "₴1.8B",
    history: [41.5, 41.6, 41.65, 41.7, 41.8, 41.82, 41.85],
    riskImpactLevel: "MEDIUM",
    notes: "P2P ринок тіньової валютної конвертації",
  },
  {
    id: "brent",
    symbol: "BRENT / BBL",
    name: "Нафта Brent Crude",
    category: "commodity",
    price: 82.4,
    currency: "$",
    change24h: -2.35,
    high24h: 84.8,
    low24h: 81.9,
    volume24h: "$45.1B",
    history: [84.5, 84.2, 83.8, 83.1, 82.9, 82.1, 82.4],
    riskImpactLevel: "CRITICAL",
    notes: "Моніторинг цінового стелі для обходу санкцій теневого флоту",
  },
  {
    id: "gold",
    symbol: "GOLD / OZ",
    name: "Золото (XAU/USD)",
    category: "commodity",
    price: 2385.1,
    currency: "$",
    change24h: +1.84,
    high24h: 2392.0,
    low24h: 2345.0,
    volume24h: "$18.9B",
    history: [2340, 2352, 2360, 2355, 2370, 2380, 2385],
    riskImpactLevel: "HIGH",
    notes: "Резервний інструмент ухилення від банківських контролів",
  },
  {
    id: "wheat",
    symbol: "WHEAT / TON",
    name: "Пшениця (Експортний Індекс)",
    category: "sanctioned_index",
    price: 218.5,
    currency: "$",
    change24h: +0.92,
    high24h: 221.0,
    low24h: 215.0,
    volume24h: "$3.4B",
    history: [214, 215, 216, 215.5, 217, 218, 218.5],
    riskImpactLevel: "MEDIUM",
    notes: "Агроекспортний моніторинг краденого зерна з окупованих територій",
  },
];

export default function RealtimeAssetPriceWidget() {
  const [assets, setAssets] = useState<AssetPriceData[]>(INITIAL_ASSETS);
  const [activeCategory, setActiveCategory] = useState<
    "ALL" | "crypto" | "fiat" | "commodity" | "sanctioned_index"
  >("ALL");
  const [isLiveFeedActive, setIsLiveFeedActive] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<AssetPriceData | null>(null);
  const [lastGlobalTickTime, setLastGlobalTickTime] = useState<string>("");

  // Ticker animation simulator
  useEffect(() => {
    if (!isLiveFeedActive) return;

    const interval = setInterval(() => {
      setAssets((prevAssets) => {
        // Pick 1 or 2 random assets to update tick
        const updatedIndex = Math.floor(Math.random() * prevAssets.length);
        const assetToUpdate = prevAssets[updatedIndex];

        // Random price oscillation between -0.6% and +0.6%
        const percentChange = (Math.random() - 0.49) * 0.012;
        const rawNewPrice = assetToUpdate.price * (1 + percentChange);
        
        // Precision fixing
        const newPrice =
          assetToUpdate.price > 100
            ? Math.round(rawNewPrice * 100) / 100
            : Math.round(rawNewPrice * 1000) / 1000;

        const direction: "up" | "down" | "flat" =
          newPrice > assetToUpdate.price
            ? "up"
            : newPrice < assetToUpdate.price
            ? "down"
            : "flat";

        const newChange24h =
          Math.round((assetToUpdate.change24h + percentChange * 10) * 100) /
          100;

        const newHistory = [...assetToUpdate.history.slice(1), newPrice];

        const nowStr = new Date().toLocaleTimeString("uk-UA", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        setLastGlobalTickTime(nowStr);

        return prevAssets.map((a, idx) =>
          idx === updatedIndex
            ? {
                ...a,
                price: newPrice,
                change24h: newChange24h,
                history: newHistory,
                high24h: Math.max(a.high24h, newPrice),
                low24h: Math.min(a.low24h, newPrice),
                lastTickDirection: direction,
                lastTickTime: nowStr,
              }
            : a
        );
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveFeedActive]);

  const filteredAssets = assets.filter((a) =>
    activeCategory === "ALL" ? true : a.category === activeCategory
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 relative">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
                Монітор Цінових Активів & Ринкових Тіків
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE WebSocket
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Пряма трансляція котирувань криптовалют, сировини та валютних індексів для OSINT
            </p>
          </div>
        </div>

        {/* Live Toggle & Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setActiveCategory("ALL")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeCategory === "ALL"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Усі ({assets.length})
            </button>
            <button
              onClick={() => setActiveCategory("crypto")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeCategory === "crypto"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Крипто
            </button>
            <button
              onClick={() => setActiveCategory("commodity")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeCategory === "commodity"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Сировина
            </button>
            <button
              onClick={() => setActiveCategory("fiat")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeCategory === "fiat"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              P2P/FX
            </button>
          </div>

          {/* Pause / Resume Live Feed */}
          <button
            onClick={() => setIsLiveFeedActive(!isLiveFeedActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isLiveFeedActive
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}
            title={isLiveFeedActive ? "Призупинити оновлення" : "Відновити трансляцію"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveFeedActive ? "animate-spin [animation-duration:4s]" : ""}`} />
            <span>{isLiveFeedActive ? "Пауза" : "Відновити"}</span>
          </button>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAssets.map((asset) => {
          const isPositive = asset.change24h >= 0;
          const isRecentlyUpdated = asset.lastTickDirection && asset.lastTickDirection !== "flat";

          return (
            <motion.div
              key={asset.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedAsset(asset)}
              className={`relative bg-slate-950/90 border rounded-xl p-3.5 space-y-2.5 transition-all cursor-pointer overflow-hidden ${
                asset.lastTickDirection === "up"
                  ? "border-emerald-500/50 shadow-lg shadow-emerald-950/30"
                  : asset.lastTickDirection === "down"
                  ? "border-rose-500/50 shadow-lg shadow-rose-950/30"
                  : "border-slate-800/80 hover:border-slate-700"
              }`}
            >
              {/* Flash effect overlay on price tick */}
              <AnimatePresence>
                {asset.lastTickDirection === "up" && (
                  <motion.div
                    key={`up-${asset.price}`}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 bg-emerald-500/10 pointer-events-none"
                  />
                )}
                {asset.lastTickDirection === "down" && (
                  <motion.div
                    key={`down-${asset.price}`}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 bg-rose-500/10 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Asset Name & Badge */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black font-mono text-slate-100">
                      {asset.symbol}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        asset.riskImpactLevel === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : asset.riskImpactLevel === "HIGH"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {asset.riskImpactLevel}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans block truncate max-w-[180px]">
                    {asset.name}
                  </span>
                </div>

                {/* 24h Change Badge */}
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isPositive ? `+${asset.change24h}%` : `${asset.change24h}%`}
                  </span>
                </div>
              </div>

              {/* Price & Sparkline Row */}
              <div className="flex items-end justify-between pt-1">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-mono text-slate-500 font-bold">
                      {asset.currency}
                    </span>
                    <span className="text-xl font-black font-mono text-slate-100 tracking-tight">
                      {asset.price.toLocaleString("en-US", {
                        minimumFractionDigits: asset.price < 100 ? 2 : 2,
                        maximumFractionDigits: asset.price < 100 ? 3 : 2,
                      })}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    Тік: {asset.lastTickTime || "Real-time"}
                  </span>
                </div>

                {/* Mini SVG Sparkline */}
                <div className="w-20 h-9 flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 35">
                    {(() => {
                      const min = Math.min(...asset.history);
                      const max = Math.max(...asset.history);
                      const range = max - min || 1;
                      const points = asset.history
                        .map((val, i) => {
                          const x = (i / (asset.history.length - 1)) * 100;
                          const y = 30 - ((val - min) / range) * 25;
                          return `${x},${y}`;
                        })
                        .join(" ");

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke={isPositive ? "#10b981" : "#f43f5e"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                          {/* Circle on last point */}
                          <circle
                            cx="100"
                            cy={30 - ((asset.history[asset.history.length - 1] - min) / range) * 25}
                            r="3"
                            fill={isPositive ? "#10b981" : "#f43f5e"}
                            className="animate-ping"
                          />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Asset Modal / Detail Drawer */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold font-mono text-slate-100">
                      {selectedAsset.symbol}
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold uppercase">
                      {selectedAsset.category.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedAsset.name}</p>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Price Details */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block">Поточна ціна</span>
                  <span className="text-lg font-black text-slate-100">
                    {selectedAsset.currency} {selectedAsset.price.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block">Зміна за 24h</span>
                  <span
                    className={`text-lg font-black ${
                      selectedAsset.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {selectedAsset.change24h >= 0 ? `+${selectedAsset.change24h}%` : `${selectedAsset.change24h}%`}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block">Максимум (24h)</span>
                  <span className="font-bold text-slate-200">
                    {selectedAsset.currency} {selectedAsset.high24h.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block">Мінімум (24h)</span>
                  <span className="font-bold text-slate-200">
                    {selectedAsset.currency} {selectedAsset.low24h.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* OSINT Risk Note */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Вплив на аналітичні розслідування:</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">
                  {selectedAsset.notes}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Закрити
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
