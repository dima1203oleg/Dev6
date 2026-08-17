# Production Runbook

## Daily Operations
- Monitor `Source Health` dashboard.
- Review `DEGRADED` connectors and address API changes.
- Check `MatrixRunner` reports for schema drifts.

## Troubleshooting
### Connector Failures
If a connector returns `SCHEMA_BROKEN`:
1. Check MinIO for the latest raw payload.
2. Identify the upstream schema change.
3. Update the parser in `AbstractConnector` subclass.
4. Deploy the fix.

### Search Performance Drop
If search takes > 5 seconds:
- Check Redis/Celery queue backlogs.
- Check HYDRA execution times.
- Ensure PostgreSQL indices on `identifiers` are healthy.
