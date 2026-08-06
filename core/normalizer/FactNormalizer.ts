// core/normalizer/FactNormalizer.ts
import { RawEvidence, NormalizedFact } from '../connectors/types';

export class FactNormalizer {
  static normalize(raw: RawEvidence): NormalizedFact[] {
    console.log(`[NORMALIZER] Нормалізація даних з ${raw.source_id}`);
    
    // В реальності тут буде складний маппінг для кожного джерела
    // Наразі повертаємо базовий факт для тестування
    
    return [
      {
        fact_id: `fact_${Date.now()}_${raw.hash}`,
        entity_id: 'unknown_entity', // Має бути визначено через ResolutionEngine
        fact_type: 'raw_entry',
        value: raw.raw_data,
        confidence: 'POSSIBLE',
        evidence_id: raw.hash // Це має бути посилання на ID збереженого RawEvidence
      }
    ];
  }
}
