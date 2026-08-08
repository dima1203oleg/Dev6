# PREDATOR v7.0 API Specification
MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0

## API Overview

**Base URL**: `/api/v2/predator`
**Implementation**: `server/api/PredatorAPI.ts`
**Status**: IMPLEMENTED
**Database Integration**: Real PostgreSQL integration

## Endpoints

### Health Check

#### GET /health
Check API health and database connectivity.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T10:00:00Z",
  "database": "connected",
  "version": "v2.0"
}
```

---

### Entities

#### GET /entities
List entities with optional filtering.

**Query Parameters**:
- `entity_type` (optional): Filter by entity type (PERSON, COMPANY, FOP, etc.)
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `min_confidence` (optional): Minimum confidence threshold (0.0-1.0)

**Response**:
```json
{
  "entities": [
    {
      "entity_id": "company-edrpou-19007752",
      "entity_type": "COMPANY",
      "confidence": 0.95,
      "created_at": "2025-01-09T10:00:00Z",
      "data": {
        "company_name": "Test Company",
        "edrpou": "19007752",
        "status": "ACTIVE"
      }
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

#### GET /entities/:id
Get entity by ID.

**Path Parameters**:
- `id`: Entity ID

**Response**:
```json
{
  "entity_id": "company-edrpou-19007752",
  "entity_type": "COMPANY",
  "confidence": 0.95,
  "created_at": "2025-01-09T10:00:00Z",
  "updated_at": "2025-01-09T10:30:00Z",
  "data": {
    "company_name": "Test Company",
    "edrpou": "19007752",
    "status": "ACTIVE",
    "address": "Kyiv, Ukraine",
    "registration_date": "2020-01-01"
  },
  "metadata": {}
}
```

#### POST /entities
Create new entity.

**Request Body**:
```json
{
  "entity_type": "COMPANY",
  "data": {
    "company_name": "New Company",
    "edrpou": "12345678",
    "status": "ACTIVE"
  },
  "confidence": 0.90
}
```

**Response**:
```json
{
  "entity_id": "company-edrpou-12345678",
  "entity_type": "COMPANY",
  "confidence": 0.90,
  "created_at": "2025-01-09T10:00:00Z",
  "data": {
    "company_name": "New Company",
    "edrpou": "12345678",
    "status": "ACTIVE"
  }
}
```

---

### Cards

#### GET /cards
List cards with optional filtering.

**Query Parameters**:
- `card_type` (optional): Filter by card type (COMPANIES, PERSONS, etc.)
- `entity_id` (optional): Filter by entity ID
- `status` (optional): Filter by status (DRAFT, PUBLISHED, ARCHIVED)
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "cards": [
    {
      "card_id": "card-123",
      "card_type": "COMPANIES",
      "entity_id": "company-edrpou-19007752",
      "status": "PUBLISHED",
      "confidence": 0.92,
      "created_at": "2025-01-09T10:00:00Z",
      "updated_at": "2025-01-09T10:30:00Z"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

#### GET /cards/:id
Get card by ID.

**Path Parameters**:
- `id`: Card ID

**Response**:
```json
{
  "card_id": "card-123",
  "card_type": "COMPANIES",
  "entity_id": "company-edrpou-19007752",
  "status": "PUBLISHED",
  "confidence": 0.92,
  "created_at": "2025-01-09T10:00:00Z",
  "updated_at": "2025-01-09T10:30:00Z",
  "fields": {
    "edrpou": {
      "value": "19007752",
      "confidence": 0.98,
      "validation_status": "PASS"
    },
    "company_name": {
      "value": "Test Company",
      "confidence": 0.95,
      "validation_status": "PASS"
    }
  },
  "metadata": {}
}
```

#### POST /cards
Create new card.

**Request Body**:
```json
{
  "card_type": "COMPANIES",
  "entity_id": "company-edrpou-19007752",
  "fields": {
    "edrpou": "19007752",
    "company_name": "Test Company"
  }
}
```

**Response**:
```json
{
  "card_id": "card-124",
  "card_type": "COMPANIES",
  "entity_id": "company-edrpou-19007752",
  "status": "DRAFT",
  "confidence": 0.92,
  "created_at": "2025-01-09T10:00:00Z",
  "fields": {
    "edrpou": {
      "value": "19007752",
      "confidence": 0.98,
      "validation_status": "PASS"
    }
  }
}
```

#### GET /cards/:id/fields
Get all fields for a card.

**Path Parameters**:
- `id`: Card ID

**Response**:
```json
{
  "card_id": "card-123",
  "fields": [
    {
      "field_id": "field-1",
      "field_name": "edrpou",
      "field_value": "19007752",
      "field_type": "string",
      "confidence": 0.98,
      "validation_status": "PASS",
      "created_at": "2025-01-09T10:00:00Z"
    },
    {
      "field_id": "field-2",
      "field_name": "company_name",
      "field_value": "Test Company",
      "field_type": "string",
      "confidence": 0.95,
      "validation_status": "PASS",
      "created_at": "2025-01-09T10:00:00Z"
    }
  ]
}
```

#### GET /cards/:id/fields/:fieldName/provenance
Get field provenance.

**Path Parameters**:
- `id`: Card ID
- `fieldName`: Field name

**Response**:
```json
{
  "field_name": "edrpou",
  "field_value": "19007752",
  "provenance": {
    "source_id": "data-gov-ua-edr",
    "source_name": "Ukrainian EDR",
    "source_url": "https://data.gov.ua/dataset/...",
    "source_version": "v1.0",
    "schema_version": "edr-v2.1",
    "parser_version": "parser-v1.3",
    "mapping_version": "mapping-v1.0",
    "normalizer_version": "norm-v1.2",
    "entity_resolution_version": "er-v1.0",
    "card_contract_version": "contract-v1.0",
    "source_timestamp": "2025-01-08T12:00:00Z",
    "retrieved_at": "2025-01-09T10:30:00Z",
    "verification_status": "FACT",
    "confidence": 0.98,
    "transformation_steps": ["trim", "validate_format"],
    "source_field_name": "code"
  }
}
```

---

### Evidence

#### GET /evidence
List evidence with optional filtering.

**Query Parameters**:
- `source_id` (optional): Filter by source ID
- `dataset_id` (optional): Filter by dataset ID
- `record_id` (optional): Filter by record ID
- `limit` (optional): Maximum number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "evidence": [
    {
      "evidence_id": "ev-123",
      "source_id": "data-gov-ua-edr",
      "dataset_id": "dataset-456",
      "resource_id": "resource-789",
      "record_id": "record-101",
      "retrieved_at": "2025-01-09T10:30:00Z",
      "source_url": "https://data.gov.ua/...",
      "verification_status": "FACT",
      "confidence": 0.98
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

#### GET /evidence/:id
Get evidence by ID.

**Path Parameters**:
- `id`: Evidence ID

**Response**:
```json
{
  "evidence_id": "ev-123",
  "source_id": "data-gov-ua-edr",
  "dataset_id": "dataset-456",
  "resource_id": "resource-789",
  "record_id": "record-101",
  "retrieved_at": "2025-01-09T10:30:00Z",
  "published_at": "2025-01-08T12:00:00Z",
  "source_url": "https://data.gov.ua/...",
  "source_version": "v1.0",
  "schema_version": "edr-v2.1",
  "parser_version": "parser-v1.3",
  "mapping_version": "mapping-v1.0",
  "normalizer_version": "norm-v1.2",
  "entity_resolution_version": "er-v1.0",
  "card_contract_version": "contract-v1.0",
  "verification_status": "FACT",
  "confidence": 0.98,
  "raw_document": {
    "code": "19007752",
    "name": "Test Company"
  },
  "metadata": {}
}
```

#### POST /evidence
Create new evidence.

**Request Body**:
```json
{
  "source_id": "data-gov-ua-edr",
  "dataset_id": "dataset-456",
  "resource_id": "resource-789",
  "record_id": "record-101",
  "source_url": "https://data.gov.ua/...",
  "raw_document": {
    "code": "19007752",
    "name": "Test Company"
  },
  "confidence": 0.98
}
```

**Response**:
```json
{
  "evidence_id": "ev-124",
  "source_id": "data-gov-ua-edr",
  "dataset_id": "dataset-456",
  "resource_id": "resource-789",
  "record_id": "record-101",
  "retrieved_at": "2025-01-09T10:30:00Z",
  "verification_status": "FACT",
  "confidence": 0.98
}
```

---

### Search

#### GET /search
Search entities by identifier.

**Query Parameters**:
- `identifier` (required): Search identifier (EDRPOU, IPN, name, etc.)
- `entity_type` (optional): Filter by entity type
- `limit` (optional): Maximum number of results (default: 10)

**Response**:
```json
{
  "query": "19007752",
  "results": [
    {
      "entity_id": "company-edrpou-19007752",
      "entity_type": "COMPANY",
      "confidence": 0.98,
      "match_reason": "Exact EDRPOU match",
      "data": {
        "company_name": "Test Company",
        "edrpou": "19007752"
      }
    }
  ],
  "total": 1
}
```

---

### Ingestion Runs

#### GET /ingestion-runs
List ingestion runs.

**Query Parameters**:
- `status` (optional): Filter by status (RUNNING, COMPLETED, FAILED)
- `limit` (optional): Maximum number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "runs": [
    {
      "run_id": "run-20250109-001",
      "started_at": "2025-01-09T10:00:00Z",
      "completed_at": "2025-01-09T10:30:00Z",
      "status": "COMPLETED",
      "datasets_processed": 5,
      "resources_processed": 15,
      "records_processed": 1500,
      "records_failed": 0
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### GET /ingestion-runs/:id
Get ingestion run by ID.

**Path Parameters**:
- `id`: Run ID

**Response**:
```json
{
  "run_id": "run-20250109-001",
  "started_at": "2025-01-09T10:00:00Z",
  "completed_at": "2025-01-09T10:30:00Z",
  "status": "COMPLETED",
  "datasets_processed": 5,
  "resources_processed": 15,
  "records_processed": 1500,
  "records_failed": 0,
  "error_message": null,
  "metadata": {}
}
```

#### POST /ingestion-runs
Create new ingestion run.

**Request Body**:
```json
{
  "dataset_ids": ["dataset-1", "dataset-2"],
  "config": {
    "batch_size": 100,
    "max_retries": 3,
    "enable_checkpointing": true
  }
}
```

**Response**:
```json
{
  "run_id": "run-20250109-002",
  "started_at": "2025-01-09T11:00:00Z",
  "status": "RUNNING",
  "datasets_processed": 0,
  "resources_processed": 0,
  "records_processed": 0,
  "records_failed": 0
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| DATABASE_ERROR | 500 | Database operation failed |
| SOURCE_UNAVAILABLE | 503 | External source unavailable |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit exceeded |

## Authentication

Currently, the API does not require authentication. In production, authentication should be added using:
- API keys
- OAuth 2.0
- JWT tokens

## Rate Limiting

Recommended rate limits (to be implemented):
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Pagination

All list endpoints support pagination using `limit` and `offset` query parameters.

## Database Integration

All endpoints use real PostgreSQL database integration via:
- `DatabaseClient` for connection management
- `EntityRepository` for entity operations
- `EvidenceRepository` for evidence operations
- `CardRepository` for card operations
- `IngestionRunRepository` for ingestion run tracking

## Compliance with v7.0 Specification

✅ All required endpoints implemented
✅ Real PostgreSQL database integration
✅ Card endpoints with field provenance
✅ Evidence endpoints with full version tracking
✅ Search functionality
✅ Ingestion run tracking
✅ Proper error handling
✅ Pagination support
✅ Real data integration (no mocks)

## Conclusion

The PREDATOR v7.0 API is fully implemented with all required endpoints, real PostgreSQL integration, and comprehensive error handling. The API supports entities, cards, evidence, search, and ingestion run management with field-level provenance tracking.
