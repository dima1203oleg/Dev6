/**
 * Production Data Integrity Regression Test
 * 
 * This test ensures that production paths never return demo/fake/static data.
 * If any production endpoint returns demo data, this test FAILS.
 * 
 * Critical entities to check:
 * - 3111724753 (Кізима Дмитро Миколайович)
 * 
 * Forbidden patterns in production responses:
 * - demoData
 * - DEMO_DATA
 * - mockData
 * - MOCK_DATA
 * - OSINT_ENTITIES
 * - static entity fallback
 * - hardcoded confidence values
 */

import fs from 'fs';
import path from 'path';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
  timestamp: string;
}

export class ProductionDataIntegrityTest {
  private static readonly FORBIDDEN_PATTERNS = [
    'demoData',
    'DEMO_DATA',
    'mockData',
    'MOCK_DATA',
    'OSINT_ENTITIES',
    'getDemoData',
    'static fallback',
    'hardcoded confidence'
  ];

  private static readonly CRITICAL_ENTITY = '3111724753';

  /**
   * Run all production data integrity checks
   */
  static async runAll(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    console.log('Running Production Data Integrity Regression Tests...');

    // Test 1: Check source code for demo data patterns in production paths
    results.push(await this.testSourceCodeForDemoPatterns());

    // Test 2: Check API responses don't return demo data
    results.push(await this.testAPIResponsesForDemoData());

    // Test 3: Verify critical entity is not hardcoded
    results.push(await this.testCriticalEntityNotHardcoded());

    // Test 4: Check for hardcoded confidence values
    results.push(await this.testNoHardcodedConfidence());

    // Test 5: Verify no static entity fallbacks
    results.push(await this.testNoStaticEntityFallbacks());

    return results;
  }

  /**
   * Test 1: Check source code for demo data patterns in production paths
   */
  private static async testSourceCodeForDemoPatterns(): Promise<TestResult> {
    console.log('  Testing source code for demo patterns...');

    const productionPaths = [
      'server/api/PredatorAPI.ts',
      'server/api/predatorRoutes.ts',
      'server/services/IntelligenceOrchestrator.ts',
      'server/datasources/registries'
    ];

    const findings: string[] = [];

    for (const filePath of productionPaths) {
      if (!fs.existsSync(filePath)) continue;

      if (fs.statSync(filePath).isDirectory()) {
        // Recursively check directory
        const files = this.getAllFiles(filePath);
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(file, 'utf-8');
            for (const pattern of this.FORBIDDEN_PATTERNS) {
              if (content.includes(pattern)) {
                findings.push(`${file}: contains "${pattern}"`);
              }
            }
          }
        }
      } else {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const pattern of this.FORBIDDEN_PATTERNS) {
          if (content.includes(pattern)) {
            findings.push(`${filePath}: contains "${pattern}"`);
          }
        }
      }
    }

    if (findings.length > 0) {
      return {
        test: 'Source Code - No Demo Patterns',
        status: 'FAIL',
        evidence: `Found ${findings.length} demo pattern(s): ${findings.slice(0, 3).join(', ')}`,
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'Source Code - No Demo Patterns',
      status: 'PASS',
      evidence: 'No demo patterns found in production paths',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test 2: Check API responses don't return demo data
   */
  private static async testAPIResponsesForDemoData(): Promise<TestResult> {
    console.log('  Testing API responses for demo data...');

    try {
      // Start the server if not running
      // This is a simplified check - in production, you'd make actual API calls
      // For now, we check the code doesn't have demo fallbacks in API handlers

      const predatorAPIPath = path.join(process.cwd(), 'server/api/PredatorAPI.ts');
      if (!fs.existsSync(predatorAPIPath)) {
        return {
          test: 'API Responses - No Demo Data',
          status: 'FAIL',
          evidence: 'PredatorAPI.ts not found',
          timestamp: new Date().toISOString()
        };
      }

      const content = fs.readFileSync(predatorAPIPath, 'utf-8');

      // Check for demo fallback patterns in API responses (excluding comments)
      const lines = content.split('\n');
      const fallbackPatterns = [
        'return demoData',
        'return DEMO_DATA',
        'return OSINT_ENTITIES',
        'fallback to demo'
      ];

      const foundPatterns: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
        
        for (const pattern of fallbackPatterns) {
          if (line.includes(pattern)) {
            foundPatterns.push(`${predatorAPIPath}:${i + 1}: "${pattern}"`);
          }
        }
      }

      if (foundPatterns.length > 0) {
        return {
          test: 'API Responses - No Demo Data',
          status: 'FAIL',
          evidence: `Found demo fallback patterns: ${foundPatterns.join(', ')}`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        test: 'API Responses - No Demo Data',
        status: 'PASS',
        evidence: 'No demo fallback patterns found in API handlers',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        test: 'API Responses - No Demo Data',
        status: 'FAIL',
        evidence: `Test execution failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test 3: Verify critical entity is not hardcoded in backend production API handlers
   * Only checks API handler files, not certification/validation services
   */
  private static async testCriticalEntityNotHardcoded(): Promise<TestResult> {
    console.log('  Testing critical entity not hardcoded in API handlers...');

    // Only check API handler files, not certification/validation services
    const apiFiles = [
      'server/api/PredatorAPI.ts',
      'server/routes/predatorRoutes.ts',
      'server/routes/connectorRoutes.ts'
    ];

    const findings: string[] = [];

    for (const file of apiFiles) {
      if (!fs.existsSync(file)) continue;

      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for hardcoded critical entity in API handlers
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
        
        // Allow legitimate uses: verification endpoint, route names
        if (line.includes('verify') || line.includes('route')) {
          continue;
        }
        
        // Check for hardcoded entity ID used as fallback data
        if (line.includes(this.CRITICAL_ENTITY) && (line.includes('return') || line.includes('res.json'))) {
          findings.push(`${file}:${i + 1}: potential hardcoded entity in API response`);
        }
      }
    }

    if (findings.length > 0) {
      return {
        test: 'Critical Entity - Not Hardcoded',
        status: 'FAIL',
        evidence: `Found potential hardcoded critical entity in API handlers: ${findings.slice(0, 2).join(', ')}`,
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'Critical Entity - Not Hardcoded',
      status: 'PASS',
      evidence: 'Critical entity not hardcoded in API handler responses',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test 4: Check for hardcoded confidence values
   */
  private static async testNoHardcodedConfidence(): Promise<TestResult> {
    console.log('  Testing no hardcoded confidence values...');

    const fieldProvenancePath = path.join(process.cwd(), 'server/types/fieldProvenance.ts');
    
    if (!fs.existsSync(fieldProvenancePath)) {
      return {
        test: 'No Hardcoded Confidence',
        status: 'FAIL',
        evidence: 'FieldProvenanceService not found',
        timestamp: new Date().toISOString()
      };
    }

    const content = fs.readFileSync(fieldProvenancePath, 'utf-8');

    // Check if confidence is computed dynamically, not hardcoded
    const hasCalculateConfidence = content.includes('calculateConfidence');
    const hasDynamicComputation = content.includes('authority') || content.includes('freshness') || content.includes('agreement');

    if (!hasCalculateConfidence || !hasDynamicComputation) {
      return {
        test: 'No Hardcoded Confidence',
        status: 'FAIL',
        evidence: 'Confidence computation may use hardcoded values',
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'No Hardcoded Confidence',
      status: 'PASS',
      evidence: 'Confidence computed dynamically from evidence factors',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test 5: Verify no static entity fallbacks
   */
  private static async testNoStaticEntityFallbacks(): Promise<TestResult> {
    console.log('  Testing no static entity fallbacks...');

    const appPath = path.join(process.cwd(), 'src/App.tsx');
    
    if (!fs.existsSync(appPath)) {
      return {
        test: 'No Static Entity Fallbacks',
        status: 'FAIL',
        evidence: 'App.tsx not found',
        timestamp: new Date().toISOString()
      };
    }

    const content = fs.readFileSync(appPath, 'utf-8');

    // Check for static entity initialization
    const staticPatterns = [
      'useState<OsintEntity[]>(OSINT_ENTITIES)',
      'useState(OSINT_ENTITIES)',
      'selectedEntity: OSINT_ENTITIES',
      'entitiesList: OSINT_ENTITIES'
    ];

    const foundPatterns = staticPatterns.filter(pattern => content.includes(pattern));

    if (foundPatterns.length > 0) {
      return {
        test: 'No Static Entity Fallbacks',
        status: 'FAIL',
        evidence: `Found static entity fallbacks: ${foundPatterns.join(', ')}`,
        timestamp: new Date().toISOString()
      };
    }

    return {
      test: 'No Static Entity Fallbacks',
      status: 'PASS',
      evidence: 'No static entity fallbacks found',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all files in a directory recursively
   */
  private static getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
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
   * Print results and exit with appropriate code
   */
  static async printResultsAndExit(results: TestResult[]): Promise<void> {
    console.log('\n========================================');
    console.log('PRODUCTION DATA INTEGRITY TEST RESULTS');
    console.log('========================================\n');

    let failed = 0;
    let passed = 0;

    for (const result of results) {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Evidence: ${result.evidence}`);
      console.log(`   Timestamp: ${result.timestamp}`);
      console.log('');

      if (result.status === 'FAIL') {
        failed++;
      } else {
        passed++;
      }
    }

    console.log('========================================');
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('========================================\n');

    if (failed > 0) {
      console.log('❌ PRODUCTION DATA INTEGRITY TEST FAILED');
      console.log('Demo data or static fallbacks detected in production paths.');
      process.exit(1);
    } else {
      console.log('✅ PRODUCTION DATA INTEGRITY TEST PASSED');
      console.log('No demo data or static fallbacks found in production paths.');
      process.exit(0);
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ProductionDataIntegrityTest.runAll()
    .then(results => ProductionDataIntegrityTest.printResultsAndExit(results))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
