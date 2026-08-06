import React from 'react';
import { TimelineEvent } from '../../../types/search';
import { Clock, History, Edit3 } from 'lucide-react';

interface TimelineBlockProps {
  events: TimelineEvent[];
}

export const TimelineBlock: React.FC<TimelineBlockProps> = ({ events }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Хронологія</h2>
      </div>
      <div className="p-6">
        <div className="relative border-l border-slate-700 ml-3 space-y-6">
          {events.map((event, idx) => (
            <div key={idx} className="relative pl-6">
              <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center">
                {event.status === 'NEW' ? (
                  <Clock size={12} className="text-emerald-400" />
                ) : event.status === 'UPDATED' ? (
                  <Edit3 size={12} className="text-blue-400" />
                ) : (
                  <History size={12} className="text-slate-400" />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-white">{event.event}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <span className="bg-slate-800/50 px-2 py-0.5 rounded text-blue-400">{event.source}</span>
                    <span>•</span>
                    <span className={event.status === 'HISTORICAL' ? 'text-slate-500' : 'text-slate-400'}>
                      {event.status === 'NEW' ? 'З\'явився' : event.status === 'UPDATED' ? 'Оновлено' : 'Було раніше'}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {new Date(event.date).toLocaleDateString('uk-UA')}
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="pl-6 text-slate-500 text-sm">Хронологія подій відсутня.</div>
          )}
        </div>
      </div>
    </div>
  );
};
