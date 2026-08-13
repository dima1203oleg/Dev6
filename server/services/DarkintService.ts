/**
 * PREDATOR MLIP — DARKINT Service
 * DarkNet Intelligence: Breach DBs, Pastebin monitoring, Tor hidden services.
 * NOTE: Requires RED or BLACK access level.
 */
import { DarkintResult } from '../../src/types/mlip';

export class DarkintService {

  // ─── Pastebin / Dump Monitoring ─────────────────────────────────────────
  async searchPastes(keyword: string): Promise<DarkintResult[]> {
    const results: DarkintResult[] = [];
    
    // DeHashed or similar premium service would be used here.
    // For free tier, we use the public X-posed-or-not API for pastes if available,
    // or HaveIBeenPwned API for pastes.
    const hibpKey = process.env['HIBP_API_KEY'];
    if (hibpKey && keyword.includes('@')) {
      try {
        const res = await fetch(`https://haveibeenpwned.com/api/v3/pasteaccount/${encodeURIComponent(keyword)}`, {
          headers: {
            'hibp-api-key': hibpKey,
            'User-Agent': 'PREDATOR-Analytics/1.0',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });
        
        if (res.ok) {
          const data = await res.json();
          for (const paste of data) {
            results.push({
              source: 'Pastebin',
              url: paste.Id ? `https://pastebin.com/${paste.Id}` : undefined,
              title: paste.Title,
              date: paste.Date,
              contentSnippet: `Paste found containing target. Emails count: ${paste.EmailCount}`,
              severity: 'HIGH',
            });
          }
        }
      } catch (e) {
        console.error('[DARKINT] HIBP paste search failed', e);
      }
    }

    return results;
  }

  // ─── Tor Hidden Service Search (Ahmia API) ────────────────────────────
  async searchAhmia(keyword: string): Promise<DarkintResult[]> {
    const results: DarkintResult[] = [];
    
    try {
      // Ahmia is a public search engine for Tor hidden services
      const res = await fetch(`https://ahmia.fi/search/json/?q=${encodeURIComponent(keyword)}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        const hits = data.results || [];
        
        for (let i = 0; i < Math.min(hits.length, 10); i++) {
          const hit = hits[i];
          results.push({
            source: 'Ahmia (Tor)',
            url: hit.url,
            title: hit.title,
            contentSnippet: hit.snippet,
            severity: 'CRITICAL',
          });
        }
      }
    } catch (e) {
      console.error('[DARKINT] Ahmia search failed', e);
    }

    return results;
  }
}

export const darkintService = new DarkintService();
