const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newFooter = `<footer className="h-8 bg-indigo-600 px-6 flex items-center justify-between text-[10px] text-indigo-100 shrink-0 z-40 relative">
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>Node 20.x</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> System Synced</span>
          <span>1024.768MB / 1.5GB Memory</span>
        </div>
      </footer>`;

// The desktop footer appears at the end of the main view? No, let's just find where it is.
// Actually there are two footers. One in renderDesktopLayout and maybe one in others.
code = code.replace(
  /<footer className="border-t border-slate-800 bg-slate-950 px-2 py-1\.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono uppercase tracking-wider z-40 sticky bottom-0">[\s\S]*?<\/footer>/g,
  newFooter
);

fs.writeFileSync('src/App.tsx', code);
