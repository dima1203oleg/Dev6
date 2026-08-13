import { Router } from "express";
import { predatorClient } from "../services/predatorClient";
import { intelligenceOrchestrator } from "../services/IntelligenceOrchestrator";
import { globalHealthService } from "../services/GlobalHealthService";
import { buildSafeQueryPlan } from "../services/queryDsl";
import { hydraEngine } from "../services/hydraEngine";
import { checkPermission, maskSensitiveFields, AuthenticatedRequest } from "../middleware/auth";
import { auditMiddleware } from "../middleware/auditLog";
import crypto from "crypto";

const router = Router();

// System Health Dashboard
router.get(
  "/health",
  checkPermission("system.health"),
  async (_req, res) => {
    try {
      const health = await globalHealthService.getOverallHealth();
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ error: { code: "HEALTH_CHECK_FAILED", message: err.message } });
    }
  }
);

// PREDATOR HYDRA Cascade Search Planner
router.post(
  "/search-plan",
  checkPermission("entity.search"),
  auditMiddleware("SEARCH", "HYDRA_SEARCH_PLANNER"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { query, entityType } = req.body;
      const plan = hydraEngine.buildSearchPlan(query, entityType);
      res.json(plan);
    } catch (err: any) {
      res.status(500).json({ error: { code: "SEARCH_PLAN_FAILED", message: err.message } });
    }
  }
);

// PREDATOR HYDRA Cryptographic Evidence Ledger
router.get(
  "/evidence-ledger",
  checkPermission("source.read"),
  async (_req: AuthenticatedRequest, res) => {
    try {
      const ledger = hydraEngine.getEvidenceLedger();
      res.json({
        total_entries: ledger.length,
        ledger
      });
    } catch (err: any) {
      res.status(500).json({ error: { code: "LEDGER_FAILED", message: err.message } });
    }
  }
);

// Universal Entity Search
router.post(
  "/search",
  checkPermission("entity.search"),
  auditMiddleware("SEARCH", "PREDATOR_CORE_SEARCH"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { query, entityType } = req.body;
      console.log(`[Search Route] Received query: ${query}, entityType: ${entityType}`);
      
      if (!query) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Query string is required" } });
      }

      const isIpn = /^\d{10}$/.test(query);
      const isEdrpou = /^\d{8}$/.test(query);
      
      if (!isIpn && !isEdrpou) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Query must be a valid IPN (10 digits) or EDRPOU (8 digits)" } });
      }

      const identifiers = isIpn ? { ipn: query } : { edrpou: query };
      const entityId = crypto.randomUUID();
      
      console.log(`[Search Route] Calling intelligenceOrchestrator.buildDossier with entityId: ${entityId}, identifiers:`, identifiers);
      
      // Use IntelligenceOrchestrator directly for real data fetching
      const backendDossier = await intelligenceOrchestrator.buildDossier(entityId, identifiers);
      
      console.log(`[Search Route] Dossier received, entity:`, backendDossier.entity ? backendDossier.entity.canonicalName : 'null');
      
      // Ensure entity exists before proceeding
      if (!backendDossier.entity || backendDossier.entity.canonicalName === 'Unknown Entity') {
        console.warn(`[Search Route] No verified entity found for ${query}`);
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "No entity found for the given query" } });
      }
      
      // Extract structured data from evidence claims
      const edrData = backendDossier.claims.find(c => c.predicate === 'has_edr_data')?.object;
      const courtData = backendDossier.claims.find(c => c.predicate === 'has_court_data')?.object;
      const sanctionsData = backendDossier.claims.find(c => c.predicate === 'has_sanctions_data')?.object;
      const taxData = backendDossier.claims.find(c => c.predicate === 'has_tax_data')?.object;
      const licensesData = backendDossier.claims.find(c => c.predicate === 'has_licenses_data')?.object;

      // Build timeline from all registry events
      const timeline: any[] = [];
      
      // Add EDR registration event
      if (edrData?.registrationDate) {
        timeline.push({
          date: edrData.registrationDate,
          type: 'REGISTRATION',
          description: `Реєстрація ФОП: ${edrData.fullName}`,
          source: 'ЄДР (data.gov.ua)',
          confidence: 1
        });
      }
      
      // Add EDR history events
      if (edrData?.history && Array.isArray(edrData.history)) {
        edrData.history.forEach((event: any) => {
          timeline.push({
            date: event.date,
            type: event.type || 'CHANGE',
            description: event.description || 'Зміна в реєстрі',
            source: 'ЄДР (data.gov.ua)',
            confidence: 1
          });
        });
      }
      
      // Add court case events
      if (courtData?.courtCases && Array.isArray(courtData.courtCases)) {
        courtData.courtCases.forEach((courtCase: any) => {
          timeline.push({
            date: courtCase.date,
            type: 'COURT_CASE',
            description: courtCase.description || `Судова справа №${courtCase.caseNumber}`,
            source: 'ЄДРСР (court.gov.ua)',
            confidence: 1
          });
        });
      }
      
      // Add enforcement events
      if (courtData?.enforcementProceedings && Array.isArray(courtData.enforcementProceedings)) {
        courtData.enforcementProceedings.forEach((enforcement: any) => {
          timeline.push({
            date: enforcement.date,
            type: 'ENFORCEMENT',
            description: enforcement.description || 'Виконавче провадження',
            source: 'ЄДРСР (court.gov.ua)',
            confidence: 1
          });
        });
      }
      
      // Add tax verification event
      if (taxData?.lastVerifiedAt) {
        timeline.push({
          date: taxData.lastVerifiedAt,
          type: 'TAX_VERIFICATION',
          description: 'Перевірка податкових даних',
          source: 'ДПС (tax.gov.ua)',
          confidence: 1
        });
      }
      
      // Add sanctions events
      if (sanctionsData?.rnboSanctions && Array.isArray(sanctionsData.rnboSanctions)) {
        sanctionsData.rnboSanctions.forEach((sanction: any) => {
          timeline.push({
            date: sanction.date,
            type: 'SANCTION',
            description: sanction.description || 'Санкційне обмеження',
            source: 'РНБО (sanctions-t.rnbo.gov.ua)',
            confidence: 1
          });
        });
      }
      
      // Add license events
      if (licensesData?.licenses && Array.isArray(licensesData.licenses)) {
        licensesData.licenses.forEach((license: any) => {
          timeline.push({
            date: license.issueDate || license.date,
            type: 'LICENSE_ISSUED',
            description: `Видача ліцензії: ${license.type || license.description}`,
            source: 'Ліцензійний реєстр (data.gov.ua)',
            confidence: 1
          });
        });
      }
      
      // Sort timeline by date
      timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Build network from backend relationships
      const nodes: any[] = [];
      const links: any[] = [];
      const nodeMap = new Map<string, any>();

      // Add main entity as central node
      const mainNodeId = backendDossier.entity.id || 'main';
      nodeMap.set(mainNodeId, {
        id: mainNodeId,
        label: backendDossier.entity.canonicalName,
        type: backendDossier.entity.type,
        isMain: true
      });
      nodes.push(nodeMap.get(mainNodeId));

      // Add relationship nodes and links
      if (backendDossier.relationships && Array.isArray(backendDossier.relationships)) {
        backendDossier.relationships.forEach((rel: any) => {
          const relatedNodeId = rel.relatedEntity?.id || rel.targetId || `rel-${Math.random()}`;
          
          // Add related entity node if not exists
          if (!nodeMap.has(relatedNodeId)) {
            const relatedNode = {
              id: relatedNodeId,
              label: rel.relatedEntity?.canonicalName || rel.relatedEntity?.name || rel.name || 'Unknown',
              type: rel.relatedEntity?.type || rel.type || 'UNKNOWN',
              isMain: false
            };
            nodeMap.set(relatedNodeId, relatedNode);
            nodes.push(relatedNode);
          }

          // Add link
          links.push({
            source: mainNodeId,
            target: relatedNodeId,
            label: rel.type || rel.relationshipType || 'RELATED',
            strength: rel.strength || rel.confidence || 1
          });
        });
      }

      // Add founders/beneficiaries from EDR data as relationships
      if (edrData?.founders && Array.isArray(edrData.founders)) {
        edrData.founders.forEach((founder: any, idx: number) => {
          const founderId = `founder-${idx}`;
          if (!nodeMap.has(founderId)) {
            const founderNode = {
              id: founderId,
              label: founder.name || founder.fullName || 'Founder',
              type: 'PERSON',
              isMain: false
            };
            nodeMap.set(founderId, founderNode);
            nodes.push(founderNode);
          }
          links.push({
            source: founderId,
            target: mainNodeId,
            label: 'FOUNDER',
            strength: 1
          });
        });
      }

      // Add beneficiaries from EDR data as relationships
      if (edrData?.beneficiaries && Array.isArray(edrData.beneficiaries)) {
        edrData.beneficiaries.forEach((beneficiary: any, idx: number) => {
          const beneficiaryId = `beneficiary-${idx}`;
          if (!nodeMap.has(beneficiaryId)) {
            const beneficiaryNode = {
              id: beneficiaryId,
              label: beneficiary.name || beneficiary.fullName || 'Beneficiary',
              type: 'PERSON',
              isMain: false
            };
            nodeMap.set(beneficiaryId, beneficiaryNode);
            nodes.push(beneficiaryNode);
          }
          links.push({
            source: beneficiaryId,
            target: mainNodeId,
            label: 'BENEFICIARY',
            strength: 1
          });
        });
      }

      // Transform backend IntelligenceDossier to frontend Dossier format
      const frontendDossier = {
        entity: {
          ...backendDossier.entity,
          fullName: backendDossier.entity.canonicalName,
          name: backendDossier.entity.canonicalName
        },
        network: { nodes, links },
        timeline: timeline,
        sources: backendDossier.claims.map(c => ({ id: c.id, name: c.sourceName, status: c.status, reliability: c.confidence })),
        evidence: backendDossier.claims.map(c => ({ id: c.id, sourceName: c.sourceName, confidence: c.confidence, retrievedAt: c.retrievedAt, data: c.object })),
        risk: { score: backendDossier.riskProfile.score, level: backendDossier.riskProfile.level, drivers: backendDossier.riskProfile.drivers.map(d => ({ type: d.factor, severity: d.risk, description: d.factor })) },
        quality: { confidence: backendDossier.dataQuality.completeness, coverage: backendDossier.dataQuality.freshness },
        verification: { status: backendDossier.status, score: backendDossier.identityMatchScore, lastChecked: backendDossier.lastCheckedAt },
        metadata: backendDossier.metadata || {
          mode: "PRODUCTION",
          generatedAt: new Date().toISOString(),
          orchestratorVersion: "1.0.0"
        },
        modules: {
          fop: edrData ? [{
            fullName: edrData.fullName,
            shortName: edrData.shortName,
            status: edrData.status,
            registrationDate: edrData.registrationDate,
            director: edrData.director,
            address: edrData.address,
            kved: edrData.kved,
            kvedDescription: edrData.kvedDescription,
            identifiers: {
              rnokpp: backendDossier.entity.identifiers?.ipn,
              edrpou: edrData.edrpou
            }
          }] : [],
          companies: backendDossier.relationships,
          vehicles: backendDossier.vehicles,
          courts: courtData ? [{
            courtCasesCount: courtData.courtCasesCount,
            courtCases: courtData.courtCases,
            isBankrupt: courtData.isBankrupt,
            activeEnforcementsCount: courtData.activeEnforcementsCount,
            enforcementProceedings: courtData.enforcementProceedings
          }] : [],
          darknet: [],
          sanctions: sanctionsData ? [{
            isSanctionedRnbo: sanctionsData.isSanctionedRnbo,
            rnboSanctions: sanctionsData.rnboSanctions,
            hasRuByIranConnection: sanctionsData.hasRuByIranConnection,
            isMassAddress: sanctionsData.isMassAddress,
            massAddressCount: sanctionsData.massAddressCount,
            isMassPhone: sanctionsData.isMassPhone,
            isMassBeneficiary: sanctionsData.isMassBeneficiary,
            isOffshoreOwner: sanctionsData.isOffshoreOwner,
            offshoreJurisdictions: sanctionsData.offshoreJurisdictions
          }] : [],
          tax: taxData ? [{
            isVatPayer: taxData.isVatPayer,
            vatStatus: taxData.vatStatus,
            isSingleTaxPayer: taxData.isSingleTaxPayer,
            isNonProfit: taxData.isNonProfit,
            hasTaxDebt: taxData.hasTaxDebt,
            debtAmountUah: taxData.debtAmountUah,
            taxInspectionOffice: taxData.taxInspectionOffice,
            lastVerifiedAt: taxData.lastVerifiedAt
          }] : [],
          licenses: licensesData ? [{
            licenses: licensesData.licenses,
            isDiiaCityResident: licensesData.isDiiaCityResident,
            amcuViolationsCount: licensesData.amcuViolationsCount,
            amcuDecisionsSummary: licensesData.amcuDecisionsSummary
          }] : []
        }
      };
      
      // Apply server-side data masking based on user role
      const maskedDossier = {
        ...frontendDossier,
        entity: maskSensitiveFields(frontendDossier.entity, req.user?.role || "ANALYST")
      };

      // Return in format expected by frontend (results array)
      return res.json({
        results: [{
          entity_id: maskedDossier.entity.id,
          entity_type: maskedDossier.entity.type,
          confidence: maskedDossier.entity.confidenceScore / 100,
          data: maskedDossier
        }]
      });
    } catch (err: any) {
      console.error("[Search Error]", err);
      return res.status(500).json({ error: { code: "SEARCH_FAILED", message: err.message, retryable: true } });
    }
  }
);

// Intelligence Dossier Generation
router.post(
  "/dossier",
  checkPermission("entity.read"),
  auditMiddleware("ENTITY_VIEW", "INTELLIGENCE_DOSSIER"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { entityId, identifiers } = req.body;
      if (!entityId || !identifiers) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Entity ID and identifiers are required" } });
      }

      const dossier = await predatorClient.getDossier(entityId, identifiers);
      return res.json(dossier);
    } catch (err: any) {
      return res.status(500).json({ error: { code: "DOSSIER_FAILED", message: err.message } });
    }
  }
);

// Provenance Chain Inspection
router.get(
  "/provenance/:entityId",
  checkPermission("entity.read"),
  auditMiddleware("ENTITY_VIEW", "PROVENANCE_CHAIN"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { entityId } = req.params;
      if (!entityId) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Entity ID is required" } });
      }
      const chain = await predatorClient.getProvenanceChain(entityId);
      return res.json(chain);
    } catch (err: any) {
      return res.status(500).json({ error: { code: "PROVENANCE_ERROR", message: err.message } });
    }
  }
);

// Safe Query DSL Execution (replacing raw SQL)
router.post(
  "/query-dsl",
  checkPermission("source.read"),
  auditMiddleware("QUERY_DSL", "CKAN_QUERY_BUILDER"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const dsl = req.body;
      const plan = buildSafeQueryPlan(dsl);
      
      return res.status(501).json({
        error: {
          code: "QUERY_EXECUTION_NOT_IMPLEMENTED",
          message: "The query plan was validated but no production query executor is configured.",
          retryable: false,
        },
        queryPlan: plan,
      });
    } catch (err: any) {
      res.status(500).json({ error: { code: "QUERY_PLAN_FAILED", message: err.message } });
    }
  }
);

// Investigation Workspace Storage
router.get(
  "/investigations/:id",
  checkPermission("investigation.create"),
  auditMiddleware("INVESTIGATION_VIEW", "INVESTIGATION_WORKSPACE"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const id = req.params['id'];
      if (!id) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Investigation ID is required" } });
      }
      const inv = await predatorClient.getInvestigation(id);
      return res.json(inv);
    } catch (err: any) {
      return res.status(500).json({ error: { code: "INVESTIGATION_FETCH_FAILED", message: err.message } });
    }
  }
);

export default router;
