import { Router, Request, Response } from "express";
import { calculateFxAnalytics, calculateOpenDataOverview, calculateProcurementAnalytics } from "../analytics";
import { getCryptoSpot } from "../datasources/coingecko";
import { getRates, getSeries } from "../datasources/nbu";
import * as ckan from "../datasources/ckan";
import * as prozorro from "../datasources/prozorro";
import * as wikipedia from "../datasources/wikipedia";
import { DataSourceResult } from "../datasources/types";
import { DataSourceError, EntityProfileData, OpenDataSearchData } from "../datasources/types";
import { TtlCache } from "../datasources/cache";

const router = Router();
const sourceStatusCache = new TtlCache<
  Array<{
    source: string;
    status: "online" | "unavailable";
    checkedAt: string;
    sourceUrl: string;
    stale: boolean;
    error?: DataSourceError;
  }>
>(60000);

const sendResult = <T>(res: Response, result: DataSourceResult<T>): void => {
  if (result.ok) {
    res.json(result);
  } else {
    res.status(503).json(result);
  }
};

const resultError = (result: DataSourceResult<unknown>): Extract<DataSourceResult<unknown>, { ok: false }> => {
  if (!("error" in result)) throw new Error("Expected failed data source result");
  return { ok: false, error: result.error };
};

const parseInteger = (value: unknown, fallback: number, min: number, max: number): number | null => {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

router.get("/sources", async (_req: Request, res: Response) => {
  const cached = sourceStatusCache.read("reachability");
  if (cached && !cached.stale) {
    res.json({
      ok: true,
      data: cached.value,
      provenance: {
        source: "aggregator",
        sourceName: "Predator Analytics data source reachability",
        sourceUrl: "multiple upstream sources",
        fetchedAt: cached.fetchedAt,
        cached: true,
        stale: false,
      },
    });
    return;
  }
  const checks = await Promise.all([
    getRates(),
    getCryptoSpot(),
    ckan.search("", 1),
    prozorro.probe(),
    wikipedia.search("Україна", 1),
  ]);
  const names = ["nbu", "coingecko", "ckan", "prozorro", "wikipedia"];
  const data = checks.map((check, index) => ({
    source: names[index],
    status: check.ok ? ("online" as const) : ("unavailable" as const),
    checkedAt: check.ok ? check.provenance.fetchedAt : resultError(check).error.attemptedAt,
    sourceUrl: check.ok ? check.provenance.sourceUrl : resultError(check).error.sourceUrl,
    stale: check.ok ? check.provenance.stale : false,
    error: check.ok ? undefined : resultError(check).error,
  }));
  const stored = sourceStatusCache.write("reachability", data);
  res.json({
    ok: true,
    data: stored.value,
    provenance: {
      source: "aggregator",
      sourceName: "Predator Analytics data source reachability",
      sourceUrl: "multiple upstream sources",
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    },
  });
});

router.get("/fx/rates", async (_req: Request, res: Response) => {
  sendResult(res, await getRates());
});

router.get("/fx/series", async (req: Request, res: Response) => {
  const code = typeof req.query.code === "string" ? req.query.code.trim().toUpperCase() : "USD";
  if (!/^[A-Z]{3}$/.test(code)) {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_code",
        message: "code must be a three-letter currency code",
        sourceUrl: "",
        attemptedAt: new Date().toISOString(),
      },
    });
    return;
  }
  const days = parseInteger(req.query.days, 180, 1, 730);
  if (days === null) {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_days",
        message: "days must be an integer from 1 to 730",
        sourceUrl: "",
        attemptedAt: new Date().toISOString(),
      },
    });
    return;
  }
  const result = await getSeries(code, days);
  if (!result.ok) {
    sendResult(res, result);
    return;
  }
  res.json({ ok: true, data: calculateFxAnalytics(result.data, code), provenance: result.provenance });
});

router.get("/crypto", async (_req: Request, res: Response) => {
  sendResult(res, await getCryptoSpot());
});

router.get("/opendata/overview", async (_req: Request, res: Response) => {
  const result = await ckan.search("", 100);
  if (!result.ok) {
    sendResult(res, result);
    return;
  }
  res.json({ ok: true, data: calculateOpenDataOverview(result.data), provenance: result.provenance });
});

router.get("/opendata/search", async (req: Request, res: Response) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const rows = parseInteger(req.query.rows, 20, 1, 100);
  if (rows === null) {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_rows",
        message: "rows must be an integer from 1 to 100",
        sourceUrl: "",
        attemptedAt: new Date().toISOString(),
      },
    });
    return;
  }
  const result = await ckan.search(query, rows);
  if (!result.ok) {
    sendResult(res, result);
    return;
  }
  const data: OpenDataSearchData = {
    query,
    total: result.data.result.count,
    datasets: result.data.result.results.map((dataset) => ({
      id: dataset.id,
      title: dataset.title,
      organizationTitle: dataset.organization?.title,
      metadataModified: dataset.metadata_modified,
      resourceFormats: (dataset.resources ?? [])
        .map((resource) => resource.format)
        .filter((format): format is string => Boolean(format)),
      url: `https://data.gov.ua/dataset/${encodeURIComponent(dataset.name)}`,
      resources: (dataset.resources ?? []).map((resource) => ({
        id: resource.id,
        name: resource.name,
        format: resource.format,
        url: resource.url,
        datastoreActive: resource.datastore_active,
      })),
    })),
  };
  res.json({ ok: true, data, provenance: result.provenance });
});

router.get("/opendata/datastore/:resourceId", async (req: Request, res: Response) => {
  const resourceId = typeof req.params.resourceId === "string" ? req.params.resourceId : "";
  if (!resourceId) {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_resource_id",
        message: "resourceId is required",
        sourceUrl: "",
        attemptedAt: new Date().toISOString(),
      },
    });
    return;
  }
  sendResult(res, await ckan.datastore(resourceId));
});

router.get("/procurement/search", async (req: Request, res: Response) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const rows = parseInteger(req.query.rows, 20, 1, 100);
  if (!query) {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_query",
        message: "q is required",
        sourceUrl: "",
        attemptedAt: new Date().toISOString(),
      },
    });
    return;
  }
  if (rows === null) {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_rows",
        message: "rows must be an integer from 1 to 100",
        sourceUrl: "",
        attemptedAt: new Date().toISOString(),
      },
    });
    return;
  }
  const result = await prozorro.search(query, rows);
  if (!result.ok) {
    sendResult(res, result);
    return;
  }
  const rates = await getRates();
  res.json({
    ok: true,
    data: calculateProcurementAnalytics(query, result.data, rates.ok ? rates.data : []),
    provenance: result.provenance,
    dependencies: rates.ok ? [rates.provenance] : [{ source: "nbu", error: resultError(rates).error }],
  });
});

router.get("/entity/profile", async (req: Request, res: Response) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query) {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_query",
        message: "q is required",
        sourceUrl: "",
        attemptedAt: new Date().toISOString(),
      },
    });
    return;
  }
  const [procurement, openData, wiki, rates] = await Promise.all([
    prozorro.search(query, 100),
    ckan.search(query, 50),
    wikipedia.search(query, 5),
    getRates(),
  ]);
  const profile: EntityProfileData = {
    query,
    procurement: !procurement.ok
      ? { ok: false, error: resultError(procurement).error }
      : {
          ok: true,
          data: (() => {
            const analytics = calculateProcurementAnalytics(query, procurement.data, rates.ok ? rates.data : []);
            const dates = procurement.data.data
              .map((record) => record.dateCreated ?? record.dateModified)
              .filter((date): date is string => Boolean(date))
              .sort();
            const counterpartCounts = procurement.data.data.reduce<Record<string, number>>((counts, record) => {
              const name = record.procuringEntity?.name;
              if (name) counts[name] = (counts[name] ?? 0) + 1;
              return counts;
            }, {});
            return {
              analytics,
              firstTenderDate: dates[0] ?? null,
              lastTenderDate: dates.at(-1) ?? null,
              topCounterpartEntities: Object.entries(counterpartCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            };
          })(),
          provenance: procurement.provenance,
        },
    openData: !openData.ok
      ? { ok: false, error: resultError(openData).error }
      : {
          ok: true,
          data: {
            query,
            total: openData.data.result.count,
            datasets: openData.data.result.results.map((dataset) => ({
              id: dataset.id,
              title: dataset.title,
              organizationTitle: dataset.organization?.title,
              metadataModified: dataset.metadata_modified,
              resourceFormats: dataset.resources
                .map((resource) => resource.format)
                .filter((format): format is string => Boolean(format)),
              url: `https://data.gov.ua/dataset/${encodeURIComponent(dataset.name)}`,
              resources: dataset.resources.map((resource) => ({
                id: resource.id,
                name: resource.name,
                format: resource.format,
                url: resource.url,
                datastoreActive: resource.datastore_active,
              })),
            })),
          },
          provenance: openData.provenance,
        },
    wikipedia: !wiki.ok
      ? { ok: false, error: resultError(wiki).error }
      : { ok: true, data: wiki.data, provenance: wiki.provenance },
  };
  const provenance = !procurement.ok
    ? !openData.ok
      ? !wiki.ok
        ? undefined
        : wiki.provenance
      : openData.provenance
    : procurement.provenance;
  res.json({ ok: true, data: profile, ...(provenance ? { provenance } : {}) });
});

router.get("/procurement/tender/:id", async (req: Request, res: Response) => {
  const id = req.params.id.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(id)) {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_tender_id",
        message: "Invalid tender id",
        sourceUrl: "",
        attemptedAt: new Date().toISOString(),
      },
    });
    return;
  }
  sendResult(res, await prozorro.detail(id));
});

router.get("/procurement/recent", async (req: Request, res: Response) => {
  const rows = parseInteger(req.query.rows, 20, 1, 100);
  if (rows === null) {
    res.status(400).json({
      ok: false,
      error: {
        code: "invalid_rows",
        message: "rows must be an integer from 1 to 100",
        sourceUrl: "",
        attemptedAt: new Date().toISOString(),
      },
    });
    return;
  }
  const result = await prozorro.recent(rows);
  if (!result.ok) {
    sendResult(res, result);
    return;
  }
  res.json(result);
});

export default router;
