import React from 'react';
import { Landmark, AlertTriangle, Scale, FileText, CheckCircle2 } from 'lucide-react';
import { CanonicalEntity } from '../../../types/predator';

interface CourtCasesCardProps {
  entity: CanonicalEntity;
  courtData?: any;
}

export const CourtCasesCard: React.FC<CourtCasesCardProps> = ({ entity, courtData }) => {
  // If no court data provided, use default empty/safe state
  const data = courtData || {
    totalCases: 0,
    criminal: 0,
    administrative: 0,
    civil: 0,
    economic: 0,
    recentCases: []
  };

  const hasCases = data.totalCases > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Landmark size={16} className={hasCases ? "text-cyan-400" : "text-emerald-400"} />
          Судові справи (ЄДРСР)
        </h3>
        <span className="text-xs text-slate-500 font-mono">COURT.GOV.UA</span>
      </div>

      {!hasCases ? (
        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Судових проваджень не виявлено</h4>
            <p className="text-xs text-slate-400">Перевірка за всіма ідентифікаторами дала негативний результат. Судова історія чиста.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Знайдено судові справи: {data.totalCases}</h4>
              <p className="text-xs text-slate-400">Фігурує в єдиному державному реєстрі судових рішень.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
              <div className="text-xs text-slate-500 uppercase font-mono mb-1">Кримінальні</div>
              <div className={`text-2xl font-black ${data.criminal > 0 ? 'text-rose-500' : 'text-slate-600'}`}>{data.criminal}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
              <div className="text-xs text-slate-500 uppercase font-mono mb-1">Адмін.</div>
              <div className={`text-2xl font-black ${data.administrative > 0 ? 'text-amber-500' : 'text-slate-600'}`}>{data.administrative}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
              <div className="text-xs text-slate-500 uppercase font-mono mb-1">Цивільні</div>
              <div className={`text-2xl font-black ${data.civil > 0 ? 'text-blue-500' : 'text-slate-600'}`}>{data.civil}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
              <div className="text-xs text-slate-500 uppercase font-mono mb-1">Господарські</div>
              <div className={`text-2xl font-black ${data.economic > 0 ? 'text-indigo-500' : 'text-slate-600'}`}>{data.economic}</div>
            </div>
          </div>

          {data.recentCases.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Scale size={14} /> Останні справи
              </h4>
              <div className="space-y-2">
                {data.recentCases.map((c: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg flex items-start gap-3">
                    <FileText size={16} className="text-slate-500 mt-1 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{c.caseNumber}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">{c.date}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{c.role}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{c.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
