const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// Update Critical Threat Alerts Panel container
code = code.replace(
  /<div className="bg-slate-900\/40 border border-slate-800 rounded-2xl p-2 shadow-\[0_4px_30px_rgba\(225,29,72,0\.05\)\] space-y-3\.5 relative overflow-hidden">/g,
  '<div className="bg-slate-900 border border-slate-800 rounded-lg p-0 flex flex-col h-full">'
);

// Update Critical Threat Alerts Header
code = code.replace(
  /<span className="text-xs text-rose-500 font-mono font-bold uppercase tracking-widest flex items-center justify-between border-b border-slate-800 pb-2">/g,
  '<div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center"><h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest text-rose-500">Critical Alerts</h3><span className="text-[10px] text-indigo-400 font-semibold">Live</span></div>'
);

code = code.replace(
  /<div\s*className="bg-slate-950\/70 border border-slate-800 rounded-2xl p-2 flex flex-col gap-2 transition-all duration-300 ease-out cursor-pointer group hover:bg-slate-900\/80 hover:border-rose-400\/50 hover:-translate-y-\[1px\] relative overflow-hidden"\s*>/g,
  '<div className="p-4 border-b border-slate-800/50 flex flex-col gap-2 hover:bg-slate-800/20 cursor-pointer relative group transition-colors">'
);

// Data Integration Status Panel container
code = code.replace(
  /<div className="bg-slate-900\/40 border border-slate-800 rounded-2xl p-2 shadow-\[0_4px_40px_rgba\(30,58,138,0\.05\)\] space-y-3\.5">/g,
  '<div className="bg-slate-900 border border-slate-800 rounded-lg p-0 flex flex-col h-full mt-6">'
);

fs.writeFileSync('src/components/DashboardView.tsx', code);
