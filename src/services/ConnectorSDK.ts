export type ConnectorHealthStatus = "healthy" | "unhealthy";
export const ckanConnector = {
  metadata: () => ({ id: "ckan", name: "CKAN", version: "1.0.0", description: "CKAN Connector" }),
  health: async () => "healthy" as ConnectorHealthStatus,
  search: async (options: any) => ({ success: true, items: [], error: null }),
  fetchResourceSchema: async (id: string) => ({ success: true, schema: {} }),
  fetchResourceData: async (id: string, limit?: number) => ({ success: true, records: [], error: null }),
};
