# PREDATOR v7.0 Dependency Graph
MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0

## Module Dependencies

### Core Layer

```
core/analytics/
├── RiskEngine.ts
│   └── (no external dependencies)

core/connectors/
├── BaseConnector.ts (abstract)
│   └── types.ts
├── EDRConnector.ts → BaseConnector.ts
├── BankruptcyConnector.ts → BaseConnector.ts
├── CourtsConnector.ts → BaseConnector.ts
├── DebtorsConnector.ts → BaseConnector.ts
├── SanctionsConnector.ts → BaseConnector.ts
├── TaxConnector.ts → BaseConnector.ts
└── ConnectorFactory.ts
    └── → All Connectors

core/discovery/
├── DiscoveryEngine.ts
│   ├── → ConnectorFactory
│   ├── → EvidenceEngine
│   └── → FactNormalizer

core/entity/
├── EntityResolutionEngine.ts
│   └── (no external dependencies)

core/evidence/
├── EvidenceEngine.ts
│   └── (no external dependencies)

core/failure/
├── FailureHandler.ts
│   └── (no external dependencies)

core/fallback/
├── DataStoreFallbackEngine.ts
│   ├── → StructuredLogger
│   └── → FailureHandler

core/ingestion/
├── ProductionIngestionEngine.ts
│   ├── → StructuredLogger
│   └── → FailureHandler

core/normalizer/
├── FactNormalizer.ts
│   └── (no external dependencies)

core/observability/
├── StructuredLogger.ts
│   └── (no external dependencies)

core/provenance/
├── ProvenanceEngine.ts
│   └── (no external dependencies)

core/remediation/
├── EmptyCardRemediationEngine.ts
│   ├── → StructuredLogger
│   └── → FailureHandler

core/validation/
├── FieldValidator.ts
│   └── (no external dependencies)
└── DataTruthValidator.ts
    └── (no external dependencies)
```

### Server Layer

```
server/api/
├── PredatorAPI.ts
│   ├── → DatabaseClient
│   ├── → EntityRepository
│   ├── → EvidenceRepository
│   ├── → CardRepository
│   └── → IngestionRunRepository

server/cards/
├── CardContract.ts
│   └── (no external dependencies)

server/database/
├── DatabaseClient.ts
│   └── pg (PostgreSQL client)
├── schema.sql
└── repositories/
    ├── EntityRepository.ts
    │   └── → DatabaseClient
    ├── EvidenceRepository.ts
    │   └── → DatabaseClient
    ├── CardRepository.ts
    │   └── → DatabaseClient
    ├── IngestionRunRepository.ts
    │   └── → DatabaseClient
    └── index.ts
        └── → All Repositories

server/registry-discovery/
├── DiscoveryEngine.ts
├── RelevanceEngine.ts
│   └── (no external dependencies)
├── ResourceDownloader.ts
├── SchemaAnalyzer.ts
├── StorageManager.ts
├── Scheduler.ts
└── Orchestrator.ts
    └── → All Discovery Components
```

### Type Definitions

```
src/types/
└── predator.ts
    ├── EntityType (19 types)
    ├── VerificationStatus
    ├── RiskLevel
    ├── EntityAttribute
    ├── EntityRelationship
    ├── EvidenceClaim
    ├── IntelligenceDossier
    ├── CanonicalEntity
    ├── DataProvenanceChain
    ├── UserRole
    ├── Permission
    ├── UserSession
    ├── AuditLogEntry
    ├── AiTaskType
    ├── AiTaskConfig
    └── QueryDslRequest
```

## Dependency Relationships

### Critical Path

```
External Sources (CKAN, Government APIs)
    ↓
Connectors (EDR, Courts, Tax, etc.)
    ↓
DiscoveryEngine
    ↓
EvidenceEngine
    ↓
FactNormalizer
    ↓
EntityResolutionEngine
    ↓
ProvenanceEngine
    ↓
CardContract
    ↓
FieldValidator
    ↓
DataTruthValidator
    ↓
Database Repositories
    ↓
PredatorAPI
    ↓
Client/UI
```

### Parallel Paths

```
ProductionIngestionEngine (parallel to Discovery)
    ↓
DataStoreFallbackEngine (parallel to Discovery)
    ↓
StructuredLogger (cross-cutting)
    ↓
FailureHandler (cross-cutting)
    ↓
EmptyCardRemediationEngine (parallel to Card Generation)
```

## External Dependencies

### Runtime Dependencies
- `pg` - PostgreSQL client
- `express` - Web framework
- `dotenv` - Environment configuration
- `@google/genai` - Gemini AI client

### Development Dependencies
- `typescript` - Type checking
- `tsx` - TypeScript execution
- `esbuild` - Build tool

## Circular Dependencies

**None detected** - The architecture follows a layered approach with no circular dependencies.

## Module Coupling

### Low Coupling
- All core engines are independent
- Connectors inherit from abstract base
- Repositories share only DatabaseClient

### Medium Coupling
- DiscoveryEngine depends on multiple core engines
- PredatorAPI depends on all repositories
- RemediationEngine depends on logging and failure handling

### High Coupling
- None - All high-level modules use well-defined interfaces

## Data Flow

### Ingestion Flow
```
URL → ProductionIngestionEngine → DataStoreFallbackEngine → Parser → Normalizer → Database
```

### Query Flow
```
Client → PredatorAPI → Repository → Database → Response
```

### Remediation Flow
```
Empty Card → EmptyCardRemediationEngine → Remediation Strategies → Incident Creation
```

## Security Considerations

1. **Database Credentials**: Stored in environment variables, not in code
2. **API Keys**: Stored in environment variables, not in code
3. **SQL Injection**: Prevented by using parameterized queries in repositories
4. **Rate Limiting**: Implemented in ProductionIngestionEngine
5. **Request Timeout**: Implemented in all external calls

## Performance Considerations

1. **Connection Pooling**: PostgreSQL client uses connection pooling
2. **Batch Processing**: ProductionIngestionEngine processes data in batches
3. **Caching**: DataStoreFallbackEngine implements caching with TTL
4. **Checkpointing**: ProductionIngestionEngine saves checkpoints for resume capability
5. **Streaming**: Large datasets are streamed, not loaded entirely into memory

## Scalability Considerations

1. **Horizontal Scaling**: Stateless API layer can be scaled horizontally
2. **Database Scaling**: PostgreSQL can be scaled with read replicas
3. **Ingestion Scaling**: Multiple ingestion runs can run in parallel
4. **Cache Distribution**: Cache can be distributed across instances (Redis integration possible)

## Conclusion

The PREDATOR v7.0 dependency graph shows a well-structured, layered architecture with:
- Clear separation of concerns
- No circular dependencies
- Low to medium coupling
- Well-defined data flows
- Cross-cutting concerns (logging, failure handling) properly isolated
- External dependencies minimized and well-managed

The architecture is production-ready and supports scalability, maintainability, and extensibility.
