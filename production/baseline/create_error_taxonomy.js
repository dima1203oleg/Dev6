#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read the TypeScript error output
const errorFile = '/var/folders/x8/g653nl_n0s145d_3zd8dhf7r0000gp/T/devin-overflows-502/shell-5ba961-18757037c83cd53e/content.txt';

if (!fs.existsSync(errorFile)) {
  console.error('Error file not found. Run typecheck first.');
  process.exit(1);
}

const errorOutput = fs.readFileSync(errorFile, 'utf8');
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
  OTHER: 0
};

const errorDetails = [];
const fileErrorCounts = {};

errorLines.forEach(line => {
  // Parse error line: file(line,col): error CODE: message
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
    }
    
    errorCategories[category]++;
    
    // Track file error counts
    const fileKey = file.replace(/^server\//, '').replace(/^src\//, '');
    fileErrorCounts[fileKey] = (fileErrorCounts[fileKey] || 0) + 1;
    
    errorDetails.push({
      file: fileKey,
      line: lineNum,
      column: col,
      code: code,
      message: message,
      category: category,
      package: file.startsWith('server/') ? 'server' : 'src'
    });
  }
});

// Determine package distribution
const packageDistribution = {
  server: errorDetails.filter(e => e.package === 'server').length,
  src: errorDetails.filter(e => e.package === 'src').length
};

// Find top 20 files with most errors
const topFiles = Object.entries(fileErrorCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([file, count]) => ({ file, count }));

const taxonomy = {
  baseline_timestamp: new Date().toISOString(),
  total_errors: errorLines.length,
  error_categories: errorCategories,
  package_distribution: packageDistribution,
  top_20_files: topFiles,
  error_details: errorDetails,
  summary: {
    most_common_category: Object.entries(errorCategories).sort((a, b) => b[1] - a[1])[0],
    most_problematic_file: topFiles[0],
    certification_engine_errors: errorDetails.filter(e => 
      e.file.includes('certification') || 
      e.file.includes('RegistryCertifier') ||
      e.file.includes('FakeDataScanner') ||
      e.file.includes('HardcodedIdentifierScanner') ||
      e.file.includes('EvidenceChain') ||
      e.file.includes('ProductionAcceptanceContract')
    ).length
  }
};

// Save taxonomy
const outputPath = '/Users/dima1203/Downloads/predator8/production/baseline/typescript_error_taxonomy.json';
fs.writeFileSync(outputPath, JSON.stringify(taxonomy, null, 2));

console.log('Error taxonomy created:');
console.log(`Total errors: ${taxonomy.total_errors}`);
console.log(`Most common category: ${taxonomy.summary.most_common_category[0]} (${taxonomy.summary.most_common_category[1]} errors)`);
console.log(`Most problematic file: ${taxonomy.summary.most_problematic_file.file} (${taxonomy.summary.most_problematic_file.count} errors)`);
console.log(`Certification engine errors: ${taxonomy.summary.certification_engine_errors}`);
console.log(`Saved to: ${outputPath}`);