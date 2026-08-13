import { CrossSourceResult } from './CrossSourceComparer';

export interface ResolvedEntity {
  mergedData: Record<string, any>;
  conflicts: { field: string; values: { sourceId: string; value: any }[] }[];
  status: 'VERIFIED' | 'CONFLICT' | 'UNRESOLVED';
  primarySource: string | null;
}

// Higher number means higher priority/trust
const SOURCE_PRIORITY: Record<string, number> = {
  'UA-001': 100, // ЄДР
  'UA-002': 90,  // Судовий реєстр
  'UA-003': 80,  // Податкова
  'DEFAULT': 50  // OSINT, комерційні, тощо
};

export class ConflictResolver {
  public resolve(comparisonResult: CrossSourceResult): ResolvedEntity {
    if (comparisonResult.evidences.length === 0) {
      return {
        mergedData: {},
        conflicts: [],
        status: 'UNRESOLVED',
        primarySource: null
      };
    }

    const mergedData: Record<string, any> = {};
    const conflicts: { field: string; values: { sourceId: string; value: any }[] }[] = [];
    
    // Sort evidences by source priority (descending)
    const sortedEvidences = [...comparisonResult.evidences].sort((a, b) => {
      const priorityA = SOURCE_PRIORITY[a.sourceId] ?? SOURCE_PRIORITY['DEFAULT'];
      const priorityB = SOURCE_PRIORITY[b.sourceId] ?? SOURCE_PRIORITY['DEFAULT'];
      return (priorityB || 0) - (priorityA || 0);
    });

    const primarySource = sortedEvidences[0]?.sourceId || null;
    const allKeys = new Set<string>();
    
    sortedEvidences.forEach(evidence => {
      if (evidence.rawPayload) {
        Object.keys(evidence.rawPayload).forEach(key => allKeys.add(key));
      }
    });

    allKeys.forEach(key => {
      const values = sortedEvidences
        .filter(e => e.rawPayload && e.rawPayload[key] !== undefined && e.rawPayload[key] !== null)
        .map(e => ({ sourceId: e.sourceId, value: e.rawPayload[key] }));

      if (values.length > 0) {
        // Find if there are contradictory values
        const uniqueValues = new Set(values.map(v => JSON.stringify(v.value)));
        
        if (uniqueValues.size > 1) {
          // Conflict detected, pick the value from the highest priority source
          mergedData[key] = values[0]?.value; 
          conflicts.push({ field: key, values });
        } else {
          // No conflict
          mergedData[key] = values[0]?.value;
        }
      }
    });

    return {
      mergedData,
      conflicts,
      status: conflicts.length > 0 ? 'CONFLICT' : 'VERIFIED',
      primarySource
    };
  }
}
