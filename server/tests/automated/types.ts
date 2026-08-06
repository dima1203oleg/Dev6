/**
 * PREDATOR Analytics - Automated Test Framework
 * Core Types and Interfaces
 */

export type TestStatus = 'PASS' | 'FAIL' | 'PASS_WITH_WARNINGS' | 'PARTIAL' | 'BLOCKED' | 'NOT_APPLICABLE';
export type FinalStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'PARTIAL' | 'FAIL' | 'BLOCKED' | 'NOT_APPLICABLE';

export interface SourceConfig {
  source_id: string;
  source_name: string;
  owner: string;
  country: string;
  category: string;
  access_level: string;
  official_url: string;
  endpoint_or_resource: string;
  connector_id: string;
  connector_version: string;
  protocol: string;
  format: string;
  encoding: string;
  auth_type: string;
  supported_entities: string[];
  supported_identifiers: string[];
  update_frequency: string;
  rate_limit: number;
  schema_version: string;
  production_ready: boolean;
}

export interface TestResult {
  test_id: string;
  test_name: string;
  status: TestStatus;
  duration_ms: number;
  timestamp: Date;
  details: Record<string, any>;
  errors: string[];
  warnings: string[];
}

export interface RawResponse {
  body: string;
  headers: Record<string, string>;
  content_type: string;
  size_bytes: number;
  checksum: string;
  sha256_hash: string;
  http_code: number;
}

export interface ParsedData {
  data: any;
  parser_version: string;
  parse_errors: string[];
  parse_warnings: string[];
}

export interface ProvenanceRecord {
  source_id: string;
  record_id: string;
  timestamp: Date;
  parser_version: string;
  confidence: number;
  raw_fragment: string;
}

export interface FreshnessInfo {
  last_updated: Date | null;
  age_seconds: number | null;
  ttl_seconds: number | null;
  cache_status: 'HIT' | 'MISS' | 'STALE' | 'UNKNOWN';
}

export interface PerformanceMetrics {
  latency_ms: number;
  throughput_rps: number;
  cpu_usage_percent: number;
  memory_usage_mb: number;
  retry_count: number;
}

export interface SecurityTestResult {
  sql_injection: boolean;
  xss: boolean;
  ssrf: boolean;
  idor: boolean;
  secret_leakage: boolean;
  path_traversal: boolean;
  command_injection: boolean;
}

export interface SourceTestReport {
  registry_id: string;
  registry_name: string;
  endpoint: string;
  access_type: string;
  query_status: TestStatus;
  http_code: number;
  response_time_ms: number;
  data_returned: boolean;
  provenance_complete: boolean;
  freshness_acceptable: boolean;
  conflicts_detected: number;
  confidence_score: number;
  final_status: FinalStatus;
  qa_notes: string[];
  test_results: TestResult[];
  raw_response?: RawResponse;
  parsed_data?: ParsedData;
  provenance?: ProvenanceRecord[];
  freshness?: FreshnessInfo;
  performance?: PerformanceMetrics;
  security?: SecurityTestResult;
}

export interface SummaryReport {
  total_sources: number;
  passed: number;
  passed_with_warnings: number;
  partial: number;
  failed: number;
  blocked: number;
  not_applicable: number;
  needs_work: number;
  using_fallback: number;
  provenance_violations: number;
  has_conflicts: number;
  production_ready: number;
  critical_sources_passed: boolean;
  hallucination_free: boolean;
  all_provenance_complete: boolean;
  conflicts_documented: boolean;
  results_reproducible: boolean;
  logging_complete: boolean;
  automated_tests_passed: boolean;
  production_ready_overall: boolean;
}

export interface TestContext {
  source_config: SourceConfig;
  test_ipn: string;
  start_time: Date;
  timeout_ms: number;
  retry_count: number;
  environment: 'QA' | 'INTEGRATION' | 'PRODUCTION';
}

export interface FaultInjectionScenario {
  name: string;
  type: 'timeout' | 'http_500' | 'http_429' | 'tls_error' | 'dns_error' | 'broken_json' | 'empty_response';
  expected_behavior: string;
  actual_behavior: string;
  handled_gracefully: boolean;
}
