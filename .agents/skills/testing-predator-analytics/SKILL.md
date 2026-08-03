---
name: testing-predator-analytics
description: How to run and end-to-end test the Predator Analytics (Dev6) real-data app locally — production/dev startup, upstream ground-truth checks, Ukrainian-UI navigation, outage simulation, and known traps.
---

# Testing Predator Analytics (Dev6)

## Run it

```bash
npm ci
npm run build                                   # vite build + esbuild -> dist/server.cjs
setsid nohup env NODE_ENV=production PORT=3000 node dist/server.cjs > /tmp/prod.log 2>&1 < /dev/null &
# dev mode alternative (Vite middleware on the same port): npm run dev
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000
```

Use `setsid nohup … &`: a plain background `&` inside a tool call can be killed with the call's process group when the call times out.
No API keys are expected — `GEMINI_API_KEY`, `OPENDATABOT_API_KEY`, `YOUSCORE_API_KEY` unset is the normal state and those tabs must show «Потрібен ключ API» / `credentials_missing`, which is a pass.

## Verify truthfulness, not rendering

Every displayed number should be cross-checked against the upstream directly:

```bash
curl -s "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json"        # FX cards
curl -s "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
curl -s "https://data.gov.ua/api/3/action/package_search?rows=0"                    # CKAN total
curl -s "https://data.gov.ua/api/3/action/datastore_search?resource_id=<id>&limit=1"
curl -s -X POST "https://prozorro.gov.ua/api/search/tenders" -H 'Content-Type: application/json' -d '{"text":"UA-…"}'   # NB: POST, GET returns 405
curl -s "https://public.api.openprocurement.org/api/2.5/tenders/<internal-uuid>"    # needs the UUID, NOT the public tenderID
```

Server-side aggregates can be validated arithmetically (recompute `sumsByCurrency` from `records`, check `exactEdrpouMatches` identifiers, check `currencyConversions.sourceRate` equals the live NBU rate):
`/api/v1/data/{sources,fx/rates,fx/series,crypto,opendata/overview,opendata/search,opendata/datastore/:id,procurement/recent,procurement/search,procurement/tender/:id,entity/profile}`.

## Honest-failure (outage) simulation

```bash
echo "127.0.0.1 bank.gov.ua" | sudo tee -a /etc/hosts
pkill -f dist/server.cjs && setsid nohup env NODE_ENV=production PORT=3000 node dist/server.cjs > /tmp/prod.log 2>&1 < /dev/null &   # restart clears the in-memory cache
# expect: «Джерело недоступне: …» + «Код: network_error» + «Повторити», never numbers
sudo sed -i '/bank.gov.ua/d' /etc/hosts   # then click «Повторити» — the real rate must return
```

## Traps seen in this app

- The Express limiter is `200 req / 60 s` (`server/middleware/rateLimiter.ts`). A UI refetch loop can exhaust it in seconds; symptoms are tabs stuck on «Завантаження реальних даних…» and `429 RATE_LIMIT_EXCEEDED`. Wait ~60 s and reload to recover; check for hooks whose `useEffect` depends on an inline loader recreated each render.
- Navigation is React state, not a router: there is no URL per tab, and any `window.history.back()` inside the app can navigate out of the SPA. Never use the browser Back button to move between tabs — click the sidebar.
- Sidebar is `hidden md:block` with no mobile nav; below ~768 px the app is unnavigable.
- Ukrainian input via `xdotool type` is unreliable — copy through the clipboard instead: `printf '%s' 'Нафтогаз' | DISPLAY=:0 xclip -selection clipboard`, then click the field and press `ctrl+v`.
- Sidebar labels: Аналітичний дашборд / Публічні закупівлі / Відкриті дані / Досьє суб'єкта / Стан джерел, then the four keyed integrations, then six documentation tabs.

## Environment stability

This box has hard-restarted roughly every 15 minutes during long runs, killing the server, Chrome and any in-progress screen recording. Keep recordings short and self-contained, take screenshots as you go, and re-check `uptime` plus the server process whenever the browser shows `ERR_CONNECTION_REFUSED`.

## Devin Secrets Needed

None for the real-data surfaces. Optional, only to exercise the keyed integrations: `GEMINI_API_KEY`, `OPENDATABOT_API_KEY`, `YOUSCORE_API_KEY`.
