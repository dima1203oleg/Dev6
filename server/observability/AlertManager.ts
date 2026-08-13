/**
 * Alert Manager for PREDATOR Analytics System
 * 
 * Provides alerting capabilities for system health, connector failures, and anomalies.
 * Supports multiple alert channels and severity levels.
 */

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertCategory {
  CONNECTOR = 'connector',
  API = 'api',
  SYSTEM = 'system',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertChannel {
  name: string;
  send(alert: Alert): Promise<void>;
  enabled: boolean;
}

export class AlertManager {
  private alerts: Alert[] = [];
  private channels: Map<string, AlertChannel> = new Map();
  private alertRules: AlertRule[] = [];
  private maxAlerts = 10000;

  constructor() {
    this.setupDefaultChannels();
  }

  /**
   * Fire a new alert
   */
  async fireAlert(
    severity: AlertSeverity,
    category: AlertCategory,
    title: string,
    message: string,
    source: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      severity,
      category,
      title,
      message,
      source,
      timestamp: new Date(),
      metadata,
      resolved: false,
    };

    this.alerts.push(alert);

    // Trim alerts if needed
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Send to enabled channels
    for (const channel of this.channels.values()) {
      if (channel.enabled) {
        try {
          await channel.send(alert);
        } catch (error) {
          console.error(`[AlertManager] Failed to send alert to ${channel.name}:`, error);
        }
      }
    }

    // Log critical alerts
    if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.ERROR) {
      console.error(`[ALERT] [${severity.toUpperCase()}] [${category}] ${title}: ${message}`);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Get active (unresolved) alerts
   */
  getActiveAlerts(filter?: {
    severity?: AlertSeverity;
    category?: AlertCategory;
    source?: string;
  }): Alert[] {
    return this.alerts.filter(alert => {
      if (alert.resolved) return false;
      if (filter?.severity && alert.severity !== filter.severity) return false;
      if (filter?.category && alert.category !== filter.category) return false;
      if (filter?.source && alert.source !== filter.source) return false;
      return true;
    });
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit?: number): Alert[] {
    if (limit) {
      return this.alerts.slice(-limit);
    }
    return this.alerts;
  }

  /**
   * Add an alert channel
   */
  addChannel(channel: AlertChannel): void {
    this.channels.set(channel.name, channel);
  }

  /**
   * Remove an alert channel
   */
  removeChannel(name: string): void {
    this.channels.delete(name);
  }

  /**
   * Enable/disable a channel
   */
  setChannelEnabled(name: string, enabled: boolean): void {
    const channel = this.channels.get(name);
    if (channel) {
      channel.enabled = enabled;
    }
  }

  /**
   * Add an alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * Evaluate alert rules
   */
  async evaluateRules(metrics: any): Promise<void> {
    for (const rule of this.alertRules) {
      try {
        const shouldFire = await rule.condition(metrics);
        if (shouldFire) {
          await this.fireAlert(
            rule.severity,
            rule.category,
            rule.title,
            rule.message,
            rule.source,
            rule.metadata
          );
        }
      } catch (error) {
        console.error(`[AlertManager] Failed to evaluate rule ${rule.title}:`, error);
      }
    }
  }

  /**
   * Get alert statistics
   */
  getStatistics(): {
    total: number;
    active: number;
    resolved: number;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<AlertCategory, number>;
  } {
    const bySeverity: Record<AlertSeverity, number> = {
      [AlertSeverity.INFO]: 0,
      [AlertSeverity.WARNING]: 0,
      [AlertSeverity.ERROR]: 0,
      [AlertSeverity.CRITICAL]: 0,
    };

    const byCategory: Record<AlertCategory, number> = {
      [AlertCategory.CONNECTOR]: 0,
      [AlertCategory.API]: 0,
      [AlertCategory.SYSTEM]: 0,
      [AlertCategory.PERFORMANCE]: 0,
      [AlertCategory.SECURITY]: 0,
    };

    let active = 0;
    let resolved = 0;

    for (const alert of this.alerts) {
      bySeverity[alert.severity]++;
      byCategory[alert.category]++;
      
      if (alert.resolved) {
        resolved++;
      } else {
        active++;
      }
    }

    return {
      total: this.alerts.length,
      active,
      resolved,
      bySeverity,
      byCategory,
    };
  }

  /**
   * Clear all alerts (useful for testing)
   */
  clear(): void {
    this.alerts = [];
  }

  private setupDefaultChannels(): void {
    // Console channel (always enabled)
    this.addChannel({
      name: 'console',
      enabled: true,
      send: async (alert: Alert) => {
        const timestamp = alert.timestamp.toISOString();
        const emoji = this.getSeverityEmoji(alert.severity);
        console.log(`[${timestamp}] ${emoji} [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`);
      },
    });

    // Log file channel (disabled by default)
    this.addChannel({
      name: 'logfile',
      enabled: false,
      send: async (_alert: Alert) => {
        // TODO: Implement log file writing
        // This would write alerts to a file for persistence
      },
    });

    // Webhook channel (disabled by default)
    this.addChannel({
      name: 'webhook',
      enabled: false,
      send: async (alert: Alert) => {
        const webhookUrl = process.env['ALERT_WEBHOOK_URL'];
        if (!webhookUrl) return;

        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert),
          });
        } catch (error) {
          console.error('[AlertManager] Webhook send failed:', error);
        }
      },
    });
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'ℹ️';
      case AlertSeverity.WARNING:
        return '⚠️';
      case AlertSeverity.ERROR:
        return '❌';
      case AlertSeverity.CRITICAL:
        return '🚨';
    }
  }
}

export interface AlertRule {
  name: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  source: string;
  condition: (metrics: any) => Promise<boolean> | boolean;
  metadata?: Record<string, any>;
}

// Singleton instance
export const alertManager = new AlertManager();
