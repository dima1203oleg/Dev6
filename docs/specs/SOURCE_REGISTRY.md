# Autonomous Registry Discovery Platform (ARDP) & Source Registry

## 1. Registry Discovery
The ARDP continuously scans open data portals (like `data.gov.ua`) and other state APIs to discover new or updated data sets.

### Discovery Loop
1. **Fetch Catalogs:** Pulls from CKAN, Socrata, or custom state APIs.
2. **Schema Inference:** AI models sample the data to infer the schema (e.g., identifying `edrpou`, `pib`, `address` columns).
3. **Connector Code Generation:** Automatically generates a draft subclass of `AbstractConnector` to pull this data.
4. **Validation (QA):** `MatrixRunner` executes the generated connector against known benchmark IPNs/EDRPOUs.
5. **Certification:** If accuracy is > 95%, the connector is promoted to staging, then production.

## 2. Source Catalog
Every source is registered in `sourceMatrix.yaml`.
Attributes:
- `id`: unique source id
- `url`: endpoint
- `format`: JSON/XML/CSV
- `health`: ONLINE, DEGRADED, MAINTENANCE
- `auth`: None, API_KEY, OAUTH
