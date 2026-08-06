import { ConnectorMetadata } from '../connectors/sdk';

export interface RegistrySource extends ConnectorMetadata {
  category: 'STATE' | 'INTERNATIONAL';
  type: 'FREE_AUTO' | 'FREE_AUTH';
  ownerOrg: string;
  provides: string;
}

export const REGISTRY_CATALOG: RegistrySource[] = [
  {
    id: 'ua.edr',
    name: 'ЄДР — відкриті дані/дампи',
    protocol: 'REST', // Assuming we build an API or use NAIS
    version: '1.0',
    description: 'Базове ядро для юридичних осіб та ФОП',
    country: 'UA',
    owner: 'Мін\'юст / НАІС',
    authMethod: 'NONE',
    status: 'ONLINE',
    rateLimitReqPerMin: 60,
    category: 'STATE',
    type: 'FREE_AUTO',
    ownerOrg: 'Мін\'юст / НАІС',
    provides: 'Юрособи, ФОП, керівники, статус реєстрації'
  },
  {
    id: 'ua.court',
    name: 'ЄДРСР — судові рішення',
    protocol: 'REST',
    version: '1.0',
    description: 'Повні тексти судових рішень',
    country: 'UA',
    owner: 'ДСА',
    authMethod: 'NONE',
    status: 'ONLINE',
    rateLimitReqPerMin: 60,
    category: 'STATE',
    type: 'FREE_AUTO',
    ownerOrg: 'ДСА',
    provides: 'Повні тексти судових рішень'
  },
  {
    id: 'ua.tax',
    name: 'Податковий борг',
    protocol: 'REST',
    version: '1.0',
    description: 'Наявність і сума боргу',
    country: 'UA',
    owner: 'ДПС',
    authMethod: 'NONE',
    status: 'ONLINE',
    rateLimitReqPerMin: 60,
    category: 'STATE',
    type: 'FREE_AUTO',
    ownerOrg: 'ДПС',
    provides: 'Наявність і сума боргу'
  },
  {
    id: 'ua.sanctions',
    name: 'Державний реєстр санкцій України',
    protocol: 'REST',
    version: '1.0',
    description: 'Санкційні записи (осіб/компаній)',
    country: 'UA',
    owner: 'РНБО',
    authMethod: 'NONE',
    status: 'ONLINE',
    rateLimitReqPerMin: 60,
    category: 'STATE',
    type: 'FREE_AUTO',
    ownerOrg: 'РНБО',
    provides: 'Санкційні записи'
  },
  {
    id: 'ua.licenses',
    name: 'Ліцензії та Дозволи',
    protocol: 'REST',
    version: '1.0',
    description: 'Різні ліцензії',
    country: 'UA',
    owner: 'Різні',
    authMethod: 'NONE',
    status: 'ONLINE',
    rateLimitReqPerMin: 60,
    category: 'STATE',
    type: 'FREE_AUTO',
    ownerOrg: 'Різні',
    provides: 'Дозволи та ліцензії'
  }
];
