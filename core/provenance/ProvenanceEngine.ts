// core/provenance/ProvenanceEngine.ts
// Cryptographic Provenance Engine (§21)

import crypto from 'crypto';

export interface FieldProvenance {
  source_id: string;
  source_url: string;
  resource_id: string;
  dataset_id: string;
  retrieved_at: string;
  published_at: string | null;
  record_id: string;
  record_hash: string;
  source_version: string;
  schema_version: string;
  parser_version: string;
  mapping_version: string;
  normalizer_version: string;
  entity_resolution_version: string;
  card_contract_version: string;
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
    datasetId: string,
    recordId: string,
    options: {
      publishedAt?: string;
      sourceVersion?: string;
      schemaVersion?: string;
      parserVersion?: string;
      mappingVersion?: string;
      normalizerVersion?: string;
      entityResolutionVersion?: string;
      cardContractVersion?: string;
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
      dataset_id: datasetId,
      retrieved_at: now,
      published_at: options.publishedAt || null,
      record_id: recordId,
      record_hash: recordHash,
      source_version: options.sourceVersion || '1.0',
      schema_version: options.schemaVersion || '1.0',
      parser_version: options.parserVersion || '1.0',
      mapping_version: options.mappingVersion || '1.0',
      normalizer_version: options.normalizerVersion || '1.0',
      entity_resolution_version: options.entityResolutionVersion || '1.0',
      card_contract_version: options.cardContractVersion || '1.0',
      verification_status: options.verificationStatus || 'FACT',
      confidence: options.confidence ?? 1.0
    };

    return {
      data,
      provenance
    };
  }
}
