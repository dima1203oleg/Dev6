const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

code = code.replace(
  /\.glass-panel-premium\s*\{[\s\S]*?\}/,
  `.glass-panel-premium {
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 0.5rem;
  box-shadow: none;
}`
);

code = code.replace(
  /\.glass-panel\s*\{[\s\S]*?\}/,
  `.glass-panel {
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 0.5rem;
  box-shadow: none;
}`
);

code = code.replace(
  /background-color: #020617;[\s\S]*?background-attachment: fixed;/g,
  `background-color: #020617;`
);

fs.writeFileSync('src/index.css', code);
