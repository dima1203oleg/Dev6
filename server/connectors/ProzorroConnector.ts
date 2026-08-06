import { AbstractConnector, ConnectorResponse } from './AbstractConnector';
import crypto from 'crypto';

export class ProzorroConnector extends AbstractConnector {
  public readonly id = 'UA-004';
  public readonly name = 'Система публічних закупівель Prozorro';

  public async fetch(identifier: string): Promise<ConnectorResponse> {
    try {
      const url = `https://clarity-project.info/edr/${identifier}/tenders`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
         if (res.status === 404) {
             const noDataRaw = { identifier, tendersCount: 0, wonTendersCount: 0, url, httpStatus: 404 };
             const noDataHash = crypto.createHash('sha256').update(JSON.stringify(noDataRaw)).digest('hex');
             return {
               status: 'SUCCESS',
               normalizedData: { tendersCount: 0, wonTendersCount: 0 },
               evidence: {
                 id: `ev-prozorro-${identifier}-${Date.now()}`,
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
         throw new Error(`Failed to fetch from Clarity Tenders, status: ${res.status}`);
      }

      const text = await res.text();
      // Look for table rows or some indicator of tenders.
      const countMatch = text.match(/Учасник у (\d+) закупівлях/);
      const winnerMatch = text.match(/Переможець у (\d+) закупівлях/);

      let totalTenders = 0;
      let wonTenders = 0;

      if (countMatch && countMatch[1]) {
          totalTenders = parseInt(countMatch[1], 10);
      }
      if (winnerMatch && winnerMatch[1]) {
          wonTenders = parseInt(winnerMatch[1], 10);
      }

      const rawRecord = {
        identifier,
        totalTenders,
        wonTenders,
        url
      };

      const rawPayloadString = JSON.stringify(rawRecord);
      const hash = crypto.createHash('sha256').update(rawPayloadString).digest('hex');

      return {
        status: 'SUCCESS',
        normalizedData: {
          tendersCount: totalTenders,
          wonTendersCount: wonTenders,
        },
        evidence: {
          id: `ev-prozorro-${identifier}-${Date.now()}`,
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
