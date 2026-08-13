/**
 * PREDATOR MLIP — OSI Service
 * Open Web Intelligence: WHOIS, CT Logs, Wayback Machine, passive DNS
 */
import { WhoisRecord, CTLogEntry, ArchiveLookupResult } from '../../src/types/mlip';

export class OSIService {

  // ─── WHOIS Lookup via who.is / IANA ────────────────────────────────────
  async whoisLookup(domain: string): Promise<WhoisRecord> {
    try {
      // Use whoisfreaks public API (free tier)
      const res = await fetch(`https://api.whoisfreaks.com/v1.0/whois?whois=live&domainName=${encodeURIComponent(domain)}&apiKey=free`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        // Fallback: use public whois.arin.net for IPs
        return await this.whoisFallback(domain);
      }

      const data = await res.json();
      return {
        domain,
        registrar: data.domain_registrar?.registrar_name,
        registrantName: data.registrant_contact?.name,
        registrantOrg: data.registrant_contact?.organization,
        registrantCountry: data.registrant_contact?.country,
        registrantEmail: data.registrant_contact?.email_address,
        createdDate: data.create_date,
        updatedDate: data.update_date,
        expiresDate: data.expiry_date,
        nameservers: data.name_servers,
        status: Array.isArray(data.domain_status) ? data.domain_status : [data.domain_status].filter(Boolean),
        rawText: data.raw_text,
        retrievedAt: new Date().toISOString(),
      };
    } catch (e) {
      return await this.whoisFallback(domain);
    }
  }

  private async whoisFallback(domain: string): Promise<WhoisRecord> {
    // Use rdap.org for structured WHOIS data
    try {
      const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
        headers: { 'Accept': 'application/rdap+json' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`RDAP HTTP ${res.status}`);
      const data = await res.json();

      const nameservers = (data.nameservers || []).map((ns: any) => ns.ldhName).filter(Boolean);
      let registrar, registrantOrg, registrantCountry, createdDate, updatedDate, expiresDate;

      for (const entity of (data.entities || [])) {
        if (entity.roles?.includes('registrar')) {
          registrar = entity.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || entity.handle;
        }
        if (entity.roles?.includes('registrant')) {
          const vcard = entity.vcardArray?.[1] || [];
          registrantOrg = vcard.find((v: any) => v[0] === 'org')?.[3];
          registrantCountry = vcard.find((v: any) => v[0] === 'adr')?.[1]?.['country-name'];
        }
      }

      for (const event of (data.events || [])) {
        if (event.eventAction === 'registration') createdDate = event.eventDate;
        if (event.eventAction === 'last changed') updatedDate = event.eventDate;
        if (event.eventAction === 'expiration') expiresDate = event.eventDate;
      }

      return {
        domain,
        registrar,
        registrantOrg,
        registrantCountry,
        createdDate,
        updatedDate,
        expiresDate,
        nameservers,
        status: (data.status || []) as string[],
        retrievedAt: new Date().toISOString(),
      };
    } catch {
      return { domain, retrievedAt: new Date().toISOString() };
    }
  }

  // ─── Certificate Transparency Logs (crt.sh) ────────────────────────────
  async ctLogSearch(domain: string): Promise<CTLogEntry[]> {
    try {
      const res = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`crt.sh HTTP ${res.status}`);
      const data = await res.json();
      
      const seen = new Set<string>();
      const results: CTLogEntry[] = [];

      for (const cert of data.slice(0, 200)) {
        const key = `${cert.common_name}-${cert.not_after}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          domain,
          subjectCN: cert.common_name || cert.name_value,
          issuer: cert.issuer_name,
          notBefore: cert.not_before,
          notAfter: cert.not_after,
          serialNumber: cert.serial_number,
          crtshId: cert.id,
          loggedAt: cert.entry_timestamp || cert.not_before,
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  // ─── Wayback Machine Archive Lookup ────────────────────────────────────
  async archiveLookup(url: string): Promise<ArchiveLookupResult> {
    try {
      const apiUrl = `http://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();

      const snapshots = [];
      if (data.archived_snapshots?.closest) {
        const snap = data.archived_snapshots.closest;
        snapshots.push({
          timestamp: snap.timestamp,
          archiveUrl: snap.url,
          statusCode: parseInt(snap.status),
        });
      }

      // Also get CDX API for full history (first 20)
      try {
        const cdxRes = await fetch(
          `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=20&fl=timestamp,statuscode`,
          { signal: AbortSignal.timeout(8000) }
        );
        const cdxData = await cdxRes.json();
        if (Array.isArray(cdxData) && cdxData.length > 1) {
          for (const row of cdxData.slice(1)) {
            snapshots.push({
              timestamp: row[0],
              archiveUrl: `https://web.archive.org/web/${row[0]}/${url}`,
              statusCode: parseInt(row[1]) || undefined,
            });
          }
        }
      } catch {}

      return { url, snapshots };
    } catch {
      return { url, snapshots: [] };
    }
  }

  // ─── Passive DNS (via HackerTarget free tier) ──────────────────────────
  async passiveDNS(domain: string): Promise<Array<{ host: string; ip: string }>> {
    try {
      const res = await fetch(`https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(domain)}`, {
        signal: AbortSignal.timeout(8000),
      });
      const text = await res.text();
      return text.split('\n')
        .filter(line => line.includes(','))
        .map(line => {
          const [host, ip] = line.split(',');
          return { host: host?.trim() || '', ip: ip?.trim() || '' };
        });
    } catch {
      return [];
    }
  }

  // ─── Google Cache check ────────────────────────────────────────────────
  async googleCacheUrl(url: string): Promise<string | null> {
    return `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
  }
}

export const osiService = new OSIService();
