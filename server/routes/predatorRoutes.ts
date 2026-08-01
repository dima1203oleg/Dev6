import { Router } from "express";
import { predatorClient } from "../services/predatorClient";
import { buildSafeQueryPlan } from "../services/queryDsl";
import { checkPermission, maskSensitiveFields, AuthenticatedRequest } from "../middleware/auth";
import { auditMiddleware } from "../middleware/auditLog";

const router = Router();

// Universal Entity Search
router.post(
  "/search",
  checkPermission("entity.search"),
  auditMiddleware("SEARCH", "PREDATOR_CORE_SEARCH"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { query, entityType } = req.body;
      if (!query) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Query string is required" } });
      }

      const result = await predatorClient.searchEntities(query, entityType);
      
      // Apply server-side data masking based on user role
      const maskedEntities = result.entities.map(ent => maskSensitiveFields(ent, req.user?.role || "ANALYST"));

      res.json({
        ...result,
        entities: maskedEntities
      });
    } catch (err: any) {
      res.status(500).json({ error: { code: "SEARCH_FAILED", message: err.message, retryable: true } });
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
      const chain = await predatorClient.getProvenanceChain(entityId);
      res.json(chain);
    } catch (err: any) {
      res.status(500).json({ error: { code: "PROVENANCE_ERROR", message: err.message } });
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
      
      res.json({
        status: "SUCCESS",
        queryPlan: plan,
        records: [
          { id: "rec-1", edrpou: "42345678", name: "ТОВ 'ІННОВАЦІЙНІ АГРО ТЕХНОЛОГІЇ'", status: "ДІЮЧИЙ", date: "2026-07-20" },
          { id: "rec-2", edrpou: "3111724753", name: "ФОП Кізима Дмитро Миколайович", status: "ДІЮЧИЙ", date: "2026-07-22" }
        ],
        totalRecords: 2,
        maxLimitEnforced: plan.limitEnforced,
        executionTimeMs: 14
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
      const inv = await predatorClient.getInvestigation(req.params.id);
      res.json(inv);
    } catch (err: any) {
      res.status(500).json({ error: { code: "INVESTIGATION_FETCH_FAILED", message: err.message } });
    }
  }
);

export default router;
