import { CrossSourceResult } from './CrossSourceComparer';

export class ConflictResolver {
  public resolve(comparisonResult: CrossSourceResult): any {
    // Basic resolution: just return the first available field if no conflicts
    if (comparisonResult.conflicting_fields.length === 0 && comparisonResult.evidences.length > 0) {
      return {
        resolvedEntity: comparisonResult.evidences[0].rawPayload,
        status: 'VERIFIED'
      };
    }
    
    return {
      resolvedEntity: null,
      status: 'CONFLICT'
    };
  }
}
