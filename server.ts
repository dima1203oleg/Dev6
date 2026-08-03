import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import dotenv from "dotenv";
import dataRoutes from "./server/routes/dataRoutes";
import { createRateLimiter } from "./server/middleware/rateLimiter";
import { GoogleGenAI } from "@google/genai";
import { config as opendatabotConfig } from "./server/services/opendatabot/config";
import { queryOpendatabot } from "./server/services/opendatabot";
import { config as youscoreConfig } from "./server/services/youscore/config";
import { queryYouScore } from "./server/services/youscore";

dotenv.config();

export const app = express();
const port = Number(process.env.PORT ?? 3000);
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "10mb" }));
app.use("/api/", createRateLimiter(200, 60000));
app.use("/api/v1/data", dataRoutes);

const unavailable = (res: express.Response, envVar: string, sourceUrl: string): void => {
  res.status(503).json({
    ok: false,
    error: {
      code: "credentials_missing",
      message: `Налаштуйте ${envVar} на сервері`,
      sourceUrl,
      attemptedAt: new Date().toISOString(),
    },
  });
};

app.post("/api/chatbot", async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    unavailable(res, "GEMINI_API_KEY", "https://generativelanguage.googleapis.com");
    return;
  }
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: typeof req.body.prompt === "string" ? req.body.prompt : "",
    });
    res.json({
      ok: true,
      data: { text: response.text },
      provenance: {
        source: "gemini",
        sourceName: "Google Gemini",
        sourceUrl: "https://generativelanguage.googleapis.com",
        fetchedAt: new Date().toISOString(),
        cached: false,
        stale: false,
      },
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: {
        code: "source_unavailable",
        message: error instanceof Error ? error.message : "Gemini request failed",
        sourceUrl: "https://generativelanguage.googleapis.com",
        attemptedAt: new Date().toISOString(),
      },
    });
  }
});

app.post("/api/media-forensics", async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    unavailable(res, "GEMINI_API_KEY", "https://generativelanguage.googleapis.com");
    return;
  }
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: typeof req.body.prompt === "string" ? req.body.prompt : "Analyze the supplied media.",
    });
    res.json({
      ok: true,
      data: { text: response.text },
      provenance: {
        source: "gemini",
        sourceName: "Google Gemini",
        sourceUrl: "https://generativelanguage.googleapis.com",
        fetchedAt: new Date().toISOString(),
        cached: false,
        stale: false,
      },
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: {
        code: "source_unavailable",
        message: error instanceof Error ? error.message : "Gemini request failed",
        sourceUrl: "https://generativelanguage.googleapis.com",
        attemptedAt: new Date().toISOString(),
      },
    });
  }
});

app.get("/api/opendatabot/search", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!opendatabotConfig.OPENDATABOT_API_KEY) {
    unavailable(res, "OPENDATABOT_API_KEY", opendatabotConfig.OPENDATABOT_BASE_URL);
    return;
  }
  try {
    res.json({
      ok: true,
      data: await queryOpendatabot("edr", query),
      provenance: {
        source: "opendatabot",
        sourceName: "Opendatabot",
        sourceUrl: opendatabotConfig.OPENDATABOT_BASE_URL,
        fetchedAt: new Date().toISOString(),
        cached: false,
        stale: false,
      },
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: {
        code: "source_unavailable",
        message: error instanceof Error ? error.message : "Opendatabot request failed",
        sourceUrl: opendatabotConfig.OPENDATABOT_BASE_URL,
        attemptedAt: new Date().toISOString(),
      },
    });
  }
});

app.get("/api/youscore/query", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!youscoreConfig.YOUSCORE_API_KEY) {
    unavailable(res, "YOUSCORE_API_KEY", youscoreConfig.YOUSCORE_BASE_URL);
    return;
  }
  try {
    res.json({
      ok: true,
      data: await queryYouScore("usr", query),
      provenance: {
        source: "youscore",
        sourceName: "YouScore / YouControl",
        sourceUrl: youscoreConfig.YOUSCORE_BASE_URL,
        fetchedAt: new Date().toISOString(),
        cached: false,
        stale: false,
      },
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: {
        code: "source_unavailable",
        message: error instanceof Error ? error.message : "YouScore request failed",
        sourceUrl: youscoreConfig.YOUSCORE_BASE_URL,
        attemptedAt: new Date().toISOString(),
      },
    });
  }
});

app.get("/api/v1/connectors/health", (_req, res) => {
  res.redirect(307, "/api/v1/data/sources");
});
app.get("/api/v1/predator/health", (_req, res) => {
  res.redirect(307, "/api/v1/data/sources");
});
app.post("/api/v2/intelligence/search", (_req, res) => {
  unavailable(res, "entity profile route", "/api/v1/data/entity/profile");
});
app.post("/api/v1/entities/search", (_req, res) => {
  unavailable(res, "entity profile route", "/api/v1/data/entity/profile");
});

app.get("/liveness", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/readiness", (_req, res) => {
  res.json({ status: "ready" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const start = async (): Promise<void> => {
  if (!isProduction && !isTest) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!isTest) {
    const server = createServer(app);
    server.listen(port, "0.0.0.0", () => {
      console.log(`Predator Analytics listening on port ${port}`);
    });
  }
};

void start();
