import { Router } from "express";
import { mediaPipeline } from "../services/mediaPipeline";
import { checkPermission } from "../middleware/auth";
import { auditMiddleware } from "../middleware/auditLog";

const router = Router();

// Presigned Upload creation
router.post(
  "/presign",
  checkPermission("entity.read"),
  auditMiddleware("MEDIA_UPLOAD_PRESIGN", "MINIO_OBJECT_STORE"),
  (req, res) => {
    try {
      const { filename, mimeType, sizeBytes } = req.body;
      if (!filename || !mimeType) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "filename and mimeType required" } });
      }

      const job = mediaPipeline.createPresignedUpload(filename, mimeType, sizeBytes || 1024);
      res.json(job);
    } catch (err: any) {
      res.status(500).json({ error: { code: "MEDIA_PRESIGN_ERROR", message: err.message } });
    }
  },
);

// Trigger Async Processing Pipeline
router.post(
  "/process/:jobId",
  checkPermission("entity.read"),
  auditMiddleware("MEDIA_PROCESS_TRIGGER", "MEDIA_PIPELINE"),
  async (req, res) => {
    try {
      const job = await mediaPipeline.processMediaAsync(req.params.jobId);
      res.json(job);
    } catch (err: any) {
      res.status(500).json({ error: { code: "MEDIA_PROCESS_ERROR", message: err.message } });
    }
  },
);

// Job Status Polling
router.get("/status/:jobId", checkPermission("entity.read"), (req, res) => {
  const job = mediaPipeline.getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Media job not found" } });
  }
  res.json(job);
});

export default router;
