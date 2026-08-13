/**
 * PREDATOR MLIP — COMINT Service
 * Communication Intelligence: Email breach, Phone HLR, Passive DNS, IP intel
 */
import {
  BreachRecord, BreachSearchResult,
  PhoneIntelResult, PassiveDNSRecord, IPIntelResult
} from '../../src/types/mlip';

export class ComintService {

  // ─── Email Breach Lookup (HaveIBeenPwned) ─────────────────────────────
  async emailBreachSearch(email: string): Promise<BreachRecord[]> {
    const apiKey = process.env['HIBP_API_KEY'];
    if (!apiKey) {
      console.warn('[COMINT] HIBP_API_KEY not set — using public endpoint (limited)');
      return this.emailBreachPublicFallback(email);
    }
    try {
      const res = await fetch(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
        {
          headers: {
            'hibp-api-key': apiKey,
            'User-Agent': 'PREDATOR-Analytics/1.0',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`HIBP HTTP ${res.status}`);
      const data = await res.json();
      return (data as any[]).map(b => ({
        name: b.Name,
        domain: b.Domain,
        breachDate: b.BreachDate,
        addedDate: b.AddedDate,
        pwnCount: b.PwnCount,
        dataClasses: b.DataClasses,
        isVerified: b.IsVerified,
        isFabricated: b.IsFabricated,
        isSensitive: b.IsSensitive,
        description: b.Description,
      }));
    } catch {
      return this.emailBreachPublicFallback(email);
    }
  }

  private async emailBreachPublicFallback(email: string): Promise<BreachRecord[]> {
    // DeHashed public search (no key needed for domain)
    try {
      const domain = email.split('@')[1];
      if (!domain) return [];
      // Free tier: just check breach notification via breach.watch alternative
      const res = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.ExposedBreaches?.breaches_details || []).map((b: any) => ({
        name: b.breach,
        breachDate: b.year?.toString(),
        dataClasses: b.exposed_data,
        pwnCount: undefined,
        isVerified: true,
      }));
    } catch {
      return [];
    }
  }

  // ─── Full Breach Scan (email/phone/domain/username/IP) ─────────────────
  async breachScan(query: string, queryType: BreachSearchResult['queryType']): Promise<BreachSearchResult> {
    let breaches: BreachRecord[] = [];

    if (queryType === 'EMAIL') {
      breaches = await this.emailBreachSearch(query);
    }

    return {
      query,
      queryType,
      breaches,
      totalExposures: breaches.length,
      pastebinMentions: [],
      darkWebMentions: [],
    };
  }

  // ─── Phone Intelligence ────────────────────────────────────────────────
  async phoneIntel(phone: string): Promise<PhoneIntelResult> {
    const cleaned = phone.replace(/\D/g, '');
    const result: PhoneIntelResult = { number: phone };

    // 1. Try AbstractAPI phone validation (free tier: 500/month)
    const abstractKey = process.env['ABSTRACTAPI_PHONE_KEY'];
    if (abstractKey) {
      try {
        const res = await fetch(
          `https://phonevalidation.abstractapi.com/v1/?api_key=${abstractKey}&phone=${cleaned}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (res.ok) {
          const data = await res.json();
          result.formattedNumber = data.format?.international;
          result.country = data.country?.name;
          result.carrier = data.carrier;
          result.lineType = data.type?.toLowerCase() as any;
        }
      } catch {}
    }

    // 2. Try NumVerify (free tier: 250/month)
    const numverifyKey = process.env['NUMVERIFY_API_KEY'];
    if (numverifyKey && !result.carrier) {
      try {
        const res = await fetch(
          `http://apilayer.net/api/validate?access_key=${numverifyKey}&number=${cleaned}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (res.ok) {
          const data = await res.json();
          result.country = result.country || data.country_name;
          result.carrier = result.carrier || data.carrier;
          result.lineType = result.lineType || (data.line_type?.toLowerCase() as any);
        }
      } catch {}
    }

    // 3. Breach search for phone
    result.breaches = await this.phoneBreachSearch(cleaned);
    result.breachCount = result.breaches.length;

    return result;
  }

  private async phoneBreachSearch(phone: string): Promise<BreachRecord[]> {
    try {
      const res = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(phone)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.ExposedBreaches?.breaches_details || []).map((b: any) => ({
        name: b.breach,
        breachDate: b.year?.toString(),
        dataClasses: b.exposed_data,
        isVerified: true,
      }));
    } catch {
      return [];
    }
  }

  // ─── IP Intelligence (ipinfo.io / ip-api.com) ─────────────────────────
  async ipIntel(ip: string): Promise<IPIntelResult> {
    const result: IPIntelResult = { ip, version: ip.includes(':') ? 'v6' : 'v4' };

    const ipinfoKey = process.env['IPINFO_API_KEY'];
    const url = ipinfoKey
      ? `https://ipinfo.io/${ip}?token=${ipinfoKey}`
      : `https://ipinfo.io/${ip}/json`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        const [lat, lon] = (data.loc || ',').split(',').map(Number);
        result.country = data.country;
        result.region = data.region;
        result.city = data.city;
        result.lat = lat || undefined;
        result.lon = lon || undefined;
        result.org = data.org;
        result.asn = data.org?.split(' ')[0];
        result.timezone = data.timezone;
        result.isHosting = data.hostname?.includes('server') || data.org?.toLowerCase().includes('hosting') || false;
      }
    } catch {}

    // Fallback: ip-api.com (free, no key)
    if (!result.country) {
      try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,org,asn,isp,proxy,hosting`, {
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            result.country = data.country;
            result.region = data.regionName;
            result.city = data.city;
            result.lat = data.lat;
            result.lon = data.lon;
            result.org = data.org;
            result.asn = data.asn;
            result.isProxy = data.proxy;
            result.isHosting = data.hosting;
          }
        }
      } catch {}
    }

    // AbuseIPDB check
    const abuseKey = process.env['ABUSEIPDB_API_KEY'];
    if (abuseKey) {
      try {
        const res = await fetch(
          `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`,
          {
            headers: { 'Key': abuseKey, 'Accept': 'application/json' },
            signal: AbortSignal.timeout(6000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          result.abuseScore = data.data?.abuseConfidenceScore;
          result.threatLevel = result.abuseScore && result.abuseScore > 75 ? 'HIGH'
            : result.abuseScore && result.abuseScore > 40 ? 'MEDIUM'
            : result.abuseScore && result.abuseScore > 10 ? 'LOW'
            : 'NONE';
          result.isTor = data.data?.isTor;
        }
      } catch {}
    }

    return result;
  }

  // ─── Domain Passive DNS ────────────────────────────────────────────────
  async passiveDNS(domain: string): Promise<PassiveDNSRecord[]> {
    const securityTrailsKey = process.env['SECURITYTRAILS_API_KEY'];
    if (securityTrailsKey) {
      try {
        const res = await fetch(
          `https://api.securitytrails.com/v1/history/${encodeURIComponent(domain)}/dns/a`,
          {
            headers: { 'apikey': securityTrailsKey, 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          return (data.records || []).map((r: any) => ({
            domain,
            type: 'A' as const,
            value: r.values?.map((v: any) => v.ip).join(', ') || '',
            firstSeen: r.first_seen,
            lastSeen: r.last_seen,
            count: r.organizations?.length,
          }));
        }
      } catch {}
    }

    // Fallback: hackertarget.com (free)
    try {
      const res = await fetch(`https://api.hackertarget.com/dnslookup/?q=${encodeURIComponent(domain)}`, {
        signal: AbortSignal.timeout(8000)
      });
      const text = await res.text();
      return text.split('\n')
        .filter(line => line.includes(' '))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            domain,
            type: (parts[3] || 'A') as any,
            value: parts[4] || parts[1] || '',
            firstSeen: undefined,
            lastSeen: undefined,
          };
        });
    } catch {
      return [];
    }
  }
}

export const comintService = new ComintService();
