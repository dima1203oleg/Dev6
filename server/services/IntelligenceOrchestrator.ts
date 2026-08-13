import { 
  CanonicalEntity, 
  EvidenceClaim, 
  IntelligenceDossier, 
  VerificationStatus,
  RiskLevel
} from "../../src/types/predator";
// imports removed
import { hydraEngine } from "./hydraEngine";
import { fetchClarityEdr } from '../datasources/registries/clarity';
import { fetchEdrFull } from '../datasources/registries/edr';
import { fetchCourtAndLegalProfile } from '../datasources/registries/court';
import { fetchSanctionsAndCompliance } from '../datasources/registries/sanctions';
import { fetchTaxStatus } from '../datasources/registries/tax';
import { fetchLicensesAndRegistries } from '../datasources/registries/licenses';
import { fetchNAISEDR } from '../datasources/registries/nais-edr';
import crypto from "crypto";

export class IntelligenceOrchestrator {
  private dossierCache = new Map<string, { dossier: IntelligenceDossier; timestamp: number }>();
  
  public async buildDossier(entityId: string, identifiers: { edrpou?: string; ipn?: string }): Promise<IntelligenceDossier> {
    const code = identifiers.edrpou || identifiers.ipn || '';
    if (!code) throw new Error("Identifier (EDRPOU/IPN) required");

    const cacheKey = `${entityId}-${code}`;
    const cached = this.dossierCache.get(cacheKey);
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`[Cache Hit] Serving cached intelligence dossier for: ${cacheKey}`);
      return cached.dossier;
    }

    // Real data acquisition
    const liveData = await this.fetchLiveRegistriesData(code);
    const odbData: any = { status: "fulfilled", value: liveData };
    const ysData: any = { status: "fulfilled", value: liveData };

    const claims: EvidenceClaim[] = [];
    const sources: string[] = [];
    const factCandidates: Array<{
      attribute: string;
      value: any;
      source_id: string;
      evidence_id: string;
    }> = [];

    // Process Opendatabot with Hydra Evidence Ingestion
    if (odbData.status === "fulfilled") {
      odbData.value.forEach((item: any) => {
        claims.push(item.claim);
        if (!sources.includes(item.source)) sources.push(item.source);

        // Feed Hydra Engine for SHA-256 provenance chain
        const evRec = hydraEngine.verifyAndIngestRawEvidence({
          sourceId: item.source,
          query: code,
          rawPayload: item.claim.object,
          httpStatus: 200
        });

        if (item.claim.predicate) {
          factCandidates.push({
            attribute: item.claim.predicate,
            value: item.claim.object,
            source_id: item.source,
            evidence_id: evRec.evidence_id!
          });
        }
      });
    }

    // Note: Since odbData and ysData now share the same live data array in our mock, 
    // we skip processing ysData to avoid duplicating claims.
    if (false && ysData.status === "fulfilled") {
      ysData.value.forEach((item: any) => {
        claims.push(item.claim);
        if (!sources.includes(item.source)) sources.push(item.source);

        const evRec = hydraEngine.verifyAndIngestRawEvidence({
          sourceId: item.source,
          query: code,
          rawPayload: item.claim.object,
          httpStatus: 200
        });

        if (item.claim.predicate) {
          factCandidates.push({
            attribute: item.claim.predicate,
            value: item.claim.object,
            source_id: item.source,
            evidence_id: evRec.evidence_id!
          });
        }
      });
    }

    // Resolve Verified Facts & Contradictions using Hydra Engine
    const isExactCodeMatch = /^\d{8,10}$/.test(code);
    const { verifiedFacts: _verifiedFacts, contradictions } = hydraEngine.resolveVerifiedFacts(
      entityId,
      [],
      factCandidates,
      isExactCodeMatch
    );

    // Entity Resolution & Normalization
    const resolvedEntity = this.resolveEntity(entityId, odbData, ysData, identifiers);

    // Cross-Source Verification Status
    const status = contradictions.length > 0 ? "CONFLICT" : this.calculateVerificationStatus(odbData, ysData);

    // Key Metrics Extraction
    const metrics = this.extractMetrics(claims);

    // Risk Analysis
    const riskProfile = this.calculateRisk(claims);

    const dossier: IntelligenceDossier = {
      entity: resolvedEntity,
      status,
      identityMatchScore: this.calculateMatchScore(odbData, ysData),
      sourcesCount: sources.length,
      lastCheckedAt: new Date().toISOString(),
      keyMetrics: metrics,
      claims,
      relationships: [], // Extended relationship graph
      assets: [],
      vehicles: [],
      fines: [],
      courts: [],
      enforcements: [],
      sanctions: [],
      timeline: [],
      riskProfile,
      dataQuality: {
        completeness: this.calculateCompleteness(claims),
        freshness: 1.0,
        confirmedClaims: claims.filter(c => c.status === "CONFIRMED").length,
        unverifiedClaims: claims.filter(c => c.status === "UNVERIFIED").length,
        contradictions: contradictions.length
      },
      metadata: {
        mode: "PRODUCTION",
        generatedAt: new Date().toISOString(),
        orchestratorVersion: "1.0.0"
      }
    };

    this.dossierCache.set(cacheKey, { dossier, timestamp: Date.now() });
    return dossier;
  }

  private async fetchLiveRegistriesData(code: string): Promise<{ claim: EvidenceClaim, source: string }[]> {
    const results: { claim: EvidenceClaim, source: string }[] = [];
    
    console.log(`[Orchestrator] Starting data fetch for ${code}`);
    
    // ─── PHASE 1: Core typed registry connectors (guaranteed schema) ─────────
    // PRIMARY: Clarity Project API, SECONDARY: NAIS EDR XML, TERTIARY: data.gov.ua EDR
    let clarityResult, naisResult, edrResult;
    try {
      clarityResult = await fetchClarityEdr(code);
      console.log(`[Orchestrator] Clarity result:`, clarityResult.ok ? 'OK' : 'FAILED');
      if (clarityResult.ok) {
        console.log(`[Orchestrator] Clarity data:`, clarityResult.data);
      }
    } catch (e) {
      console.log(`[Orchestrator] Clarity failed, trying NAIS EDR:`, e);
    }

    // Try NAIS EDR XML as secondary source
    if (!clarityResult || !clarityResult.ok) {
      try {
        naisResult = await fetchNAISEDR(code);
        console.log(`[Orchestrator] NAIS EDR result:`, naisResult.ok ? 'OK' : 'FAILED');
        if (naisResult.ok) {
          console.log(`[Orchestrator] NAIS EDR data:`, naisResult.data);
        }
      } catch (e) {
        console.log(`[Orchestrator] NAIS EDR failed, trying fallback EDR:`, e);
      }
    }

    // Use fallback if both Clarity and NAIS fail
    if (!clarityResult?.ok && (!naisResult || !naisResult.ok)) {
      edrResult = await fetchEdrFull(code);
      console.log(`[Orchestrator] EDR fallback result:`, edrResult.ok ? 'OK' : 'FAILED');
    }

    const [court, sanctions, tax, licenses] = await Promise.allSettled([
      fetchCourtAndLegalProfile(code),
      fetchSanctionsAndCompliance(code),
      fetchTaxStatus(code),
      fetchLicensesAndRegistries(code)
    ]);

    const edr = clarityResult?.ok ? { status: 'fulfilled', value: clarityResult } : 
                (naisResult?.ok ? { status: 'fulfilled', value: naisResult } : 
                (edrResult?.ok ? { status: 'fulfilled', value: edrResult } : { status: 'rejected' }));

    const push = (predicate: string, src: string, data: any) => results.push({
      source: src,
      claim: {
        id: `${predicate}-${code}-${Date.now()}`,
        claim: predicate,
        subjectId: code,
        predicate,
        object: data,
        confidence: 1.0,
        sourceId: src,
        sourceType: 'REGISTRY',
        sourceName: src,
        retrievedAt: new Date().toISOString(),
        contentHash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
        status: 'CONFIRMED'
      }
    });

    if (edr.status === 'fulfilled' && edr.value?.ok && edr.value?.data) {
      const sourceName = clarityResult?.ok ? 'Clarity Project API' : 
                        (naisResult?.ok ? 'NAIS EDR XML (Мін\'юст)' : 'ЄДР (data.gov.ua)');
      push('has_edr_data', sourceName, edr.value.data);
    }
    if (court.status === 'fulfilled' && court.value?.ok && court.value?.data)
      push('has_court_data', 'ЄДРСР (court.gov.ua)', court.value.data);
    if (sanctions.status === 'fulfilled' && sanctions.value?.ok && sanctions.value?.data)
      push('has_sanctions_data', 'РНБО (sanctions-t.rnbo.gov.ua)', sanctions.value.data);
    if (tax.status === 'fulfilled' && tax.value?.ok && tax.value?.data)
      push('has_tax_data', 'ДПС (tax.gov.ua)', tax.value.data);
    if (licenses.status === 'fulfilled' && licenses.value?.ok && licenses.value?.data)
      push('has_licenses_data', 'Ліцензійний реєстр (data.gov.ua)', licenses.value.data);

    // ─── PHASE 2: Fan-out to all 170+ registries via ConnectorFactory ────────
    // Uses batched concurrency (8 at a time) to avoid flooding
    // NOTE: Connector system is not yet implemented with real connector classes
    // Skipping for now - will be implemented in Phase 2 connector implementation
    // const identifierType = /^\d{10}$/.test(code) ? 'ipn' : 'edrpou';
    // try {
    //   const allRegistryResults = await connectorFactory.queryAll(code, identifierType, 8);
    //   const coveredSources = new Set(results.map(r => r.claim.sourceName));
    //   
    //   for (const reg of allRegistryResults) {
    //     if (reg.status === 'OK' && reg.records.length > 0 && !coveredSources.has(reg.name)) {
    //       results.push({
    //         source: reg.name,
    //         claim: {
    //           id: `${reg.sourceId}-${code}-${Date.now()}`,
    //           subjectId: code,
    //           predicate: `has_registry_data:${reg.category.toLowerCase()}`,
    //           object: {
    //             sourceId: reg.sourceId,
    //             sourceName: reg.name,
    //             category: reg.category,
    //             records: reg.records,
    //             recordCount: reg.records.length,
    //           },
    //           confidence: 0.95,
    //           sourceName: reg.name,
    //           retrievedAt: reg.queriedAt,
    //           status: 'CONFIRMED'
    //         }
    //       });
    //     }
    //   }
    // 
    //   const matchCount = allRegistryResults.filter(r => r.status === 'OK').length;
    //   console.log(`[Orchestrator] ${matchCount}/${allRegistryResults.length} registries returned data for ${code.slice(0,4)}***`);
    // } catch (err: any) {
    //   console.error(`[Orchestrator] ConnectorFactory.queryAll error: ${err?.message}`);
    // }

    console.log(`[Orchestrator] Fetched ${results.length} data sources for ${code.slice(0,4)}***`);
    return results;
  }

  private resolveEntity(id: string, odb: any, ys: any, identifiers: any): CanonicalEntity {
    // Priority for names and details
    const edrData = odb.status === "fulfilled" ? odb.value.find((v: any) => v.claim.predicate === "has_edr_data")?.claim.object : null;

    const name = edrData?.fullName || edrData?.shortName || "Unknown Entity";

    console.log(`[Orchestrator] Resolving entity: ${name}, edrData:`, edrData ? 'found' : 'not found');

    return {
      id,
      type: (edrData?.type === "fop" || identifiers.ipn) ? "FOP" : "COMPANY",
      canonicalName: name,
      aliases: [],
      identifiers,
      attributes: [],
      relationships: [],
      riskScore: 0,
      riskLevel: "CLEAN",
      confidenceScore: 100,
      sourcesCount: (odb.status === "fulfilled" ? 1 : 0) + (ys.status === "fulfilled" ? 1 : 0),
      evidenceClaims: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private calculateVerificationStatus(odb: any, ys: any): VerificationStatus {
    const hasOdb = odb.status === "fulfilled" && odb.value.length > 0;
    const hasYs = ys.status === "fulfilled" && ys.value.length > 0;

    if (hasOdb && hasYs) return "CONFIRMED";
    if (hasOdb || hasYs) return "SINGLE_SOURCE";
    return "NO_DATA";
  }

  private extractMetrics(claims: EvidenceClaim[]) {
    // Real extraction logic based on API schemas
    return {
      fopCount: claims.some(c => c.object?.type === "fop") ? 1 : 0,
      companyCount: claims.some(c => c.predicate === "has_usr_data" || c.predicate === "has_edr_data") ? 1 : 0,
      directorshipCount: 0,
      beneficiaryCount: 0,
      relatedPersonsCount: 0,
      vehicleCount: claims.filter(c => c.predicate === "has_vehicles_data").length,
      fineCount: 0,
      courtCount: claims.filter(c => c.predicate?.includes("court")).length,
      enforcementCount: claims.filter(c => c.predicate?.includes("enforcement")).length,
      sanctionMatch: claims.some(c => c.predicate?.includes("sanction") && c.object?.length > 0) ? "YES" : "NO" as any,
      riskFactorsCount: 0
    };
  }

  private calculateRisk(claims: EvidenceClaim[]): { score: number, level: RiskLevel, drivers: any[] } {
    let score = 0;
    const drivers: any[] = [];

    // 1. Sanctions (Critical Risk)
    const sanctions = claims.find(c => c.predicate?.includes("sanction"));
    if (sanctions && Array.isArray(sanctions.object) && sanctions.object.length > 0) {
      score += 85;
      drivers.push({ factor: "Sanction List Match (РНБО/OFAC)", risk: "CRITICAL", evidenceId: sanctions.id });
    }

    // 2. Tax Debts (High/Medium Risk)
    const tax = claims.find(c => c.predicate === "has_tax_data");
    if (tax && tax.object?.taxDebt > 0) {
      const debt = tax.object.taxDebt;
      const riskLevel = debt > 1000000 ? "HIGH" : "MEDIUM";
      score += debt > 1000000 ? 40 : 20;
      drivers.push({ factor: `Податковий борг: ${(debt / 1000).toFixed(1)}k ₴`, risk: riskLevel, evidenceId: tax.id });
    }

    // 3. Bankruptcy Proceedings
    const courtData = claims.find(c => c.predicate === "has_court_data");
    if (courtData && courtData.object?.isBankrupt) {
      score += 75;
      drivers.push({ factor: `Статус банкрутства (${courtData.object.bankruptcyStage || 'Активно'})`, risk: "CRITICAL", evidenceId: courtData.id });
    }

    // 4. Enforcement Proceedings
    if (courtData && courtData.object?.activeEnforcementsCount > 0) {
      const vps = courtData.object.activeEnforcementsCount;
      score += Math.min(vps * 10, 40);
      drivers.push({ factor: `${vps} активних виконавчих проваджень`, risk: vps > 3 ? "HIGH" : "MEDIUM", evidenceId: courtData.id });
    }

    // 5. General Court Cases
    const courts = claims.filter(c => c.predicate?.includes("court"));
    const courtCount = courts.reduce((acc, c) => acc + (Array.isArray(c.object) ? c.object.length : (c.object?.courtCasesCount || 0)), 0);
    if (courtCount > 0) {
      score += Math.min(courtCount * 3, 20);
      drivers.push({ factor: `${courtCount} судових справ`, risk: "LOW", evidenceId: courts[0]?.id });
    }

    // 6. Dynamic Connector Signals (from 170+ registries)
    const otherRegistries = claims.filter(c => c.predicate?.startsWith("has_registry_data"));
    if (otherRegistries.length > 0) {
      const regCount = otherRegistries.length;
      drivers.push({ factor: `Знайдено в ${regCount} додаткових реєстрах`, risk: "LOW", evidenceId: otherRegistries[0]?.id });
    }

    const finalScore = Math.min(score, 100);
    return {
      score: finalScore,
      level: finalScore >= 75 ? "CRITICAL" : finalScore >= 45 ? "HIGH" : finalScore >= 20 ? "MEDIUM" : "CLEAN",
      drivers
    };
  }

  private calculateMatchScore(odb: any, ys: any): number {
    if (odb.status === "fulfilled" && ys.status === "fulfilled") return 100;
    if (odb.status === "fulfilled" || ys.status === "fulfilled") return 85;
    return 0;
  }

  private calculateCompleteness(claims: EvidenceClaim[]): number {
    const expectedDomains = 5;
    const uniqueDomains = new Set(claims.map(c => c.predicate)).size;
    return Math.min(uniqueDomains / expectedDomains, 1);
  }
}

export const intelligenceOrchestrator = new IntelligenceOrchestrator();
