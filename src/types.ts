/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum EntityType {
  PERSON = "PERSON",
  COMPANY = "COMPANY",
  FOP = "FOP",
  VEHICLE = "VEHICLE",
}

export enum VerificationStatus {
  CONFIRMED = "CONFIRMED",
  UNVERIFIED = "UNVERIFIED",
  CONFLICT = "CONFLICT",
  SINGLE_SOURCE = "SINGLE_SOURCE",
}

export interface PersonProfile {
  fullName: string;
  type: EntityType.PERSON;
  identifiers: {
    rnokpp?: string;
    passport?: string;
    dob?: string;
  };
  status: VerificationStatus;
  identityMatchScore: number;
}

export interface Company {
  name: string;
  type: EntityType.COMPANY;
  identifiers: {
    edrpou: string;
    registrationDate?: string;
  };
  status: VerificationStatus;
  identityMatchScore: number;
}

export interface FOP {
  fullName: string;
  type: EntityType.FOP;
  identifiers: {
    rnokpp: string;
    registrationDate?: string;
  };
  status: VerificationStatus;
  identityMatchScore: number;
}

export interface Vehicle {
  plate: string;
  type: EntityType.VEHICLE;
  identifiers: {
    vin?: string;
    model?: string;
    color?: string;
  };
  status: VerificationStatus;
  identityMatchScore: number;
}

export enum RelationshipType {
  FOUNDER = "FOUNDER",
  DIRECTOR = "DIRECTOR",
  RELATIVE = "RELATIVE",
  ASSOCIATE = "ASSOCIATE",
  BENEFICIARY = "BENEFICIARY",
}

export interface Relationship {
  fromId: string;
  toId: string;
  toType: EntityType;
  toName: string;
  type: RelationshipType;
  confidence: number;
  sourceIds: string[];
  edrpou?: string;
  roleName?: string;
  status?: string;
}

export interface Evidence {
  id: string;
  sourceName: string;
  sourceUrl?: string;
  confidence: number;
  retrievedAt: string;
  contentHash?: string;
  data: any;
}

export interface Dossier {
  entity: PersonProfile | Company | FOP | Vehicle;
  network: { nodes: any[]; links: any[] };
  timeline: { date: string; event: string; source: string }[];
  sources: { id: string; name: string; status: string; reliability: number }[];
  evidence: Evidence[];
  risk: { score: number; level: string; drivers: { type: string; severity: string; description: string }[] };
  quality: { confidence: number; coverage: number };
  verification: {
    status: VerificationStatus;
    score: number;
    lastChecked: string;
  };
  metadata: {
    mode: "PRODUCTION" | "SANDBOX" | "DEMO";
    generatedAt: string;
    orchestratorVersion: string;
  };
  modules: {
    fop?: FOP[];
    companies?: Relationship[];
    vehicles?: Vehicle[];
    courts?: any[];
  };
}

export interface OpenSourceSolution {
  id: string;
  name: string;
  description: string;
  url: string;
  category?: string;
  techStack?: string[];
  compatibilityScore?: number;
  advantages?: string[];
  disadvantages?: string[];
  role?: string;
  securityRating?: "A" | "B" | "C" | "D";
  licenseType?: "Permissive" | "Commercial" | "Weak Copyleft" | "Copyleft";
  productionReady?: "Tak" | "Hi";
  license?: string;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  type: string;
  group?: string;
}
