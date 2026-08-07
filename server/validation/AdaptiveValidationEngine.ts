/**
 * MASTER PRODUCTION BATTLEFIELD SPECIFICATION v5.0
 * PREDATOR Analytics - Autonomous Production Certification & Continuous Validation Framework
 * 
 * Adaptive Validation Engine
 * 
 * After each fix, the system determines which components could have been indirectly affected.
 * 
 * Examples:
 * - Connector change triggers verification of all dependent ETL processes
 * - PostgreSQL schema change triggers re-verification of ORM, API, and Frontend
 * - Risk Engine algorithm change triggers recalculation of control scenarios
 * 
 * Thus regression is adaptive, not static.
 */

export interface ComponentImpact {
  componentId: string;
  componentType: 'CONNECTOR' | 'ETL' | 'DATABASE' | 'API' | 'FRONTEND' | 'AI_MODEL' | 'RISK_ENGINE' | 'GRAPH' | 'REPORT' | 'SCHEMA' | 'CONFIGURATION';
  impactLevel: 'DIRECT' | 'INDIRECT' | 'TRANSITIVE';
  validationRequired: boolean;
  validationType: 'FULL' | 'PARTIAL' | 'SMOKE';
  estimatedDuration: number;
}

export interface AdaptiveValidationPlan {
  planId: string;
  triggerChange: {
    componentId: string;
    changeType: string;
    description: string;
  };
  impactedComponents: ComponentImpact[];
  totalEstimatedDuration: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  executedAt?: string;
  results?: Map<string, any>;
}

export interface ImpactRule {
  ruleId: string;
  sourceComponentType: ComponentImpact['componentType'];
  targetComponentType: ComponentImpact['componentType'];
  impactLevel: ComponentImpact['impactLevel'];
  validationRequired: boolean;
  validationType: ComponentImpact['validationType'];
  condition?: string;
}

export class AdaptiveValidationEngine {
  private plans: Map<string, AdaptiveValidationPlan> = new Map();
  private impactRules: ImpactRule[] = [];
  private componentDependencies: Map<string, string[]> = new Map();

  constructor() {
    this.initializeImpactRules();
    this.initializeComponentDependencies();
  }

  /**
   * Initialize impact rules for component changes
   */
  private initializeImpactRules(): void {
    this.impactRules = [
      // Connector changes
      {
        ruleId: 'rule-connector-etl',
        sourceComponentType: 'CONNECTOR',
        targetComponentType: 'ETL',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL'
      },
      {
        ruleId: 'rule-connector-entity-resolution',
        sourceComponentType: 'CONNECTOR',
        targetComponentType: 'GRAPH',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL'
      },
      {
        ruleId: 'rule-connector-risk-engine',
        sourceComponentType: 'CONNECTOR',
        targetComponentType: 'RISK_ENGINE',
        impactLevel: 'INDIRECT',
        validationRequired: true,
        validationType: 'PARTIAL'
      },
      {
        ruleId: 'rule-connector-ai-analytics',
        sourceComponentType: 'CONNECTOR',
        targetComponentType: 'AI_MODEL',
        impactLevel: 'INDIRECT',
        validationRequired: true,
        validationType: 'PARTIAL'
      },
      {
        ruleId: 'rule-connector-reports',
        sourceComponentType: 'CONNECTOR',
        targetComponentType: 'REPORT',
        impactLevel: 'TRANSITIVE',
        validationRequired: true,
        validationType: 'SMOKE'
      },

      // Database schema changes
      {
        ruleId: 'rule-schema-orm',
        sourceComponentType: 'SCHEMA',
        targetComponentType: 'DATABASE',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL'
      },
      {
        ruleId: 'rule-schema-api',
        sourceComponentType: 'SCHEMA',
        targetComponentType: 'API',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL'
      },
      {
        ruleId: 'rule-schema-frontend',
        sourceComponentType: 'SCHEMA',
        targetComponentType: 'FRONTEND',
        impactLevel: 'INDIRECT',
        validationRequired: true,
        validationType: 'PARTIAL'
      },
      {
        ruleId: 'rule-schema-etl',
        sourceComponentType: 'SCHEMA',
        targetComponentType: 'ETL',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL'
      },

      // Risk Engine changes
      {
        ruleId: 'rule-risk-engine-ai',
        sourceComponentType: 'RISK_ENGINE',
        targetComponentType: 'AI_MODEL',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL'
      },
      {
        ruleId: 'rule-risk-engine-reports',
        sourceComponentType: 'RISK_ENGINE',
        targetComponentType: 'REPORT',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL'
      },
      {
        ruleId: 'rule-risk-engine-frontend',
        sourceComponentType: 'RISK_ENGINE',
        targetComponentType: 'FRONTEND',
        impactLevel: 'INDIRECT',
        validationRequired: true,
        validationType: 'SMOKE'
      },

      // AI Model changes
      {
        ruleId: 'rule-ai-model-frontend',
        sourceComponentType: 'AI_MODEL',
        targetComponentType: 'FRONTEND',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'PARTIAL'
      },
      {
        ruleId: 'rule-ai-model-reports',
        sourceComponentType: 'AI_MODEL',
        targetComponentType: 'REPORT',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL'
      },

      // API changes
      {
        ruleId: 'rule-api-frontend',
        sourceComponentType: 'API',
        targetComponentType: 'FRONTEND',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL'
      },
      {
        ruleId: 'rule-api-reports',
        sourceComponentType: 'API',
        targetComponentType: 'REPORT',
        impactLevel: 'INDIRECT',
        validationRequired: true,
        validationType: 'PARTIAL'
      },

      // Configuration changes
      {
        ruleId: 'rule-config-all',
        sourceComponentType: 'CONFIGURATION',
        targetComponentType: 'CONNECTOR',
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'SMOKE',
        condition: 'affects_connector_config'
      }
    ];

    console.log(`[ADAPTIVE VALIDATION] Initialized ${this.impactRules.length} impact rules`);
  }

  /**
   * Initialize component dependencies
   */
  private initializeComponentDependencies(): void {
    this.componentDependencies.set('FOPConnector', ['EntityResolutionETL', 'CompanyGraph', 'RiskEngine']);
    this.componentDependencies.set('CourtConnector', ['EntityResolutionETL', 'CompanyGraph', 'RiskEngine']);
    this.componentDependencies.set('SanctionsConnector', ['EntityResolutionETL', 'RiskEngine', 'AIAnalytics']);
    this.componentDependencies.set('ProzorroConnector', ['EntityResolutionETL', 'RiskEngine']);
    this.componentDependencies.set('EntityResolutionETL', ['Neo4j', 'PostgreSQL', 'CompanyGraph']);
    this.componentDependencies.set('RiskEngine', ['AIAnalytics', 'ReportGenerator', 'DashboardUI']);
    this.componentDependencies.set('AIAnalytics', ['ReportGenerator', 'DashboardUI']);
    this.componentDependencies.set('PostgreSQL', ['PredatorAPI', 'EntityResolutionETL']);
    this.componentDependencies.set('Neo4j', ['CompanyGraph', 'RiskEngine', 'AIAnalytics']);
    this.componentDependencies.set('PredatorAPI', ['DashboardUI']);

    console.log(`[ADAPTIVE VALIDATION] Initialized dependencies for ${this.componentDependencies.size} components`);
  }

  /**
   * Create adaptive validation plan for a change
   */
  createValidationPlan(
    componentId: string,
    componentType: ComponentImpact['componentType'],
    changeType: string,
    description: string
  ): AdaptiveValidationPlan {
    const planId = this.generatePlanId();
    
    // Determine impacted components
    const impactedComponents = this.determineImpactedComponents(componentId, componentType);
    
    // Calculate total estimated duration
    const totalEstimatedDuration = impactedComponents.reduce((sum, comp) => sum + comp.estimatedDuration, 0);
    
    // Determine priority
    const priority = this.determinePriority(impactedComponents);
    
    const plan: AdaptiveValidationPlan = {
      planId,
      triggerChange: {
        componentId,
        changeType,
        description
      },
      impactedComponents,
      totalEstimatedDuration,
      priority,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.plans.set(planId, plan);
    
    console.log(`[ADAPTIVE VALIDATION] Created validation plan: ${planId}`);
    console.log(`  Trigger: ${componentId} (${componentType}) - ${changeType}`);
    console.log(`  Impacted components: ${impactedComponents.length}`);
    console.log(`  Estimated duration: ${totalEstimatedDuration}s`);
    console.log(`  Priority: ${priority}`);
    
    return plan;
  }

  /**
   * Determine impacted components based on change type and rules
   */
  private determineImpactedComponents(
    componentId: string,
    componentType: ComponentImpact['componentType']
  ): ComponentImpact[] {
    const impacted: ComponentImpact[] = [];
    
    // Add direct dependencies
    const directDependencies = this.componentDependencies.get(componentId) || [];
    for (const depId of directDependencies) {
      const depType = this.inferComponentType(depId);
      impacted.push({
        componentId: depId,
        componentType: depType,
        impactLevel: 'DIRECT',
        validationRequired: true,
        validationType: 'FULL',
        estimatedDuration: this.estimateValidationDuration(depType, 'FULL')
      });
    }
    
    // Apply impact rules for transitive impacts
    for (const rule of this.impactRules) {
      if (rule.sourceComponentType === componentType) {
        // Find components of target type
        const targetComponents = this.findComponentsByType(rule.targetComponentType);
        for (const targetId of targetComponents) {
          // Skip if already added as direct dependency
          if (!impacted.find(i => i.componentId === targetId)) {
            impacted.push({
              componentId: targetId,
              componentType: rule.targetComponentType,
              impactLevel: rule.impactLevel,
              validationRequired: rule.validationRequired,
              validationType: rule.validationType,
              estimatedDuration: this.estimateValidationDuration(rule.targetComponentType, rule.validationType)
            });
          }
        }
      }
    }
    
    // Remove duplicates and sort by impact level
    const uniqueImpacted = this.removeDuplicates(impacted);
    uniqueImpacted.sort((a, b) => {
      const impactOrder = { DIRECT: 0, INDIRECT: 1, TRANSITIVE: 2 };
      return impactOrder[a.impactLevel] - impactOrder[b.impactLevel];
    });
    
    return uniqueImpacted;
  }

  /**
   * Infer component type from component ID
   */
  private inferComponentType(componentId: string): ComponentImpact['componentType'] {
    if (componentId.includes('Connector')) return 'CONNECTOR';
    if (componentId.includes('ETL')) return 'ETL';
    if (componentId === 'PostgreSQL' || componentId === 'Neo4j' || componentId === 'Redis' || componentId === 'Qdrant') return 'DATABASE';
    if (componentId === 'PredatorAPI') return 'API';
    if (componentId === 'DashboardUI') return 'FRONTEND';
    if (componentId === 'RiskEngine') return 'RISK_ENGINE';
    if (componentId === 'AIAnalytics') return 'AI_MODEL';
    if (componentId === 'CompanyGraph') return 'GRAPH';
    if (componentId === 'ReportGenerator') return 'REPORT';
    return 'CONFIGURATION';
  }

  /**
   * Find components by type
   */
  private findComponentsByType(componentType: ComponentImpact['componentType']): string[] {
    const components: string[] = [];
    
    for (const [compId, deps] of this.componentDependencies) {
      const inferredType = this.inferComponentType(compId);
      if (inferredType === componentType) {
        components.push(compId);
      }
    }
    
    return components;
  }

  /**
   * Estimate validation duration
   */
  private estimateValidationDuration(
    componentType: ComponentImpact['componentType'],
    validationType: ComponentImpact['validationType']
  ): number {
    const baseDurations = {
      CONNECTOR: 30,
      ETL: 60,
      DATABASE: 120,
      API: 45,
      FRONTEND: 30,
      AI_MODEL: 90,
      RISK_ENGINE: 60,
      GRAPH: 45,
      REPORT: 30,
      SCHEMA: 180,
      CONFIGURATION: 15
    };

    const multipliers = {
      FULL: 1.0,
      PARTIAL: 0.5,
      SMOKE: 0.2
    };

    const base = baseDurations[componentType] || 30;
    const multiplier = multipliers[validationType] || 1.0;
    
    return Math.round(base * multiplier);
  }

  /**
   * Remove duplicate components
   */
  private removeDuplicates(components: ComponentImpact[]): ComponentImpact[] {
    const seen = new Set<string>();
    return components.filter(comp => {
      if (seen.has(comp.componentId)) return false;
      seen.add(comp.componentId);
      return true;
    });
  }

  /**
   * Determine priority based on impacted components
   */
  private determinePriority(impactedComponents: ComponentImpact[]): AdaptiveValidationPlan['priority'] {
    const hasDirect = impactedComponents.some(c => c.impactLevel === 'DIRECT');
    const hasCritical = impactedComponents.some(c => c.componentType === 'DATABASE' || c.componentType === 'RISK_ENGINE');
    
    if (hasCritical && hasDirect) return 'CRITICAL';
    if (hasCritical) return 'HIGH';
    if (hasDirect) return 'HIGH';
    return impactedComponents.length > 5 ? 'MEDIUM' : 'LOW';
  }

  /**
   * Execute validation plan
   */
  async executeValidationPlan(planId: string): Promise<void> {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Validation plan not found: ${planId}`);
    
    console.log(`[ADAPTIVE VALIDATION] Executing validation plan: ${planId}`);
    
    plan.status = 'EXECUTING';
    plan.executedAt = new Date().toISOString();
    plan.results = new Map();

    try {
      // Execute validation for each impacted component
      for (const component of plan.impactedComponents) {
        console.log(`[ADAPTIVE VALIDATION] Validating: ${component.componentId} (${component.validationType})`);
        const result = await this.validateComponent(component);
        plan.results.set(component.componentId, result);
      }

      plan.status = 'COMPLETED';
      console.log(`[ADAPTIVE VALIDATION] Validation plan completed: ${planId}`);
    } catch (error) {
      console.error(`[ADAPTIVE VALIDATION] Validation plan failed: ${planId}`, error);
      plan.status = 'FAILED';
      throw error;
    }
  }

  /**
   * Validate a single component
   */
  private async validateComponent(component: ComponentImpact): Promise<any> {
    // TODO: Implement actual component validation logic
    console.log(`[ADAPTIVE VALIDATION] Validating ${component.componentId} with ${component.validationType} validation`);
    
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, component.estimatedDuration * 10)); // Speed up for demo
    
    return {
      componentId: component.componentId,
      componentType: component.componentType,
      validationType: component.validationType,
      passed: true,
      testsExecuted: component.validationType === 'FULL' ? 10 : component.validationType === 'PARTIAL' ? 5 : 2,
      testsFailed: 0,
      duration: component.estimatedDuration
    };
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): AdaptiveValidationPlan | null {
    return this.plans.get(planId) || null;
  }

  /**
   * Get all plans
   */
  getAllPlans(): AdaptiveValidationPlan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Get pending plans
   */
  getPendingPlans(): AdaptiveValidationPlan[] {
    return Array.from(this.plans.values()).filter(p => p.status === 'PENDING');
  }

  /**
   * Add custom impact rule
   */
  addImpactRule(rule: ImpactRule): void {
    this.impactRules.push(rule);
    console.log(`[ADAPTIVE VALIDATION] Added impact rule: ${rule.ruleId}`);
  }

  /**
   * Add component dependency
   */
  addComponentDependency(componentId: string, dependencies: string[]): void {
    this.componentDependencies.set(componentId, dependencies);
    console.log(`[ADAPTIVE VALIDATION] Added dependency for ${componentId}: ${dependencies.join(', ')}`);
  }

  /**
   * Generate plan ID
   */
  private generatePlanId(): string {
    return `PLAN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clear all plans (for testing)
   */
  clear(): void {
    this.plans.clear();
  }
}
