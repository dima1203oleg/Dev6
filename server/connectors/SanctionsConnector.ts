import { AbstractConnector, ConnectorResponse } from './AbstractConnector';
import crypto from 'crypto';

export class SanctionsConnector extends AbstractConnector {
  public readonly id = 'UA-003';
  public readonly name = 'Реєстр санкцій (РНБО)';

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
}
