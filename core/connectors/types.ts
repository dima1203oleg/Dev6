// core/connectors/types.ts
export type ConnectorStatus = 
  | 'CONNECTED'           // API passed real health check, fully operational
  | 'CONFIGURED'          // Configuration exists but not yet verified
  | 'AUTHENTICATION_FAILED' // Credentials invalid or expired
  | 'UNREACHABLE'         // API endpoint not responding
  | 'API_CONTRACT_UNKNOWN' // API exists but contract not verified
  | 'DISABLED'            // Explicitly disabled by administrator
  | 'MAINTENANCE';        // API under maintenance

export interface RawEvidence {
  source_id: string;
  source_name: string;
  raw_data: any;
  hash: string;
  timestamp: string;
  parser_version: string;
  connector_version: string;
  request_id?: string;     // Unique identifier for the request
  api_version?: string;   // API version used
  confidence_score?: number; // 0-1 confidence level
  validation_status?: 'VALID' | 'INVALID' | 'PENDING' | 'FAILED';
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
    api_documentation_url?: string;
    supported_api_version?: string;
    rate_limits?: {
      requests_per_minute?: number;
      requests_per_hour?: number;
    };
    authorization_mechanism?: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'CERTIFICATE' | 'NONE';
  };
  search: (query: string) => Promise<RawEvidence[]>;
  health_check: () => Promise<ConnectorStatus>;
  get_production_validation: () => ProductionValidation;
}

export interface ProductionValidation {
  has_official_api: boolean;
  documentation_url?: string;
  documentation_current: boolean;
  api_version_supported: string;
  authorization_mechanism: string;
  rate_limits_confirmed: boolean;
  tested_with_real_responses: boolean;
  last_validation_date?: string;
  notes?: string;
}
