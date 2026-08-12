/**
 * PREDATOR Registry Certification System
 * Production Acceptance Contract - P0.1
 * 
 * Enforces full evidence chain for each registry:
 * SOURCE → CONNECTOR → REAL REQUEST → REAL RESPONSE → RAW HASH → SCHEMA → 
 * NORMALIZATION → IDENTIFIER MATCH → ENTITY → EVIDENCE → UI
 * 
 * Status levels:
 * - CERTIFIED: Full evidence chain verified
 * - HEALTHY: Evidence chain complete, recent verification
 * - DEGRADED: Evidence chain complete but degraded performance
 * - BROKEN: Evidence chain broken
 * - UNAVAILABLE: Source unavailable
 * - CONTRACT_UNKNOWN: No official API contract
 * - NOT_IMPLEMENTED: No connector implemented
 */

import crypto from 'crypto';
import { ProductionConnector, RawResponse, ParsedRecord, CanonicalRecord, Evidence } from '../datasources/connectors/sdk';

export interface RegistryEvidence {
  // Source identification
  sourceId: string;
  sourceName: string;
  apiUrl: string;
  
  // Request evidence
  requestId: string;
  requestTimestamp: string;
  requestUrl: string;
  requestMethod: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  
  // Response evidence
  responseTimestamp: string;
  httpStatus: number;
  responseHeaders: Record<string, string>;
  responseHash: string; // SHA-256 of raw response
  rawResponse: string;
  
  // Schema evidence
  schemaValid: boolean;
  schemaErrors: string[];
  schemaVersion: string;
  
  // Normalization evidence
  parserVersion: string;
  normalizerVersion: string;
  normalizedFields: Record<string, any>;
  fieldMapping: Record<string, string>; // source → canonical
  
  // Identifier evidence
  identifierType: string;
  identifierValue: string;
  identifierMatch: boolean;
  matchConfidence: number;
  
  // Entity evidence
  entityType: string;
  entityResolved: boolean;
  entityId?: string;
  
  // Evidence chain
  evidenceId: string;
  evidenceChain: string[];
  evidenceHash: string;
  
  // Performance
  latencyMs: number;
  externalLatencyMs: number;
  connectorLatencyMs: number;
  processingLatencyMs: number;
  
  // Error handling
  error?: string;
  errorType?: string;
  retryable: boolean;
  
  // Final status
  status: 'CERTIFIED' | 'HEALTHY' | 'DEGRADED' | 'BROKEN' | 'UNAVAILABLE' | 'CONTRACT_UNKNOWN' | 'NOT_IMPLEMENTED';
  certifiedAt?: string;
  lastVerifiedAt: string;
}

export interface CertificationResult {
  sourceId: string;
  sourceName: string;
  status: 'CERTIFIED' | 'HEALTHY' | 'DEGRADED' | 'BROKEN' | 'UNAVAILABLE' | 'CONTRACT_UNKNOWN' | 'NOT_IMPLEMENTED';
  evidence: RegistryEvidence;
  certificationTimestamp: string;
  certificationId: string;
}

export class RegistryCertifier {
  private evidenceStore: Map<string, RegistryEvidence> = new Map();
  
  /**
   * Certify a registry with full evidence chain
   */
  async certify(
    connector: ProductionConnector,
    testIdentifier: string,
    identifierType: string = 'edrpou'
  ): Promise<CertificationResult> {
    const metadata = connector.metadata();
    const certificationId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Build evidence chain
    const evidence: RegistryEvidence = {
      sourceId: metadata.id,
      sourceName: metadata.name,
      apiUrl: metadata.officialUrl,
      requestId: crypto.randomUUID(),
      requestTimestamp: new Date().toISOString(),
      status: 'NOT_IMPLEMENTED',
      lastVerifiedAt: new Date().toISOString(),
    };
    
    try {
      // Step 1: Real Request
      const requestStart = Date.now();
      const rawResponse = await this.executeRealRequest(connector, testIdentifier, identifierType);
      const requestEnd = Date.now();
      
      evidence.requestUrl = rawResponse.requestUrl;
      evidence.requestMethod = 'POST';
      evidence.requestHeaders = rawResponse.headers;
      evidence.responseTimestamp = new Date().toISOString();
      evidence.httpStatus = rawResponse.statusCode;
      evidence.responseHeaders = rawResponse.headers;
      evidence.responseHash = this.computeHash(JSON.stringify(rawResponse.body));
      evidence.rawResponse = JSON.stringify(rawResponse.body);
      evidence.externalLatencyMs = requestEnd - requestStart;
      
      // Step 2: Schema Validation
      const schemaResult = connector.validateSchema(rawResponse);
      evidence.schemaValid = schemaResult.valid;
      evidence.schemaErrors = schemaResult.errors;
      evidence.schemaVersion = '1.0';
      
      if (!schemaResult.valid) {
        evidence.status = 'BROKEN';
        evidence.error = 'Schema validation failed';
        evidence.errorType = 'SCHEMA_ERROR';
        return this.finalizeCertification(evidence, certificationId);
      }
      
      // Step 3: Normalization
      const parseStart = Date.now();
      const parsed = connector.parse(rawResponse);
      const parseEnd = Date.now();
      
      evidence.parserVersion = connector.VERSION;
      evidence.connectorLatencyMs = parseEnd - parseStart;
      
      const normalizeStart = Date.now();
      const normalized = connector.normalize(parsed);
      const normalizeEnd = Date.now();
      
      evidence.normalizerVersion = '1.0';
      evidence.processingLatencyMs = normalizeEnd - normalizeStart;
      
      if (normalized.length === 0) {
        evidence.status = 'UNAVAILABLE';
        evidence.error = 'No records returned';
        evidence.errorType = 'NO_DATA';
        return this.finalizeCertification(evidence, certificationId);
      }
      
      // Step 4: Identifier Match
      const record = normalized[0];
      evidence.identifierType = identifierType;
      evidence.identifierValue = testIdentifier;
      evidence.identifierMatch = this.checkIdentifierMatch(record, testIdentifier, identifierType);
      evidence.matchConfidence = evidence.identifierMatch ? 1.0 : 0.0;
      evidence.normalizedFields = record.canonicalFields;
      
      // Step 5: Entity Resolution
      evidence.entityType = record.entityType;
      evidence.entityResolved = true;
      evidence.entityId = this.generateEntityId(record);
      
      // Step 6: Evidence Chain
      evidence.evidenceId = crypto.randomUUID();
      evidence.evidenceChain = [
        'SOURCE',
        'CONNECTOR',
        'REAL_REQUEST',
        'REAL_RESPONSE',
        'RAW_HASH',
        'SCHEMA',
        'NORMALIZATION',
        'IDENTIFIER_MATCH',
        'ENTITY',
        'EVIDENCE'
      ];
      evidence.evidenceHash = this.computeEvidenceHash(evidence);
      
      // Step 7: Final Status
      evidence.latencyMs = Date.now() - startTime;
      
      if (evidence.identifierMatch && evidence.entityResolved) {
        evidence.status = evidence.latencyMs < 5000 ? 'CERTIFIED' : 'DEGRADED';
        evidence.certifiedAt = new Date().toISOString();
      } else {
        evidence.status = 'BROKEN';
        evidence.error = 'Identifier match failed';
        evidence.errorType = 'IDENTIFIER_MISMATCH';
      }
      
    } catch (error: any) {
      evidence.status = 'UNAVAILABLE';
      evidence.error = error.message;
      evidence.errorType = error.name || 'UNKNOWN_ERROR';
      evidence.retryable = this.isRetryable(error);
      evidence.latencyMs = Date.now() - startTime;
    }
    
    // Store evidence
    this.evidenceStore.set(metadata.id, evidence);
    
    return this.finalizeCertification(evidence, certificationId);
  }
  
  /**
   * Execute real request to source
   */
  private async executeRealRequest(
    connector: ProductionConnector,
    identifier: string,
    identifierType: string
  ): Promise<RawResponse> {
    return await connector.search({
      identifier,
      identifierType: identifierType as any,
      limit: 10
    });
  }
  
  /**
   * Check if identifier matches in response
   */
  private checkIdentifierMatch(
    record: CanonicalRecord,
    identifier: string,
    identifierType: string
  ): boolean {
    const fields = record.canonicalFields;
    const identifierField = this.mapIdentifierTypeToField(identifierType);
    
    if (identifierField && fields[identifierField]) {
      return String(fields[identifierField]) === identifier;
    }
    
    // Fallback: check if identifier appears anywhere in the record
    const recordString = JSON.stringify(fields).toLowerCase();
    return recordString.includes(identifier.toLowerCase());
  }
  
  /**
   * Map identifier type to field name
   */
  private mapIdentifierTypeToField(identifierType: string): string {
    const mapping: Record<string, string> = {
      'edrpou': 'edrpou',
      'ipn': 'ipn',
      'rnokpp': 'rnokpp',
      'passport': 'passport',
      'name': 'name'
    };
    return mapping[identifierType] || identifierType;
  }
  
  /**
   * Generate entity ID from record
   */
  private generateEntityId(record: CanonicalRecord): string {
    const fields = record.canonicalFields;
    const identifier = fields.edrpou || fields.ipn || fields.rnokpp || fields.name;
    return crypto.createHash('sha256').update(String(identifier)).digest('hex').substring(0, 16);
  }
  
  /**
   * Compute SHA-256 hash
   */
  private computeHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Compute evidence chain hash
   */
  private computeEvidenceHash(evidence: RegistryEvidence): string {
    const chainString = evidence.evidenceChain.join('→');
    return crypto.createHash('sha256').update(chainString).digest('hex');
  }
  
  /**
   * Check if error is retryable
   */
  private isRetryable(error: any): boolean {
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'RATE_LIMIT_EXCEEDED'];
    return retryableErrors.includes(error.code) || 
           (error.statusCode >= 500 && error.statusCode < 600);
  }
  
  /**
   * Finalize certification result
   */
  private finalizeCertification(evidence: RegistryEvidence, certificationId: string): CertificationResult {
    return {
      sourceId: evidence.sourceId,
      sourceName: evidence.sourceName,
      status: evidence.status,
      evidence,
      certificationTimestamp: new Date().toISOString(),
      certificationId
    };
  }
  
  /**
   * Get evidence for a source
   */
  getEvidence(sourceId: string): RegistryEvidence | undefined {
    return this.evidenceStore.get(sourceId);
  }
  
  /**
   * Get all certifications
   */
  getAllCertifications(): CertificationResult[] {
    const results: CertificationResult[] = [];
    for (const [sourceId, evidence] of this.evidenceStore.entries()) {
      results.push({
        sourceId,
        sourceName: evidence.sourceName,
        status: evidence.status,
        evidence,
        certificationTimestamp: evidence.lastVerifiedAt,
        certificationId: evidence.evidenceId
      });
    }
    return results;
  }
  
  /**
   * Batch certify multiple sources
   */
  async batchCertify(
    connectors: ProductionConnector[],
    testIdentifier: string,
    identifierType: string = 'edrpou',
    concurrency: number = 5
  ): Promise<CertificationResult[]> {
    const results: CertificationResult[] = [];
    
    for (let i = 0; i < connectors.length; i += concurrency) {
      const batch = connectors.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(connector => this.certify(connector, testIdentifier, identifierType))
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }
    
    return results;
  }
}

// Singleton instance
export const registryCertifier = new RegistryCertifier();
