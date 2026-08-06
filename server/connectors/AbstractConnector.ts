import { Evidence } from '../src/models/Evidence';

export interface ConnectorResponse {
  status: 'SUCCESS' | 'FAILED' | 'NO_MATCH' | 'UNAVAILABLE';
  evidence?: Evidence;
  normalizedData?: any;
  error?: string;
}

export abstract class AbstractConnector {
  public abstract readonly id: string;
  public abstract readonly name: string;

  public abstract fetch(identifier: string): Promise<ConnectorResponse>;
}
