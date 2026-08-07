import { RegistryPassport, FieldMapping } from '../../models/discovery';

export class SchemaAnalyzer {
  
  /**
   * Analyzes the first batch of data to determine field mappings and entities.
   */
  public analyzeSchema(passport: RegistryPassport, sampleRecords: any[]): RegistryPassport {
    const updatedPassport = { ...passport };
    const mappings: FieldMapping[] = [];

    if (sampleRecords.length === 0) return updatedPassport;

    // Use the first record as a schema hint
    const sample = sampleRecords[0];
    const fields = Object.keys(sample);

    for (const field of fields) {
      const val = sample[field];
      let mappedEntity: FieldMapping['mappedEntity'] = 'UNKNOWN';
      let type = typeof val;

      const lowerField = field.toLowerCase();

      // Entity Discovery Heuristics
      if (lowerField.includes('edrpou') || lowerField.includes('єдрпоу')) {
        mappedEntity = 'EDRPOU';
      } else if (lowerField.includes('ipn') || lowerField.includes('rnokpp') || lowerField.includes('рнокпп') || lowerField.includes('іпн')) {
        mappedEntity = 'RNOKPP';
      } else if (lowerField.includes('name') || lowerField.includes('назва') || lowerField.includes('п.і.б')) {
        mappedEntity = 'NAME';
      } else if (lowerField.includes('address') || lowerField.includes('адреса')) {
        mappedEntity = 'ADDRESS';
      } else if (lowerField.includes('phone') || lowerField.includes('телефон')) {
        mappedEntity = 'PHONE';
      }

      mappings.push({
        originalName: field,
        mappedEntity,
        type: type === 'object' && val !== null ? 'json' : type
      });
    }

    updatedPassport.fields = mappings;

    // Extract expected entities based on mapped fields
    const newEntities = mappings
      .map(m => m.mappedEntity)
      .filter(e => e !== 'UNKNOWN');

    updatedPassport.expectedEntities = Array.from(new Set([...updatedPassport.expectedEntities, ...newEntities]));

    return updatedPassport;
  }
}

export const schemaAnalyzer = new SchemaAnalyzer();
