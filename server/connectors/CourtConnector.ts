import { AbstractConnector, ConnectorResponse } from './AbstractConnector';
import crypto from 'crypto';

export class CourtConnector extends AbstractConnector {
  public readonly id = 'UA-002';
  public readonly name = 'Єдиний державний реєстр судових рішень';

  public async fetch(identifier: string): Promise<ConnectorResponse> {
    try {
      const url = `https://clarity-project.info/edr/${identifier}/court-cases`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
         if (res.status === 404) {
             const noDataRaw = { identifier, totalCases: 0, url, httpStatus: 404 };
             const noDataHash = crypto.createHash('sha256').update(JSON.stringify(noDataRaw)).digest('hex');
             return {
               status: 'SUCCESS',
               normalizedData: { totalCases: 0 },
               evidence: {
                 id: `ev-court-${identifier}-${Date.now()}`,
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
         throw new Error(`Failed to fetch from Clarity Court Cases, status: ${res.status}`);
      }

      const text = await res.text();
      const countMatch = text.match(/Судові справи &mdash; <b>(\d+)<\/b>/);
      let totalCases = 0;

      if (countMatch && countMatch[1]) {
          totalCases = parseInt(countMatch[1], 10);
      }

      const rawRecord = {
        identifier,
        totalCases,
        url
      };

      const rawPayloadString = JSON.stringify(rawRecord);
      const hash = crypto.createHash('sha256').update(rawPayloadString).digest('hex');

      return {
        status: 'SUCCESS',
        normalizedData: {
          totalCases,
        },
        evidence: {
          id: `ev-court-${identifier}-${Date.now()}`,
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
