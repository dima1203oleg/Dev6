/**
 * Empty Card Remediation Engine
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * 3-attempt automatic remediation with incident creation
 */

import { logger } from '../observability/StructuredLogger';
import { FailureHandler, ClassifiedFailure } from '../failure/FailureHandler';

export interface RemediationAttempt {
  attempt_number: number;
  timestamp: string;
  strategy: string;
  success: boolean;
  error?: string;
  remediated_fields?: string[];
}

export interface Incident {
  incident_id: string;
  card_id: string;
  card_type: string;
  entity_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  created_at: string;
  resolved_at?: string;
  attempts: RemediationAttempt[];
  root_cause: string;
  resolution?: string;
}

export interface RemediationResult {
  card_id: string;
  success: boolean;
  attempts: RemediationAttempt[];
  incident?: Incident;
  final_status: 'REMEDIATED' | 'FAILED' | 'ESCALATED';
}

export class EmptyCardRemediationEngine {
  private incidents: Map<string, Incident> = new Map();
  private maxAttempts: number = 3;

  /**
   * Remediate an empty card with 3 attempts
   */
  async remediateEmptyCard(
    runId: string,
    cardId: string,
    cardType: string,
    entityId: string,
    reason: string,
    remediationStrategies: Array<(cardId: string) => Promise<{ success: boolean; remediatedFields?: string[] }>>
  ): Promise<RemediationResult> {
    const attempts: RemediationAttempt[] = [];
    let success = false;
    let finalStatus: 'REMEDIATED' | 'FAILED' | 'ESCALATED' = 'FAILED';

    logger.info({ run_id: runId, card_id: cardId, entity_id: entityId, stage: 'remediation' },
      'Starting empty card remediation', { cardType, reason, maxAttempts: this.maxAttempts });

    for (let i = 0; i < this.maxAttempts; i++) {
      const attemptNumber = i + 1;
      const strategy = remediationStrategies[i]?.name || `Strategy ${attemptNumber}`;

      logger.info({ run_id: runId, card_id: cardId, entity_id: entityId, stage: 'remediation' },
        `Remediation attempt ${attemptNumber}/${this.maxAttempts}`, { strategy });

      try {
        const result = await remediationStrategies[i](cardId);
        
        const attempt: RemediationAttempt = {
          attempt_number: attemptNumber,
          timestamp: new Date().toISOString(),
          strategy,
          success: result.success,
          remediated_fields: result.remediatedFields
        };

        attempts.push(attempt);

        if (result.success) {
          success = true;
          finalStatus = 'REMEDIATED';
          logger.info({ run_id: runId, card_id: cardId, entity_id: entityId, stage: 'remediation' },
            'Remediation successful', { attemptNumber, remediatedFields: result.remediatedFields });
          break;
        } else {
          logger.warn({ run_id: runId, card_id: cardId, entity_id: entityId, stage: 'remediation' },
            `Remediation attempt ${attemptNumber} failed`);
        }

      } catch (error) {
        const attempt: RemediationAttempt = {
          attempt_number: attemptNumber,
          timestamp: new Date().toISOString(),
          strategy,
          success: false,
          error: (error as Error).message
        };

        attempts.push(attempt);
        logger.error({ run_id: runId, card_id: cardId, entity_id: entityId, stage: 'remediation' },
          `Remediation attempt ${attemptNumber} error`, error);
      }
    }

    // Create incident if all attempts failed
    let incident: Incident | undefined;
    if (!success) {
      finalStatus = 'ESCALATED';
      incident = this.createIncident(cardId, cardType, entityId, reason, attempts);
      logger.error({ run_id: runId, card_id: cardId, entity_id: entityId, stage: 'remediation' },
        'All remediation attempts failed, incident created', { incident_id: incident.incident_id });
    }

    return {
      card_id: cardId,
      success,
      attempts,
      incident,
      final_status: finalStatus
    };
  }

  /**
   * Create an incident for failed remediation
   */
  private createIncident(
    cardId: string,
    cardType: string,
    entityId: string,
    reason: string,
    attempts: RemediationAttempt[]
  ): Incident {
    const incident: Incident = {
      incident_id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      card_id: cardId,
      card_type: cardType,
      entity_id: entityId,
      severity: this.determineSeverity(cardType, attempts),
      status: 'OPEN',
      created_at: new Date().toISOString(),
      attempts,
      root_cause: this.determineRootCause(reason, attempts)
    };

    this.incidents.set(incident.incident_id, incident);
    return incident;
  }

  /**
   * Determine incident severity based on card type and attempts
   */
  private determineSeverity(cardType: string, attempts: RemediationAttempt[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical card types
    const criticalTypes = ['COMPANIES', 'PERSONS', 'SANCTIONS'];
    if (criticalTypes.includes(cardType)) {
      return 'CRITICAL';
    }

    // High priority card types
    const highTypes = ['COURT_CASES', 'TAX_STATUS', 'DEBTS'];
    if (highTypes.includes(cardType)) {
      return 'HIGH';
    }

    // Medium priority
    const mediumTypes = ['LICENSES', 'DECLARATIONS', 'ASSETS'];
    if (mediumTypes.includes(cardType)) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Determine root cause from attempts
   */
  private determineRootCause(reason: string, attempts: RemediationAttempt[]): string {
    const errors = attempts.filter(a => a.error).map(a => a.error);
    
    if (errors.length > 0) {
      return `Remediation failed after ${attempts.length} attempts. Errors: ${errors.join('; ')}`;
    }

    return `Remediation failed after ${attempts.length} attempts. No data available for card. Original reason: ${reason}`;
  }

  /**
   * Resolve an incident
   */
  resolveIncident(incidentId: string, resolution: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return false;
    }

    incident.status = 'RESOLVED';
    incident.resolved_at = new Date().toISOString();
    incident.resolution = resolution;

    logger.info({ incident_id: incidentId, stage: 'remediation' },
      'Incident resolved', { resolution });

    return true;
  }

  /**
   * Get incident by ID
   */
  getIncident(incidentId: string): Incident | null {
    return this.incidents.get(incidentId) || null;
  }

  /**
   * Get all incidents
   */
  getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  /**
   * Get incidents by status
   */
  getIncidentsByStatus(status: Incident['status']): Incident[] {
    return this.getAllIncidents().filter(inc => inc.status === status);
  }

  /**
   * Get incidents by severity
   */
  getIncidentsBySeverity(severity: Incident['severity']): Incident[] {
    return this.getAllIncidents().filter(inc => inc.severity === severity);
  }

  /**
   * Get incident statistics
   */
  getIncidentStatistics(): {
    total: number;
    byStatus: Record<Incident['status'], number>;
    bySeverity: Record<Incident['severity'], number>;
    openIncidents: number;
    resolvedIncidents: number;
    averageResolutionTimeMs: number;
  } {
    const incidents = this.getAllIncidents();
    const byStatus: Record<Incident['status'], number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      ESCALATED: 0
    };
    const bySeverity: Record<Incident['severity'], number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    let totalResolutionTimeMs = 0;
    let resolvedCount = 0;

    for (const incident of incidents) {
      byStatus[incident.status]++;
      bySeverity[incident.severity]++;

      if (incident.status === 'RESOLVED' && incident.resolved_at) {
        const resolutionTime = new Date(incident.resolved_at).getTime() - new Date(incident.created_at).getTime();
        totalResolutionTimeMs += resolutionTime;
        resolvedCount++;
      }
    }

    return {
      total: incidents.length,
      byStatus,
      bySeverity,
      openIncidents: byStatus.OPEN + byStatus.IN_PROGRESS + byStatus.ESCALATED,
      resolvedIncidents: byStatus.RESOLVED,
      averageResolutionTimeMs: resolvedCount > 0 ? totalResolutionTimeMs / resolvedCount : 0
    };
  }

  /**
   * Clear all incidents
   */
  clearIncidents(): void {
    this.incidents.clear();
  }

  /**
   * Set max attempts
   */
  setMaxAttempts(maxAttempts: number): void {
    this.maxAttempts = maxAttempts;
  }

  /**
   * Get max attempts
   */
  getMaxAttempts(): number {
    return this.maxAttempts;
  }
}

// Singleton instance
export const emptyCardRemediationEngine = new EmptyCardRemediationEngine();
