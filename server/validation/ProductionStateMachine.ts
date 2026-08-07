/**
 * MASTER PRODUCTION BATTLEFIELD SPECIFICATION v5.0
 * PREDATOR Analytics - Autonomous Production Certification & Continuous Validation Framework
 * 
 * Production State Machine
 * 
 * Formalized lifecycle states:
 * UNKNOWN -> DISCOVERING -> VALIDATING -> TESTING -> REMEDIATING -> REGRESSION -> STABILIZING -> CERTIFIED -> MONITORING -> REVALIDATION
 * 
 * Transitions execute automatically only after defined criteria are met.
 */

export type ProductionState = 
  | 'UNKNOWN'
  | 'DISCOVERING'
  | 'VALIDATING'
  | 'TESTING'
  | 'REMEDIATING'
  | 'REGRESSION'
  | 'STABILIZING'
  | 'CERTIFIED'
  | 'MONITORING'
  | 'REVALIDATION';

export interface StateTransition {
  from: ProductionState;
  to: ProductionState;
  criteria: string;
  timestamp: string;
  triggeredBy: string;
  metadata?: any;
}

export interface StateMachineContext {
  currentState: ProductionState;
  previousState: ProductionState;
  transitions: StateTransition[];
  stateHistory: Map<ProductionState, { enteredAt: string; duration: number }>;
  metrics: {
    totalTransitions: number;
    timeInStates: Map<ProductionState, number>;
  };
}

export class ProductionStateMachine {
  private context: StateMachineContext;
  private transitionCriteria: Map<string, (context: StateMachineContext) => boolean>;

  constructor() {
    this.context = {
      currentState: 'UNKNOWN',
      previousState: 'UNKNOWN',
      transitions: [],
      stateHistory: new Map(),
      metrics: {
        totalTransitions: 0,
        timeInStates: new Map()
      }
    };

    this.transitionCriteria = new Map();
    this.initializeTransitionCriteria();
    
    console.log('[STATE MACHINE] Initialized in UNKNOWN state');
  }

  /**
   * Initialize transition criteria
   */
  private initializeTransitionCriteria(): void {
    // UNKNOWN -> DISCOVERING
    this.transitionCriteria.set('UNKNOWN->DISCOVERING', (ctx) => {
      return ctx.currentState === 'UNKNOWN';
    });

    // DISCOVERING -> VALIDATING
    this.transitionCriteria.set('DISCOVERING->VALIDATING', (ctx) => {
      return ctx.currentState === 'DISCOVERING' && this.allComponentsDiscovered();
    });

    // VALIDATING -> TESTING
    this.transitionCriteria.set('VALIDATING->TESTING', (ctx) => {
      return ctx.currentState === 'VALIDATING' && this.validationComplete();
    });

    // TESTING -> REMEDIATING
    this.transitionCriteria.set('TESTING->REMEDIATING', (ctx) => {
      return ctx.currentState === 'TESTING' && this.issuesDetected();
    });

    // TESTING -> STABILIZING
    this.transitionCriteria.set('TESTING->STABILIZING', (ctx) => {
      return ctx.currentState === 'TESTING' && !this.issuesDetected();
    });

    // REMEDIATING -> REGRESSION
    this.transitionCriteria.set('REMEDIATING->REGRESSION', (ctx) => {
      return ctx.currentState === 'REMEDIATING' && this.fixesImplemented();
    });

    // REGRESSION -> STABILIZING
    this.transitionCriteria.set('REGRESSION->STABILIZING', (ctx) => {
      return ctx.currentState === 'REGRESSION' && this.regressionTestsPassed();
    });

    // STABILIZING -> CERTIFIED
    this.transitionCriteria.set('STABILIZING->CERTIFIED', (ctx) => {
      return ctx.currentState === 'STABILIZING' && this.allSLOsMet() && this.healthIndexMet();
    });

    // CERTIFIED -> MONITORING
    this.transitionCriteria.set('CERTIFIED->MONITORING', (ctx) => {
      return ctx.currentState === 'CERTIFIED';
    });

    // MONITORING -> REVALIDATION
    this.transitionCriteria.set('MONITORING->REVALIDATION', (ctx) => {
      return ctx.currentState === 'MONITORING' && (this.changeDetected() || this.sloViolation());
    });

    // REVALIDATION -> CERTIFIED
    this.transitionCriteria.set('REVALIDATION->CERTIFIED', (ctx) => {
      return ctx.currentState === 'REVALIDATION' && this.revalidationPassed();
    });

    // REVALIDATION -> REMEDIATING
    this.transitionCriteria.set('REVALIDATION->REMEDIATING', (ctx) => {
      return ctx.currentState === 'REVALIDATION' && !this.revalidationPassed();
    });
  }

  /**
   * Attempt state transition
   */
  async transition(targetState: ProductionState, triggeredBy: string, metadata?: any): Promise<boolean> {
    const currentState = this.context.currentState;
    const transitionKey = `${currentState}->${targetState}`;
    
    const criteria = this.transitionCriteria.get(transitionKey);
    if (!criteria) {
      console.warn(`[STATE MACHINE] Invalid transition: ${currentState} -> ${targetState}`);
      return false;
    }

    if (!criteria(this.context)) {
      console.warn(`[STATE MACHINE] Transition criteria not met: ${transitionKey}`);
      return false;
    }

    // Execute transition
    return await this.executeTransition(targetState, triggeredBy, metadata);
  }

  /**
   * Execute state transition
   */
  private async executeTransition(targetState: ProductionState, triggeredBy: string, metadata?: any): Promise<boolean> {
    const previousState = this.context.currentState;
    
    // Record exit from previous state
    const stateEntry = this.context.stateHistory.get(previousState);
    if (stateEntry) {
      const duration = Date.now() - new Date(stateEntry.enteredAt).getTime();
      this.context.metrics.timeInStates.set(previousState, duration);
    }

    // Update context
    this.context.previousState = previousState;
    this.context.currentState = targetState;
    
    // Record transition
    const transition: StateTransition = {
      from: previousState,
      to: targetState,
      criteria: this.getTransitionCriteriaDescription(previousState, targetState),
      timestamp: new Date().toISOString(),
      triggeredBy,
      metadata
    };
    
    this.context.transitions.push(transition);
    this.context.metrics.totalTransitions++;
    
    // Record entry to new state
    this.context.stateHistory.set(targetState, {
      enteredAt: new Date().toISOString(),
      duration: 0
    });

    console.log(`[STATE MACHINE] Transition: ${previousState} -> ${targetState} (triggered by: ${triggeredBy})`);
    
    // Execute state entry actions
    await this.onStateEnter(targetState, metadata);
    
    return true;
  }

  /**
   * Execute actions when entering a state
   */
  private async onStateEnter(state: ProductionState, metadata?: any): Promise<void> {
    switch (state) {
      case 'DISCOVERING':
        console.log('[STATE MACHINE] Starting component discovery...');
        // TODO: Trigger discovery workflow
        break;
      
      case 'VALIDATING':
        console.log('[STATE MACHINE] Starting validation...');
        // TODO: Trigger validation workflow
        break;
      
      case 'TESTING':
        console.log('[STATE MACHINE] Starting testing...');
        // TODO: Trigger testing workflow
        break;
      
      case 'REMEDIATING':
        console.log('[STATE MACHINE] Starting remediation...');
        // TODO: Trigger remediation workflow
        break;
      
      case 'REGRESSION':
        console.log('[STATE MACHINE] Starting regression testing...');
        // TODO: Trigger regression workflow
        break;
      
      case 'STABILIZING':
        console.log('[STATE MACHINE] Stabilizing system...');
        // TODO: Trigger stabilization workflow
        break;
      
      case 'CERTIFIED':
        console.log('[STATE MACHINE] System CERTIFIED for production');
        // TODO: Generate certification artifacts
        break;
      
      case 'MONITORING':
        console.log('[STATE MACHINE] Entering continuous monitoring mode');
        // TODO: Start monitoring
        break;
      
      case 'REVALIDATION':
        console.log('[STATE MACHINE] Starting revalidation...');
        // TODO: Trigger revalidation workflow
        break;
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): ProductionState {
    return this.context.currentState;
  }

  /**
   * Get state context
   */
  getContext(): StateMachineContext {
    return { ...this.context };
  }

  /**
   * Get transition history
   */
  getTransitionHistory(): StateTransition[] {
    return [...this.context.transitions];
  }

  /**
   * Get possible next states
   */
  getPossibleTransitions(): Array<{ to: ProductionState; criteria: string }> {
    const currentState = this.context.currentState;
    const possible: Array<{ to: ProductionState; criteria: string }> = [];
    
    for (const [key, criteria] of this.transitionCriteria) {
      const [from, to] = key.split('->');
      if (from === currentState) {
        possible.push({
          to: to as ProductionState,
          criteria: this.getTransitionCriteriaDescription(from as ProductionState, to as ProductionState)
        });
      }
    }
    
    return possible;
  }

  /**
   * Get state metrics
   */
  getStateMetrics(): {
    currentState: ProductionState;
    totalTransitions: number;
    timeInStates: Record<ProductionState, number>;
  } {
    const timeInStates: Record<ProductionState, number> = {} as any;
    
    for (const [state, duration] of this.context.metrics.timeInStates) {
      timeInStates[state as ProductionState] = duration;
    }
    
    return {
      currentState: this.context.currentState,
      totalTransitions: this.context.metrics.totalTransitions,
      timeInStates
    };
  }

  /**
   * Force transition (for emergency use)
   */
  async forceTransition(targetState: ProductionState, reason: string): Promise<boolean> {
    console.warn(`[STATE MACHINE] FORCED TRANSITION: ${this.context.currentState} -> ${targetState} (reason: ${reason})`);
    return await this.executeTransition(targetState, 'FORCE', { reason });
  }

  /**
   * Reset state machine
   */
  reset(): void {
    this.context = {
      currentState: 'UNKNOWN',
      previousState: 'UNKNOWN',
      transitions: [],
      stateHistory: new Map(),
      metrics: {
        totalTransitions: 0,
        timeInStates: new Map()
      }
    };
    console.log('[STATE MACHINE] Reset to UNKNOWN state');
  }

  // Transition criteria checks (TODO: Implement actual logic)
  private allComponentsDiscovered(): boolean {
    return true; // Placeholder
  }

  private validationComplete(): boolean {
    return true; // Placeholder
  }

  private issuesDetected(): boolean {
    return false; // Placeholder
  }

  private fixesImplemented(): boolean {
    return true; // Placeholder
  }

  private regressionTestsPassed(): boolean {
    return true; // Placeholder
  }

  private allSLOsMet(): boolean {
    return true; // Placeholder
  }

  private healthIndexMet(): boolean {
    return true; // Placeholder
  }

  private changeDetected(): boolean {
    return false; // Placeholder
  }

  private sloViolation(): boolean {
    return false; // Placeholder
  }

  private revalidationPassed(): boolean {
    return true; // Placeholder
  }

  private getTransitionCriteriaDescription(from: ProductionState, to: ProductionState): string {
    const descriptions: Record<string, string> = {
      'UNKNOWN->DISCOVERING': 'Manifest loaded',
      'DISCOVERING->VALIDATING': 'All components discovered',
      'VALIDATING->TESTING': 'Validation complete',
      'TESTING->REMEDIATING': 'Issues detected',
      'TESTING->STABILIZING': 'No issues detected',
      'REMEDIATING->REGRESSION': 'Fixes implemented',
      'REGRESSION->STABILIZING': 'Regression tests passed',
      'STABILIZING->CERTIFIED': 'All SLOs met, Health Index >= 95',
      'CERTIFIED->MONITORING': 'Certification complete',
      'MONITORING->REVALIDATION': 'Change detected or SLO violation',
      'REVALIDATION->CERTIFIED': 'Revalidation passed',
      'REVALIDATION->REMEDIATING': 'Revalidation failed'
    };
    
    return descriptions[`${from}->${to}`] || 'Custom criteria';
  }
}
