/**
 * PREDATOR Hardcoded Identifier Scanner
 * Production Acceptance Contract - P0.3
 * 
 * Automated scan for hardcoded production identifiers
 * 
 * Forbidden patterns:
 * - testCode = "..."
 * - testIPN = "..."
 * - defaultEDRPOU = "..."
 * - Any hardcoded identifiers in production paths
 * 
 * Requirements:
 * - All test identifiers must be test-only
 * - Must be isolated
 * - Must be explicitly marked
 * - Must not be accessible in production runtime
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface HardcodedIdentifierFinding {
  file: string;
  line: number;
  column: number;
  identifierType: 'EDRPOU' | 'IPN' | 'RNOkPP' | 'PASSPORT' | 'PHONE' | 'EMAIL' | 'OTHER';
  identifierValue: string;
  context: string;
  isTestOnly: boolean;
  isProductionAccessible: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface IdentifierScanResult {
  totalFiles: number;
  scannedFiles: number;
  findings: HardcodedIdentifierFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    byType: Record<string, number>;
  };
  productionReady: boolean;
}

export class HardcodedIdentifierScanner {
  private identifierPatterns: Array<{
    regex: RegExp;
    type: 'EDRPOU' | 'IPN' | 'RNOkPP' | 'PASSPORT' | 'PHONE' | 'EMAIL' | 'OTHER';
    description: string;
  }> = [
    // EDRPOU patterns (8 digits)
    {
      regex: /(?:testCode|defaultEDRPOU|edrpou|code)\s*[:=]\s*["']?(\d{8})["']?/gi,
      type: 'EDRPOU',
      description: 'EDRPOU identifier'
    },
    {
      regex: /\b\d{8}\b/g,
      type: 'EDRPOU',
      description: '8-digit number (possible EDRPOU)'
    },
    
    // IPN patterns (10 digits)
    {
      regex: /(?:testIPN|ipn|taxId)\s*[:=]\s*["']?(\d{10})["']?/gi,
      type: 'IPN',
      description: 'IPN identifier'
    },
    {
      regex: /\b\d{10}\b/g,
      type: 'IPN',
      description: '10-digit number (possible IPN)'
    },
    
    // RNOkPP patterns (13 digits)
    {
      regex: /(?:rnokpp|taxNumber)\s*[:=]\s*["']?(\d{13})["']?/gi,
      type: 'RNOkPP',
      description: 'RNOkPP identifier'
    },
    
    // Phone patterns
    {
      regex: /(?:phone|mobile|tel)\s*[:=]\s*["']?(\+?\d{10,15})["']?/gi,
      type: 'PHONE',
      description: 'Phone number'
    },
    
    // Email patterns
    {
      regex: /(?:email|mail)\s*[:=]\s*["']?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']?/gi,
      type: 'EMAIL',
      description: 'Email address'
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
    'config'
  ];
  
  private excludedExtensions: string[] = [
    '.md',
    '.txt',
    '.json',
    '.yaml',
    '.yml',
    '.lock',
    '.map',
    '.env.example'
  ];
  
  /**
   * Scan directory for hardcoded identifiers
   */
  scanDirectory(rootPath: string): IdentifierScanResult {
    const findings: HardcodedIdentifierFinding[] = [];
    let totalFiles = 0;
    let scannedFiles = 0;
    
    this.scanRecursive(rootPath, rootPath, findings, totalFiles, scannedFiles);
    
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
    findings: HardcodedIdentifierFinding[],
    totalFiles: number,
    scannedFiles: number
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
          this.scanRecursive(itemPath, rootPath, findings, totalFiles, scannedFiles);
        } else if (stats.isFile()) {
          totalFiles++;
          
          // Skip excluded extensions
          const ext = extname(itemPath);
          if (this.excludedExtensions.includes(ext)) {
            continue;
          }
          
          // Skip test files
          if (this.isTestFile(itemPath)) {
            continue;
          }
          
          scannedFiles++;
          this.scanFile(itemPath, findings);
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
  private scanFile(filePath: string, findings: HardcodedIdentifierFinding[]): void {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (const patternConfig of this.identifierPatterns) {
        let match;
        const regex = new RegExp(patternConfig.regex.source, 'gi');
        
        while ((match = regex.exec(content)) !== null) {
          const lineIndex = content.substring(0, match.index).split('\n').length - 1;
          const line = lines[lineIndex] || '';
          const column = match.index - content.lastIndexOf('\n', match.index - 1) - 1;
          const identifierValue = match[1] || match[0];
          
          // Check if this is in a test-only context
          const isTestOnly = this.isTestOnlyContext(line, content, lineIndex);
          
          // Check if this is production accessible
          const isProductionAccessible = this.isProductionAccessible(filePath, line, content, lineIndex);
          
          // Determine severity
          let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
          if (isProductionAccessible && !isTestOnly) {
            severity = 'CRITICAL';
          } else if (isProductionAccessible) {
            severity = 'HIGH';
          }
          
          findings.push({
            file: filePath,
            line: lineIndex + 1,
            column,
            identifierType: patternConfig.type,
            identifierValue,
            context: line.trim(),
            isTestOnly,
            isProductionAccessible,
            severity
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
    }
  }
  
  /**
   * Check if identifier is in test-only context
   */
  private isTestOnlyContext(line: string, content: string, lineIndex: number): boolean {
    const lowerLine = line.toLowerCase();
    
    // Explicit test markers
    if (lowerLine.includes('test') || 
        lowerLine.includes('mock') || 
        lowerLine.includes('fixture') ||
        lowerLine.includes('demo')) {
      return true;
    }
    
    // Check if in test function
    const precedingLines = content.split('\n').slice(0, lineIndex).reverse();
    for (const precedingLine of precedingLines) {
      if (precedingLine.includes('describe(') || 
          precedingLine.includes('it(') || 
          precedingLine.includes('test(') ||
          precedingLine.includes('beforeEach(')) {
        return true;
      }
      if (precedingLine.trim() && !precedingLine.trim().startsWith('//')) {
        break;
      }
    }
    
    return false;
  }
  
  /**
   * Check if identifier is production accessible
   */
  private isProductionAccessible(filePath: string, line: string, _content: string, _lineIndex: number): boolean {
    const lowerPath = filePath.toLowerCase();
    
    // Check file location
    if (lowerPath.includes('server/') || lowerPath.includes('api/')) {
      // Server files are production accessible
      return true;
    }
    
    if (lowerPath.includes('test') || lowerPath.includes('spec')) {
      return false;
    }
    
    // Check line context
    const lowerLine = line.toLowerCase();
    
    // Check for production mode guards
    if (lowerLine.includes('process.env.node_env') && 
        (lowerLine.includes('!==') || lowerLine.includes('!='))) {
      return false;
    }
    
    // Check for explicit production markers
    if (lowerLine.includes('production') && 
        (lowerLine.includes('if') || lowerLine.includes('when'))) {
      return true;
    }
    
    // Default: assume production accessible for server files
    return lowerPath.includes('server/');
  }
  
  /**
   * Summarize findings
   */
  private summarizeFindings(findings: HardcodedIdentifierFinding[]) {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      byType: {} as Record<string, number>
    };
    
    for (const finding of findings) {
      summary[finding.severity.toLowerCase() as keyof typeof summary]++;
      summary.byType[finding.identifierType] = (summary.byType[finding.identifierType] || 0) + 1;
    }
    
    return summary;
  }
  
  /**
   * Validate production readiness
   */
  validateProductionReady(scanResult: IdentifierScanResult): {
    ready: boolean;
    blockers: string[];
    warnings: string[];
  } {
    const blockers: string[] = [];
    const warnings: string[] = [];
    
    const productionAccessible = scanResult.findings.filter(f => f.isProductionAccessible);
    const notTestOnly = productionAccessible.filter(f => !f.isTestOnly);
    
    if (scanResult.summary.critical > 0) {
      blockers.push(`${scanResult.summary.critical} CRITICAL findings - hardcoded identifiers in production code`);
    }
    
    if (notTestOnly.length > 0) {
      blockers.push(`${notTestOnly.length} hardcoded identifiers not marked as test-only`);
    }
    
    if (productionAccessible.length > 0) {
      warnings.push(`${productionAccessible.length} identifiers in production-accessible code`);
    }
    
    // Check for specific identifier types
    if ((scanResult.summary.byType['EDRPOU'] || 0) > 0) {
      warnings.push(`${scanResult.summary.byType['EDRPOU']} EDRPOU identifiers found`);
    }
    
    if ((scanResult.summary.byType['IPN'] || 0) > 0) {
      warnings.push(`${scanResult.summary.byType['IPN']} IPN identifiers found`);
    }
    
    return {
      ready: blockers.length === 0,
      blockers,
      warnings
    };
  }
  
  /**
   * Check specific file for hardcoded identifiers
   */
  checkFile(filePath: string): HardcodedIdentifierFinding[] {
    const findings: HardcodedIdentifierFinding[] = [];
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (const patternConfig of this.identifierPatterns) {
        let match;
        const regex = new RegExp(patternConfig.regex.source, 'gi');
        
        while ((match = regex.exec(content)) !== null) {
          const lineIndex = content.substring(0, match.index).split('\n').length - 1;
          const line = lines[lineIndex] || '';
          const column = match.index - content.lastIndexOf('\n', match.index - 1) - 1;
          const identifierValue = match[1] || match[0];
          
          const isTestOnly = this.isTestOnlyContext(line, content, lineIndex);
          const isProductionAccessible = this.isProductionAccessible(filePath, line, content, lineIndex);
          
          let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
          if (isProductionAccessible && !isTestOnly) {
            severity = 'CRITICAL';
          } else if (isProductionAccessible) {
            severity = 'HIGH';
          }
          
          findings.push({
            file: filePath,
            line: lineIndex + 1,
            column,
            identifierType: patternConfig.type,
            identifierValue,
            context: line.trim(),
            isTestOnly,
            isProductionAccessible,
            severity
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
    }
    
    return findings;
  }
}

// Singleton instance
export const hardcodedIdentifierScanner = new HardcodedIdentifierScanner();
