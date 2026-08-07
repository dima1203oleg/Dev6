/**
 * Full Pipeline Test for RDP Integration with PREDATOR
 * Tests the complete chain: API → data → normalization → ER → Graph → Risk → Card → UI → Evidence
 * Control IPN: 3111724753
 */

import { createRDPIntegration, defaultRDPConfig } from './integration.ts';

const CONTROL_IPN = '3111724753';

async function runFullPipelineTest() {
  console.log('\n========================================');
  console.log('RDP FULL PIPELINE TEST');
  console.log('Control IPN:', CONTROL_IPN);
  console.log('========================================');

  const integration = createRDPIntegration({
    controlIPN: CONTROL_IPN,
    autoDiscovery: true,
    pipelineIntegration: true,
  });

  try {
    // Step 1: Initialize
    console.log('\n=== STEP 1: Initialize RDP Integration ===');
    await integration.initialize();
    const status = integration.getStatus();
    console.log('✅ Initialization complete');
    console.log(`   Discovered registries: ${status.discoveredRegistries}`);
    console.log(`   Control IPN: ${status.controlIPN}`);

    // Step 2: Get relevant registries
    console.log('\n=== STEP 2: Find Relevant Registries ===');
    const relevantRegistries = await integration.getRelevantRegistries(CONTROL_IPN);
    console.log(`✅ Found ${relevantRegistries.length} relevant registries`);
    
    for (const registry of relevantRegistries.slice(0, 5)) {
      console.log(`   - ${registry.title} (${registry.id})`);
    }

    // Step 3: Run full pipeline
    console.log('\n=== STEP 3: Run Full Pipeline ===');
    const result = await integration.runFullPipeline(CONTROL_IPN);
    
    console.log(`✅ Pipeline execution complete`);
    console.log(`   Registries processed: ${result.registries.length}`);
    console.log(`   Cards generated: ${result.cards.length}`);
    console.log(`   Errors: ${result.errors.length}`);

    // Step 4: Display cards
    console.log('\n=== STEP 4: Generated Cards ===');
    for (const card of result.cards) {
      console.log(`\n   Card: ${card.type}`);
      console.log(`   Status: ${card.status}`);
      console.log(`   Entities: ${card.entities.length}`);
      console.log(`   Evidence: ${card.evidence.length}`);
    }

    // Step 5: Trace data flow
    console.log('\n=== STEP 5: Data Flow Trace ===');
    for (const [datasetId, pipelineData] of result.pipelineData) {
      console.log(`\n   Dataset: ${datasetId}`);
      console.log(`   Source: ${pipelineData.source}`);
      console.log(`   Raw records: ${pipelineData.rawData.length}`);
      console.log(`   Normalized records: ${pipelineData.normalizedData.length}`);
      console.log(`   Entities: ${pipelineData.entities.length}`);
      console.log(`   Evidence: ${pipelineData.evidence.length}`);
      console.log(`   Cards: ${pipelineData.cards.length}`);
    }

    // Step 6: Error analysis
    if (result.errors.length > 0) {
      console.log('\n=== STEP 6: Error Analysis ===');
      for (const error of result.errors) {
        console.log(`   ❌ ${error}`);
      }
    }

    // Step 7: Summary
    console.log('\n========================================');
    console.log('PIPELINE TEST SUMMARY');
    console.log('========================================');
    console.log(`Control IPN: ${CONTROL_IPN}`);
    console.log(`Relevant registries: ${relevantRegistries.length}`);
    console.log(`Processed registries: ${result.registries.length}`);
    console.log(`Cards generated: ${result.cards.length}`);
    console.log(`Errors: ${result.errors.length}`);
    
    const dataFoundCards = result.cards.filter(c => c.status === 'DATA_FOUND').length;
    const noDataCards = result.cards.filter(c => c.status === 'NO_DATA').length;
    
    console.log(`Cards with data: ${dataFoundCards}`);
    console.log(`Cards with no data: ${noDataCards}`);
    
    if (result.errors.length === 0 && dataFoundCards > 0) {
      console.log('\n🎉 PIPELINE TEST PASSED - DATA REACHES CARDS');
    } else if (result.errors.length > 0) {
      console.log('\n⚠️ PIPELINE TEST COMPLETED WITH ERRORS');
    } else if (dataFoundCards === 0) {
      console.log('\n⚠️ PIPELINE TEST COMPLETED - NO DATA FOUND IN CARDS');
    }

    // Shutdown
    await integration.shutdown();
    
    return {
      success: result.errors.length === 0,
      registries: relevantRegistries.length,
      cards: result.cards.length,
      dataFoundCards,
      noDataCards,
      errors: result.errors,
    };

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    await integration.shutdown();
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run test
runFullPipelineTest().then(result => {
  console.log('\nTest result:', result);
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
