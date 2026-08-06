import { Evidence } from '../src/models/Evidence';

export type ConnectorStatus = 
  | 'CONNECTED'           // API passed real health check, fully operational
  | 'CONFIGURED'          // Configuration exists but not yet verified
  | 'AUTHENTICATION_FAILED' // Credentials invalid or expired
  | 'UNREACHABLE'         // API endpoint not responding
  | 'API_CONTRACT_UNKNOWN' // API exists but contract not verified
  | 'DISABLED'            // Explicitly disabled by administrator
  | 'MAINTENANCE';        // API under maintenance

export interface ConnectorResponse {
  status: 'SUCCESS' | 'FAILED' | 'NO_MATCH' | 'UNAVAILABLE';
  evidence?: Evidence;
  normalizedData?: any;
  error?: string;
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

export abstract class AbstractConnector {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly api_documentation_url?: string;
  public abstract readonly supported_api_version?: string;
  public abstract readonly authorization_mechanism?: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'CERTIFICATE' | 'NONE';

  public abstract fetch(identifier: string): Promise<ConnectorResponse>;
  public abstract health_check(): Promise<ConnectorStatus>;
  public abstract get_production_validation(): ProductionValidation;
}
