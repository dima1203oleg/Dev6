/**
 * DEV5 v2.0 - PREDATOR Analytics Enterprise Intelligence Specification Types
 */

export * from "./hydraEngine";

export type EntityType = 
  | "PERSON"
  | "COMPANY"
  | "FOP"
  | "ADDRESS"
  | "PHONE"
  | "EMAIL"
  | "DOCUMENT"
  | "DIRECTOR"
  | "FOUNDER"
  | "BENEFICIARY"
  | "RELATIVE"
  | "COURT_CASE"
  | "SANCTION"
  | "LICENSE"
  | "DECLARATION"
  | "TAX_STATUS"
  | "DEBT"
  | "ASSET"
  | "TENDER"
  | "EXECUTIVE_CASE"
  | "UNKNOWN";

export type VerificationStatus = 
  | "CONFIRMED"
  | "SINGLE_SOURCE"
  | "UNVERIFIED"
  | "CONFLICT"
  | "NO_DATA"
  | "STALE"
  | "OFFLINE";

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "CLEAN";

export interface EntityAttribute {
  key: string;
  value: string | number | boolean;
  confidence: number; // 0-100
  sourceId: string;
  verified: boolean;
  masked?: boolean;
}

export interface EntityRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  targetName: string;
  type: string; // "DIRECTOR", "FOUNDER", "BENEFICIARY", "TRANSACTION", "COUNTERPARTY", etc.
  risk: RiskLevel;
  confidence: number;
  validFrom?: string;
  validTo?: string;
  evidenceIds: string[];
}

export interface EvidenceClaim {
  id: string;
  claim: string;
  subjectId?: string;
  predicate?: string;
  object?: any;
  sourceId: string;
  sourceType: "REGISTRY" | "SANCTIONS" | "LEAK" | "MEDIA" | "DOCUMENT" | "CRYPTO_INDEX" | "CKAN" | "OSINT";
  sourceName: string;
  sourceUrl?: string;
  retrievedAt: string;
  publishedAt?: string;
  contentHash: string;
  rawHash?: string;
  parserName?: string;
  confidence: number; // 0.0 - 1.0 or 0-100
  status: VerificationStatus;
  verifiedStatus?: "VERIFIED" | "UNVERIFIED" | "DISPUTED";
}

export interface IntelligenceDossier {
  entity: CanonicalEntity;
  status: VerificationStatus;
  identityMatchScore: number;
  sourcesCount: number;
  lastCheckedAt: string;
  keyMetrics: {
    fopCount: number;
    companyCount: number;
    directorshipCount: number;
    beneficiaryCount: number;
    relatedPersonsCount: number;
    vehicleCount: number;
    fineCount: number;
    courtCount: number;
    enforcementCount: number;
    sanctionMatch: "YES" | "NO" | "POSSIBLE";
    riskFactorsCount: number;
  };
  claims: EvidenceClaim[];
  relationships: EntityRelationship[];
  assets: any[];
  vehicles: any[];
  fines: any[];
  courts: any[];
  enforcements: any[];
  sanctions: any[];
  timeline: any[];
  riskProfile: {
    score: number;
    level: RiskLevel;
    drivers: {
      factor: string;
      risk: RiskLevel;
      evidenceId: string;
    }[];
  };
  dataQuality: {
    completeness: number;
    freshness: number;
    confirmedClaims: number;
    unverifiedClaims: number;
    contradictions: number;
  };
  metadata: {
    mode: "PRODUCTION" | "SANDBOX" | "DEMO";
    generatedAt: string;
    orchestratorVersion: string;
  };
}

export interface CanonicalEntity {
  id: string;
  type: EntityType;
  canonicalName: string;
  aliases: string[];
  identifiers: {
    edrpou?: string;
    ipn?: string;
    passport?: string;
    vin?: string;
    walletAddress?: string;
    registrationNumber?: string;
    [key: string]: string | undefined;
  };
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  confidenceScore: number; // 0-100
  sourcesCount: number;
  evidenceClaims: EvidenceClaim[];
  createdAt: string;
  updatedAt: string;
}

// Data Provenance Model
export interface DataProvenanceChain {
  entityId: string;
  claims: EvidenceClaim[];
  verificationSteps: {
    timestamp: string;
    agentOrSystem: string;
    action: string;
    status: "SUCCESS" | "WARNING" | "FAILED";
    details: string;
  }[];
  overallTrustScore: number;
}

// RBAC & Governance
export type UserRole = 
  | "VIEWER"
  | "ANALYST"
  | "SENIOR_ANALYST"
  | "INVESTIGATOR"
  | "SUPERVISOR"
  | "ADMIN"
  | "SUPER_ADMIN";

export type Permission = 
  | "entity.read"
  | "entity.search"
  | "entity.export"
  | "graph.read"
  | "investigation.create"
  | "investigation.share"
  | "source.read"
  | "source.admin"
  | "connector.admin"
  | "ai.use"
  | "ai.admin"
  | "user.admin"
  | "system.admin";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  permissions: Permission[];
  mfaEnabled: boolean;
  token: string;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  role: UserRole;
  tenantId: string;
  action: 
    | "LOGIN"
    | "SEARCH"
    | "ENTITY_VIEW"
    | "ENTITY_EXPORT"
    | "QUERY_DSL"
    | "AI_REQUEST"
    | "AI_TOOL_CALL"
    | "DOCUMENT_VIEW"
    | "DOCUMENT_DOWNLOAD"
    | "INVESTIGATION_CREATE"
    | "INVESTIGATION_SHARE"
    | "ADMIN_CHANGE"
    | "CONNECTOR_CHANGE";
  resource: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  requestId: string;
  result: "SUCCESS" | "DENIED" | "ERROR";
  riskScore: number;
}

// AI Task Router Registry
export type AiTaskType = 
  | "CLASSIFICATION"
  | "ENTITY_EXTRACTION"
  | "ENTITY_RESOLUTION"
  | "SUMMARIZATION"
  | "RISK_ANALYSIS"
  | "INVESTIGATION"
  | "RAG"
  | "OCR"
  | "VISION"
  | "TRANSCRIPTION"
  | "TRANSLATION"
  | "REPORT_GENERATION"
  | "SQL_GENERATION"
  | "QUERY_PLANNING";

export interface AiTaskConfig {
  task: AiTaskType;
  preferredModel: string;
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  costLimitUsd: number;
  privacyLevel: "STRICT" | "INTERNAL" | "PUBLIC";
}

// Query DSL
export interface QueryDslRequest {
  resourceId?: string;
  entityType?: EntityType;
  filters: {
    field: string;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "like";
    value: any;
  }[];
  sort?: {
    field: string;
    direction: "asc" | "desc";
  }[];
  limit: number; // max 500
  offset?: number;
}

// Investigation Workspace Model
export interface InvestigationWorkspace {
  id: string;
  title: string;
  description: string;
  leadInvestigator: string;
  status: "ACTIVE" | "ARCHIVED" | "CLOSED" | "UNDER_REVIEW";
  createdAt: string;
  updatedAt: string;
  entities: CanonicalEntity[];
  relationships: EntityRelationship[];
  evidenceBoard: EvidenceClaim[];
  notes: {
    id: string;
    author: string;
    content: string;
    timestamp: string;
  }[];
  queriesHistory: string[];
  riskSummary: {
    overallRisk: number;
    highestRiskEntity: string;
    threatCategory: string;
  };
}
