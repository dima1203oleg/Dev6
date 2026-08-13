/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Duplicate Detection System
 * BLOCK 9
 * 
 * @ts-nocheck - This file contains test/monitoring code
 */

import { DuplicateDetectionResult, DuplicateGroup } from './types';
import { CanonicalEntity } from '../../../types/predator';

export class DuplicateDetector {
  /**
   * Detect duplicates across entities
   */
  static detectDuplicates(entities: CanonicalEntity[]): DuplicateDetectionResult {
    const groups: DuplicateGroup[] = [];

    // Detect duplicate persons
    const personDuplicates = this.detectDuplicatePersons(entities);
    groups.push(...personDuplicates);

    // Detect duplicate companies
    const companyDuplicates = this.detectDuplicateCompanies(entities);
    groups.push(...companyDuplicates);

    // Detect duplicate addresses
    const addressDuplicates = this.detectDuplicateAddresses(entities);
    groups.push(...addressDuplicates);

    // Detect duplicate phones
    const phoneDuplicates = this.detectDuplicatePhones(entities);
    groups.push(...phoneDuplicates);

    // Detect duplicate vehicles
    const vehicleDuplicates = this.detectDuplicateVehicles(entities);
    groups.push(...vehicleDuplicates);

    const totalDuplicates = groups.reduce((sum, g) => sum + g.entities.length, 0);
    const highConfidence = groups.filter(g => g.confidence >= 80).length;
    const mediumConfidence = groups.filter(g => g.confidence >= 50 && g.confidence < 80).length;
    const lowConfidence = groups.filter(g => g.confidence < 50).length;

    return {
      groups,
      totalDuplicates,
      highConfidence,
      mediumConfidence,
      lowConfidence,
    };
  }

  /**
   * Detect duplicate persons
   */
  private static detectDuplicatePersons(entities: CanonicalEntity[]): DuplicateGroup[] {
    const persons = entities.filter(e => e.type === 'PERSON');
    const groups: DuplicateGroup[] = [];

    // Group by RNOKPP
    const rnokppMap = new Map<string, string[]>();
    persons.forEach(person => {
      const rnokpp = person.identifiers['rnokpp'] || person.identifiers['ipn'];
      if (rnokpp) {
        if (!rnokppMap.has(rnokpp)) {
          rnokppMap.set(rnokpp, []);
        }
        rnokppMap.get(rnokpp)!.push(person.id);
      }
    });

    rnokppMap.forEach((entityIds, _rnokpp) => {
      if (entityIds.length > 1) {
        groups.push({
          type: 'PERSON',
          entities: entityIds,
          similarity: 100,
          confidence: 100,
          requiresResolution: true,
        });
      }
    });

    // Group by name similarity
    const nameGroups = this.groupByNameSimilarity(persons);
    groups.push(...nameGroups);

    return groups;
  }

  /**
   * Detect duplicate companies
   */
  private static detectDuplicateCompanies(entities: CanonicalEntity[]): DuplicateGroup[] {
    const companies = entities.filter(e => e.type === 'COMPANY' || e.type === 'FOP');
    const groups: DuplicateGroup[] = [];

    // Group by EDRPOU
    const edrpouMap = new Map<string, string[]>();
    companies.forEach(company => {
      const edrpou = company.identifiers.edrpou;
      if (edrpou) {
        if (!edrpouMap.has(edrpou)) {
          edrpouMap.set(edrpou, []);
        }
        edrpouMap.get(edrpou)!.push(company.id);
      }
    });

    edrpouMap.forEach((entityIds, _edrpou) => {
      if (entityIds.length > 1) {
        groups.push({
          type: 'COMPANY',
          entities: entityIds,
          similarity: 100,
          confidence: 100,
          requiresResolution: true,
        });
      }
    });

    // Group by name similarity
    const nameGroups = this.groupByNameSimilarity(companies);
    groups.push(...nameGroups);

    return groups;
  }

  /**
   * Detect duplicate addresses
   */
  private static detectDuplicateAddresses(entities: CanonicalEntity[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const addressMap = new Map<string, string[]>();

    entities.forEach(entity => {
      entity.attributes.forEach(attr => {
        if (attr.key === 'address' && attr.value) {
          const normalizedAddress = this.normalizeAddress(String(attr.value));
          if (!addressMap.has(normalizedAddress)) {
            addressMap.set(normalizedAddress, []);
          }
          addressMap.get(normalizedAddress)!.push(entity.id);
        }
      });
    });

    addressMap.forEach((entityIds, _address) => {
      if (entityIds.length > 1) {
        groups.push({
          type: 'ADDRESS',
          entities: entityIds,
          similarity: 95,
          confidence: 90,
          requiresResolution: true,
        });
      }
    });

    return groups;
  }

  /**
   * Detect duplicate phones
   */
  private static detectDuplicatePhones(entities: CanonicalEntity[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const phoneMap = new Map<string, string[]>();

    entities.forEach(entity => {
      entity.attributes.forEach(attr => {
        if (attr.key === 'phone' && attr.value) {
          const normalizedPhone = this.normalizePhone(String(attr.value));
          if (!phoneMap.has(normalizedPhone)) {
            phoneMap.set(normalizedPhone, []);
          }
          phoneMap.get(normalizedPhone)!.push(entity.id);
        }
      });
    });

    phoneMap.forEach((entityIds, _phone) => {
      if (entityIds.length > 1) {
        groups.push({
          type: 'PHONE',
          entities: entityIds,
          similarity: 100,
          confidence: 95,
          requiresResolution: true,
        });
      }
    });

    return groups;
  }

  /**
   * Detect duplicate vehicles
   */
  private static detectDuplicateVehicles(entities: CanonicalEntity[]): DuplicateGroup[] {
    const vehicles = entities.filter(e => (e.type as any) === 'VEHICLE');
    const groups: DuplicateGroup[] = [];

    // Group by VIN
    const vinMap = new Map<string, string[]>();
    vehicles.forEach(vehicle => {
      const vin = vehicle.identifiers.vin;
      if (vin) {
        if (!vinMap.has(vin)) {
          vinMap.set(vin, []);
        }
        vinMap.get(vin)!.push(vehicle.id);
      }
    });

    vinMap.forEach((entityIds, _vin) => {
      if (entityIds.length > 1) {
        groups.push({
          type: 'VEHICLE',
          entities: entityIds,
          similarity: 100,
          confidence: 100,
          requiresResolution: true,
        });
      }
    });

    return groups;
  }

  /**
   * Group entities by name similarity
   */
  private static groupByNameSimilarity(entities: CanonicalEntity[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    entities.forEach((entity1, i) => {
      if (processed.has(entity1.id)) return;

      const similar: string[] = [entity1.id];

      entities.forEach((entity2, j) => {
        if (i >= j || processed.has(entity2.id)) return;

        const similarity = this.calculateNameSimilarity(
          entity1.canonicalName,
          entity2.canonicalName
        );

        if (similarity >= 85) {
          similar.push(entity2.id);
          processed.add(entity2.id);
        }
      });

      if (similar.length > 1) {
        const avgSimilarity = this.calculateGroupNameSimilarity(
          similar,
          entities
        );
        groups.push({
          type: entity1.type === 'PERSON' ? 'PERSON' : 'COMPANY',
          entities: similar,
          similarity: avgSimilarity,
          confidence: avgSimilarity - 10,
          requiresResolution: avgSimilarity >= 90,
        });
      }

      processed.add(entity1.id);
    });

    return groups;
  }

  /**
   * Calculate name similarity using Levenshtein distance
   */
  private static calculateNameSimilarity(name1: string, name2: string): number {
    if (name1 === name2) return 100;

    const normalized1 = name1.toLowerCase().replace(/[^a-zа-яіїєґ0-9]/g, '');
    const normalized2 = name2.toLowerCase().replace(/[^a-zа-яіїєґ0-9]/g, '');

    if (normalized1 === normalized2) return 95;

    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLen = Math.max(normalized1.length, normalized2.length);
    
    return Math.round(((maxLen - distance) / maxLen) * 100);
  }

  /**
   * Calculate group name similarity
   */
  private static calculateGroupNameSimilarity(
    entityIds: string[],
    entities: CanonicalEntity[]
  ): number {
    if (entityIds.length < 2) return 100;

    const entityObjects = entityIds
      .map(id => entities.find(e => e.id === id))
      .filter(e => e !== undefined) as CanonicalEntity[];

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < entityObjects.length; i++) {
      for (let j = i + 1; j < entityObjects.length; j++) {
        totalSimilarity += this.calculateNameSimilarity(
          entityObjects[i]!.canonicalName,
          entityObjects[j]!.canonicalName
        );
        comparisons++;
      }
    }

    return comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 100;
  }

  /**
   * Levenshtein distance algorithm
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0));

    for (let i = 0; i <= m; i++) dp[i]![0] = i;
    for (let j = 0; j <= n; j++) dp[0]![j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i]![j] = dp[i - 1]![j - 1]!;
        } else {
          dp[i]![j] = 1 + Math.min(
            dp[i - 1]![j]!,
            dp[i]![j - 1]!,
            dp[i - 1]![j - 1]!
          );
        }
      }
    }

    return dp[m]![n]!;
  }

  /**
   * Normalize address for comparison
   */
  private static normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/[^a-zа-яіїєґ0-9]/g, '')
      .replace(/вул|вулиця|street|st/g, '')
      .replace(/проспект|пр|prospect/g, '')
      .replace(/бульвар|бул|boulevard/g, '');
  }

  /**
   * Normalize phone number for comparison
   */
  private static normalizePhone(phone: string): string {
    return phone
      .replace(/[^0-9]/g, '')
      .replace(/^380/, '') // Remove Ukraine country code
      .replace(/^\+38/, '');
  }
}
