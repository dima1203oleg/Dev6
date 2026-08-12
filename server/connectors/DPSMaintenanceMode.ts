/**
 * DPS Maintenance Mode Detector
 * 
 * Detects when DPS API is under maintenance and manages connector state
 * 
 * Maintenance Response:
 * {
 *   "error": "Помилка",
 *   "error_description": "Ведуться технічні роботи"
 * }
 */

import { DPSErrorClassifier } from './DPSErrorTaxonomy';
import { getDPSTestMatrix } from './DPSTestMatrix';

export interface MaintenanceState {
  inMaintenance: boolean;
  lastDetectedAt: string | null;
  lastSuccessfulRequestAt: string | null;
  lastFailedRequestAt: string | null;
  lastUpstreamStatus: string;
  nextCertificationAttempt: string | null;
  maintenanceDuration: number | null;
  consecutiveMaintenanceResponses: number;
}

export class DPSMaintenanceMode {
  private state: MaintenanceState = {
    inMaintenance: false,
    lastDetectedAt: null,
    lastSuccessfulRequestAt: null,
    lastFailedRequestAt: null,
    lastUpstreamStatus: 'UNKNOWN',
    nextCertificationAttempt: null,
    maintenanceDuration: null,
    consecutiveMaintenanceResponses: 0
  };

  private readonly MAINTENANCE_THRESHOLD = 3; // Consecutive responses to confirm maintenance
  private readonly CERTIFICATION_RETRY_INTERVAL = 300000; // 5 minutes

  /**
   * Check if response indicates maintenance mode
   */
  checkMaintenance(httpStatus: number, responseBody: any): boolean {
    const error = DPSErrorClassifier.classifyError(httpStatus, responseBody);
    const isMaintenance = error.type === 'UPSTREAM_MAINTENANCE';

    if (isMaintenance) {
      this.state.consecutiveMaintenanceResponses++;
      
      if (this.state.consecutiveMaintenanceResponses >= this.MAINTENANCE_THRESHOLD) {
        this.enterMaintenanceMode();
      }
    } else {
      this.state.consecutiveMaintenanceResponses = 0;
      
      if (httpStatus >= 200 && httpStatus < 300) {
        this.exitMaintenanceMode();
      }
    }

    return isMaintenance;
  }

  /**
   * Enter maintenance mode
   */
  private enterMaintenanceMode(): void {
    if (!this.state.inMaintenance) {
      this.state.inMaintenance = true;
      this.state.lastDetectedAt = new Date().toISOString();
      this.state.lastUpstreamStatus = 'MAINTENANCE';
      
      // Mark all connectors as BLOCKED in test matrix
      const testMatrix = getDPSTestMatrix();
      testMatrix.markAllBlocked('DPS API under maintenance: Ведуться технічні роботи');
      
      console.warn('[DPSMaintenanceMode] Entered maintenance mode');
    }
  }

  /**
   * Exit maintenance mode
   */
  private exitMaintenanceMode(): void {
    if (this.state.inMaintenance) {
      const now = new Date();
      const detectedAt = this.state.lastDetectedAt ? new Date(this.state.lastDetectedAt) : now;
      
      this.state.inMaintenance = false;
      this.state.maintenanceDuration = now.getTime() - detectedAt.getTime();
      this.state.lastSuccessfulRequestAt = now.toISOString();
      this.state.lastUpstreamStatus = 'OPERATIONAL';
      this.state.nextCertificationAttempt = new Date(now.getTime() + this.CERTIFICATION_RETRY_INTERVAL).toISOString();
      
      console.info('[DPSMaintenanceMode] Exited maintenance mode. Duration:', this.state.maintenanceDuration, 'ms');
      console.info('[DPSMaintenanceMode] Next certification attempt:', this.state.nextCertificationAttempt);
    }
  }

  /**
   * Record failed request
   */
  recordFailure(httpStatus: number, _error: Error): void {
    this.state.lastFailedRequestAt = new Date().toISOString();
    this.state.lastUpstreamStatus = `ERROR_${httpStatus}`;
  }

  /**
   * Get current maintenance state
   */
  getState(): MaintenanceState {
    return { ...this.state };
  }

  /**
   * Check if certification should be attempted
   */
  shouldAttemptCertification(): boolean {
    if (!this.state.inMaintenance) {
      return true;
    }

    if (!this.state.nextCertificationAttempt) {
      return false;
    }

    const now = new Date();
    const nextAttempt = new Date(this.state.nextCertificationAttempt);
    return now >= nextAttempt;
  }

  /**
   * Get connector status for health check
   */
  getConnectorStatus(): 'CONNECTED' | 'CONFIGURED' | 'AUTHENTICATION_FAILED' | 'UNREACHABLE' | 'API_CONTRACT_UNKNOWN' | 'DISABLED' | 'MAINTENANCE' | 'RATE_LIMITED' {
    if (this.state.inMaintenance) {
      return 'MAINTENANCE';
    }
    return 'CONFIGURED';
  }

  /**
   * Get user-facing message
   */
  getUserFacingMessage(): string {
    if (this.state.inMaintenance) {
      return 'ДПС тимчасово недоступна. Причина: технічні роботи на стороні джерела.';
    }
    return 'ДПС доступна для запитів.';
  }

  /**
   * Reset maintenance state (for testing)
   */
  reset(): void {
    this.state = {
      inMaintenance: false,
      lastDetectedAt: null,
      lastSuccessfulRequestAt: null,
      lastFailedRequestAt: null,
      lastUpstreamStatus: 'UNKNOWN',
      nextCertificationAttempt: null,
      maintenanceDuration: null,
      consecutiveMaintenanceResponses: 0
    };
  }
}

// Singleton instance
let maintenanceModeInstance: DPSMaintenanceMode | null = null;

export function getDPSMaintenanceMode(): DPSMaintenanceMode {
  if (!maintenanceModeInstance) {
    maintenanceModeInstance = new DPSMaintenanceMode();
  }
  return maintenanceModeInstance;
}

export function resetDPSMaintenanceMode(): void {
  maintenanceModeInstance = null;
}
