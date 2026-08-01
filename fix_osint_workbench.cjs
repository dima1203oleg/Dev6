const fs = require('fs');
let code = fs.readFileSync('src/components/OsintWorkbench.tsx', 'utf8');

// Change root container padding/bg
code = code.replace(
  /<div className="space-y-6 relative p-2 rounded-lg overflow-hidden transition-all duration-1000" id="osint-workbench-root">/,
  '<div className="flex-1 p-6 flex flex-col gap-6 bg-slate-950 h-full relative" id="osint-workbench-root">'
);

fs.writeFileSync('src/components/OsintWorkbench.tsx', code);
