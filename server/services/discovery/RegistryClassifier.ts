import { RegistryPassport, AccessMethod } from '../../models/discovery';
import crypto from 'crypto';

export class RegistryClassifier {
  
  /**
   * Classifies a CKAN package (dataset) and its resources.
   * In a real implementation, this would use an LLM or complex heuristics
   * to determine the category, expected entities, etc.
   */
  public classify(ckanPackage: any, resource: any): RegistryPassport {
    const title = (ckanPackage.title || '').toLowerCase();
    
    // Heuristics for category
    let category = 'UNKNOWN';
    let expectedEntities: string[] = [];
    
    if (title.includes('суд') || title.includes('рішення')) {
      category = 'COURT';
    } else if (title.includes('єдиний державний реєстр') || title.includes('єдр')) {
      category = 'COMPANY';
      expectedEntities = ['EDRPOU', 'RNOKPP'];
    } else if (title.includes('ліцензі')) {
      category = 'LICENSES';
    } else if (title.includes('податк')) {
      category = 'TAX';
      expectedEntities = ['EDRPOU', 'RNOKPP'];
    }

    const accessMethod: AccessMethod = resource.datastore_active ? 'CKAN_DATASTORE' : (resource.url ? 'FILE_DOWNLOAD' : 'UNKNOWN');

    return {
      sourceId: `ua.ckan.${resource.id}`,
      registryName: ckanPackage.title || 'Unknown Dataset',
      owner: ckanPackage.author || ckanPackage.maintainer || 'Unknown Owner',
      organization: ckanPackage.organization?.title || 'Unknown Org',
      datasetId: ckanPackage.id,
      resourceId: resource.id,
      category,
      priority: resource.datastore_active ? 'HIGH' : 'LOW', // Datastore means we can SQL query it
      format: resource.format || 'CSV',
      accessMethod,
      datastoreActive: !!resource.datastore_active,
      updateFrequency: ckanPackage.update_frequency || 'UNKNOWN',
      lastModified: resource.last_modified || new Date().toISOString(),
      license: ckanPackage.license_title || 'Open',
      coverage: 'National',
      expectedEntities,
      confidence: 85, // Mocked confidence score
      fields: []
    };
  }
}

export const registryClassifier = new RegistryClassifier();
