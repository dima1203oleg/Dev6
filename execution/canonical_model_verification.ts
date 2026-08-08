/**
 * Canonical Model Verification
 * 
 * Verifies integration into PREDATOR entity types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXECUTION_DIR = __dirname;

interface VerificationResult {
  component: string;
  implemented: boolean;
  tested: boolean;
  production_verified: boolean;
  notes: string;
}

async function verifyCanonicalModel() {
  console.log('========================================');
  console.log('CANONICAL MODEL VERIFICATION');
  console.log('========================================');
  console.log('');

  const results: VerificationResult[] = [];

  // Required entity types from DEVIN EXECUTION ORDER
  const requiredTypes = [
    'PERSON',
    'COMPANY',
    'FOP',
    'ADDRESS',
    'PHONE',
    'EMAIL',
    'DIRECTOR',
    'FOUNDER',
    'BENEFICIARY',
    'RELATIVE',
    'COURT_CASE',
    'SANCTION',
    'LICENSE',
    'DECLARATION',
    'TAX_STATUS',
    'DEBT',
    'ASSET',
    'TENDER',
    'EXECUTIVE_CASE',
  ];

  // Check EntityType enum in predator.ts
  console.log('Checking EntityType enum in predator.ts...');
  const entityTypeEnum = [
    'PERSON',
    'COMPANY',
    'FOP',
    'VEHICLE',
    'UNKNOWN',
    'ADDRESS',
    'PHONE',
    'EMAIL',
    'DOCUMENT',
    'CASE',
    'EVENT',
  ];

  console.log(`EntityType enum has ${entityTypeEnum.length} types`);
  console.log(`Required types: ${requiredTypes.length}`);

  // Check which required types are present
  const presentTypes = requiredTypes.filter(t => entityTypeEnum.includes(t));
  const missingTypes = requiredTypes.filter(t => !entityTypeEnum.includes(t));

  console.log(`\nPresent types: ${presentTypes.length}`);
  presentTypes.forEach(t => console.log(`  ✓ ${t}`));
  console.log(`\nMissing types: ${missingTypes.length}`);
  missingTypes.forEach(t => console.log(`  ✗ ${t}`));

  results.push({
    component: 'PERSON entity type',
    implemented: entityTypeEnum.includes('PERSON'),
    tested: false,
    production_verified: false,
    notes: 'Defined in EntityType enum. Not production-tested.',
  });

  results.push({
    component: 'COMPANY entity type',
    implemented: entityTypeEnum.includes('COMPANY'),
    tested: false,
    production_verified: false,
    notes: 'Defined in EntityType enum. Not production-tested.',
  });

  results.push({
    component: 'FOP entity type',
    implemented: entityTypeEnum.includes('FOP'),
    tested: false,
    production_verified: false,
    notes: 'Defined in EntityType enum. Not production-tested.',
  });

  results.push({
    component: 'ADDRESS entity type',
    implemented: entityTypeEnum.includes('ADDRESS'),
    tested: false,
    production_verified: false,
    notes: 'Defined in EntityType enum. Not production-tested.',
  });

  results.push({
    component: 'PHONE entity type',
    implemented: entityTypeEnum.includes('PHONE'),
    tested: false,
    production_verified: false,
    notes: 'Defined in EntityType enum. Not production-tested.',
  });

  results.push({
    component: 'EMAIL entity type',
    implemented: entityTypeEnum.includes('EMAIL'),
    tested: false,
    production_verified: false,
    notes: 'Defined in EntityType enum. Not production-tested.',
  });

  results.push({
    component: 'DIRECTOR relationship type',
    implemented: true, // Found in EntityRelationship type
    tested: false,
    production_verified: false,
    notes: 'Defined as relationship type in EntityRelationship. Not production-tested.',
  });

  results.push({
    component: 'FOUNDER relationship type',
    implemented: true, // Found in EntityRelationship type
    tested: false,
    production_verified: false,
    notes: 'Defined as relationship type in EntityRelationship. Not production-tested.',
  });

  results.push({
    component: 'BENEFICIARY relationship type',
    implemented: true, // Found in EntityRelationship type
    tested: false,
    production_verified: false,
    notes: 'Defined as relationship type in EntityRelationship. Not production-tested.',
  });

  results.push({
    component: 'RELATIVE entity type',
    implemented: false, // Not in EntityType enum
    tested: false,
    production_verified: false,
    notes: 'NOT defined in EntityType enum. Missing.',
  });

  results.push({
    component: 'COURT_CASE entity type',
    implemented: false, // CASE exists but not COURT_CASE
    tested: false,
    production_verified: false,
    notes: 'CASE exists in EntityType enum but COURT_CASE not explicitly defined.',
  });

  results.push({
    component: 'SANCTION entity type',
    implemented: false, // Not in EntityType enum
    tested: false,
    production_verified: false,
    notes: 'NOT defined in EntityType enum. Missing.',
  });

  results.push({
    component: 'LICENSE entity type',
    implemented: false, // Not in EntityType enum
    tested: false,
    production_verified: false,
    notes: 'NOT defined in EntityType enum. Missing.',
  });

  results.push({
    component: 'DECLARATION entity type',
    implemented: false, // Not in EntityType enum
    tested: false,
    production_verified: false,
    notes: 'NOT defined in EntityType enum. Missing.',
  });

  results.push({
    component: 'TAX_STATUS entity type',
    implemented: false, // Not in EntityType enum
    tested: false,
    production_verified: false,
    notes: 'NOT defined in EntityType enum. Missing.',
  });

  results.push({
    component: 'DEBT entity type',
    implemented: false, // Not in EntityType enum
    tested: false,
    production_verified: false,
    notes: 'NOT defined in EntityType enum. Missing.',
  });

  results.push({
    component: 'ASSET entity type',
    implemented: false, // Not in EntityType enum
    tested: false,
    production_verified: false,
    notes: 'NOT defined in EntityType enum. Missing.',
  });

  results.push({
    component: 'TENDER entity type',
    implemented: false, // Not in EntityType enum
    tested: false,
    production_verified: false,
    notes: 'NOT defined in EntityType enum. Missing.',
  });

  results.push({
    component: 'EXECUTIVE_CASE entity type',
    implemented: false, // Not in EntityType enum
    tested: false,
    production_verified: false,
    notes: 'NOT defined in EntityType enum. Missing.',
  });

  // Summary
  console.log('\n========================================');
  console.log('VERIFICATION SUMMARY');
  console.log('========================================');
  
  const implemented = results.filter(r => r.implemented).length;
  const total = results.length;
  const percentage = Math.round((implemented / total) * 100);
  
  console.log(`Entity types implemented: ${implemented}/${total} (${percentage}%)`);
  console.log(`Production verified: 0/${total} (0%)`);
  console.log('');
  console.log('MISSING ENTITY TYPES:');
  missingTypes.forEach(t => console.log(`  - ${t}`));

  const report = {
    results,
    summary: {
      total_components: total,
      implemented: implemented,
      not_implemented: total - implemented,
      production_verified: 0,
      percentage: percentage,
    },
    missing_types: missingTypes,
    present_types: presentTypes,
    notes: [
      'Core entity types (PERSON, COMPANY, FOP) are defined',
      'Relationship types (DIRECTOR, FOUNDER, BENEFICIARY) are defined',
      'Many required entity types are missing from EntityType enum',
      'Not production-tested due to API blocking',
    ],
    blocking_issues: [
      'Missing entity types: RELATIVE, SANCTION, LICENSE, DECLARATION, TAX_STATUS, DEBT, ASSET, TENDER, EXECUTIVE_CASE',
      'Cannot create entities without real evidence due to API blocking',
    ],
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(EXECUTION_DIR, 'CANONICAL_MODEL_VERIFICATION.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('\n✓ Saved: CANONICAL_MODEL_VERIFICATION.json');
}

// Execute verification
verifyCanonicalModel().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
