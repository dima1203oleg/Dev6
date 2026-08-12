/**
 * DPS Connector Test Matrix
 * 
 * Comprehensive test matrix for all 19 DPS endpoints
 * 
 * Status values:
 * - PASS: Test passed with real data
 * - FAIL: Test failed
 * - BLOCKED: Blocked by upstream maintenance
 * - NOT_APPLICABLE: Not applicable for this connector
 * - PENDING_REAL_DATA: Awaiting real DPS data
 */

export type TestStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_APPLICABLE' | 'PENDING_REAL_DATA';

export interface ConnectorTestResult {
  connector: string;
  endpoint: string;
  method: string;
  auth: TestStatus;
  request: TestStatus;
  http: TestStatus;
  schema: TestStatus;
  parser: TestStatus;
  normalizer: TestStatus;
  hydra: TestStatus;
  entity: TestStatus;
  evidence: TestStatus;
  db: TestStatus;
  api: TestStatus;
  ui: TestStatus;
  realData: TestStatus;
  overallStatus: TestStatus;
  lastTested: string;
  notes?: string;
}

export class DPSTestMatrix {
  private results: Map<string, ConnectorTestResult> = new Map();

  /**
   * Initialize test matrix with all 19 endpoints
   */
  initialize(): void {
    const endpoints = [
      // REST Endpoints (13)
      {
        connector: 'Tax Registration',
        endpoint: '/registration',
        method: 'POST',
        primary: true
      },
      {
        connector: 'VAT Payers',
        endpoint: '/pdv_act/list',
        method: 'POST',
        primary: false
      },
      {
        connector: 'Insurers',
        endpoint: '/ev',
        method: 'POST',
        primary: false
      },
      {
        connector: 'Excise',
        endpoint: '/excise',
        method: 'POST',
        primary: false
      },
      {
        connector: 'Goods Operations',
        endpoint: '/cli-zed',
        method: 'POST',
        primary: false
      },
      {
        connector: 'Budget Subsidy',
        endpoint: '/obd',
        method: 'POST',
        primary: false
      },
      {
        connector: 'Non-Profit',
        endpoint: '/non-profit',
        method: 'POST',
        primary: false
      },
      {
        connector: 'RRO',
        endpoint: '/rro',
        method: 'POST',
        primary: false
      },
      {
        connector: 'ORO Books',
        endpoint: '/koro',
        method: 'POST',
        primary: false
      },
      {
        connector: 'Stopped Invoices',
        endpoint: '/inv-stopped',
        method: 'POST',
        primary: false
      },
      {
        connector: 'RRO Instance',
        endpoint: '/rro-instance',
        method: 'POST',
        primary: false
      },
      {
        connector: 'CSO',
        endpoint: '/rro-cso',
        method: 'POST',
        primary: false
      },
      {
        connector: 'Fiscal Checks',
        endpoint: '/rro/chkAll',
        method: 'GET',
        primary: false
      },
      // CSV Endpoints (6)
      {
        connector: 'CSV - VAT Payers',
        endpoint: '/export/pdv',
        method: 'GET',
        primary: false
      },
      {
        connector: 'CSV - Single Tax',
        endpoint: '/export/reestr_edpod',
        method: 'GET',
        primary: false
      },
      {
        connector: 'CSV - Excise Tax',
        endpoint: '/export/reestr_searpse',
        method: 'GET',
        primary: false
      },
      {
        connector: 'CSV - Goods Operations',
        endpoint: '/export/reestr_operac_z_tov',
        method: 'GET',
        primary: false
      },
      {
        connector: 'CSV - Non-Profit',
        endpoint: '/export/reestr_nuo',
        method: 'GET',
        primary: false
      },
      {
        connector: 'CSV - CSO',
        endpoint: '/export/rro_cso',
        method: 'GET',
        primary: false
      }
    ];

    endpoints.forEach(ep => {
      const key = `${ep.connector}:${ep.endpoint}`;
      this.results.set(key, {
        connector: ep.connector,
        endpoint: ep.endpoint,
        method: ep.method,
        auth: 'PENDING_REAL_DATA',
        request: 'PENDING_REAL_DATA',
        http: 'PENDING_REAL_DATA',
        schema: 'PENDING_REAL_DATA',
        parser: 'PENDING_REAL_DATA',
        normalizer: 'PENDING_REAL_DATA',
        hydra: 'PENDING_REAL_DATA',
        entity: 'PENDING_REAL_DATA',
        evidence: 'PENDING_REAL_DATA',
        db: 'PENDING_REAL_DATA',
        api: 'PENDING_REAL_DATA',
        ui: 'PENDING_REAL_DATA',
        realData: 'PENDING_REAL_DATA',
        overallStatus: 'PENDING_REAL_DATA',
        lastTested: new Date().toISOString(),
        notes: ep.primary ? 'PRIMARY ENDPOINT' : undefined
      });
    });
  }

  /**
   * Update test result for a specific connector
   */
  updateResult(
    connector: string,
    endpoint: string,
    updates: Partial<ConnectorTestResult>
  ): void {
    const key = `${connector}:${endpoint}`;
    const existing = this.results.get(key);
    if (existing) {
      this.results.set(key, {
        ...existing,
        ...updates,
        lastTested: new Date().toISOString()
      });
    }
  }

  /**
   * Mark all endpoints as BLOCKED due to upstream maintenance
   */
  markAllBlocked(reason: string): void {
    this.results.forEach((result, key) => {
      this.results.set(key, {
        ...result,
        auth: 'BLOCKED',
        request: 'BLOCKED',
        http: 'BLOCKED',
        schema: 'BLOCKED',
        parser: 'BLOCKED',
        normalizer: 'BLOCKED',
        hydra: 'BLOCKED',
        entity: 'BLOCKED',
        evidence: 'BLOCKED',
        db: 'BLOCKED',
        api: 'BLOCKED',
        ui: 'BLOCKED',
        realData: 'BLOCKED',
        overallStatus: 'BLOCKED',
        lastTested: new Date().toISOString(),
        notes: reason
      });
    });
  }

  /**
   * Get all test results
   */
  getResults(): ConnectorTestResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get results as markdown table
   */
  getMarkdownTable(): string {
    const results = this.getResults();
    
    let markdown = '| Connector | Endpoint | Method | Auth | Request | HTTP | Schema | Parser | Normalizer | HYDRA | Entity | Evidence | DB | API | UI | Real Data | Status |\n';
    markdown += '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';

    results.forEach(r => {
      markdown += `| ${r.connector} | ${r.endpoint} | ${r.method} | ${r.auth} | ${r.request} | ${r.http} | ${r.schema} | ${r.parser} | ${r.normalizer} | ${r.hydra} | ${r.entity} | ${r.evidence} | ${r.db} | ${r.api} | ${r.ui} | ${r.realData} | ${r.overallStatus} |\n`;
    });

    return markdown;
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    total: number;
    pass: number;
    fail: number;
    blocked: number;
    pending: number;
    notApplicable: number;
  } {
    const results = this.getResults();
    return {
      total: results.length,
      pass: results.filter(r => r.overallStatus === 'PASS').length,
      fail: results.filter(r => r.overallStatus === 'FAIL').length,
      blocked: results.filter(r => r.overallStatus === 'BLOCKED').length,
      pending: results.filter(r => r.overallStatus === 'PENDING_REAL_DATA').length,
      notApplicable: results.filter(r => r.overallStatus === 'NOT_APPLICABLE').length
    };
  }

  /**
   * Check if all endpoints are blocked
   */
  isAllBlocked(): boolean {
    const results = this.getResults();
    return results.every(r => r.overallStatus === 'BLOCKED');
  }

  /**
   * Check if production certification is possible
   */
  canCertify(): boolean {
    const summary = this.getSummary();
    return summary.pass === summary.total && summary.fail === 0 && summary.blocked === 0;
  }
}

// Singleton instance
let testMatrixInstance: DPSTestMatrix | null = null;

export function getDPSTestMatrix(): DPSTestMatrix {
  if (!testMatrixInstance) {
    testMatrixInstance = new DPSTestMatrix();
    testMatrixInstance.initialize();
  }
  return testMatrixInstance;
}

export function resetDPSTestMatrix(): void {
  testMatrixInstance = null;
}
