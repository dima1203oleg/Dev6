import { CKANClient } from "./client";

export class CKANDiscoveryAgent {
  private client: CKANClient;

  constructor(client: CKANClient) {
    this.client = client;
  }

  async discoverDatasets(query: string, rows: number = 10) {
    const data = await this.client.packageSearch(query, rows);
    if (!data.success) throw new Error("Failed to discover datasets");

    return data.result.results.map((pkg: any) => ({
      dataset_id: pkg.id,
      title: pkg.title,
      name: pkg.name,
      organization: pkg.organization?.title || "Unknown",
      metadata_modified: pkg.metadata_modified,
      resources_count: pkg.resources.length,
      resources: pkg.resources.map((res: any) => ({
        resource_id: res.id,
        name: res.name,
        format: res.format,
        datastore_active: res.datastore_active,
        url: res.url,
      })),
    }));
  }

  async discoverSchema(resourceId: string) {
    const data = await this.client.datastoreSearch(resourceId, 1);
    if (!data.success) throw new Error("Failed to discover schema");

    const fields = data.result.fields;
    const recordsCount = data.result.total;

    return {
      resource_id: resourceId,
      schema_hash: this.generateSchemaHash(fields),
      fields: fields.map((f: any) => ({
        name: f.id,
        type: f.type,
      })),
      total_records: recordsCount,
      observed_at: new Date().toISOString(),
    };
  }

  private generateSchemaHash(fields: any[]) {
    // A simplified deterministic hash representation
    const sortedFields = fields
      .map((f) => `${f.id}:${f.type}`)
      .sort()
      .join("|");
    return `schema-${Buffer.from(sortedFields).toString("base64")}`;
  }
}
