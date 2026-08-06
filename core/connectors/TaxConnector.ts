// core/connectors/TaxConnector.ts
import { BaseConnector } from './BaseConnector';
import { RawEvidence } from './types';

export class TaxConnector extends BaseConnector {
  constructor() {
    super('TaxConnector', 'ДПС Connector');
  }

  async search(query: string): Promise<RawEvidence[]> {
    console.log(`[CONNECTOR] Tax: Виконуємо пошук для ${query}`);
    return [];
  }

  async health_check(): Promise<'LIVE' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED'> {
    return 'UNVERIFIED';
  }
}
