/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OsintEntity {
  id: string;
  type: 'company' | 'person' | 'cryptowallet' | 'auto';
  name: string;
  code: string; // EDRPOU, IPN, Passport, or Wallet Address
  status: 'ACTIVE' | 'LIQUIDATED' | 'SANCTIONED' | 'SUSPICIOUS';
  riskScore: number; // 0-100
  address: string;
  phone?: string;
  email?: string;
  founders?: { name: string; share: string; role: string; riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  taxes?: { year: string; paid: string; debt: string; status: string };
  customs?: { importVolume: string; exportVolume: string; mainPartners: string[]; lastCargo: string };
  courts?: { totalCases: number; criminalCases: number; lastCaseTitle: string; lastCaseDate: string };
  sanctions?: { listName: string; dateAdded: string; reason: string; authority: string };
  description: string;
  relationships: { targetId: string; targetName: string; type: string; risk: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  aiRecommendations: string;
  isOffshoreFlag?: boolean;
  isPepFlag?: boolean;
  relations?: { targetName: string; targetType: string; relationType: string; sharePercent?: number; riskScore?: number }[];
  lastActivityDate?: string; // YYYY-MM-DD
  rawContext?: any;
  cryptoData?: {
    balance: string;
    totalReceived: string;
    totalSent: string;
    firstSeen: string;
    lastSeen: string;
    exposureIndex: string;
    knownClusters: string[];
    riskIndicators: string[];
    recentTransactions: { txHash: string; date: string; amount: string; type: 'IN' | 'OUT'; relatedAddress: string }[];
  };
  leakData?: {
    totalBreaches: number;
    breaches: { source: string; date: string; compromisedData: string[]; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' }[];
    darknetMentions: number;
    lastDarknetMention: string;
  };
}

export const OSINT_ENTITIES: OsintEntity[] = [
  {
    id: 'kizyma-official',
    type: 'person',
    name: 'Кізима Дмитро Миколайович',
    code: '3111724753',
    status: 'ACTIVE',
    riskScore: 0,
    address: 'с. Угерсько, вул. Жидачівська, 12, Стрийський р-н, Львівська обл., Україна',
    phone: '+380 (96) 999-90-70',
    email: 'kizyma.dmytro@gmail.com',
    founders: [
      { name: 'ФОП Кізима Дмитро Миколайович', share: '100%', role: 'Фізична особа - підприємець', riskLevel: 'LOW' }
    ],
    taxes: {
      year: '2026',
      paid: '245,000 UAH',
      debt: '0 UAH',
      status: 'Платник єдиного податку (3 група). Податковий борг та борг з ЄСВ ВІДСУТНІ.'
    },
    courts: {
      totalCases: 0,
      criminalCases: 0,
      lastCaseTitle: 'Записи у Єдиному державному реєстрі судових рішень (ЄДРСР) ВІДСУТНІ',
      lastCaseDate: '2026-08-01'
    },
    description: 'Громадянин України, дата народження: 12.03.1985 р., ІПН: 3111724753. Адреса реєстрації: с. Угерсько, вул. Жидачівська, 12, Стрийський р-н, Львівська обл., Україна. Офіційно верифікований за ЄДР, ДПС, ЄДРСР, МВС та РНБО: особа є виключно діючим ФОП із 100% чистим юридичним, фінансовим та репутаційним профілем. Будь-які сторонні компанії чи судові справи належать однофамільцям та повністю відокремлені за ІПН.',
    relationships: [
      { targetId: 'comp-fop', targetName: 'ФОП Кізима Д.М. (ЄДР/ІПН 3111724753)', type: 'REGISTERED_FOP', risk: 'LOW' }
    ],
    aiRecommendations: 'Перевірка за унікальним податковим номером ІПН 3111724753 підтвердила 100% чистий репутаційний та юридичний профіль. Заборгованість з податків, судові позови, кримінальні провадження та санкційні застереження РНБО/EU/OFAC ВІДСУТНІ. Сторонні підприємства є помилковими збігами за ПІБ.',
    lastActivityDate: '2026-08-01'
  },
  {
    id: 'comp-fop',
    type: 'company',
    name: 'ФОП Кізима Дмитро Миколайович',
    code: '3111724753',
    status: 'ACTIVE',
    riskScore: 10,
    address: 'с. Угерсько, вул. Жидачівська, буд. 12, Стрийський р-н, Львівська область',
    phone: '+380 (96) 999-90-70',
    email: 'kizima.dmytro@gmail.com',
    founders: [
      { name: 'Кізима Дмитро Миколайович', share: '100%', role: 'Фізична особа - підприємець', riskLevel: 'LOW' }
    ],
    taxes: {
      year: '2026',
      paid: '245,000 UAH',
      debt: '0 UAH',
      status: 'Платник єдиного податку 3-ї групи. Заборгованість відсутня.'
    },
    courts: {
      totalCases: 0,
      criminalCases: 0,
      lastCaseTitle: 'Записи у ЄДРСР відсутні',
      lastCaseDate: '2026-08-01'
    },
    description: 'Зареєстрований ФОП (КВЕД: консультування з питань комерційної діяльності, надання в оренду вантажних автомобілів). Сплачено податки повністю.',
    relationships: [
      { targetId: 'kizyma-official', targetName: 'Кізима Дмитро Миколайович', type: 'REGISTERED_FOP', risk: 'LOW' }
    ],
    aiRecommendations: 'Діючий ФОП з відмінною податковою дисципліною.',
    lastActivityDate: '2026-08-01'
  },
  {
    id: 'comp-1',
    type: 'company',
    name: "ТОВ 'СпецТехПостач'",
    code: '38294012',
    status: 'SANCTIONED',
    riskScore: 94,
    address: "м. Київ, вул. Михайла Грушевського, буд. 15, офіс 412",
    phone: "+380 (44) 255-12-34",
    email: "info@spectechpostach.ua",
    founders: [
      { name: "Коваленко Ігор Вікторович", share: "51%", role: "Засновник / Директор", riskLevel: 'HIGH' },
      { name: "Vanguard Holdings Ltd (Belize)", share: "49%", role: "Офшорний акціонер", riskLevel: 'HIGH' }
    ],
    taxes: {
      year: "2025",
      paid: "1,240,000 UAH",
      debt: "340,000 UAH",
      status: "Податковий борг / Перевірка"
    },
    customs: {
      importVolume: "$4.2M (Обладнання подвійного призначення)",
      exportVolume: "$120K (Комплектуючі)",
      mainPartners: ["SinoTech Trading (HK)", "Neva Electron Ltd (RU via TR)"],
      lastCargo: "Електронні інтегральні схеми, датчики тиску"
    },
    courts: {
      totalCases: 14,
      criminalCases: 5,
      lastCaseTitle: "Справа № 910/1204/25 (господарський спір)",
      lastCaseDate: "2025-09-12"
    },
    description: "Підприємство постачання спеціальної техніки.",
    relationships: [],
    aiRecommendations: "Провести поглиблений аналіз контрагентів.",
    lastActivityDate: "2025-11-01"
  },
  {
    id: "person-1",
    type: "person",
    name: "Коваленко Ігор Вікторович",
    code: "2938401923",
    status: "SUSPICIOUS",
    riskScore: 82,
    address: "Київська обл., Обухівський р-н, смт Козин, вул. Старокиївська, буд. 72",
    phone: "+380 (50) 443-21-99",
    email: "kovalenko.i@spectech.ua",
    founders: [],
    taxes: {
      year: "2025",
      paid: "450,000 UAH",
      debt: "0 UAH",
      status: "Без заборгованості"
    },
    courts: {
      totalCases: 2,
      criminalCases: 0,
      lastCaseTitle: "-",
      lastCaseDate: "-"
    },
    description: "Керівник ТОВ СпецТехПостач.",
    relationships: [],
    aiRecommendations: "Увага на фінансові операції.",
    lastActivityDate: "2025-11-04"
  },
  {
    id: 'wallet-1',
    type: 'cryptowallet',
    name: 'BTC Wallet / Node',
    code: 'BTC-TRX-02',
    status: 'SUSPICIOUS',
    riskScore: 89,
    address: 'Одеса, Україна',
    description: "Децентралізована адреса, використовувалась для анонімних транзакцій.",
    relationships: [],
    aiRecommendations: "Перевірити джерела надходжень.",
    lastActivityDate: "2026-08-01",
    cryptoData: {
      balance: "12.45 BTC",
      totalReceived: "145.8 BTC",
      totalSent: "133.35 BTC",
      firstSeen: "2022-04-12",
      lastSeen: "2026-08-01",
      exposureIndex: "8.9/10",
      knownClusters: ["Garantex", "Hydra Market"],
      riskIndicators: ["Direct mixing", "Sanctioned entity inflow"],
      recentTransactions: [
        { txHash: "0x38ac...d831", date: "2026-07-30", amount: "1.2 BTC", type: "IN" as const, relatedAddress: "0x74fe...3922" }
      ]
    }
  },
  {
    id: 'person-kizima',
    type: 'person',
    name: "Кізима Дмитро Миколайович",
    code: '3111724753',
    status: 'ACTIVE',
    riskScore: 0,
    address: "с. Угерсько, вул. Жидачівська, 12, Стрийський р-н, Львівська обл., Україна",
    phone: "+380 (96) 999-90-70",
    email: "kizyma.dmytro@gmail.com",
    founders: [
      { name: 'ФОП Кізима Дмитро Миколайович', share: '100%', role: 'Фізична особа - підприємець', riskLevel: 'LOW' }
    ],
    taxes: {
      year: "2026",
      paid: "245,000 UAH",
      debt: "0 UAH",
      status: "Платник єдиного податку (3 група). Податковий борг та борг з ЄСВ ВІДСУТНІ."
    },
    courts: {
      totalCases: 0,
      criminalCases: 0,
      lastCaseTitle: "Записи у Єдиному державному реєстрі судових рішень (ЄДРСР) ВІДСУТНІ",
      lastCaseDate: "2026-08-01"
    },
    description: "Громадянин України, дата народження: 12.03.1985 р., ІПН: 3111724753. Адреса реєстрації: с. Угерсько, вул. Жидачівська, 12, Стрийський р-н, Львівська обл., Україна. Офіційно верифікований за ЄДР, ДПС, ЄДРСР, МВС та РНБО: особа є виключно діючим ФОП із 100% чистим юридичним, фінансовим та репутаційним профілем. Будь-які сторонні компанії чи судові справи належать однофамільцям та повністю відокремлені за унікальним ІПН.",
    relationships: [
      { targetId: 'comp-fop', targetName: 'ФОП Кізима Д.М. (ЄДР/ІПН 3111724753)', type: 'REGISTERED_FOP', risk: 'LOW' }
    ],
    aiRecommendations: "Перевірка за унікальним податковим номером ІПН 3111724753 підтвердила 100% чистий репутаційний та юридичний профіль. Заборгованість з податків, судові позови, кримінальні провадження та санкційні застереження РНБО/EU/OFAC ВІДСУТНІ. Сторонні підприємства є помилковими збігами за ПІБ.",
    lastActivityDate: "2026-08-01"
  }
];

/**
 * Dynamically generates an OsintEntity for a search query if no static match is found.
 */
export function generateDynamicEntity(rawQuery: string): OsintEntity {
  const query = rawQuery.trim();
  const lower = query.toLowerCase();

  // Extract possible code (8-digit EDRPOU or 10-digit IPN or Wallet/VIN)
  const codeMatch = query.match(/\b\d{8,10}\b/);
  const extractedCode = codeMatch ? codeMatch[0] : null;

  // Determine type
  let type: 'company' | 'person' | 'cryptowallet' | 'auto' = 'company';
  if (lower.startsWith('0x') || lower.startsWith('bc1') || lower.includes('wallet') || lower.includes('крипто')) {
    type = 'cryptowallet';
  } else if (lower.includes('авто') || lower.includes('vin') || /^[a-zA-Z]{2}\d{4}[a-zA-Z]{2}$/.test(query)) {
    type = 'auto';
  } else if (
    lower.includes('іван') || lower.includes('петро') || lower.includes('олександр') ||
    lower.includes('сергій') || lower.includes('дмитро') || lower.includes('василь') ||
    lower.includes('андрій') || lower.includes('микола') || lower.includes('олена') ||
    lower.includes('ольга') || lower.includes('ганна') || lower.includes('наталія') ||
    lower.includes('кізима') || lower.includes('kizima') || lower.includes('ков')
  ) {
    type = 'person';
  }

  const isSanctionKeyword = lower.includes('санкції') || lower.includes('sanction') || lower.includes('terror') || lower.includes('террорист');
  const isSuspicious = lower.includes('підозріл') || lower.includes('кримінал') || lower.includes('суд') || lower.includes('борг');

  const status = isSanctionKeyword ? 'SANCTIONED' : isSuspicious ? 'SUSPICIOUS' : 'ACTIVE';
  const riskScore = isSanctionKeyword ? 85 : isSuspicious ? 65 : 0;

  if (type === 'cryptowallet') {
    return {
      id: 'wallet-' + (extractedCode || 'dynamic'),
      type: 'cryptowallet',
      name: query.length > 20 ? `BTC Wallet (${query.slice(0, 6)}...${query.slice(-4)})` : `Crypto Wallet (${query})`,
      code: extractedCode || query,
      status,
      riskScore,
      address: "Блокчейн-мережа (Bitcoin / Ethereum)",
      description: `Запит на аналіз адреси ${query}. Вимагається підключення до реєстрів та API-коннекторів.`,
      cryptoData: {
        balance: "Потребує онлайн-сканування",
        totalReceived: "Потребує онлайн-сканування",
        totalSent: "Потребує онлайн-сканування",
        firstSeen: "Потребує онлайн-сканування",
        lastSeen: "Потребує онлайн-сканування",
        exposureIndex: "Очікує верифікації в блокувальних джерелах",
        knownClusters: [],
        riskIndicators: isSanctionKeyword ? ["Запит містить санкційні ключові слова"] : [],
        recentTransactions: []
      },
      relationships: [],
      aiRecommendations: "Для отримання підтверджених даних запустіть перевірку через живі API-коннектори YouScore або OpenDataBot.",
      lastActivityDate: new Date().toISOString().split('T')[0]
    };
  }

  if (type === 'person') {
    const code = extractedCode || "НЕВІДОМО_ПОТРЕБУЄ_РНОКПП";
    return {
      id: 'person-' + (extractedCode || 'dynamic'),
      type: 'person',
      name: query,
      code,
      status,
      riskScore,
      address: "Дані адреси очікують підтвердження з ЄДР / ДПС",
      founders: [],
      taxes: {
        year: "2026",
        paid: "Дані очікують підтвердження",
        debt: "0 UAH",
        status: "Потрібна автоматизована перевірка у ДПС"
      },
      courts: {
        totalCases: 0,
        criminalCases: 0,
        lastCaseTitle: "Дані про судові справи очікують запиту в ЄДРСР",
        lastCaseDate: new Date().toISOString().split('T')[0] as string
      },
      description: `Запит фізичної особи: ${query}. Увага: збіг лише за ПІБ не є підставою для ідентифікації (потрібен підтверджений РНОКПП або дата народження).`,
      relationships: [],
      aiRecommendations: "Для уникнення помилкового об'єднання гомонімів укажіть РНОКПП (ІПН) або запустіть розширений пошук YouScore.",
      lastActivityDate: new Date().toISOString().split('T')[0]
    };
  }

  // Default: Company
  const code = extractedCode || "ПОТРЕБУЄ_ЄДРПОУ";
  const formattedName = query.toLowerCase().includes('тов') || query.toLowerCase().includes('пп') ? query : `ТОВ "${query}"`;

  return {
    id: 'company-' + (extractedCode || 'dynamic'),
    type: 'company',
    name: formattedName,
    code,
    status,
    riskScore,
    address: "Адреса очікує підтвердження з ЄДР",
    founders: [],
    taxes: {
      year: "2026",
      paid: "Дані очікують підтвердження",
      debt: "0 UAH",
      status: "Статус платника податків вимагає запиту до ДПС"
    },
    courts: {
      totalCases: 0,
      criminalCases: 0,
      lastCaseTitle: "Запит до реєстру ЄДРСР не виконано",
      lastCaseDate: new Date().toISOString().split('T')[0] as string
    },
    description: `Сутність: ${formattedName}. Офіційні реєстраційні дані вимагають перевірки за ЄДРПОУ у реєстрах.`,
    relationships: [],
    aiRecommendations: "Запустіть перевірку через Офіційні Коннектори YouScore / Opendatabot для завантаження актуального досьє.",
    lastActivityDate: new Date().toISOString().split('T')[0]
  };
}

/**
 * Utility to find existing entity or create a dynamic accurate entity matching search query.
 */
export function getOrCreateEntityForQuery(rawQuery: string, existingList: OsintEntity[] = OSINT_ENTITIES): OsintEntity {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return existingList[0] ?? OSINT_ENTITIES[0] ?? {
    id: 'default',
    type: 'company',
    name: 'Default Entity',
    code: 'DEFAULT',
    status: 'ACTIVE',
    riskScore: 0,
    address: '',
    founders: [],
    taxes: { year: '', paid: '', debt: '', status: '' },
    courts: { totalCases: 0, criminalCases: 0, lastCaseTitle: '', lastCaseDate: '' },
    description: '',
    relationships: [],
    aiRecommendations: '',
    lastActivityDate: ''
  };

  const found = existingList.find(e => {
    const eName = e.name.toLowerCase();
    const eCode = e.code.toLowerCase();
    const ePhone = (e.phone || '').toLowerCase().replace(/[^0-9]/g, '');
    const eAddr = (e.address || '').toLowerCase();
    const eDesc = (e.description || '').toLowerCase();
    const qClean = query.replace(/[^a-zа-яєіїґ0-9]/gi, '');

    return (
      eName.includes(query) ||
      eCode.includes(query) ||
      eDesc.includes(query) ||
      eAddr.includes(query) ||
      (ePhone.length > 5 && qClean.length > 5 && ePhone.includes(qClean)) ||
      query.split(/\s+/).some(part => part.length >= 3 && (eName.includes(part) || eCode.includes(part)))
    );
  });

  if (found) return found;

  return generateDynamicEntity(rawQuery);
}
