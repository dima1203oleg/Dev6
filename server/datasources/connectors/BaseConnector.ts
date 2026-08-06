/**
 * PREDATOR Analytics — Base Production Connector
 * Implements the ProductionConnector interface.
 * All registry-specific connectors extend this class.
 */
import crypto from 'crypto';
import {
  ProductionConnector, ConnectorMetadata, ConnectorCapabilities,
  HealthResult, AuthResult, QueryInput, RawResponse, ParsedRecord,
  CanonicalRecord, ValidationResult, RequestContext, Evidence,
  IdentifierType, EntityType
} from './sdk';

export abstract class BaseConnector implements ProductionConnector {
  abstract readonly VERSION: string;

  abstract metadata(): ConnectorMetadata;
  abstract capabilities(): ConnectorCapabilities;

  // ─── HEALTH CHECK ────────────────────────────────────────────────────────
  async healthCheck(): Promise<HealthResult> {
    const meta = this.metadata();
    const start = Date.now();
    try {
      const res = await fetch(meta.officialUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      return {
        ok: res.ok || res.status === 405, // 405 = method not allowed but server alive
        latencyMs: Date.now() - start,
        statusCode: res.status,
        checkedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err?.message || String(err),
        checkedAt: new Date().toISOString(),
      };
    }
  }

  // ─── AUTH (NONE by default) ───────────────────────────────────────────────
  async authenticate(): Promise<AuthResult> {
    return { ok: true, method: 'NONE' };
  }

  // ─── SCHEMA VALIDATION ───────────────────────────────────────────────────
  validateSchema(raw: RawResponse): ValidationResult {
    if (!raw.body) {
      return { valid: false, errors: ['Empty response body'], warnings: [] };
    }
    if (typeof raw.body !== 'object') {
      return { valid: false, errors: ['Response body is not an object'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  }

  // ─── EVIDENCE BUILDER ─────────────────────────────────────────────────────
  buildEvidence(ctx: RequestContext, raw: RawResponse): Evidence {
    return {
      evidenceId: crypto.randomUUID(),
      sourceId: ctx.sourceId,
      recordId: raw.requestHash,
      requestHash: raw.requestHash,
      responseHash: raw.responseHash,
      retrievedAt: raw.retrievedAt,
      parserVersion: '1.0',
      connectorVersion: this.VERSION,
      fieldMapping: {},
    };
  }

  // ─── FETCH HELPER ─────────────────────────────────────────────────────────
  protected async doFetch(
    url: string,
    options: RequestInit = {},
    timeoutMs = 15000
  ): Promise<RawResponse> {
    const requestHash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
    const start = Date.now();

    const authHeaders: Record<string, string> = {};
    const sourceId = this.metadata().id;
    
    // Inject API keys based on real registry integration requirements
    if (sourceId.startsWith('ua.edr') || sourceId.startsWith('ua.court')) {
      if (process.env.NAIS_API_KEY) authHeaders['Authorization'] = `Bearer ${process.env.NAIS_API_KEY}`;
    } else if (sourceId.startsWith('ua.tax')) {
      if (process.env.TAX_GOV_API_KEY) authHeaders['X-API-KEY'] = process.env.TAX_GOV_API_KEY;
    } else if (sourceId.startsWith('ua.nazk')) {
      if (process.env.NAZK_API_TOKEN) authHeaders['Authorization'] = `Bearer ${process.env.NAZK_API_TOKEN}`;
    } else if (sourceId.startsWith('ua.prozorro')) {
      if (process.env.PROZORRO_API_KEY) authHeaders['Authorization'] = `Bearer ${process.env.PROZORRO_API_KEY}`;
    }

    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': 'PREDATOR-Analytics/1.0 (production connector)',
        'Accept': 'application/json',
        ...authHeaders,
        ...(options.headers || {}),
      },
    });

    const bodyText = await res.text();
    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = bodyText;
    }

    const responseHash = crypto.createHash('sha256').update(bodyText).digest('hex').slice(0, 16);

    const rawResponse: RawResponse = {
      sourceId: this.metadata().id,
      requestUrl: url,
      requestHash,
      responseHash,
      statusCode: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body,
      retrievedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };

    if (!res.ok) {
      throw {
        code: 'UPSTREAM_FAILURE',
        message: `HTTP ${res.status} from ${this.metadata().name}`,
        rawResponse,
      };
    }

    return rawResponse;
  }

  // ─── DEFAULT IMPLEMENTATIONS ──────────────────────────────────────────────
  async fetch(_recordId: string): Promise<RawResponse> {
    throw new Error(`fetch() not implemented by ${this.metadata().id}`);
  }

  parse(_raw: RawResponse): ParsedRecord[] {
    return [];
  }

  normalize(_parsed: ParsedRecord[]): CanonicalRecord[] {
    return [];
  }

  async search(_query: QueryInput): Promise<RawResponse> {
    throw new Error(`search() not implemented by ${this.metadata().id}`);
  }
}

// ─── UNIVERSAL CKAN CONNECTOR ──────────────────────────────────────────────

export class CkanConnector extends BaseConnector {
  readonly VERSION = '1.0.0';
  private readonly resourceId: string;
  private readonly meta: ConnectorMetadata;
  private readonly entities: EntityType[];

  constructor(
    sourceId: string,
    name: string,
    nameEn: string,
    resourceId: string,
    category: string,
    owner: string,
    entities: EntityType[],
    identifiers: IdentifierType[],
    provides: string
  ) {
    super();
    this.resourceId = resourceId;
    this.entities = entities;
    this.meta = {
      id: sourceId,
      sourceId,
      name,
      nameEn,
      owner,
      country: 'UA',
      category,
      accessLevel: 'FREE_AUTO',
      automationLevel: 'FULL',
      officialUrl: 'https://data.gov.ua',
      endpointOrResource: `https://data.gov.ua/api/3/action/datastore_search?resource_id=${resourceId}`,
      authType: 'NONE',
      format: 'CKAN',
      updateFrequency: 'DAILY',
      rateLimitReqPerMin: 60,
      supportedEntities: entities,
      supportedIdentifiers: identifiers,
      legalStatus: 'ALLOWED',
      notes: provides,
    };
  }

  metadata(): ConnectorMetadata { return this.meta; }

  capabilities(): ConnectorCapabilities {
    return {
      canSearch: true, canFetch: false, canPaginate: true,
      canFilter: true, canBulkDownload: true,
      supportsIncrementalUpdate: false, supportsHistory: false,
      maxResultsPerPage: 100,
    };
  }

  async search(query: QueryInput): Promise<RawResponse> {
    const url = `https://data.gov.ua/api/3/action/datastore_search?resource_id=${this.resourceId}&q=${encodeURIComponent(query.identifier)}&limit=${query.limit || 50}`;
    return this.doFetch(url);
  }

  validateSchema(raw: RawResponse): ValidationResult {
    const body = raw.body;
    if (!body?.success) {
      return { valid: false, errors: ['CKAN response: success=false'], warnings: [] };
    }
    if (!Array.isArray(body?.result?.records)) {
      return { valid: false, errors: ['CKAN response: result.records not an array'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  }

  parse(raw: RawResponse): ParsedRecord[] {
    if (!raw.body?.result?.records) return [];
    return (raw.body.result.records as any[]).map((rec, i) => ({
      sourceId: this.meta.id,
      recordId: `${raw.requestHash}-${i}`,
      entityType: this.entities[0] || 'COMPANY',
      rawFields: rec,
      parsedAt: new Date().toISOString(),
    }));
  }

  normalize(parsed: ParsedRecord[]): CanonicalRecord[] {
    return parsed.map(p => ({
      ...p,
      canonicalFields: p.rawFields,
      normalizedAt: new Date().toISOString(),
    }));
  }
}

// ─── DIRECT API CONNECTOR ──────────────────────────────────────────────────

export class DirectApiConnector extends BaseConnector {
  readonly VERSION = '1.0.0';
  private readonly apiUrl: string;
  private readonly meta: ConnectorMetadata;

  constructor(meta: ConnectorMetadata, apiUrl: string) {
    super();
    this.meta = meta;
    this.apiUrl = apiUrl;
  }

  metadata(): ConnectorMetadata { return this.meta; }

  capabilities(): ConnectorCapabilities {
    return {
      canSearch: true, canFetch: false, canPaginate: false,
      canFilter: false, canBulkDownload: false,
      supportsIncrementalUpdate: false, supportsHistory: false,
      maxResultsPerPage: 50,
    };
  }

  async search(query: QueryInput): Promise<RawResponse> {
    const url = `${this.apiUrl}${encodeURIComponent(query.identifier)}`;
    return this.doFetch(url);
  }
}
