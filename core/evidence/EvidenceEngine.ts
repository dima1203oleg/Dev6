// core/evidence/EvidenceEngine.ts
// Raw Immutable Evidence Engine (§22, §23, §24)

import crypto from 'crypto';

export interface EvidenceRecord {
  evidence_id: string;
  source_id: string;
  raw_object: any;
  record_reference: string;
  timestamp: string;
  sha256_hash: string;
  storage_path: string; // MinIO path /raw/{source_id}/{YYYY-MM-DD}/{hash}
}

export class EvidenceEngineService {
  private inMemoryLedger: Map<string, EvidenceRecord> = new Map();

  public createEvidenceRecord(
    source_id: string,
    raw_object: any,
    record_reference: string
  ): EvidenceRecord {
    const serialized = typeof raw_object === 'string' ? raw_object : JSON.stringify(raw_object);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex');
    const timestamp = new Date().toISOString();
    const dateFolder = timestamp.split('T')[0];

    const evidence_id = `EV-${hash.substring(0, 16).toUpperCase()}`;
    const storage_path = `/raw/${source_id}/${dateFolder}/${hash}.json`;

    const record: EvidenceRecord = {
      evidence_id,
      source_id,
      raw_object,
      record_reference,
      timestamp,
      sha256_hash: hash,
      storage_path
    };

    this.inMemoryLedger.set(evidence_id, record);
    return record;
  }

  public async storeEvidence(evidence: any): Promise<any> {
    const record = this.createEvidenceRecord(
      evidence.source_id || 'unknown',
      evidence.raw_document || evidence,
      evidence.query || 'reference'
    );
    return record;
  }

  public getEvidenceById(evidence_id: string): EvidenceRecord | undefined {
    return this.inMemoryLedger.get(evidence_id);
  }

  public getEvidence(evidence_id: string): EvidenceRecord | undefined {
    return this.getEvidenceById(evidence_id);
  }

  public verifyEvidenceIntegrity(record: EvidenceRecord): boolean {
    const serialized = typeof record.raw_object === 'string' ? record.raw_object : JSON.stringify(record.raw_object);
    const recomputedHash = crypto.createHash('sha256').update(serialized).digest('hex');
    return recomputedHash === record.sha256_hash;
  }
}

export const evidenceEngine = new EvidenceEngineService();
export { EvidenceEngineService as EvidenceEngine };

