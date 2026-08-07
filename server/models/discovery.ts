export type AccessMethod = 'CKAN_DATASTORE' | 'REST_API' | 'FILE_DOWNLOAD' | 'UNKNOWN';

export interface FieldMapping {
  originalName: string;
  mappedEntity: 'RNOKPP' | 'EDRPOU' | 'NAME' | 'ADDRESS' | 'PHONE' | 'EMAIL' | 'UNKNOWN';
  type: string;
}

export interface RegistryPassport {
  sourceId: string; // e.g. "ua.gov.data.12345"
  registryName: string;
  owner: string;
  organization: string;
  datasetId: string;
  resourceId: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  format: string;
  accessMethod: AccessMethod;
  datastoreActive: boolean;
  updateFrequency: string;
  lastModified: string;
  license: string;
  coverage: string; // e.g., "National"
  expectedEntities: string[];
  confidence: number; // 0-100
  fields: FieldMapping[];
}

export interface DataQualityReport {
  completeness: number; // 0-100
  accuracy: number;
  consistency: number;
  freshness: number;
  uniqueness: number;
  healthScore: number;
}
