const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The easiest way is to just use a quick regex or comment them out, but let's just use eslint --fix with a config that removes unused variables.
