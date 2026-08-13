/**
 * Card Contract Engine
 * 
 * Validates IntelligenceDossier against defined card contracts
 * Ensures data quality, completeness, and compliance before card generation
 */

import { IntelligenceDossier, EntityType } from '../../src/types/predator.js';

export interface CardContract {
  id: string;
  entityType: EntityType;
  required_fields: string[];
  accepted_sources: string[];
  minimum_confidence: number;
  evidence_required: boolean;
  empty_policy: 'ALLOW_EMPTY' | 'REJECT_EMPTY' | 'WARN_EMPTY';
}

export interface CardValidationResult {
  card_id: string;
  contract_id: string;
  status: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL';
  field_validations: FieldValidation[];
  overall_score: number;
  errors: string[];
  warnings: string[];
}

export interface FieldValidation {
  field: string;
  status: 'PASS' | 'FAIL' | 'MISSING' | 'EMPTY';
  value: any;
  required: boolean;
  message: string;
}

export class CardContractEngine {
  private contracts: Map<string, CardContract> = new Map();

  constructor() {
    this.initializeDefaultContracts();
  }

  /**
   * Initialize default card contracts
   */
  private initializeDefaultContracts(): void {
    // Company Card Contract
    this.contracts.set('company', {
      id: 'company',
      entityType: 'COMPANY',
      required_fields: ['company_name', 'edrpou', 'source', 'verified_at', 'evidence'],
      accepted_sources: ['data.gov.ua', 'ua.edr', 'ua.tax'],
      minimum_confidence: 0.90,
      evidence_required: true,
      empty_policy: 'REJECT_EMPTY',
    });

    // Person Card Contract
    this.contracts.set('person', {
      id: 'person',
      entityType: 'PERSON',
      required_fields: ['name', 'ipn', 'source', 'verified_at', 'evidence'],
      accepted_sources: ['data.gov.ua', 'ua.edr', 'ua.tax'],
      minimum_confidence: 0.90,
      evidence_required: true,
      empty_policy: 'REJECT_EMPTY',
    });

    // FOP Card Contract
    this.contracts.set('fop', {
      id: 'fop',
      entityType: 'FOP',
      required_fields: ['name', 'ipn', 'source', 'verified_at', 'evidence'],
      accepted_sources: ['data.gov.ua', 'ua.tax'],
      minimum_confidence: 0.90,
      evidence_required: true,
      empty_policy: 'REJECT_EMPTY',
    });
  }

  /**
   * Register a custom card contract
   */
  registerContract(contract: CardContract): void {
    this.contracts.set(contract.id, contract);
    console.log(`[CardContractEngine] Registered contract: ${contract.id}`);
  }

  /**
   * Validate IntelligenceDossier against contract
   */
  validateDossier(dossier: IntelligenceDossier, contractId?: string): CardValidationResult {
    const entityType = dossier.entity.type;
    const contract = contractId 
      ? this.contracts.get(contractId)
      : this.getContractForEntityType(entityType);

    if (!contract) {
      return {
        card_id: dossier.entity.id,
        contract_id: contractId || 'unknown',
        status: 'FAIL',
        field_validations: [],
        overall_score: 0,
        errors: [`No contract found for entity type: ${entityType}`],
        warnings: [],
      };
    }

    console.log(`[CardContractEngine] Validating dossier ${dossier.entity.id} against contract ${contract.id}`);

    const fieldValidations: FieldValidation[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    for (const field of contract.required_fields) {
      const validation = this.validateField(dossier, field, true);
      fieldValidations.push(validation);

      if (validation.status === 'MISSING' || validation.status === 'FAIL') {
        errors.push(`Field ${field}: ${validation.message}`);
      } else if (validation.status === 'EMPTY') {
        warnings.push(`Field ${field}: ${validation.message}`);
      }
    }

    // Validate minimum confidence
    const confidenceScore = dossier.entity.confidenceScore / 100;
    if (confidenceScore < contract.minimum_confidence) {
      errors.push(
        `Confidence score ${confidenceScore.toFixed(2)} below minimum ${contract.minimum_confidence}`
      );
    }

    // Validate evidence requirement
    if (contract.evidence_required && dossier.claims.length === 0) {
      errors.push('Evidence required but no claims found');
    }

    // Validate source acceptance
    const sourceIds = new Set(dossier.claims.map(c => c.sourceId));
    const hasAcceptedSource = [...sourceIds].some(source => 
      contract.accepted_sources.includes(source)
    );
    if (!hasAcceptedSource && sourceIds.size > 0) {
      warnings.push(`Sources not in accepted list: ${[...sourceIds].join(', ')}`);
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(fieldValidations, errors, warnings);

    // Determine status
    let status: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL';
    if (dossier.status === 'NO_DATA') {
      status = 'NO_DATA';
    } else if (errors.length > 0) {
      status = 'FAIL';
    } else if (warnings.length > 0) {
      status = 'WARNING';
    } else {
      status = 'PASS';
    }

    console.log(`[CardContractEngine] Validation result: ${status} (score: ${overallScore})`);

    return {
      card_id: dossier.entity.id,
      contract_id: contract.id,
      status,
      field_validations: fieldValidations,
      overall_score: overallScore,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single field
   */
  private validateField(dossier: IntelligenceDossier, field: string, required: boolean): FieldValidation {
    // Check in attributes
    const attribute = dossier.entity.attributes.find(a => a.key === field);
    if (attribute) {
      const value = attribute.value;
      if (value === null || value === undefined || value === '') {
        return {
          field,
          status: 'EMPTY',
          value,
          required,
          message: `Field is empty`,
        };
      }
      return {
        field,
        status: 'PASS',
        value,
        required,
        message: 'Field is valid',
      };
    }

    // Check in identifiers
    if (field === 'edrpou' && dossier.entity.identifiers.edrpou) {
      return {
        field,
        status: 'PASS',
        value: dossier.entity.identifiers.edrpou,
        required,
        message: 'Field is valid',
      };
    }

    if (field === 'ipn' && dossier.entity.identifiers.ipn) {
      return {
        field,
        status: 'PASS',
        value: dossier.entity.identifiers.ipn,
        required,
        message: 'Field is valid',
      };
    }

    // Check in entity properties
    if (field === 'company_name' && dossier.entity.canonicalName) {
      return {
        field,
        status: 'PASS',
        value: dossier.entity.canonicalName,
        required,
        message: 'Field is valid',
      };
    }

    if (field === 'name' && dossier.entity.canonicalName) {
      return {
        field,
        status: 'PASS',
        value: dossier.entity.canonicalName,
        required,
        message: 'Field is valid',
      };
    }

    if (field === 'source' && dossier.entity.sourcesCount > 0) {
      return {
        field,
        status: 'PASS',
        value: dossier.entity.sourcesCount,
        required,
        message: 'Field is valid',
      };
    }

    if (field === 'verified_at' && dossier.entity.updatedAt) {
      return {
        field,
        status: 'PASS',
        value: dossier.entity.updatedAt,
        required,
        message: 'Field is valid',
      };
    }

    if (field === 'evidence' && dossier.claims.length > 0) {
      return {
        field,
        status: 'PASS',
        value: dossier.claims.length,
        required,
        message: 'Field is valid',
      };
    }

    // Field not found
    if (required) {
      return {
        field,
        status: 'MISSING',
        value: null,
        required,
        message: 'Required field is missing',
      };
    }

    return {
      field,
      status: 'PASS',
      value: null,
      required,
      message: 'Optional field not present',
    };
  }

  /**
   * Get contract for entity type
   */
  private getContractForEntityType(entityType: EntityType): CardContract | undefined {
    for (const contract of this.contracts.values()) {
      if (contract.entityType === entityType) {
        return contract;
      }
    }
    return undefined;
  }

  /**
   * Calculate overall validation score
   */
  private calculateOverallScore(
    fieldValidations: FieldValidation[],
    errors: string[],
    warnings: string[]
  ): number {
    const totalFields = fieldValidations.length;
    if (totalFields === 0) return 0;

    const passedFields = fieldValidations.filter(f => f.status === 'PASS').length;
    const fieldScore = (passedFields / totalFields) * 100;

    // Deduct points for errors and warnings
    const errorPenalty = errors.length * 20;
    const warningPenalty = warnings.length * 5;

    let score = fieldScore - errorPenalty - warningPenalty;
    score = Math.max(0, Math.min(100, score));

    return Math.round(score);
  }

  /**
   * Get all registered contracts
   */
  getContracts(): CardContract[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Get contract by ID
   */
  getContract(id: string): CardContract | undefined {
    return this.contracts.get(id);
  }
}
