import { cachedFetch } from "../helpers";
import { TtlCache } from "../cache";
import { CkanDatastoreResponse, CkanPackage, CkanSearchResponse, DataSourceResult } from "../types";

const BASE_URL = "https://data.gov.ua/api/3/action";
const cache = new TtlCache<CkanSearchResponse>(300000);

const parseFacets = (value: unknown): CkanSearchResponse["result"]["facets"] | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null) throw new Error("CKAN facets are invalid");
  const facets: CkanSearchResponse["result"]["facets"] = {};
  for (const [facetName, facetValue] of Object.entries(value)) {
    if (Array.isArray(facetValue)) {
      if (
        !facetValue.every(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as Record<string, unknown>).name === "string" &&
            typeof (item as Record<string, unknown>).count === "number",
        )
      )
        throw new Error("CKAN facet list is invalid");
      facets[facetName] = facetValue as Array<{ name: string; count: number }>;
    } else if (typeof facetValue === "object" && facetValue !== null) {
      const entries = Object.entries(facetValue);
      if (!entries.every(([, count]) => typeof count === "number")) throw new Error("CKAN facet map is invalid");
      facets[facetName] = Object.fromEntries(entries) as Record<string, number>;
    } else {
      throw new Error("CKAN facet is invalid");
    }
  }
  return facets;
};

const parse = (value: unknown): CkanSearchResponse => {
  if (typeof value !== "object" || value === null) throw new Error("CKAN payload is not an object");
  const payload = value as Record<string, unknown>;
  const result = payload.result;
  if (payload.success !== true || typeof result !== "object" || result === null)
    throw new Error("CKAN payload is invalid");
  const resultObject = result as Record<string, unknown>;
  if (typeof resultObject.count !== "number" || !Array.isArray(resultObject.results))
    throw new Error("CKAN result is invalid");
  const packages = resultObject.results.map((item): CkanPackage => {
    if (typeof item !== "object" || item === null) throw new Error("CKAN package is invalid");
    const packageObject = item as Record<string, unknown>;
    if (
      typeof packageObject.id !== "string" ||
      typeof packageObject.title !== "string" ||
      typeof packageObject.name !== "string"
    ) {
      throw new Error("CKAN package is missing identity fields");
    }
    return {
      id: packageObject.id,
      title: packageObject.title,
      name: packageObject.name,
      metadata_modified:
        typeof packageObject.metadata_modified === "string" ? packageObject.metadata_modified : undefined,
      organization:
        typeof packageObject.organization === "object" && packageObject.organization !== null
          ? {
              name:
                typeof (packageObject.organization as Record<string, unknown>).name === "string"
                  ? ((packageObject.organization as Record<string, unknown>).name as string)
                  : undefined,
              title:
                typeof (packageObject.organization as Record<string, unknown>).title === "string"
                  ? ((packageObject.organization as Record<string, unknown>).title as string)
                  : undefined,
            }
          : undefined,
      resources: Array.isArray(packageObject.resources)
        ? packageObject.resources
            .filter(
              (resource): resource is Record<string, unknown> => typeof resource === "object" && resource !== null,
            )
            .map((resource) => {
              if (typeof resource.id !== "string") throw new Error("CKAN resource is missing id");
              return {
                id: resource.id,
                format: typeof resource.format === "string" ? resource.format : undefined,
                name: typeof resource.name === "string" ? resource.name : undefined,
                url: typeof resource.url === "string" ? resource.url : undefined,
                datastore_active:
                  typeof resource.datastore_active === "boolean" ? resource.datastore_active : undefined,
              };
            })
        : [],
    };
  });
  const facets = parseFacets(resultObject.facets);
  return {
    success: true,
    result: {
      count: resultObject.count,
      results: packages,
      facets,
      organization_list: Array.isArray(resultObject.organization_list)
        ? resultObject.organization_list.filter(
            (item): item is { name: string; count: number } =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as Record<string, unknown>).name === "string" &&
              typeof (item as Record<string, unknown>).count === "number",
          )
        : undefined,
    },
  };
};

const buildSearchUrl = (query: string, rows: number): string =>
  `${BASE_URL}/package_search?q=${encodeURIComponent(query)}&rows=${rows}&facet.field=${encodeURIComponent('["organization","res_format"]')}&facet.limit=100`;

export const search = async (query: string, rows: number): Promise<DataSourceResult<CkanSearchResponse>> => {
  const sourceUrl = buildSearchUrl(query, rows);
  return cachedFetch(
    cache,
    `${query}:${rows}`,
    "ckan",
    "data.gov.ua CKAN",
    sourceUrl,
    parse,
    "data.gov.ua open data license",
  );
};

export const packageSearchUrl = buildSearchUrl;

const datastoreCache = new TtlCache<CkanDatastoreResponse>(300000);
const parseDatastore = (value: unknown): CkanDatastoreResponse => {
  if (typeof value !== "object" || value === null) throw new Error("CKAN datastore payload is invalid");
  const result = (value as Record<string, unknown>).result;
  if (typeof result !== "object" || result === null) throw new Error("CKAN datastore result is invalid");
  const payload = result as Record<string, unknown>;
  if (typeof payload.total !== "number" || !Array.isArray(payload.records))
    throw new Error("CKAN datastore records are invalid");
  const records = payload.records.filter(
    (record): record is Record<string, unknown> => typeof record === "object" && record !== null,
  );
  return { total: payload.total, records };
};

export const datastore = async (resourceId: string): Promise<DataSourceResult<CkanDatastoreResponse>> => {
  const sourceUrl = `${BASE_URL}/datastore_search?resource_id=${encodeURIComponent(resourceId)}&limit=100`;
  return cachedFetch(datastoreCache, resourceId, "ckan", "data.gov.ua CKAN datastore", sourceUrl, parseDatastore);
};
