import { AbstractConnector, ConnectorResponse } from './AbstractConnector';
import crypto from 'crypto';

export class HibpConnector extends AbstractConnector {
  public readonly id = 'INT-001';
  public readonly name = 'HaveIBeenPwned (HIBP)';

  public async fetch(emailOrPhone: string): Promise<ConnectorResponse> {
    try {
      const apiKey = process.env.HIBP_API_KEY;
      if (!apiKey) {
        return { 
          status: 'UNAVAILABLE', 
          error: 'HIBP_API_KEY is missing' 
        };
      }

      const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(emailOrPhone)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { 
        headers: { 'hibp-api-key': apiKey },
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
         if (res.status === 404) {
             return { status: 'SUCCESS', normalizedData: { breaches: [] }, evidence: { id: '', sourceId: this.id, rawPayload: {}, schemaValid: true, checksumValid: true, provenance: {} as any } };
         }
         throw new Error(`Failed to fetch from HIBP, status: ${res.status}`);
      }

      const data = await res.json();
      
      const rawRecord = {
        identifier: emailOrPhone,
        breaches: data,
        url
      };

      const rawPayloadString = JSON.stringify(rawRecord);
      const hash = crypto.createHash('sha256').update(rawPayloadString).digest('hex');

      return {
        status: 'SUCCESS',
        normalizedData: {
          totalBreaches: Array.isArray(data) ? data.length : 0,
        },
        evidence: {
          id: `ev-hibp-${emailOrPhone}-${Date.now()}`,
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
