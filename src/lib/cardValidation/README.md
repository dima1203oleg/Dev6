# Card-Level Production Validation & Data Completeness Certification Framework v1.0

## Overview

This framework provides a comprehensive certification system for validating all information cards in the PREDATOR Analytics platform. It ensures that each card is properly filled with verified data from real sources before the platform can be certified as production-ready.

## Core Principles

1. **No card is tested just because it opens** - Each card must pass the full validation cycle
2. **Empty ≠ No Data** - Root cause analysis must be performed before concluding data is absent
3. **Evidence-based validation** - Every field must have provenance and confidence scores
4. **Production-ready threshold** - Platform must meet strict criteria for certification

## Validation Cycle

```
Open Card → Frontend Rendering → API Request → Backend Processing → 
Connector Execution → Registry Response → Normalization → Database Storage → 
Analytics → Evidence Validation → UI Rendering → PASS / FAIL
```

## Card Status Types

- **PASS** - Card fully filled with confirmed data
- **WARNING** - Card partially filled, reasons documented
- **NO_DATA** - Verified absence of information in checked sources
- **FAIL** - Technical or logical error requiring fix

## Usage

### Basic Validation

```typescript
import { CardValidator } from '@/lib/cardValidation';
import { CanonicalEntity } from '@/lib/types/predator';

const entity: CanonicalEntity = { /* ... */ };
const cardData = { /* ... */ };

const result = CardValidator.validateCard(
  'passport',
  'Паспортні документи',
  'passport',
  entity,
  cardData
);

console.log(result.status); // 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL'
console.log(result.completionPercentage); // 0-100
console.log(result.confidenceScore); // 0-100
```

### Full Certification

```typescript
import { CertificationEngine } from '@/lib/cardValidation';

const controlRnokpp = '3111724753';
const entity: CanonicalEntity = { /* ... */ };
const cardDataMap = new Map<string, any>();
// Populate cardDataMap with data for each card

const report = await CertificationEngine.runCertification(
  controlRnokpp,
  entity,
  cardDataMap
);

console.log(report.productionHealthIndex.isProductionReady); // boolean
console.log(report.finalConclusion); // string
```

### Card Preview UI

```typescript
import { CardValidationPreview } from '@/components/ui/CardValidationPreview';
import { CertificationEngine } from '@/lib/cardValidation';

const previews = CertificationEngine.generateCardPreviews(report.cardResults);

<CardValidationPreview 
  previews={previews}
  onCardClick={(cardId) => console.log(cardId)}
/>
```

### Detailed Audit UI

```typescript
import { CardAuditDetail } from '@/components/ui/CardAuditDetail';

<CardAuditDetail 
  validationResult={cardResult}
  onClose={() => console.log('close')}
/>
```

### Certification Report UI

```typescript
import { CertificationReport } from '@/components/ui/CertificationReport';

<CertificationReport 
  report={certificationReport}
  onRetest={() => console.log('retest')}
/>
```

## Card Registry

The framework includes a registry of 21 information cards that must be validated:

### Critical Cards (must PASS for production)
- Загальна інформація (General Information)
- Паспортні документи (Passport Documents)
- Реєстрація місця проживання (Address Registration)
- Юридичні особи (Legal Entities)
- Бенефіціарна участь (Beneficial Participation)
- Судові справи (Court Cases)
- Виконавчі провадження (Enforcement Proceedings)
- Податкова інформація (Tax Information)
- Санкції (Sanctions)
- Ризики (Risks)

### Non-Critical Cards
- Сімейний стан (Family Status)
- Родичі (Relatives)
- Діти (Children)
- Частки власності (Ownership Shares)
- Нерухомість (Real Estate)
- Транспорт (Transport)
- Бізнес-зв'язки (Business Connections)
- Телефони (Phones)
- Email
- Соціальні мережі (Social Media)
- AI-аналітика (AI Analytics)

## Field-Level Audit

Each field in a card includes:
- Value
- Source
- Registry
- Connector
- Retrieved timestamp
- Raw JSON
- SHA-256 Hash
- Confidence Score (0-100)
- Connector Version
- Normalizer Version
- Status (VERIFIED/UNVERIFIED/CONFLICT/MISSING)

## Root Cause Analysis

For empty or failed cards, the framework automatically performs RCA:

1. API Check
2. Authorization Check
3. Response Check
4. Connector Check
5. Normalization Check
6. Database Storage Check
7. Cache Check
8. Analytics Module Check
9. Frontend Check

## Production Health Index

The overall health score is calculated from:

- **Card Coverage** (40%): Weighted average of all card statuses
- **Data Freshness** (20%): Based on last update timestamp
- **Source Reliability** (20%): Based on number of unique sources
- **API Health** (20%): Measured from actual API calls

### Production Ready Criteria

- No failed critical cards
- Card coverage score ≥ 80%
- Overall health index ≥ 80%

## Control Profile Testing

Use the control profile for comprehensive testing:

```
РНОКПП (ІПН): 3111724753
```

This profile should trigger:
1. Search across all available registries
2. Entity profile construction
3. Relationship graph building
4. Risk calculation
5. Card population
6. Display verification
7. Quality report generation

## Integration with Existing Cards

To integrate validation with existing card components:

```typescript
import { CardValidator } from '@/lib/cardValidation';

// In your card component
export const PassportCard: React.FC<PassportCardProps> = ({ entity, passportData }) => {
  const validationResult = CardValidator.validateCard(
    'passport',
    'Паспортні документи',
    'passport',
    entity,
    passportData
  );

  return (
    <div className="relative">
      {/* Status indicator */}
      <div className={`absolute top-2 right-2 ${getStatusColor(validationResult.status)}`}>
        {validationResult.status}
      </div>
      
      {/* Card content */}
      {/* ... */}
    </div>
  );
};
```

## API Reference

### CardValidator

- `validateCard(cardId, cardName, category, entity, cardData)`: Validates a single card
- Returns: `CardValidationResult`

### CertificationEngine

- `runCertification(controlRnokpp, entity, cardDataMap)`: Runs full certification
- `generateCardPreviews(cardResults)`: Generates quick status overview
- `retestFailedCards(report, entity, cardDataMap)`: Retests after fixes
- Returns: `CertificationReport`

### Types

- `CardStatus`: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL'
- `CardCategory`: 21 predefined categories
- `FieldAudit`: Detailed field information
- `CardValidationResult`: Complete validation result
- `CardPreview`: Quick status overview
- `CardCoverageScore`: Coverage statistics
- `ProductionHealthIndex`: Overall health metrics
- `CertificationReport`: Final certification report

## Best Practices

1. **Always validate before production deployment**
2. **Use the control profile for regression testing**
3. **Investigate WARNING status cards before release**
4. **Monitor Production Health Index in production**
5. **Keep connector versions updated**
6. **Document any custom validation rules**
7. **Run certification after any data source changes**

## Troubleshooting

### Card shows NO_DATA but data exists
- Check RCA details in validation result
- Verify connector is functioning
- Check API authentication
- Verify normalization logic

### Card shows FAIL
- Check error messages in validation result
- Review field conflicts
- Verify data source availability
- Check connector version compatibility

### Low confidence scores
- Verify data source reliability
- Check for conflicting data
- Review evidence claims
- Update normalization rules

## Future Enhancements

- [ ] Automated fix suggestions for common issues
- [ ] Historical trend analysis for card quality
- [ ] Integration with CI/CD pipeline
- [ ] Real-time monitoring dashboard
- [ ] Automated regression testing
- [ ] Custom validation rule builder
