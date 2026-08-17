/**
 * PREDATOR Fake Data Scanner
 * Production Acceptance Contract - P0.2
 * 
 * Automated scan for fake/mock data in production code
 * 
 * Forbidden patterns:
 * - mock
 * - fake
 * - fixture
 * - demo
 * - sample
 * - dummy
 * - fallback
 * - hardcoded
 * - test data
 * - placeholder
 * 
 * Production connector MUST NOT return synthetic data even if external API is unavailable.
 * If source is unavailable: UNAVAILABLE (not SUCCESS + empty/synthetic response)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface FakeDataFinding {
  file: string;
  line: number;
  column: number;
  pattern: string;
  context: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'MOCK_DATA' | 'HARDCODED_VALUE' | 'FALLBACK_DATA' | 'TEST_DATA' | 'PLACEHOLDER';
}

export interface ScanResult {
  totalFiles: number;
  scannedFiles: number;
  findings: FakeDataFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<string, number>;
  };
  productionReady: boolean;
}

export class FakeDataScanner {
  private patterns: Array<{
    regex: RegExp;
    pattern: string;
    category: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }> = [
    // Critical patterns - hardcoded test values in production paths
    {
      regex: /testCode\s*=\s*["']\d+["']/g,
      pattern: 'testCode = "..."',
      category: 'HARDCODED_VALUE',
      severity: 'CRITICAL'
    },
    {
      regex: /testIPN\s*=\s*["']\d+["']/g,
      pattern: 'testIPN = "..."',
      category: 'HARDCODED_VALUE',
      severity: 'CRITICAL'
    },
    {
      regex: /defaultEDRPOU\s*=\s*["']\d+["']/g,
      pattern: 'defaultEDRPOU = "..."',
      category: 'HARDCODED_VALUE',
      severity: 'CRITICAL'
    },
    {
      regex: /14360570/g,
      pattern: '14360570 (hardcoded EDRPOU)',
      category: 'HARDCODED_VALUE',
      severity: 'CRITICAL'
    },
    
    // High severity - mock/fake data
    {
      regex: /mock\s*[:=]\s*\{/g,
      pattern: 'mock: {',
      category: 'MOCK_DATA',
      severity: 'HIGH'
    },
    {
      regex: /fake\s*[:=]\s*\{/g,
      pattern: 'fake: {',
      category: 'MOCK_DATA',
      severity: 'HIGH'
    },
    {
      regex: /fixture\s*[:=]\s*\{/g,
      pattern: 'fixture: {',
      category: 'TEST_DATA',
      severity: 'HIGH'
    },
    {
      regex: /demo\s*[:=]\s*\{/g,
      pattern: 'demo: {',
      category: 'TEST_DATA',
      severity: 'HIGH'
    },
    
    // Medium severity - fallback/placeholder
    {
      regex: /fallback\s*[:=]\s*\{/g,
      pattern: 'fallback: {',
      category: 'FALLBACK_DATA',
      severity: 'MEDIUM'
    },
    {
      regex: /placeholder\s*[:=]/g,
      pattern: 'placeholder:',
      category: 'PLACEHOLDER',
      severity: 'MEDIUM'
    },
    {
      regex: /dummy\s*[:=]/g,
      pattern: 'dummy:',
      category: 'PLACEHOLDER',
      severity: 'MEDIUM'
    },
    
    // Low severity - test data in test files
    {
      regex: /test\s*data/gi,
      pattern: 'test data',
      category: 'TEST_DATA',
      severity: 'LOW'
    },
    {
      regex: /sample\s*data/gi,
      pattern: 'sample data',
      category: 'TEST_DATA',
      severity: 'LOW'
    }
  ];
  
  private excludedPaths: string[] = [
    'node_modules',
    'dist',
    '.git',
    'tests',
    'test',
    '__tests__',
    'spec',
    'fixtures',
    'mock',
    '.vscode',
    '.idea',
    'temp_import',   // raw data imports — not source code
    'backup',
    'uploads',
    'certification', // scanner tooling — contains pattern definitions, not production data
    'scripts'        // one-off scripts — not production runtime
  ];
  
  private excludedExtensions: string[] = [
    '.md',
    '.txt',
    '.json',
    '.yaml',
    '.yml',
    '.lock',
    '.map',
    '.xml',   // data files — not source code
    '.csv',
    '.sql',
    '.gz',
    '.zip'
  ];
  
  /**
   * Scan directory for fake data patterns
   */
  scanDirectory(rootPath: string, productionMode: boolean = true): ScanResult {
    const findings: FakeDataFinding[] = [];
    let totalFiles = 0;
    let scannedFiles = 0;
    
    this.scanRecursive(rootPath, rootPath, findings, totalFiles, scannedFiles, productionMode);
    
    const summary = this.summarizeFindings(findings);
    
    return {
      totalFiles,
      scannedFiles,
      findings,
      summary,
      productionReady: summary.critical === 0 && summary.high === 0
    };
  }
  
  /**
   * Recursively scan directory
   */
  private scanRecursive(
    currentPath: string,
    rootPath: string,
    findings: FakeDataFinding[],
    totalFiles: number,
    scannedFiles: number,
    productionMode: boolean
  ): void {
    try {
      const items = readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = join(currentPath, item);
        const relativePath = itemPath.replace(rootPath + '/', '');
        
        // Skip excluded paths
        if (this.excludedPaths.some(excluded => relativePath.includes(excluded))) {
          continue;
        }
        
        const stats = statSync(itemPath);
        
        if (stats.isDirectory()) {
          this.scanRecursive(itemPath, rootPath, findings, totalFiles, scannedFiles, productionMode);
        } else if (stats.isFile()) {
          totalFiles++;
          
          // Skip excluded extensions
          const ext = extname(itemPath);
          if (this.excludedExtensions.includes(ext)) {
            continue;
          }
          
          // Skip test files in production mode
          if (productionMode && this.isTestFile(itemPath)) {
            continue;
          }
          
          scannedFiles++;
          this.scanFile(itemPath, findings, productionMode);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${currentPath}:`, error);
    }
  }
  
  /**
   * Check if file is a test file
   */
  private isTestFile(filePath: string): boolean {
    const lowerPath = filePath.toLowerCase();
    return lowerPath.includes('test') || 
           lowerPath.includes('spec') || 
           lowerPath.includes('__tests__') ||
           lowerPath.endsWith('.test.ts') ||
           lowerPath.endsWith('.test.js') ||
           lowerPath.endsWith('.spec.ts') ||
           lowerPath.endsWith('.spec.js');
  }
  
  /**
   * Scan individual file
   */
  private scanFile(filePath: string, findings: FakeDataFinding[], productionMode: boolean): void {
    try {
      // Skip files larger than 10MB to prevent ERR_STRING_TOO_LONG on large data files (e.g. XML dumps)
      const MAX_SCAN_SIZE = 10 * 1024 * 1024; // 10MB
      const stats = statSync(filePath);
      if (stats.size > MAX_SCAN_SIZE) {
        return;
      }
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const patternConfig of this.patterns) {
        // Skip LOW severity patterns in production mode
        if (productionMode && patternConfig.severity === 'LOW') {
          continue;
        }
        
        let match;
        const regex = new RegExp(patternConfig.regex.source, 'gi');
        
        while ((match = regex.exec(content)) !== null) {
          const lineIndex = content.substring(0, match.index).split('\n').length - 1;
          const line = lines[lineIndex] || '';
          const column = match.index - content.lastIndexOf('\n', match.index - 1) - 1;
          
          findings.push({
            file: filePath,
            line: lineIndex + 1,
            column,
            pattern: patternConfig.pattern,
            context: line.trim(),
            severity: patternConfig.severity,
            category: patternConfig.category as any
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
    }
  }
  
  /**
   * Summarize findings
   */
  private summarizeFindings(findings: FakeDataFinding[]) {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      byCategory: {} as Record<string, number>
    };
    
    for (const finding of findings) {
      summary[finding.severity.toLowerCase() as keyof typeof summary]++;
      summary.byCategory[finding.category] = (summary.byCategory[finding.category] || 0) + 1;
    }
    
    return summary;
  }
  
  /**
   * Check if production connector returns synthetic data
   */
  checkConnectorForSyntheticData(connectorCode: string): FakeDataFinding[] {
    const findings: FakeDataFinding[] = [];
    
    // Check for return statements with hardcoded data
    const syntheticPatterns = [
      {
        regex: /return\s*\{[^}]*test[^}]*\}/gi,
        pattern: 'return { ...test... }',
        category: 'MOCK_DATA',
        severity: 'CRITICAL'
      },
      {
        regex: /return\s*\{[^}]*mock[^}]*\}/gi,
        pattern: 'return { ...mock... }',
        category: 'MOCK_DATA',
        severity: 'CRITICAL'
      },
      {
        regex: /return\s*\{[^}]*fallback[^}]*\}/gi,
        pattern: 'return { ...fallback... }',
        category: 'FALLBACK_DATA',
        severity: 'CRITICAL'
      },
      {
        regex: /return\s*\[\]/g,
        pattern: 'return []',
        category: 'FALLBACK_DATA',
        severity: 'HIGH'
      },
      {
        regex: /return\s*null/g,
        pattern: 'return null',
        category: 'FALLBACK_DATA',
        severity: 'HIGH'
      }
    ];
    
    const lines = connectorCode.split('\n');
    
    for (const patternConfig of syntheticPatterns) {
      let match;
      const regex = new RegExp(patternConfig.regex.source, 'gi');
      
      while ((match = regex.exec(connectorCode)) !== null) {
        const lineIndex = connectorCode.substring(0, match.index).split('\n').length - 1;
        const line = lines[lineIndex] || '';
        const column = match.index - connectorCode.lastIndexOf('\n', match.index - 1) - 1;
        
        findings.push({
          file: 'connector',
          line: lineIndex + 1,
          column,
          pattern: patternConfig.pattern,
          context: line.trim(),
          severity: patternConfig.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
          category: patternConfig.category as any
        });
      }
    }
    
    return findings;
  }
  
  /**
   * Validate production readiness
   */
  validateProductionReady(scanResult: ScanResult): {
    ready: boolean;
    blockers: string[];
    warnings: string[];
  } {
    const blockers: string[] = [];
    const warnings: string[] = [];
    
    if (scanResult.summary.critical > 0) {
      blockers.push(`${scanResult.summary.critical} CRITICAL findings found - hardcoded test values in production code`);
    }
    
    if (scanResult.summary.high > 0) {
      blockers.push(`${scanResult.summary.high} HIGH findings found - mock/fake data detected`);
    }
    
    if (scanResult.summary.medium > 0) {
      warnings.push(`${scanResult.summary.medium} MEDIUM findings found - fallback/placeholder data`);
    }
    
    if (scanResult.summary.low > 0) {
      warnings.push(`${scanResult.summary.low} LOW findings found - test data patterns`);
    }
    
    // Check for specific categories
    if ((scanResult.summary.byCategory['HARDCODED_VALUE'] || 0) > 0) {
      blockers.push('Hardcoded production identifiers found - must use test-only mode');
    }
    
    if ((scanResult.summary.byCategory['MOCK_DATA'] || 0) > 0) {
      blockers.push('Mock data found in production code - connectors must return real data only');
    }
    
    if ((scanResult.summary.byCategory['FALLBACK_DATA'] || 0) > 0) {
      blockers.push('Fallback data found - connectors must return UNAVAILABLE status instead');
    }
    
    return {
      ready: blockers.length === 0,
      blockers,
      warnings
    };
  }
}

// Singleton instance
export const fakeDataScanner = new FakeDataScanner();
