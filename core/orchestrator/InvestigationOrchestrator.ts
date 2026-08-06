// core/orchestrator/InvestigationOrchestrator.ts
import { DiscoveryEngine } from '../discovery/DiscoveryEngine';
import { NormalizedFact } from '../connectors/types';
import { IdentifierClassifier } from '../classifier/IdentifierClassifier';
import { SourceRouter } from './SourceRouter';
import { EntityResolutionEngine } from '../resolution/EntityResolutionEngine';
import { GraphEngine } from '../graph/GraphEngine';
import { RiskEngine } from '../analytics/RiskEngine';

export interface InvestigationContext {
  investigation_id: string;
  identifier: {
    type: 'RNOKPP' | 'EDRPOU' | 'PHONE' | 'UNKNOWN';
    value: string;
  };
  facts: NormalizedFact[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export class InvestigationOrchestrator {
  private discoveryEngine: DiscoveryEngine;
  private resolutionEngine: EntityResolutionEngine;
  private graphEngine: GraphEngine;
  private riskEngine: RiskEngine;

  constructor(
    discoveryEngine: DiscoveryEngine, 
    resolutionEngine: EntityResolutionEngine,
    graphEngine: GraphEngine,
    riskEngine: RiskEngine
  ) {
    this.discoveryEngine = discoveryEngine;
    this.resolutionEngine = resolutionEngine;
    this.graphEngine = graphEngine;
    this.riskEngine = riskEngine;
  }

  async startInvestigation(input: string): Promise<string> {
    const classification = IdentifierClassifier.classify(input);
    
    if (!classification.isValid) {
      throw new Error(`[ORCHESTRATOR] ${classification.message}`);
    }

    const investigation_id = `inv_${Date.now()}`;
    const requiredSources = SourceRouter.getRequiredSources(classification.type);
    
    console.log(`[ORCHESTRATOR] Створення розслідування ${investigation_id} для ${classification.type}: ${classification.value}`);
    console.log(`[ORCHESTRATOR] Заплановані джерела: ${requiredSources.join(', ')}`);
    
    // Запуск паралельних jobs для кожного джерела
    const jobPromises = requiredSources.map(source => 
      this.discoveryEngine.runDiscovery(source, classification.value)
    );
    
    const results = await Promise.all(jobPromises);
    const allFacts = results.flat();
    
    console.log(`[ORCHESTRATOR] Зібрано ${allFacts.length} фактів.`);
    
    // Entity Resolution
    const resolvedEntity = await this.resolutionEngine.resolve(allFacts);
    console.log(`[ORCHESTRATOR] Entity Resolution статус: ${resolvedEntity.status}`);
    
    // Build Graph
    await this.graphEngine.addEntity(classification.type, classification.value, {});
    
    // Risk Analysis
    const riskFactors = await this.riskEngine.analyze(allFacts);
    console.log(`[ORCHESTRATOR] Аналіз ризиків завершено: ${riskFactors.length} факторів знайдено.`);
    
    console.log(`[ORCHESTRATOR] Розслідування ${investigation_id} завершено.`);
    
    return investigation_id;
  }
}
