/**
 * PREDATOR MLIP — TECHINT Service
 * Technical Intelligence: Subdomain enumeration, SSL cert analysis, Web tech fingerprint
 */
import { SubdomainResult, WebTechResult, SSLCertResult } from '../../src/types/mlip';
import { osiService } from './OSIService';

export class TechintService {

  // ─── Subdomain Enumeration ─────────────────────────────────────────────
  async subdomainEnum(domain: string): Promise<SubdomainResult[]> {
    const results: SubdomainResult[] = [];
    const seen = new Set<string>();

    // 1. Certificate Transparency (crt.sh) — most comprehensive
    try {
      const ctEntries = await osiService.ctLogSearch(domain);
      for (const cert of ctEntries) {
        const subs = cert.subjectCN
          .split('\n')
          .flatMap(cn => cn.split(',').map(s => s.trim().replace('*.','')))
          .filter(s => s.endsWith(`.${domain}`) || s === domain);

        for (const sub of subs) {
          if (seen.has(sub)) continue;
          seen.add(sub);
          results.push({
            domain,
            subdomain: sub,
            method: 'CT_LOG',
            discoveredAt: new Date().toISOString(),
          });
        }
      }
    } catch {}

    // 2. HackerTarget subdomain search (free)
    try {
      const res = await fetch(`https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(domain)}`, {
        signal: AbortSignal.timeout(10000)
      });
      const text = await res.text();
      for (const line of text.split('\n')) {
        const [host, ip] = line.split(',');
        if (!host || !host.trim()) continue;
        const sub = host.trim();
        if (!seen.has(sub)) {
          seen.add(sub);
          results.push({
            domain,
            subdomain: sub,
            ip: ip?.trim(),
            method: 'DNS',
            discoveredAt: new Date().toISOString(),
          });
        }
      }
    } catch {}

    // 3. SecurityTrails API (if key available)
    const stKey = process.env.SECURITYTRAILS_API_KEY;
    if (stKey) {
      try {
        const res = await fetch(
          `https://api.securitytrails.com/v1/domain/${encodeURIComponent(domain)}/subdomains?children_only=false`,
          {
            headers: { 'apikey': stKey, 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          for (const sub of (data.subdomains || [])) {
            const full = `${sub}.${domain}`;
            if (!seen.has(full)) {
              seen.add(full);
              results.push({
                domain,
                subdomain: full,
                method: 'CT_LOG',
                discoveredAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch {}
    }

    // Sort by subdomain name
    results.sort((a, b) => a.subdomain.localeCompare(b.subdomain));
    return results;
  }

  // ─── SSL Certificate Analysis ─────────────────────────────────────────
  async sslCertDetails(domain: string): Promise<SSLCertResult> {
    // Use SSL Labs API (free)
    try {
      const res = await fetch(
        `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(domain)}&startNew=on&all=done&ignoreMismatch=on`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'READY' && data.endpoints?.length > 0) {
          return this.parseSslLabsResult(domain, data);
        }
      }
    } catch {}

    // Fallback: crt.sh latest cert
    try {
      const ctEntries = await osiService.ctLogSearch(domain);
      const latest = ctEntries[0];
      if (latest) {
        const validFrom = new Date(latest.notBefore);
        const validTo = new Date(latest.notAfter);
        const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / 86400000);
        return {
          domain,
          subject: latest.subjectCN,
          issuer: latest.issuer,
          serialNumber: latest.serialNumber,
          validFrom: latest.notBefore,
          validTo: latest.notAfter,
          daysRemaining,
          isExpired: daysRemaining < 0,
        };
      }
    } catch {}

    return {
      domain,
      subject: domain,
      issuer: 'Unknown',
      validFrom: '',
      validTo: '',
      daysRemaining: 0,
      isExpired: false,
    };
  }

  private parseSslLabsResult(domain: string, data: any): SSLCertResult {
    const ep = data.endpoints[0];
    const cert = ep?.details?.cert || {};
    const chain = ep?.details?.chain?.certs?.[0] || {};

    const validFrom = cert.notBefore ? new Date(cert.notBefore * 1000).toISOString() : '';
    const validTo = cert.notAfter ? new Date(cert.notAfter * 1000).toISOString() : '';
    const daysRemaining = cert.notAfter
      ? Math.floor((cert.notAfter * 1000 - Date.now()) / 86400000)
      : 0;

    return {
      domain,
      subject: cert.subject || domain,
      issuer: cert.issuerLabel || 'Unknown',
      serialNumber: cert.serialNumber,
      validFrom,
      validTo,
      daysRemaining,
      isExpired: daysRemaining < 0,
      signatureAlgorithm: cert.sigAlg,
      keySize: cert.keySize,
      sans: cert.altNames || [],
      chainValid: ep?.details?.chain?.issues === 0,
      grade: ep?.grade,
    };
  }

  // ─── Web Technology Fingerprinting ────────────────────────────────────
  async webTechFingerprint(url: string): Promise<WebTechResult> {
    const technologies: WebTechResult['technologies'] = [];
    let headers: Record<string, string> = {};
    let server: string | undefined;
    let cms: string | undefined;
    let cdn: string | undefined;

    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PREDATOR-Analytics/1.0)' },
        signal: AbortSignal.timeout(8000),
        redirect: 'follow',
      });
      headers = Object.fromEntries(res.headers.entries());

      // Server detection
      server = headers['server'] || headers['x-powered-by'];
      if (server) technologies.push({ name: server, category: 'Web Server', confidence: 0.9 });

      // CDN detection
      if (headers['cf-ray']) { cdn = 'Cloudflare'; technologies.push({ name: 'Cloudflare', category: 'CDN', confidence: 0.99 }); }
      if (headers['x-amz-cf-id']) { cdn = 'CloudFront'; technologies.push({ name: 'AWS CloudFront', category: 'CDN', confidence: 0.99 }); }
      if (headers['x-cache']?.includes('Varnish')) technologies.push({ name: 'Varnish', category: 'CDN/Cache', confidence: 0.9 });

      // Framework detection
      if (headers['x-powered-by']?.includes('PHP')) technologies.push({ name: 'PHP', category: 'Programming Language', confidence: 0.95 });
      if (headers['x-powered-by']?.includes('Express')) technologies.push({ name: 'Express.js', category: 'Web Framework', confidence: 0.95 });
      if (headers['x-powered-by']?.includes('Next.js')) technologies.push({ name: 'Next.js', category: 'Web Framework', confidence: 0.95 });
      if (headers['x-aspnet-version']) technologies.push({ name: 'ASP.NET', version: headers['x-aspnet-version'], category: 'Web Framework', confidence: 0.99 });

      // Security headers analysis
      const securityHeaders: Record<string, boolean> = {
        'Strict-Transport-Security': 'strict-transport-security' in headers,
        'Content-Security-Policy': 'content-security-policy' in headers,
        'X-Frame-Options': 'x-frame-options' in headers,
        'X-Content-Type-Options': 'x-content-type-options' in headers,
        'Referrer-Policy': 'referrer-policy' in headers,
        'Permissions-Policy': 'permissions-policy' in headers,
      };

      return { url, technologies, headers, server, cdn, cms, securityHeaders };
    } catch (e) {
      return { url, technologies, headers };
    }
  }

  // ─── Port Scan (passive via Shodan / Censys) ──────────────────────────
  async passivePortInfo(ip: string): Promise<{ ports: number[]; services: Record<number, string>; banners?: Record<number, string> }> {
    const shodanKey = process.env.SHODAN_API_KEY;
    if (shodanKey) {
      try {
        const res = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${shodanKey}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          const ports: number[] = data.ports || [];
          const services: Record<number, string> = {};
          const banners: Record<number, string> = {};
          for (const item of (data.data || [])) {
            services[item.port] = item.transport ? `${item._shodan?.module} (${item.transport})` : item._shodan?.module;
            if (item.data) banners[item.port] = item.data.slice(0, 200);
          }
          return { ports, services, banners };
        }
      } catch {}
    }

    // Fallback: hackertarget.com (free)
    try {
      const res = await fetch(`https://api.hackertarget.com/nmap/?q=${ip}`, {
        signal: AbortSignal.timeout(15000)
      });
      const text = await res.text();
      const ports: number[] = [];
      const services: Record<number, string> = {};
      for (const line of text.split('\n')) {
        const match = line.match(/(\d+)\/(tcp|udp)\s+open\s+(\S+)/);
        if (match) {
          const port = parseInt(match[1]);
          ports.push(port);
          services[port] = match[3];
        }
      }
      return { ports, services };
    } catch {
      return { ports: [], services: {} };
    }
  }
}

export const techintService = new TechintService();
