# PREDATOR v7.0 Card Contracts Report
MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0

## Card Contracts Overview

**Location**: `server/cards/CardContract.ts`
**Purpose**: Machine-readable contracts defining required fields, validation rules, and confidence thresholds for all card types
**Status**: IMPLEMENTED
**Total Card Types**: 13

## Card Contract Interface

```typescript
export interface CardFieldContract {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required: boolean;
  minimum_confidence: number;
  validation_rules: string[];
}

export interface CardContract {
  card_type: string;
  required_fields: CardFieldContract[];
  minimum_card_confidence: number;
  empty_card_allowed: boolean;
  empty_card_reason_required: boolean;
  custom_validation_rules: string[];
}
```

## Card Types and Contracts

### 1. COMPANIES Card

**Purpose**: Display company information from EDR and other sources

**Required Fields**:
- `edrpou` (string, required, min_confidence: 0.95)
  - Validation: EDRPOU format (8 digits)
- `company_name` (string, required, min_confidence: 0.90)
  - Validation: Non-empty string
- `status` (string, required, min_confidence: 0.85)
  - Validation: Valid status (ACTIVE, INACTIVE, LIQUIDATED)
- `address` (string, optional, min_confidence: 0.80)
  - Validation: Valid address format
- `registration_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date, not in future
- `legal_form` (string, optional, min_confidence: 0.80)
  - Validation: Valid legal form

**Minimum Card Confidence**: 0.85
**Empty Card Allowed**: No
**Custom Rules**: EDRPOU must be 8 digits

### 2. PERSONS Card

**Purpose**: Display person information with identifiers

**Required Fields**:
- `full_name` (string, required, min_confidence: 0.90)
  - Validation: Non-empty, contains at least 2 words
- `ipn` (string, optional, min_confidence: 0.95)
  - Validation: IPN format (10 digits)
- `passport` (string, optional, min_confidence: 0.90)
  - Validation: Valid passport format
- `date_of_birth` (date, optional, min_confidence: 0.85)
  - Validation: Valid date, reasonable age
- `address` (string, optional, min_confidence: 0.75)
  - Validation: Valid address format

**Minimum Card Confidence**: 0.80
**Empty Card Allowed**: No
**Custom Rules**: Name must contain at least 2 words

### 3. FOP Card

**Purpose**: Display individual entrepreneur information

**Required Fields**:
- `full_name` (string, required, min_confidence: 0.90)
  - Validation: Non-empty, contains at least 2 words
- `ipn` (string, required, min_confidence: 0.95)
  - Validation: IPN format (10 digits)
- `registration_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date, not in future
- `status` (string, optional, min_confidence: 0.80)
  - Validation: Valid FOP status
- `activity_types` (array, optional, min_confidence: 0.75)
  - Validation: Array of KVED codes

**Minimum Card Confidence**: 0.85
**Empty Card Allowed**: No
**Custom Rules**: IPN is required for FOP

### 4. VEHICLES Card

**Purpose**: Display vehicle information

**Required Fields**:
- `vehicle_id` (string, required, min_confidence: 0.90)
  - Validation: Valid vehicle identifier
- `make` (string, required, min_confidence: 0.85)
  - Validation: Non-empty string
- `model` (string, required, min_confidence: 0.85)
  - Validation: Non-empty string
- `year` (number, required, min_confidence: 0.90)
  - Validation: Valid year (1900-2100)
- `license_plate` (string, optional, min_confidence: 0.90)
  - Validation: Valid license plate format

**Minimum Card Confidence**: 0.80
**Empty Card Allowed**: No
**Custom Rules**: Year must be between 1900 and 2100

### 5. ADDRESSES Card

**Purpose**: Display address information

**Required Fields**:
- `full_address` (string, required, min_confidence: 0.85)
  - Validation: Non-empty, contains at least city and country
- `country` (string, required, min_confidence: 0.90)
  - Validation: Valid country name
- `region` (string, optional, min_confidence: 0.80)
  - Validation: Valid region name
- `city` (string, optional, min_confidence: 0.85)
  - Validation: Valid city name
- `street` (string, optional, min_confidence: 0.75)
  - Validation: Valid street name
- `building` (string, optional, min_confidence: 0.75)
  - Validation: Valid building number

**Minimum Card Confidence**: 0.75
**Empty Card Allowed**: No
**Custom Rules**: Address must contain at least city and country

### 6. COURT_CASES Card

**Purpose**: Display court case information

**Required Fields**:
- `case_number` (string, required, min_confidence: 0.90)
  - Validation: Non-empty string
- `court_name` (string, required, min_confidence: 0.85)
  - Validation: Non-empty string
- `case_type` (string, required, min_confidence: 0.80)
  - Validation: Valid case type
- `case_status` (string, required, min_confidence: 0.85)
  - Validation: Valid status (PENDING, ACTIVE, CLOSED)
- `filing_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date
- `decision_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date, after filing date

**Minimum Card Confidence**: 0.80
**Empty Card Allowed**: No
**Custom Rules**: Decision date must be after filing date

### 7. SANCTIONS Card

**Purpose**: Display sanction information

**Required Fields**:
- `sanction_type` (string, required, min_confidence: 0.90)
  - Validation: Valid sanction type
- `sanctioning_authority` (string, required, min_confidence: 0.90)
  - Validation: Non-empty string
- `imposition_date` (date, required, min_confidence: 0.85)
  - Validation: Valid date
- `expiration_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date, after imposition date
- `reason` (string, optional, min_confidence: 0.75)
  - Validation: Non-empty string

**Minimum Card Confidence**: 0.85
**Empty Card Allowed**: No
**Custom Rules**: Expiration date must be after imposition date

### 8. LICENSES Card

**Purpose**: Display license information

**Required Fields**:
- `license_type` (string, required, min_confidence: 0.90)
  - Validation: Valid license type
- `license_number` (string, required, min_confidence: 0.90)
  - Validation: Non-empty string
- `issuing_authority` (string, required, min_confidence: 0.85)
  - Validation: Non-empty string
- `issue_date` (date, required, min_confidence: 0.85)
  - Validation: Valid date
- `expiry_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date, after issue date
- `license_status` (string, optional, min_confidence: 0.85)
  - Validation: Valid status (ACTIVE, EXPIRED, SUSPENDED)

**Minimum Card Confidence**: 0.85
**Empty Card Allowed**: No
**Custom Rules**: Expiry date must be after issue date

### 9. DECLARATIONS Card

**Purpose**: Display asset/income declaration information

**Required Fields**:
- `declaration_type` (string, required, min_confidence: 0.90)
  - Validation: Valid declaration type
- `declaration_year` (number, required, min_confidence: 0.95)
  - Validation: Valid year (2000-current)
- `submission_date` (date, required, min_confidence: 0.85)
  - Validation: Valid date
- `income` (number, optional, min_confidence: 0.80)
  - Validation: Non-negative number
- `assets_value` (number, optional, min_confidence: 0.80)
  - Validation: Non-negative number

**Minimum Card Confidence**: 0.80
**Empty Card Allowed**: No
**Custom Rules**: Declaration year must be reasonable

### 10. TAX_STATUS Card

**Purpose**: Display tax compliance status

**Required Fields**:
- `tax_id` (string, required, min_confidence: 0.90)
  - Validation: Non-empty string
- `tax_status` (string, required, min_confidence: 0.90)
  - Validation: Valid status (COMPLIANT, DELINQUENT, UNDER_REVIEW)
- `tax_debt` (number, optional, min_confidence: 0.85)
  - Validation: Non-negative number
- `last_payment_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date
- `tax_authority` (string, optional, min_confidence: 0.80)
  - Validation: Non-empty string

**Minimum Card Confidence**: 0.85
**Empty Card Allowed**: No
**Custom Rules**: Tax debt must be non-negative

### 11. DEBTS Card

**Purpose**: Display outstanding debt information

**Required Fields**:
- `debt_type` (string, required, min_confidence: 0.90)
  - Validation: Valid debt type
- `creditor` (string, required, min_confidence: 0.85)
  - Validation: Non-empty string
- `amount` (number, required, min_confidence: 0.90)
  - Validation: Positive number
- `currency` (string, required, min_confidence: 0.90)
  - Validation: Valid currency code
- `due_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date
- `debt_status` (string, optional, min_confidence: 0.85)
  - Validation: Valid status (ACTIVE, PAID, DEFAULTED)

**Minimum Card Confidence**: 0.85
**Empty Card Allowed**: No
**Custom Rules**: Amount must be positive

### 12. ASSETS Card

**Purpose**: Display asset information

**Required Fields**:
- `asset_type` (string, required, min_confidence: 0.90)
  - Validation: Valid asset type
- `asset_description` (string, required, min_confidence: 0.80)
  - Validation: Non-empty string
- `value` (number, required, min_confidence: 0.85)
  - Validation: Non-negative number
- `currency` (string, required, min_confidence: 0.90)
  - Validation: Valid currency code
- `acquisition_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date
- `location` (string, optional, min_confidence: 0.75)
  - Validation: Non-empty string

**Minimum Card Confidence**: 0.80
**Empty Card Allowed**: No
**Custom Rules**: Value must be non-negative

### 13. TENDERS Card

**Purpose**: Display public procurement tender information

**Required Fields**:
- `tender_id` (string, required, min_confidence: 0.90)
  - Validation: Non-empty string
- `tender_title` (string, required, min_confidence: 0.85)
  - Validation: Non-empty string
- `procuring_entity` (string, required, min_confidence: 0.85)
  - Validation: Non-empty string
- `tender_value` (number, optional, min_confidence: 0.85)
  - Validation: Non-negative number
- `currency` (string, optional, min_confidence: 0.90)
  - Validation: Valid currency code
- `award_date` (date, optional, min_confidence: 0.85)
  - Validation: Valid date
- `tender_status` (string, optional, min_confidence: 0.85)
  - Validation: Valid status (PLANNED, ACTIVE, COMPLETED, CANCELLED)

**Minimum Card Confidence**: 0.80
**Empty Card Allowed**: No
**Custom Rules**: Tender value must be non-negative

## Card Contract Validator

### Validation Methods

```typescript
class CardContractValidator {
  // Get contract for card type
  getContract(cardType: string): CardContract | null
  
  // Validate card against contract
  validateCard(card: any, cardType: string): ValidationResult
  
  // Check if card is empty
  isEmptyCard(card: any, cardType: string): boolean
  
  // Check if empty card is allowed
  isEmptyCardAllowed(cardType: string, reason?: string): boolean
}
```

### Validation Result

```typescript
interface ValidationResult {
  valid: boolean;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'NO_DATA';
  errors: string[];
  warnings: string[];
  field_results: Record<string, FieldValidationResult>;
  overall_confidence: number;
}
```

### Field Validation Result

```typescript
interface FieldValidationResult {
  field_name: string;
  field_value: any;
  present: boolean;
  meets_confidence: boolean;
  validation_errors: string[];
  confidence: number;
}
```

## Empty Card Policies

### When Empty Cards Are Allowed

Empty cards are only allowed for specific card types when:
1. The card type has `empty_card_allowed: true` in the contract
2. A valid reason is provided (if `empty_card_reason_required: true`)
3. The reason is documented in the card metadata

### Empty Card Reasons

Valid reasons for empty cards:
- `NO_DATA_AVAILABLE`: No data available from any source
- `SOURCE_UNAVAILABLE`: All data sources unavailable
- `ACCESS_DENIED`: Access denied to data sources
- `DATA_EXPIRED`: Data has expired and not refreshed
- `PENDING_REMEDIATION`: Card is pending remediation

## Card Contract Registry

```typescript
export const CARD_CONTRACTS: Record<string, CardContract> = {
  COMPANIES: { /* contract */ },
  PERSONS: { /* contract */ },
  FOP: { /* contract */ },
  VEHICLES: { /* contract */ },
  ADDRESSES: { /* contract */ },
  COURT_CASES: { /* contract */ },
  SANCTIONS: { /* contract */ },
  LICENSES: { /* contract */ },
  DECLARATIONS: { /* contract */ },
  TAX_STATUS: { /* contract */ },
  DEBTS: { /* contract */ },
  ASSETS: { /* contract */ },
  TENDERS: { /* contract */ }
};
```

## Validation Rules

### Common Validation Rules

1. **EDRPOU Format**: Must be exactly 8 digits
2. **IPN Format**: Must be exactly 10 digits
3. **Email Format**: Must be valid email address
4. **Phone Format**: Must be valid phone number
5. **Date Format**: Must be valid ISO 8601 date
6. **Year Range**: Must be between 1900 and 2100
7. **Currency Code**: Must be valid ISO 4217 code
8. **Non-Negative**: Number must be >= 0
9. **Positive**: Number must be > 0
10. **Non-Empty**: String must not be empty

### Custom Validation Rules

Each card type may have custom validation rules specific to:
- Business logic (e.g., decision date after filing date)
- Domain constraints (e.g., reasonable age for person)
- Cross-field validation (e.g., end date after start date)

## Compliance with v7.0 Specification

✅ All 13 card types implemented with contracts
✅ Machine-readable contract format
✅ Field-level validation with type checking
✅ Minimum confidence thresholds per field
✅ Minimum card confidence thresholds
✅ Empty card policies with reason requirements
✅ Custom validation rules per card type
✅ Card contract validator class
✅ Validation result with detailed field results
✅ PASS/WARNING/FAIL/NO_DATA status values

## Conclusion

The PREDATOR v7.0 card contract system is complete with all 13 card types having machine-readable contracts. Each contract defines required fields, validation rules, confidence thresholds, and empty card policies. The system provides comprehensive validation with detailed field-level results and supports automated card generation and validation.
