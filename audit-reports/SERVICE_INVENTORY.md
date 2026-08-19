# SERVICE INVENTORY

## Current Services (Monolith / Core)
1. **Frontend:** React 19 + Vite + TailwindCSS.
2. **Backend API:** Express.js (Node.js) + TypeScript.
3. **Database:** PostgreSQL 15 (Primary Truth Layer).
4. **Cache:** Redis 7 (Configured in docker-compose, usage to be verified).
5. **AI Integration:** Google Gemini API (via `@google/genai`).

## Missing Target Services
- MinIO (Object Storage)
- Keycloak (IAM)
- Vault (Secrets Management)
- OpenSearch / Qdrant (Vector/Search)
- Kafka / Redpanda (Event Streaming)
- Celery (Background Jobs)
