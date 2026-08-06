// scripts/run-e2e-3111724753.ts
import { runControlE2ETest3111724753 } from '../tests/e2e/PREDATOR-E2E-RNOKPP-3111724753.test';

async function main() {
  console.log("==================================================");
  console.log("PREDATOR ANALYTICS - CONTROL E2E TEST RUNNER");
  console.log("Target: PREDATOR-E2E-RNOKPP-3111724753");
  console.log("==================================================");

  const report = await runControlE2ETest3111724753();
  console.log(JSON.stringify(report, null, 2));

  console.log("==================================================");
  console.log(`FINAL E2E RESULT: ${report.overall_status}`);
  console.log("==================================================");

  if (report.overall_status !== 'PASS') {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal E2E test runner error:", err);
  process.exit(1);
});
