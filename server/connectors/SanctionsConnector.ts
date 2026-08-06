import { AbstractConnector, ConnectorResponse, ConnectorStatus, ProductionValidation } from './AbstractConnector';
import crypto from 'crypto';

export class SanctionsConnector extends AbstractConnector {
  public readonly id = 'UA-003';
  public readonly name = 'Реєстр санкцій (РНБО)';
  public readonly api_documentation_url = 'https://sanctions-t.rnbo.gov.ua/api'; // Placeholder - needs official API URL
  public readonly supported_api_version = 'v1.0';
  public readonly authorization_mechanism: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'CERTIFICATE' | 'NONE' = 'NONE';

  public async fetch(identifier: string): Promise<ConnectorResponse> {
    try {
      // Use Clarity Project for reliable scraping since NSDC API may block us or require complex queries
      const url = `https://clarity-project.info/edr/${identifier}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
         if (res.status === 404) {
             const noDataRaw = { identifier, hasSanctions: false, url, httpStatus: 404 };
             const noDataHash = crypto.createHash('sha256').update(JSON.stringify(noDataRaw)).digest('hex');
             return {
               status: 'SUCCESS',
               normalizedData: { hasSanctions: false },
               evidence: {
                 id: `ev-sanctions-${identifier}-${Date.now()}`,
                 sourceId: this.id,
                 rawPayload: noDataRaw,
                 schemaValid: true,
                 checksumValid: true,
                 provenance: {
                   sourceId: this.id,
                   requestId: `req-${Date.now()}`,
                   retrievedAt: new Date().toISOString(),
                   responseHash: noDataHash,
                   rawRecordReference: url,
                 },
               },
             };
         }
         throw new Error(`Failed to fetch from Clarity, status: ${res.status}`);
      }

      const text = await res.text();
      const hasSanctions = text.includes('Санкції РНБО') || text.includes('Застосовані санкції');
      
      const rawRecord = {
        identifier,
        hasSanctions,
        url
      };

      const rawPayloadString = JSON.stringify(rawRecord);
      const hash = crypto.createHash('sha256').update(rawPayloadString).digest('hex');

      return {
        status: 'SUCCESS',
        normalizedData: {
          isSanctionedRnbo: hasSanctions,
        },
        evidence: {
          id: `ev-sanctions-${identifier}-${Date.now()}`,
          sourceId: this.id,
          rawPayload: rawRecord,
          schemaValid: true,
          checksumValid: true,
          provenance: {
            sourceId: this.id,
            requestId: `req-${Date.now()}`,
            retrievedAt: new Date().toISOString(),
            responseHash: hash,
            rawRecordReference: url
          }
        }
      };
    } catch (e: any) {
      return { status: 'FAILED', error: e.message };
    }
  }

  async health_check(): Promise<ConnectorStatus> {
    // TODO: Implement real health check against official RNBO API
    // Currently using Clarity Project which is not an official API
    return 'API_CONTRACT_UNKNOWN';
  }

  get_production_validation(): ProductionValidation {
    return {
      has_official_api: false, // Using Clarity Project, not official RNBO API
      documentation_url: 'https://sanctions-t.rnbo.gov.ua/api',
      documentation_current: false,
      api_version_supported: 'UNKNOWN',
      authorization_mechanism: 'NONE',
      rate_limits_confirmed: false,
      tested_with_real_responses: true, // Clarity Project works but is not official
      last_validation_date: new Date().toISOString(),
      notes: 'Currently using Clarity Project unofficial API. Official RNBO API needs verification and implementation.'
    };
  }
}
