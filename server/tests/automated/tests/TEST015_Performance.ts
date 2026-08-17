/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-015 — Performance
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, PerformanceMetrics } from '../types';

export class TEST015_Performance extends BaseTest {
  constructor() {
    super('TEST-015', 'Performance');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const endpoint = context.source_config.endpoint_or_resource;
        
        // Measure performance metrics
        const metrics = await this.measurePerformance(endpoint, context);
        
        details['latency_ms'] = metrics.latency_ms;
        details['throughput_rps'] = metrics.throughput_rps;
        details['cpu_usage_percent'] = metrics.cpu_usage_percent;
        details['memory_usage_mb'] = metrics.memory_usage_mb;
        details['retry_count'] = metrics.retry_count;
        
        // Evaluate performance against thresholds
        const evaluation = this.evaluatePerformance(metrics);
        details['performance_rating'] = evaluation.rating;
        details['latency_acceptable'] = evaluation.latencyAcceptable;
        details['throughput_acceptable'] = evaluation.throughputAcceptable;
        details['cpu_acceptable'] = evaluation.cpuAcceptable;
        details['memory_acceptable'] = evaluation.memoryAcceptable;
        
        if (!evaluation.latencyAcceptable) {
          warnings.push(`Latency exceeds threshold: ${metrics.latency_ms}ms`);
        }
        
        if (!evaluation.throughputAcceptable) {
          warnings.push(`Throughput below threshold: ${metrics.throughput_rps} RPS`);
        }
        
        if (!evaluation.cpuAcceptable) {
          warnings.push(`CPU usage high: ${metrics.cpu_usage_percent}%`);
        }
        
        if (!evaluation.memoryAcceptable) {
          warnings.push(`Memory usage high: ${metrics.memory_usage_mb}MB`);
        }
        
        // Check for performance degradation
        const degradationCheck = this.checkPerformanceDegradation(metrics);
        details['degradation_detected'] = degradationCheck.detected;
        details['degradation_details'] = degradationCheck.details;
        
        if (degradationCheck.detected) {
          warnings.push(`Performance degradation detected: ${degradationCheck.details.join(', ')}`);
        }
        
      } catch (error) {
        errors.push(`Performance check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private async measurePerformance(endpoint: string, context: TestContext): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    let retryCount = 0;
    
    // Measure latency
    const latencyStart = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), context.timeout_ms);
      
      await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PREDATOR-Analytics-Test/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (error) {
      retryCount++;
    }
    
    const latency = Date.now() - latencyStart;
    
    // Measure throughput (requests per second)
    const throughputStart = Date.now();
    const requestCount = 10;
    let successfulRequests = 0;
    
    for (let i = 0; i < requestCount; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), context.timeout_ms);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PREDATOR-Analytics-Test/1.0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          successfulRequests++;
        }
      } catch (error) {
        retryCount++;
      }
    }
    
    const throughputDuration = (Date.now() - throughputStart) / 1000; // seconds
    const throughput = throughputDuration > 0 ? successfulRequests / throughputDuration : 0;
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMb = memoryUsage.heapUsed / (1024 * 1024);
    
    // Estimate CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    const totalCpuTime = cpuUsage.user + cpuUsage.system;
    const elapsedTime = (Date.now() - startTime) / 1000; // seconds
    const cpuUsagePercent = elapsedTime > 0 ? (totalCpuTime / elapsedTime / 10000) : 0;
    
    return {
      latency_ms: latency,
      throughput_rps: throughput,
      cpu_usage_percent: Math.min(cpuUsagePercent, 100),
      memory_usage_mb: memoryUsageMb,
      retry_count: retryCount
    };
  }

  private evaluatePerformance(metrics: PerformanceMetrics): {
    rating: string;
    latencyAcceptable: boolean;
    throughputAcceptable: boolean;
    cpuAcceptable: boolean;
    memoryAcceptable: boolean;
  } {
    const thresholds = {
      maxLatencyMs: 5000,
      minThroughputRps: 0.5,
      maxCpuPercent: 80,
      maxMemoryMb: 500
    };
    
    const latencyAcceptable = metrics.latency_ms <= thresholds.maxLatencyMs;
    const throughputAcceptable = metrics.throughput_rps >= thresholds.minThroughputRps;
    const cpuAcceptable = metrics.cpu_usage_percent <= thresholds.maxCpuPercent;
    const memoryAcceptable = metrics.memory_usage_mb <= thresholds.maxMemoryMb;
    
    const acceptableCount = [latencyAcceptable, throughputAcceptable, cpuAcceptable, memoryAcceptable]
      .filter(Boolean).length;
    
    let rating = 'POOR';
    if (acceptableCount === 4) rating = 'EXCELLENT';
    else if (acceptableCount === 3) rating = 'GOOD';
    else if (acceptableCount === 2) rating = 'FAIR';
    
    return {
      rating,
      latencyAcceptable,
      throughputAcceptable,
      cpuAcceptable,
      memoryAcceptable
    };
  }

  private checkPerformanceDegradation(metrics: PerformanceMetrics): {
    detected: boolean;
    details: string[];
  } {
    const details: string[] = [];
    let detected = false;
    
    // Check for high retry count
    if (metrics.retry_count > 3) {
      details.push(`High retry count: ${metrics.retry_count}`);
      detected = true;
    }
    
    // Check for very high latency
    if (metrics.latency_ms > 10000) {
      details.push(`Very high latency: ${metrics.latency_ms}ms`);
      detected = true;
    }
    
    // Check for zero throughput
    if (metrics.throughput_rps === 0) {
      details.push('Zero throughput - all requests failed');
      detected = true;
    }
    
    // Check for excessive memory usage
    if (metrics.memory_usage_mb > 1000) {
      details.push(`Excessive memory usage: ${metrics.memory_usage_mb}MB`);
      detected = true;
    }
    
    return { detected, details };
  }

}
