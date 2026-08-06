// core/registry/SourceCatalog.ts
// Delegating to Canonical Source Registry (Single Source of Truth)

import { canonicalSourceRegistry, CanonicalSourceUnit, CertificationStatus } from './canonical-source-registry';

export type AccessType = 'public_api' | 'web_scraping' | 'file_dump' | 'contract';
export type SourceStatus = CertificationStatus;

export interface SourceDefinition {
  source_id: string;
  name: string;
  country: string;
  category: string;
  access_type: AccessType;
  connector_id: string;
  entity_types: ('person' | 'company' | 'fop')[];
  identifiers: string[];
  priority: number;
  authority_level: 'primary' | 'secondary' | 'osint';
  freshness: string;
  supports_history: boolean;
  status: SourceStatus;
  enabled: boolean;
}

export function getRegistryCatalog(): SourceDefinition[] {
  return canonicalSourceRegistry.getAll().map(unit => ({
    source_id: unit.source_id,
    name: unit.name,
    country: unit.country,
    category: unit.category,
    access_type: 'public_api',
    connector_id: unit.connector_id,
    entity_types: unit.capabilities.filter((c): c is 'person' | 'company' | 'fop' => ['person', 'company', 'fop'].includes(c)),
    identifiers: unit.supported_identifiers,
    priority: 100,
    authority_level: 'primary',
    freshness: unit.freshness,
    supports_history: true,
    status: unit.status,
    enabled: unit.status !== 'DISABLED' && unit.status !== 'OFFLINE'
  }));
}

export const RegistryCatalog: SourceDefinition[] = getRegistryCatalog();
