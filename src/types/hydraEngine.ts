/**
 * PREDATOR HYDRA VERIFIED DATA ENGINE v2.0
 * Master Architecture & Provenance Specification Types
 */

export type FactEvidenceStatus = 
  | "VERIFIED"           // 🟢 Official source + valid cryptographic evidence
  | "CORROBORATED"       // 🔵 Corroborated by ≥2 independent sources
  | "CONFLICTED"         // 🟠 Contradiction detected between sources
  | "UNVERIFIED"         // ⚪ Insufficient evidence
  | "SOURCE_UNAVAILABLE" // 🔴 Real endpoint unreachable / Fail-Closed
  | "STALE";             // 🟡 Verified but expired/outdated

export interface EvidenceRecord {
  evidence_id: string;
  source_id: string;
  source_record_id?: string | null;
  query: string;
  raw_payload_hash: string; // SHA-256
  normalized_payload_hash?: string | null;
  retrieved_at: string;
  published_at?: string | null;
  http_status?: number | null;
  content_type?: string | null;
  connector_version: string;
  schema_version: string;
  source_authority: string;
  source_tier: "TIER_1_OFFICIAL_REGISTRY" | "TIER_2_GOVT_PORTAL" | "TIER_3_GLOBAL_LIST" | "TIER_4_OSINT";
  signature_verified: boolean;
  tls_verified: boolean;
  freshness_status: "LIVE" | "CACHED" | "STALE" | "EXPIRED";
  validation_status: "PASS" | "SCHEMA_MISMATCH" | "SEMANTIC_ERROR" | "FAIL_CLOSED";
  evidence_status: FactEvidenceStatus;
}

export interface EvidenceChainEntry {
  evidence_id: string;
  payload_hash: string;
  previous_hash: string | null;
  chain_hash: string;
  created_at: string;
}

export interface VerifiedFact {
  fact_id: string;
  entity_id: string;
  attribute: string;
  value: any;
  status: FactEvidenceStatus;
  confidence: number;
  identity_confidence: number; // e.g. EDRPOU match = 0.998
  fact_confidence: number;     // e.g. Active tax debt = 0.985
  source_ids: string[];
  evidence_ids: string[];
  first_seen: string;
  last_seen: string;
  valid_from?: string | null;
  valid_to?: string | null;
  independent_source_count: number;
  contradiction_count: number;
  freshness_score: number;
  authority_score: number;
  generated_at: string;
}

export interface ContradictionRecord {
  contradiction_id: string;
  entity_id: string;
  attribute: string;
  values: Array<{
    value: any;
    source_id: string;
    evidence_id: string;
    retrieved_at: string;
  }>;
  sources: string[];
  detected_at: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  temporal_resolution?: string;
}

export interface SourceTrust {
  source_id: string;
  source_name: string;
  authority_score: number;   // 0.0 - 1.0
  authenticity_score: number; // 0.0 - 1.0
  freshness_score: number;    // 0.0 - 1.0
  completeness_score: number; // 0.0 - 1.0
  stability_score: number;   // 0.0 - 1.0
}

export interface SearchPhase {
  phase: number;
  name: string;
  sources: Array<{
    source_id: string;
    priority: number;
    reason: string;
  }>;
}

export interface SearchPlan {
  query: string;
  entity_type: string;
  identifiers: Record<string, string>;
  phases: SearchPhase[];
  generated_at: string;
}
