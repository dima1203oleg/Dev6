import React from 'react';
import { History, Clock, FileText, Briefcase, Landmark, Shield, CalendarDays } from 'lucide-react';

interface TimelineEvent {
  date: string;
  type: string;
  title: string;
  description: string;
  source: string;
}

interface ChronologyCardProps {
  entity: any;
  timeline?: TimelineEvent[];
}

export const ChronologyCard: React.FC<ChronologyCardProps> = ({ entity: _entity, timeline = [] }) => {
  // Sort timeline by date descending
  const sortedTimeline = [...timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'registration':
      case 'edr': return <FileText size={14} className="text-blue-400" />;
      case 'court': return <Landmark size={14} className="text-purple-400" />;
      case 'sanction': return <Shield size={14} className="text-rose-400" />;
      case 'procurement': return <Briefcase size={14} className="text-emerald-400" />;
      default: return <Clock size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <History size={16} className="text-indigo-400" />
          Хронологія подій
        </h3>
      </div>

      {sortedTimeline.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Хронологія подій не сформована.
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8 mt-4">
          {sortedTimeline.map((event, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[35px] top-1 bg-slate-900 border-2 border-slate-800 rounded-full p-1.5 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                {getEventIcon(event.type)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <CalendarDays size={12} /> {event.date}
                  </span>
                  <span className="text-slate-600 px-1.5 py-0.5 rounded border border-slate-800 font-mono uppercase text-[9px]">
                    {event.type}
                  </span>
                </div>
                <div className="font-bold text-white text-sm">{event.title}</div>
                <p className="text-xs text-slate-400 max-w-2xl">{event.description}</p>
                <div className="text-[10px] text-slate-500 font-mono mt-2">Джерело: {event.source}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
