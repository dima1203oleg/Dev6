import { config } from "./config";
import { YouScoreError } from "./errors";
import { withRetry } from "./retry";
import { YouScoreResponse } from "./types";
import { buildEvidence } from "../evidence";
import { executeWithConnectorLogging } from "../../connectors/connectorLogger";

export class YouScoreClient {
  private static instance: YouScoreClient;

  private constructor() {}

  public static getInstance(): YouScoreClient {
    if (!YouScoreClient.instance) {
      YouScoreClient.instance = new YouScoreClient();
    }
    return YouScoreClient.instance;
  }

  /**
   * Executes a direct HTTPS request to YouScore API with structured logging & latency metrics.
   */
  public async executeRequest<T = any>(path: string, method: "GET" | "POST" = "GET", body?: any): Promise<T> {
    const apiKey = config.YOUSCORE_API_KEY;
    if (!apiKey) {
      throw new YouScoreError("AUTHENTICATION_ERROR", "YouScore API key is not configured in the environment");
    }

    const url = `${config.YOUSCORE_BASE_URL}/${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    return executeWithConnectorLogging<T>(
      {
        connectorId: "youcontrol-api",
        connectorName: "YouControl Delta Ingestion API",
        endpoint: url,
        method,
        headers,
        body,
        isEmulated: false,
      },
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.YOUSCORE_TIMEOUT_MS);

        try {
          const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errBody: any;
            try {
              errBody = await response.json();
            } catch {
              errBody = await response.text();
            }
            throw YouScoreError.fromHttpStatus(response.status, `YouScore HTTP error: ${response.statusText}`, errBody);
          }

          const resData = await response.json();
          return { statusCode: response.status, data: resData };
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err instanceof YouScoreError) {
            throw err;
          }
          if (err.name === "AbortError") {
            throw new YouScoreError("TIMEOUT", `YouScore request timed out after ${config.YOUSCORE_TIMEOUT_MS}ms`);
          }
          throw new YouScoreError(
            "PROVIDER_UNAVAILABLE",
            `YouScore network connection failed: ${err.message}`,
            undefined,
            err,
          );
        }
      },
    );
  }

  /**
   * High-fidelity query executor with retry, rate limits, circuit breaker, and structured logging.
   */
  public async query<T = any>(endpoint: string, contractorCode: string, apiPath: string): Promise<YouScoreResponse<T>> {
    if (!config.YOUSCORE_API_KEY) {
      throw new YouScoreError(
        "AUTHENTICATION_ERROR",
        "credentials_missing: YOUSCORE_API_KEY or YOUCONTROL_API_KEY is not configured",
      );
    }

    // Call real API using retry policy
    const retryRef = { count: 0 };
    try {
      const responseData = await withRetry(async () => {
        return await this.executeRequest<T>(apiPath, "GET");
      }, retryRef);

      return {
        source: "YouScore Live OpenAPI",
        status: "SUCCESS",
        connected: true,
        endpoint,
        contractorCode,
        retrievedAt: new Date().toISOString(),
        data: responseData,
        freshness: "FRESH",
        evidence: buildEvidence(responseData),
      };
    } catch (err: any) {
      console.error(`[YouScoreClient] Error querying ${apiPath}:`, err);
      throw err;
    }
  }
}

export const youScoreClient = YouScoreClient.getInstance();
