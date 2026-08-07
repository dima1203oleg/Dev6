# Why 10 Specific Fields Cannot Be Shown Without Real Implementation

## Request

Show 10 specific fields with full provenance chain for control IPN 3111724753:

```
Card
Field
UI value
API value
DB value
Normalized value
Raw value
Dataset
Resource
Raw record ID
SHA-256
Evidence ID
Confidence
Validation
```

## Current Reality

**This cannot be shown because the required implementation does not exist.**

## What Would Be Required

### 1. Real Entity Resolution (NOT IMPLEMENTED)

**Current State**: Mock entity resolution
- System downloads 106,815 records
- System creates 6 mock entity types per registry
- Mock entities created WITHOUT searching for IPN 3111724753
- No filtering of records by IPN/RNOKPP

**Required State**: Real entity resolution
- Search downloaded records for IPN 3111724753
- Filter records by IPN/RNOKPP fields
- Only create entities where IPN is actually found
- Return 0 entities if IPN not found in data

**Gap**: Without real IPN search, there are no actual records for IPN 3111724753 to show provenance for.

### 2. Field-Level Provenance Tracking (NOT IMPLEMENTED)

**Current State**: No field-level lineage tracking
- System does not track which field value came from which stage
- No mapping from UI → API → DB → Entity → Normalized → Raw
- No record IDs through pipeline stages
- No SHA256 hashes at transformation stages

**Required State**: Complete field-level lineage tracking
- Track each field value through all pipeline stages
- Store SHA256 hash at each transformation
- Link UI value to database record
- Link database record to canonical entity
- Link canonical entity to normalized record
- Link normalized record to raw record
- Link raw record to dataset/resource

**Gap**: Without lineage tracking, it is impossible to trace any field value back to its source.

### 3. Database Storage (NOT IMPLEMENTED)

**Current State**: No database integration
- Data processed in memory only
- No PostgreSQL storage
- No API layer
- No UI integration

**Required State**: Full database integration
- Store canonical entities in PostgreSQL
- Store evidence claims in PostgreSQL
- Store card data in PostgreSQL
- Provide API to query card data
- Provide UI to display card data

**Gap**: Without database storage, there are no "API value" or "DB value" to show.

### 4. Field Extraction and Mapping (NOT IMPLEMENTED)

**Current State**: No field-level processing
- CSV parsed as raw lines
- No field extraction
- No field mapping
- No field validation

**Required State**: Complete field processing
- Parse CSV/JSON into structured fields
- Map source fields to canonical fields
- Validate field values
- Store field metadata

**Gap**: Without field extraction, there are no "Raw value" or "Normalized value" to show.

## Example: What Would Be Required for One Field

To show provenance for `company_name` field:

### Step 1: Real IPN Search
```javascript
// Search downloaded data for IPN 3111724753
const records = downloadedData.filter(record => 
  record.ipn === '3111724753' || 
  record.rnokpp === '3111724753' ||
  record.tax_id === '3111724753'
);

// Result: 0 records found (because we don't know if IPN exists in data)
```

### Step 2: Field Extraction
```javascript
// Extract company_name from found records
const companyNames = records.map(record => ({
  raw_value: record.company_name,
  raw_record_id: record.id,
  dataset_id: record.dataset_id,
  resource_id: record.resource_id
}));
```

### Step 3: Normalization
```javascript
// Normalize company_name
const normalized = companyNames.map(item => ({
  ...item,
  normalized_value: normalizeCompanyName(item.raw_value),
  sha256_normalized: calculateSHA256(item.raw_value)
}));
```

### Step 4: Entity Creation
```javascript
// Create canonical entity
const entity = {
  id: `COMPANY-3111724753`,
  type: 'COMPANY',
  ipn: '3111724753',
  company_name: normalized[0].normalized_value,
  sha256_entity: calculateSHA256(JSON.stringify(entity))
};
```

### Step 5: Database Storage
```javascript
// Store in PostgreSQL
await db.entities.insert(entity);
await db.evidence.insert({
  entity_id: entity.id,
  field: 'company_name',
  value: entity.company_name,
  raw_value: normalized[0].raw_value,
  sha256: normalized[0].sha256_normalized
});
```

### Step 6: API Layer
```javascript
// Provide API endpoint
app.get('/api/cards/:id', async (req, res) => {
  const card = await db.cards.findById(req.params.id);
  const provenance = await db.provenance.findByCardId(req.params.id);
  res.json({ card, provenance });
});
```

### Step 7: UI Integration
```javascript
// Display in UI
<CardField 
  label="Company Name"
  value={card.company_name}
  provenance={provenance.company_name}
/>
```

## Current Implementation Status

| Component | Status | Impact |
|-----------|--------|--------|
| Real IPN Search | NOT IMPLEMENTED | Cannot find actual records |
| Field Extraction | NOT IMPLEMENTED | Cannot extract field values |
| Field Mapping | NOT IMPLEMENTED | Cannot map to canonical fields |
| Normalization | NOT IMPLEMENTED | Cannot normalize field values |
| SHA256 Hashing | NOT IMPLEMENTED | Cannot verify data integrity |
| Database Storage | NOT IMPLEMENTED | Cannot store or retrieve values |
| API Layer | NOT IMPLEMENTED | Cannot provide API values |
| UI Integration | NOT IMPLEMENTED | Cannot provide UI values |
| Provenance Tracking | NOT IMPLEMENTED | Cannot trace lineage |
| Evidence Linking | NOT IMPLEMENTED | Cannot link to sources |

## What Can Be Shown Currently

**Nothing.**

The current implementation:
- Downloads raw data (106,815 records)
- Creates mock entities (102 entities)
- Generates mock cards (96 cards)
- Does not search for IPN 3111724753
- Does not extract field values
- Does not store in database
- Does not provide API
- Does not integrate with UI

## What Would Be Required to Show 10 Fields

### Implementation Effort Estimate

1. **Real Entity Resolution**: 2-3 weeks
   - Implement IPN search in downloaded data
   - Implement record filtering
   - Implement entity deduplication
   - Implement confidence scoring

2. **Field Provenance Tracking**: 3-4 weeks
   - Implement lineage tracking system
   - Implement SHA256 hashing at each stage
   - Implement field mapping registry
   - Implement record identification
   - Implement provenance query API

3. **Database Integration**: 2-3 weeks
   - Design database schema
   - Implement PostgreSQL integration
   - Implement data storage
   - Implement query optimization

4. **API Layer**: 1-2 weeks
   - Design API endpoints
   - Implement REST API
   - Implement authentication
   - Implement rate limiting

5. **UI Integration**: 2-3 weeks
   - Design UI components
   - Implement card display
   - Implement provenance display
   - Implement field validation display

**Total Estimated Effort**: 10-15 weeks

## Conclusion

**The 10 specific fields cannot be shown because the required implementation does not exist.**

To show these fields, the following must be implemented:
1. Real IPN search in downloaded data
2. Field extraction and mapping
3. Field-level provenance tracking
4. SHA256 hashing at each stage
5. Database storage
6. API layer
7. UI integration

**This is not a matter of "showing" existing data - it requires implementing the entire data pipeline from scratch.**

The current test proved:
- API connectivity works
- Data download works
- Basic parsing works
- Mock entity generation works

The current test did NOT prove:
- Real IPN search works
- Field extraction works
- Provenance tracking works
- Database integration works
- API integration works
- UI integration works

**Recommendation**: Focus on implementing real entity resolution and field provenance tracking before attempting to show field-level provenance chains.
