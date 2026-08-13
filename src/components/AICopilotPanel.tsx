import { useState } from 'react';
import { Send, X, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dossier } from '../types';

interface AICopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: Dossier | null;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export function AICopilotPanel({ isOpen, onClose, dossier }: AICopilotPanelProps) {
  const entityName = dossier?.entity ? ((dossier.entity as any).name || (dossier.entity as any).fullName || (dossier.entity as any).plate || "поточного об'єкта") : "поточного об'єкта";

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: dossier 
        ? `Вітаю. Я готовий проаналізувати досьє для "${entityName}". Поставте запитання щодо ризиків, зв'язків або нерухомості.`
        : "Вітаю. Я PREDATOR AI Copilot. Оберіть об'єкт або поставте загальне аналітичне запитання.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAnalyzing(true);

    setTimeout(() => {
      let reply = "На основі наявних реєстрів ЄДРПОУ та ДПС, прямих фактів правопорушень не виявлено.";
      if (input.toLowerCase().includes('ризик') || input.toLowerCase().includes('risk')) {
        reply = `Аналіз ризиків: Загальний рівень оцінено як ${dossier?.risk?.score || 15}/100. Основний фактор — відсутність активних виконавчих проваджень, але є приналежність до 2 пов'язаних компаній.`;
      } else if (input.toLowerCase().includes('зв') || input.toLowerCase().includes('связ')) {
        reply = "Виявлено 3 афілійовані фізичні особи та 1 юридичну особу в мережі зв'язків (директори/засновники).";
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsAnalyzing(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    AI Copilot Panel
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {entityName}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isAnalyzing && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono p-2 bg-indigo-500/10 rounded-xl w-fit animate-pulse">
                  <RefreshCw size={12} className="animate-spin" />
                  PREDATOR AI обробляє запит...
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Запитайте штучний інтелект..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
