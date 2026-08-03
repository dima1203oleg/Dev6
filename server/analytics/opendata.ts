import { CkanPackage, CkanSearchResponse } from "../datasources/types";

export interface RankedCount {
  name: string;
  count: number;
}

export interface OpenDataOverview {
  totalDatasets: number;
  topOrganizations: RankedCount[];
  topResourceFormats: RankedCount[];
  modifiedLast30Days: number;
  basedOnSearchResults: number;
  searchResults: CkanPackage[];
}

const facetCounts = (facet: Record<string, number> | Array<{ name: string; count: number }> | undefined): RankedCount[] => {
  if (!facet) return [];
  if (Array.isArray(facet)) return facet.map((item) => ({ name: item.name, count: item.count })).sort((a, b) => b.count - a.count);
  return Object.entries(facet).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
};

export const calculateOpenDataOverview = (response: CkanSearchResponse, now = new Date()): OpenDataOverview => {
  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const modifiedLast30Days = response.result.results.filter((item) => {
    if (!item.metadata_modified) return false;
    const timestamp = Date.parse(item.metadata_modified);
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  }).length;
  const facets = response.result.facets;
  const organizations = facets?.organization;
  const formats = facets?.res_format;
  return {
    totalDatasets: response.result.count,
    topOrganizations: facetCounts(organizations).slice(0, 10),
    topResourceFormats: facetCounts(formats).slice(0, 10),
    modifiedLast30Days,
    basedOnSearchResults: response.result.results.length,
    searchResults: response.result.results,
  };
};
