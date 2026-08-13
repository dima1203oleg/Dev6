/**
 * Card-Level Production Validation & Data Completeness Certification Framework v1.0
 * Registry of all information cards that need validation
 */

import { CardCategory } from './types';

export interface CardDefinition {
  id: string;
  name: string;
  category: CardCategory;
  componentPath: string;
  requiredFields: string[];
  optionalFields: string[];
  critical: boolean;
}

export const CARD_REGISTRY: CardDefinition[] = [
  {
    id: 'general',
    name: 'Загальна інформація',
    category: 'general',
    componentPath: '../components/search/cards/GeneralCard',
    requiredFields: ['fullName', 'rnokpp'],
    optionalFields: ['birthDate', 'gender', 'citizenship', 'status'],
    critical: true,
  },
  {
    id: 'passport',
    name: 'Паспортні документи',
    category: 'passport',
    componentPath: '../components/search/cards/PassportCard',
    requiredFields: ['documentType', 'series', 'number'],
    optionalFields: ['issueDate', 'issuingAuthority', 'validity'],
    critical: true,
  },
  {
    id: 'address',
    name: 'Реєстрація місця проживання',
    category: 'address',
    componentPath: '../components/search/cards/AddressCard',
    requiredFields: ['address'],
    optionalFields: ['type', 'relevance', 'coordinates'],
    critical: true,
  },
  {
    id: 'family',
    name: 'Сімейний стан',
    category: 'family',
    componentPath: '../components/search/cards/FamilyCard',
    requiredFields: ['status'],
    optionalFields: ['changeDate', 'history'],
    critical: false,
  },
  {
    id: 'relatives',
    name: 'Родичі',
    category: 'relatives',
    componentPath: '../components/search/cards/FamilyLinksCard',
    requiredFields: [],
    optionalFields: ['spouse', 'father', 'mother', 'siblings'],
    critical: false,
  },
  {
    id: 'children',
    name: 'Діти',
    category: 'children',
    componentPath: '../components/search/cards/ChildrenCard',
    requiredFields: [],
    optionalFields: ['fullName', 'birthDate', 'relationship'],
    critical: false,
  },
  {
    id: 'legal_entities',
    name: 'Юридичні особи',
    category: 'legal_entities',
    componentPath: '../components/search/cards/LegalLinksCard',
    requiredFields: ['companyName', 'role'],
    optionalFields: ['edrpou', 'appointmentDate', 'terminationDate'],
    critical: true,
  },
  {
    id: 'ownership',
    name: 'Частки власності',
    category: 'ownership',
    componentPath: '../components/search/cards/OwnershipCard',
    requiredFields: ['company', 'share'],
    optionalFields: ['date'],
    critical: false,
  },
  {
    id: 'beneficial',
    name: 'Бенефіціарна участь',
    category: 'beneficial',
    componentPath: '../components/search/cards/BeneficialCard',
    requiredFields: ['beneficiary'],
    optionalFields: ['directOwnership', 'indirectOwnership', 'controlChain'],
    critical: true,
  },
  {
    id: 'court_cases',
    name: 'Судові справи',
    category: 'court_cases',
    componentPath: '../components/search/cards/CourtCasesCard',
    requiredFields: [],
    optionalFields: ['caseNumber', 'date', 'court', 'status', 'decision'],
    critical: true,
  },
  {
    id: 'enforcement',
    name: 'Виконавчі провадження',
    category: 'enforcement',
    componentPath: '../components/search/cards/ExecutionsCard',
    requiredFields: [],
    optionalFields: ['number', 'amount', 'status', 'date'],
    critical: true,
  },
  {
    id: 'tax',
    name: 'Податкова інформація',
    category: 'tax',
    componentPath: '../components/search/cards/TaxSignalsCard',
    requiredFields: [],
    optionalFields: ['debt', 'status', 'vatPayer', 'history'],
    critical: true,
  },
  {
    id: 'sanctions',
    name: 'Санкції',
    category: 'sanctions',
    componentPath: '../components/search/cards/SanctionsCard',
    requiredFields: [],
    optionalFields: ['ofac', 'eu', 'rnbo', 'openSanctions'],
    critical: true,
  },
  {
    id: 'real_estate',
    name: 'Нерухомість',
    category: 'real_estate',
    componentPath: '../components/search/cards/PropertyCard',
    requiredFields: [],
    optionalFields: ['land', 'apartments', 'houses', 'commercial'],
    critical: false,
  },
  {
    id: 'transport',
    name: 'Транспорт',
    category: 'transport',
    componentPath: '../components/search/cards/VehicleCard',
    requiredFields: [],
    optionalFields: ['vehicles', 'vin', 'plateNumbers'],
    critical: false,
  },
  {
    id: 'business_connections',
    name: 'Бізнес-зв’язки',
    category: 'business_connections',
    componentPath: '../components/search/cards/NetworkCard',
    requiredFields: [],
    optionalFields: ['direct', 'indirect', 'sharedCompanies'],
    critical: false,
  },
  {
    id: 'phones',
    name: 'Телефони',
    category: 'phones',
    componentPath: '../components/search/cards/PhoneCard',
    requiredFields: [],
    optionalFields: ['numbers', 'operator', 'period'],
    critical: false,
  },
  {
    id: 'email',
    name: 'Email',
    category: 'email',
    componentPath: '../components/search/cards/EmailCard',
    requiredFields: [],
    optionalFields: ['addresses', 'sources', 'status'],
    critical: false,
  },
  {
    id: 'social_media',
    name: 'Соціальні мережі',
    category: 'social_media',
    componentPath: '../components/search/cards/SocialCard',
    requiredFields: [],
    optionalFields: ['profiles', 'verification', 'sources'],
    critical: false,
  },
  {
    id: 'risks',
    name: 'Ризики',
    category: 'risks',
    componentPath: '../components/search/cards/RiskCard',
    requiredFields: ['riskScore'],
    optionalFields: ['factors', 'formula', 'evidence'],
    critical: true,
  },
  {
    id: 'ai_analytics',
    name: 'AI-аналітика',
    category: 'ai_analytics',
    componentPath: '../components/search/cards/AIAnalyticsCard',
    requiredFields: [],
    optionalFields: ['summary', 'insights', 'sources'],
    critical: false,
  },
];

export function getCardDefinition(cardId: string): CardDefinition | undefined {
  return CARD_REGISTRY.find(card => card.id === cardId);
}

export function getAllCriticalCards(): CardDefinition[] {
  return CARD_REGISTRY.filter(card => card.critical);
}

export function getCardsByCategory(category: CardCategory): CardDefinition[] {
  return CARD_REGISTRY.filter(card => card.category === category);
}
