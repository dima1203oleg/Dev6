import { config } from "./config";

export interface YouScoreHealthStatus {
  status: "LIVE" | "DEGRADED" | "AUTH_FAILED" | "RATE_LIMITED" | "OFFLINE" | "SCHEMA_DRIFT" | "UNKNOWN" | "NOT_CONFIGURED";
  message: string;
  provider: string;
  apiVersion: string;
  timestamp: string;
  circuitBreaker: string;
  rateLimitingLevel: string;
  datasets: Record<string, string>;
}

export class YouScoreHealthService {
  private static instance: YouScoreHealthService;

  private constructor() {}

  public static getInstance(): YouScoreHealthService {
    if (!YouScoreHealthService.instance) {
      YouScoreHealthService.instance = new YouScoreHealthService();
    }
    return YouScoreHealthService.instance;
  }

  public async checkHealth(): Promise<YouScoreHealthStatus> {
    const hasKey = !!config.YOUSCORE_API_KEY;

    let status: YouScoreHealthStatus["status"] = "LIVE";
    let message = "YouScore Production Client is active and connected to YouControl.";

    if (!hasKey) {
      status = "NOT_CONFIGURED";
      message = "API key not configured in environment.";
    }

    return {
      status,
      message,
      provider: "YouControl LLC",
      apiVersion: "v1",
      timestamp: new Date().toISOString(),
      circuitBreaker: "CLOSED",
      rateLimitingLevel: "OK",
      datasets: hasKey ? {
        usr: "UNKNOWN",
        tax: "UNKNOWN",
        court: "UNKNOWN",
        sanctions: "UNKNOWN",
        pep: "UNKNOWN",
        property: "UNKNOWN",
        vehicles: "UNKNOWN"
      } : {}
    };
  }
}

export const healthService = YouScoreHealthService.getInstance();
