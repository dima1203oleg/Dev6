export interface Provenance {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  cached: boolean;
  stale: boolean;
}

export interface DataSourceError {
  code: 'CREDENTIALS_MISSING' | 'UPSTREAM_FAILURE' | 'NO_RECORDS' | 'RATE_LIMITED' | 'TIMEOUT' | 'BAD_REQUEST' | 'SERVER_ERROR';
  message: string;
  sourceUrl?: string;
  attemptedAt: string;
  requiredEnvVar?: string;
}

export type DataSourceResult<T> =
  | {
      ok: true;
      data: T;
      provenance: Provenance;
      dependencies?: string[];
    }
  | {
      ok: false;
      error: DataSourceError;
    };

export interface AggregateStatsMeta {
  basedOnRecords: number;
  coverage: number; // 0..100
  sourceScope: string;
  asOf: string;
  status: 'saturated' | 'partial' | 'empty';
}

export interface RiskSignalItem {
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  weight: number;
  title: string;
  explanation: string;
  sourceRefs: string[];
  timestamps: string;
  recordScope: string;
}

export interface RiskScoringResult {
  totalScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERIFIED';
  signals: RiskSignalItem[];
  meta: AggregateStatsMeta;
  provenance: Provenance;
}
