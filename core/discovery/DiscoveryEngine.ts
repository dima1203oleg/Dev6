// core/discovery/DiscoveryEngine.ts
import { ConnectorFactory } from '../connectors/ConnectorFactory';
import { SourceType } from '../orchestrator/SourceRouter';
import { EvidenceEngine } from '../evidence/EvidenceEngine';
import { FactNormalizer } from '../normalizer/FactNormalizer';
import { NormalizedFact } from '../connectors/types';

export class DiscoveryEngine {
  private evidenceEngine: EvidenceEngine;

  constructor(evidenceEngine: EvidenceEngine) {
    this.evidenceEngine = evidenceEngine;
  }

  async runDiscovery(sourceType: SourceType, identifier: string): Promise<NormalizedFact[]> {
    console.log(`[DISCOVERY ENGINE] Запуск пошуку для: ${identifier} в ${sourceType}`);
    
    const connector = ConnectorFactory.getConnector(sourceType);
    
    // Перевірка здоров'я
    const health = await connector.health_check();
    if (health !== 'LIVE') {
      console.error(`[DISCOVERY ENGINE] Джерело ${sourceType} недоступне. Статус: ${health}`);
      return [];
    }

    // Запуск пошуку
    const results = await connector.search(identifier);
    console.log(`[DISCOVERY ENGINE] Знайдено ${results.length} записів у ${sourceType}`);

    const allFacts: NormalizedFact[] = [];
    
    // Збереження результатів у EvidenceEngine та нормалізація
    for (const res of results) {
      const evidence = {
        evidence_id: `ev_${Date.now()}_${res.hash}`,
        source_id: res.source_id,
        query: identifier,
        retrieved_at: new Date().toISOString(),
        payload_hash: res.hash,
        raw_document: res.raw_data,
        parser_version: res.parser_version,
        connector_version: res.connector_version,
        source_url: '',
        source_timestamp: res.timestamp,
        status: 'VALID' as const
      };
      await this.evidenceEngine.storeEvidence(evidence);
      
      // Нормалізація
      const facts = FactNormalizer.normalize(evidence as any); // Temporary cast
      console.log(`[DISCOVERY ENGINE] Створено ${facts.length} фактів для ${sourceType}`);
      allFacts.push(...facts);
    }
    return allFacts;
  }
}
