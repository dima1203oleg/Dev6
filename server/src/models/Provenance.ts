export interface Provenance {
  sourceId: string;
  requestId: string;
  retrievedAt: string;
  responseHash: string; // SHA-256
  rawRecordReference: string; // File path or ID
}
