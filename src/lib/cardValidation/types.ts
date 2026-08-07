/**
 * Card-Level Production Validation & Data Completeness Certification Framework v1.0
 * Type definitions for card validation system
 */

export type CardStatus = 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL';

export type CardCategory = 
  | 'general'
  | 'passport'
  | 'address'
  | 'family'
  | 'relatives'
  | 'children'
  | 'legal_entities'
  | 'ownership'
  | 'beneficial'
  | 'court_cases'
  | 'enforcement'
  | 'tax'
  | 'sanctions'
  | 'real_estate'
  | 'transport'
  | 'business_connections'
  | 'phones'
  | 'email'
  | 'social_media'
  | 'risks'
  | 'ai_analytics';

export interface FieldAudit {
  fieldName: string;
  value: any;
  source: string;
  registry: string;
  connector: string;
  retrievedAt: string;
  rawJson: string;
  sha256Hash: string;
  confidenceScore: number;
  connectorVersion: string;
  normalizerVersion: string;
  status: 'VERIFIED' | 'UNVERIFIED' | 'CONFLICT' | 'MISSING';
}

export interface CardValidationResult {
  cardId: string;
  cardName: string;
  category: CardCategory;
  status: CardStatus;
  completionPercentage: number;
  sourceCount: number;
  lastUpdated: string;
  confidenceScore: number;
  fields: FieldAudit[];
  warnings: string[];
  errors: string[];
  rootCauseAnalysis?: RootCauseAnalysis;
}

export interface RootCauseAnalysis {
  step: string;
  status: 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  details: string;
  timestamp: string;
}

export interface CardPreview {
  cardId: string;
  cardName: string;
  status: CardStatus;
  completionPercentage: number;
  sourceCount: number;
  lastUpdated: string;
  confidenceScore: number;
}

export interface CardCoverageScore {
  totalCards: number;
  passedCards: number;
  warningCards: number;
  noDataCards: number;
  failedCards: number;
  overallScore: number;
}

export interface ProductionHealthIndex {
  cardCoverage: CardCoverageScore;
  dataFreshness: number;
  sourceReliability: number;
  apiHealth: number;
  overallHealth: number;
  isProductionReady: boolean;
}

export interface CertificationReport {
  controlProfile: {
    rnokpp: string;
    testedAt: string;
  };
  cardResults: CardValidationResult[];
  cardCoverageScore: CardCoverageScore;
  productionHealthIndex: ProductionHealthIndex;
  registriesUsed: string[];
  errorsFound: string[];
  fixesApplied: string[];
  retestResults: any;
  finalConclusion: string;
  generatedAt: string;
}
