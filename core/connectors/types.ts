// core/connectors/types.ts
export interface RawEvidence {
  source_id: string;
  source_name: string;
  raw_data: any;
  hash: string;
  timestamp: string;
  parser_version: string;
  connector_version: string;
}

export interface NormalizedFact {
  fact_id: string;
  entity_id: string;
  fact_type: string;
  value: any;
  confidence: 'VERIFIED' | 'CORROBORATED' | 'POSSIBLE' | 'CONFLICTED';
  evidence_id: string; // Посилання на RawEvidence
}

export interface Connector {
  metadata: {
    id: string;
    name: string;
  };
  search: (query: string) => Promise<RawEvidence[]>;
  health_check: () => Promise<'LIVE' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED'>;
}
