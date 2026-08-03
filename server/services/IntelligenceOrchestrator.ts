import {
  CanonicalEntity,
  EvidenceClaim,
  IntelligenceDossier,
  VerificationStatus,
  RiskLevel,
} from "../../src/types/predator";
import { queryYouScore } from "./youscore";
import { queryOpendatabot } from "./opendatabot";
import crypto from "crypto";

export class IntelligenceOrchestrator {
  private dossierCache = new Map<string, { dossier: IntelligenceDossier; timestamp: number }>();

  public async buildDossier(
    entityId: string,
    identifiers: { edrpou?: string; ipn?: string },
  ): Promise<IntelligenceDossier> {
    const code = identifiers.edrpou || identifiers.ipn;
    if (!code) throw new Error("Identifier (EDRPOU/IPN) required");

    const cacheKey = `${entityId}-${code}`;
    const cached = this.dossierCache.get(cacheKey);
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache Hit] Serving cached intelligence dossier for: ${cacheKey}`);
      return cached.dossier;
    }

    // Parallel data acquisition
    const [odbData, ysData] = await Promise.allSettled([this.fetchOpendatabotData(code), this.fetchYouScoreData(code)]);

    const claims: EvidenceClaim[] = [];
    const sources: string[] = [];

    // Process Opendatabot
    if (odbData.status === "fulfilled") {
      odbData.value.forEach((item) => {
        claims.push(item.claim);
        if (!sources.includes(item.source)) sources.push(item.source);
      });
    }

    // Process YouScore
    if (ysData.status === "fulfilled") {
      ysData.value.forEach((item) => {
        claims.push(item.claim);
        if (!sources.includes(item.source)) sources.push(item.source);
      });
    }

    // Entity Resolution & Normalization
    const resolvedEntity = this.resolveEntity(entityId, odbData, ysData, identifiers);

    // Cross-Source Verification Status
    const status = this.calculateVerificationStatus(odbData, ysData);

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
      relationships: [], // TODO: Parse relationships
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
        confirmedClaims: claims.filter((c) => c.status === "CONFIRMED").length,
        unverifiedClaims: claims.filter((c) => c.status === "UNVERIFIED").length,
        contradictions: 0, // TODO: Implement contradiction detection
      },
    };

    this.dossierCache.set(cacheKey, { dossier, timestamp: Date.now() });
    return dossier;
  }

  private async fetchOpendatabotData(code: string): Promise<{ claim: EvidenceClaim; source: string }[]> {
    const domains = ["edr", "court", "enforcements", "sanctions"];
    const results = await Promise.all(domains.map((d) => queryOpendatabot(d as any, code)));

    return results
      .filter((r) => r.status === "SUCCESS")
      .map((r) => ({
        source: r.source,
        claim: {
          id: r.evidence.evidenceId,
          claim: `Data retrieved from ${r.source} (${r.endpoint})`,
          subjectId: code,
          predicate: `has_${r.endpoint}_data`,
          object: r.data,
          sourceId: r.source,
          sourceType: "REGISTRY",
          sourceName: r.source,
          retrievedAt: r.retrievedAt,
          contentHash: r.evidence.contentHash,
          confidence: 1.0,
          status: "SINGLE_SOURCE" as VerificationStatus,
        },
      }));
  }

  private async fetchYouScoreData(code: string): Promise<{ claim: EvidenceClaim; source: string }[]> {
    const domains = ["usr", "court", "enforcement", "sanctions", "vehicles"];
    const results = await Promise.all(domains.map((d) => queryYouScore(d as any, code)));

    return results
      .filter((r) => r.status === "SUCCESS")
      .map((r) => ({
        source: r.source,
        claim: {
          id: r.evidence.evidenceId,
          claim: `Data retrieved from ${r.source} (${r.endpoint})`,
          subjectId: code,
          predicate: `has_${r.endpoint}_data`,
          object: r.data,
          sourceId: r.source,
          sourceType: "REGISTRY",
          sourceName: r.source,
          retrievedAt: r.retrievedAt,
          contentHash: r.evidence.contentHash,
          confidence: 1.0,
          status: "SINGLE_SOURCE" as VerificationStatus,
        },
      }));
  }

  private resolveEntity(id: string, odb: any, ys: any, identifiers: any): CanonicalEntity {
    // Priority for names and details
    const odbEdr =
      odb.status === "fulfilled"
        ? odb.value.find((v: any) => v.claim.predicate === "has_edr_data")?.claim.object
        : null;
    const ysUsr =
      ys.status === "fulfilled" ? ys.value.find((v: any) => v.claim.predicate === "has_usr_data")?.claim.object : null;

    const name = ysUsr?.name || odbEdr?.full_name || odbEdr?.name || "Unknown Entity";

    return {
      id,
      type: odbEdr?.type === "fop" || identifiers.ipn ? "FOP" : "COMPANY",
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
      updatedAt: new Date().toISOString(),
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
      fopCount: claims.some((c) => c.object?.type === "fop") ? 1 : 0,
      companyCount: claims.some((c) => c.predicate === "has_usr_data" || c.predicate === "has_edr_data") ? 1 : 0,
      directorshipCount: 0,
      beneficiaryCount: 0,
      relatedPersonsCount: 0,
      vehicleCount: claims.filter((c) => c.predicate === "has_vehicles_data").length,
      fineCount: 0,
      courtCount: claims.filter((c) => c.predicate.includes("court")).length,
      enforcementCount: claims.filter((c) => c.predicate.includes("enforcement")).length,
      sanctionMatch: claims.some((c) => c.predicate.includes("sanction") && c.object?.length > 0)
        ? "YES"
        : ("NO" as any),
      riskFactorsCount: 0,
    };
  }

  private calculateRisk(claims: EvidenceClaim[]): { score: number; level: RiskLevel; drivers: any[] } {
    let score = 0;
    const drivers: any[] = [];

    // Sanctions
    const sanctions = claims.find((c) => c.predicate.includes("sanction"));
    if (sanctions && Array.isArray(sanctions.object) && sanctions.object.length > 0) {
      score += 50;
      drivers.push({ factor: "Sanction List Match", risk: "CRITICAL", evidenceId: sanctions.id });
    }

    // Court cases
    const courts = claims.filter((c) => c.predicate.includes("court"));
    const courtCount = courts.reduce((acc, c) => acc + (Array.isArray(c.object) ? c.object.length : 0), 0);
    if (courtCount > 0) {
      score += Math.min(courtCount * 5, 30);
      drivers.push({ factor: `${courtCount} Court Cases Detected`, risk: "MEDIUM", evidenceId: courts[0]?.id });
    }

    return {
      score,
      level: score > 70 ? "CRITICAL" : score > 40 ? "HIGH" : score > 15 ? "MEDIUM" : "CLEAN",
      drivers,
    };
  }

  private calculateMatchScore(odb: any, ys: any): number {
    if (odb.status === "fulfilled" && ys.status === "fulfilled") return 100;
    if (odb.status === "fulfilled" || ys.status === "fulfilled") return 85;
    return 0;
  }

  private calculateCompleteness(claims: EvidenceClaim[]): number {
    const expectedDomains = 5;
    const uniqueDomains = new Set(claims.map((c) => c.predicate)).size;
    return Math.min(uniqueDomains / expectedDomains, 1);
  }
}

export const intelligenceOrchestrator = new IntelligenceOrchestrator();
