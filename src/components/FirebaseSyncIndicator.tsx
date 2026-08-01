import React, { useState } from 'react';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertTriangle, Database, Wifi, WifiOff, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FirebaseSyncIndicatorProps {
  /** Компактне відображення для вузьких або мобільних шапок */
  compact?: boolean;
  /** Кастомний додатковий клас CSS */
  className?: string;
}

export function FirebaseSyncIndicator({ compact = false, className = '' }: FirebaseSyncIndicatorProps) {
  const {
    isOnline,
    isSynced,
    hasPendingWrites,
    fromCache,
    lastSyncedAt,
    syncError,
    isChecking,
    latencyMs,
    reconnect,
  } = useFirebaseSync();

  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualReconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await reconnect();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Колір та статус
  const getStatusDetails = () => {
    if (isChecking && !latencyMs) {
      return {
        dotClass: 'bg-blue-400 animate-ping',
        badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        label: 'Перевірка з\'єднання...',
        icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />,
        stateName: 'CHECKING'
      };
    }

    if (!isOnline) {
      return {
        dotClass: 'bg-rose-500',
        badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        label: 'Firestore: Офлайн',
        icon: <WifiOff className="w-3.5 h-3.5 text-rose-400" />,
        stateName: 'OFFLINE'
      };
    }

    if (hasPendingWrites || (fromCache && isSynced)) {
      return {
        dotClass: 'bg-amber-400 animate-pulse',
        badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        label: hasPendingWrites ? 'Синхронізація змін...' : 'Кеш Firestore',
        icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />,
        stateName: 'SYNCING'
      };
    }

    return {
      dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      label: 'Firestore: Онлайн',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      stateName: 'ONLINE'
    };
  };

  const status = getStatusDetails();

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Кнопка Статус-бару */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        tabIndex={0}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono font-medium transition-all duration-200 cursor-pointer hover:bg-slate-800/80 ${status.badgeBg}`}
        title="Натисніть для детального моніторингу статусу Firestore"
        aria-label="Моніторинг з'єднання Firestore"
      >
        <span className="relative flex h-2 w-2">
          {isOnline && !hasPendingWrites && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dotClass}`}></span>
        </span>

        {!compact && (
          <span className="truncate max-w-[140px] font-bold">
            {status.label}
          </span>
        )}

        {isOnline && latencyMs !== null && !compact && (
          <span className="hidden xl:inline-block text-[10px] opacity-70 border-l border-slate-700/60 pl-1.5 ml-0.5">
            {latencyMs}ms
          </span>
        )}

        <button
          type="button"
          onClick={handleManualReconnect}
          className="p-0.5 hover:text-white transition-colors ml-0.5"
          title="Оновити з'єднання"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing || isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Выпадающее окно деталей (Status Modal / Dropdown) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Прозорий фоновий шар для закриття */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 text-slate-200 font-sans"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Статус Firebase Firestore
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${status.badgeBg}`}>
                  {status.stateName}
                </span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                {/* Мережевий стан */}
                <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
                    Мережеве з'єднання:
                  </span>
                  <span className={`font-mono font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isOnline ? 'АКТИВНЕ' : 'ОФЛАЙН'}
                  </span>
                </div>

                {/* Синхронізація даних */}
                <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-blue-400" />
                    Режим зберігання:
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {fromCache ? 'Локальний кеш (Offline)' : 'Хмара Firestore (Live)'}
                  </span>
                </div>

                {/* Незавершені записи */}
                {hasPendingWrites && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Ненадіслані зміни:
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      В черзі синхронізації
                    </span>
                  </div>
                )}

                {/* Затримка (Ping) */}
                {latencyMs !== null && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      Затримка (Ping):
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {latencyMs} ms
                    </span>
                  </div>
                )}

                {/* Останній успішний зв'язок */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Остання синхронізація:</span>
                  <span className="font-mono text-slate-300">
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Н/Д'}
                  </span>
                </div>

                {/* Помилка, якщо є */}
                {syncError && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-mono leading-relaxed mt-2">
                    ⚠️ {syncError}
                  </div>
                )}
              </div>

              {/* Кнопка оновлення з'єднання */}
              <button
                onClick={handleManualReconnect}
                disabled={isChecking}
                className="w-full mt-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Перевірка з\'єднання...' : 'Перевірити з\'єднання'}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
