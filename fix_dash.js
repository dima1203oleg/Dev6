const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

code = code.replace(
  /\{\/\* AI Executive Summary Panel \*\/\}\n\s+\)\)\;\n\s+<\/div>\n\s+<Bot className="w-24 h-24 text-blue-500" \/>/g,
  `{/* AI Executive Summary Panel */}
      <div className="bg-gradient-to-r from-blue-950/40 to-[#02050a]/80 glass-panel-premium border border-slate-800 rounded-2xl shadow-xl p-2 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
          <Bot className="w-24 h-24 text-blue-500" />`
);

// wait actually, let's just do a simpler replace.
