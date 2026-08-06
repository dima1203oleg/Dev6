// core/connectors/ConnectorFactory.ts
import { Connector } from './types';
import { SourceType } from '../orchestrator/SourceRouter';
import { EDRConnector } from './EDRConnector';
import { CourtsConnector } from './CourtsConnector';
import { TaxConnector } from './TaxConnector';
import { SanctionsConnector } from './SanctionsConnector';
import { DebtorsConnector } from './DebtorsConnector';
import { BankruptcyConnector } from './BankruptcyConnector';

export class ConnectorFactory {
  static getConnector(source: SourceType): Connector {
    if (source === 'UA.EDR') {
      return new EDRConnector();
    }
    if (source === 'UA.COURTS') {
      return new CourtsConnector();
    }
    if (source === 'UA.TAX') {
      return new TaxConnector();
    }
    if (source === 'UA.SANCTIONS') {
      return new SanctionsConnector();
    }
    if (source === 'UA.DEBTORS') {
      return new DebtorsConnector();
    }
    if (source === 'UA.BANKRUPTCY') {
      return new BankruptcyConnector();
    }
    
    // Fallback для інших джерел поки що залишається моком
    return {
      metadata: { id: source, name: source },
      search: async (query: string) => {
        console.log(`[CONNECTOR] Пошук в ${source} для ${query}`);
        return [];
      },
      health_check: async () => 'UNVERIFIED'
    };
  }
}
