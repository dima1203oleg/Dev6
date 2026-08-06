/**
 * PREDATOR Analytics - UI Integration Test Framework
 * Provenance Display Validation Tests
 */

import { BaseUITest } from '../BaseUITest';
import { ValidationResult, UICardStructure, FieldProvenance } from '../types';

export class ProvenanceValidator extends BaseUITest {
  async validateAllProvenance(uiCard: UICardStructure): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of uiCard.profile_fields) {
      if (field.provenance && field.provenance.length > 0) {
        for (const prov of field.provenance) {
          const provValidation = this.validateSingleProvenance(prov);
          if (!provValidation.valid) {
            errors.push(...provValidation.errors.map(e => `${field.field_name}: ${e}`));
          }
          if (provValidation.warnings.length > 0) {
            warnings.push(...provValidation.warnings.map(w => `${field.field_name}: ${w}`));
          }
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateSingleProvenance(prov: FieldProvenance): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!prov.source) {
      errors.push('Provenance missing source');
    }

    if (!prov.timestamp) {
      errors.push('Provenance missing timestamp');
    } else if (!(prov.timestamp instanceof Date) || isNaN(prov.timestamp.getTime())) {
      errors.push('Provenance timestamp is not a valid Date');
    }

    if (!prov.record_id) {
      warnings.push('Provenance missing record_id');
    }

    if (!prov.raw_fragment) {
      warnings.push('Provenance missing raw fragment');
    }

    if (prov.confidence === undefined || prov.confidence === null) {
      warnings.push('Provenance missing confidence score');
    } else if (prov.confidence < 0 || prov.confidence > 1) {
      errors.push(`Invalid confidence score: ${prov.confidence} (must be 0-1)`);
    }

    // Validate status
    const statusValidation = this.validateFieldStatus(prov.status);
    if (!statusValidation.valid) {
      errors.push(...statusValidation.errors);
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateProvenanceCompleteness(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const fieldsWithValues = uiCard.profile_fields.filter(f => 
      f.value !== undefined && f.value !== null && f.value !== ''
    );

    for (const field of fieldsWithValues) {
      if (!field.provenance || field.provenance.length === 0) {
        errors.push(`Field ${field.field_name} has value but no provenance`);
      }
    }

    const fieldsWithoutValues = uiCard.profile_fields.filter(f => 
      f.value === undefined || f.value === null || f.value === ''
    );

    for (const field of fieldsWithoutValues) {
      if (field.provenance && field.provenance.length > 0) {
        warnings.push(`Field ${field.field_name} has no value but has provenance`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateProvenanceFreshness(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
    const veryStaleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const field of uiCard.profile_fields) {
      if (field.provenance) {
        for (const prov of field.provenance) {
          if (prov.timestamp) {
            const age = now - prov.timestamp.getTime();
            
            if (age > veryStaleThreshold) {
              errors.push(`Field ${field.field_name} provenance is very old: ${Math.round(age / 1000 / 60 / 60)} hours`);
            } else if (age > staleThreshold) {
              warnings.push(`Field ${field.field_name} provenance is stale: ${Math.round(age / 1000 / 60)} minutes`);
            }
          }
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateProvenanceSourceDiversity(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const allSources = new Set<string>();
    const fieldSourceMap = new Map<string, Set<string>>();

    for (const field of uiCard.profile_fields) {
      if (field.provenance) {
        const fieldSources = new Set<string>();
        for (const prov of field.provenance) {
          if (prov.source) {
            allSources.add(prov.source);
            fieldSources.add(prov.source);
          }
        }
        fieldSourceMap.set(field.field_name, fieldSources);
      }
    }

    // Check that multiple sources are used if available
    if (allSources.size === 1 && uiCard.header.sources_responded > 1) {
      warnings.push('Only one source shown in provenance despite multiple sources responding');
    }

    // Check for source consistency
    for (const [fieldName, sources] of fieldSourceMap) {
      sources.forEach(source => {
        if (source === 'unknown' || source === 'UNKNOWN') {
          errors.push(`Field ${fieldName} has unknown source`);
        }
      });
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateProvenanceConfidenceScores(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const field of uiCard.profile_fields) {
      if (field.provenance) {
        for (const prov of field.provenance) {
          if (prov.confidence !== undefined) {
            totalConfidence += prov.confidence;
            confidenceCount++;

            if (prov.confidence < 0.5) {
              warnings.push(`Field ${field.field_name} has low confidence: ${prov.confidence}`);
            }
          }
        }
      }
    }

    if (confidenceCount > 0) {
      const avgConfidence = totalConfidence / confidenceCount;
      
      if (avgConfidence < 0.6) {
        warnings.push(`Overall average confidence is low: ${avgConfidence.toFixed(2)}`);
      }

      // Check that header confidence matches field confidence
      const confidenceDiff = Math.abs(avgConfidence - uiCard.header.confidence_score);
      if (confidenceDiff > 0.2) {
        errors.push(`Header confidence (${uiCard.header.confidence_score}) doesn't match average field confidence (${avgConfidence.toFixed(2)})`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateProvenanceRawFragmentIntegrity(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of uiCard.profile_fields) {
      if (field.provenance) {
        for (const prov of field.provenance) {
          if (prov.raw_fragment && prov.normalized_value) {
            // Check that normalized value is derived from raw fragment
            const rawStr = String(prov.raw_fragment).toLowerCase();
            const normStr = String(prov.normalized_value).toLowerCase();

            if (!rawStr.includes(normStr) && rawStr.length > 0 && normStr.length > 0) {
              warnings.push(`Field ${field.field_name} normalized value doesn't appear in raw fragment`);
            }
          }
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateProvenanceTimestampConsistency(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const timestamps: Date[] = [];

    for (const field of uiCard.profile_fields) {
      if (field.provenance) {
        for (const prov of field.provenance) {
          if (prov.timestamp) {
            timestamps.push(prov.timestamp);
          }
        }
      }
    }

    if (timestamps.length > 0) {
      const minTime = Math.min(...timestamps.map(t => t.getTime()));
      const maxTime = Math.max(...timestamps.map(t => t.getTime()));
      const headerTime = uiCard.header.last_updated.getTime();

      // Check that header last_updated is within range of field timestamps
      if (headerTime < minTime || headerTime > maxTime) {
        warnings.push('Header last_updated timestamp is outside range of field provenance timestamps');
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  validateProvenanceBlockStructure(uiCard: UICardStructure): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that provenance_blocks map is populated
    if (uiCard.provenance_blocks.size === 0) {
      warnings.push('No provenance blocks found in UI card');
    }

    // Check that each field with provenance has a corresponding block
    for (const field of uiCard.profile_fields) {
      if (field.provenance && field.provenance.length > 0) {
        if (!uiCard.provenance_blocks.has(field.field_name)) {
          warnings.push(`Field ${field.field_name} has provenance but no provenance block`);
        }
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }
}
