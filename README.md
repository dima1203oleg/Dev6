# Predator Analytics

Predator Analytics is an analytical interface for Ukrainian public procurement,
open-data, foreign-exchange and market-source data.

## Data honesty

Every number displayed by the application is fetched from a real public source,
computed deterministically from fetched data, or replaced with an explicit
unavailable state. The application does not simulate records, telemetry, risk
scores, hashes or market movements.

## Keyless public sources

| Source                   | Link                                                              | Used for                                     |
| ------------------------ | ----------------------------------------------------------------- | -------------------------------------------- |
| National Bank of Ukraine | https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json | Current and historical FX                    |
| CoinGecko                | https://api.coingecko.com/api/v3/simple/price                     | BTC/ETH spot and 24-hour change              |
| data.gov.ua CKAN         | https://data.gov.ua/api/3/action/package_search                   | Dataset search, facets and datastore records |
| Prozorro/OpenProcurement | https://public.api.openprocurement.org/api/2.5/tenders            | Tender search, details and aggregates        |
| Ukrainian Wikipedia      | https://uk.wikipedia.org/w/api.php                                | Entity profile article search                |

AI advisor and media forensics require `GEMINI_API_KEY`; Opendatabot requires
`OPENDATABOT_API_KEY`; YouScore requires `YOUSCORE_API_KEY` (or the compatibility
alias `YOUCONTROL_API_KEY`). Public keyless analytics work without any key.

## Local development

```bash
npm ci
npm run dev
```

Quality and production commands:

```bash
npm run lint
npm run lint:eslint
npm run format:check
npm test
npm run build
NODE_ENV=production node dist/server.cjs
docker build -t dev6-real-data .
docker run --rm -p 3000:3000 dev6-real-data
```

## API

All data routes return a typed `{ ok, data, provenance }` envelope on success
and `{ ok: false, error }` on failure.

| Endpoint                                       | Purpose                                 |
| ---------------------------------------------- | --------------------------------------- |
| `GET /api/v1/data/fx/rates`                    | Current NBU rates                       |
| `GET /api/v1/data/fx/series?code=USD&days=180` | Historical NBU series and analytics     |
| `GET /api/v1/data/crypto`                      | CoinGecko BTC/ETH spot                  |
| `GET /api/v1/data/procurement/recent?rows=20`  | Hydrated recent Prozorro tenders        |
| `GET /api/v1/data/procurement/search?q=...`    | Procurement records and aggregates      |
| `GET /api/v1/data/procurement/tender/:id`      | Tender detail                           |
| `GET /api/v1/data/opendata/overview`           | CKAN catalogue totals and facets        |
| `GET /api/v1/data/opendata/search?q=&rows=`    | CKAN dataset search                     |
| `GET /api/v1/data/opendata/datastore/:id`      | Real datastore records of a resource    |
| `GET /api/v1/data/entity/profile?q=...`        | Procurement, CKAN and Wikipedia profile |
| `GET /api/v1/data/sources`                     | Cached upstream reachability            |

Credentialed integrations return the same envelope with
`error.code = "credentials_missing"` naming the required variable when the key
is absent, and perform the real upstream call when it is configured:

| Endpoint                            | Required variable     |
| ----------------------------------- | --------------------- |
| `POST /api/chatbot`                 | `GEMINI_API_KEY`      |
| `POST /api/media-forensics`         | `GEMINI_API_KEY`      |
| `GET /api/opendatabot/search?q=...` | `OPENDATABOT_API_KEY` |
| `GET /api/youscore/query?q=...`     | `YOUSCORE_API_KEY`    |

Example current-rate response shape:

```json
{
  "ok": true,
  "data": [{ "r030": 12, "txt": "Алжирський динар", "rate": 0.33557, "cc": "DZD", "exchangedate": "03.08.2026" }],
  "provenance": {
    "source": "nbu",
    "sourceName": "Національний банк України",
    "sourceUrl": "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json",
    "fetchedAt": "2026-08-03T12:20:18.816Z",
    "cached": false,
    "stale": false,
    "license": "NBU public data"
  }
}
```

This excerpt was fetched from the live NBU endpoint during verification; values
change as the upstream publishes new rates.

## Architecture

Providers in `server/datasources` fetch and validate upstream payloads.
Deterministic calculations live in `server/analytics`. Express routes in
`server/routes` expose the shared envelope. The typed client and provenance-aware
components live under `src/services` and `src/components`.

Providers use in-memory TTL caches. `cached: true` means the served value came
from that cache. `stale: true` means it is older than its configured TTL and is
being served stale where the provider permits it. `SourceBadge` displays these
markers together with the exact upstream URL and fetch time.

## Adding a source

Implement a provider with defensive parsing, an upstream URL and request
metadata, timeout/retry and TTL behavior. Return the shared envelope, add the
route, add pure analytics functions only when needed, and add fixtures/tests for
valid and malformed payloads. Expose provenance on every successful value and
an explicit typed error on failure.
