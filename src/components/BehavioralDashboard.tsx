import React, { useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import { Brain, Activity, Target, ShieldAlert, Fingerprint, Eye, Zap, Lock, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface BehavioralDashboardProps {
  personName?: string;
}

const cognitiveData = [
  { subject: 'Схильність до ризику', A: 85, fullMark: 100 },
  { subject: 'Ймовірність обману', A: 78, fullMark: 100 },
  { subject: 'Раціональність', A: 45, fullMark: 100 },
  { subject: 'Емоційна стабільність', A: 30, fullMark: 100 },
  { subject: 'Агресивність', A: 90, fullMark: 100 },
  { subject: 'Імпульсивність', A: 82, fullMark: 100 },
];

const stressData = [
  { time: '09:00', stress: 30 },
  { time: '10:00', stress: 45 },
  { time: '11:00', stress: 80 },
  { time: '12:00', stress: 85 },
  { time: '13:00', stress: 60 },
  { time: '14:00', stress: 90 },
  { time: '15:00', stress: 95 },
];

const trustMetrics = [
  { name: 'Достовірність', value: 35, fill: '#ef4444' }, // red
  { name: 'Послідовність', value: 42, fill: '#f97316' }, // orange
  { name: 'Прозорість', value: 20, fill: '#ef4444' }, // red
  { name: 'Надійність', value: 48, fill: '#f59e0b' }, // amber
];

export default function BehavioralDashboard({ personName = 'Об\'єкт' }: BehavioralDashboardProps) {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full animate-pulse"></div>
            <Brain className="w-5 h-5 text-indigo-400 relative z-10" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Поведінковий та Когнітивний Профіль</h2>
            <p className="text-xs text-slate-400 font-mono">ID: {personName.toUpperCase()} // PREDATOR ПСИХО-АНАЛІЗ</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Загальний Рейтинг Довіри</div>
            <div className="text-3xl font-black font-mono text-rose-500 flex items-baseline justify-end gap-1">
              28<span className="text-xs text-slate-500 font-medium">/100</span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Рівень Загрози</div>
            <div className="text-sm font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
               <ShieldAlert className="w-4 h-4" />
               Critical
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cognitive Radar */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Когнітивний Відбиток</h3>
          </div>
          <div className="flex-1 min-h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={cognitiveData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Profile" dataKey="A" stroke="#818cf8" strokeWidth={2} fill="#6366f1" fillOpacity={0.2} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '12px', borderRadius: '8px' }}
                  itemStyle={{ color: '#818cf8' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-200/80 leading-relaxed font-medium relative z-10">
            <span className="text-indigo-400 font-bold">Аналіз:</span> Виражена макіавеллістична поведінка. Висока толерантність до ризику поєднується з імпульсивністю та низьким рівнем емпатії.
          </div>
        </div>

        {/* Stress / Emotional Timeline */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Vocal/Text Stress Analysis (Timeline)</h3>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono uppercase bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div> High Stress Peak
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[200px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '12px', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#f43f5e' }}
                />
                <Area type="monotone" dataKey="stress" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorStress)" activeDot={{ r: 6, fill: '#fb7185', stroke: '#0f172a' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Trust Metrics */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Матриця Оцінки Довіри</h3>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trustMetrics} layout="vertical" margin={{ top: 0, right: 20, left: -10, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={90} />
                <RechartsTooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: '12px', color: '#f8fafc', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {trustMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Behavioral Flags */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Fingerprint className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Ключові Поведінкові Маркери</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 transition-colors">
              <Eye className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-rose-300 uppercase tracking-wide mb-1.5">Оманлива Лінгвістика</h4>
                <p className="text-[10px] text-rose-200/60 leading-relaxed font-medium">Систематичне уникнення прямих відповідей, використання пасивного стану та дистанціювання в мовленні під час стресових інтерв'ю.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-colors">
              <Zap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wide mb-1.5">Volatile Reactions</h4>
                <p className="text-[10px] text-amber-200/60 leading-relaxed font-medium">Схильність до мікроагресії при втраті контролю над розмовою. Різкі зміни емоційного фону.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-colors">
              <Lock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-1.5">Info Compartmentalization</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Жорсткий контроль над поширенням особистої та фінансової інформації. Ознаки професійної підготовки.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
