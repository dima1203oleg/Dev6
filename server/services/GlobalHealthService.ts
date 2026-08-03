import { opendatabotClient } from "./opendatabot/client";
import { youScoreClient } from "./youscore/client";

export interface ServiceHealth {
  name: string;
  status: "LIVE" | "DEGRADED" | "OFFLINE";
  latency: number;
  lastCheck: string;
}

export class GlobalHealthService {
  public async getOverallHealth(): Promise<ServiceHealth[]> {
    const checks = [
      this.checkOpendatabot(),
      this.checkYouScore(),
      this.checkDatabase(),
      this.checkGemini()
    ];

    return await Promise.all(checks);
  }

  private async checkOpendatabot(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // Small dummy request to check connectivity if needed, 
      // but usually we just check the client configuration and last error
      const status = process.env.OPENDATABOT_API_KEY ? "LIVE" : "OFFLINE";
      return {
        name: "Opendatabot API",
        status,
        latency: Date.now() - start,
        lastCheck: new Date().toISOString()
      };
    } catch {
      return { name: "Opendatabot API", status: "OFFLINE", latency: 0, lastCheck: new Date().toISOString() };
    }
  }

  private async checkYouScore(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const status = process.env.YOUSCORE_API_KEY ? "LIVE" : "OFFLINE";
      return {
        name: "YouScore API",
        status,
        latency: Date.now() - start,
        lastCheck: new Date().toISOString()
      };
    } catch {
      return { name: "YouScore API", status: "OFFLINE", latency: 0, lastCheck: new Date().toISOString() };
    }
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    return {
      name: "Primary Database",
      status: "OFFLINE",
      latency: Date.now() - start,
      lastCheck: new Date().toISOString()
    };
  }

  private async checkGemini(): Promise<ServiceHealth> {
    const start = Date.now();
    return {
      name: "Gemini AI Core",
      status: process.env.GEMINI_API_KEY ? "LIVE" : "OFFLINE",
      latency: Date.now() - start,
      lastCheck: new Date().toISOString()
    };
  }
}

export const globalHealthService = new GlobalHealthService();
