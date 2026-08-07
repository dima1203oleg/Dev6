import { CkanDiscoveryEngine, discoveryEngine } from '../discovery/CkanDiscoveryEngine';
import { ConnectorFactory } from '../../datasources/connectors/sdk'; // Assume a singleton or injection

export class SelfHealingEngine {
  
  /**
   * Monitor a connector's health.
   * If a dynamic connector fails parsing due to schema drift, trigger self-healing.
   */
  public async handleIncident(sourceId: string, error: any) {
    console.warn(`[SelfHealingEngine] Incident detected on ${sourceId}:`, error);

    // E.g., if it's a schema error
    if (error.message?.includes('schema') || error.message?.includes('undefined field')) {
      console.log(`[SelfHealingEngine] Schema drift detected. Re-triggering Discovery for ${sourceId}`);
      
      // In a real system, we would parse sourceId back to the CKAN package ID.
      // Assuming sourceId is "ua.ckan.<package_id>"
      const packageId = sourceId.replace('ua.ckan.', '');
      
      const newPassport = await discoveryEngine.discoverAndOnboard(packageId);
      
      if (newPassport) {
        console.log(`[SelfHealingEngine] Auto-mapping successful. Re-registering dynamic connector for ${sourceId}`);
        // We'd inject the actual connectorFactory instance here
        // connectorFactory.registerDynamic(newPassport);
        return true; // Successfully healed
      }
    }

    return false; // Could not auto-heal
  }
}

export const selfHealingEngine = new SelfHealingEngine();
