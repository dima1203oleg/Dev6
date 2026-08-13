import { CkanConnector } from './BaseConnector';
import { RegistryPassport } from '../../models/discovery';
import { EntityType, IdentifierType } from './sdk';

export class DynamicCkanConnector extends CkanConnector {
  private passport: RegistryPassport;

  constructor(passport: RegistryPassport) {
    // Map passport entities to the connector's expected types
    const entities = passport.expectedEntities as EntityType[];
    
    // Map passport field mappings to the connector's identifiers
    const identifiers = passport.fields
      .map(f => f.mappedEntity)
      .filter(e => e !== 'UNKNOWN') as unknown as IdentifierType[];

    super(
      passport.sourceId,
      passport.registryName,
      passport.registryName, // nameEn fallback
      passport.resourceId,
      passport.category,
      passport.owner,
      entities.length > 0 ? entities : ['COMPANY'],
      identifiers.length > 0 ? identifiers : ['edrpou'],
      passport.coverage
    );

    this.passport = passport;
  }

  // Override normalize to use auto-mapped fields from SchemaAnalyzer
  public override normalize(parsed: any[]): any[] {
    return parsed.map(p => {
      const normalizedRecord: any = { ...p, canonicalFields: {} };
      
      for (const field of this.passport.fields) {
        if (field.mappedEntity !== 'UNKNOWN') {
          // Normalize the raw field into canonical structure
          normalizedRecord.canonicalFields[field.mappedEntity.toLowerCase()] = p.rawFields[field.originalName];
        } else {
          // Keep raw if not mapped
          normalizedRecord.canonicalFields[field.originalName] = p.rawFields[field.originalName];
        }
      }
      
      normalizedRecord.normalizedAt = new Date().toISOString();
      return normalizedRecord;
    });
  }
}
