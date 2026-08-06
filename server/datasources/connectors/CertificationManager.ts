/**
 * PREDATOR MLIP — Certification Manager
 * Enforces production gates and certification lifecycle.
 */
import { TestMatrix, CertificationStatus, SourceStatus, ProductionConnector } from './sdk';

export class CertificationManager {
  private certificationCache = new Map<string, CertificationStatus>();
  private statusCache = new Map<string, SourceStatus>();

  /**
   * Evaluate test results and determine if a connector can be certified.
   */
  evaluateCertification(sourceId: string, testResults: TestMatrix, connector: ProductionConnector): CertificationStatus {
    const meta = connector.metadata();
    
    // Strict rule: no certification for commercial brokers or paid APIs
    if (meta.accessLevel === 'PAID' || meta.accessLevel === 'COMMERCIAL_API' || meta.accessLevel === 'TRIAL_ONLY') {
      this.updateStatus(sourceId, 'NOT_SUPPORTED');
      return 'NOT_CERTIFIED';
    }

    // Must pass all core tests
    const requiredTests = [
      testResults.test_connectivity,
      testResults.test_schema,
      testResults.test_parser,
      testResults.test_normalization,
      testResults.test_evidence,
      testResults.test_provenance,
    ];

    if (requiredTests.some(r => r === 'FAIL')) {
      // Degrade status based on failure type
      if (testResults.test_connectivity === 'FAIL') this.updateStatus(sourceId, 'OFFLINE');
      else if (testResults.test_schema === 'FAIL') this.updateStatus(sourceId, 'SCHEMA_DRIFT');
      else this.updateStatus(sourceId, 'DEGRADED');

      this.certificationCache.set(sourceId, 'FAILED');
      return 'FAILED';
    }

    // All checks passed
    this.certificationCache.set(sourceId, 'CERTIFIED');
    this.updateStatus(sourceId, 'LIVE');
    return 'CERTIFIED';
  }

  getCertificationStatus(sourceId: string): CertificationStatus {
    return this.certificationCache.get(sourceId) || 'NOT_CERTIFIED';
  }

  getSourceStatus(sourceId: string): SourceStatus {
    return this.statusCache.get(sourceId) || 'DISCOVERED';
  }

  private updateStatus(sourceId: string, status: SourceStatus) {
    this.statusCache.set(sourceId, status);
  }
}

export const certificationManager = new CertificationManager();
