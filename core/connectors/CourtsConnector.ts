// core/connectors/CourtsConnector.ts
import { BaseConnector } from './BaseConnector';
import { RawEvidence } from './types';

export class CourtsConnector extends BaseConnector {
  constructor() {
    super('CourtsConnector', 'ЄДРСР Connector');
  }

  async search(query: string): Promise<RawEvidence[]> {
    console.log(`[CONNECTOR] Courts: Виконуємо пошук для ${query}`);
    return [];
  }

  async health_check(): Promise<'LIVE' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED'> {
    return 'UNVERIFIED';
  }
}
