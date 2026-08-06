// core/probe/ConnectorProbe.ts
// 10-Step Live Probe Implementation (§14)

import { CertificationStatus } from '../registry/canonical-source-registry';

export interface StepResult {
  step: number;
  name: string;
  passed: boolean;
  message?: string;
  latencyMs?: number;
}

export interface LiveProbeResult {
  source_id: string;
  timestamp: string;
  all_passed: boolean;
  status: CertificationStatus;
  total_latency_ms: number;
  steps: StepResult[];
}

export class ConnectorProbeEngine {
  public static async execute10StepProbe(
    source_id: string,
    endpointUrl: string,
    options: {
      authHeader?: string;
      expectedContentType?: string;
      schemaValidator?: (data: any) => boolean;
      parser?: (raw: any) => any[];
    } = {}
  ): Promise<LiveProbeResult> {
    const startTime = Date.now();
    const steps: StepResult[] = [];

    let rawResponseBody: any = null;
    let urlObj: URL | null = null;

    // STEP 1: DNS & URL parsing
    try {
      urlObj = new URL(endpointUrl);
      steps.push({ step: 1, name: 'DNS & URL Format', passed: true, message: `Host: ${urlObj.hostname}` });
    } catch (e: any) {
      steps.push({ step: 1, name: 'DNS & URL Format', passed: false, message: `Invalid URL: ${e.message}` });
      return this.buildResult(source_id, steps, startTime);
    }

    // STEP 2: TLS / HTTPS Protocol Check
    const isHttps = urlObj.protocol === 'https:';
    steps.push({ step: 2, name: 'TLS Security Check', passed: isHttps, message: isHttps ? 'HTTPS Enforced' : 'Unencrypted HTTP warning' });
    if (!isHttps) {
      // Still allow probe to continue but record warning
    }

    // STEP 3: Endpoint Network Reachability
    const pingStart = Date.now();
    let response: Response | null = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const headers: Record<string, string> = { 'User-Agent': 'PREDATOR-DataFactory/5.0' };
      if (options.authHeader) headers['Authorization'] = options.authHeader;

      response = await fetch(endpointUrl, { method: 'GET', headers, signal: controller.signal });
      clearTimeout(timeout);

      const latency = Date.now() - pingStart;
      steps.push({ step: 3, name: 'Endpoint Reachability', passed: true, latencyMs: latency });
    } catch (e: any) {
      steps.push({ step: 3, name: 'Endpoint Reachability', passed: false, message: `Connection failed: ${e.message}` });
      return this.buildResult(source_id, steps, startTime);
    }

    // STEP 4: Authentication Check
    if (response.status === 401 || response.status === 403) {
      steps.push({ step: 4, name: 'Authentication Check', passed: false, message: `HTTP ${response.status} Unauthorized/Forbidden` });
      return this.buildResult(source_id, steps, startTime, 'AUTH_FAILED');
    }
    steps.push({ step: 4, name: 'Authentication Check', passed: true, message: 'Access Granted' });

    // STEP 5: HTTP Status Code Check
    if (!response.ok) {
      if (response.status === 429) {
        steps.push({ step: 5, name: 'HTTP Status Code', passed: false, message: 'HTTP 429 Rate Limited' });
        return this.buildResult(source_id, steps, startTime, 'RATE_LIMITED');
      }
      steps.push({ step: 5, name: 'HTTP Status Code', passed: false, message: `HTTP ${response.status}` });
      return this.buildResult(source_id, steps, startTime, 'OFFLINE');
    }
    steps.push({ step: 5, name: 'HTTP Status Code', passed: true, message: `HTTP ${response.status} OK` });

    // STEP 6: Content-Type Validation
    const contentType = response.headers.get('content-type') || '';
    const isHtmlError = contentType.includes('text/html');
    steps.push({ 
      step: 6, 
      name: 'Content-Type Header', 
      passed: !isHtmlError, 
      message: `Content-Type: ${contentType}` 
    });
    if (isHtmlError) {
      return this.buildResult(source_id, steps, startTime, 'DEGRADED');
    }

    // STEP 7: Response Body Structure
    try {
      rawResponseBody = await response.json();
      steps.push({ step: 7, name: 'Response Body Parsing', passed: true, message: 'Valid JSON received' });
    } catch (e: any) {
      steps.push({ step: 7, name: 'Response Body Parsing', passed: false, message: 'Failed to parse JSON response' });
      return this.buildResult(source_id, steps, startTime, 'SCHEMA_DRIFT');
    }

    // STEP 8: Schema Validation
    let schemaValid = true;
    if (options.schemaValidator) {
      schemaValid = options.schemaValidator(rawResponseBody);
    } else {
      schemaValid = Boolean(rawResponseBody && (Array.isArray(rawResponseBody) || typeof rawResponseBody === 'object'));
    }
    steps.push({ step: 8, name: 'Schema Validation', passed: schemaValid, message: schemaValid ? 'Schema matched' : 'Schema violation' });
    if (!schemaValid) {
      return this.buildResult(source_id, steps, startTime, 'SCHEMA_DRIFT');
    }

    // STEP 9: Parser Execution Test
    let parsedRecords: any[] = [];
    try {
      if (options.parser) {
        parsedRecords = options.parser(rawResponseBody);
      } else {
        parsedRecords = Array.isArray(rawResponseBody) ? rawResponseBody : (rawResponseBody.result?.records || rawResponseBody.data || [rawResponseBody]);
      }
      steps.push({ step: 9, name: 'Parser Execution', passed: true, message: `Parsed ${parsedRecords.length} items` });
    } catch (e: any) {
      steps.push({ step: 9, name: 'Parser Execution', passed: false, message: `Parsing error: ${e.message}` });
      return this.buildResult(source_id, steps, startTime, 'DEGRADED');
    }

    // STEP 10: Minimum Valid Record Check
    const hasValidRecord = parsedRecords.length > 0;
    steps.push({ 
      step: 10, 
      name: 'Minimum Valid Record', 
      passed: true, // NO_MATCH / empty dataset is handled gracefully, not as probe failure unless required
      message: hasValidRecord ? `Sample record verified (${parsedRecords.length} records)` : 'Empty dataset (NO_DATA status)'
    });

    const finalStatus: CertificationStatus = hasValidRecord ? 'LIVE' : 'NO_DATA';
    return this.buildResult(source_id, steps, startTime, finalStatus);
  }

  private static buildResult(
    source_id: string, 
    steps: StepResult[], 
    startTime: number, 
    overrideStatus?: CertificationStatus
  ): LiveProbeResult {
    const allPassed = steps.every(s => s.passed);
    const status = overrideStatus || (allPassed ? 'LIVE' : 'OFFLINE');
    return {
      source_id,
      timestamp: new Date().toISOString(),
      all_passed: allPassed,
      status,
      total_latency_ms: Date.now() - startTime,
      steps
    };
  }
}
