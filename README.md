# PREDATOR Analytics

Production-grade OSINT and entity intelligence platform for Ukrainian registry data analysis.

## Overview

PREDATOR Analytics is a comprehensive system for:
- **Entity Intelligence**: Search and analyze entities across 170+ Ukrainian registries
- **Registry Catalog**: Unified access to official government data sources
- **Connector Framework**: Production-ready connectors with health monitoring
- **AI-Powered Analysis**: Gemini AI integration for dossier generation
- **Real-time Dashboard**: Live monitoring of system health and data quality

## Architecture

### Components

**Backend (Node.js/Express)**
- `server.ts` - Main Express server
- `server/api/` - API endpoints (PredatorAPI, registry catalog)
- `server/datasources/` - Connector framework and data sources
- `server/database/` - PostgreSQL client and repositories
- `server/middleware/` - Auth, validation, rate limiting, error handling
- `server/routes/` - Route definitions

**Frontend (React/Vite)**
- `src/App.tsx` - Main React application
- `src/components/` - UI components (ModernDashboard, EnhancedEntityWorkspace, etc.)
- `src/services/` - API services
- `src/lib/` - Utility libraries

**Data Layer**
- PostgreSQL - Primary database
- Redis - Cache/queue (planned)
- Firebase - Authentication and sync

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or bun

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp config/qa/.env.example .env
   # Edit .env with your values
   ```

4. Run database migrations (if applicable)

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## Configuration

### Environment-Specific Configs

- `config/qa/config.yaml` - QA/Development configuration
- `config/staging/config.yaml` - Staging configuration
- `config/production/config.yaml` - Production configuration

### Environment Variables

See `config/{environment}/.env.example` for required variables.

Critical variables for production:
- `NODE_ENV` - Must be `production`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection
- `GEMINI_API_KEY` - Gemini AI API key
- Registry API keys (NAIS, TAX_GOV, NAZK, PROZORRO, HIBP)

## API Endpoints

### Registry API
- `GET /api/v1/registry/catalog` - Registry catalog
- `POST /api/v1/registry/probe` - Probe specific source
- `POST /api/v1/registry/probe-all` - Probe all sources (admin only)
- `POST /api/v1/registry/query-all` - Query all sources for entity

### Predator API
- `GET /api/v2/predator/entities/:id` - Get entity by ID
- `POST /api/v2/predator/search` - Search entities
- `GET /api/v2/predator/cards/:entityId` - Get entity cards
- `GET /api/v2/predator/health` - Health check

### Health & Metrics
- `GET /health` - System health
- `GET /ready` - Readiness check
- `GET /live` - Liveness check
- `GET /metrics` - System metrics

## Production Status

**Current Status**: NOT_READY_FOR_PRODUCTION

### Blockers (P0)
- Only 2/170 sources have official API contracts
- API keys require vault migration
- Schema validation incomplete
- Field mapping documentation missing
- Rate limiting enforcement incomplete

### Progress
- ✅ Authentication framework implemented
- ✅ Validation middleware added
- ✅ Rate limiting per endpoint
- ✅ Error handling standardized
- ✅ Observability endpoints added
- ✅ TypeScript strict mode enabled
- ✅ Configuration separated by environment

See `production_status.yaml` for detailed status.

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Security

### Authentication

Production mode requires authentication. Roles:
- VIEWER - Read-only access
- ANALYST - Search and investigations
- SENIOR_ANALYST - Full analysis capabilities
- ADMIN - System administration

### Rate Limiting

Per-endpoint rate limiting with role-based multipliers:
- Default: 100 req/min
- Search: 50 req/min
- Probe: 20 req/min
- Admin: 30 req/min
- AI: 10 req/min

## Monitoring

### Health Checks

- `/health` - Overall system health
- `/ready` - Dependency readiness
- `/live` - Process liveness

### Metrics

- Request counts per endpoint
- Error rates
- Latency tracking
- Resource usage

## Contributing

This is a production system. All changes must:
1. Pass TypeScript strict mode
2. Include tests
3. Maintain backward compatibility
4. Update documentation
5. Pass security review

## License

Proprietary - Government of Ukraine

## Support

For issues and questions, contact the development team.
