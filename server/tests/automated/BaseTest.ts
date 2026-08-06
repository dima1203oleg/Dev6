/**
 * PREDATOR Analytics - Automated Test Framework
 * Base Test Class
 */

import { TestContext, TestResult, TestStatus } from './types';

export abstract class BaseTest {
  protected testId: string;
  protected testName: string;

  constructor(testId: string, testName: string) {
    this.testId = testId;
    this.testName = testName;
  }

  abstract execute(context: TestContext): Promise<TestResult>;

  protected createResult(
    status: TestStatus,
    details: Record<string, any>,
    errors: string[] = [],
    warnings: string[] = [],
    durationMs: number
  ): TestResult {
    return {
      test_id: this.testId,
      test_name: this.testName,
      status,
      duration_ms: durationMs,
      timestamp: new Date(),
      details,
      errors,
      warnings
    };
  }

  protected async measureExecution<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; durationMs: number }> {
    const start = Date.now();
    const result = await fn();
    const durationMs = Date.now() - start;
    return { result, durationMs };
  }

  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  protected isValidEndpoint(endpoint: string): boolean {
    if (!endpoint) return false;
    return this.isValidUrl(endpoint);
  }
}
