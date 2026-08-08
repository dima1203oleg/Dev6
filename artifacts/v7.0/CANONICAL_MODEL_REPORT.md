# PREDATOR v7.0 Canonical Model Report
MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0

## Canonical Entity Types (19 Total)

### 1. PERSON
**Table**: `persons`
**Purpose**: Represents individual persons in the system
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `full_name` (VARCHAR 1024): Full name of the person
- `ipn` (VARCHAR 20): Individual Tax Number (10 digits)
- `passport` (VARCHAR 50): Passport number
- `date_of_birth` (DATE): Date of birth
- `address` (TEXT): Residential address
- `confidence` (DECIMAL 5,4): Confidence score (0.0000-1.0000)
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 2. COMPANY
**Table**: `companies`
**Purpose**: Represents legal entities/companies
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `company_name` (VARCHAR 1024): Legal company name
- `edrpou` (VARCHAR 20): EDRPOU code (8 digits)
- `status` (VARCHAR 50): Company status (ACTIVE, INACTIVE, LIQUIDATED)
- `address` (TEXT): Registered address
- `registration_date` (DATE): Registration date
- `legal_form` (VARCHAR 100): Legal form (LLC, JSC, etc.)
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 3. FOP (Individual Entrepreneur)
**Table**: `fops`
**Purpose**: Represents individual entrepreneurs (FOP in Ukraine)
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `full_name` (VARCHAR 1024): Full name of entrepreneur
- `ipn` (VARCHAR 20): Individual Tax Number
- `registration_date` (DATE): Registration date
- `status` (VARCHAR 50): FOP status
- `activity_types` (JSONB): Array of activity types (KVED codes)
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 4. ADDRESS
**Table**: `addresses`
**Purpose**: Represents physical addresses
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `full_address` (TEXT): Complete address string
- `country` (VARCHAR 100): Country name
- `region` (VARCHAR 100): Region/oblast
- `city` (VARCHAR 100): City/town
- `street` (VARCHAR 255): Street name
- `building` (VARCHAR 50): Building number
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 5. PHONE
**Table**: `phones`
**Purpose**: Represents phone numbers
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `phone_number` (VARCHAR 50): Phone number
- `phone_type` (VARCHAR 20): Type (MOBILE, LANDLINE, FAX)
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 6. EMAIL
**Table**: `emails`
**Purpose**: Represents email addresses
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `email_address` (VARCHAR 255): Email address
- `email_type` (VARCHAR 20): Type (PERSONAL, WORK, etc.)
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 7. DOCUMENT
**Table**: `documents`
**Purpose**: Represents official documents
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `document_type` (VARCHAR 50): Type (PASSPORT, ID_CARD, LICENSE)
- `document_number` (VARCHAR 100): Document number
- `issue_date` (DATE): Issue date
- `expiry_date` (DATE): Expiry date
- `issuing_authority` (VARCHAR 255): Issuing authority
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 8. DIRECTOR
**Table**: `directors` (part of relationships)
**Purpose**: Represents director relationships
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `person_id` (VARCHAR 255): Reference to person entity
- `company_id` (VARCHAR 255): Reference to company entity
- `appointment_date` (DATE): Appointment date
- `termination_date` (DATE): Termination date
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 9. FOUNDER
**Table**: `founders` (part of relationships)
**Purpose**: Represents founder/beneficial owner relationships
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `person_id` (VARCHAR 255): Reference to person entity
- `company_id` (VARCHAR 255): Reference to company entity
- `ownership_percentage` (DECIMAL 5,2): Ownership percentage
- `registration_date` (DATE): Registration date
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 10. BENEFICIARY
**Table**: `beneficiaries` (part of relationships)
**Purpose**: Represents beneficial owners
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `person_id` (VARCHAR 255): Reference to person entity
- `company_id` (VARCHAR 255): Reference to company entity
- `benefit_type` (VARCHAR 50): Type of benefit
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 11. RELATIVE
**Table**: `relatives`
**Purpose**: Represents family relationships
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `person_id` (VARCHAR 255): Reference to person entity
- `relationship_type` (VARCHAR 50): Type (SPOUSE, CHILD, PARENT, SIBLING)
- `full_name` (VARCHAR 1024): Relative's full name
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 12. COURT_CASE
**Table**: `court_cases`
**Purpose**: Represents court proceedings
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `case_number` (VARCHAR 100): Case number
- `court_name` (VARCHAR 255): Court name
- `case_type` (VARCHAR 100): Case type (CIVIL, CRIMINAL, ADMINISTRATIVE)
- `case_status` (VARCHAR 50): Status (PENDING, ACTIVE, CLOSED)
- `filing_date` (DATE): Filing date
- `decision_date` (DATE): Decision date
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 13. SANCTION
**Table**: `sanctions`
**Purpose**: Represents sanctions imposed on entities
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `sanction_type` (VARCHAR 100): Type (ASSET_FREEZE, TRAVEL_BAN, TRADE_RESTRICTION)
- `sanctioning_authority` (VARCHAR 255): Authority imposing sanction
- `imposition_date` (DATE): Imposition date
- `expiration_date` (DATE): Expiration date
- `reason` (TEXT): Reason for sanction
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 14. LICENSE
**Table**: `licenses`
**Purpose**: Represents licenses and permits
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `license_type` (VARCHAR 100): Type of license
- `license_number` (VARCHAR 100): License number
- `issuing_authority` (VARCHAR 255): Issuing authority
- `issue_date` (DATE): Issue date
- `expiry_date` (DATE): Expiry date
- `license_status` (VARCHAR 50): Status (ACTIVE, EXPIRED, SUSPENDED)
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 15. DECLARATION
**Table**: `declarations`
**Purpose**: Represents asset/income declarations
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `declaration_type` (VARCHAR 100): Type (ANNUAL, CANDIDATE, EXIT)
- `declaration_year` (INTEGER): Declaration year
- `submission_date` (DATE): Submission date
- `income` (DECIMAL 15,2): Total income
- `assets_value` (DECIMAL 15,2): Total assets value
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 16. TAX_STATUS
**Table**: `tax_status`
**Purpose**: Represents tax compliance status
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `tax_id` (VARCHAR 50): Tax identification number
- `tax_status` (VARCHAR 50): Status (COMPLIANT, DELINQUENT, UNDER_REVIEW)
- `tax_debt` (DECIMAL 15,2): Outstanding tax debt
- `last_payment_date` (DATE): Last payment date
- `tax_authority` (VARCHAR 255): Tax authority
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 17. DEBT
**Table**: `debts`
**Purpose**: Represents outstanding debts
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `debt_type` (VARCHAR 100): Type (BANKRUPTCY, LOAN, TAX, COURT)
- `creditor` (VARCHAR 255): Creditor name
- `amount` (DECIMAL 15,2): Debt amount
- `currency` (VARCHAR 10): Currency code
- `due_date` (DATE): Due date
- `debt_status` (VARCHAR 50): Status (ACTIVE, PAID, DEFAULTED)
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 18. ASSET
**Table**: `assets`
**Purpose**: Represents owned assets
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `asset_type` (VARCHAR 100): Type (REAL_ESTATE, VEHICLE, SECURITIES, CASH)
- `asset_description` (TEXT): Description
- `value` (DECIMAL 15,2): Asset value
- `currency` (VARCHAR 10): Currency code
- `acquisition_date` (DATE): Acquisition date
- `location` (TEXT): Asset location
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 19. TENDER
**Table**: `tenders`
**Purpose**: Represents public procurement tenders
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `tender_id` (VARCHAR 100): Tender ID
- `tender_title` (TEXT): Tender title
- `procuring_entity` (VARCHAR 255): Procuring entity
- `tender_value` (DECIMAL 15,2): Tender value
- `currency` (VARCHAR 10): Currency code
- `award_date` (DATE): Award date
- `tender_status` (VARCHAR 50): Status (PLANNED, ACTIVE, COMPLETED, CANCELLED)
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

### 20. EXECUTIVE_CASE
**Table**: `executive_cases`
**Purpose**: Represents executive proceedings (enforcement)
**Key Fields**:
- `entity_id` (VARCHAR 255, UNIQUE): Unique identifier
- `executive_proceeding_number` (VARCHAR 100): Proceeding number
- `executive_authority` (VARCHAR 255): Executive authority
- `proceeding_type` (VARCHAR 100): Type
- `proceeding_status` (VARCHAR 50): Status
- `initiation_date` (DATE): Initiation date
- `debt_amount` (DECIMAL 15,2): Debt amount
- `confidence` (DECIMAL 5,4): Confidence score
- `metadata` (JSONB): Additional attributes

**Repository**: `EntityRepository` (generic)
**Status**: IMPLEMENTED

## Entity Type Enum

```typescript
export enum EntityType {
  PERSON = 'PERSON',
  COMPANY = 'COMPANY',
  FOP = 'FOP',
  ADDRESS = 'ADDRESS',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  DOCUMENT = 'DOCUMENT',
  DIRECTOR = 'DIRECTOR',
  FOUNDER = 'FOUNDER',
  BENEFICIARY = 'BENEFICIARY',
  RELATIVE = 'RELATIVE',
  COURT_CASE = 'COURT_CASE',
  SANCTION = 'SANCTION',
  LICENSE = 'LICENSE',
  DECLARATION = 'DECLARATION',
  TAX_STATUS = 'TAX_STATUS',
  DEBT = 'DEBT',
  ASSET = 'ASSET',
  TENDER = 'TENDER',
  EXECUTIVE_CASE = 'EXECUTIVE_CASE'
}
```

## Common Fields Across All Entities

All entity tables share these common fields:
- `entity_id` (VARCHAR 255, UNIQUE, NOT NULL): Unique identifier
- `confidence` (DECIMAL 5,4): Confidence score (0.0000-1.0000)
- `created_at` (TIMESTAMP, DEFAULT NOW()): Creation timestamp
- `updated_at` (TIMESTAMP, DEFAULT NOW()): Update timestamp (triggered)
- `metadata` (JSONB): Flexible storage for additional attributes

## Entity Relationships

### Person ↔ Company
- **DIRECTOR**: Person directs company
- **FOUNDER**: Person founded company
- **BENEFICIARY**: Person is beneficial owner of company

### Person ↔ Person
- **RELATIVE**: Family relationships (spouse, child, parent, sibling)

### Entity ↔ Address
- **ADDRESS**: Entity has registered/residential address

### Entity ↔ Contact
- **PHONE**: Entity has phone number
- **EMAIL**: Entity has email address

### Entity ↔ Documents
- **DOCUMENT**: Entity has official documents

### Entity ↔ Legal
- **COURT_CASE**: Entity involved in court proceedings
- **SANCTION**: Entity subject to sanctions
- **LICENSE**: Entity holds licenses
- **EXECUTIVE_CASE**: Entity subject to executive proceedings

### Entity ↔ Financial
- **DECLARATION**: Entity filed declarations
- **TAX_STATUS**: Entity tax compliance status
- **DEBT**: Entity has outstanding debts
- **ASSET**: Entity owns assets
- **TENDER**: Entity participated in tenders

## Repository Pattern

All entities use the generic `EntityRepository` which provides:
- `create(entity)`: Create new entity
- `findById(entityId)`: Find entity by ID
- `findByType(entityType)`: Find all entities of type
- `update(entityId, data)`: Update entity
- `delete(entityId)`: Delete entity
- `search(criteria)`: Search entities by criteria

## Compliance with v7.0 Specification

✅ All 19 canonical entity types implemented
✅ Each entity has dedicated database table
✅ Common fields standardized across all entities
✅ Confidence scoring on all entities
✅ Metadata field for flexibility
✅ Audit trail (created_at, updated_at)
✅ Entity relationships defined
✅ Repository pattern for data access
✅ Type-safe enum for entity types

## Conclusion

The PREDATOR v7.0 canonical model is complete with all 19 entity types fully implemented. Each entity has a dedicated database table, standardized fields, confidence scoring, and proper relationships. The model supports the full range of Ukrainian legal entity data required for the RDP → PREDATOR pipeline.
