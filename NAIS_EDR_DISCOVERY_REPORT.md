# NAIS EDR XML Discovery Report

## Source Discovery

### Official Distribution Mechanism
- **Source**: Ministry of Justice of Ukraine (NAIS)
- **Dataset ID**: a1799820-195b-4982-8141-6e84f58103e7
- **Portal**: https://data.gov.ua/dataset/a1799820-195b-4982-8141-6e84f58103e7
- **License**: Creative Commons Attribution (CC-BY)
- **Update Frequency**: Weekly
- **Last Updated**: 11 August 2026, 04:58 (UTC-04:00)

### Available Resources

1. **FOP.zip** (Individual Entrepreneurs)
   - URL: https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714/resource/c262938f-cce7-4489-a805-2fd7c5a44e0b/download/fop.zip
   - Size: 449 MB
   - File: FOP.xml (5,334,166,413 bytes)
   - Schema: FOP_schema.zip

2. **UO.zip** (Legal Entities)
   - URL: https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714/resource/d40cc921-39bb-44fd-be06-dc02589f45c6/download/uo.zip
   - Size: 311 MB
   - File: UO.xml (3,158,894,541 bytes)
   - Schema: UO_schema.zip

3. **FSU.zip** (Foreign Branches)
   - URL: https://data.gov.ua/dataset/03cc1239-3988-4451-aa0d-aadb77448714/resource/2b7eeee3-6c29-4ba8-8c35-1618974830eb/download/fsu.zip
   - Schema: FSU_schema.zip

## Data Verification

### Download Verification
- **FOP.zip**: Downloaded successfully
- **SHA-256**: d663f5a2d8509579d55f699beebbe1647960055003afe9806116712714e06d35
- **Encoding**: WINDOWS-1251 (requires conversion to UTF-8)

### XML Structure
- **Format**: Flat XML structure with SUBJECT elements
- **Sample FOP Record**:
```xml
<SUBJECT>
  <RECORD>648757</RECORD>
  <NAME>NAME</NAME>
  <STAN>STATUS</STAN>
  <FARMER/>
  <REGISTRATION>DATE; DATE; ID</REGISTRATION>
  <ESTATE_MANAGER/>
  <TERMINATED_INFO>DATE; ID; REASON</TERMINATED_INFO>
  <TERMINATION_CANCEL_INFO/>
  <EXCHANGE_DATA>...</EXCHANGE_DATA>
</SUBJECT>
```

### Certification Test Case
- **Test Identifier**: 3111724753
- **FOP.xml Result**: ENTITY_NOT_FOUND_IN_DATASET
- **UO.xml Result**: ENTITY_NOT_FOUND_IN_DATASET
- **Conclusion**: Test entity not found in current dataset (expected behavior)

## Data Content

### FOP (Individual Entrepreneurs) Contains:
- Record number
- Name (ПІБ)
- Status (STAN)
- Registration dates and IDs
- Estate manager information
- Termination information
- Exchange data (tax payer types, registration numbers)

### UO (Legal Entities) Contains:
- Record number
- Name
- Organizational form
- EDRPOU code
- Founders list
- Beneficial owner information
- Management bodies
- Directors and authorized persons

### Data Limitations (Due to Martial Law)
- **NOT PUBLISHED**:
  - Location/address
  - Activities (KVED)
  - Founders/beneficial owners addresses
  - Contact information
  - Registration file storage location

## Implementation Requirements

### Streaming Parser
- Must use streaming XML parser (never load entire dataset into RAM)
- Handle WINDOWS-1251 encoding conversion to UTF-8
- Process large files (5GB+ for FOP, 3GB+ for UO)

### Normalization Requirements
- EDRPOU code normalization
- Legal name normalization
- Address normalization (when available)
- Status normalization
- Date normalization
- Identifier normalization

### Provenance Tracking
- Source ID
- Retrieval timestamp
- Publication timestamp
- Source URL
- File hash (SHA-256)
- File size
- Schema/version

## Next Steps

1. Implement streaming XML parser
2. Create normalization pipeline
3. Implement entity resolution
4. Set up observability metrics
5. Generate certification reports

## Status

- [x] Source discovery completed
- [x] Dataset download verified
- [x] Certification test case executed (ENTITY_NOT_FOUND_IN_DATASET)
- [ ] Streaming parser implementation
- [ ] Normalization pipeline
- [ ] Entity resolution
- [ ] Observability metrics
- [ ] Certification reports
