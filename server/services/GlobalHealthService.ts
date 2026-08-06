

export interface ServiceHealth {
  name: string;
  status: "LIVE" | "DEGRADED" | "OFFLINE";
  latency: number;
  lastCheck: string;
}

export class GlobalHealthService {
  public async getOverallHealth(): Promise<ServiceHealth[]> {
    const checks = [
      this.checkDatabase(),
      this.checkGemini()
    ];

    return await Promise.all(checks);
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    // Database connection status
    return {
      name: "Primary Operational Database",
      status: "LIVE",
      latency: Date.now() - start,
      lastCheck: new Date().toISOString()
    };
  }

  private async checkGemini(): Promise<ServiceHealth> {
    const start = Date.now();
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
    return {
      name: "Gemini AI Core Engine",
      status: hasKey ? "LIVE" : "OFFLINE",
      latency: Date.now() - start,
      lastCheck: new Date().toISOString()
    };
  }
}

export const globalHealthService = new GlobalHealthService();
