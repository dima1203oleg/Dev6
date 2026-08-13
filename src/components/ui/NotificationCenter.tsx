import { useState } from 'react';
import { Bell, ShieldAlert, CheckCircle2, Info, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface NotificationItem {
  id: string;
  type: 'risk' | 'info' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'risk',
      title: 'Виявлено новий факт ризику',
      message: 'Об\'єкт ТОВ "ВЕКТОР" внесено до реєстру боржників.',
      time: '10 хв тому',
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: 'Моніторинг завершено',
      message: 'Автоматичну перевірку 45 компаній успішно виконано.',
      time: '1 год тому',
      read: false,
    },
    {
      id: '3',
      type: 'info',
      title: 'Оновлення джерела ЄДРПОУ',
      message: 'Отримано 1,200 нових записів за останню добу.',
      time: '3 год тому',
      read: true,
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
        aria-label="Сповіщення"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden"
            >
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Сповіщення</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-mono font-bold">
                      {unreadCount} нових
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-slate-400 hover:text-blue-400 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={12} /> прочитати все
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Немає активних сповіщень
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.id}
                      className={`p-3.5 flex items-start gap-3 transition-colors ${
                        item.read ? 'opacity-60 bg-transparent' : 'bg-slate-800/20'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'risk' && <ShieldAlert size={16} className="text-red-400" />}
                        {item.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
                        {item.type === 'info' && <Info size={16} className="text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                          <span className="text-[9px] font-mono text-slate-500 shrink-0">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{item.message}</p>
                      </div>
                      <button
                        onClick={() => removeNotification(item.id)}
                        className="text-slate-600 hover:text-slate-400 p-0.5 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
