/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Types for IPN Search Validation
 */

export type FieldStatus = 'VERIFIED' | 'CONFLICT' | 'NOT_FOUND' | 'RESTRICTED' | 'CACHED' | 'BLOCKED';
export type OverallStatus = 'SUCCESS' | 'PARTIAL' | 'CONFLICT' | 'BLOCKED' | 'NO_DATA' | 'RESTRICTED';

export interface FieldProvenance {
  source: string;
  record_id: string;
  timestamp: Date;
  raw_fragment: string;
  normalized_value: any;
  confidence: number;
  status: FieldStatus;
}

export interface UIField {
  field_name: string;
  value: any;
  status: FieldStatus;
  provenance: FieldProvenance[];
  conflicts?: FieldProvenance[];
}

export interface UICardHeader {
  full_name?: string;
  ipn: string;
  entity_type: string;
  entity_id: string;
  confidence_score: number;
  data_completeness: number;
  sources_responded: number;
  conflicts_count: number;
  last_updated: Date;
  overall_status: OverallStatus;
}

export interface UICardStructure {
  header: UICardHeader;
  profile_fields: UIField[];
  provenance_blocks: Map<string, FieldProvenance[]>;
}

export interface SourceResponse {
  source_id: string;
  success: boolean;
  http_code: number;
  response_time_ms: number;
  raw_response: string;
  error_message?: string;
  fields_returned: string[];
}

export interface SearchExecution {
  ipn: string;
  sources_queried: string[];
  sources_responded: SourceResponse[];
  sources_failed: SourceResponse[];
  total_execution_time_ms: number;
  timestamp: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScenarioTestResult {
  scenario_name: string;
  passed: boolean;
  duration_ms: number;
  validation_results: {
    ipn_acceptance: ValidationResult;
    source_routing: ValidationResult;
    raw_response_storage: ValidationResult;
    field_verification: ValidationResult;
    provenance_display: ValidationResult;
    conflict_visibility: ValidationResult;
    absence_honesty: ValidationResult;
    no_fabrication: ValidationResult;
    repeatability: ValidationResult;
  };
  ui_card: UICardStructure;
  search_execution: SearchExecution;
  notes: string[];
}

export interface UIIntegrationTestReport {
  test_ipn: string;
  timestamp: Date;
  scenarios: ScenarioTestResult[];
  summary: {
    total_scenarios: number;
    passed: number;
    failed: number;
    overall_passed: boolean;
  };
  critical_failures: string[];
}
