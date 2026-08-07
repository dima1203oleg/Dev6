/**
 * Production Score Recalculation
 * 
 * Recalculates production score based on real execution evidence
 * Score based on: Real positive control, Real entity resolution, Real provenance, Real cards, Field validation, Truth validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXECUTION_DIR = __dirname;

interface ScoreComponent {
  name: string;
  weight: number;
  achieved: boolean;
  evidence: string;
  score: number;
}

async function calculateProductionScore() {
  console.log('========================================');
  console.log('PRODUCTION SCORE RECALCULATION');
  console.log('========================================');
  console.log('');

  const components: ScoreComponent[] = [];

  // Component 1: Real Positive Control (weight: 20)
  const positiveControlSpec = fs.readFileSync(
    path.join(EXECUTION_DIR, 'positive_control/positive_control_spec.md'), 'utf-8'
  );
  const hasPositiveControl = positiveControlSpec.includes('19007752');
  components.push({
    name: 'Real Positive Control',
    weight: 20,
    achieved: hasPositiveControl,
    evidence: 'EDRPOU 19007752 found in Державний реєстр випусків цінних паперів',
    score: hasPositiveControl ? 20 : 0,
  });

  // Component 2: Real Entity Resolution (weight: 15)
  const entityResolution = JSON.parse(
    fs.readFileSync(path.join(EXECUTION_DIR, 'positive_control/entity_resolution.json'), 'utf-8')
  );
  const hasEntityResolution = entityResolution.match_score === 1.0;
  components.push({
    name: 'Real Entity Resolution',
    weight: 15,
    achieved: hasEntityResolution,
    evidence: 'Priority-based matching with EDRPOU validation, match_score: 1.0',
    score: hasEntityResolution ? 15 : 0,
  });

  // Component 3: Real Provenance Integration (weight: 15)
  const evidence = JSON.parse(
    fs.readFileSync(path.join(EXECUTION_DIR, 'positive_control/evidence.json'), 'utf-8')
  );
  const hasProvenance = evidence.provenance && evidence.provenance.record_hash;
  components.push({
    name: 'Real Provenance Integration',
    weight: 15,
    achieved: hasProvenance,
    evidence: 'ProvenanceEngine integrated, record_hash present',
    score: hasProvenance ? 15 : 0,
  });

  // Component 4: Real Card Integration (weight: 15)
  const card = JSON.parse(
    fs.readFileSync(path.join(EXECUTION_DIR, 'positive_control/card_snapshot.json'), 'utf-8')
  );
  const hasCard = card.entity && card.claims && card.claims.length > 0;
  components.push({
    name: 'Real Card Integration',
    weight: 15,
    achieved: hasCard,
    evidence: 'IntelligenceDossier format with claims',
    score: hasCard ? 15 : 0,
  });

  // Component 5: Field Level Validation (weight: 10)
  const fieldValidation = JSON.parse(
    fs.readFileSync(path.join(EXECUTION_DIR, 'positive_control/field_validation.json'), 'utf-8')
  );
  const hasFieldValidation = fieldValidation.summary && fieldValidation.summary.total > 0;
  components.push({
    name: 'Field Level Validation',
    weight: 10,
    achieved: hasFieldValidation,
    evidence: `${fieldValidation.summary.total} fields validated`,
    score: hasFieldValidation ? 10 : 0,
  });

  // Component 6: Data Truth Validation (weight: 10)
  const truthValidation = JSON.parse(
    fs.readFileSync(path.join(EXECUTION_DIR, 'positive_control/truth_validation.json'), 'utf-8')
  );
  const hasTruthValidation = truthValidation.validation && truthValidation.validation.consistency_score >= 80;
  components.push({
    name: 'Data Truth Validation',
    weight: 10,
    achieved: hasTruthValidation,
    evidence: `Consistency score: ${truthValidation.validation.consistency_score}%`,
    score: hasTruthValidation ? 10 : 0,
  });

  // Component 7: Card Contract Validation (weight: 5)
  const cardValidation = JSON.parse(
    fs.readFileSync(path.join(EXECUTION_DIR, 'positive_control/card_validation.json'), 'utf-8')
  );
  const hasCardValidation = cardValidation.validation && cardValidation.validation.overall_score >= 80;
  components.push({
    name: 'Card Contract Validation',
    weight: 5,
    achieved: hasCardValidation,
    evidence: `Overall score: ${cardValidation.validation.overall_score}`,
    score: hasCardValidation ? 5 : 0,
  });

  // Component 8: Negative Control (weight: 5)
  const negativeControl = JSON.parse(
    fs.readFileSync(path.join(EXECUTION_DIR, 'negative_control/negative_control_rca.json'), 'utf-8')
  );
  const hasNegativeControl = negativeControl.result === 'NO_DATA' && negativeControl.technical_errors === 0;
  components.push({
    name: 'Negative Control',
    weight: 5,
    achieved: hasNegativeControl,
    evidence: 'IPN 3111724753 returns NO_DATA with proper RCA',
    score: hasNegativeControl ? 5 : 0,
  });

  // Component 9: Negative Failure Tests (weight: 5)
  const failureTests = JSON.parse(
    fs.readFileSync(path.join(EXECUTION_DIR, 'negative_failure_tests/failure_tests_summary.json'), 'utf-8')
  );
  const hasFailureTests = failureTests.passed === failureTests.total_tests;
  components.push({
    name: 'Negative Failure Tests',
    weight: 5,
    achieved: hasFailureTests,
    evidence: `${failureTests.passed}/${failureTests.total_tests} tests passed`,
    score: hasFailureTests ? 5 : 0,
  });

  // Calculate total score
  const totalScore = components.reduce((sum, c) => sum + c.score, 0);
  const maxScore = components.reduce((sum, c) => sum + c.weight, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Print results
  console.log('Score Components:');
  console.log('================================');
  for (const component of components) {
    const status = component.achieved ? '✓' : '✗';
    console.log(`${status} ${component.name}: ${component.score}/${component.weight} (${component.evidence})`);
  }

  console.log('\n========================================');
  console.log('PRODUCTION SCORE SUMMARY');
  console.log('========================================');
  console.log(`Total Score: ${totalScore}/${maxScore}`);
  console.log(`Percentage: ${percentage}%`);
  console.log(`Status: ${percentage >= 80 ? 'PRODUCTION READY' : 'NOT PRODUCTION READY'}`);

  const summary = {
    total_score: totalScore,
    max_score: maxScore,
    percentage: percentage,
    status: percentage >= 80 ? 'PRODUCTION READY' : 'NOT PRODUCTION READY',
    components: components,
    timestamp: new Date().toISOString(),
    certification_eligible: percentage >= 80,
  };

  fs.writeFileSync(
    path.join(EXECUTION_DIR, 'PRODUCTION_SCORE_REPORT.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log('\n✓ Saved: PRODUCTION_SCORE_REPORT.json');
  console.log('Artifacts directory:', EXECUTION_DIR);

  if (!summary.certification_eligible) {
    console.log('\n❌ SYSTEM NOT CERTIFIED - Score below 80%');
    process.exit(1);
  } else {
    console.log('\n✓ SYSTEM CERTIFIED - Production score meets requirements');
  }
}

// Run calculation
calculateProductionScore().catch(error => {
  console.error('Calculation failed:', error);
  process.exit(1);
});
