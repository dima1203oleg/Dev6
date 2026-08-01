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

      res.json({
        status: "SUCCESS",
        task: result.task,
        modelUsed: result.modelUsed,
        latencyMs: result.latencyMs,
        privacyLevel: config.privacyLevel,
        text: result.text
      });
    } catch (err: any) {
      res.status(500).json({ error: { code: "AI_ROUTER_ERROR", message: err.message, retryable: true } });
    }
  }
);

export default router;
