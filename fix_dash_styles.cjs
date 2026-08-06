const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// The main grid layout
code = code.replace(
  /<div className="grid grid-cols-1 xl:grid-cols-12 gap-2">/,
  '<div className="grid grid-cols-1 xl:grid-cols-12 gap-6">'
);

// Map Widget container
code = code.replace(
  /<div className="bg-slate-900\/40 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black\/40 space-y-4">/,
  '<div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col gap-4 shadow-none">'
);

// Risks widget container
code = code.replace(
  /<div className="glass-panel-premium border border-slate-800 rounded-2xl p-3 flex flex-col gap-3 relative overflow-hidden h-full">/,
  '<div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col gap-4 relative overflow-hidden h-full">'
);

// Change border-b border-slate-800 pb-3 to px-4 py-3 border-b border-slate-800 (for headers inside cards if applicable)
code = code.replace(
  /<div className="flex items-center justify-between border-b border-slate-800 pb-3">/g,
  '<div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">'
);

// Update criticalRisks items to look like commit rows
code = code.replace(
  /<div\s+key=\{i\}\s+className="p-3 bg-slate-950\/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors cursor-pointer relative group"\s*>/g,
  '<div key={i} className="p-4 border-b border-slate-800/50 flex gap-4 hover:bg-slate-800/20 cursor-pointer relative group transition-colors">'
);

fs.writeFileSync('src/components/DashboardView.tsx', code);
