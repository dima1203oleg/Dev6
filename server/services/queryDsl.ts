import { QueryDslRequest } from "../../src/types/predator";

export const CKAN_LIMITS = {
  MAX_ROWS: 500,
  MAX_RESPONSE_SIZE_BYTES: 25 * 1024 * 1024, // 25MB
  QUERY_TIMEOUT_MS: 15000, // 15s
  MAX_CONCURRENT_QUERIES: 10,
};

export interface QueryPlanResult {
  sql: string;
  params: any[];
  limitEnforced: number;
  circuitBreakerStatus: "CLOSED" | "OPEN" | "HALF_OPEN";
}

/**
 * Validates and converts frontend Query DSL into safe parameterized SQL queries.
 * Prevents raw SQL string injection attacks.
 */
export function buildSafeQueryPlan(dsl: QueryDslRequest): QueryPlanResult {
  const safeLimit = Math.min(Math.max(1, dsl.limit || 50), CKAN_LIMITS.MAX_ROWS);
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (dsl.filters && Array.isArray(dsl.filters)) {
    dsl.filters.forEach((filter) => {
      // Sanitize field name to alphanumeric & underscores only
      const safeField = filter.field.replace(/[^a-zA-Z0-9_]/g, "");
      if (!safeField) return;

      switch (filter.operator) {
        case "eq":
          whereClauses.push(`"${safeField}" = $${params.length + 1}`);
          params.push(filter.value);
          break;
        case "neq":
          whereClauses.push(`"${safeField}" != $${params.length + 1}`);
          params.push(filter.value);
          break;
        case "gt":
          whereClauses.push(`"${safeField}" > $${params.length + 1}`);
          params.push(filter.value);
          break;
        case "gte":
          whereClauses.push(`"${safeField}" >= $${params.length + 1}`);
          params.push(filter.value);
          break;
        case "lt":
          whereClauses.push(`"${safeField}" < $${params.length + 1}`);
          params.push(filter.value);
          break;
        case "lte":
          whereClauses.push(`"${safeField}" <= $${params.length + 1}`);
          params.push(filter.value);
          break;
        case "contains":
        case "like":
          whereClauses.push(`"${safeField}" ILIKE $${params.length + 1}`);
          params.push(`%${filter.value}%`);
          break;
        case "in":
          if (Array.isArray(filter.value) && filter.value.length > 0) {
            const placeholders = filter.value.map((_, idx) => `$${params.length + idx + 1}`).join(", ");
            whereClauses.push(`"${safeField}" IN (${placeholders})`);
            params.push(...filter.value);
          }
          break;
      }
    });
  }

  let orderClause = "";
  if (dsl.sort && Array.isArray(dsl.sort) && dsl.sort.length > 0) {
    const sortItems = dsl.sort
      .map((s) => {
        const safeField = s.field.replace(/[^a-zA-Z0-9_]/g, "");
        const dir = s.direction?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        return `"${safeField}" ${dir}`;
      })
      .filter(Boolean);

    if (sortItems.length > 0) {
      orderClause = ` ORDER BY ${sortItems.join(", ")}`;
    }
  }

  const tableName = dsl.resourceId ? `"${dsl.resourceId.replace(/[^a-zA-Z0-9_-]/g, "")}"` : "records";
  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM ${tableName}${whereSql}${orderClause} LIMIT ${safeLimit}`;

  return {
    sql,
    params,
    limitEnforced: safeLimit,
    circuitBreakerStatus: "CLOSED",
  };
}
