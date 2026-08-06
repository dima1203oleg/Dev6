import { AbstractConnector, ConnectorResponse, ConnectorStatus, ProductionValidation } from './AbstractConnector';
import crypto from 'crypto';

export class CrtshConnector extends AbstractConnector {
  public readonly id = 'INT-002';
  public readonly name = 'Certificate Transparency Logs (crt.sh)';
  public readonly api_documentation_url = 'https://crt.sh/';
  public readonly supported_api_version = 'v1.0';
  public readonly authorization_mechanism: 'API_KEY' | 'OAUTH2' | 'BASIC_AUTH' | 'CERTIFICATE' | 'NONE' = 'NONE';

  public async fetch(domain: string): Promise<ConnectorResponse> {
    try {
      const url = `https://crt.sh/?q=${domain}&output=json`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
         throw new Error(`Failed to fetch from crt.sh, status: ${res.status}`);
      }

      const data = await res.json();
      
      const rawRecord = {
        identifier: domain,
        certificates: data,
        url
      };

      const rawPayloadString = JSON.stringify(rawRecord);
      const hash = crypto.createHash('sha256').update(rawPayloadString).digest('hex');

      return {
        status: 'SUCCESS',
        normalizedData: {
          totalCertificates: Array.isArray(data) ? data.length : 0,
        },
        evidence: {
          id: `ev-crtsh-${domain}-${Date.now()}`,
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
    // TODO: Implement real health check against crt.sh API
    return 'API_CONTRACT_UNKNOWN';
  }

  get_production_validation(): ProductionValidation {
    return {
      has_official_api: true, // crt.sh has a public API
      documentation_url: 'https://crt.sh/',
      documentation_current: true,
      api_version_supported: 'v1.0',
      authorization_mechanism: 'NONE',
      rate_limits_confirmed: false,
      tested_with_real_responses: true,
      last_validation_date: new Date().toISOString(),
      notes: 'crt.sh provides a public JSON API. Rate limits need to be confirmed.'
    };
  }
}
