import { config } from "./config";

/**
 * Executes a function with exponential backoff and jitter retry policy.
 * Only retries on retryable errors (429, 5xx, timeouts, connection issues).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retryCountRef: { count: number } = { count: 0 }
): Promise<T> {
  let attempt = 0;
  const maxAttempts = config.OPENDATABOT_MAX_RETRIES;
  const baseDelay = 500; // milliseconds

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      retryCountRef.count = attempt;

      const isRetryable =
        error.status === 429 ||
        (error.status && error.status >= 500) ||
        error.message?.includes("timeout") ||
        error.message?.includes("network") ||
        error.message?.includes("fetch") ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT";

      if (!isRetryable || attempt >= maxAttempts) {
        throw error;
      }

      // Exponential Backoff with Jitter
      const jitter = Math.random() * 200;
      const backoffDelay = baseDelay * Math.pow(2, attempt - 1) + jitter;
      
      console.warn(
        `[OpendatabotRetry] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${Math.round(backoffDelay)}ms. Reason: ${error.message}`
      );

      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw new Error("Opendatabot client retry exhaustion");
}
