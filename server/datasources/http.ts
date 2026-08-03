import { DataSourceError, FetchOptions } from "./types";

const DEFAULT_USER_AGENT = "Predator-Analytics/1.0 (+https://github.com/dima1203oleg/Dev6)";

export class UpstreamError extends Error {
  public readonly code: string;
  public readonly sourceUrl: string;

  constructor(code: string, message: string, sourceUrl: string) {
    super(message);
    this.name = "UpstreamError";
    this.code = code;
    this.sourceUrl = sourceUrl;
  }
}

const shouldRetry = (error: unknown): boolean => {
  if (error instanceof UpstreamError) {
    return error.code === "http_429" || error.code.startsWith("http_5");
  }
  return true;
};

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const fetchJson = async <T>(
  url: string,
  options: FetchOptions = {},
): Promise<{ data: T; fetchedAt: string }> => {
  const timeoutMs = options.timeoutMs ?? 10000;
  const retries = options.retries ?? 2;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": userAgent },
        body: options.body,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const code = `http_${response.status}`;
        throw new UpstreamError(code, `Upstream returned HTTP ${response.status}`, url);
      }
      let data: T;
      try {
        data = (await response.json()) as T;
      } catch {
        throw new UpstreamError("invalid_json", "Upstream returned invalid JSON", url);
      }
      return { data, fetchedAt: new Date().toISOString() };
    } catch (error) {
      clearTimeout(timeout);
      lastError =
        error instanceof Error && error.name === "AbortError"
          ? new UpstreamError("timeout", `Upstream timed out after ${timeoutMs}ms`, url)
          : error;
      if (attempt >= retries || !shouldRetry(lastError)) break;
      await sleep(250 * (attempt + 1));
    }
  }

  if (lastError instanceof UpstreamError) throw lastError;
  throw new UpstreamError("network_error", "Upstream network request failed", url);
};

export const toDataSourceError = (error: unknown, sourceUrl: string): DataSourceError => ({
  code:
    error instanceof UpstreamError
      ? error.code
      : error instanceof Error && /invalid|missing|not an object/i.test(error.message)
        ? "parse_error"
        : "upstream_error",
  message: error instanceof Error ? error.message : "Upstream request failed",
  sourceUrl,
  attemptedAt: new Date().toISOString(),
});
