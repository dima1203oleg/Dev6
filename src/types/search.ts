import { VerificationStatus, EntityType } from '../types';

export type FactStatus = 'VERIFIED' | 'DERIVED' | 'CONFLICTED' | 'NO_MATCH' | 'UNAVAILABLE';

export interface Fact {
  value: string | number | boolean;
  status: FactStatus;
  source: string;
  retrievedAt: string;
  confidence?: number;
  evidenceId?: string;
  explanation?: string;
  rawPayload?: any; // For the Evidence Modal
}

export interface SummaryBlockData {
  entityType: EntityType;
  keyStatus: VerificationStatus;
  hasMatches: boolean;
  hasConfirmedLinks: boolean;
  hasConflicts: boolean;
  hasRisks: boolean;
  hasUnavailableSources: boolean;
}

export interface IdentityCardData {
  fullName: string;
  identifier: string;
  entityType: EntityType;
  status: VerificationStatus;
  lastConfirmedAt: string;
  trustLevel: number; // 0-100
  sourcesCount: number;
}

export interface SourceCheckData {
  id: string;
  name: string;
  status: 'CHECKED_MATCH' | 'CHECKED_NO_MATCH' | 'UNAVAILABLE' | 'UNSUPPORTED' | 'NEEDS_VERIFICATION';
}

export interface TimelineEvent {
  date: string;
  event: string;
  source: string;
  status: 'NEW' | 'UPDATED' | 'HISTORICAL';
}

// Domain Specific Cards
export interface RegistryCardData {
  registrationNumber: Fact;
  registrationDate: Fact;
  status: Fact;
  activityCategory: Fact;
  relatedChanges: Fact[];
}

export interface FamilyLinkData {
  name: Fact;
  relationType: Fact;
  source: Fact;
  note: 'VERIFIED' | 'CANDIDATE' | 'CONFLICT' | 'INSUFFICIENT_DATA';
}

export interface LegalLinkData {
  role: Fact; // DIRECTOR, FOUNDER, BENEFICIARY, etc.
  targetName: Fact;
  date: Fact;
}

export interface CourtCaseData {
  caseNumber: Fact;
  stage: Fact;
  parties: Fact;
  proceedingType: Fact;
  debtAmount?: Fact;
  date: Fact;
}

export interface SanctionData {
  hasMatch: Fact;
  date: Fact;
  reason: Fact;
  matchType: 'DIRECT' | 'CANDIDATE';
}

export interface ProcurementData {
  tender: Fact;
  role: Fact;
  amount: Fact;
  customer: Fact;
  status: Fact;
  date: Fact;
}

export interface LicenseData {
  type: Fact;
  status: Fact;
  authority: Fact;
  issueDate: Fact;
  validUntil: Fact;
}

export interface AddressData {
  address: Fact;
  type: Fact; // REGISTRATION, ACTUAL, RELATED
  relevance: Fact;
}

export interface RiskData {
  overallScore: Fact;
  factors: Fact[];
  explanation: Fact;
}
