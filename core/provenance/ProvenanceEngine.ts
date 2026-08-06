// core/provenance/ProvenanceEngine.ts
// Cryptographic Provenance Engine (§21)

import crypto from 'crypto';

export interface FieldProvenance {
  source_id: string;
  source_url: string;
  resource_id: string;
  retrieved_at: string;
  published_at: string | null;
  record_id: string;
  record_hash: string;
  dataset_version: string;
  connector_version: string;
  verification_status: 'FACT' | 'DERIVED' | 'HYPOTHESIS' | 'UNKNOWN' | 'CONFLICTED';
  confidence: number;
}

export interface ProvenanceEnvelope<T = any> {
  data: T;
  provenance: FieldProvenance;
}

export class ProvenanceEngine {
  public static calculateHash(payload: any): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  public static createEnvelope<T>(
    data: T,
    sourceId: string,
    sourceUrl: string,
    resourceId: string,
    recordId: string,
    options: {
      publishedAt?: string;
      datasetVersion?: string;
      connectorVersion?: string;
      verificationStatus?: 'FACT' | 'DERIVED' | 'HYPOTHESIS' | 'UNKNOWN' | 'CONFLICTED';
      confidence?: number;
    } = {}
  ): ProvenanceEnvelope<T> {
    const recordHash = this.calculateHash(data);
    const now = new Date().toISOString();

    const provenance: FieldProvenance = {
      source_id: sourceId,
      source_url: sourceUrl,
      resource_id: resourceId,
      retrieved_at: now,
      published_at: options.publishedAt || null,
      record_id: recordId,
      record_hash: recordHash,
      dataset_version: options.datasetVersion || '1.0',
      connector_version: options.connectorVersion || '1.0',
      verification_status: options.verificationStatus || 'FACT',
      confidence: options.confidence ?? 1.0
    };

    return {
      data,
      provenance
    };
  }
}
