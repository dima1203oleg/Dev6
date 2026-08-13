/**
 * Create Demo Cards Script
 * 
 * Inserts demo cards for testing the PREDATOR Intelligence UI via API
 */

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createDemoCards() {
  try {
    console.log('[Demo Cards] Starting demo card creation via API...');
    
    // Use the entity ID from the search result
    const entityId = '379fbc67-20e6-49d1-bcc1-7c6829da90b0';
    
    // Create demo cards
    const demoCards = [
      {
        card_id: generateUUID(),
        entity_id: entityId,
        card_type: 'EDR_REGISTRATION',
        card_data: {
          edrpou: '3111724753',
          fullName: 'Кізима Дмитро Миколайович',
          shortName: 'ФОП Кізима Д.М.',
          status: 'ACTIVE',
          registrationDate: '2015-03-15',
          director: 'Кізима Дмитро Миколайович',
          address: 'с. Угерсько, вул. Жидачівська, 12, Стрийський р-н, Львівська обл., Україна',
          kved: '47.91',
          kvedDescription: 'Роздрібна торгівля в неспеціалізованих магазинах'
        },
        status: 'PASS' as const,
        minimum_confidence: 0.80,
        actual_confidence: 0.95,
        empty_allowed: false
      },
      {
        card_id: generateUUID(),
        entity_id: entityId,
        card_type: 'TAX_STATUS',
        card_data: {
          taxStatus: 'ACTIVE',
          vatPayer: true,
          vatRegistrationDate: '2015-04-01',
          taxAuthority: 'Державна податкова інспекція у Стрийському районі Львівської області',
          lastReportDate: '2026-08-01'
        },
        status: 'PASS' as const,
        minimum_confidence: 0.70,
        actual_confidence: 0.90,
        empty_allowed: false
      },
      {
        card_id: generateUUID(),
        entity_id: entityId,
        card_type: 'SANCTIONS_CHECK',
        card_data: {
          rnboSanctions: false,
          euSanctions: false,
          ofacSanctions: false,
          ukSanctions: false,
          lastChecked: new Date().toISOString()
        },
        status: 'PASS' as const,
        minimum_confidence: 0.90,
        actual_confidence: 1.00,
        empty_allowed: false
      },
      {
        card_id: generateUUID(),
        entity_id: entityId,
        card_type: 'COURT_RECORDS',
        card_data: {
          hasCourtCases: false,
          bankruptcyProceedings: false,
          enforcementProceedings: false,
          lastChecked: new Date().toISOString()
        },
        status: 'PASS' as const,
        minimum_confidence: 0.75,
        actual_confidence: 0.85,
        empty_allowed: false
      },
      {
        card_id: generateUUID(),
        entity_id: entityId,
        card_type: 'RISK_ASSESSMENT',
        card_data: {
          overallRisk: 'LOW',
          riskScore: 10,
          riskFactors: [],
          positiveFactors: ['Active tax status', 'No sanctions', 'No court cases'],
          lastAssessed: new Date().toISOString()
        },
        status: 'PASS' as const,
        minimum_confidence: 0.80,
        actual_confidence: 0.95,
        empty_allowed: false
      }
    ];
    
    console.log(`[Demo Cards] Creating ${demoCards.length} demo cards for entity ${entityId} via API...`);
    
    // Call the API to create each card
    for (const card of demoCards) {
      try {
        const response = await fetch('http://localhost:3000/api/v2/predator/cards/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(card)
        });
        
        if (response.ok) {
          console.log(`[Demo Cards] Created card: ${card.card_type} (${card.card_id})`);
        } else {
          console.error(`[Demo Cards] Failed to create card ${card.card_type}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`[Demo Cards] Error creating card ${card.card_type}:`, error);
      }
    }
    
    console.log('[Demo Cards] Demo card creation completed!');
    
    // Verify cards were created
    const verifyResponse = await fetch(`http://localhost:3000/api/v2/predator/cards?entity_id=${entityId}`);
    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      console.log(`[Demo Cards] Verification: Found ${data.count} cards for entity ${entityId}`);
    }
    
  } catch (error) {
    console.error('[Demo Cards] Error creating demo cards:', error);
    process.exit(1);
  }
}

// Run the script
createDemoCards();
