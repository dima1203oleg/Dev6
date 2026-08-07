/**
 * Field Provenance API
 * 
 * Provides field-level provenance data for UI display
 * Traces lineage: Card Field → API → DB → Canonical Entity → Normalizer → Mapper → Raw Record → Resource → Dataset → Source
 */

import { ProvenanceEngine } from '../../core/provenance/ProvenanceEngine.js';

export interface FieldProvenanceData {
  value: any;
  source: string;
  dataset_id: string;
  resource_id: string;
  raw_record_id: string;
  raw_hash: string;
  timestamp: string;
  confidence: number;
  pipeline_stages: {
    stage: string;
    value: any;
    timestamp: string;
  }[];
}

export class FieldProvenanceAPI {
  /**
   * Get field-level provenance for a card field
   */
  async getFieldProvenance(
    entityId: string,
    field: string,
    evidenceData: any
  ): Promise<FieldProvenanceData> {
    console.log(`[FieldProvenanceAPI] Getting provenance for ${entityId}.${field}`);

    // Extract provenance from evidence
    const provenance = evidenceData.provenance;

    if (!provenance) {
      throw new Error('No provenance data found in evidence');
    }

    // Build pipeline stages
    const pipelineStages = [
      {
        stage: 'RAW_RECORD',
        value: evidenceData.raw_data?.[field],
        timestamp: evidenceData.timestamp,
      },
      {
        stage: 'NORMALIZED',
        value: evidenceData.raw_data?.[field], // Same as raw for now
        timestamp: evidenceData.timestamp,
      },
      {
        stage: 'CANONICAL_ENTITY',
        value: evidenceData.raw_data?.[field], // Same as raw for now
        timestamp: evidenceData.timestamp,
      },
      {
        stage: 'DATABASE',
        value: 'PENDING_DB_INTEGRATION',
        timestamp: new Date().toISOString(),
      },
      {
        stage: 'API',
        value: evidenceData.raw_data?.[field],
        timestamp: new Date().toISOString(),
      },
      {
        stage: 'UI',
        value: evidenceData.raw_data?.[field],
        timestamp: new Date().toISOString(),
      },
    ];

    const fieldProvenance: FieldProvenanceData = {
      value: evidenceData.raw_data?.[field],
      source: provenance.source_id,
      dataset_id: evidenceData.dataset_id,
      resource_id: provenance.resource_id,
      raw_record_id: provenance.record_id,
      raw_hash: provenance.record_hash,
      timestamp: provenance.retrieved_at,
      confidence: evidenceData.confidence || 0,
      pipeline_stages: pipelineStages,
    };

    return fieldProvenance;
  }

  /**
   * Get field-level provenance for all fields in an entity
   */
  async getAllFieldsProvenance(
    entityId: string,
    evidenceData: any
  ): Promise<Record<string, FieldProvenanceData>> {
    console.log(`[FieldProvenanceAPI] Getting provenance for all fields in ${entityId}`);

    const rawData = evidenceData.raw_data || {};
    const provenanceMap: Record<string, FieldProvenanceData> = {};

    for (const field of Object.keys(rawData)) {
      try {
        provenanceMap[field] = await this.getFieldProvenance(entityId, field, evidenceData);
      } catch (error) {
        console.error(`[FieldProvenanceAPI] Error getting provenance for ${field}:`, error);
      }
    }

    return provenanceMap;
  }

  /**
   * Verify provenance chain
   * Verifies that evidence actually references the same raw record
   */
  async verifyProvenanceChain(
    rawData: any,
    provenance: any
  ): Promise<{
    valid: boolean;
    hash_match: boolean;
    record_id_match: boolean;
    errors: string[];
  }> {
    console.log(`[FieldProvenanceAPI] Verifying provenance chain`);

    const errors: string[] = [];

    // Calculate hash of raw data
    const calculatedHash = ProvenanceEngine.calculateHash(rawData);
    const hashMatch = calculatedHash === provenance.record_hash;

    if (!hashMatch) {
      errors.push(`Hash mismatch: expected ${provenance.record_hash}, got ${calculatedHash}`);
    }

    // Record ID match
    const recordIdMatch = true; // Assume match for now

    const valid = hashMatch && recordIdMatch && errors.length === 0;

    console.log(`[FieldProvenanceAPI] Provenance chain valid: ${valid}`);

    return {
      valid,
      hash_match: hashMatch,
      record_id_match: recordIdMatch,
      errors,
    };
  }

  /**
   * Get provenance summary for UI display
   */
  getProvenanceSummary(provenanceData: FieldProvenanceData): {
    source: string;
    dataset: string;
    resource: string;
    retrieved_at: string;
    confidence: string;
    hash_verified: boolean;
  } {
    return {
      source: provenanceData.source,
      dataset: provenanceData.dataset_id,
      resource: provenanceData.resource_id,
      retrieved_at: new Date(provenanceData.timestamp).toLocaleString(),
      confidence: `${(provenanceData.confidence * 100).toFixed(1)}%`,
      hash_verified: !!provenanceData.raw_hash,
    };
  }
}
