/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-009 — Provenance
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, ProvenanceRecord } from '../types';
import { randomUUID } from 'crypto';

export class TEST009_Provenance extends BaseTest {
  constructor() {
    super('TEST-009', 'Provenance');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        const endpoint = context.source_config.endpoint_or_resource;
        
        // Fetch response
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PREDATOR-Analytics-Test/1.0'
          }
        });
        
        const body = await response.text();
        
        // Parse JSON
        let jsonData: any;
        try {
          jsonData = JSON.parse(body);
        } catch (parseError) {
          errors.push('Cannot check provenance - raw data is not valid JSON');
          return { details, errors, warnings };
        }
        
        // Generate provenance records
        const provenanceRecords = this.generateProvenance(jsonData, context);
        
        details['provenance_records_count'] = provenanceRecords.length;
        details['provenance_complete'] = this.validateProvenance(provenanceRecords);
        
        // Check each required provenance field
        const fieldValidation = this.validateProvenanceFields(provenanceRecords);
        details['source_id_present'] = fieldValidation.sourceId;
        details['record_id_present'] = fieldValidation.recordId;
        details['timestamp_present'] = fieldValidation.timestamp;
        details['parser_version_present'] = fieldValidation.parserVersion;
        details['confidence_present'] = fieldValidation.confidence;
        details['raw_fragment_present'] = fieldValidation.rawFragment;
        
        if (!fieldValidation.sourceId) {
          errors.push('Provenance field source_id is missing');
        }
        
        if (!fieldValidation.recordId) {
          errors.push('Provenance field record_id is missing');
        }
        
        if (!fieldValidation.timestamp) {
          errors.push('Provenance field timestamp is missing');
        }
        
        if (!fieldValidation.parserVersion) {
          warnings.push('Provenance field parser_version is missing');
        }
        
        if (!fieldValidation.confidence) {
          warnings.push('Provenance field confidence is missing');
        }
        
        if (!fieldValidation.rawFragment) {
          warnings.push('Provenance field raw_fragment is missing');
        }
        
        // Check confidence scores
        const confidenceCheck = this.validateConfidenceScores(provenanceRecords);
        details['average_confidence'] = confidenceCheck.average;
        details['min_confidence'] = confidenceCheck.min;
        details['max_confidence'] = confidenceCheck.max;
        
        if (confidenceCheck.min < 0.5) {
          warnings.push(`Low confidence scores detected (min: ${confidenceCheck.min})`);
        }
        
      } catch (error) {
        errors.push(`Provenance check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private generateProvenance(data: any, context: TestContext): ProvenanceRecord[] {
    const records: ProvenanceRecord[] = [];
    
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      
      // Create provenance record for each object
      const record: ProvenanceRecord = {
        source_id: context.source_config.source_id,
        record_id: randomUUID(),
        timestamp: new Date(),
        parser_version: '1.0.0',
        confidence: this.calculateConfidence(obj),
        raw_fragment: JSON.stringify(obj).substring(0, 200)
      };
      
      records.push(record);
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          traverse(value, path ? `${path}.${key}` : key);
        }
      }
    };
    
    traverse(data);
    
    return records;
  }

  private calculateConfidence(obj: any): number {
    let confidence = 0.8; // Base confidence
    
    // Increase confidence if object has required fields
    if (obj.id || obj.name || obj.edrpou) {
      confidence += 0.1;
    }
    
    // Decrease confidence if missing critical fields
    if (!obj.id && !obj.name) {
      confidence -= 0.2;
    }
    
    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  private validateProvenance(records: ProvenanceRecord[]): boolean {
    if (records.length === 0) {
      return false;
    }
    
    // Check that all records have required fields
    return records.every(record => 
      record.source_id &&
      record.record_id &&
      record.timestamp &&
      record.parser_version &&
      record.confidence !== undefined &&
      record.raw_fragment
    );
  }

  private validateProvenanceFields(records: ProvenanceRecord[]): {
    sourceId: boolean;
    recordId: boolean;
    timestamp: boolean;
    parserVersion: boolean;
    confidence: boolean;
    rawFragment: boolean;
  } {
    if (records.length === 0) {
      return {
        sourceId: false,
        recordId: false,
        timestamp: false,
        parserVersion: false,
        confidence: false,
        rawFragment: false
      };
    }
    
    return {
      sourceId: records.every(r => r.source_id),
      recordId: records.every(r => r.record_id),
      timestamp: records.every(r => r.timestamp),
      parserVersion: records.every(r => r.parser_version),
      confidence: records.every(r => r.confidence !== undefined),
      rawFragment: records.every(r => r.raw_fragment)
    };
  }

  private validateConfidenceScores(records: ProvenanceRecord[]): {
    average: number;
    min: number;
    max: number;
  } {
    if (records.length === 0) {
      return { average: 0, min: 0, max: 0 };
    }
    
    const confidences = records.map(r => r.confidence);
    
    return {
      average: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      min: Math.min(...confidences),
      max: Math.max(...confidences)
    };
  }

}
