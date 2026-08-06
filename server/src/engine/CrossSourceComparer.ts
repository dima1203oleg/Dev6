import { ConnectorResponse } from '../../connectors/AbstractConnector';
import { Evidence } from '../models/Evidence';

export interface CrossSourceResult {
  match_method: string;
  match_score: number;
  matched_fields: string[];
  conflicting_fields: string[];
  sources: string[];
  evidences: Evidence[];
}

export class CrossSourceComparer {
  public compare(responses: ConnectorResponse[]): CrossSourceResult {
    const successfulResponses = responses.filter(r => r.status === 'SUCCESS' && r.evidence && r.normalizedData);
    
    if (successfulResponses.length === 0) {
      return {
        match_method: 'NONE',
        match_score: 0,
        matched_fields: [],
        conflicting_fields: [],
        sources: [],
        evidences: []
      };
    }

    // Basic comparison logic for prototype
    const matchedFields: string[] = [];
    const conflictingFields: string[] = [];
    
    if (successfulResponses.length > 0) {
       matchedFields.push('rnokpp', 'name', 'status');
    }

    return {
      match_method: 'EXACT_IDENTIFIER_MATCH',
      match_score: 100,
      matched_fields: matchedFields,
      conflicting_fields: conflictingFields,
      sources: successfulResponses.map(r => r.evidence!.sourceId),
      evidences: successfulResponses.map(r => r.evidence!)
    };
  }
}
