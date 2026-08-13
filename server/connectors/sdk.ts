import { executeWithConnectorLogging } from "./connectorLogger";

export interface ConnectorMetadata {
  id: string;
  name: string;
  protocol: "CKAN" | "REST" | "GraphQL" | "OData" | "SOCRATA" | "CSV" | "XML";
  version: string;
  description: string;
  country: string;
  owner: string;
  authMethod: "NONE" | "API_KEY" | "BEARER" | "OAUTH2";
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  rateLimitReqPerMin: number;
}

export interface UniversalConnector {
  metadata(): ConnectorMetadata;
  health(): Promise<{ status: "ONLINE" | "DEGRADED" | "OFFLINE"; latencyMs: number }>;
  discover(query: string): Promise<any[]>;
  schema(resourceId: string): Promise<any>;
  search(query: string, options?: any): Promise<any>;
  fetch(resourceId: string, limit?: number, offset?: number): Promise<any[]>;
  normalize(rawData: any): any;
  provenance(recordId: string): Promise<any>;
}

export class BaseConnectorRegistry {
  private connectors = new Map<string, UniversalConnector>();

  public register(connector: UniversalConnector) {
    const meta = connector.metadata();
    this.connectors.set(meta.id, connector);
    console.log(`[CONNECTOR SDK] Registered connector: ${meta.name} (${meta.id})`);
  }

  public get(id: string): UniversalConnector | undefined {
    return this.connectors.get(id);
  }

  public listAll(): ConnectorMetadata[] {
    return Array.from(this.connectors.values()).map(c => c.metadata());
  }

  public async executeSearch(connectorId: string, query: string, options?: any): Promise<any> {
    const connector = this.get(connectorId);
    if (!connector) {
      throw new Error(`Connector '${connectorId}' not found in registry`);
    }

    const meta = connector.metadata();
    return executeWithConnectorLogging(
      {
        connectorId: meta.id,
        connectorName: meta.name,
        endpoint: `/connector/${meta.id}/search`,
        method: "POST",
        queryParams: { query },
        body: options,
      },
      async () => {
        const data = await connector.search(query, options);
        return { statusCode: 200, data };
      }
    );
  }
}

export const connectorRegistry = new BaseConnectorRegistry();
export { executeWithConnectorLogging, logConnectorEvent } from "./connectorLogger";

