export enum OnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_MANUAL_ACTION = 'PENDING_MANUAL_ACTION',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface OnboardingTask {
  taskId: string;
  sourceId: string;
  status: OnboardingStatus;
  createdAt: Date;
  updatedAt: Date;
  details: {
    message?: string;
    requiredAction?: string;
    documentUrl?: string; // Path to generated document for manual signing
    error?: string;
  };
}
