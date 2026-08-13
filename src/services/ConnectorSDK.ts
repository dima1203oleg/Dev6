
export type ConnectorHealthStatus = {
  status: 'ONLINE' | 'OFFLINE';
  latencyMs: number;
};

export const ckanConnector = {
  metadata: () => ({ id: 'ckan', name: 'CKAN', version: '1.0.0', description: 'CKAN Connector' }),
  health: async (): Promise<ConnectorHealthStatus> => ({ status: 'ONLINE', latencyMs: 45 }),
  search: async (_options: any) => ({ success: true, items: [], error: null }),
  fetchResourceSchema: async (_id: string) => ({ success: true, schema: {} }),
  fetchResourceData: async (_id: string, _limit?: number) => ({ success: true, records: [], error: null }),
};
