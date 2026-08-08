// core/connectors/SanctionsConnector.ts
import { BaseConnector } from './BaseConnector';
import { RawEvidence, ConnectorStatus, ProductionValidation } from './types';

export class SanctionsConnector extends BaseConnector {
  constructor() {
    super(
      'SanctionsConnector', 
      'РНБО Санкції Connector',
      'https://sanctions-t.rnbo.gov.ua/api', // Placeholder - needs official API URL
      'v1.0',
      'API_KEY'
    );
  }

  async search(query: string): Promise<RawEvidence[]> {
    console.log(`[CONNECTOR] Sanctions: Виконуємо пошук для ${query}`);
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`, {
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(30000)
      });
      
      if (!response.ok) {
        throw new Error(`Sanctions API returned ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error(`[CONNECTOR] Sanctions search failed:`, error);
      return [];
    }
  }

  async health_check(): Promise<ConnectorStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        return 'LIVE';
      } else {
        return 'API_CONTRACT_UNKNOWN';
      }
    } catch (error) {
      return 'SOURCE_UNAVAILABLE';
    }
  }

  get_production_validation(): ProductionValidation {
    return {
      has_official_api: false,
      documentation_url: 'https://sanctions-t.rnbo.gov.ua/api',
      documentation_current: false,
      api_version_supported: 'UNKNOWN',
      authorization_mechanism: 'API_KEY',
      rate_limits_confirmed: false,
      tested_with_real_responses: false,
      last_validation_date: new Date().toISOString(),
      notes: 'Connector requires production validation. Official API existence and contract need verification.'
    };
  }
}
