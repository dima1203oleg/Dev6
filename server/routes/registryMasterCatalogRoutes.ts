import { Router } from "express";
import {
  MASTER_REGISTRY_CATALOG,
  ENTITY_COVERAGE_MATRIX,
  COMPETITOR_EVIDENCE_TABLE,
  PRODUCTION_PREFLIGHT_CHECKLIST
} from "../../src/data/masterRegistryCatalogData";

const router = Router();

// Full System Master Sources List (177 Registries)
router.get(["/system/sources", "/sources"], (_req, res) => {
  const now = new Date().toISOString();

  const healthyCount = MASTER_REGISTRY_CATALOG.filter(s => s.status === "HEALTHY").length;
  const candidateCount = MASTER_REGISTRY_CATALOG.filter(s => s.status === "CANDIDATE").length;
  const degradedCount = MASTER_REGISTRY_CATALOG.filter(s => s.status === "DEGRADED").length;

  const contourA = MASTER_REGISTRY_CATALOG.filter(s => s.contour === "A").length;
  const contourB = MASTER_REGISTRY_CATALOG.filter(s => s.contour === "B").length;
  const contourC = MASTER_REGISTRY_CATALOG.filter(s => s.contour === "C").length;
  const contourD = MASTER_REGISTRY_CATALOG.filter(s => s.contour === "D").length;

  const autoIntegrateCount = MASTER_REGISTRY_CATALOG.filter(s => s.automaticAction === "AUTO-INTEGRATE").length;
  const researchCount = MASTER_REGISTRY_CATALOG.filter(s => s.automaticAction === "RESEARCH/INTEGRATE").length;
  const humanGateCount = MASTER_REGISTRY_CATALOG.filter(s => s.automaticAction === "HUMAN GATE").length;
  const fallbackCount = MASTER_REGISTRY_CATALOG.filter(s => s.automaticAction === "FALLBACK").length;
  const legalReviewCount = MASTER_REGISTRY_CATALOG.filter(s => s.automaticAction === "LEGAL REVIEW").length;

  const totalRecordsEstimated = MASTER_REGISTRY_CATALOG.reduce((acc, curr) => acc + (curr.recordsCountEstimate || 0), 0);

  res.json({
    ok: true,
    specificationVersion: "05.08.2026 Verification Edition",
    totalCount: MASTER_REGISTRY_CATALOG.length,
    totalRecordsEstimated,
    stats: {
      healthyCount,
      candidateCount,
      degradedCount,
      contours: {
        A: contourA,
        B: contourB,
        C: contourC,
        D: contourD
      },
      decisionActions: {
        autoIntegrate: autoIntegrateCount,
        researchIntegrate: researchCount,
        humanGate: humanGateCount,
        fallback: fallbackCount,
        legalReview: legalReviewCount
      }
    },
    sources: MASTER_REGISTRY_CATALOG.map(item => ({
      ...item,
      lastSuccessAt: item.status === "HEALTHY" ? now : null,
      lastAttemptAt: now,
      enabled: item.status !== "DISABLED"
    }))
  });
});

// Priority Matrix & Formula Evaluator
router.get("/matrix", (_req, res) => {
  res.json({
    ok: true,
    formula: "Priority Score = BV + CA + AUT + FREE + DU + EC - IC - LR - COST",
    entityCoverage: ENTITY_COVERAGE_MATRIX,
    decisionThresholds: [
      { condition: "Score >= 22 & FREE_AUTO/A0", action: "AUTO-INTEGRATE", description: "Машина підключає та регулярно оновлює в найближчому спринті." },
      { condition: "Score 18-21 або сильна унікальність", action: "RESEARCH/INTEGRATE", description: "Технічний proof-of-concept та дослідницьке підключення." },
      { condition: "FREE_WITH_APPROVAL / A3", action: "HUMAN GATE", description: "Юридичний/організаційний крок людина отримує доступ, далі машина." },
      { condition: "PAID_API / PAID_DATA", action: "FALLBACK", description: "Окремий бюджет/договір; не блокувати основний pipeline." },
      { condition: "RESTRICTED", action: "LEGAL REVIEW", description: "Не підключати без юридичного дозволу спеціальної правової підстави." }
    ]
  });
});

// Contours Breakdown
router.get("/contours", (_req, res) => {
  const contourA = MASTER_REGISTRY_CATALOG.filter(s => s.contour === "A");
  const contourB = MASTER_REGISTRY_CATALOG.filter(s => s.contour === "B");
  const contourC = MASTER_REGISTRY_CATALOG.filter(s => s.contour === "C");
  const contourD = MASTER_REGISTRY_CATALOG.filter(s => s.contour === "D");

  res.json({
    ok: true,
    contours: [
      { id: "A", name: "Перший контур: Державні / Українські реєстри", count: contourA.length, rule: "Open Data, API, реєстри, державні портали", items: contourA },
      { id: "B", name: "Другий контур: Міжнародні джерела", count: contourB.length, rule: "Санкції, LEI, корпоративні реєстри, trade, IP, maritime", items: contourB },
      { id: "C", name: "Третій контур: Legal OSINT / Cyber Intelligence", count: contourC.length, rule: "RDAP, passive DNS, URLScan, інфраструктурні зв'язки; лише законні джерела", items: contourC },
      { id: "D", name: "Fallback контур: Restricted / Paid", count: contourD.length, rule: "Платні API та спеціальний доступ; не змішувати з безкоштовним ядром", items: contourD }
    ]
  });
});

// Competitor Evidence Table
router.get("/competitors", (_req, res) => {
  res.json({
    ok: true,
    evidenceTable: COMPETITOR_EVIDENCE_TABLE
  });
});

// Production Pre-flight Checklist
router.get("/preflight", (_req, res) => {
  res.json({
    ok: true,
    checklist: PRODUCTION_PREFLIGHT_CHECKLIST
  });
});

import fs from "fs";
import path from "path";

// Master Test Report
router.get("/master-test-report", (_req, res) => {
  try {
    const reportPath = path.join(process.cwd(), 'server', 'tests', 'correctness', 'MasterTestReport.json');
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ ok: false, error: "Master Test Report not found. Run tests first." });
    }
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    return res.json({
      ok: true,
      report: reportData
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
