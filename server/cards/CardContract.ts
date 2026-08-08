/**
 * Card Contract System
 * MASTER PRODUCTION IMPLEMENTATION & ACCEPTANCE SPECIFICATION v7.0
 * 
 * Machine-readable contracts for all cards with validation
 */

export interface CardFieldContract {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required: boolean;
  minimum_confidence?: number;
  validation?: (value: any) => boolean;
}

export interface CardContract {
  card_type: string;
  required_fields: CardFieldContract[];
  minimum_confidence: number;
  empty_policy: {
    allowed: boolean;
    reason_required: boolean;
  };
  validation_rules?: (cardData: any) => { valid: boolean; errors: string[] };
}

export const CARD_CONTRACTS: Record<string, CardContract> = {
  COMPANIES: {
    card_type: 'COMPANIES',
    required_fields: [
      { name: 'company_name', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'edrpou', type: 'string', required: true, minimum_confidence: 0.95 },
      { name: 'status', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'address', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'registration_date', type: 'date', required: false, minimum_confidence: 0.80 },
      { name: 'legal_form', type: 'string', required: false, minimum_confidence: 0.75 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.company_name || cardData.company_name.trim().length === 0) {
        errors.push('company_name is required');
      }
      
      if (!cardData.edrpou || !/^\d{8}$/.test(cardData.edrpou)) {
        errors.push('edrpou must be 8 digits');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  PERSONS: {
    card_type: 'PERSONS',
    required_fields: [
      { name: 'full_name', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'ipn', type: 'string', required: false, minimum_confidence: 0.95 },
      { name: 'passport', type: 'string', required: false, minimum_confidence: 0.95 },
      { name: 'date_of_birth', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'address', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.full_name || cardData.full_name.trim().length === 0) {
        errors.push('full_name is required');
      }
      
      if (cardData.ipn && !/^\d{10}$/.test(cardData.ipn)) {
        errors.push('ipn must be 10 digits');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  FOPS: {
    card_type: 'FOPS',
    required_fields: [
      { name: 'full_name', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'ipn', type: 'string', required: true, minimum_confidence: 0.95 },
      { name: 'registration_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'status', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'activity_types', type: 'array', required: false, minimum_confidence: 0.75 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.full_name || cardData.full_name.trim().length === 0) {
        errors.push('full_name is required');
      }
      
      if (!cardData.ipn || !/^\d{10}$/.test(cardData.ipn)) {
        errors.push('ipn must be 10 digits');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  VEHICLES: {
    card_type: 'VEHICLES',
    required_fields: [
      { name: 'vin', type: 'string', required: true, minimum_confidence: 0.95 },
      { name: 'license_plate', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'make', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'model', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'year', type: 'number', required: false, minimum_confidence: 0.75 },
      { name: 'owner', type: 'string', required: false, minimum_confidence: 0.85 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.vin || cardData.vin.trim().length === 0) {
        errors.push('vin is required');
      }
      
      if (!cardData.license_plate || cardData.license_plate.trim().length === 0) {
        errors.push('license_plate is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  ADDRESSES: {
    card_type: 'ADDRESSES',
    required_fields: [
      { name: 'full_address', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'country', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'region', type: 'string', required: false, minimum_confidence: 0.75 },
      { name: 'city', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'street', type: 'string', required: false, minimum_confidence: 0.75 },
      { name: 'building', type: 'string', required: false, minimum_confidence: 0.70 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.85 }
    ],
    minimum_confidence: 0.85,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.full_address || cardData.full_address.trim().length === 0) {
        errors.push('full_address is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  COURT_CASES: {
    card_type: 'COURT_CASES',
    required_fields: [
      { name: 'case_number', type: 'string', required: true, minimum_confidence: 0.95 },
      { name: 'court_name', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'case_type', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'case_status', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'filing_date', type: 'date', required: false, minimum_confidence: 0.80 },
      { name: 'decision_date', type: 'date', required: false, minimum_confidence: 0.80 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.case_number || cardData.case_number.trim().length === 0) {
        errors.push('case_number is required');
      }
      
      if (!cardData.court_name || cardData.court_name.trim().length === 0) {
        errors.push('court_name is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  SANCTIONS: {
    card_type: 'SANCTIONS',
    required_fields: [
      { name: 'sanction_type', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'sanctioning_authority', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'imposition_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'expiration_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'reason', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.95 }
    ],
    minimum_confidence: 0.95,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.sanction_type || cardData.sanction_type.trim().length === 0) {
        errors.push('sanction_type is required');
      }
      
      if (!cardData.sanctioning_authority || cardData.sanctioning_authority.trim().length === 0) {
        errors.push('sanctioning_authority is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  LICENSES: {
    card_type: 'LICENSES',
    required_fields: [
      { name: 'license_type', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'license_number', type: 'string', required: true, minimum_confidence: 0.95 },
      { name: 'issuing_authority', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'issue_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'expiry_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'license_status', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.license_type || cardData.license_type.trim().length === 0) {
        errors.push('license_type is required');
      }
      
      if (!cardData.license_number || cardData.license_number.trim().length === 0) {
        errors.push('license_number is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  DECLARATIONS: {
    card_type: 'DECLARATIONS',
    required_fields: [
      { name: 'declaration_type', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'declaration_year', type: 'number', required: true, minimum_confidence: 0.95 },
      { name: 'submission_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'income', type: 'number', required: false, minimum_confidence: 0.80 },
      { name: 'assets_value', type: 'number', required: false, minimum_confidence: 0.80 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.declaration_type || cardData.declaration_type.trim().length === 0) {
        errors.push('declaration_type is required');
      }
      
      if (!cardData.declaration_year || cardData.declaration_year < 2000 || cardData.declaration_year > 2100) {
        errors.push('declaration_year must be a valid year');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  TAX_STATUS: {
    card_type: 'TAX_STATUS',
    required_fields: [
      { name: 'tax_id', type: 'string', required: true, minimum_confidence: 0.95 },
      { name: 'tax_status', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'tax_debt', type: 'number', required: false, minimum_confidence: 0.85 },
      { name: 'last_payment_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'tax_authority', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.tax_id || cardData.tax_id.trim().length === 0) {
        errors.push('tax_id is required');
      }
      
      if (!cardData.tax_status || cardData.tax_status.trim().length === 0) {
        errors.push('tax_status is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  DEBTS: {
    card_type: 'DEBTS',
    required_fields: [
      { name: 'debt_type', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'creditor', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'amount', type: 'number', required: true, minimum_confidence: 0.90 },
      { name: 'currency', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'due_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'debt_status', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.debt_type || cardData.debt_type.trim().length === 0) {
        errors.push('debt_type is required');
      }
      
      if (!cardData.creditor || cardData.creditor.trim().length === 0) {
        errors.push('creditor is required');
      }
      
      if (cardData.amount === undefined || cardData.amount === null) {
        errors.push('amount is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  ASSETS: {
    card_type: 'ASSETS',
    required_fields: [
      { name: 'asset_type', type: 'string', required: true, minimum_confidence: 0.90 },
      { name: 'asset_description', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'value', type: 'number', required: false, minimum_confidence: 0.85 },
      { name: 'currency', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'acquisition_date', type: 'date', required: false, minimum_confidence: 0.80 },
      { name: 'location', type: 'string', required: false, minimum_confidence: 0.75 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.85 }
    ],
    minimum_confidence: 0.85,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.asset_type || cardData.asset_type.trim().length === 0) {
        errors.push('asset_type is required');
      }
      
      if (!cardData.asset_description || cardData.asset_description.trim().length === 0) {
        errors.push('asset_description is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  TENDERS: {
    card_type: 'TENDERS',
    required_fields: [
      { name: 'tender_id', type: 'string', required: true, minimum_confidence: 0.95 },
      { name: 'tender_title', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'procuring_entity', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'tender_value', type: 'number', required: false, minimum_confidence: 0.85 },
      { name: 'currency', type: 'string', required: false, minimum_confidence: 0.80 },
      { name: 'award_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'tender_status', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.tender_id || cardData.tender_id.trim().length === 0) {
        errors.push('tender_id is required');
      }
      
      if (!cardData.tender_title || cardData.tender_title.trim().length === 0) {
        errors.push('tender_title is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  },

  EXECUTIVE_CASES: {
    card_type: 'EXECUTIVE_CASES',
    required_fields: [
      { name: 'executive_proceeding_number', type: 'string', required: true, minimum_confidence: 0.95 },
      { name: 'executive_authority', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'proceeding_type', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'proceeding_status', type: 'string', required: true, minimum_confidence: 0.85 },
      { name: 'initiation_date', type: 'date', required: false, minimum_confidence: 0.85 },
      { name: 'debt_amount', type: 'number', required: false, minimum_confidence: 0.85 },
      { name: 'source', type: 'string', required: true, minimum_confidence: 1.0 },
      { name: 'source_timestamp', type: 'date', required: true, minimum_confidence: 1.0 },
      { name: 'evidence', type: 'object', required: true, minimum_confidence: 0.90 }
    ],
    minimum_confidence: 0.90,
    empty_policy: {
      allowed: true,
      reason_required: true
    },
    validation_rules: (cardData) => {
      const errors: string[] = [];
      
      if (!cardData.executive_proceeding_number || cardData.executive_proceeding_number.trim().length === 0) {
        errors.push('executive_proceeding_number is required');
      }
      
      if (!cardData.executive_authority || cardData.executive_authority.trim().length === 0) {
        errors.push('executive_authority is required');
      }
      
      if (!cardData.source) {
        errors.push('source is required');
      }
      
      return { valid: errors.length === 0, errors };
    }
  }
};

export class CardContractValidator {
  static getContract(cardType: string): CardContract | null {
    return CARD_CONTRACTS[cardType] || null;
  }

  static validateCard(cardType: string, cardData: any): {
    valid: boolean;
    status: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL';
    errors: string[];
    fieldResults: Array<{ field: string; status: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL'; confidence?: number }>;
  } {
    const contract = this.getContract(cardType);
    
    if (!contract) {
      return {
        valid: false,
        status: 'FAIL',
        errors: [`No contract found for card type: ${cardType}`],
        fieldResults: []
      };
    }

    const errors: string[] = [];
    const fieldResults: Array<{ field: string; status: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL'; confidence?: number }> = [];
    let hasRequiredFields = true;

    for (const fieldContract of contract.required_fields) {
      const fieldValue = cardData[fieldContract.name];
      const fieldConfidence = cardData[`${fieldContract.name}_confidence`] || 0;

      let fieldStatus: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL' = 'PASS';

      if (fieldContract.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
        fieldStatus = 'FAIL';
        errors.push(`${fieldContract.name} is required`);
        hasRequiredFields = false;
      } else if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        fieldStatus = 'NO_DATA';
      } else if (fieldContract.minimum_confidence && fieldConfidence < fieldContract.minimum_confidence) {
        fieldStatus = 'WARNING';
        errors.push(`${fieldContract.name} confidence ${fieldConfidence} below minimum ${fieldContract.minimum_confidence}`);
      }

      fieldResults.push({
        field: fieldContract.name,
        status: fieldStatus,
        confidence: fieldConfidence
      });
    }

    // Run custom validation rules if present
    if (contract.validation_rules) {
      const customValidation = contract.validation_rules(cardData);
      if (!customValidation.valid) {
        errors.push(...customValidation.errors);
      }
    }

    // Determine overall status
    let status: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL' = 'PASS';
    
    if (!hasRequiredFields) {
      status = 'FAIL';
    } else if (errors.length > 0) {
      status = 'WARNING';
    } else if (fieldResults.every(f => f.status === 'NO_DATA')) {
      status = 'NO_DATA';
    }

    return {
      valid: status !== 'FAIL',
      status,
      errors,
      fieldResults
    };
  }

  static validateEmptyCard(cardType: string, reason: string): {
    valid: boolean;
    status: 'NO_DATA';
    errors: string[];
  } {
    const contract = this.getContract(cardType);
    
    if (!contract) {
      return {
        valid: false,
        status: 'NO_DATA',
        errors: [`No contract found for card type: ${cardType}`]
      };
    }

    if (!contract.empty_policy.allowed) {
      return {
        valid: false,
        status: 'NO_DATA',
        errors: ['Empty cards are not allowed for this card type']
      };
    }

    if (contract.empty_policy.reason_required && !reason) {
      return {
        valid: false,
        status: 'NO_DATA',
        errors: ['Empty card reason is required']
      };
    }

    return {
      valid: true,
      status: 'NO_DATA',
      errors: []
    };
  }
}
