export class YouScoreDeduplicator {
  private static instance: YouScoreDeduplicator;
  private activeRequests = new Map<string, Promise<any>>();

  private constructor() {}

  public static getInstance(): YouScoreDeduplicator {
    if (!YouScoreDeduplicator.instance) {
      YouScoreDeduplicator.instance = new YouScoreDeduplicator();
    }
    return YouScoreDeduplicator.instance;
  }

  /**
   * Generates a canonical request hash for deduplication.
   */
  public generateHash(endpoint: string, contractorCode: string): string {
    const normalizedEndpoint = endpoint.trim().toLowerCase();
    const normalizedCode = contractorCode.trim().toLowerCase();
    return `youscore:${normalizedEndpoint}:${normalizedCode}`;
  }

  /**
   * Coalesces duplicate requests. If a request is already running, it returns the same promise.
   */
  public async executeCoalesced<T>(
    hash: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const active = this.activeRequests.get(hash);
    if (active) {
      console.log(`[YouScoreDeduplicator] Request coalescing HIT for hash: ${hash}`);
      return active as Promise<T>;
    }

    const promise = requestFn()
      .then((res) => {
        this.activeRequests.delete(hash);
        return res;
      })
      .catch((err) => {
        this.activeRequests.delete(hash);
        throw err;
      });

    this.activeRequests.set(hash, promise);
    return promise;
  }
}
export const deduplicator = YouScoreDeduplicator.getInstance();
