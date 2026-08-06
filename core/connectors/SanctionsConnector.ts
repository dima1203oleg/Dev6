// core/connectors/SanctionsConnector.ts
import { BaseConnector } from './BaseConnector';
import { RawEvidence } from './types';

export class SanctionsConnector extends BaseConnector {
  constructor() {
    super('SanctionsConnector', 'РНБО Санкції Connector');
  }

  async search(query: string): Promise<RawEvidence[]> {
    console.log(`[CONNECTOR] Sanctions: Виконуємо пошук для ${query}`);
    return [];
  }

  async health_check(): Promise<'LIVE' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED'> {
    return 'UNVERIFIED';
  }
}
