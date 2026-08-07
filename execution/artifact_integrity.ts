/**
 * Artifact Integrity Verification
 * 
 * Verifies all execution artifacts are present, valid, and properly linked
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXECUTION_DIR = __dirname;

interface Artifact {
  path: string;
  exists: boolean;
  size: number;
  hash: string;
  valid: boolean;
  errors: string[];
}

async function verifyArtifactIntegrity() {
  console.log('========================================');
  console.log('ARTIFACT INTEGRITY VERIFICATION');
  console.log('========================================');
  console.log('');

  const artifacts: Artifact[] = [];
  const errors: string[] = [];

  // Expected artifacts
  const expectedArtifacts = [
    // Discovery artifacts
    'catalog.json',
    'DISCOVERY_COUNT_RECONCILIATION.md',
    
    // Positive control artifacts
    'positive_control/positive_control_spec.md',
    'positive_control/source_response.json',
    'positive_control/raw_record.json',
    'positive_control/normalized_record.json',
    'positive_control/canonical_entity.json',
    'positive_control/entity_resolution.json',
    'positive_control/evidence.json',
    'positive_control/database_snapshot.json',
    'positive_control/api_response.json',
    'positive_control/card_snapshot.json',
    'positive_control/field_validation.json',
    'positive_control/truth_validation.json',
    'positive_control/card_validation.json',
    'positive_control/field_provenance.json',
    'positive_control/provenance_chain_verification.json',
    
    // Negative control artifacts
    'negative_control/negative_control_rca.json',
    
    // Negative failure test artifacts
    'negative_failure_tests/test1_source_unavailable.json',
    'negative_failure_tests/test2_empty_source.json',
    'negative_failure_tests/test3_mapping_failure.json',
    'negative_failure_tests/test4_truth_mismatch.json',
    'negative_failure_tests/test5_card_integration_failure.json',
    'negative_failure_tests/failure_tests_summary.json',
  ];

  console.log(`Verifying ${expectedArtifacts.length} expected artifacts...\n`);

  for (const artifactPath of expectedArtifacts) {
    const fullPath = path.join(EXECUTION_DIR, artifactPath);
    const artifact: Artifact = {
      path: artifactPath,
      exists: false,
      size: 0,
      hash: '',
      valid: false,
      errors: [],
    };

    try {
      if (fs.existsSync(fullPath)) {
        artifact.exists = true;
        const stats = fs.statSync(fullPath);
        artifact.size = stats.size;
        
        // Calculate hash
        const content = fs.readFileSync(fullPath);
        artifact.hash = crypto.createHash('sha256').update(content).digest('hex');
        
        // Validate JSON files
        if (artifactPath.endsWith('.json')) {
          try {
            JSON.parse(content.toString());
            artifact.valid = true;
          } catch (jsonError) {
            artifact.valid = false;
            artifact.errors.push('Invalid JSON');
            errors.push(`${artifactPath}: Invalid JSON`);
          }
        } else if (artifactPath.endsWith('.md')) {
          artifact.valid = true;
        } else {
          artifact.valid = true;
        }
      } else {
        artifact.errors.push('File not found');
        errors.push(`${artifactPath}: File not found`);
      }
    } catch (error) {
      artifact.errors.push(`Error: ${error}`);
      errors.push(`${artifactPath}: ${error}`);
    }

    artifacts.push(artifact);
  }

  // Print results
  console.log('Artifact Verification Results:');
  console.log('================================');
  
  for (const artifact of artifacts) {
    const status = artifact.exists ? (artifact.valid ? '✓' : '⚠') : '✗';
    console.log(`${status} ${artifact.path} (${artifact.size} bytes)`);
    if (artifact.errors.length > 0) {
      for (const error of artifact.errors) {
        console.log(`    - ${error}`);
      }
    }
  }

  // Summary
  const total = artifacts.length;
  const existing = artifacts.filter(a => a.exists).length;
  const valid = artifacts.filter(a => a.valid).length;
  const missing = artifacts.filter(a => !a.exists).length;
  const invalid = artifacts.filter(a => a.exists && !a.valid).length;

  console.log('\n========================================');
  console.log('ARTIFACT INTEGRITY SUMMARY');
  console.log('========================================');
  console.log(`Total artifacts: ${total}`);
  console.log(`Existing: ${existing}`);
  console.log(`Valid: ${valid}`);
  console.log(`Missing: ${missing}`);
  console.log(`Invalid: ${invalid}`);
  console.log(`Errors: ${errors.length}`);

  const summary = {
    total_artifacts: total,
    existing: existing,
    valid: valid,
    missing: missing,
    invalid: invalid,
    errors: errors,
    artifacts: artifacts,
    timestamp: new Date().toISOString(),
    overall_integrity: missing === 0 && invalid === 0,
  };

  fs.writeFileSync(
    path.join(EXECUTION_DIR, 'ARTIFACT_INTEGRITY_REPORT.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log('\n✓ Saved: ARTIFACT_INTEGRITY_REPORT.json');
  console.log('Artifacts directory:', EXECUTION_DIR);

  if (!summary.overall_integrity) {
    console.log('\n❌ ARTIFACT INTEGRITY CHECK FAILED');
    process.exit(1);
  } else {
    console.log('\n✓ ARTIFACT INTEGRITY CHECK PASSED');
  }
}

// Run verification
verifyArtifactIntegrity().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
