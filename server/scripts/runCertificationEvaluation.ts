/**
 * Run Automatic Certification Evaluation
 * 
 * This script executes the automatic certification evaluator and generates
 * a truthful production certification report based on actual execution evidence.
 */

import { AutomaticCertificationEvaluator } from '../services/certification/AutomaticCertificationEvaluator';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('========================================');
  console.log('AUTOMATIC CERTIFICATION EVALUATION');
  console.log('========================================');
  console.log('');
  
  try {
    // Run automatic evaluation
    const status = await AutomaticCertificationEvaluator.evaluate();
    
    // Display results
    console.log(`Overall Status: ${status.overallStatus}`);
    console.log(`Score: ${status.score}/100`);
    console.log('');
    
    console.log('Gate Results:');
    for (const gate of status.gates) {
      const icon = gate.status === 'PASS' ? '✅' : gate.status === 'FAIL' ? '❌' : gate.status === 'BLOCKED' ? '🚫' : '⚠️';
      console.log(`  ${icon} ${gate.gate}: ${gate.status}`);
      console.log(`     Evidence: ${gate.evidence}`);
    }
    console.log('');
    
    if (status.blockers.length > 0) {
      console.log('Blockers:');
      for (const blocker of status.blockers) {
        console.log(`  ❌ ${blocker}`);
      }
      console.log('');
    }
    
    console.log('Component Status:');
    console.log(`  IMPLEMENTED: ${status.componentStatus.implemented.join(', ') || 'None'}`);
    console.log(`  WIRED: ${status.componentStatus.wired.join(', ') || 'None'}`);
    console.log(`  TESTED: ${status.componentStatus.tested.join(', ') || 'None'}`);
    console.log(`  REAL_DATA_TESTED: ${status.componentStatus.realDataTested.join(', ') || 'None'}`);
    console.log(`  REAL_DATA_VERIFIED: ${status.componentStatus.realDataVerified.join(', ') || 'None'}`);
    console.log(`  PRODUCTION_CERTIFIED: ${status.componentStatus.productionCertified.join(', ') || 'None'}`);
    console.log('');
    
    // Generate report
    const report = AutomaticCertificationEvaluator.generateReport(status);
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'PRODUCTION_CERTIFICATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`Report written to: ${reportPath}`);
    console.log('');
    
    // Exit with appropriate code
    if (status.overallStatus === 'PRODUCTION_CERTIFIED') {
      console.log('✅ PRODUCTION CERTIFIED');
      process.exit(0);
    } else {
      console.log('❌ PRODUCTION BLOCKED');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during certification evaluation:', error);
    process.exit(1);
  }
}

main();
