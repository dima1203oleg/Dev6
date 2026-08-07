# Source → Card Matrix

**Creation Date**: 2026-08-08  
**Purpose**: Map data sources to card types for RDP integration

## Canonical Sources (from canonical-source-registry.ts)

| Source ID | Name | Category | Capabilities | Target Cards |
|-----------|------|----------|--------------|--------------|
| ua.edr | Єдиний державний реєстр (ЄДР) | corporate | person, company, fop | RegistryCard, PassportCard |
| ua.courts | Єдиний державний реєстр судових рішень (ЄДРСР) | legal | person, company, court_case | CourtCasesCard, LegalLinksCard |
| ua.tax | ДПС - Податковий борг | financial | company, fop | TaxSignalsCard |
| ua.sanctions | Державний реєстр санкцій РНБО | sanctions | person, company | SanctionsCard |
| ua.debtors | Єдиний реєстр боржників (ЄРБ) | legal | person, company, fop | ExecutionsCard, CourtAndDebtCard |
| ua.bankruptcy | Реєстр справ про банкрутство | legal | company, fop | CourtCasesCard, LegalLinksCard |
| ua.ckan_data_gov | Єдиний державний вебпортал відкритих даних | corporate | person, company, fop, tender, vehicle | RegistryCard, ProcurementCard, PropertyCard |

## Card Types (from UI components)

| Card Type | Component | Data Requirements | Source Mapping |
|-----------|-----------|------------------|----------------|
| RegistryCard | RegistryCard.tsx | Entity registry data | ua.edr, ua.ckan_data_gov |
| PassportCard | PassportCard.tsx | Passport/ID data | ua.edr |
| SanctionsCard | SanctionsCard.tsx | Sanctions data | ua.sanctions |
| LicensesCard | LicensesCard.tsx | License data | ua.edr, ua.tax |
| AddressCard | AddressCard.tsx | Address data | ua.edr, ua.ckan_data_gov |
| ProcurementCard | ProcurementCard.tsx | Procurement/tender data | ua.ckan_data_gov |
| CourtCasesCard | CourtCasesCard.tsx | Court case data | ua.courts, ua.bankruptcy |
| ExecutionsCard | ExecutionsCard.tsx | Execution/enforcement data | ua.debtors |
| DeclarationsCard | DeclarationsCard.tsx | Declaration data | ua.tax |
| TaxSignalsCard | TaxSignalsCard.tsx | Tax/debt data | ua.tax |
| AIAnalyticsCard | AIAnalyticsCard.tsx | AI analysis | Multiple sources |
| NetworkCard | NetworkCard.tsx | Relationship data | Multiple sources |
| RiskCard | RiskCard.tsx | Risk assessment | Multiple sources |
| ChronologyCard | ChronologyCard.tsx | Timeline data | Multiple sources |
| FamilyLinksCard | FamilyLinksCard.tsx | Family relationships | ua.edr |
| LegalLinksCard | LegalLinksCard.tsx | Legal relationships | ua.courts, ua.bankruptcy |
| CourtAndDebtCard | CourtAndDebtCard.tsx | Court and debt data | ua.courts, ua.debtors |
| PropertyCard | PropertyCard.tsx | Property/asset data | ua.ckan_data_gov |
| LandCard | LandCard.tsx | Land/real estate data | ua.ckan_data_gov |

## RDP Dataset → Card Mapping

### data.gov.ua Datasets

| Dataset Category | Example Datasets | Target Cards | Mapping Status |
|------------------|-----------------|--------------|----------------|
| Corporate Registry | Єдиний державний реєстр юридичних осіб | RegistryCard, PassportCard | ❌ NOT MAPPED |
| Tax Registry | Реєстр платників податків | TaxSignalsCard, LicensesCard | ❌ NOT MAPPED |
| Court Decisions | Реєстр судових рішень | CourtCasesCard, LegalLinksCard | ❌ NOT MAPPED |
| Sanctions | Реєстр санкцій | SanctionsCard | ❌ NOT MAPPED |
| Licenses | Реєстр ліцензій | LicensesCard | ❌ NOT MAPPED |
| Debtors | Реєстр боржників | ExecutionsCard, CourtAndDebtCard | ❌ NOT MAPPED |
| Enforcement | Виконавчі провадження | ExecutionsCard | ❌ NOT MAPPED |
| Procurement | Prozorro закупівлі | ProcurementCard | ❌ NOT MAPPED |
| Subsidies | Реєстр субсидій | RegistryCard | ❌ NOT MAPPED |
| Benefits | Реєстр пільг | RegistryCard | ❌ NOT MAPPED |
| Charitable Orgs | Реєстр благодійних організацій | RegistryCard | ❌ NOT MAPPED |
| FOP Registry | Реєстр ФОП | RegistryCard, TaxSignalsCard | ❌ NOT MAPPED |
| Public Orgs | Реєстр громадських об'єднань | RegistryCard | ❌ NOT MAPPED |
| Political Parties | Реєстр політичних партій | RegistryCard | ❌ NOT MAPPED |
| Trade Unions | Реєстр профспілок | RegistryCard | ❌ NOT MAPPED |
| Notaries | Реєстр нотаріусів | LicensesCard | ❌ NOT MAPPED |

## Mapping Implementation Status

### ❌ NO MAPPING IMPLEMENTED

**Current State:**
- RDP fetches data from data.gov.ua
- RDP stores data in catalog format
- RDP does not transform data to card format
- RDP does not map datasets to card types
- RDP does not generate card-specific data structures

**Missing Implementation:**
1. Dataset → Card type mapping logic
2. Data transformation to card format
3. Card-specific data extraction
4. Card metadata generation
5. Card evidence chain creation

## Required Implementation

### Priority: HIGH

1. **Create Mapping Configuration**:
   - Define dataset → card type mappings
   - Define field mappings for each card
   - Define transformation rules
   - Define validation rules

2. **Implement Transformation Layer**:
   - Transform RDP data to card format
   - Extract card-specific fields
   - Generate card metadata
   - Create card evidence chains

3. **Implement Card Generation**:
   - Generate cards from RDP data
   - Populate card fields
   - Attach provenance to cards
   - Validate card data

4. **Implement Card Routing**:
   - Route data to appropriate cards
   - Handle multi-card scenarios
   - Handle card dependencies
   - Handle card updates

## Conclusion

**Source → Card Matrix Status**: ❌ NOT IMPLEMENTED

The source to card mapping is completely missing. RDP data is not transformed into card format, and there is no mapping between datasets and card types. This is a **critical blocker** for:
- Displaying RDP data in cards
- Card data population
- Card evidence chains
- Card validation

**Recommendation**: Implement source → card mapping before production certification.
