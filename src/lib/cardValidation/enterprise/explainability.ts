/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Explainability Engine
 * BLOCK 11
 */

import { FieldExplanation, FieldAudit } from './types';

export class ExplainabilityEngine {
  /**
   * Generate explanation for a field value
   */
  static generateExplanation(
    fieldName: string,
    fieldAudit: FieldAudit,
    relatedFields?: Map<string, FieldAudit>
  ): FieldExplanation {
    const value = fieldAudit.value;
    const explanation = this.buildExplanation(fieldName, value, fieldAudit, relatedFields);
    const reasoning = this.generateReasoning(fieldName, value, fieldAudit, relatedFields);
    const sources = this.extractSources(fieldAudit);

    return {
      fieldName,
      value,
      explanation,
      reasoning,
      sources,
      confidence: fieldAudit.confidenceScore,
      aiGenerated: false,
    };
  }

  /**
   * Build explanation for field value
   */
  private static buildExplanation(
    fieldName: string,
    value: any,
    fieldAudit: FieldAudit,
    relatedFields?: Map<string, FieldAudit>
  ): string {
    switch (fieldName) {
      case 'companyCount':
        return this.explainCompanyCount(value, relatedFields);
      case 'courtCases':
        return this.explainCourtCases(value, relatedFields);
      case 'riskScore':
        return this.explainRiskScore(value, relatedFields);
      case 'sanctions':
        return this.explainSanctions(value, relatedFields);
      case 'fullName':
        return this.explainFullName(value, fieldAudit);
      case 'rnokpp':
        return this.explainRnokpp(value, fieldAudit);
      default:
        return this.explainGeneric(fieldName, value, fieldAudit);
    }
  }

  /**
   * Explain company count
   */
  private static explainCompanyCount(value: any, relatedFields?: Map<string, FieldAudit>): string {
    const count = Number(value);
    
    if (relatedFields) {
      const active = relatedFields.get('activeCompanies');
      const dissolved = relatedFields.get('dissolvedCompanies');
      
      if (active && dissolved) {
        const activeCount = Number(active.value) || 0;
        const dissolvedCount = Number(dissolved.value) || 0;
        return `${count} total companies: ${activeCount} active + ${dissolvedCount} dissolved`;
      }
    }
    
    return `${count} companies found in registries`;
  }

  /**
   * Explain court cases
   */
  private static explainCourtCases(value: any, relatedFields?: Map<string, FieldAudit>): string {
    const count = Number(value);
    
    if (relatedFields) {
      const criminal = relatedFields.get('criminalCases');
      const administrative = relatedFields.get('administrativeCases');
      const civil = relatedFields.get('civilCases');
      
      if (criminal || administrative || civil) {
        const parts = [];
        if (criminal) parts.push(`${criminal.value} criminal`);
        if (administrative) parts.push(`${administrative.value} administrative`);
        if (civil) parts.push(`${civil.value} civil`);
        
        return `${count} total cases: ${parts.join(', ')}`;
      }
    }
    
    return `${count} court cases found in EDRSR`;
  }

  /**
   * Explain risk score
   */
  private static explainRiskScore(value: any, relatedFields?: Map<string, FieldAudit>): string {
    const score = Number(value);
    
    if (relatedFields) {
      const sanctions = relatedFields.get('hasSanctions');
      const courtCases = relatedFields.get('courtCases');
      const enforcements = relatedFields.get('enforcements');
      
      const factors = [];
      if (sanctions && sanctions.value === true) factors.push('sanctions');
      if (courtCases && Number(courtCases.value) > 0) factors.push('court cases');
      if (enforcements && Number(enforcements.value) > 0) factors.push('enforcements');
      
      if (factors.length > 0) {
        return `Risk score ${score} based on: ${factors.join(', ')}`;
      }
    }
    
    if (score >= 80) return `High risk score ${score} indicates significant risk factors`;
    if (score >= 50) return `Medium risk score ${score} indicates moderate risk factors`;
    return `Low risk score ${score} indicates minimal risk factors`;
  }

  /**
   * Explain sanctions
   */
  private static explainSanctions(value: any, relatedFields?: Map<string, FieldAudit>): string {
    if (value === true || value === 'true') {
      if (relatedFields) {
        const rnbo = relatedFields.get('rnboSanctions');
        const ofac = relatedFields.get('ofacSanctions');
        const eu = relatedFields.get('euSanctions');
        
        const sources = [];
        if (rnbo && rnbo.value === true) sources.push('RNBO');
        if (ofac && ofac.value === true) sources.push('OFAC');
        if (eu && eu.value === true) sources.push('EU');
        
        if (sources.length > 0) {
          return `Sanctioned by: ${sources.join(', ')}`;
        }
      }
      return 'Entity appears in sanctions lists';
    }
    return 'No sanctions detected in checked registries';
  }

  /**
   * Explain full name
   */
  private static explainFullName(value: any, fieldAudit: FieldAudit): string {
    return `Name "${value}" verified from ${fieldAudit.registry} with ${fieldAudit.confidenceScore}% confidence`;
  }

  /**
   * Explain RNOKPP
   */
  private static explainRnokpp(value: any, fieldAudit: FieldAudit): string {
    return `Tax ID "${value}" retrieved from ${fieldAudit.registry}, validated with checksum ${fieldAudit.confidenceScore}%`;
  }

  /**
   * Generic explanation
   */
  private static explainGeneric(fieldName: string, value: any, fieldAudit: FieldAudit): string {
    return `Field "${fieldName}" with value "${value}" sourced from ${fieldAudit.registry} (${fieldAudit.confidenceScore}% confidence)`;
  }

  /**
   * Generate reasoning steps
   */
  private static generateReasoning(
    fieldName: string,
    value: any,
    fieldAudit: FieldAudit,
    relatedFields?: Map<string, FieldAudit>
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`1. Field "${fieldName}" was retrieved from ${fieldAudit.registry}`);
    reasoning.push(`2. Data was processed by connector ${fieldAudit.connector} (v${fieldAudit.connectorVersion})`);
    reasoning.push(`3. Normalizer v${fieldAudit.normalizerVersion} standardized the value`);
    reasoning.push(`4. Confidence score calculated as ${fieldAudit.confidenceScore}%`);
    reasoning.push(`5. Field status: ${fieldAudit.status}`);

    if (fieldAudit.status === 'VERIFIED') {
      reasoning.push('6. Value verified against source data');
    } else if (fieldAudit.status === 'UNVERIFIED') {
      reasoning.push('6. Value could not be verified against source');
    } else if (fieldAudit.status === 'CONFLICT') {
      reasoning.push('6. Conflict detected with other sources');
    }

    return reasoning;
  }

  /**
   * Extract sources from field audit
   */
  private static extractSources(fieldAudit: FieldAudit): string[] {
    const sources: string[] = [];
    
    sources.push(fieldAudit.registry);
    sources.push(fieldAudit.connector);
    
    if (fieldAudit.source && fieldAudit.source !== 'unknown') {
      sources.push(fieldAudit.source);
    }

    return [...new Set(sources)];
  }

  /**
   * Generate AI explanation with confidence
   */
  static generateAIExplanation(
    fieldName: string,
    value: any,
    aiModel: string,
    prompt: string
  ): FieldExplanation {
    return {
      fieldName,
      value,
      explanation: `AI-generated explanation using ${aiModel}`,
      reasoning: [
        `1. AI model ${aiModel} analyzed field "${fieldName}"`,
        `2. Prompt: "${prompt}"`,
        `3. Model generated explanation based on training data`,
      ],
      sources: [aiModel],
      confidence: 75, // Default AI confidence
      aiGenerated: true,
      aiConfidence: 75,
    };
  }

  /**
   * Validate explanation quality
   */
  static validateExplanation(explanation: FieldExplanation): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!explanation.explanation || explanation.explanation.length === 0) {
      issues.push('Explanation is empty');
    }

    if (explanation.reasoning.length === 0) {
      issues.push('No reasoning steps provided');
    }

    if (explanation.sources.length === 0) {
      issues.push('No sources listed');
    }

    if (explanation.aiGenerated && !explanation.aiConfidence) {
      issues.push('AI-generated explanation missing AI confidence score');
    }

    if (explanation.confidence < 50) {
      issues.push('Low confidence score may indicate unreliable explanation');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
