const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

code = code.replace(
  /const relCount = ent.relationships\?.length \|\| 0;/,
  'let x = 50;\n    const relCount = ent.relationships?.length || 0;'
);

fs.writeFileSync('src/components/DashboardView.tsx', code);
