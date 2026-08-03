import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import dotenv from "dotenv";
import dataRoutes from "./server/routes/dataRoutes";
import { createRateLimiter } from "./server/middleware/rateLimiter";

dotenv.config();

export const app = express();
const port = Number(process.env.PORT ?? 3000);
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "10mb" }));
app.use("/api/", createRateLimiter(200, 60000));
app.use("/api/v1/data", dataRoutes);

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
