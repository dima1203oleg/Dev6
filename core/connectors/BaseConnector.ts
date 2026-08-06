// core/connectors/BaseConnector.ts
import { Connector, RawEvidence } from './types';

export abstract class BaseConnector implements Connector {
  constructor(public id: string, public name: string) {}

  metadata = { id: this.id, name: this.name };

  abstract search(query: string): Promise<RawEvidence[]>;
  
  abstract health_check(): Promise<'LIVE' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED'>;
}
