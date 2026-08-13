/**
 * PREDATOR Analytics - Golden QA Validation Framework
 * Base Golden Validator
 */

import { 
  GoldenDataset, 
  GoldenValidationResult, 
  GoldenDiagnostics,
  ValidationResultSummary,
  SelfHealingAction,
  RegistryChange
} from './types';

export class BaseGoldenValidator {
  protected goldenDataset: GoldenDataset;
  protected testIPN: string;
  protected baseURL: string;
  protected diagnostics: GoldenDiagnostics[] = [];
  protected selfHealingActions: SelfHealingAction[] = [];
  protected registryChanges: RegistryChange[] = [];

  constructor(goldenDataset: GoldenDataset, baseURL: string = 'http://localhost:3000') {
    this.goldenDataset = goldenDataset;
    this.testIPN = goldenDataset.test_ipn;
    this.baseURL = baseURL;
  }

  protected createValidationResult(
    category: string,
    fieldName: string,
    expected: any,
    actual: any,
    discrepancyType: GoldenValidationResult['discrepancy_type'] = 'NONE',
    discrepancyReason?: string,
    source?: string
  ): GoldenValidationResult {
    const match = this.compareValues(expected, actual);
    
    return {
      category,
      field_name: fieldName,
      expected,
      actual,
      match,
      discrepancy_type: match ? 'NONE' : discrepancyType,
      discrepancy_reason: discrepancyReason,
      source,
      timestamp: new Date()
    };
  }

  protected compareValues(expected: any, actual: any): boolean {
    if (expected === null || expected === undefined) {
      return actual === null || actual === undefined;
    }
    if (actual === null || actual === undefined) {
      return false;
    }
    
    if (expected instanceof Date && actual instanceof Date) {
      return Math.abs(expected.getTime() - actual.getTime()) < 1000; // 1 second tolerance
    }
    
    if (typeof expected === 'object' && typeof actual === 'object') {
      return JSON.stringify(expected) === JSON.stringify(actual);
    }
    
    return expected === actual;
  }

  protected createDiagnostics(
    category: string,
    issueType: GoldenDiagnostics['issue_type'],
    severity: GoldenDiagnostics['severity'],
    description: string,
    affectedFields: string[],
    suggestedActions: string[],
    selfHealable: boolean
  ): GoldenDiagnostics {
    return {
      category,
      issue_type: issueType,
      severity,
      description,
      affected_fields: affectedFields,
      suggested_actions: suggestedActions,
      self_healable: selfHealable
    };
  }

  protected addDiagnostics(diagnostics: GoldenDiagnostics): void {
    this.diagnostics.push(diagnostics);
  }

  protected createSelfHealingAction(
    actionType: SelfHealingAction['action_type'],
    executed: boolean = false,
    success: boolean = false,
    result?: string
  ): SelfHealingAction {
    return {
      action_type: actionType,
      executed,
      success,
      timestamp: new Date(),
      result
    };
  }

  protected addSelfHealingAction(action: SelfHealingAction): void {
    this.selfHealingActions.push(action);
  }

  protected recordRegistryChange(
    registry: string,
    field: string,
    previousValue: any,
    newValue: any,
    verified: boolean = false
  ): void {
    this.registryChanges.push({
      registry,
      field,
      previous_value: previousValue,
      new_value: newValue,
      change_date: new Date(),
      verified
    });
  }

  protected createValidationSummary(
    results: GoldenValidationResult[]
  ): ValidationResultSummary {
    const total = results.length;
    const matched = results.filter(r => r.match).length;
    const mismatched = results.filter(r => !r.match && r.discrepancy_type === 'DATA_MISMATCH').length;
    const missing = results.filter(r => !r.match && r.discrepancy_type === 'MISSING_DATA').length;
    const extra = results.filter(r => !r.match && r.discrepancy_type === 'EXTRA_DATA').length;

    const status = matched === total ? 'PASS' : 
                  (matched + mismatched) === total ? 'PARTIAL' : 'FAIL';

    return { total, matched, mismatched, missing, extra, status };
  }

  protected async executeSelfHealing(diagnostics: GoldenDiagnostics): Promise<boolean> {
    if (!diagnostics.self_healable) {
      return false;
    }

    let healed = false;

    for (const action of diagnostics.suggested_actions) {
      const actionType = this.mapActionToType(action);
      const healingAction = this.createSelfHealingAction(actionType);

      try {
        healingAction.executed = true;
        
        switch (actionType) {
          case 'RETRY_REQUEST':
            healed = await this.retryRequest();
            break;
          case 'UPDATE_CACHE':
            healed = await this.updateCache();
            break;
          case 'CHECK_CONNECTOR':
            healed = await this.checkConnector();
            break;
          case 'CHECK_REGISTRY_STRUCTURE':
            healed = await this.checkRegistryStructure();
            break;
          case 'REBUILD_MAPPING':
            healed = await this.rebuildMapping();
            break;
          case 'REBUILD_ENTITY_CARD':
            healed = await this.rebuildEntityCard();
            break;
          case 'REPEAT_UI_TEST':
            healed = await this.repeatUITest();
            break;
        }

        healingAction.success = healed;
        healingAction.result = healed ? 'Action completed successfully' : 'Action failed';
      } catch (error) {
        healingAction.success = false;
        healingAction.result = error instanceof Error ? error.message : String(error);
      }

      this.addSelfHealingAction(healingAction);
    }

    return healed;
  }

  protected mapActionToType(action: string): SelfHealingAction['action_type'] {
    const actionMap: Record<string, SelfHealingAction['action_type']> = {
      'retry request': 'RETRY_REQUEST',
      'update cache': 'UPDATE_CACHE',
      'check connector': 'CHECK_CONNECTOR',
      'check registry structure': 'CHECK_REGISTRY_STRUCTURE',
      'rebuild mapping': 'REBUILD_MAPPING',
      'rebuild entity card': 'REBUILD_ENTITY_CARD',
      'repeat ui test': 'REPEAT_UI_TEST'
    };
    
    return actionMap[action.toLowerCase()] || 'RETRY_REQUEST';
  }

  // Self-healing operations (to be implemented)
  protected async retryRequest(): Promise<boolean> {
    // Implementation: Retry the failed request
    return false;
  }

  protected async updateCache(): Promise<boolean> {
    // Implementation: Update the cache
    return false;
  }

  protected async checkConnector(): Promise<boolean> {
    // Implementation: Check connector status
    return false;
  }

  protected async checkRegistryStructure(): Promise<boolean> {
    // Implementation: Verify registry structure hasn't changed
    return false;
  }

  protected async rebuildMapping(): Promise<boolean> {
    // Implementation: Rebuild field mappings
    return false;
  }

  protected async rebuildEntityCard(): Promise<boolean> {
    // Implementation: Rebuild the entity card
    return false;
  }

  protected async repeatUITest(): Promise<boolean> {
    // Implementation: Repeat the UI validation
    return false;
  }

  public getDiagnostics(): GoldenDiagnostics[] {
    return this.diagnostics;
  }

  public getSelfHealingActions(): SelfHealingAction[] {
    return this.selfHealingActions;
  }

  public getRegistryChanges(): RegistryChange[] {
    return this.registryChanges;
  }

  public clearDiagnostics(): void {
    this.diagnostics = [];
  }

  public clearSelfHealingActions(): void {
    this.selfHealingActions = [];
  }

  public clearRegistryChanges(): void {
    this.registryChanges = [];
  }
}
