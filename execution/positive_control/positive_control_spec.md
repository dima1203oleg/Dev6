# Positive Control Specification

**Control Type**: EDRPOU (Company Identifier)  
**Identifier**: 19007752  
**Source**: data.gov.ua  
**Dataset**: Інформація що міститься у Державному реєстрі випусків цінних паперів (акції та облігації)  
**Dataset ID**: 8999b39b-257f-4e0b-9f3a-d80341f8c786  
**Resource ID**: 38dc0b3d-d8d3-4b30-95ed-506eeea8d67f  
**Resource Name**: openri  
**Format**: CSV  
**URL**: https://data.gov.ua/dataset/8999b39b-257f-4e0b-9f3a-d80341f8c786/resource/38dc0b3d-d8d3-4b30-95ed-506eeea8d67f/download/openri_220221.csv

## Raw Record

**CSV Line**:
```
"30/26/1/10";"19007752";"ПАТ";"Публічне акціонерне товариство";"акції";4574;2.10;9605.40;9605.40;"П";"Товариство з обмеженою відповідальністю";"-infinity";"2011-05-25 00:00:00";"";"";"";"";"";"";""
```

**Fields**:
- sertificates_nom: 30/26/1/10
- edrpou: 19007752
- entity_form: ПАТ
- name: Публічне акціонерне товариство
- emis_type_name: акції
- qty: 4574
- nominal: 2.10
- emis_vol: 9605.40
- stat_cap: 9605.40
- releases_form_code: П
- tp_name: Товариство з обмеженою відповідальністю
- reg_date: -infinity
- report_reg_dt: 2011-05-25 00:00:00
- suspend_nom: (empty)
- suspend_dt: (empty)
- resume_nom: (empty)
- resume_dt: (empty)
- cancel_nom: (empty)
- cancel_dt: (empty)
- series: (empty)

## Validation

**EDRPOU Format**: ✅ 8 digits (19007752)  
**Data Source**: ✅ Official government registry (Державний реєстр випусків цінних паперів)  
**Record Type**: ✅ Company/Corporate entity  
**Field Completeness**: ✅ Key fields populated (edrpou, name, entity_form)  
**Not Excluded**: ✅ Not a postal code, building number, or synthetic identifier

## Expected Pipeline Path

1. **Source**: data.gov.ua API
2. **Raw Record**: CSV line from openri_220221.csv
3. **Parser**: CSV parser
4. **Normalizer**: Field mapping to canonical model
5. **Entity**: Company entity with EDRPOU 19007752
6. **Database**: Entity stored in DB
7. **API**: Entity available via API
8. **Card**: Company card generated
9. **Validation**: All fields validated
10. **Truth**: Value consistency verified across pipeline

## Acceptance Criteria

**Positive Control MUST**:
- ✅ Be found in source
- ✅ Have real EDRPOU identifier
- ✅ Pass through entire pipeline
- ✅ Generate entity record
- ✅ Generate evidence record
- ✅ Store in database
- ✅ Be available via API
- ✅ Generate card
- ✅ Pass field validation
- ✅ Pass truth validation

**Status**: READY FOR END-TO-END TEST
