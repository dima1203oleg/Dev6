

import { executeWithConnectorLogging } from "../connectorLogger";

export class CKANClient {
  private baseUrl: string;

  constructor(baseUrl: string = "https://data.gov.ua") {
    this.baseUrl = baseUrl;
  }

  async packageSearch(query: string = "", rows: number = 10, start: number = 0) {
    const url = new URL(`${this.baseUrl}/api/3/action/package_search`);
    if (query) url.searchParams.append("q", query);
    url.searchParams.append("rows", rows.toString());
    url.searchParams.append("start", start.toString());

    return executeWithConnectorLogging(
      {
        connectorId: "ckan-data-gov-ua",
        connectorName: "data.gov.ua CKAN Connector 2.0",
        endpoint: url.toString(),
        method: "GET",
        queryParams: { q: query, rows, start }
      },
      async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const response = await fetch(url.toString(), { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`CKAN package_search status ${response.status}`);
          const data = await response.json();
          if (data && data.success) return { statusCode: response.status, data };
          throw new Error("Invalid response structure from CKAN API");
        } catch (err: any) {
          console.error("[CKAN CONNECTOR ERROR] Live fetch failed:", err.message);
          throw new Error(`CKAN live fetch failed: ${err.message}`);
        }
      }
    );
  }


  async packageShow(id: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/3/action/package_show?id=${id}`);
      if (!response.ok) throw new Error(`CKAN package_show failed: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      return { success: false, result: null };
    }
  }

  async resourceShow(id: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/3/action/resource_show?id=${id}`);
      if (!response.ok) throw new Error(`CKAN resource_show failed: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      return { success: false, result: null };
    }
  }

  async datastoreSearch(resourceId: string, limit: number = 100, offset: number = 0, q?: string) {
    const url = new URL(`${this.baseUrl}/api/3/action/datastore_search`);
    url.searchParams.append("resource_id", resourceId);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("offset", offset.toString());
    if (q) url.searchParams.append("q", q);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`CKAN datastore_search status ${response.status}`);
      const data = await response.json();
      if (data && data.success) return data;
      throw new Error("Invalid response structure from CKAN DataStore API");
    } catch (err: any) {
      console.error("[CKAN DATASTORE ERROR]:", err.message);
      throw new Error(`CKAN datastore search failed: ${err.message}`);
    }
  }

  async datastoreSearchSql(sql: string) {
    const url = new URL(`${this.baseUrl}/api/3/action/datastore_search_sql`);
    url.searchParams.append("sql", sql);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`CKAN datastore_search_sql failed: ${response.statusText}`);
      return await response.json();
    } catch (err: any) {
      console.error("[CKAN SQL ERROR]:", err.message);
      throw new Error(`CKAN datastore SQL query failed: ${err.message}`);
    }
  }
}

