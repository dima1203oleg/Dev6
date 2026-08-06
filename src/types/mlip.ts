/**
 * PREDATOR Analytics — Multi-Layer Intelligence Platform (MLIP)
 * TypeScript Type Definitions
 * Based on Technical Specification §3 (Entity Types), §4 (Graph Structure), §5 (Confidence Levels)
 */

// ─── ACCESS LEVELS (§8.1) ─────────────────────────────────────────────────

export type MLIPAccessLevel = 'WHITE' | 'YELLOW' | 'RED' | 'BLACK';

export const ACCESS_LEVEL_CONFIG: Record<MLIPAccessLevel, { label: string; color: string; description: string }> = {
  WHITE:  { label: 'White',  color: '#94a3b8', description: 'Тільки публічні джерела (аналітики, журналісти)' },
  YELLOW: { label: 'Yellow', color: '#f59e0b', description: 'SOCINT розширений, публічні витоки (перевірені аналітики)' },
  RED:    { label: 'Red',    color: '#ef4444', description: 'DarkNet, технічна розвідка (спеціальний допуск)' },
  BLACK:  { label: 'Black',  color: '#1e1b4b', description: 'Активні методи, інфільтрація (авторизовані оперативні підрозділи)' },
};

// ─── CONFIDENCE LEVELS (§5) ───────────────────────────────────────────────

export type ConfidenceLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'HYPOTHESIS' | 'UNVERIFIED';

export interface ConfidenceScore {
  level: ConfidenceLevel;
  value: number; // 0.0 - 1.0
  sources: string[];
  rationale?: string;
}

export const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { min: number; max: number; color: string; label: string }> = {
  CRITICAL:    { min: 0.95, max: 1.00, color: '#22c55e', label: 'Критичне підтвердження' },
  HIGH:        { min: 0.85, max: 0.94, color: '#84cc16', label: 'Високе підтвердження' },
  MEDIUM:      { min: 0.70, max: 0.84, color: '#eab308', label: 'Середнє підтвердження' },
  LOW:         { min: 0.50, max: 0.69, color: '#f97316', label: 'Низьке підтвердження' },
  HYPOTHESIS:  { min: 0.30, max: 0.49, color: '#a78bfa', label: 'Гіпотеза' },
  UNVERIFIED:  { min: 0.00, max: 0.29, color: '#6b7280', label: 'Непідтверджено' },
};

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.95) return 'CRITICAL';
  if (score >= 0.85) return 'HIGH';
  if (score >= 0.70) return 'MEDIUM';
  if (score >= 0.50) return 'LOW';
  if (score >= 0.30) return 'HYPOTHESIS';
  return 'UNVERIFIED';
}

// ─── INTELLIGENCE LAYERS ──────────────────────────────────────────────────

export type IntelLayer = 'OSI' | 'SOCINT' | 'MEDINT' | 'COMINT' | 'DARKINT' | 'TECHINT' | 'HUMINT' | 'GEOINT' | 'FININT' | 'THREAT';

export const INTEL_LAYER_CONFIG: Record<IntelLayer, { label: string; icon: string; color: string; accessLevel: MLIPAccessLevel }> = {
  OSI:     { label: 'Open Web Intelligence',         icon: '🌐', color: '#3b82f6', accessLevel: 'WHITE'  },
  SOCINT:  { label: 'Social Intelligence',           icon: '👥', color: '#8b5cf6', accessLevel: 'WHITE'  },
  MEDINT:  { label: 'Media Intelligence',            icon: '🎬', color: '#06b6d4', accessLevel: 'WHITE'  },
  COMINT:  { label: 'Communication Intelligence',    icon: '📡', color: '#10b981', accessLevel: 'YELLOW' },
  TECHINT: { label: 'Technical Intelligence',        icon: '⚙️', color: '#f59e0b', accessLevel: 'YELLOW' },
  DARKINT: { label: 'DarkNet Intelligence',          icon: '🕶️', color: '#ef4444', accessLevel: 'RED'    },
  HUMINT:  { label: 'Human Intelligence',            icon: '🧑', color: '#e879f9', accessLevel: 'RED'    },
  GEOINT:  { label: 'Geospatial Intelligence',       icon: '🗺️', color: '#22d3ee', accessLevel: 'WHITE'  },
  FININT:  { label: 'Financial Intelligence',        icon: '₿',  color: '#f97316', accessLevel: 'YELLOW' },
  THREAT:  { label: 'Threat Intelligence',           icon: '🚨', color: '#dc2626', accessLevel: 'RED'    },
};

// ─── ENTITY NODE TYPES (§3.1) ─────────────────────────────────────────────

export type EntityNodeType =
  | 'PERSON'
  | 'COMPANY'
  | 'PHONE'
  | 'EMAIL'
  | 'ADDRESS'
  | 'DOMAIN'
  | 'IP_ADDRESS'
  | 'CRYPTO_WALLET'
  | 'TELEGRAM_ENTITY'
  | 'DOCUMENT'
  | 'IMAGE_VIDEO'
  | 'EVENT'
  | 'VEHICLE'
  | 'BANK_ACCOUNT'
  | 'SOCIAL_PROFILE';

export interface EntityNode {
  id: string;
  type: EntityNodeType;
  label: string;
  aliases?: string[];
  attributes: Record<string, any>;
  confidence: ConfidenceScore;
  sources: IntelSource[];
  layer: IntelLayer;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  accessLevel: MLIPAccessLevel;
}

// ─── PERSON NODE ──────────────────────────────────────────────────────────

export interface PersonNode extends EntityNode {
  type: 'PERSON';
  attributes: {
    fullName?: string;
    aliases?: string[];
    dateOfBirth?: string;
    nationality?: string;
    taxId?: string; // ІПН
    passportNumber?: string;
    photoUrl?: string;
    faceHash?: string; // perceptual hash for face recognition
    gender?: 'M' | 'F' | 'UNKNOWN';
    languages?: string[];
    occupation?: string;
    riskLevel?: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

// ─── COMPANY NODE ─────────────────────────────────────────────────────────

export interface CompanyNode extends EntityNode {
  type: 'COMPANY';
  attributes: {
    name?: string;
    edrpou?: string;
    registrationNumber?: string;
    country?: string;
    registrationDate?: string;
    status?: string;
    legalAddress?: string;
    director?: string;
    kved?: string[];
    capitalUah?: number;
    isBankrupt?: boolean;
    isSanctioned?: boolean;
    riskScore?: number;
  };
}

// ─── PHONE NODE ───────────────────────────────────────────────────────────

export interface PhoneNode extends EntityNode {
  type: 'PHONE';
  attributes: {
    number: string;
    countryCode?: string;
    operator?: string;
    operatorType?: 'MOBILE' | 'LANDLINE' | 'VOIP';
    isTelegramRegistered?: boolean;
    isWhatsAppRegistered?: boolean;
    isViberRegistered?: boolean;
    inBreaches?: string[];
    lastSeen?: string;
  };
}

// ─── EMAIL NODE ───────────────────────────────────────────────────────────

export interface EmailNode extends EntityNode {
  type: 'EMAIL';
  attributes: {
    address: string;
    domain?: string;
    isVerified?: boolean;
    breaches?: BreachRecord[];
    socialProfiles?: string[];
    gravatar?: string;
    firstSeen?: string;
    lastSeen?: string;
  };
}

// ─── DOMAIN NODE ──────────────────────────────────────────────────────────

export interface DomainNode extends EntityNode {
  type: 'DOMAIN';
  attributes: {
    domain: string;
    registrar?: string;
    registrantOrg?: string;
    registrantCountry?: string;
    createdAt?: string;
    expiresAt?: string;
    nameservers?: string[];
    ipAddresses?: string[];
    subdomains?: string[];
    technologies?: string[];
    sslIssuer?: string;
    sslExpiry?: string;
    categories?: string[];
  };
}

// ─── IP ADDRESS NODE ──────────────────────────────────────────────────────

export interface IPAddressNode extends EntityNode {
  type: 'IP_ADDRESS';
  attributes: {
    ip: string;
    version: 'v4' | 'v6';
    asn?: string;
    asnOrg?: string;
    country?: string;
    city?: string;
    lat?: number;
    lon?: number;
    isVpn?: boolean;
    isTor?: boolean;
    isProxy?: boolean;
    isHosting?: boolean;
    threatScore?: number;
    relatedDomains?: string[];
  };
}

// ─── CRYPTO WALLET NODE ───────────────────────────────────────────────────

export interface CryptoWalletNode extends EntityNode {
  type: 'CRYPTO_WALLET';
  attributes: {
    address: string;
    blockchain: 'BTC' | 'ETH' | 'USDT' | 'XMR' | 'LTC' | 'OTHER';
    balanceUsd?: number;
    totalReceivedUsd?: number;
    totalSentUsd?: number;
    transactionCount?: number;
    firstSeen?: string;
    lastSeen?: string;
    riskScore?: number;
    isMixer?: boolean;
    isExchange?: boolean;
    labels?: string[];
    clusterSize?: number;
  };
}

// ─── TELEGRAM ENTITY NODE ─────────────────────────────────────────────────

export interface TelegramEntityNode extends EntityNode {
  type: 'TELEGRAM_ENTITY';
  attributes: {
    telegramId?: number;
    username?: string;
    type: 'USER' | 'BOT' | 'CHANNEL' | 'GROUP' | 'SUPERGROUP';
    title?: string;
    memberCount?: number;
    isVerified?: boolean;
    isScam?: boolean;
    bio?: string;
    phone?: string;
    linkedChannels?: string[];
    postFrequency?: string;
    adminOf?: string[];
    joinDate?: string;
  };
}

// ─── EDGE RELATIONSHIP TYPES (§4.1) ──────────────────────────────────────

export type EdgeType =
  | 'IDENTITY'
  | 'ALIAS'
  | 'OWNS'
  | 'DIRECTOR_OF'
  | 'MEMBER_OF'
  | 'ADMIN_OF'
  | 'COMMUNICATES_WITH'
  | 'CO_LOCATED'
  | 'CO_OCCURRING'
  | 'TRANSACTION'
  | 'REFERENCES'
  | 'SIMILAR_TO'
  | 'REGISTERED_AT'
  | 'USES_DEVICE'
  | 'CONTROLS';

export type EdgeWeightType = 'structural' | 'temporal' | 'semantic' | 'behavioral';

export interface EntityEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: EdgeType;
  weight: number; // 0.0 - 1.0
  weightType: EdgeWeightType;
  confidence: ConfidenceScore;
  sources: IntelSource[];
  evidence?: string[];
  firstSeen?: string;
  lastSeen?: string;
  metadata?: Record<string, any>;
}

// ─── INTELLIGENCE SOURCE ──────────────────────────────────────────────────

export interface IntelSource {
  id: string;
  name: string;
  layer: IntelLayer;
  url?: string;
  retrievedAt: string;
  hash?: string;       // SHA-256 of raw payload
  credibility: number; // 0.0 - 1.0
  isLive: boolean;
}

// ─── OSI (Open Web Intelligence) Types ───────────────────────────────────

export interface WhoisRecord {
  domain: string;
  registrar?: string;
  registrantName?: string;
  registrantOrg?: string;
  registrantCountry?: string;
  registrantEmail?: string;
  createdDate?: string;
  updatedDate?: string;
  expiresDate?: string;
  nameservers?: string[];
  status?: string[];
  rawText?: string;
  retrievedAt: string;
}

export interface CTLogEntry {
  domain: string;
  subjectCN: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  serialNumber?: string;
  crtshId?: number;
  loggedAt: string;
}

export interface ArchiveLookupResult {
  url: string;
  snapshots: Array<{
    timestamp: string;
    archiveUrl: string;
    statusCode?: number;
  }>;
}

// ─── COMINT Types ─────────────────────────────────────────────────────────

export interface BreachRecord {
  name: string;
  domain?: string;
  breachDate?: string;
  addedDate?: string;
  pwnCount?: number;
  dataClasses?: string[];
  isVerified: boolean;
  isFabricated?: boolean;
  isSensitive?: boolean;
  description?: string;
}

export interface PhoneIntelResult {
  number: string;
  formattedNumber?: string;
  country?: string;
  carrier?: string;
  lineType?: 'mobile' | 'landline' | 'voip' | 'unknown';
  isTelegramRegistered?: boolean;
  isWhatsAppRegistered?: boolean;
  isViberRegistered?: boolean;
  breachCount?: number;
  breaches?: BreachRecord[];
}

export interface PassiveDNSRecord {
  domain: string;
  type: 'A' | 'AAAA' | 'MX' | 'NS' | 'CNAME' | 'TXT' | 'SOA';
  value: string;
  firstSeen?: string;
  lastSeen?: string;
  count?: number;
}

export interface IPIntelResult {
  ip: string;
  version?: 'v4' | 'v6';
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  org?: string;
  asn?: string;
  timezone?: string;
  isVpn?: boolean;
  isTor?: boolean;
  isProxy?: boolean;
  isHosting?: boolean;
  threatLevel?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  abuseScore?: number;
  relatedDomains?: string[];
}

// ─── TECHINT Types ────────────────────────────────────────────────────────

export interface SubdomainResult {
  domain: string;
  subdomain: string;
  ip?: string;
  port?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'TAKEOVER_RISK';
  method: 'CT_LOG' | 'BRUTE_FORCE' | 'PERMUTATION' | 'DNS';
  discoveredAt: string;
}

export interface WebTechResult {
  url: string;
  technologies: Array<{
    name: string;
    version?: string;
    category: string;
    confidence: number;
    icon?: string;
  }>;
  headers?: Record<string, string>;
  cms?: string;
  framework?: string;
  server?: string;
  cdn?: string;
  analytics?: string[];
  securityHeaders?: Record<string, boolean>;
}

export interface SSLCertResult {
  domain: string;
  subject: string;
  issuer: string;
  serialNumber?: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  isExpired: boolean;
  signatureAlgorithm?: string;
  keySize?: number;
  sans?: string[];
  chainValid?: boolean;
  grade?: string;
}

// ─── MEDINT Types ─────────────────────────────────────────────────────────

export interface EXIFData {
  make?: string;
  model?: string;
  dateTime?: string;
  gpsLat?: number;
  gpsLon?: number;
  gpsAlt?: number;
  software?: string;
  artist?: string;
  copyright?: string;
  flash?: string;
  focalLength?: string;
  exposureTime?: string;
  iso?: string;
  orientation?: number;
  rawTags?: Record<string, any>;
}

export interface ImageIntelResult {
  fileHash: string;
  pHash?: string;
  aHash?: string;
  dHash?: string;
  exif?: EXIFData;
  hasGPS: boolean;
  location?: { lat: number; lon: number; address?: string };
  detectedObjects?: string[];
  detectedText?: string;
  detectedFaces?: number;
  deepfakeScore?: number;
  duplicatesFound?: number;
  reverseSearchResults?: Array<{
    engine: string;
    url: string;
    similarity?: number;
  }>;
}

export interface DeepfakeIndicator {
  type: 'SOFTWARE_SIGNATURE' | 'AI_GENERATED' | 'MISSING_EXIF' | 'METADATA_ANOMALY';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface MedintResult {
  sourceUrl: string;
  analyzedAt: string;
  metadata: Record<string, string | null>;
  deepfakeIndicators: DeepfakeIndicator[];
  pHash?: string;
}

// ─── SOCINT Types ─────────────────────────────────────────────────────────

export interface TelegramChannelInfo {
  id?: number;
  username?: string;
  title: string;
  description?: string;
  memberCount?: number;
  type: 'channel' | 'group' | 'supergroup';
  isVerified?: boolean;
  isScam?: boolean;
  isPublic: boolean;
  url?: string;
  createdAt?: string;
  postFrequency?: number;
  lastPost?: string;
  admins?: string[];
  forwardedFrom?: string[];
  linkedChannels?: string[];
}

export interface GitHubProfileInfo {
  username: string;
  displayName?: string;
  bio?: string;
  company?: string;
  location?: string;
  email?: string;
  website?: string;
  twitterUsername?: string;
  createdAt?: string;
  updatedAt?: string;
  publicRepos?: number;
  followers?: number;
  following?: number;
  languages?: string[];
  recentActivity?: Array<{
    type: string;
    repo: string;
    at: string;
  }>;
}

export interface SocialProfile {
  platform: 'LINKEDIN' | 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'GITHUB' | 'TELEGRAM' | 'OTHER';
  url: string;
  username?: string;
  displayName?: string;
  bio?: string;
  followers?: number;
  isVerified?: boolean;
  isPublic: boolean;
  lastActivity?: string;
  confidence: number;
}

export interface SocintResult {
  platform: 'GITHUB' | 'TELEGRAM' | 'OTHER';
  username: string;
  profileUrl: string;
  metadata: Record<string, unknown>;
  activityScore: number;
}

// ─── DARKINT Types ────────────────────────────────────────────────────────

export interface BreachSearchResult {
  query: string;
  queryType: 'EMAIL' | 'PHONE' | 'USERNAME' | 'DOMAIN' | 'IP' | 'NAME';
  breaches: BreachRecord[];
  pastebinMentions?: Array<{
    url: string;
    date: string;
    snippet?: string;
  }>;
  darkWebMentions?: Array<{
    source: string;
    date: string;
    context?: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  stealerLogHits?: number;
  totalExposures: number;
}

export interface DarkintResult {
  source: string;
  url?: string;
  title?: string;
  date?: string;
  contentSnippet?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ─── ENTITY RESOLUTION ENGINE (§3.2) ─────────────────────────────────────

export interface EntityMatchCandidate {
  nodeId: string;
  matchScore: number; // 0.0 - 1.0
  matchType: 'DETERMINISTIC' | 'PROBABILISTIC' | 'FUZZY' | 'GRAPH_BASED';
  matchedFields: string[];
  conflicts?: string[];
}

export interface ResolutionResult {
  primaryNodeId: string;
  mergedNodeIds: string[];
  confidence: ConfidenceScore;
  strategy: string;
  timestamp: string;
}

// ─── GRAPH STRUCTURE ──────────────────────────────────────────────────────

export interface MLIPGraph {
  nodes: EntityNode[];
  edges: EntityEdge[];
  query?: string;
  generatedAt: string;
  totalNodes: number;
  totalEdges: number;
  layerCoverage: Partial<Record<IntelLayer, number>>;
}

// ─── THREAT INTELLIGENCE Types ────────────────────────────────────────────

export interface IOCRecord {
  id: string;
  type: 'IP' | 'DOMAIN' | 'URL' | 'HASH_MD5' | 'HASH_SHA256' | 'EMAIL' | 'CVE' | 'YARA';
  value: string;
  threatType?: string;
  malwareFamily?: string;
  confidence: number;
  sources?: string[];
  tags?: string[];
  firstSeen?: string;
  lastSeen?: string;
  expiresAt?: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases?: string[];
  country?: string;
  motivation?: string[];
  ttps?: string[];  // MITRE ATT&CK
  targets?: string[];
  firstSeen?: string;
  lastSeen?: string;
  iocs?: IOCRecord[];
  confidence: number;
}

// ─── FININT Types ─────────────────────────────────────────────────────────

export interface BlockchainTransaction {
  hash: string;
  blockchain: string;
  from: string;
  to: string;
  valueUsd: number;
  fee?: number;
  timestamp: string;
  confirmations?: number;
  isIncoming: boolean;
  riskScore?: number;
  labels?: string[];
}

export interface WalletCluster {
  id: string;
  addresses: string[];
  totalValueUsd: number;
  tags?: string[];
  riskScore?: number;
  potentialOwner?: string;
}

// ─── GEOINT Types ─────────────────────────────────────────────────────────

export interface GeoEvent {
  id: string;
  type: 'SIGHTING' | 'RESIDENCE' | 'WORKPLACE' | 'TRAVEL' | 'VEHICLE_SPOTTED' | 'DEVICE_SEEN';
  lat: number;
  lon: number;
  accuracy?: number; // meters
  timestamp: string;
  source: IntelLayer;
  confidence: number;
  entityId: string;
  description?: string;
}

export interface RouteAnalysis {
  entityId: string;
  events: GeoEvent[];
  frequentLocations: Array<{
    lat: number;
    lon: number;
    count: number;
    label?: string;
  }>;
  travelPatterns?: string[];
}

// ─── MLIP MODULE RESULT ───────────────────────────────────────────────────

export interface MLIPModuleResult<T = any> {
  moduleId: IntelLayer;
  query: string;
  queryType: string;
  status: 'OK' | 'ERROR' | 'PARTIAL' | 'NO_DATA' | 'ACCESS_DENIED';
  data?: T;
  error?: string;
  confidence?: number;
  retrievedAt: string;
  latencyMs: number;
  sources: string[];
}

// ─── COMPREHENSIVE INTELLIGENCE REPORT ───────────────────────────────────

export interface IntelligenceReport {
  id: string;
  title: string;
  query: string;
  generatedAt: string;
  accessLevel: MLIPAccessLevel;
  subject?: EntityNode;
  graph?: MLIPGraph;
  osi?: MLIPModuleResult;
  socint?: MLIPModuleResult;
  medint?: MLIPModuleResult;
  comint?: MLIPModuleResult;
  techint?: MLIPModuleResult;
  darkint?: MLIPModuleResult;
  geoint?: MLIPModuleResult;
  finint?: MLIPModuleResult;
  threat?: MLIPModuleResult;
  overallRisk: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  keyFindings: string[];
  recommendations?: string[];
  analyst?: string;
}
