import { AbstractConnector, ConnectorResponse } from './AbstractConnector';
import crypto from 'crypto';

export class FOPConnector extends AbstractConnector {
  public readonly id = 'edr_fop';
  public readonly name = 'ЄДР (FOP dataset)';

  public async fetch(identifier: string): Promise<ConnectorResponse> {
    try {
      const url = `https://clarity-project.info/edr/${identifier}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
         if (res.status === 404) {
             const noDataRaw = { identifier, fullName: 'Не знайдено', status: 'Не знайдено', url, httpStatus: 404 };
             const noDataHash = crypto.createHash('sha256').update(JSON.stringify(noDataRaw)).digest('hex');
             return {
               status: 'SUCCESS',
               normalizedData: { name: 'Не знайдено', status: 'Не знайдено' },
               evidence: {
                 id: `ev-fop-${identifier}-${Date.now()}`,
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
      const titleMatch = text.match(/<meta property="og:title" content="(.*?)"/);
      let fullName = "Unknown";
      let status = "Не знайдено";
      
      if (titleMatch && titleMatch[1]) {
        // e.g. "АКЦІОНЕРНЕ ТОВАРИСТВО КОМЕРЦІЙНИЙ БАНК "ПРИВАТБАНК" (ЄДРПОУ 14360570) - перевірка компанії | Clarity Project - "
        const rawTitle = titleMatch[1];
        if (rawTitle.includes('Clarity Project') && rawTitle.includes('перевірка')) {
          const namePart = rawTitle.split(' (')[0];
          fullName = namePart.replace(/&quot;/g, '"');
          status = "зареєстровано"; // Assume registered if page exists and has title
        } else {
           fullName = "Не знайдено";
           status = "Не знайдено";
        }
      } else {
        // If we can't parse title, it might be a page with no data
        fullName = "Не знайдено";
        status = "Не знайдено";
      }

      const rawRecord = {
        identifier,
        fullName,
        status,
        url
      };

      const rawPayloadString = JSON.stringify(rawRecord);
      const hash = crypto.createHash('sha256').update(rawPayloadString).digest('hex');

      return {
        status: 'SUCCESS',
        normalizedData: {
          rnokpp: identifier,
          name: rawRecord.fullName,
          status: rawRecord.status
        },
        evidence: {
          id: `ev-fop-${identifier}-${Date.now()}`,
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
