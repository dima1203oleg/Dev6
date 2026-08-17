# PREDATOR Analytics Architecture

## 1. Core Principles
- **Strict Verification Mode:** No facts without provenance.
- **Zero Mock Production:** Unavailable upstream means UNAVAILABLE, not a mock.
- **Device-Adaptive Composition:** Not just responsive scaling, but UX composition driven by device profile (Phone, Tablet, Desktop, Ultrawide).
- **Fast, Intelligent, Trustworthy.**

## 2. Global Pipeline
`Source -> Connector -> Raw Storage -> Validation -> Normalization -> Entity Resolution -> HYDRA -> Evidence -> PostgreSQL -> API -> Client`

## 3. High-Level Components
1. **Frontend (Presentation & Composition)**
   - Stack: React, Next.js (SSR/API where needed), Zustand (State), React Query (Data Fetching), Tailwind (Tokens).
   - `DeviceAdaptationEngine`: Dictates composition.
2. **Backend (Intelligence API & Pipeline)**
   - Stack: FastAPI / Node.js (Migration pending to FastAPI if strictly required, else scale TS Node for now).
   - Handles the `IntelligenceOrchestrator`.
3. **Storage & Persistence**
   - PostgreSQL (Canonical Entity, Provenance, Metadata).
   - Redis/Celery (Queue/Caching).
   - MinIO (Raw Source Evidence).
4. **Registry Connectors (ARDP)**
   - Pluggable framework for parsing, validating, and pulling from Open Data Registries.
