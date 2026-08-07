import { OnboardingTask, OnboardingStatus } from '../../models/OnboardingTask';
import { OnboardingAgent } from './OnboardingAgent';
import { DocumentGenerator } from './DocumentGenerator';
import crypto from 'crypto';

export class OnboardingOrchestrator {
  private activeTasks: Map<string, OnboardingTask> = new Map();
  private agents: Map<string, OnboardingAgent> = new Map();
  private documentGenerator: DocumentGenerator;

  constructor() {
    this.documentGenerator = new DocumentGenerator();
  }

  public registerAgent(sourceId: string, agent: OnboardingAgent) {
    this.agents.set(sourceId, agent);
  }

  public async startOnboarding(sourceId: string, orgData?: any): Promise<OnboardingTask> {
    const existingTask = Array.from(this.activeTasks.values()).find(t => t.sourceId === sourceId);
    if (existingTask) {
      return existingTask;
    }

    const task: OnboardingTask = {
      taskId: crypto.randomUUID(),
      sourceId,
      status: OnboardingStatus.IN_PROGRESS,
      createdAt: new Date(),
      updatedAt: new Date(),
      details: {}
    };

    this.activeTasks.set(task.taskId, task);

    const agent = this.agents.get(sourceId);
    if (!agent) {
      task.status = OnboardingStatus.FAILED;
      task.details.error = `No OnboardingAgent registered for source ${sourceId}`;
      task.updatedAt = new Date();
      return task;
    }

    try {
      const requirements = agent.getRequirements();
      
      if (!requirements.allowedForAutomation) {
        task.status = OnboardingStatus.FAILED;
        task.details.error = `Source ${sourceId} does not allow automated onboarding`;
        task.updatedAt = new Date();
        return task;
      }

      // Execute automated parts (e.g. creating account)
      const updatedTask = await agent.executeOnboarding(task);

      if (requirements.requiresManualSign) {
        const docUrl = await this.documentGenerator.generateApplication(sourceId, orgData);
        updatedTask.status = OnboardingStatus.PENDING_MANUAL_ACTION;
        updatedTask.details.documentUrl = docUrl;
        updatedTask.details.requiredAction = 'Підпишіть згенеровану заяву та надішліть до реєстру.';
      } else if (requirements.requiresPayment) {
        updatedTask.status = OnboardingStatus.PENDING_MANUAL_ACTION;
        updatedTask.details.requiredAction = 'Очікується оплата за доступ до API.';
      } else if (updatedTask.status !== OnboardingStatus.FAILED) {
         updatedTask.status = OnboardingStatus.COMPLETED;
      }
      
      updatedTask.updatedAt = new Date();
      this.activeTasks.set(updatedTask.taskId, updatedTask);
      return updatedTask;

    } catch (e: any) {
      task.status = OnboardingStatus.FAILED;
      task.details.error = e.message;
      task.updatedAt = new Date();
      return task;
    }
  }

  public getTaskStatus(taskId: string): OnboardingTask | undefined {
    return this.activeTasks.get(taskId);
  }
}

export const onboardingOrchestrator = new OnboardingOrchestrator();
