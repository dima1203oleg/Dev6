import { OnboardingTask, OnboardingStatus } from '../../models/OnboardingTask';

export interface OnboardingRequirements {
  requiresManualSign: boolean;
  requiresPayment: boolean;
  requiresEmailVerification: boolean;
  allowedForAutomation: boolean;
}

export abstract class OnboardingAgent {
  protected sourceId: string;

  constructor(sourceId: string) {
    this.sourceId = sourceId;
  }

  /**
   * Defines what is required to onboard this data source.
   */
  abstract getRequirements(): OnboardingRequirements;

  /**
   * Executes the automated parts of the onboarding.
   * Could involve making API calls to create an account, generating API keys, etc.
   * Returns updated task status.
   */
  abstract executeOnboarding(task: OnboardingTask): Promise<OnboardingTask>;

  /**
   * Generates any required application forms (e.g., PDF/DOCX for state registries).
   * Returns a URL or path to the generated document.
   */
  abstract generateApplicationForm(organizationData: any): Promise<string | null>;
}
