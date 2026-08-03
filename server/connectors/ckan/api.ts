import { CKANUniversalConnector } from "./index";

const connector = new CKANUniversalConnector("https://data.gov.ua");

export const setupCkanRoutes = (app: any) => {
  app.get("/api/v1/ckan/datasets", async (req: any, res: any) => {
    try {
      const q = req.query.q || "";
      const rows = parseInt(req.query.rows) || 10;
      const data = await connector.discovery.discoverDatasets(q as string, rows);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/v1/ckan/schema/:resource_id", async (req: any, res: any) => {
    try {
      const { resource_id } = req.params;
      const schema = await connector.discovery.discoverSchema(resource_id);
      res.json(schema);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/v1/ckan/query", async (req: any, res: any) => {
    try {
      const { sql, resource_id, limit, offset, q } = req.body;
      if (sql) {
        // Simple security check
        const upperSql = sql.toUpperCase();
        if (
          upperSql.includes("INSERT") ||
          upperSql.includes("UPDATE") ||
          upperSql.includes("DELETE") ||
          upperSql.includes("DROP")
        ) {
          return res.status(403).json({ error: "Only SELECT queries are allowed" });
        }
        const data = await connector.querySql(sql);
        return res.json(data);
      } else if (resource_id) {
        const data = await connector.extractData(resource_id, limit || 100, offset || 0, q);
        return res.json(data);
      }
      res.status(400).json({ error: "Missing sql or resource_id" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
};
