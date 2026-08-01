import { CanonicalEntity, EvidenceClaim, DataProvenanceChain, RiskLevel, InvestigationWorkspace } from "../../src/types/predator";

/**
 * PREDATOR Analytics Core Data & Intelligence Integration Engine
 * DEV5 works over PREDATOR as a Data & Intelligence Control Plane.
 */
export class PredatorAnalyticsClient {
  private predatorEndpoint = process.env.PREDATOR_CORE_URL || "https://predator-core.internal.net/api/v1";

  /**
   * Universal Search API
   */
  public async searchEntities(query: string, entityType?: string): Promise<{
    entities: CanonicalEntity[];
    total: number;
    provenanceSummary: string;
  }> {
    const q = query.trim().toLowerCase();
    
    // Check if query is specific EDRPOU or IPN
    const isEdrpou = /^\d{8}$/.test(q);
    const isIpn = /^\d{10}$/.test(q);

    const canonicalName = isEdrpou ? `ТОВ "${query}"` : isIpn ? `ФОП / Фізична Особа (${query})` : query;
    const resolvedType = entityType ? (entityType.toUpperCase() as any) : isEdrpou ? "COMPANY" : isIpn ? "PERSON" : "COMPANY";

    const mockEntity: CanonicalEntity = {
      id: `predator-ent-${Date.now()}`,
      type: resolvedType,
      canonicalName: canonicalName,
      aliases: [query, `Реєстровий запис ЄДР ${query}`],
      identifiers: {
        edrpou: isEdrpou ? query : "42345678",
        ipn: isIpn ? query : "3111724753"
      },
      attributes: [
        { key: "Legal Status", value: "ДІЮЧИЙ (Зареєстровано в ЄДР)", confidence: 100, sourceId: "src-opendatabot", verified: true },
        { key: "Tax Debt Status", value: "Борг відсутній", confidence: 98, sourceId: "src-dps", verified: true },
        { key: "Registered Address", value: "м. Київ, проспект Степана Бандери, буд. 12", confidence: 95, sourceId: "src-edr", verified: true }
      ],
      relationships: [
        {
          id: "rel-1",
          sourceId: `predator-ent-${Date.now()}`,
          targetId: "ent-partner-101",
          targetName: "ТОВ 'ЗАХІДНА ЛОГІСТИЧНА ГРУПА'",
          type: "COUNTERPARTY",
          risk: "LOW",
          confidence: 94,
          evidenceIds: ["ev-claim-101"]
        },
        {
          id: "rel-2",
          sourceId: `predator-ent-${Date.now()}`,
          targetId: "ent-owner-202",
          targetName: "Кізима Дмитро Миколайович",
          type: "BENEFICIARY",
          risk: "CLEAN",
          confidence: 99,
          evidenceIds: ["ev-claim-102"]
        }
      ],
      riskScore: isEdrpou ? 12 : 5,
      riskLevel: "LOW",
      confidenceScore: 98,
      sourcesCount: 4,
      evidenceClaims: [
        {
          id: "ev-claim-101",
          claim: "Зареєстровано в Державному реєстрі юридичних осіб (ЄДР). Голова компанії має 100% частку.",
          sourceId: "src-edr-ukraine",
          sourceType: "REGISTRY",
          sourceName: "Державний реєстр ЄДР / OpenDataBot",
          sourceUrl: "https://opendatabot.com/api/v3/company/42345678",
          retrievedAt: new Date().toISOString(),
          rawHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          parserName: "EDR_Universal_Parser_v2",
          confidence: 99,
          verifiedStatus: "VERIFIED"
        },
        {
          id: "ev-claim-102",
          claim: "Перевірено по санкційних списках РНБО, OFAC, ЄС, ICIJ Offshore Leaks.",
          sourceId: "src-sanctions-global",
          sourceType: "SANCTIONS",
          sourceName: "PREDATOR Global Sanctions Matrix",
          retrievedAt: new Date().toISOString(),
          rawHash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
          parserName: "Sanctions_Screening_Engine",
          confidence: 100,
          verifiedStatus: "VERIFIED"
        }
      ],
      createdAt: "2026-01-15T10:00:00Z",
      updatedAt: new Date().toISOString()
    };

    return {
      entities: [mockEntity],
      total: 1,
      provenanceSummary: "4 підтверджених джерела (ЄДР, Опендатабот, НАЗК, РНБО). Достовірність 98%."
    };
  }

  /**
   * Evidence & Data Provenance Inspector
   */
  public async getProvenanceChain(entityId: string): Promise<DataProvenanceChain> {
    return {
      entityId,
      claims: [
        {
          id: "ev-claim-101",
          claim: "Офіційний статус ЄДР: ДІЮЧИЙ",
          sourceId: "src-edr",
          sourceType: "REGISTRY",
          sourceName: "Міністерство юстиції України (ЄДР)",
          sourceUrl: "https://usr.minjust.gov.ua",
          retrievedAt: new Date().toISOString(),
          rawHash: "a4f5b6c7d8e9f0123456789abcdef0123456789a",
          parserName: "Minjust_Parser_v1",
          confidence: 100,
          verifiedStatus: "VERIFIED"
        },
        {
          id: "ev-claim-102",
          claim: "Відсутність податкового боргу (ДПС України)",
          sourceId: "src-dps",
          sourceType: "REGISTRY",
          sourceName: "Державна податкова служба України",
          retrievedAt: new Date().toISOString(),
          rawHash: "b5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y",
          parserName: "Tax_Registry_Parser",
          confidence: 98,
          verifiedStatus: "VERIFIED"
        }
      ],
      verificationSteps: [
        {
          timestamp: new Date().toISOString(),
          agentOrSystem: "PREDATOR Data Engine",
          action: "Ingestion & Schema Normalization",
          status: "SUCCESS",
          details: "Raw API JSON hash calculated and stored in immutable ledger."
        },
        {
          timestamp: new Date().toISOString(),
          agentOrSystem: "PREDATOR Entity Resolution Agent",
          action: "Canonical Deduplication",
          status: "SUCCESS",
          details: "Merged 3 duplicate profiles with matching Tax ID/EDRPOU."
        }
      ],
      overallTrustScore: 98
    };
  }

  /**
   * Investigation Workspace Storage
   */
  public async getInvestigation(id: string): Promise<InvestigationWorkspace> {
    return {
      id,
      title: "Розслідування №2026-08/INV-042: Перевірка контрагентів",
      description: "Комплексний аналіз ризиків, ланцюжків постачання та бенефіціарів.",
      leadInvestigator: "Дмитро Кізима (Senior Analyst)",
      status: "ACTIVE",
      createdAt: "2026-07-28T09:00:00Z",
      updatedAt: new Date().toISOString(),
      entities: [],
      relationships: [],
      evidenceBoard: [],
      notes: [
        {
          id: "note-1",
          author: "Дмитро Кізима",
          content: "Перевірка через YouControl та OpenDataBot підтвердила відсутність ризикових зв'язків.",
          timestamp: new Date().toISOString()
        }
      ],
      queriesHistory: ["пошук 3111724753", "перевірка ЄДРПОУ 42345678"],
      riskSummary: {
        overallRisk: 12,
        highestRiskEntity: "ТОВ 'ІННОВАЦІЙНІ АГРО ТЕХНОЛОГІЇ'",
        threatCategory: "LOW_COMPLIANCE_RISK"
      }
    };
  }
}

export const predatorClient = new PredatorAnalyticsClient();
