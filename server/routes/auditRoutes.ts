import { Router } from "express";
import { getAuditLogs } from "../middleware/auditLog";
import { checkPermission } from "../middleware/auth";

const router = Router();

router.get("/logs", checkPermission("user.admin"), (req, res) => {
  const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 100;
  const actionFilter = req.query['action'] as string | undefined;

  const logs = getAuditLogs(limit, actionFilter);
  res.json({
    total: logs.length,
    logs: logs
  });
});

export default router;
