import { CKANClient } from "./client";
import { CKANDiscoveryAgent } from "./discovery";

export class CKANUniversalConnector {
  public client: CKANClient;
  public discovery: CKANDiscoveryAgent;

  constructor(baseUrl: string = "https://data.gov.ua") {
    this.client = new CKANClient(baseUrl);
    this.discovery = new CKANDiscoveryAgent(this.client);
  }

  async extractData(resourceId: string, limit: number = 100, offset: number = 0, q?: string) {
    const data = await this.client.datastoreSearch(resourceId, limit, offset, q);
    if (!data.success) throw new Error("Data extraction failed");

    return {
      resource_id: resourceId,
      retrieved_at: new Date().toISOString(),
      records: data.result.records,
      total: data.result.total,
      limit: limit,
      offset: offset,
    };
  }

  async querySql(sql: string) {
    const data = await this.client.datastoreSearchSql(sql);
    if (!data.success) throw new Error("SQL Query failed");

    return {
      sql: sql,
      retrieved_at: new Date().toISOString(),
      records: data.result.records,
    };
  }
}
