# Evidence Model

Every piece of data visible to the user must be backed by an `Evidence` object.

## Constraints
1. Evidence cannot be synthesized by AI.
2. Evidence must link back to a specific registry response.
3. The raw response must be hashed (SHA-256) for immutability.

## Storage
- **Metadata**: PostgreSQL `evidence` table.
- **Payload**: MinIO blob storage (compressed JSON).
