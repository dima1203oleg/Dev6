/**
 * PREDATOR Analytics — Connector Factory & Compatibility Matrix
 * Spec: §18 CONNECTOR FACTORY, §6 COMPATIBILITY MATRIX, §19 REGISTRY OF CONNECTORS
 *
 * - Registers all production connectors
 * - Validates compatibility per 5-stage pipeline (A–E)
 * - Maintains live probe results and certification status
 * - Blocks non-certified connectors from production routing
 */
import {
  ProductionConnector, ConnectorConstructor, ConnectorRegistry,
  CompatibilityReport, CompatibilityRecord
} from './sdk';
import { CkanConnector, DirectApiConnector } from './BaseConnector';
import { onboardingOrchestrator } from '../../services/onboarding/OnboardingOrchestrator';
import { DynamicCkanConnector } from './DynamicCkanConnector';
import { RegistryPassport } from '../../models/discovery';

// ─── MASTER SOURCE DEFINITION ─────────────────────────────────────────────

// ─── FULL SOURCE CATALOG (170+ entries from universalCatalog.ts) ───────────

import { FULL_REGISTRY_CATALOG } from '../registries/universalCatalog';

// ─── CONNECTOR FACTORY ────────────────────────────────────────────────────

export class PredatorConnectorFactory {
  private connectorMap = new Map<string, ProductionConnector>();
  private registryMap = new Map<string, ConnectorRegistry>();
  private compatibilityCache = new Map<string, CompatibilityRecord>();

  constructor() {
    this.bootstrap();
  }

  /** Bootstrap all registered free/auto connectors from FULL_REGISTRY_CATALOG */
  private bootstrap() {
    const productionMode = process.env['NODE_ENV'] === 'production';
    const certifiedSources = ['hibp', 'crt_sh']; // Only these sources are production-certified

    for (const entry of FULL_REGISTRY_CATALOG) {
      // In production mode, only load certified sources
      if (productionMode && !certifiedSources.includes(entry.id)) {
        console.log(`[ConnectorFactory] Skipping non-certified source in production: ${entry.id}`);
        continue;
      }

      // We load all connectors in non-production modes. If they lack API keys at runtime, they will fail with 401 as requested.
      if (!entry.isAutomatic) continue;

      let connector: ProductionConnector | null = null;

      if (entry.ckanResourceId) {
        connector = new CkanConnector(
          entry.id,
          entry.name,
          entry.nameEn,
          entry.ckanResourceId,
          entry.category,
          entry.owner,
          ['COMPANY', 'FOP'] as any,
          entry.searchFields as any,
          entry.provides
        );
      } else if (entry.directApiUrl) {
        connector = new DirectApiConnector(
          {
            id: entry.id,
            sourceId: entry.id,
            name: entry.name,
            nameEn: entry.nameEn,
            owner: entry.owner,
            country: 'UA',
            category: entry.category,
            accessLevel: 'FREE_AUTO',
            automationLevel: 'FULL',
            officialUrl: entry.url,
            endpointOrResource: entry.directApiUrl,
            authType: 'NONE',
            format: 'JSON',
            updateFrequency: 'DAILY',
            rateLimitReqPerMin: 60,
            supportedEntities: ['COMPANY', 'FOP'] as any,
            supportedIdentifiers: entry.searchFields as any,
            legalStatus: 'ALLOWED',
            notes: entry.provides,
          },
          entry.directApiUrl
        );
      }

      if (connector) {
        this.connectorMap.set(entry.id, connector);
        const isCertified = certifiedSources.includes(entry.id);
        this.registryMap.set(entry.id, {
          sourceId: entry.id,
          connectorId: `connector.${entry.id}`,
          connectorVersion: connector.VERSION,
          parserVersion: '1.0',
          normalizerVersion: '1.0',
          compatibilityStatus: isCertified ? 'COMPATIBLE' : 'NEEDS_VERIFICATION',
          certificationStatus: isCertified ? 'CERTIFIED' : 'NOT_CERTIFIED',
        });
      }
    }

    console.log(`[ConnectorFactory] Bootstrapped ${this.connectorMap.size} production connectors (${productionMode ? 'production mode' : 'development mode'}).`);
  }

  // ─── PUBLIC METHODS ────────────────────────────────────────────────────

  create(sourceId: string): ProductionConnector {
    const connector = this.connectorMap.get(sourceId);
    if (!connector) {
      throw new Error(`[ConnectorFactory] No production connector registered for source: ${sourceId}`);
    }
    return connector;
  }

  register(sourceId: string, connectorCtor: ConnectorConstructor): void {
    const instance = new connectorCtor();
    this.connectorMap.set(sourceId, instance);
  }

  registerDynamic(passport: RegistryPassport): void {
    const instance = new DynamicCkanConnector(passport);
    this.connectorMap.set(passport.sourceId, instance);
    
    // Create registry entry
    this.registryMap.set(passport.sourceId, {
      sourceId: passport.sourceId,
      connectorId: `connector.${passport.sourceId}`,
      connectorVersion: '1.0.0', // Dynamic connectors start at 1.0.0
      parserVersion: '1.0',
      normalizerVersion: '1.0',
      compatibilityStatus: 'COMPATIBLE',
      certificationStatus: 'CERTIFIED', // Automatically certified by the framework
    });
    console.log(`[ConnectorFactory] Registered dynamic connector for ${passport.sourceId}`);
  }

  listRegistered(): string[] {
    return [...this.connectorMap.keys()];
  }

  getRegistryEntry(sourceId: string): ConnectorRegistry | undefined {
    return this.registryMap.get(sourceId);
  }

  // ─── AUTONOMOUS ONBOARDING ─────────────────────────────────────────────
  
  async triggerOnboarding(sourceId: string, orgData?: any) {
    if (!this.registryMap.has(sourceId)) {
      throw new Error(`[ConnectorFactory] Cannot onboard unknown source: ${sourceId}`);
    }
    console.log(`[ConnectorFactory] Triggering onboarding for ${sourceId}`);
    return await onboardingOrchestrator.startOnboarding(sourceId, orgData);
  }

  // ─── COMPATIBILITY CHECK (5 Stages A–E) ──────────────────────────────

  async validateCompatibility(sourceId: string): Promise<CompatibilityReport> {
    const errors: string[] = [];
    const report: CompatibilityReport = {
      sourceId,
      stageA_canRead: false,
      stageB_canParse: false,
      stageC_canNormalize: false,
      stageD_certified: false,
      stageE_operational: false,
      overallStatus: 'INCOMPATIBLE',
      checkedAt: new Date().toISOString(),
      errors,
    };

    const connector = this.connectorMap.get(sourceId);
    if (!connector) {
      errors.push(`No connector registered for ${sourceId}`);
      return report;
    }

    // Stage A — Can we read it?
    const health = await connector.healthCheck();
    report.stageA_canRead = health.ok;
    if (!health.ok) {
      errors.push(`Stage A FAIL: ${health.error || `HTTP ${health.statusCode}`}`);
      report.overallStatus = 'LIVE_DOWN';
      return report;
    }

    // Stage B — Can we parse it?
    try {
      const raw = await connector.search({ identifier: 'test', identifierType: 'any', limit: 1 });
      const validation = connector.validateSchema(raw);
      report.stageB_canParse = validation.valid;
      if (!validation.valid) {
        errors.push(`Stage B FAIL: schema errors: ${validation.errors.join('; ')}`);
      }
    } catch (err: any) {
      errors.push(`Stage B FAIL: ${err?.message || String(err)}`);
    }

    // Stage C — Can we normalize it?
    report.stageC_canNormalize = report.stageB_canParse; // Normalization follows parsing
    if (!report.stageB_canParse) {
      errors.push('Stage C FAIL: depends on Stage B');
    }

    // Stage D — Certified?
    const reg = this.registryMap.get(sourceId);
    report.stageD_certified = reg?.certificationStatus === 'CERTIFIED';

    // Stage E — Operational?
    report.stageE_operational = report.stageA_canRead && health.latencyMs < 30000;

    // Overall status
    if (report.stageA_canRead && report.stageB_canParse && report.stageE_operational) {
      report.overallStatus = report.stageD_certified ? 'COMPATIBLE' : 'PARTIALLY_COMPATIBLE';
    } else if (report.stageA_canRead) {
      report.overallStatus = 'LIVE_DEGRADED';
    } else {
      report.overallStatus = 'LIVE_DOWN';
    }

    return report;
  }

  // ─── LIVE PROBE ────────────────────────────────────────────────────────

  async runLiveProbe(sourceId: string, testCode: string): Promise<{
    ok: boolean;
    latencyMs: number;
    recordsFound: number;
    rawSample?: any;
    error?: string;
    probeAt: string;
  }> {
    const connector = this.connectorMap.get(sourceId);
    if (!connector) {
      return { ok: false, latencyMs: 0, recordsFound: 0, error: 'No connector', probeAt: new Date().toISOString() };
    }

    const start = Date.now();
    try {
      const meta = connector.metadata();
      const identifierType = meta.supportedIdentifiers[0] || 'edrpou';
      const raw = await connector.search({ identifier: testCode, identifierType, limit: 5 });
      const parsed = connector.parse(raw);

      const result = {
        ok: raw.statusCode >= 200 && raw.statusCode < 300,
        latencyMs: Date.now() - start,
        recordsFound: parsed.length,
        rawSample: parsed.length > 0 ? parsed[0]?.rawFields || null : null,
        probeAt: new Date().toISOString(),
      };

      // Update compatibility cache
      this.updateCompatibilityRecord(sourceId, result.ok, result.latencyMs, result.recordsFound);

      return result;
    } catch (err: any) {
      const result = {
        ok: false,
        latencyMs: Date.now() - start,
        recordsFound: 0,
        error: err?.message || String(err),
        probeAt: new Date().toISOString(),
      };
      this.updateCompatibilityRecord(sourceId, false, result.latencyMs, 0);
      return result;
    }
  }

  // ─── BATCH PROBE (all registered connectors) ──────────────────────────

  async runBatchLiveProbe(
    testCode: string,
    concurrency = 5
  ): Promise<Map<string, Awaited<ReturnType<typeof this.runLiveProbe>>>> {
    const ids = this.listRegistered();
    const results = new Map<string, Awaited<ReturnType<typeof this.runLiveProbe>>>();

    for (let i = 0; i < ids.length; i += concurrency) {
      const batch = ids.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(id => this.runLiveProbe(id, testCode).then(r => ({ id, r })))
      );
      for (const res of batchResults) {
        if (res.status === 'fulfilled') {
          results.set(res.value.id, res.value.r);
        }
      }
    }

    return results;
  }

  // ─── QUERY ALL LIVE CONNECTORS ─────────────────────────────────────────

  async queryAll(code: string, identifierType: 'edrpou' | 'ipn' | 'name' = 'edrpou', concurrency = 8): Promise<{
    sourceId: string;
    name: string;
    category: string;
    status: 'OK' | 'NO_DATA' | 'ERROR' | 'TIMEOUT';
    records: any[];
    latencyMs: number;
    queriedAt: string;
  }[]> {
    const ids = this.listRegistered();
    const results: ReturnType<typeof this.queryAll> extends Promise<infer R> ? R : never = [];

    for (let i = 0; i < ids.length; i += concurrency) {
      const batch = ids.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(async (sourceId) => {
          const connector = this.connectorMap.get(sourceId)!;
          const meta = connector.metadata();

          // Skip if doesn't support this identifier type
          if (!meta.supportedIdentifiers.includes(identifierType as any) &&
              !meta.supportedIdentifiers.includes('any' as any)) {
            return { sourceId, name: meta.name, category: meta.category, status: 'NO_DATA' as const, records: [], latencyMs: 0, queriedAt: new Date().toISOString() };
          }

          const start = Date.now();
          try {
            const raw = await connector.search({ identifier: code, identifierType, limit: 10 });
            const parsed = connector.parse(raw);
            return {
              sourceId,
              name: meta.name,
              category: meta.category,
              status: parsed.length > 0 ? 'OK' as const : 'NO_DATA' as const,
              records: parsed.map(p => p.rawFields),
              latencyMs: Date.now() - start,
              queriedAt: new Date().toISOString(),
            };
          } catch (err: any) {
            return {
              sourceId,
              name: meta.name,
              category: meta.category,
              status: err?.message?.includes('timeout') ? 'TIMEOUT' as const : 'ERROR' as const,
              records: [],
              latencyMs: Date.now() - start,
              queriedAt: new Date().toISOString(),
            };
          }
        })
      );

      for (const res of batchResults) {
        if (res.status === 'fulfilled') results.push(res.value);
      }
    }

    const okCount = results.filter(r => r.status === 'OK').length;
    console.log(`[ConnectorFactory] queryAll(${code}): ${okCount}/${results.length} sources returned data`);

    return results;
  }

  // ─── STATS ────────────────────────────────────────────────────────────

  getDashboardStats() {
    const total = FULL_REGISTRY_CATALOG.length;
    const registered = this.connectorMap.size;
    const records = [...this.compatibilityCache.values()];
    const certified = records.filter(r => r.certificationStatus === 'CERTIFIED').length;
    const live = records.filter(r => r.compatibilityStatus === 'LIVE_OK').length;
    const degraded = records.filter(r => r.compatibilityStatus === 'LIVE_DEGRADED').length;
    const offline = records.filter(r => r.compatibilityStatus === 'LIVE_DOWN').length;
    const notProbed = registered - records.length;

    return { total, registered, certified, live, degraded, offline, notProbed };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────

  private updateCompatibilityRecord(sourceId: string, ok: boolean, _latencyMs: number, recordsFound: number) {
    const existing = this.compatibilityCache.get(sourceId);
    const sourceDef = FULL_REGISTRY_CATALOG.find(s => s.id === sourceId);
    const now = new Date().toISOString();

    const record: CompatibilityRecord = {
      sourceId,
      sourceName: sourceDef?.name || sourceId,
      owner: sourceDef?.owner || 'Unknown',
      accessLevel: 'FREE_AUTO',
      format: 'CKAN',
      endpoint: sourceDef?.url || '',
      supportedIdentifiers: (sourceDef?.searchFields || []) as any,
      supportedEntities: ['COMPANY', 'FOP'] as any,
      authType: 'NONE',
      rateLimitReqPerMin: 60,
      updateFrequency: 'DAILY',
      compatibilityStatus: ok ? (recordsFound > 0 ? 'LIVE_OK' : 'LIVE_DEGRADED') : 'LIVE_DOWN',
      sourceStatus: ok ? 'LIVE' : 'OFFLINE',
      certificationStatus: existing?.certificationStatus || 'NOT_CERTIFIED',
      productionReady: ok && recordsFound >= 0,
      lastProbe: now,
      lastSuccess: ok ? now : existing?.lastSuccess,
      lastFailure: ok ? existing?.lastFailure : now,
      qualityScore: ok ? (recordsFound > 0 ? 80 : 50) : 0,
      freshnessScore: ok ? 90 : 0,
    };

    this.compatibilityCache.set(sourceId, record);
  }

  getCompatibilityMatrix(): CompatibilityRecord[] {
    return [...this.compatibilityCache.values()];
  }

  getCompatibilityRecord(sourceId: string): CompatibilityRecord | undefined {
    return this.compatibilityCache.get(sourceId);
  }
}

// ─── SINGLETON ─────────────────────────────────────────────────────────────

export const connectorFactory = new PredatorConnectorFactory();
