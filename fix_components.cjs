const fs = require('fs');

const filesToUpdate = [
  'src/components/AdminBackOffice.tsx',
  'src/components/DataIngestionTab.tsx',
  'src/components/DataOnboardingCenter.tsx',
  'src/components/GapAnalysisTab.tsx',
  'src/components/InvestigationSandbox.tsx',
  'src/components/LiveAnalyticalCenter.tsx',
  'src/components/LiveChatBot.tsx',
  'src/components/PersonProfiler.tsx',
  'src/components/RoadmapTab.tsx',
  'src/components/VolumesTab.tsx',
  'src/components/ArchitectureGraphTab.tsx'
];

for (const file of filesToUpdate) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Attempt to standardize the root container
    // Let's replace top level <div className="space-y-..." with <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-950 h-full"
    code = code.replace(
      /<div className="(space-y-[^"]*)"\s*id="([^"]+)">/,
      '<div className="flex-1 p-6 flex flex-col gap-6 bg-slate-950 h-full" id="$2">'
    );

    code = code.replace(
      /<div className="(space-y-[^"]*)">/,
      '<div className="flex-1 p-6 flex flex-col gap-6 bg-slate-950 h-full">'
    );
    
    fs.writeFileSync(file, code);
  }
}
