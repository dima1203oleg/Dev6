// core/connectors/DebtorsConnector.ts
import { BaseConnector } from './BaseConnector';
import { RawEvidence } from './types';

export class DebtorsConnector extends BaseConnector {
  constructor() {
    super('DebtorsConnector', 'Єдиний реєстр боржників Connector');
  }

  async search(query: string): Promise<RawEvidence[]> {
    console.log(`[CONNECTOR] Debtors: Виконуємо пошук для ${query}`);
    return [];
  }

  async health_check(): Promise<'LIVE' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED'> {
    return 'UNVERIFIED';
  }
}
