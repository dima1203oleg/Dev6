// core/orchestrator/SourceRouter.ts
import { IdentifierType } from '../classifier/IdentifierClassifier';

export type SourceType = 'UA.EDR' | 'UA.COURTS' | 'UA.TAX' | 'UA.SANCTIONS' | 'UA.DEBTORS' | 'UA.BANKRUPTCY';

export class SourceRouter {
  static getRequiredSources(type: IdentifierType): SourceType[] {
    const sources: SourceType[] = [];

    if (type === 'RNOKPP') {
      // Фізична особа: суди, борги, санкції, можливо ФОП
      sources.push('UA.COURTS', 'UA.DEBTORS', 'UA.SANCTIONS');
    } else if (type === 'EDRPOU') {
      // Юридична особа: ЄДР, суди, податки, санкції
      sources.push('UA.EDR', 'UA.COURTS', 'UA.TAX', 'UA.SANCTIONS', 'UA.BANKRUPTCY');
    }

    return sources;
  }
}
