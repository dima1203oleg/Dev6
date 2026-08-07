import { registryClassifier } from './RegistryClassifier';
import { schemaAnalyzer } from './SchemaAnalyzer';
import { RegistryPassport } from '../../models/discovery';

export class CkanDiscoveryEngine {
  private ckanBaseUrl = 'https://data.gov.ua/api/3/action';

  /**
   * Main autonomous loop for discovering and onboarding CKAN packages.
   * This would typically run in a cron job or a background worker.
   */
  public async discoverAndOnboard(packageId: string): Promise<RegistryPassport | null> {
    try {
      console.log(`[DiscoveryEngine] Scanning package: ${packageId}`);
      
      // 1. Fetch package metadata
      const packageUrl = `${this.ckanBaseUrl}/package_show?id=${packageId}`;
      const packageRes = await fetch(packageUrl);
      if (!packageRes.ok) throw new Error('Failed to fetch package_show');
      const packageData = await packageRes.json();
      const pkg = packageData.result;

      if (!pkg.resources || pkg.resources.length === 0) {
        console.log(`[DiscoveryEngine] Package ${packageId} has no resources.`);
        return null;
      }

      // Pick the main resource (usually the first active datastore)
      const resource = pkg.resources.find((r: any) => r.datastore_active) || pkg.resources[0];

      // 2. Classify Registry
      let passport = registryClassifier.classify(pkg, resource);
      console.log(`[DiscoveryEngine] Classified ${passport.registryName} as ${passport.category}`);

      // 3. Schema Analyzer (if datastore is active)
      if (passport.datastoreActive) {
        const searchUrl = `${this.ckanBaseUrl}/datastore_search?resource_id=${resource.id}&limit=5`;
        const searchRes = await fetch(searchUrl);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.result?.records) {
            passport = schemaAnalyzer.analyzeSchema(passport, searchData.result.records);
            console.log(`[DiscoveryEngine] Analyzed schema. Found fields: ${passport.fields.length}`);
          }
        }
      }

      // 4. Submit to Certification & Connector Factory (to be implemented)
      console.log(`[DiscoveryEngine] Successfully discovered and mapped passport for ${packageId}`);
      
      return passport;
    } catch (e) {
      console.error(`[DiscoveryEngine] Error scanning package ${packageId}:`, e);
      return null;
    }
  }
}

export const discoveryEngine = new CkanDiscoveryEngine();
