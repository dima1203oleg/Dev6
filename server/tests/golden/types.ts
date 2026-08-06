/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Types for Golden Dataset and Validation
 */

// Golden Dataset - Reference data for testing only (never used to fill cards)
export interface GoldenDataset {
  test_ipn: string;
  test_type: 'PERSON' | 'COMPANY' | 'FOP';
  last_verified: Date;
  registry_version: string;
  
  identification: GoldenIdentification;
  addresses: GoldenAddress[];
  contacts: GoldenContact[];
  business_relationships: GoldenBusinessRelationship[];
  court_cases: GoldenCourtCase[];
  enforcement_proceedings: GoldenEnforcementProceeding[];
  sanctions: GoldenSanction[];
  pep_records: GoldenPEPRecord[];
  property: GoldenProperty;
}

export interface GoldenIdentification {
  full_name: string;
  ipn: string;
  birth_date: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  citizenship: string;
  sources: string[];
}

export interface GoldenAddress {
  type: 'REGISTRATION' | 'ACTUAL' | 'HISTORICAL' | 'ALTERNATIVE';
  full_address: string;
  postal_code: string;
  region: string;
  city: string;
  street: string;
  house_number: string;
  apartment?: string;
  period?: {
    from: Date;
    to?: Date;
  };
  source: string;
  record_id: string;
  verified: boolean;
}

export interface GoldenContact {
  type: 'PHONE' | 'EMAIL' | 'OTHER';
  value: string;
  source: string;
  record_id: string;
  verification_status: 'VERIFIED' | 'UNVERIFIED' | 'PROVISIONAL';
  last_verified: Date;
}

export interface GoldenBusinessRelationship {
  company_edrpou: string;
  company_name: string;
  role: 'DIRECTOR' | 'FOUNDER' | 'UBO' | 'OWNER' | 'SIGNATORY' | 'FORMER_ROLE';
  period: {
    from: Date;
    to?: Date;
  };
  source: string;
  record_id: string;
  verified: boolean;
}

export interface GoldenCourtCase {
  case_number: string;
  case_date: Date;
  court: string;
  role: 'PLAINTIFF' | 'DEFENDANT' | 'WITNESS' | 'OTHER';
  case_type: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  source: string;
  record_id: string;
}

export interface GoldenEnforcementProceeding {
  proceeding_number: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  debt_amount?: number;
  creditor?: string;
  source: string;
  record_id: string;
  last_updated: Date;
}

export interface GoldenSanction {
  sanction_list: string;
  sanction_type: string;
  effective_date: Date;
  source: string;
  record_id: string;
  notes?: string;
}

export interface GoldenPEPRecord {
  pep_list: string;
  position: string;
  country: string;
  effective_date: Date;
  source: string;
  record_id: string;
}

export interface GoldenProperty {
  real_estate: GoldenRealEstate[];
  vehicles: GoldenVehicle[];
  land_plots: GoldenLandPlot[];
  licenses: GoldenLicense[];
  customs_profile?: GoldenCustomsProfile;
}

export interface GoldenRealEstate {
  type: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND';
  address: string;
  area?: number;
  ownership_type: string;
  source: string;
  record_id: string;
}

export interface GoldenVehicle {
  type: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string;
  source: string;
  record_id: string;
}

export interface GoldenLandPlot {
  cadastral_number: string;
  area: number;
  address: string;
  category: string;
  source: string;
  record_id: string;
}

export interface GoldenLicense {
  type: string;
  number: string;
  issued_date: Date;
  expiry_date?: Date;
  issuing_authority: string;
  source: string;
  record_id: string;
}

export interface GoldenCustomsProfile {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  last_activity: Date;
  total_imports?: number;
  total_exports?: number;
  source: string;
  record_id: string;
}

// Validation Results
export interface GoldenValidationResult {
  category: string;
  field_name: string;
  expected: any;
  actual: any;
  match: boolean;
  discrepancy_type: 'NONE' | 'TECHNICAL_ERROR' | 'REGISTRY_CHANGE' | 'DATA_MISMATCH' | 'MISSING_DATA' | 'EXTRA_DATA';
  discrepancy_reason?: string;
  source?: string;
  timestamp: Date;
}

export interface GoldenDiagnostics {
  category: string;
  issue_type: 'UNAVAILABLE_REGISTRY' | 'API_ERROR' | 'CONNECTOR_ERROR' | 'REGISTRY_STRUCTURE_CHANGE' | 
                'PARSER_ERROR' | 'NORMALIZATION_ERROR' | 'ENTITY_RESOLUTION_ERROR' | 
                'DEDUPLICATION_ERROR' | 'CACHE_ERROR' | 'DATABASE_ERROR' | 
                'BACKEND_ERROR' | 'GRAPH_ENGINE_ERROR' | 'FRONTEND_ERROR' | 'UI_DISPLAY_ERROR';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affected_fields: string[];
  suggested_actions: string[];
  self_healable: boolean;
}

export interface GoldenValidationReport {
  test_ipn: string;
  test_timestamp: Date;
  golden_dataset_version: string;
  overall_status: 'PASS' | 'FAIL' | 'PARTIAL' | 'REGISTRY_CHANGE_DETECTED';
  
  category_results: {
    identification: ValidationResultSummary;
    addresses: ValidationResultSummary;
    contacts: ValidationResultSummary;
    business_relationships: ValidationResultSummary;
    court_cases: ValidationResultSummary;
    enforcement_proceedings: ValidationResultSummary;
    sanctions: ValidationResultSummary;
    pep_records: ValidationResultSummary;
    property: ValidationResultSummary;
  };
  
  ui_validation: ValidationResultSummary;
  
  diagnostics: GoldenDiagnostics[];
  self_healing_actions: SelfHealingAction[];
  
  registry_changes_detected: RegistryChange[];
  
  summary: {
    total_fields_checked: number;
    fields_matched: number;
    fields_mismatched: number;
    fields_missing: number;
    fields_extra: number;
    technical_errors: number;
    registry_changes: number;
  };
}

export interface ValidationResultSummary {
  total: number;
  matched: number;
  mismatched: number;
  missing: number;
  extra: number;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
}

export interface SelfHealingAction {
  action_type: 'RETRY_REQUEST' | 'UPDATE_CACHE' | 'CHECK_CONNECTOR' | 'CHECK_REGISTRY_STRUCTURE' | 
                 'REBUILD_MAPPING' | 'REBUILD_ENTITY_CARD' | 'REPEAT_UI_TEST';
  executed: boolean;
  success: boolean;
  timestamp: Date;
  result?: string;
}

export interface RegistryChange {
  registry: string;
  field: string;
  previous_value: any;
  new_value: any;
  change_date: Date;
  verified: boolean;
}
