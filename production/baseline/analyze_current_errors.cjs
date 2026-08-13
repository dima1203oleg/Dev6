#!/usr/bin/env node

const fs = require('fs');

// Get current TypeScript errors
const exec = require('child_process').execSync;
let errorOutput;
try {
  errorOutput = exec('cd /Users/dima1203/Downloads/predator8/server && npm run typecheck 2>&1', { encoding: 'utf8' });
} catch (error) {
  errorOutput = error.stdout || error.stderr || '';
}
const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));

const errorCategories = {
  UNUSED_VARIABLE: 0,
  UNUSED_PARAMETER: 0,
  IMPLICIT_ANY: 0,
  NULLABILITY: 0,
  MISSING_PROPERTY: 0,
  TYPE_MISMATCH: 0,
  IMPORT: 0,
  EXPORT: 0,
  MODULE: 0,
  INDEX_SIGNATURE: 0,
  OTHER: 0
};

const rootCauseMap = {};
const fileErrorCounts = {};

errorLines.forEach(line => {
  const match = line.match(/(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/);
  if (match) {
    const [, file, lineNum, col, code, message] = match;
    
    // Determine category
    let category = 'OTHER';
    if (code === 'TS6133' && message.includes('is declared but its value is never read')) {
      category = 'UNUSED_VARIABLE';
    } else if (code === 'TS6133' && message.includes('parameter')) {
      category = 'UNUSED_PARAMETER';
    } else if (code === 'TS7006' || code === 'TS7005') {
      category = 'IMPLICIT_ANY';
    } else if (code === 'TS2532' || code === 'TS18048') {
      category = 'NULLABILITY';
    } else if (code === 'TS2339' || code === 'TS2551') {
      category = 'MISSING_PROPERTY';
    } else if (code === 'TS2345' || code === 'TS2740' || code === 'TS2739') {
      category = 'TYPE_MISMATCH';
    } else if (code === 'TS2307' || code === 'TS2305') {
      category = 'IMPORT';
    } else if (code === 'TS2459' || code === 'TS1205') {
      category = 'EXPORT';
    } else if (code === 'TS2300') {
      category = 'MODULE';
    } else if (code === 'TS4111') {
      category = 'INDEX_SIGNATURE';
    }
    
    errorCategories[category]++;
    
    // Track file error counts
    const fileKey = file.replace(/^server\//, '').replace(/^src\//, '');
    fileErrorCounts[fileKey] = (fileErrorCounts[fileKey] || 0) + 1;
    
    // Track root causes
    const rootCause = `${code}: ${message.substring(0, 50)}`;
    rootCauseMap[rootCause] = (rootCauseMap[rootCause] || 0) + 1;
  }
});

// Find top 10 root causes
const topRootCauses = Object.entries(rootCauseMap)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([cause, count]) => ({ cause, count }));

// Find top 20 files
const topFiles = Object.entries(fileErrorCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([file, count]) => ({ file, count }));

const analysis = {
  timestamp: new Date().toISOString(),
  total_errors: errorLines.length,
  error_categories: errorCategories,
  top_10_root_causes: topRootCauses,
  top_20_files: topFiles,
  summary: {
    most_common_category: Object.entries(errorCategories).sort((a, b) => b[1] - a[1])[0],
    most_common_root_cause: topRootCauses[0],
    most_problematic_file: topFiles[0]
  }
};

fs.writeFileSync('/Users/dima1203/Downloads/predator8/production/baseline/current_error_analysis.json', JSON.stringify(analysis, null, 2));

console.log('Current Error Analysis:');
console.log(`Total errors: ${analysis.total_errors}`);
console.log(`Most common category: ${analysis.summary.most_common_category[0]} (${analysis.summary.most_common_category[1]} errors)`);
console.log(`Most common root cause: ${analysis.summary.most_common_root_cause.cause} (${analysis.summary.most_common_root_cause.count} errors)`);
console.log(`Most problematic file: ${analysis.summary.most_problematic_file.file} (${analysis.summary.most_problematic_file.count} errors)`);
console.log('Saved to: production/baseline/current_error_analysis.json');