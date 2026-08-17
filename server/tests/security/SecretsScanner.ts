/**
 * Secrets Scanner
 * 
 * Scans source code, logs, and frontend for hardcoded secrets.
 * Detects API keys, tokens, passwords, and other sensitive data.
 */

import fs from 'fs';
import path from 'path';

interface SecretFinding {
  file: string;
  line: number;
  type: string;
  pattern: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  excludePatterns?: string[];
}

export class SecretsScanner {
  // Common secret patterns
  private static readonly SECRET_PATTERNS: SecretPattern[] = [
    {
      name: 'API Key',
      pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
      severity: 'CRITICAL'
    },
    {
      name: 'Bearer Token',
      pattern: /bearer\s+([a-zA-Z0-9_\-\.]{20,})/gi,
      severity: 'CRITICAL'
    },
    {
      name: 'JWT Token',
      pattern: /eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g,
      severity: 'CRITICAL'
    },
    {
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      severity: 'CRITICAL'
    },
    {
      name: 'GitHub Token',
      pattern: /ghp_[a-zA-Z0-9]{36}/g,
      severity: 'CRITICAL',
      excludePatterns: ['example', 'placeholder', 'YOUR_', 'REPLACE_']
    },
    {
      name: 'GitHub OAuth',
      pattern: /gho_[a-zA-Z0-9]{36}/g,
      severity: 'CRITICAL'
    },
    {
      name: 'GitHub App Token',
      pattern: /ghu_[a-zA-Z0-9]{36}/g,
      severity: 'CRITICAL'
    },
    {
      name: 'Slack Token',
      pattern: /xox[baprs]-[a-zA-Z0-9\-]{10,}/g,
      severity: 'HIGH'
    },
    {
      name: 'Password',
      pattern: /password\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
      severity: 'CRITICAL'
    },
    {
      name: 'Secret',
      pattern: /secret\s*[:=]\s*['"]([^'"]{10,})['"]/gi,
      severity: 'CRITICAL'
    },
    {
      name: 'Private Key',
      pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----/g,
      severity: 'CRITICAL'
    },
    {
      name: 'Database URL',
      pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/gi,
      severity: 'HIGH'
    },
    {
      name: 'Connection String',
      pattern: /Server=.*;User\s+Id=.*;Password=.*;/gi,
      severity: 'HIGH'
    },
    {
      name: 'OAuth Token',
      pattern: /oauth[_-]?token\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
      severity: 'HIGH'
    },
    {
      name: 'Auth Token',
      pattern: /auth[_-]?token\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
      severity: 'HIGH'
    }
  ];

  // Files to exclude from scanning
  private static readonly EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.env.example',
    'package-lock.json',
    'yarn.lock',
    '.md',
    '.log',
    '.cache'
  ];

  /**
   * Scan directory for secrets
   * Only scans source code directories (src, server) to avoid OOM
   */
  static scanDirectory(rootPath: string): SecretFinding[] {
    const findings: SecretFinding[] = [];
    
    // Only scan source code directories
    const sourceDirs = ['src', 'server'];
    
    for (const dir of sourceDirs) {
      const dirPath = path.join(rootPath, dir);
      if (!fs.existsSync(dirPath)) continue;
      
      const files = this.getAllFiles(dirPath);

      for (const file of files) {
        if (this.shouldExclude(file)) {
          continue;
        }

        const fileFindings = this.scanFile(file);
        findings.push(...fileFindings);
      }
    }

    return findings;
  }

  /**
   * Scan a single file for secrets
   */
  static scanFile(filePath: string): SecretFinding[] {
    const findings: SecretFinding[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const secretPattern of this.SECRET_PATTERNS) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          
          const matches = line.matchAll(secretPattern.pattern);

          for (const match of matches) {
            // Skip if it's in a comment
            if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*')) {
              continue;
            }

            // Skip if it's an example or placeholder
            if (line.includes('example') || line.includes('placeholder') || line.includes('YOUR_') || line.includes('REPLACE_')) {
              continue;
            }

            // Skip if line contains exclude patterns (e.g., hash, checksum)
            if (secretPattern.excludePatterns) {
              const shouldExclude = secretPattern.excludePatterns.some(pattern => 
                line.toLowerCase().includes(pattern.toLowerCase())
              );
              if (shouldExclude) continue;
            }

            findings.push({
              file: filePath,
              line: i + 1,
              type: secretPattern.name,
              pattern: match[0] || match[1] || 'unknown',
              severity: secretPattern.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
            });
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }

    return findings;
  }

  /**
   * Check if a file should be excluded from scanning
   */
  private static shouldExclude(filePath: string): boolean {
    for (const excludePattern of this.EXCLUDE_PATTERNS) {
      if (filePath.includes(excludePattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all files in a directory recursively
   */
  private static getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    if (!fs.existsSync(dirPath)) {
      return arrayOfFiles;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    }

    return arrayOfFiles;
  }

  /**
   * Validate if the codebase is production-ready (no secrets found)
   */
  static validateProductionReady(findings: SecretFinding[]): { ready: boolean; critical: number; high: number; medium: number; low: number } {
    const critical = findings.filter(f => f.severity === 'CRITICAL').length;
    const high = findings.filter(f => f.severity === 'HIGH').length;
    const medium = findings.filter(f => f.severity === 'MEDIUM').length;
    const low = findings.filter(f => f.severity === 'LOW').length;

    return {
      ready: critical === 0 && high === 0,
      critical,
      high,
      medium,
      low
    };
  }

  /**
   * Print findings to console
   */
  static printFindings(findings: SecretFinding[]): void {
    if (findings.length === 0) {
      console.log('✅ No secrets found');
      return;
    }

    console.log(`❌ Found ${findings.length} secret(s):\n`);

    const grouped = findings.reduce((acc: Record<string, SecretFinding[]>, finding) => {
      if (!acc[finding.severity]) {
        acc[finding.severity] = [];
      }
      acc[finding.severity]!.push(finding);
      return acc;
    }, {} as Record<string, SecretFinding[]>);

    for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      const items = grouped[severity] || [];
      if (items.length > 0) {
        console.log(`${severity} (${items.length}):`);
        for (const item of items.slice(0, 5)) {
          console.log(`  - ${item.file}:${item.line} - ${item.type}`);
          console.log(`    Pattern: ${item.pattern.substring(0, 50)}...`);
        }
        if (items.length > 5) {
          console.log(`  ... and ${items.length - 5} more`);
        }
        console.log('');
      }
    }
  }
}

// Run scanner if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootPath = process.argv[2] || process.cwd();
  console.log(`Scanning ${rootPath} for secrets...\n`);

  const findings = SecretsScanner.scanDirectory(rootPath);
  SecretsScanner.printFindings(findings);

  const validation = SecretsScanner.validateProductionReady(findings);
  console.log(`\nValidation: ${validation.ready ? '✅ READY' : '❌ NOT READY'}`);
  console.log(`Critical: ${validation.critical}, High: ${validation.high}, Medium: ${validation.medium}, Low: ${validation.low}`);

  process.exit(validation.ready ? 0 : 1);
}
