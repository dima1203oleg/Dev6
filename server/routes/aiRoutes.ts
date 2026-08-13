import { Router } from "express";
import { aiRouter } from "../services/aiRouter";
import { checkPermission, AuthenticatedRequest } from "../middleware/auth";
import { auditMiddleware } from "../middleware/auditLog";

const router = Router();

router.post(
  "/execute-task",
  checkPermission("ai.use"),
  auditMiddleware("AI_REQUEST", "AI_ROUTER"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { task, prompt, systemInstruction } = req.body;
      if (!task || !prompt) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Task and prompt are required" } });
      }

      const userRole = req.user?.role || "ANALYST";
      const config = aiRouter.getTaskConfig(task);

      // Verify Tool Permission if task requires privileged tool access
      if (task === "SQL_GENERATION" && !aiRouter.verifyToolPermission("SQL_EXECUTE", userRole)) {
        return res.status(403).json({
          error: { code: "FORBIDDEN", message: `Role '${userRole}' is not allowed to run AI SQL execution` }
        });
      }

      const result = await aiRouter.executeTask(task, prompt, systemInstruction);

      return res.json({
        status: "SUCCESS",
        task: result.task,
        modelUsed: result.modelUsed,
        latencyMs: result.latencyMs,
        privacyLevel: config.privacyLevel,
        text: result.text
      });
    } catch (err: any) {
      return res.status(500).json({ error: { code: "AI_ROUTER_ERROR", message: err.message, retryable: true } });
    }
  }
);

/**
 * 2.1 Intent & Entity Recognition Endpoint
 */
router.post(
  "/classify",
  checkPermission("ai.use"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Query string is required" } });
      }
      const classification = await aiRouter.classifyInput(query);
      return res.json({ status: "SUCCESS", ...classification });
    } catch (err: any) {
      return res.status(500).json({ error: { code: "CLASSIFY_ERROR", message: err.message } });
    }
  }
);

/**
 * 2.2 Function Calling Coordinator Endpoint
 */
router.post(
  "/agent-orchestrate",
  checkPermission("ai.use"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { query, availableTools } = req.body;
      if (!query) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Query is required" } });
      }
      const orchestration = await aiRouter.orchestrateAgent(query, availableTools);
      return res.json({ status: "SUCCESS", ...orchestration });
    } catch (err: any) {
      return res.status(500).json({ error: { code: "ORCHESTRATION_ERROR", message: err.message } });
    }
  }
);

/**
 * 2.3 Graph RAG & Risk Synthesis Endpoint
 */
router.post(
  "/risk-synthesis",
  checkPermission("ai.use"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { entityData } = req.body;
      if (!entityData) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "entityData is required" } });
      }
      const synthesis = await aiRouter.synthesizeRiskReport(entityData);
      return res.json({ status: "SUCCESS", ...synthesis });
    } catch (err: any) {
      return res.status(500).json({ error: { code: "SYNTHESIS_ERROR", message: err.message } });
    }
  }
);

/**
 * 2.4 Multimodal Document Extraction Endpoint
 */
router.post(
  "/extract-document",
  checkPermission("ai.use"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { base64Data, mimeType } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "base64Data is required" } });
      }
      const extraction = await aiRouter.extractDocumentEntities(base64Data, mimeType);
      return res.json({ status: "SUCCESS", ...extraction });
    } catch (err: any) {
      return res.status(500).json({ error: { code: "DOCUMENT_EXTRACTION_ERROR", message: err.message } });
    }
  }
);

/**
 * 2.5 PREDATOR Voice Profile & Google TTS Config Endpoint
 */
router.get(
  "/voice-profile",
  checkPermission("ai.use"),
  async (_req: AuthenticatedRequest, res) => {
    try {
      const { SERVER_PREDATOR_VOICE_PROFILE, buildSystemVoiceInstruction } = await import("../services/predatorVoiceProfile");
      return res.json({
        status: "SUCCESS",
        profile: SERVER_PREDATOR_VOICE_PROFILE,
        systemInstruction: buildSystemVoiceInstruction(),
        recommendedVoices: [
          { model: "gemini-2.5-flash-live", voice: "Charon", language: "uk-UA / en-US", compatibilityScore: 96 },
          { model: "google-cloud-tts", voice: "uk-UA-Wavenet-A", language: "uk-UA", compatibilityScore: 92 },
          { model: "google-cloud-tts", voice: "en-US-Neural2-D", language: "en-US", compatibilityScore: 90 },
          { model: "google-cloud-tts", voice: "uk-UA-Standard-A", language: "uk-UA", compatibilityScore: 85 }
        ]
      });
    } catch (err: any) {
      return res.status(500).json({ error: { code: "VOICE_PROFILE_ERROR", message: err.message } });
    }
  }
);

export default router;

