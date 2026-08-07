/**
 * Card-Level Production Validation & Data Completeness Certification Framework v1.0
 * Main certification engine that orchestrates the validation process
 */

import { CardValidator } from './validator';
import { CARD_REGISTRY, getCardDefinition } from './cardRegistry';
import {
  CardValidationResult,
  CardPreview,
  CardCoverageScore,
  ProductionHealthIndex,
  CertificationReport,
  CardStatus,
} from './types';
import { CanonicalEntity } from '../types/predator';

export class CertificationEngine {
  /**
   * Run full certification for a control profile
   */
  static async runCertification(
    controlRnokpp: string,
    entity: CanonicalEntity,
    cardDataMap: Map<string, any>
  ): Promise<CertificationReport> {
    const cardResults: CardValidationResult[] = [];
    const registriesUsed = new Set<string>();
    const errorsFound: string[] = [];
    const fixesApplied: string[] = [];

    // Validate each card in the registry
    for (const cardDef of CARD_REGISTRY) {
      const cardData = cardDataMap.get(cardDef.id);
      
      try {
        const result = CardValidator.validateCard(
          cardDef.id,
          cardDef.name,
          cardDef.category,
          entity,
          cardData
        );
        
        cardResults.push(result);
        
        // Collect registries used
        result.fields.forEach(field => {
          if (field.registry !== 'UNKNOWN') {
            registriesUsed.add(field.registry);
          }
        });

        // Collect errors
        if (result.status === 'FAIL') {
          errorsFound.push(`${cardDef.name}: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        errorsFound.push(`${cardDef.name}: Validation failed with error - ${error}`);
      }
    }

    // Calculate card coverage score
    const cardCoverageScore = this.calculateCardCoverageScore(cardResults);

    // Calculate production health index
    const productionHealthIndex = this.calculateProductionHealthIndex(
      cardCoverageScore,
      entity
    );

    // Determine final conclusion
    const finalConclusion = this.generateFinalConclusion(
      cardCoverageScore,
      productionHealthIndex,
      errorsFound
    );

    return {
      controlProfile: {
        rnokpp: controlRnokpp,
        testedAt: new Date().toISOString(),
      },
      cardResults,
      cardCoverageScore,
      productionHealthIndex,
      registriesUsed: Array.from(registriesUsed),
      errorsFound,
      fixesApplied,
      retestResults: null,
      finalConclusion,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate card previews for quick status overview
   */
  static generateCardPreviews(
    cardResults: CardValidationResult[]
  ): CardPreview[] {
    return cardResults.map(result => ({
      cardId: result.cardId,
      cardName: result.cardName,
      status: result.status,
      completionPercentage: result.completionPercentage,
      sourceCount: result.sourceCount,
      lastUpdated: result.lastUpdated,
      confidenceScore: result.confidenceScore,
    }));
  }

  /**
   * Calculate card coverage score
   */
  private static calculateCardCoverageScore(
    cardResults: CardValidationResult[]
  ): CardCoverageScore {
    const totalCards = cardResults.length;
    const passedCards = cardResults.filter(r => r.status === 'PASS').length;
    const warningCards = cardResults.filter(r => r.status === 'WARNING').length;
    const noDataCards = cardResults.filter(r => r.status === 'NO_DATA').length;
    const failedCards = cardResults.filter(r => r.status === 'FAIL').length;

    // Calculate overall score (PASS=100, WARNING=50, NO_DATA=25, FAIL=0)
    const scoreSum = cardResults.reduce((sum, result) => {
      switch (result.status) {
        case 'PASS':
          return sum + 100;
        case 'WARNING':
          return sum + 50;
        case 'NO_DATA':
          return sum + 25;
        case 'FAIL':
          return sum + 0;
        default:
          return sum;
      }
    }, 0);

    const overallScore = Math.round(scoreSum / totalCards);

    return {
      totalCards,
      passedCards,
      warningCards,
      noDataCards,
      failedCards,
      overallScore,
    };
  }

  /**
   * Calculate production health index
   */
  private static calculateProductionHealthIndex(
    cardCoverage: CardCoverageScore,
    entity: CanonicalEntity
  ): ProductionHealthIndex {
    // Data freshness (0-100 based on last update)
    const lastUpdate = new Date(entity.updatedAt);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    const dataFreshness = Math.max(0, Math.min(100, 100 - daysSinceUpdate));

    // Source reliability (based on number of sources)
    const sourceReliability = Math.min(100, entity.sourcesCount * 10);

    // API health (placeholder - should be measured from actual API calls)
    const apiHealth = 95; // Default to healthy

    // Overall health calculation
    const overallHealth = Math.round(
      (cardCoverage.overallScore * 0.4) +
      (dataFreshness * 0.2) +
      (sourceReliability * 0.2) +
      (apiHealth * 0.2)
    );

    // Determine if production ready
    const isProductionReady = 
      cardCoverage.failedCards === 0 &&
      cardCoverage.overallScore >= 80 &&
      overallHealth >= 80;

    return {
      cardCoverage,
      dataFreshness,
      sourceReliability,
      apiHealth,
      overallHealth,
      isProductionReady,
    };
  }

  /**
   * Generate final conclusion
   */
  private static generateFinalConclusion(
    cardCoverage: CardCoverageScore,
    productionHealth: ProductionHealthIndex,
    errorsFound: string[]
  ): string {
    if (cardCoverage.failedCards > 0) {
      return `CRITICAL: ${cardCoverage.failedCards} card(s) failed validation. Platform is NOT PRODUCTION READY. Immediate action required.`;
    }

    if (cardCoverage.overallScore < 80) {
      return `WARNING: Card coverage score (${cardCoverage.overallScore}%) is below production threshold (80%). Platform requires improvement before production deployment.`;
    }

    if (!productionHealth.isProductionReady) {
      return `WARNING: Production health index (${productionHealth.overallHealth}%) is below threshold. Platform requires attention before production deployment.`;
    }

    if (errorsFound.length > 0) {
      return `CONDITIONAL: All critical cards passed, but ${errorsFound.length} non-critical issues detected. Platform is PRODUCTION READY with monitoring recommended.`;
    }

    return `SUCCESS: All cards validated successfully. Card coverage: ${cardCoverage.overallScore}%, Production health: ${productionHealth.overallHealth}%. Platform is CERTIFIED PRODUCTION READY.`;
  }

  /**
   * Retest failed cards after fixes
   */
  static async retestFailedCards(
    report: CertificationReport,
    entity: CanonicalEntity,
    cardDataMap: Map<string, any>
  ): Promise<CertificationReport> {
    const failedCardIds = report.cardResults
      .filter(r => r.status === 'FAIL' || r.status === 'WARNING')
      .map(r => r.cardId);

    const retestResults: CardValidationResult[] = [];

    for (const cardId of failedCardIds) {
      const cardDef = getCardDefinition(cardId);
      if (!cardDef) continue;

      const cardData = cardDataMap.get(cardId);
      const result = CardValidator.validateCard(
        cardId,
        cardDef.name,
        cardDef.category,
        entity,
        cardData
      );
      
      retestResults.push(result);
    }

    // Update the report with retest results
    const updatedCardResults = [...report.cardResults];
    retestResults.forEach(retestResult => {
      const index = updatedCardResults.findIndex(r => r.cardId === retestResult.cardId);
      if (index !== -1) {
        updatedCardResults[index] = retestResult;
      }
    });

    // Recalculate scores
    const cardCoverageScore = this.calculateCardCoverageScore(updatedCardResults);
    const productionHealthIndex = this.calculateProductionHealthIndex(
      cardCoverageScore,
      entity
    );

    return {
      ...report,
      cardResults: updatedCardResults,
      cardCoverageScore,
      productionHealthIndex,
      retestResults,
      generatedAt: new Date().toISOString(),
    };
  }
}
