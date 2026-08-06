import { Provenance } from './Provenance';

export interface Evidence {
  id: string;
  sourceId: string;
  rawPayload: any;
  schemaValid: boolean;
  checksumValid: boolean;
  provenance: Provenance;
}
