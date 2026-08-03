import { cachedFetch } from "../helpers";
import { TtlCache } from "../cache";
import { DataSourceResult, WikipediaSearchItem, WikipediaSearchResponse } from "../types";

const cache = new TtlCache<WikipediaSearchItem[]>(300000);

const parse = (value: unknown): WikipediaSearchItem[] => {
  if (typeof value !== "object" || value === null) throw new Error("Wikipedia payload is not an object");
  const search = (value as Record<string, unknown>).query;
  if (typeof search !== "object" || search === null || !Array.isArray((search as Record<string, unknown>).search)) {
    throw new Error("Wikipedia payload is missing query.search");
  }
  return ((search as Record<string, unknown>).search as unknown[]).map((item) => {
    if (typeof item !== "object" || item === null || typeof (item as Record<string, unknown>).pageid !== "number" ||
      typeof (item as Record<string, unknown>).title !== "string" || typeof (item as Record<string, unknown>).snippet !== "string") {
      throw new Error("Wikipedia search item is invalid");
    }
    return item as WikipediaSearchItem;
  });
};

export const search = async (query: string, rows: number): Promise<DataSourceResult<WikipediaSearchItem[]>> => {
  const sourceUrl = `https://uk.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=${rows}`;
  return cachedFetch<WikipediaSearchItem[]>(cache, `${query}:${rows}`, "wikipedia-uk", "Українська Вікіпедія", sourceUrl, parse);
};
