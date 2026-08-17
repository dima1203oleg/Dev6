# PREDATOR Data Model

## Core Object: ENTITY
Entities are the central node in the PREDATOR graph. 
Types: `person`, `company`, `organization`, `address`, `court_case`, `document`, `vehicle`, `asset`.

### 1. Entity Schema
```json
{
  "id": "uuid",
  "type": "person | company",
  "identifiers": [
    {
      "type": "ipn | edrpou | passport",
      "value": "string"
    }
  ],
  "verification_status": "VERIFIED | PARTIALLY_VERIFIED | UNVERIFIED | CONFLICTING | NOT_FOUND",
  "confidence": 94,
  "sources_count": 3,
  "evidence_count": 5
}
```

### 2. Evidence Schema
Every field linked to an entity must carry an `Evidence` trace.
```json
{
  "evidence_id": "uuid",
  "source_name": "string",
  "endpoint": "string",
  "retrieved_at": "ISO8601",
  "raw_value": "object",
  "normalized_value": "object",
  "sha256": "string",
  "confidence_score": "number"
}
```

### 3. Provenance Chain
`Source -> Raw Blob (MinIO) -> Normalization Strategy -> Evidence Node (DB) -> Entity Field`
