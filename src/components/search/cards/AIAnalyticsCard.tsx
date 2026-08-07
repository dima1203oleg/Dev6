import React, { useEffect, useState } from 'react';
import { BrainCircuit, Activity, ShieldAlert, Target, Zap } from 'lucide-react';
import { CanonicalEntity } from '../../../types/predator';

interface AIAnalyticsCardProps {
  entity: CanonicalEntity;
  riskData?: any;
}

export const AIAnalyticsCard: React.FC<AIAnalyticsCardProps> = ({ entity, riskData }) => {
  const [typingIndex, setTypingIndex] = useState(0);
  
  const riskScore = riskData?.score || 0;
  const aiSummaryText = riskData?.summary || `Аналіз PREDATOR AI: Аналіз проведено успішно. Інформації для розрахунку високого ризику недостатньо.`;

  useEffect(() => {
    if (typingIndex < aiSummaryText.length) {
      const timer = setTimeout(() => {
        setTypingIndex(prev => prev + 1);
      }, 20); // Typing speed
      return () => clearTimeout(timer);
    }
  }, [typingIndex, aiSummaryText]);

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-xl overflow-hidden relative group">
      {/* Dynamic animated border gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000 blur-xl z-0" />
      
      <div className="relative z-10 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
          <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase tracking-wider flex items-center gap-2">
            <BrainCircuit size={18} className="text-indigo-400" />
            PREDATOR AI ENGINE
          </h3>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] text-indigo-400 font-mono tracking-widest">LIVE INFERENCE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score & Chart area */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 bg-slate-950/50 border border-slate-800 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/0 to-slate-900/0" />
            
            <svg className="w-32 h-32 transform -rotate-90 relative z-10" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="url(#gradient)" strokeWidth="8" 
                strokeDasharray="283" 
                strokeDashoffset={283 - (283 * riskScore) / 100}
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-1500 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">{riskScore}</span>
              <span className="text-[10px] font-mono text-slate-500 tracking-widest mt-1">TRUST SCORE</span>
            </div>
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 min-h-[120px] relative font-mono text-sm leading-relaxed text-indigo-100/80">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />
              <span className="text-indigo-400 mr-2">{'>'}</span>
              {aiSummaryText.substring(0, typingIndex)}
              {typingIndex < aiSummaryText.length && (
                <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg flex flex-col gap-2">
                <Activity size={16} className="text-emerald-400" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Економічна активність</span>
                <span className="text-xs font-bold text-white">Стабільна</span>
              </div>
              <div className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg flex flex-col gap-2">
                <ShieldAlert size={16} className="text-amber-400" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Юридичні ризики</span>
                <span className="text-xs font-bold text-white">Виявлено (3)</span>
              </div>
              <div className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg flex flex-col gap-2">
                <Target size={16} className="text-blue-400" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Точність ідентифікації</span>
                <span className="text-xs font-bold text-white">99.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly Detection */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-yellow-400 fill-yellow-400/20" />
            <span className="text-xs text-slate-300 font-medium">Виявлено поведінкові аномалії: <span className="text-white font-bold">1</span></span>
          </div>
          <button className="text-[10px] uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors font-bold border border-indigo-500/30 hover:bg-indigo-500/10 px-3 py-1.5 rounded">
            Деталізувати граф
          </button>
        </div>
      </div>
    </div>
  );
};
