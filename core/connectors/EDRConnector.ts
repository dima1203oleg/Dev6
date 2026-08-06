// core/connectors/EDRConnector.ts
import { BaseConnector } from './BaseConnector';
import { RawEvidence } from './types';

export class EDRConnector extends BaseConnector {
  constructor() {
    super('EDRConnector', 'ЄДР Connector');
  }

  async search(query: string): Promise<RawEvidence[]> {
    console.log(`[CONNECTOR] EDR: Виконуємо пошук для ${query}`);
    return [];
  }

  async health_check(): Promise<'LIVE' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED'> {
    return 'UNVERIFIED';
  }
}
