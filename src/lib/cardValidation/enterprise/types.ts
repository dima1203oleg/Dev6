/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Extended type definitions for enterprise-level certification
 */

export * from '../types';
import { CardDefinition } from '../cardRegistry';

// Dynamic Card Registry Types
export interface CardCategoryHierarchy {
  id: string;
  name: string;
  description: string;
  parent?: string;
  children?: CardCategoryHierarchy[];
  cards: CardDefinition[];
}

export interface DynamicCardRegistry {
  version: string;
  lastUpdated: string;
  categories: CardCategoryHierarchy[];
  totalCards: number;
  autoDiscovered: boolean;
}

// UI Discovery Types
export interface DiscoveredCard {
  id: string;
  name: string;
  componentPath: string;
  route: string;
  featureFlag?: string;
  lazy: boolean;
  hidden: boolean;
  discoveredAt: string;
  discoveryMethod: 'DOM' | 'COMPONENT' | 'ROUTE' | 'MANUAL';
}

// Screenshot Validation Types
export interface ScreenshotValidation {
  cardId: string;
  goldenImage: string;
  currentImage: string;
  diffImage?: string;
  pixelDifference: number;
  visualIssues: VisualIssue[];
  status: 'PASS' | 'FAIL' | 'WARNING';
  validatedAt: string;
}

export interface VisualIssue {
  type: 'TEXT_CUTOFF' | 'COLOR_MISMATCH' | 'ICON_BROKEN' | 'EMPTY_BLOCK' | 'ELEMENT_MISALIGNMENT' | 'RESPONSIVE_ISSUE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  description: string;
}

// Live Preview Audit Types
export interface LiveCardAudit {
  cardId: string;
  name: string;
  health: number; // 0-100
  coverage: number; // 0-100
  evidence: number; // 0-100
  sources: number;
  latency: number; // ms
  freshness: number; // 0-100
  aiScore: number; // 0-100
  lastAudit: string;
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
}

// Data Lineage Types
export interface LineageNode {
  id: string;
  type: 'FIELD' | 'REGISTRY' | 'CONNECTOR' | 'RAW_JSON' | 'NORMALIZER' | 'DATABASE' | 'ANALYTICS' | 'RISK_ENGINE' | 'FRONTEND';
  name: string;
  data: any;
  timestamp: string;
  hash?: string;
  confidence: number;
  status: 'VALID' | 'INVALID' | 'CONFLICT';
  children?: LineageNode[];
}

export interface DataLineage {
  fieldName: string;
  root: LineageNode;
  totalNodes: number;
  depth: number;
  hasConflict: boolean;
}

// Cross Registry Consistency Types
export interface RegistrySource {
  registry: string;
  value: any;
  confidence: number;
  timestamp: string;
  sourceUrl?: string;
}

export interface ConflictDetection {
  fieldName: string;
  sources: RegistrySource[];
  hasConflict: boolean;
  conflictType: 'VALUE_MISMATCH' | 'TIMESTAMP_MISMATCH' | 'STRUCTURE_MISMATCH' | 'MISSING_FIELD';
  resolution: ConflictResolution;
}

export interface ConflictResolution {
  winner: string;
  reason: string;
  priority: number;
  confidence: number;
  requiresManualReview: boolean;
}

// Temporal Validation Types
export interface TemporalRecord {
  timestamp: string;
  value: any;
  source: string;
  valid: boolean;
}

export interface TemporalValidation {
  fieldName: string;
  history: TemporalRecord[];
  hasGaps: boolean;
  hasInconsistencies: boolean;
  trend: 'STABLE' | 'INCREASING' | 'DECREASING' | 'FLUCTUATING';
}

// Relationship Validation Types
export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  evidence: string[];
  hash: string;
  confidence: number;
  valid: boolean;
  validationErrors: string[];
}

export interface RelationshipValidation {
  entityId: string;
  edges: RelationshipEdge[];
  totalEdges: number;
  validEdges: number;
  invalidEdges: number;
  overallValid: boolean;
}

// Duplicate Detection Types
export interface DuplicateGroup {
  type: 'PERSON' | 'COMPANY' | 'ADDRESS' | 'PHONE' | 'VEHICLE';
  entities: string[];
  similarity: number;
  confidence: number;
  requiresResolution: boolean;
}

export interface DuplicateDetectionResult {
  groups: DuplicateGroup[];
  totalDuplicates: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

// Evidence Coverage Types
export interface EvidenceCoverage {
  totalFields: number;
  fieldsWithEvidence: number;
  fieldsWithMultipleSources: number;
  coveragePercentage: number;
  multiSourcePercentage: number;
  byRegistry: Record<string, number>;
}

// Explainability Types
export interface FieldExplanation {
  fieldName: string;
  value: any;
  explanation: string;
  reasoning: string[];
  sources: string[];
  confidence: number;
  aiGenerated: boolean;
  aiConfidence?: number;
}

// Smart Remediation Types
export interface Issue {
  id: string;
  type: 'BUG' | 'DATA_INCONSISTENCY' | 'PERFORMANCE' | 'SECURITY' | 'CONFIGURATION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  rootCause: string;
  affectedCards: string[];
  suggestedFix: string;
  adr?: string; // Architecture Decision Record
  knowledgeBaseEntry?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'PREVENTED';
  createdAt: string;
  resolvedAt?: string;
}

// Regression Dependency Graph Types
export interface DependencyNode {
  id: string;
  type: 'CARD' | 'CONNECTOR' | 'REGISTRY' | 'RISK_ENGINE' | 'AI' | 'EXPORT';
  name: string;
  dependsOn: string[];
  affectedBy: string[];
}

export interface RegressionImpact {
  changedNode: string;
  affectedNodes: string[];
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  requiresRevalidation: boolean;
  estimatedRisk: number;
}

// Live Monitoring Types
export interface ContinuousCertificationConfig {
  enabled: boolean;
  intervalMinutes: number;
  alertThreshold: number;
  autoRemediate: boolean;
  notifyChannels: ('EMAIL' | 'SLACK' | 'PAGERDUTY')[];
}

export interface MonitoringAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'CARD_FAILURE' | 'DATA_FRESHNESS' | 'PERFORMANCE' | 'SECURITY' | 'AI_HALLUCINATION';
  message: string;
  affectedCards: string[];
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

// Enterprise Card Passport Types
export interface EnterpriseCardPassport {
  card: {
    id: string;
    name: string;
    owner: string;
    version: string;
    build: string;
    route: string;
    component: string;
  };
  health: {
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    score: number;
    latency: number;
    freshness: number;
  };
  quality: {
    completeness: number;
    accuracy: number;
    consistency: number;
  };
  security: {
    pii: boolean;
    encryption: string;
    permissions: string[];
  };
  performance: {
    render: number;
    api: number;
    db: number;
    graph: number;
  };
  evidence: {
    sources: string[];
    hashes: Record<string, string>;
    lineage: DataLineage;
    confidence: number;
  };
  certification: {
    lastPass: string;
    regression: string;
    chaos: string;
    production: boolean;
  };
}

// Enterprise Acceptance Criteria 2.0 Types
export interface EnterpriseAcceptanceCriteria {
  data: {
    criticalCardsPass: boolean;
    evidenceCoverage: number; // ≥99%
    multiSourceVerification: number; // ≥95%
    crossRegistryConflicts: number; // 0
  };
  quality: {
    completeness: number; // ≥95%
    accuracy: number; // ≥99%
    freshness: boolean;
    consistency: number; // ≥99%
  };
  performance: {
    p50: number; // <300ms
    p95: number; // <500ms
    p99: number; // <800ms
    errorRate: number; // 0
  };
  reliability: {
    chaosTestsPassed: boolean;
    rollbackVerified: boolean;
    rtpRpoMet: boolean;
    dataLoss: boolean;
  };
  ai: {
    allAssertionsHaveSource: boolean;
    allAssertionsHaveEvidence: boolean;
    allAssertionsHaveConfidence: boolean;
    allAssertionsHaveExplainability: boolean;
    noHallucinations: boolean;
  };
  security: {
    criticalVulnerabilities: number; // 0
    highVulnerabilities: number; // 0
    secretsVerified: boolean;
    rbacVerified: boolean;
    auditVerified: boolean;
    loggingVerified: boolean;
  };
  continuousCertification: {
    enabled: boolean;
    lastCheck: string;
    status: 'PASSING' | 'FAILING' | 'DEGRADED';
  };
  overall: {
    certified: boolean;
    score: number;
    expiresAt: string;
  };
}
