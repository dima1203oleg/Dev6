/**
 * Metrics Collector for PREDATOR Analytics System
 * 
 * Provides observability metrics for connectors, API endpoints, and system health.
 * Uses in-memory storage with optional Prometheus export.
 */

export interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

export interface CounterMetric {
  name: string;
  help: string;
  value: number;
  labels?: Record<string, string>;
}

export interface HistogramMetric {
  name: string;
  help: string;
  buckets: number[];
  samples: number[];
  sum: number;
  count: number;
  labels?: Record<string, string>;
}

export interface GaugeMetric {
  name: string;
  help: string;
  value: number;
  labels?: Record<string, string>;
}

export class MetricsCollector {
  private counters: Map<string, CounterMetric> = new Map();
  private histograms: Map<string, HistogramMetric> = new Map();
  private gauges: Map<string, GaugeMetric> = new Map();
  private metricHistory: MetricData[] = [];
  private maxHistorySize = 10000;

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>, help?: string): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.counters.get(key);
    
    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, {
        name,
        help: help || `Counter metric: ${name}`,
        value,
        labels,
      });
    }

    this.addToHistory(name, value, labels);
  }

  /**
   * Record a histogram observation (for latency distributions)
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>, help?: string, buckets?: number[]): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.histograms.get(key);
    const defaultBuckets = buckets || [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
    
    if (existing) {
      existing.samples.push(value);
      existing.sum += value;
      existing.count += 1;
    } else {
      this.histograms.set(key, {
        name,
        help: help || `Histogram metric: ${name}`,
        buckets: defaultBuckets,
        samples: [value],
        sum: value,
        count: 1,
        labels,
      });
    }

    this.addToHistory(name, value, labels);
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>, help?: string): void {
    const key = this.getMetricKey(name, labels);
    
    this.gauges.set(key, {
      name,
      help: help || `Gauge metric: ${name}`,
      value,
      labels,
    });

    this.addToHistory(name, value, labels);
  }

  /**
   * Get all metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    let output = '';

    // Counters
    for (const counter of this.counters.values()) {
      output += `# TYPE ${counter.name} counter\n`;
      output += `# HELP ${counter.name} ${counter.help}\n`;
      const labelStr = this.formatLabels(counter.labels);
      output += `${counter.name}${labelStr} ${counter.value}\n\n`;
    }

    // Gauges
    for (const gauge of this.gauges.values()) {
      output += `# TYPE ${gauge.name} gauge\n`;
      output += `# HELP ${gauge.name} ${gauge.help}\n`;
      const labelStr = this.formatLabels(gauge.labels);
      output += `${gauge.name}${labelStr} ${gauge.value}\n\n`;
    }

    // Histograms
    for (const histogram of this.histograms.values()) {
      output += `# TYPE ${histogram.name} histogram\n`;
      output += `# HELP ${histogram.name} ${histogram.help}\n`;
      const labelStr = this.formatLabels(histogram.labels);
      
      // Calculate bucket counts
      const bucketCounts = histogram.buckets.map(bucket => 
        histogram.samples.filter(s => s <= bucket).length
      );
      
      // Output bucket metrics
      for (let i = 0; i < histogram.buckets.length; i++) {
        const le = histogram.buckets[i];
        const count = bucketCounts[i];
        output += `${histogram.name}_bucket${labelStr},le="${le}" ${count}\n`;
      }
      // Add +Inf bucket
      output += `${histogram.name}_bucket${labelStr},le="+Inf" ${histogram.count}\n`;
      // Sum and count
      output += `${histogram.name}_sum${labelStr} ${histogram.sum}\n`;
      output += `${histogram.name}_count${labelStr} ${histogram.count}\n\n`;
    }

    return output;
  }

  /**
   * Get metric history for analysis
   */
  getMetricHistory(name?: string, limit?: number): MetricData[] {
    let history = this.metricHistory;
    
    if (name) {
      history = history.filter(m => m.name === name);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
    this.metricHistory = [];
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    counters: number;
    histograms: number;
    gauges: number;
    totalHistory: number;
  } {
    return {
      counters: this.counters.size,
      histograms: this.histograms.size,
      gauges: this.gauges.size,
      totalHistory: this.metricHistory.length,
    };
  }

  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `{${labelStr}}`;
  }

  private addToHistory(name: string, value: number, labels?: Record<string, string>): void {
    this.metricHistory.push({
      name,
      value,
      labels,
      timestamp: new Date(),
    });

    // Trim history if needed
    if (this.metricHistory.length > this.maxHistorySize) {
      this.metricHistory = this.metricHistory.slice(-this.maxHistorySize);
    }
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();
