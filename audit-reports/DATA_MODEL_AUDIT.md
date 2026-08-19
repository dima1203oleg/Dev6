# DATA MODEL AUDIT

## Expected Core Entities
- `entities`
- `entity_identifiers`
- `entity_fields`
- `field_provenance`
- `evidence`
- `sources`
- `relationships`
- `audit`

## Current Gaps
- **Field Provenance:** Must link every field to `evidence_id`, `source`, `sha256`.
- **Entity Resolution:** Must handle `EXACT_MATCH`, `HIGH_CONFIDENCE`, `AMBIGUOUS`, `CONFLICT`. Automatic merging of ambiguous entities is forbidden.
- **Normalization:** Needs strict preservation of `raw_value` alongside `normalized_value`.
