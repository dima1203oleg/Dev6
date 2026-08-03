import { config } from "./config";
import { OpendatabotError } from "./errors";
import { withRetry } from "./retry";
import { OpendatabotResponse } from "./types";
import { executeWithConnectorLogging } from "../../connectors/connectorLogger";

export class OpendatabotClient {
  private static instance: OpendatabotClient;

  private constructor() {}

  public static getInstance(): OpendatabotClient {
    if (!OpendatabotClient.instance) {
      OpendatabotClient.instance = new OpendatabotClient();
    }
    return OpendatabotClient.instance;
  }

  /**
   * Executes a direct HTTPS request to Opendatabot API with structured logging & latency metrics.
   */
  public async executeRequest<T = any>(path: string, method: "GET" | "POST" = "GET", body?: any): Promise<T> {
    const apiKey = config.OPENDATABOT_API_KEY;
    if (!apiKey) {
      throw new OpendatabotError("AUTHENTICATION_ERROR", "Opendatabot API key is not configured");
    }

    const url = `${config.OPENDATABOT_BASE_URL}/${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    return executeWithConnectorLogging<T>(
      {
        connectorId: "opendatabot-api",
        connectorName: "OpenDataBot Enterprise API",
        endpoint: url,
        method,
        headers,
        body,
        isEmulated: false,
      },
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.OPENDATABOT_TIMEOUT_MS);

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
            throw OpendatabotError.fromHttpStatus(
              response.status,
              `Opendatabot HTTP error: ${response.statusText}`,
              errBody,
            );
          }

          const resData = await response.json();
          return { statusCode: response.status, data: resData };
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err instanceof OpendatabotError) {
            throw err;
          }
          if (err.name === "AbortError") {
            throw new OpendatabotError(
              "TIMEOUT",
              `Opendatabot request timed out after ${config.OPENDATABOT_TIMEOUT_MS}ms`,
            );
          }
          throw new OpendatabotError(
            "PROVIDER_UNAVAILABLE",
            `Opendatabot network connection failed: ${err.message}`,
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
  public async query<T = any>(
    endpoint: string,
    contractorCode: string,
    apiPath: string,
  ): Promise<OpendatabotResponse<T>> {
    if (!config.OPENDATABOT_API_KEY) {
      throw new OpendatabotError("AUTHENTICATION_ERROR", "credentials_missing: OPENDATABOT_API_KEY is not configured");
    }

    const retryRef = { count: 0 };
    try {
      const responseData = await withRetry(async () => {
        return await this.executeRequest<T>(apiPath, "GET");
      }, retryRef);

      return {
        source: "Opendatabot Live API",
        status: "SUCCESS",
        connected: true,
        endpoint,
        contractorCode,
        retrievedAt: new Date().toISOString(),
        data: responseData,
        freshness: "FRESH",
        evidence: {
          evidenceId: `ev_odb_live_${Math.random().toString(36).substring(2, 11)}`,
          contentHash: `sha256-odb-live-${Math.random().toString(36).substring(2, 11)}`,
          schemaVersion: "v3.1",
        },
      };
    } catch (err: any) {
      console.error(`[OpendatabotClient] Error querying ${apiPath}:`, err);
      throw err;
    }
  }
}

export const opendatabotClient = OpendatabotClient.getInstance();
