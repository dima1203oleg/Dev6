import { AbstractConnector, ConnectorResponse } from './AbstractConnector';
import crypto from 'crypto';

export class CrtshConnector extends AbstractConnector {
  public readonly id = 'INT-002';
  public readonly name = 'Certificate Transparency Logs (crt.sh)';

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
}
