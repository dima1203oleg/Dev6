# Operations runbook

## Deploy

```bash
docker build -t dev6-real-data .
docker run --rm --name dev6 -p 3000:3000 --env-file .env dev6-real-data
```

Secrets are server-side environment variables. Do not put API keys in browser
storage or client request bodies.

## Health checks

`GET /liveness` confirms the process is responding. `GET /readiness` confirms
the HTTP service is ready; it does not claim that every optional upstream is
available. The Docker healthcheck uses `/liveness`.

## Upstream failures

The UI shows a source-specific unavailable/error state with the error code and
provenance where available. No fallback or synthetic value is supplied. The
source status page reports reachability independently, so one failed provider
does not hide other successful providers.

## Rate limits and caching

NBU, Prozorro, data.gov.ua and Wikipedia are public services and should not be
polled aggressively. CoinGecko may rate-limit unauthenticated requests. The
server uses bounded requests, retries and in-memory TTL caches; each replica
has its own cache.

## Logs and rollback

Direct runs write logs to stdout/stderr. Docker logs are available with
`docker logs dev6` or through the container runtime. Logs contain request and
upstream error context, not API secrets. To roll back, stop the current
container, start the previously verified image tag with the same environment,
then check `/liveness`, `/readiness` and `/api/v1/data/fx/rates`.
