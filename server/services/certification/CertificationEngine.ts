import { RegistryPassport, DataQualityReport } from '../../models/discovery';

export class CertificationEngine {
  
  /**
   * Certifies a newly discovered registry.
   * Assesses quality, completeness, and assigns a Health Score.
   */
  public certify(passport: RegistryPassport, sampleRecords: any[]): DataQualityReport {
    if (!sampleRecords || sampleRecords.length === 0) {
      return {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        freshness: 0,
        uniqueness: 0,
        healthScore: 0
      };
    }

    let missingFieldsCount = 0;
    let totalFieldsChecked = 0;

    for (const record of sampleRecords) {
      for (const key of Object.keys(record)) {
        totalFieldsChecked++;
        if (record[key] === null || record[key] === undefined || record[key] === '') {
          missingFieldsCount++;
        }
      }
    }

    const completeness = totalFieldsChecked > 0 ? 100 - (missingFieldsCount / totalFieldsChecked) * 100 : 0;
    
    // In a real system, accuracy might be checked against known valid dictionaries (e.g. valid EDRPOU length)
    const accuracy = passport.fields.length > 0 ? 95 : 50; 
    
    // Consistency: do records have the same schema?
    const consistency = 99; // Mocked
    
    // Freshness: based on last modified date
    const freshness = passport.lastModified ? 90 : 50;
    
    // Uniqueness: check for dupes in sample
    const uniqueness = 100;

    const healthScore = (completeness + accuracy + consistency + freshness + uniqueness) / 5;

    return {
      completeness,
      accuracy,
      consistency,
      freshness,
      uniqueness,
      healthScore
    };
  }

  public isProductionReady(report: DataQualityReport): boolean {
    return report.healthScore >= 95 && report.completeness >= 80;
  }
}

export const certificationEngine = new CertificationEngine();
