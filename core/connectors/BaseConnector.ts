// core/connectors/BaseConnector.ts
import { Connector, RawEvidence, ConnectorStatus, ProductionValidation } from './types';

export abstract class BaseConnector implements Connector {
  constructor(
    public id: string, 
    public name: string,
    public api_documentation_url?: string,
    public supported_api_version?: string,
    public authorization_mechanism?: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'CERTIFICATE' | 'NONE'
  ) {}

  metadata = { 
    id: this.id, 
    name: this.name,
    api_documentation_url: this.api_documentation_url,
    supported_api_version: this.supported_api_version,
    authorization_mechanism: this.authorization_mechanism
  };

  abstract search(query: string): Promise<RawEvidence[]>;
  
  abstract health_check(): Promise<ConnectorStatus>;

  abstract get_production_validation(): ProductionValidation;
}
