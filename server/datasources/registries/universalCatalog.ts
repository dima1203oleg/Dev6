import { dataSourceGovernor } from '../governor';
import { DataSourceResult } from '../types';

// =====================================================
// PREDATOR UNIVERSAL REGISTRY CONNECTOR
// Covers 170+ Ukrainian state registries via data.gov.ua CKAN API,
// direct government portals, and open data endpoints.
// =====================================================

export interface RegistryEntry {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  owner: string;
  url: string;
  ckanResourceId?: string;
  directApiUrl?: string;
  isFree: boolean;
  isAutomatic: boolean;
  searchFields: string[];  // Which fields to search by (edrpou, ipn, name, plate, etc.)
  provides: string;
}

// =====================================================
// MASTER REGISTRY CATALOG — 170+ Ukrainian State Registries
// =====================================================
export const FULL_REGISTRY_CATALOG: RegistryEntry[] = [
  // ═══════════════════════════════════════════════════
  // CATEGORY 1: ЄДИНИЙ ДЕРЖАВНИЙ РЕЄСТР (ЄДР) — Ядро
  // ═══════════════════════════════════════════════════
  { id: 'ua.edr.legal', name: 'ЄДР — Юридичні особи', nameEn: 'USR Legal Entities', category: 'EDR', owner: 'Мін\'юст / НАІС', url: 'https://erb.minjust.gov.ua', directApiUrl: 'https://nais.gov.ua/api/v1/edr/companies/', isFree: false, isAutomatic: true, searchFields: ['edrpou'], provides: 'Назва, статус, КВЕД, адреса, керівник' },
  { id: 'ua.edr.fop', name: 'ЄДР — ФОП', nameEn: 'USR Individual Entrepreneurs', category: 'EDR', owner: 'Мін\'юст / НАІС', url: 'https://erb.minjust.gov.ua', directApiUrl: 'https://nais.gov.ua/api/v1/edr/fop/', isFree: false, isAutomatic: true, searchFields: ['ipn', 'name'], provides: 'ПІБ, КВЕД, статус, дата реєстрації' },
  { id: 'ua.edr.founders', name: 'ЄДР — Засновники', nameEn: 'USR Founders', category: 'EDR', owner: 'Мін\'юст / НАІС', url: 'https://erb.minjust.gov.ua', directApiUrl: 'https://nais.gov.ua/api/v1/edr/founders/', isFree: false, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Засновники, частки, країна' },
  { id: 'ua.edr.beneficiaries', name: 'ЄДР — Бенефіціари', nameEn: 'USR Beneficial Owners', category: 'EDR', owner: 'Мін\'юст / НАІС', url: 'https://erb.minjust.gov.ua', directApiUrl: 'https://nais.gov.ua/api/v1/edr/beneficiaries/', isFree: false, isAutomatic: true, searchFields: ['edrpou'], provides: 'Кінцеві бенефіціарні власники' },
  { id: 'ua.edr.branches', name: 'ЄДР — Відокремлені підрозділи', nameEn: 'USR Branches', category: 'EDR', owner: 'Мін\'юст / НАІС', url: 'https://data.gov.ua', ckanResourceId: 'edr_branches', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Філії, представництва' },
  { id: 'ua.edr.changes', name: 'ЄДР — Історія змін', nameEn: 'USR Change History', category: 'EDR', owner: 'Мін\'юст / НАІС', url: 'https://data.gov.ua', ckanResourceId: 'edr_changes', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Зміни назви, адреси, керівництва' },
  { id: 'ua.edr.terminated', name: 'ЄДР — Припинені', nameEn: 'USR Terminated', category: 'EDR', owner: 'Мін\'юст / НАІС', url: 'https://data.gov.ua', ckanResourceId: 'edr_terminated', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Дата та підстава припинення' },
  { id: 'ua.edr.exchange_data', name: 'ЄДР — Обмін даними', nameEn: 'USR Data Exchange', category: 'EDR', owner: 'Мін\'юст / НАІС', url: 'https://data.gov.ua', ckanResourceId: 'edr_exchange', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Дані обміну з іншими реєстрами' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 2: ПОДАТКОВА СИСТЕМА (ДПС)
  // ═══════════════════════════════════════════════════
  { id: 'ua.tax.debt', name: 'Реєстр податкового боргу', nameEn: 'Tax Debt Registry', category: 'TAX', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'tax_debt_registry', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn'], provides: 'Сума боргу, тип, ДПІ' },
  { id: 'ua.tax.vat', name: 'Реєстр платників ПДВ', nameEn: 'VAT Payers Registry', category: 'TAX', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'b52e39dd-9516-4e24-a59d-2e29ef137a4b', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn'], provides: 'Номер свідоцтва, дата реєстрації, анулювання' },
  { id: 'ua.tax.single', name: 'Реєстр платників єдиного податку', nameEn: 'Single Tax Payers', category: 'TAX', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'tax_single_payers', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn'], provides: 'Група єдиного податку, ставка' },
  { id: 'ua.tax.nonprofit', name: 'Реєстр неприбуткових організацій', nameEn: 'Non-Profit Registry', category: 'TAX', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'tax_nonprofit', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Ознака неприбутковості' },
  { id: 'ua.tax.large_taxpayers', name: 'Реєстр великих платників податків', nameEn: 'Large Taxpayers', category: 'TAX', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'tax_large', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Статус великого платника' },
  { id: 'ua.tax.invalids', name: 'Недійсні свідоцтва ПДВ', nameEn: 'Invalid VAT Certificates', category: 'TAX', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'tax_invalid_vat', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Анульовані ПДВ свідоцтва' },
  { id: 'ua.tax.risk', name: 'Перелік ризикових платників', nameEn: 'Risky Taxpayers List', category: 'TAX', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'tax_risky', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn'], provides: 'Ознака ризикового платника' },
  { id: 'ua.tax.missing', name: 'Відсутні за місцезнаходженням', nameEn: 'Missing at Location', category: 'TAX', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'tax_missing', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Відсутність за юридичною адресою' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 3: СУДОВА СИСТЕМА
  // ═══════════════════════════════════════════════════
  { id: 'ua.court.decisions', name: 'ЄДРСР — Судові рішення', nameEn: 'Court Decisions Registry', category: 'COURT', owner: 'ДСА', url: 'https://reyestr.court.gov.ua', ckanResourceId: 'court_decisions_opendata', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn', 'name'], provides: 'Тексти судових рішень' },
  { id: 'ua.court.schedule', name: 'Розклад судових засідань', nameEn: 'Court Schedule', category: 'COURT', owner: 'ДСА', url: 'https://court.gov.ua', ckanResourceId: 'court_schedule', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Заплановані засідання' },
  { id: 'ua.court.judges', name: 'Реєстр суддів', nameEn: 'Judges Registry', category: 'COURT', owner: 'ВРП', url: 'https://court.gov.ua', ckanResourceId: 'judges_registry', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'ПІБ судді, суд, стаж' },
  { id: 'ua.court.bankruptcy', name: 'Реєстр банкрутств', nameEn: 'Bankruptcy Registry', category: 'COURT', owner: 'ДСА', url: 'https://data.gov.ua', ckanResourceId: 'bankruptcy_register', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn'], provides: 'Стадія банкрутства, справа' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 4: ВИКОНАВЧІ ПРОВАДЖЕННЯ (МІН'ЮСТ)
  // ═══════════════════════════════════════════════════
  { id: 'ua.enforcement.register', name: 'Реєстр виконавчих проваджень (АСВП)', nameEn: 'Enforcement Proceedings', category: 'ENFORCEMENT', owner: 'Мін\'юст', url: 'https://asvpweb.minjust.gov.ua', ckanResourceId: 'enforcement_proceedings', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn', 'name'], provides: 'Номер ВП, боржник, стягувач' },
  { id: 'ua.enforcement.debtors', name: 'Єдиний реєстр боржників (ЄРБ)', nameEn: 'Unified Debtors Registry', category: 'ENFORCEMENT', owner: 'Мін\'юст', url: 'https://erb.minjust.gov.ua', ckanResourceId: 'erb_debtors', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn', 'name'], provides: 'Статус боржника, сума стягнення' },
  { id: 'ua.enforcement.private', name: 'Реєстр приватних виконавців', nameEn: 'Private Executors Registry', category: 'ENFORCEMENT', owner: 'Мін\'юст', url: 'https://minjust.gov.ua', ckanResourceId: 'private_executors', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'ПІБ виконавця, округ' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 5: НЕРУХОМІСТЬ ТА РЕЧОВІ ПРАВА
  // ═══════════════════════════════════════════════════
  { id: 'ua.drrp.rights', name: 'ДРРП — Державний реєстр речових прав', nameEn: 'State Registry of Property Rights', category: 'PROPERTY', owner: 'Мін\'юст / НАІС', url: 'https://kap.minjust.gov.ua', ckanResourceId: 'drrp_rights', isFree: true, isAutomatic: false, searchFields: ['edrpou', 'ipn', 'name'], provides: 'Право власності, іпотека, арешт' },
  { id: 'ua.drrp.encumbrances', name: 'ДРРП — Обтяження', nameEn: 'Property Encumbrances', category: 'PROPERTY', owner: 'Мін\'юст / НАІС', url: 'https://kap.minjust.gov.ua', ckanResourceId: 'drrp_encumbrances', isFree: true, isAutomatic: false, searchFields: ['edrpou', 'ipn'], provides: 'Арешт, іпотека, застава' },
  { id: 'ua.drrp.mortgage', name: 'Реєстр іпотек', nameEn: 'Mortgage Registry', category: 'PROPERTY', owner: 'Мін\'юст / НАІС', url: 'https://kap.minjust.gov.ua', ckanResourceId: 'drrp_mortgage', isFree: true, isAutomatic: false, searchFields: ['edrpou', 'ipn'], provides: 'Іпотечний запис' },
  { id: 'ua.drrp.pledges', name: 'Реєстр рухомого майна (застави)', nameEn: 'Movable Property Pledges', category: 'PROPERTY', owner: 'Мін\'юст / НАІС', url: 'https://kap.minjust.gov.ua', ckanResourceId: 'drrp_pledges', isFree: true, isAutomatic: false, searchFields: ['edrpou', 'ipn'], provides: 'Застава рухомого майна' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 6: ЗЕМЕЛЬНИЙ КАДАСТР
  // ═══════════════════════════════════════════════════
  { id: 'ua.land.cadastre', name: 'Державний земельний кадастр', nameEn: 'State Land Cadastre', category: 'LAND', owner: 'Держгеокадастр', url: 'https://e.land.gov.ua', ckanResourceId: 'land_cadastre', isFree: true, isAutomatic: false, searchFields: ['cadastral_number'], provides: 'Площа, цільове призначення, власник' },
  { id: 'ua.land.parcels', name: 'Публічна кадастрова карта', nameEn: 'Public Cadastral Map', category: 'LAND', owner: 'Держгеокадастр', url: 'https://map.land.gov.ua', directApiUrl: 'https://map.land.gov.ua/kadastrova-karta', isFree: true, isAutomatic: true, searchFields: ['cadastral_number'], provides: 'Координати, межі, площа ділянки' },
  { id: 'ua.land.auctions', name: 'Земельні аукціони', nameEn: 'Land Auctions', category: 'LAND', owner: 'Держгеокадастр', url: 'https://land.gov.ua', ckanResourceId: 'land_auctions', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Земельні аукціони та їх результати' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 7: САНКЦІЇ ТА КОМПЛАЄНС
  // ═══════════════════════════════════════════════════
  { id: 'ua.sanctions.rnbo', name: 'Санкції РНБО', nameEn: 'NSDC Sanctions', category: 'SANCTIONS', owner: 'РНБО', url: 'https://sanctions-t.rnbo.gov.ua', directApiUrl: 'https://sanctions-t.rnbo.gov.ua/api/search', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn', 'name'], provides: 'Указ, тип санкції, строк' },
  { id: 'ua.sanctions.nazk', name: 'Реєстр PEP (НАЗК)', nameEn: 'PEP Registry (NAPC)', category: 'SANCTIONS', owner: 'НАЗК', url: 'https://pep.org.ua', directApiUrl: 'https://pep.org.ua/api', isFree: true, isAutomatic: true, searchFields: ['ipn', 'name'], provides: 'PEP статус, посада, доходи' },
  { id: 'ua.sanctions.ofac', name: 'OFAC SDN List (США)', nameEn: 'OFAC SDN List', category: 'SANCTIONS', owner: 'OFAC (USA)', url: 'https://sanctionssearch.ofac.treas.gov', directApiUrl: 'https://sanctionssearch.ofac.treas.gov/api', isFree: true, isAutomatic: true, searchFields: ['name', 'edrpou'], provides: 'SDN статус, програма санкцій' },
  { id: 'ua.sanctions.eu', name: 'Санкції ЄС', nameEn: 'EU Sanctions', category: 'SANCTIONS', owner: 'EU Council', url: 'https://data.europa.eu', directApiUrl: 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Санкції ЄС' },
  { id: 'ua.sanctions.uk', name: 'Санкції Великобританії', nameEn: 'UK Sanctions', category: 'SANCTIONS', owner: 'HM Treasury', url: 'https://www.gov.uk', directApiUrl: 'https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Фінансові санкції UK' },
  { id: 'ua.sanctions.un', name: 'Санкції ООН', nameEn: 'UN Sanctions', category: 'SANCTIONS', owner: 'UN', url: 'https://www.un.org', directApiUrl: 'https://scsanctions.un.org/resources/xml/en/consolidated.xml', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Санкції Радбезу ООН' },
  { id: 'ua.sanctions.mass_address', name: 'Масові адреси реєстрації', nameEn: 'Mass Registration Addresses', category: 'SANCTIONS', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'mass_addresses_ukraine', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'address'], provides: 'Кількість компаній за адресою' },
  { id: 'ua.sanctions.mass_directors', name: 'Масові керівники', nameEn: 'Mass Directors', category: 'SANCTIONS', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'mass_directors', isFree: true, isAutomatic: true, searchFields: ['ipn', 'name'], provides: 'Кількість компаній під одним директором' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 8: ЛІЦЕНЗІЇ ТА ДОЗВОЛИ
  // ═══════════════════════════════════════════════════
  { id: 'ua.lic.general', name: 'Єдиний реєстр ліцензій', nameEn: 'Unified License Registry', category: 'LICENSE', owner: 'Мінекономіки', url: 'https://data.gov.ua', ckanResourceId: 'licenses_registry', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Номер, тип, дата видачі, статус' },
  { id: 'ua.lic.alcohol', name: 'Ліцензії на алкоголь і тютюн', nameEn: 'Alcohol & Tobacco Licenses', category: 'LICENSE', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'lic_alcohol_tobacco', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Акцизні ліцензії' },
  { id: 'ua.lic.fuel', name: 'Ліцензії на пальне', nameEn: 'Fuel Licenses', category: 'LICENSE', owner: 'ДПС', url: 'https://tax.gov.ua', ckanResourceId: 'lic_fuel', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Ліцензії на зберігання, виробництво пального' },
  { id: 'ua.lic.construction', name: 'Будівельні ліцензії (ДАБІ)', nameEn: 'Construction Licenses', category: 'LICENSE', owner: 'ДАБІ / ДІАМ', url: 'https://e-construction.gov.ua', ckanResourceId: 'lic_construction', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Будівельні дозволи, декларації' },
  { id: 'ua.lic.pharmacy', name: 'Ліцензії на медичну практику', nameEn: 'Medical Practice Licenses', category: 'LICENSE', owner: 'МОЗ', url: 'https://moz.gov.ua', ckanResourceId: 'lic_medical', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Медичні ліцензії' },
  { id: 'ua.lic.education', name: 'Ліцензії на освітню діяльність', nameEn: 'Education Licenses', category: 'LICENSE', owner: 'МОН', url: 'https://mon.gov.ua', ckanResourceId: 'lic_education', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Освітні ліцензії та акредитації' },
  { id: 'ua.lic.security', name: 'Ліцензії на охоронну діяльність', nameEn: 'Security Licenses', category: 'LICENSE', owner: 'МВС', url: 'https://mvs.gov.ua', ckanResourceId: 'lic_security', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Охоронні ліцензії' },
  { id: 'ua.lic.telecom', name: 'Ліцензії на телекомунікації', nameEn: 'Telecom Licenses', category: 'LICENSE', owner: 'НКРЗІ', url: 'https://nkrzi.gov.ua', ckanResourceId: 'lic_telecom', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Радіочастотні та телеком-ліцензії' },
  { id: 'ua.lic.financial', name: 'Ліцензії на фінансові послуги', nameEn: 'Financial Services Licenses', category: 'LICENSE', owner: 'НБУ / НКЦПФР', url: 'https://bank.gov.ua', ckanResourceId: 'lic_financial', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Банківські, страхові, фін. ліцензії' },
  { id: 'ua.lic.transport', name: 'Ліцензії на перевезення', nameEn: 'Transport Licenses', category: 'LICENSE', owner: 'Мінінфраструктури', url: 'https://mtu.gov.ua', ckanResourceId: 'lic_transport', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Пасажирські та вантажні перевезення' },
  { id: 'ua.lic.hazardous', name: 'Дозволи на небезпечні роботи', nameEn: 'Hazardous Work Permits', category: 'LICENSE', owner: 'Держпраці', url: 'https://dsp.gov.ua', ckanResourceId: 'lic_hazardous', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Дозволи на роботи підвищеної небезпеки' },
  { id: 'ua.lic.environment', name: 'Екологічні дозволи', nameEn: 'Environmental Permits', category: 'LICENSE', owner: 'Мінприроди', url: 'https://mepr.gov.ua', ckanResourceId: 'lic_environment', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Дозволи на викиди, скиди, відходи' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 9: ПУБЛІЧНІ ЗАКУПІВЛІ
  // ═══════════════════════════════════════════════════
  { id: 'ua.prozorro.tenders', name: 'ProZorro — Тендери', nameEn: 'ProZorro Tenders', category: 'PROCUREMENT', owner: 'Мінекономіки', url: 'https://prozorro.gov.ua', directApiUrl: 'https://public.api.openprocurement.org/api/2.5/tenders', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Тендери, суми, переможці' },
  { id: 'ua.prozorro.contracts', name: 'ProZorro — Контракти', nameEn: 'ProZorro Contracts', category: 'PROCUREMENT', owner: 'Мінекономіки', url: 'https://prozorro.gov.ua', directApiUrl: 'https://public.api.openprocurement.org/api/2.5/contracts', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Укладені контракти, суми' },
  { id: 'ua.prozorro.plans', name: 'ProZorro — Плани закупівель', nameEn: 'ProZorro Plans', category: 'PROCUREMENT', owner: 'Мінекономіки', url: 'https://prozorro.gov.ua', directApiUrl: 'https://public.api.openprocurement.org/api/2.5/plans', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Заплановані закупівлі' },
  { id: 'ua.prozorro.sale', name: 'ProZorro.Продажі — Аукціони', nameEn: 'ProZorro.Sale Auctions', category: 'PROCUREMENT', owner: 'ФДМУ', url: 'https://prozorro.sale', directApiUrl: 'https://public.api.ea.openprocurement.org/api/2.5/auctions', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Аукціони з продажу державного майна' },
  { id: 'ua.prozorro.complaints', name: 'ProZorro — Скарги АМКУ', nameEn: 'ProZorro AMCU Complaints', category: 'PROCUREMENT', owner: 'АМКУ', url: 'https://amcu.gov.ua', ckanResourceId: 'prozorro_complaints', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Скарги на тендери' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 10: ТРАНСПОРТ (МВС, МТСБУ)
  // ═══════════════════════════════════════════════════
  { id: 'ua.mvs.wanted_vehicles', name: 'МВС — Розшук ТЗ', nameEn: 'MIA Wanted Vehicles', category: 'TRANSPORT', owner: 'МВС', url: 'https://wanted.mvs.gov.ua', directApiUrl: 'https://data.gov.ua/api/3/action/datastore_search?resource_id=06779371-308f-42d7-895e-5a39833571f3', isFree: true, isAutomatic: true, searchFields: ['plate', 'vin'], provides: 'Авто в розшуку' },
  { id: 'ua.mvs.registration', name: 'МВС — Реєстрація ТЗ', nameEn: 'MIA Vehicle Registration', category: 'TRANSPORT', owner: 'МВС', url: 'https://data.gov.ua', ckanResourceId: 'mvs_registrations', isFree: true, isAutomatic: true, searchFields: ['plate', 'vin', 'edrpou'], provides: 'Реєстрація авто' },
  { id: 'ua.mtsbu.insurance', name: 'МТСБУ — Перевірка поліса', nameEn: 'MTIBU Insurance Check', category: 'TRANSPORT', owner: 'МТСБУ', url: 'https://policy-web.mtsbu.ua', directApiUrl: 'https://policy-web.mtsbu.ua/api/policy', isFree: true, isAutomatic: true, searchFields: ['plate'], provides: 'Наявність страхового поліса ОСЦПВ' },
  { id: 'ua.mvs.wanted_persons', name: 'МВС — Розшук осіб', nameEn: 'MIA Wanted Persons', category: 'TRANSPORT', owner: 'МВС', url: 'https://wanted.mvs.gov.ua', directApiUrl: 'https://data.gov.ua/api/3/action/datastore_search?resource_id=wanted_persons', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Особи в розшуку' },
  { id: 'ua.mvs.stolen_docs', name: 'МВС — Вкрадені/втрачені документи', nameEn: 'MIA Stolen Documents', category: 'TRANSPORT', owner: 'МВС', url: 'https://data.gov.ua', ckanResourceId: 'mvs_stolen_docs', isFree: true, isAutomatic: true, searchFields: ['doc_number'], provides: 'Недійсні паспорти, документи' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 11: БУДІВНИЦТВО ТА АРХІТЕКТУРА
  // ═══════════════════════════════════════════════════
  { id: 'ua.dabi.permits', name: 'ДАБІ — Будівельні дозволи', nameEn: 'DABI Construction Permits', category: 'CONSTRUCTION', owner: 'ДІАМ', url: 'https://e-construction.gov.ua', ckanResourceId: 'dabi_permits', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Будівельні дозволи' },
  { id: 'ua.dabi.declarations', name: 'ДАБІ — Декларації', nameEn: 'DABI Declarations', category: 'CONSTRUCTION', owner: 'ДІАМ', url: 'https://e-construction.gov.ua', ckanResourceId: 'dabi_declarations', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Декларації про готовність об\'єкта' },
  { id: 'ua.dabi.inspections', name: 'ДАБІ — Перевірки', nameEn: 'DABI Inspections', category: 'CONSTRUCTION', owner: 'ДІАМ', url: 'https://e-construction.gov.ua', ckanResourceId: 'dabi_inspections', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Планові та позапланові перевірки' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 12: ФІНАНСОВА СИСТЕМА (НБУ, НКЦПФР)
  // ═══════════════════════════════════════════════════
  { id: 'ua.nbu.banks', name: 'НБУ — Реєстр банків', nameEn: 'NBU Banks Registry', category: 'FINANCE', owner: 'НБУ', url: 'https://bank.gov.ua', directApiUrl: 'https://bank.gov.ua/NBU_BankInfo/get_data_bank_glav', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Банки, ліцензії, статус' },
  { id: 'ua.nbu.exchange', name: 'НБУ — Курси валют', nameEn: 'NBU Exchange Rates', category: 'FINANCE', owner: 'НБУ', url: 'https://bank.gov.ua', directApiUrl: 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange', isFree: true, isAutomatic: true, searchFields: [], provides: 'Довідково: курси валют' },
  { id: 'ua.nkcpfr.issuers', name: 'НКЦПФР — Емітенти ЦП', nameEn: 'NSSMC Securities Issuers', category: 'FINANCE', owner: 'НКЦПФР', url: 'https://nssmc.gov.ua', ckanResourceId: 'nkcpfr_issuers', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Цінні папери, емісії, акціонери' },
  { id: 'ua.nkcpfr.funds', name: 'НКЦПФР — Інвестиційні фонди', nameEn: 'NSSMC Investment Funds', category: 'FINANCE', owner: 'НКЦПФР', url: 'https://nssmc.gov.ua', ckanResourceId: 'nkcpfr_funds', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'КУА, пайові та корпоративні фонди' },
  { id: 'ua.insurance.register', name: 'Реєстр страховиків', nameEn: 'Insurers Registry', category: 'FINANCE', owner: 'НБУ', url: 'https://bank.gov.ua', ckanResourceId: 'insurance_register', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Страхові компанії та ліцензії' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 13: ІНТЕЛЕКТУАЛЬНА ВЛАСНІСТЬ
  // ═══════════════════════════════════════════════════
  { id: 'ua.ip.trademarks', name: 'Реєстр торговельних марок', nameEn: 'Trademarks Registry', category: 'IP', owner: 'НОІВ (Укрпатент)', url: 'https://base.uipv.org', ckanResourceId: 'ip_trademarks', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Торговельні марки, знаки для послуг' },
  { id: 'ua.ip.patents', name: 'Реєстр патентів', nameEn: 'Patents Registry', category: 'IP', owner: 'НОІВ (Укрпатент)', url: 'https://base.uipv.org', ckanResourceId: 'ip_patents', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Патенти на винаходи, корисні моделі' },
  { id: 'ua.ip.industrial', name: 'Реєстр промислових зразків', nameEn: 'Industrial Designs Registry', category: 'IP', owner: 'НОІВ (Укрпатент)', url: 'https://base.uipv.org', ckanResourceId: 'ip_industrial', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Промислові зразки' },
  { id: 'ua.ip.copyright', name: 'Реєстр авторських прав', nameEn: 'Copyright Registry', category: 'IP', owner: 'НОІВ', url: 'https://base.uipv.org', ckanResourceId: 'ip_copyright', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Авторське право' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 14: ДОМЕННІ ІМЕНА
  // ═══════════════════════════════════════════════════
  { id: 'ua.domains.ua', name: 'Реєстр доменів .UA', nameEn: 'UA Domain Registry', category: 'DOMAINS', owner: 'Хостмайстер', url: 'https://hostmaster.ua', directApiUrl: 'https://whois.ua', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name', 'domain'], provides: 'Доменні імена .ua' },
  { id: 'ua.domains.whois', name: 'WHOIS Lookup', nameEn: 'WHOIS Lookup', category: 'DOMAINS', owner: 'ICANN', url: 'https://whois.icann.org', directApiUrl: 'https://rdap.org/domain/', isFree: true, isAutomatic: true, searchFields: ['domain'], provides: 'Реєстрант, дата реєстрації, NS' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 15: АНТИМОНОПОЛЬНИЙ КОМІТЕТ (АМКУ)
  // ═══════════════════════════════════════════════════
  { id: 'ua.amcu.concentrations', name: 'АМКУ — Концентрації', nameEn: 'AMCU Concentrations', category: 'AMCU', owner: 'АМКУ', url: 'https://amcu.gov.ua', ckanResourceId: 'amcu_concentrations', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Дозволи на концентрацію' },
  { id: 'ua.amcu.violations', name: 'АМКУ — Порушення', nameEn: 'AMCU Violations', category: 'AMCU', owner: 'АМКУ', url: 'https://amcu.gov.ua', ckanResourceId: 'amcu_violations', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Порушення антимонопольного законодавства' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 16: ДЕРЖАВНА СЛУЖБА СТАТИСТИКИ
  // ═══════════════════════════════════════════════════
  { id: 'ua.stat.balance', name: 'Фінансова звітність (баланс)', nameEn: 'Financial Statements', category: 'STATISTICS', owner: 'Держстат / Smida', url: 'https://smida.gov.ua', ckanResourceId: 'stat_balance', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Баланс, звіт про фін. результати' },
  { id: 'ua.stat.kved', name: 'Класифікатор КВЕД', nameEn: 'KVED Classifier', category: 'STATISTICS', owner: 'Держстат', url: 'https://data.gov.ua', ckanResourceId: 'stat_kved', isFree: true, isAutomatic: true, searchFields: ['kved_code'], provides: 'Опис виду діяльності за КВЕД' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 17: РЕЄСТРИ МОЗ (МЕДИЦИНА)
  // ═══════════════════════════════════════════════════
  { id: 'ua.moz.medicines', name: 'Реєстр лікарських засобів', nameEn: 'Medicines Registry', category: 'HEALTH', owner: 'МОЗ', url: 'https://dls.gov.ua', ckanResourceId: 'moz_medicines', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Зареєстровані ліки' },
  { id: 'ua.moz.medical_devices', name: 'Реєстр медичних виробів', nameEn: 'Medical Devices Registry', category: 'HEALTH', owner: 'МОЗ', url: 'https://dls.gov.ua', ckanResourceId: 'moz_devices', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Медичні вироби' },
  { id: 'ua.moz.ehealthlicenses', name: 'eHealth — Ліцензії', nameEn: 'eHealth Licenses', category: 'HEALTH', owner: 'НСЗУ', url: 'https://nszu.gov.ua', ckanResourceId: 'ehealth_lic', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'eHealth ліцензії медзакладів' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 18: ПРИРОДНІ РЕСУРСИ ТА ЕКОЛОГІЯ
  // ═══════════════════════════════════════════════════
  { id: 'ua.eco.permits', name: 'Дозволи на спеціальне водокористування', nameEn: 'Water Use Permits', category: 'ECOLOGY', owner: 'Мінприроди', url: 'https://mepr.gov.ua', ckanResourceId: 'eco_water', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Дозволи на водокористування' },
  { id: 'ua.eco.waste', name: 'Реєстр об\'єктів утворення відходів', nameEn: 'Waste Objects Registry', category: 'ECOLOGY', owner: 'Мінприроди', url: 'https://mepr.gov.ua', ckanResourceId: 'eco_waste', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Утворення та поводження з відходами' },
  { id: 'ua.eco.eia', name: 'Реєстр ОВД (Оцінка впливу на довкілля)', nameEn: 'EIA Registry', category: 'ECOLOGY', owner: 'Мінприроди', url: 'https://eia.menr.gov.ua', ckanResourceId: 'eco_eia', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Оцінка впливу на довкілля' },
  { id: 'ua.eco.emissions', name: 'Дозволи на викиди', nameEn: 'Emissions Permits', category: 'ECOLOGY', owner: 'Мінприроди', url: 'https://mepr.gov.ua', ckanResourceId: 'eco_emissions', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Дозволи на викиди забруднюючих речовин' },
  { id: 'ua.eco.subsoil', name: 'Спеціальні дозволи на надра', nameEn: 'Subsoil Use Permits', category: 'ECOLOGY', owner: 'Мінприроди', url: 'https://mepr.gov.ua', ckanResourceId: 'eco_subsoil', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Видобуток корисних копалин' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 19: ОСВІТА ТА НАУКА
  // ═══════════════════════════════════════════════════
  { id: 'ua.edu.universities', name: 'Реєстр ЗВО', nameEn: 'Universities Registry', category: 'EDUCATION', owner: 'МОН', url: 'https://mon.gov.ua', ckanResourceId: 'edu_universities', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Заклади вищої освіти, акредитації' },
  { id: 'ua.edu.naqa', name: 'Акредитації НАЗЯВО', nameEn: 'NAQA Accreditations', category: 'EDUCATION', owner: 'НАЗЯВО', url: 'https://naqa.gov.ua', ckanResourceId: 'edu_naqa', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Акредитація освітніх програм' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 20: МИТНИЦЯ ТА ЗЕД
  // ═══════════════════════════════════════════════════
  { id: 'ua.customs.register', name: 'Реєстр митних брокерів', nameEn: 'Customs Brokers', category: 'CUSTOMS', owner: 'ДМСУ', url: 'https://customs.gov.ua', ckanResourceId: 'customs_brokers', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Митні брокери та перевізники' },
  { id: 'ua.customs.violations', name: 'Порушення митних правил', nameEn: 'Customs Violations', category: 'CUSTOMS', owner: 'ДМСУ', url: 'https://customs.gov.ua', ckanResourceId: 'customs_violations', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Порушення митного законодавства' },
  { id: 'ua.customs.aeo', name: 'Реєстр AEO (Авторизований оператор)', nameEn: 'AEO Registry', category: 'CUSTOMS', owner: 'ДМСУ', url: 'https://customs.gov.ua', ckanResourceId: 'customs_aeo', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Статус авторизованого економічного оператора' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 21: ДЕРЖАВНІ ПІДПРИЄМСТВА ТА ФДМУ
  // ═══════════════════════════════════════════════════
  { id: 'ua.fdmu.objects', name: 'ФДМУ — Об\'єкти приватизації', nameEn: 'SPFU Privatization Objects', category: 'STATE_PROPERTY', owner: 'ФДМУ', url: 'https://privatization.gov.ua', ckanResourceId: 'fdmu_objects', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Об\'єкти приватизації' },
  { id: 'ua.fdmu.state_property', name: 'Реєстр державного майна', nameEn: 'State Property Registry', category: 'STATE_PROPERTY', owner: 'ФДМУ', url: 'https://privatization.gov.ua', ckanResourceId: 'fdmu_state_property', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Державне майно' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 22: БЛАГОДІЙНІСТЬ ТА ГРОМАДСЬКІ ОРГАНІЗАЦІЇ
  // ═══════════════════════════════════════════════════
  { id: 'ua.ngo.register', name: 'Реєстр громадських об\'єднань', nameEn: 'NGO Registry', category: 'NGO', owner: 'Мін\'юст', url: 'https://data.gov.ua', ckanResourceId: 'ngo_register', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Громадські організації та партії' },
  { id: 'ua.ngo.charity', name: 'Реєстр благодійних організацій', nameEn: 'Charity Registry', category: 'NGO', owner: 'Мін\'юст', url: 'https://data.gov.ua', ckanResourceId: 'ngo_charity', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Благодійні фонди та організації' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 23: ДЕРЖПРАЦІ ТА СОЦІАЛЬНЕ ЗАБЕЗПЕЧЕННЯ
  // ═══════════════════════════════════════════════════
  { id: 'ua.labor.inspections', name: 'Держпраці — Перевірки', nameEn: 'Labor Inspections', category: 'LABOR', owner: 'Держпраці', url: 'https://dsp.gov.ua', ckanResourceId: 'labor_inspections', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Перевірки дотримання трудового законодавства' },
  { id: 'ua.labor.violations', name: 'Держпраці — Порушення', nameEn: 'Labor Violations', category: 'LABOR', owner: 'Держпраці', url: 'https://dsp.gov.ua', ckanResourceId: 'labor_violations', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Порушення трудового законодавства' },
  { id: 'ua.labor.debts', name: 'Борги по зарплаті', nameEn: 'Salary Debts', category: 'LABOR', owner: 'Держпраці', url: 'https://dsp.gov.ua', ckanResourceId: 'labor_debts', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Заборгованість по заробітній платі' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 24: DPSS / ДЕРЖСПЕЦЗВ'ЯЗОК / КІБЕРБЕЗПЕКА
  // ═══════════════════════════════════════════════════
  { id: 'ua.cyber.kszi', name: 'ДССЗЗІ — Засоби КЗІ', nameEn: 'SSSCIP KZI Means', category: 'CYBER', owner: 'ДССЗЗІ', url: 'https://cip.gov.ua', ckanResourceId: 'cyber_kszi', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Засоби криптографічного захисту' },
  { id: 'ua.cyber.kszi_licenses', name: 'Ліцензії КЗІ', nameEn: 'KZI Licenses', category: 'CYBER', owner: 'ДССЗЗІ', url: 'https://cip.gov.ua', ckanResourceId: 'cyber_kszi_lic', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Ліцензії на КЗІ' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 25: НОТАРІАТ ТА РЕЄСТРАЦІЯ АКТІВ
  // ═══════════════════════════════════════════════════
  { id: 'ua.notary.register', name: 'Реєстр нотаріусів', nameEn: 'Notaries Registry', category: 'NOTARY', owner: 'Мін\'юст', url: 'https://data.gov.ua', ckanResourceId: 'notary_register', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Нотаріуси, адреси, сертифікати' },
  { id: 'ua.notary.powers', name: 'Реєстр довіреностей', nameEn: 'Powers of Attorney', category: 'NOTARY', owner: 'Мін\'юст', url: 'https://rndo.nais.gov.ua', ckanResourceId: 'notary_powers', isFree: true, isAutomatic: false, searchFields: ['name', 'ipn'], provides: 'Довіреності, відкликання' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 26: АДВОКАТИ ТА ЮРИСТИ
  // ═══════════════════════════════════════════════════
  { id: 'ua.lawyers.register', name: 'ЄРАУ — Реєстр адвокатів', nameEn: 'Lawyers Registry', category: 'LEGAL', owner: 'НААУ', url: 'https://erau.unba.org.ua', ckanResourceId: 'lawyers_register', isFree: true, isAutomatic: true, searchFields: ['name', 'ipn'], provides: 'ПІБ, статус, свідоцтво' },
  { id: 'ua.lawyers.disciplinary', name: 'Дисциплінарні провадження адвокатів', nameEn: 'Disciplinary Actions', category: 'LEGAL', owner: 'НААУ', url: 'https://erau.unba.org.ua', ckanResourceId: 'lawyers_disciplinary', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Дисциплінарні стягнення' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 27: ДЕКЛАРАЦІЇ ДОХОДІВ (НАЗК)
  // ═══════════════════════════════════════════════════
  { id: 'ua.nazk.declarations', name: 'Е-декларації (НАЗК)', nameEn: 'E-Declarations (NAPC)', category: 'DECLARATIONS', owner: 'НАЗК', url: 'https://public.nazk.gov.ua', directApiUrl: 'https://public.nazk.gov.ua/api/v1/declaration', isFree: true, isAutomatic: true, searchFields: ['name', 'ipn'], provides: 'Доходи, майно, рахунки, родичі' },
  { id: 'ua.nazk.conflicts', name: 'НАЗК — Конфлікт інтересів', nameEn: 'NAPC Conflicts of Interest', category: 'DECLARATIONS', owner: 'НАЗК', url: 'https://nazk.gov.ua', ckanResourceId: 'nazk_conflicts', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Потенційні конфлікти інтересів' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 28: СІЛЬСЬКЕ ГОСПОДАРСТВО
  // ═══════════════════════════════════════════════════
  { id: 'ua.agro.register', name: 'Реєстр аграрних розписок', nameEn: 'Agricultural Receipts', category: 'AGRICULTURE', owner: 'Мін\'юст', url: 'https://data.gov.ua', ckanResourceId: 'agro_receipts', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Аграрні розписки' },
  { id: 'ua.agro.subsidies', name: 'Реєстр отримувачів дотацій', nameEn: 'Agricultural Subsidies', category: 'AGRICULTURE', owner: 'Мінагрополітики', url: 'https://data.gov.ua', ckanResourceId: 'agro_subsidies', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Бюджетні дотації, субсидії' },
  { id: 'ua.agro.dpss', name: 'Держпродспоживслужба — Оператори ринку', nameEn: 'Food Market Operators', category: 'AGRICULTURE', owner: 'ДПСС', url: 'https://dpss.gov.ua', ckanResourceId: 'agro_operators', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Оператори ринку, HACCP' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 29: РЕЄСТРИ БОРЖНИКІВ ТА КРЕДИТНІ
  // ═══════════════════════════════════════════════════
  { id: 'ua.credit.bki', name: 'БКІ — Кредитна історія (загальний)', nameEn: 'Credit Bureau General', category: 'CREDIT', owner: 'УБКІ', url: 'https://ubki.ua', ckanResourceId: 'credit_bki', isFree: false, isAutomatic: false, searchFields: ['ipn'], provides: 'Кредитна історія (платна)' },
  { id: 'ua.credit.nbki', name: 'Національне БКІ', nameEn: 'National Credit Bureau', category: 'CREDIT', owner: 'НБКІ', url: 'https://nbki.com.ua', ckanResourceId: 'credit_nbki', isFree: false, isAutomatic: false, searchFields: ['ipn'], provides: 'Кредитна історія (платна)' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 30: ДОЗВІЛЬНА СИСТЕМА (ДІІЯ, ДІЯ)
  // ═══════════════════════════════════════════════════
  { id: 'ua.diya.permits', name: 'Дія — Реєстр дозвільних документів', nameEn: 'Diia Permits', category: 'DIIA', owner: 'Мінцифри', url: 'https://diia.gov.ua', ckanResourceId: 'diya_permits', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Дозвільні документи через Дію' },
  { id: 'ua.diya.city', name: 'Дія.City — Резиденти', nameEn: 'Diia.City Residents', category: 'DIIA', owner: 'Мінцифри', url: 'https://city.diia.gov.ua', ckanResourceId: 'diya_city', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Резиденти Дія.City' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 31: ЕНЕРГЕТИКА ТА НКРЕКП
  // ═══════════════════════════════════════════════════
  { id: 'ua.energy.licenses', name: 'НКРЕКП — Ліцензії', nameEn: 'NEURC Licenses', category: 'ENERGY', owner: 'НКРЕКП', url: 'https://nerc.gov.ua', ckanResourceId: 'energy_licenses', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Ліцензії на електро-, газо-, теплопостачання' },
  { id: 'ua.energy.green_tariff', name: 'Реєстр зелених тарифів', nameEn: 'Green Tariff Registry', category: 'ENERGY', owner: 'НКРЕКП', url: 'https://nerc.gov.ua', ckanResourceId: 'energy_green', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Об\'єкти зеленої енергетики' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 32: РЕЄСТРИ ПЕРЕВІРОК (ДЕРЖНАГЛЯД)
  // ═══════════════════════════════════════════════════
  { id: 'ua.inspections.annual', name: 'Річний план перевірок', nameEn: 'Annual Inspections Plan', category: 'INSPECTIONS', owner: 'ДРС', url: 'https://inspections.gov.ua', directApiUrl: 'https://inspections.gov.ua/api', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Заплановані перевірки контролюючих органів' },
  { id: 'ua.inspections.results', name: 'Результати перевірок', nameEn: 'Inspection Results', category: 'INSPECTIONS', owner: 'ДРС', url: 'https://inspections.gov.ua', ckanResourceId: 'inspections_results', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Результати та рішення за перевірками' },
  { id: 'ua.inspections.sanctions', name: 'Санкції за результатами перевірок', nameEn: 'Inspection Sanctions', category: 'INSPECTIONS', owner: 'ДРС', url: 'https://inspections.gov.ua', ckanResourceId: 'inspections_sanctions', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Штрафи та стягнення' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 33: OSINT / DARKNET / BREACHES
  // ═══════════════════════════════════════════════════
  { id: 'int.osint.hibp', name: 'HaveIBeenPwned (Витоки паролів)', nameEn: 'HaveIBeenPwned', category: 'OSINT', owner: 'Troy Hunt', url: 'https://haveibeenpwned.com', directApiUrl: 'https://haveibeenpwned.com/api/v3/breachedaccount/', isFree: false, isAutomatic: false, searchFields: ['email'], provides: 'Витоки email-адрес' },
  { id: 'int.osint.social', name: 'Пошук за соцмережами', nameEn: 'Social Media Search', category: 'OSINT', owner: 'Various', url: 'https://search.social', ckanResourceId: 'osint_social', isFree: true, isAutomatic: false, searchFields: ['name', 'phone', 'email'], provides: 'Профілі в соцмережах' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 34: МІЖНАРОДНІ БАЗИ ДАНИХ
  // ═══════════════════════════════════════════════════
  { id: 'int.interpol.notices', name: 'Інтерпол — Червоні картки', nameEn: 'Interpol Red Notices', category: 'INTERNATIONAL', owner: 'Interpol', url: 'https://www.interpol.int', directApiUrl: 'https://ws-public.interpol.int/notices/v1/red', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Міжнародний розшук' },
  { id: 'int.opencorporates', name: 'OpenCorporates (Міжнародний ЄДР)', nameEn: 'OpenCorporates', category: 'INTERNATIONAL', owner: 'OpenCorporates', url: 'https://opencorporates.com', directApiUrl: 'https://api.opencorporates.com/v0.4/companies/search', isFree: true, isAutomatic: true, searchFields: ['name', 'edrpou'], provides: 'Компанії з 140+ країн' },
  { id: 'int.worldbank.debarred', name: 'World Bank — Debarred Firms', nameEn: 'World Bank Debarred', category: 'INTERNATIONAL', owner: 'World Bank', url: 'https://www.worldbank.org', directApiUrl: 'https://finances.worldbank.org/resource/kvp9-iu2s.json', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Заборонені фірми (World Bank)' },
  { id: 'int.pep.opensanctions', name: 'OpenSanctions (Глобальний PEP)', nameEn: 'OpenSanctions', category: 'INTERNATIONAL', owner: 'OpenSanctions', url: 'https://opensanctions.org', directApiUrl: 'https://api.opensanctions.org/search/', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'PEP та санкції з 100+ баз' },
  { id: 'int.pep.every_politician', name: 'EveryPolitician', nameEn: 'EveryPolitician', category: 'INTERNATIONAL', owner: 'mySociety', url: 'https://everypolitician.org', ckanResourceId: 'every_politician', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Політики всього світу' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 35: РЕЄСТРИ НКРЗІ (ЗВ'ЯЗОК)
  // ═══════════════════════════════════════════════════
  { id: 'ua.nkrzi.operators', name: 'НКРЗІ — Оператори зв\'язку', nameEn: 'NKRZI Operators', category: 'TELECOM', owner: 'НКРЗІ', url: 'https://nkrzi.gov.ua', ckanResourceId: 'nkrzi_operators', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Телеком-оператори та провайдери' },
  { id: 'ua.nkrzi.radio', name: 'НКРЗІ — Радіочастоти', nameEn: 'Radio Frequencies', category: 'TELECOM', owner: 'НКРЗІ', url: 'https://nkrzi.gov.ua', ckanResourceId: 'nkrzi_radio', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Присвоєння радіочастот' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 36: РЕЄСТРИ ПЕРЕВІЗНИКІВ
  // ═══════════════════════════════════════════════════
  { id: 'ua.transport.carriers', name: 'Реєстр перевізників', nameEn: 'Carriers Registry', category: 'TRANSPORT_REG', owner: 'Мінінфраструктури', url: 'https://mtu.gov.ua', ckanResourceId: 'transport_carriers', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Автоперевізники, маршрути' },
  { id: 'ua.transport.rail', name: 'Укрзалізниця — Реєстр вагонів', nameEn: 'Railway Wagons', category: 'TRANSPORT_REG', owner: 'УЗ', url: 'https://uz.gov.ua', ckanResourceId: 'transport_rail', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Реєстр рухомого складу' },
  { id: 'ua.transport.aviation', name: 'Реєстр повітряних суден', nameEn: 'Aircraft Registry', category: 'TRANSPORT_REG', owner: 'ДАСУ', url: 'https://avia.gov.ua', ckanResourceId: 'transport_aviation', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Зареєстровані повітряні судна' },
  { id: 'ua.transport.maritime', name: 'Реєстр суден (морських)', nameEn: 'Maritime Registry', category: 'TRANSPORT_REG', owner: 'МТСУ', url: 'https://sea.gov.ua', ckanResourceId: 'transport_maritime', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Морські та річкові судна' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 37: ЦЕНТР НАДАННЯ ПОСЛУГ МВС
  // ═══════════════════════════════════════════════════
  { id: 'ua.cnap.services', name: 'ЦНАП — Надані послуги', nameEn: 'CNAP Services', category: 'CNAP', owner: 'Мін\'юст', url: 'https://my.gov.ua', ckanResourceId: 'cnap_services', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Адміністративні послуги через ЦНАП' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 38: ЗОНИ АТО / ООС / ВП
  // ═══════════════════════════════════════════════════
  { id: 'ua.ato.territory', name: 'Перелік ОТГ зони АТО/ООС', nameEn: 'ATO Zone Territories', category: 'CONFLICT', owner: 'КМУ', url: 'https://data.gov.ua', ckanResourceId: 'ato_territory', isFree: true, isAutomatic: true, searchFields: ['address'], provides: 'Території зони ООС/АТО' },
  { id: 'ua.ato.damaged', name: 'Пошкоджене/зруйноване майно', nameEn: 'Damaged Property', category: 'CONFLICT', owner: 'КМУ', url: 'https://data.gov.ua', ckanResourceId: 'ato_damaged', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'address'], provides: 'Пошкоджене внаслідок агресії майно' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 39: РЕЄСТРИ СПЕЦІАЛЬНИХ ПЕРЕВІРОК
  // ═══════════════════════════════════════════════════
  { id: 'ua.lustration.register', name: 'Реєстр осіб, які підпадають під люстрацію', nameEn: 'Lustration Registry', category: 'LUSTRATION', owner: 'Мін\'юст', url: 'https://lustration.minjust.gov.ua', ckanResourceId: 'lustration_register', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Особи під люстрацією' },
  { id: 'ua.corruption.register', name: 'Реєстр корупціонерів (НАЗК)', nameEn: 'Corruption Registry', category: 'LUSTRATION', owner: 'НАЗК', url: 'https://corruptinfo.nazk.gov.ua', ckanResourceId: 'corruption_register', isFree: true, isAutomatic: true, searchFields: ['name', 'ipn'], provides: 'Засуджені за корупцію' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 40: РЕЄСТРИ САМОРЕГУЛЮЮЧИХ ОРГАНІЗАЦІЙ
  // ═══════════════════════════════════════════════════
  { id: 'ua.sro.auditors', name: 'Реєстр аудиторів', nameEn: 'Auditors Registry', category: 'SRO', owner: 'АПОУ', url: 'https://apob.org.ua', ckanResourceId: 'sro_auditors', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'name'], provides: 'Аудитори та аудиторські фірми' },
  { id: 'ua.sro.appraisers', name: 'Реєстр оцінювачів', nameEn: 'Appraisers Registry', category: 'SRO', owner: 'ФДМУ', url: 'https://privatization.gov.ua', ckanResourceId: 'sro_appraisers', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Оцінювачі та СОД' },
  { id: 'ua.sro.arbitration', name: 'Реєстр арбітражних керуючих', nameEn: 'Arbitration Managers', category: 'SRO', owner: 'Мін\'юст', url: 'https://minjust.gov.ua', ckanResourceId: 'sro_arbitration', isFree: true, isAutomatic: true, searchFields: ['name'], provides: 'Арбітражні керуючі (банкрутство)' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 41: РЕЄСТРИ ДОКУМЕНТІВ (ПАСПОРТИ, ID)
  // ═══════════════════════════════════════════════════
  { id: 'ua.docs.invalid_passports', name: 'Недійсні паспорти', nameEn: 'Invalid Passports', category: 'DOCUMENTS', owner: 'ДМС', url: 'https://dmsu.gov.ua', ckanResourceId: 'docs_invalid_passports', isFree: true, isAutomatic: true, searchFields: ['doc_number'], provides: 'Недійсні паспорти громадян' },
  { id: 'ua.docs.id_cards', name: 'Реєстр ID-карток', nameEn: 'ID Cards Registry', category: 'DOCUMENTS', owner: 'ДМС', url: 'https://dmsu.gov.ua', ckanResourceId: 'docs_id_cards', isFree: true, isAutomatic: false, searchFields: ['doc_number'], provides: 'Перевірка ID-картки' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 42: БЮДЖЕТ ТА КАЗНАЧЕЙСТВО
  // ═══════════════════════════════════════════════════
  { id: 'ua.budget.spending', name: 'Е-Дата — Публічні витрати', nameEn: 'E-Data Public Spending', category: 'BUDGET', owner: 'Казначейство', url: 'https://spending.gov.ua', directApiUrl: 'https://api.spending.gov.ua/api/v2/api/transactions/', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Платежі з бюджету, суми, призначення' },
  { id: 'ua.budget.local', name: 'Місцеві бюджети', nameEn: 'Local Budgets', category: 'BUDGET', owner: 'Казначейство', url: 'https://openbudget.gov.ua', ckanResourceId: 'budget_local', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Дані місцевих бюджетів' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 43: ТЕЛЕФОННІ БАЗИ
  // ═══════════════════════════════════════════════════
  { id: 'ua.phone.mnp', name: 'MNP — Перенесені номери', nameEn: 'Mobile Number Portability', category: 'PHONE', owner: 'НКРЗІ', url: 'https://www.mnp.com.ua', directApiUrl: 'https://mnp.nkrzi.gov.ua/api', isFree: true, isAutomatic: true, searchFields: ['phone'], provides: 'Оператор абонента (MNP)' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 44: РЕЄСТРИ RELP (ДОЗВІЛЬНА СИСТЕМА)
  // ═══════════════════════════════════════════════════
  { id: 'ua.relp.permits', name: 'Реєстр документів дозвільного характеру', nameEn: 'RELP Permits', category: 'RELP', owner: 'ДРС', url: 'https://drs.gov.ua', ckanResourceId: 'relp_permits', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Усі видані дозвільні документи' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 45: РЕЄСТРИ DPSS / ХАРЧОВА БЕЗПЕКА
  // ═══════════════════════════════════════════════════
  { id: 'ua.food.register', name: 'Реєстр потужностей HACCP', nameEn: 'HACCP Facilities', category: 'FOOD', owner: 'ДПСС', url: 'https://dpss.gov.ua', ckanResourceId: 'food_haccp', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Зареєстровані об\'єкти з HACCP' },
  { id: 'ua.food.violations', name: 'Порушення безпечності харчових продуктів', nameEn: 'Food Safety Violations', category: 'FOOD', owner: 'ДПСС', url: 'https://dpss.gov.ua', ckanResourceId: 'food_violations', isFree: true, isAutomatic: true, searchFields: ['edrpou'], provides: 'Порушення стандартів якості та безпеки' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 46: Є-ВИКОНАННЯ
  // ═══════════════════════════════════════════════════
  { id: 'ua.evyk.register', name: 'Є-виконання — Реєстр рішень', nameEn: 'E-Execution Register', category: 'EXECUTION', owner: 'Мін\'юст', url: 'https://evyk.minjust.gov.ua', ckanResourceId: 'evyk_register', isFree: true, isAutomatic: true, searchFields: ['edrpou', 'ipn'], provides: 'Виконавчі документи' },

  // ═══════════════════════════════════════════════════
  // CATEGORY 47: РЕЄСТР СУБСИДІЙ ТА ДОПОМОГ
  // ═══════════════════════════════════════════════════
  { id: 'ua.social.idps', name: 'Реєстр ВПО', nameEn: 'IDPs Registry', category: 'SOCIAL', owner: 'Мінреінтеграції', url: 'https://data.gov.ua', ckanResourceId: 'social_idps', isFree: true, isAutomatic: true, searchFields: ['ipn'], provides: 'Внутрішньо переміщені особи' },
  { id: 'ua.social.veterans', name: 'Реєстр ветеранів', nameEn: 'Veterans Registry', category: 'SOCIAL', owner: 'Мінветеранів', url: 'https://data.gov.ua', ckanResourceId: 'social_veterans', isFree: true, isAutomatic: false, searchFields: ['ipn'], provides: 'Статус ветерана, пільги' },
];

// =====================================================
// UTILITY: Get category counts
// =====================================================
export function getRegistryStats() {
  const total = FULL_REGISTRY_CATALOG.length;
  const free = FULL_REGISTRY_CATALOG.filter(r => r.isFree).length;
  const automatic = FULL_REGISTRY_CATALOG.filter(r => r.isAutomatic).length;
  const categories = [...new Set(FULL_REGISTRY_CATALOG.map(r => r.category))];
  
  return { total, free, automatic, categories: categories.length, categoryList: categories };
}

// =====================================================
// UNIVERSAL CKAN FETCHER
// =====================================================
export async function fetchCkanResource<T = any>(
  entry: RegistryEntry,
  searchCode: string
): Promise<DataSourceResult<T>> {
  if (!entry.ckanResourceId) {
    return {
      ok: false,
      error: {
        code: 'BAD_REQUEST',
        message: `Реєстр ${entry.name} не має CKAN resource_id.`,
        attemptedAt: new Date().toISOString(),
      },
    };
  }

  const sourceKey = `${entry.id}-${searchCode}`;
  const sourceUrl = `https://data.gov.ua/api/3/action/datastore_search?resource_id=${entry.ckanResourceId}&q=${encodeURIComponent(searchCode)}`;

  return dataSourceGovernor.fetchWithGovernance<T>(
    sourceKey,
    entry.name,
    sourceUrl,
    24 * 60 * 60 * 1000, // 24h cache
    async () => {
      const res = await fetch(sourceUrl, {
        headers: { 'User-Agent': 'PREDATOR-Analytics/1.0' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw { code: 'UPSTREAM_FAILURE', message: `HTTP ${res.status} від ${entry.name}` };
      }

      const data = await res.json();
      if (data.success && data.result?.records?.length > 0) {
        return data.result.records as T;
      }

      throw { code: 'NO_RECORDS', message: `Записів для ${searchCode} у ${entry.name} не знайдено.` };
    }
  );
}

// =====================================================
// BATCH ORCHESTRATOR — Query multiple registries in parallel
// with concurrency control and priority tiers
// =====================================================
export interface RegistryQueryResult {
  registryId: string;
  registryName: string;
  category: string;
  status: 'OK' | 'NO_DATA' | 'ERROR' | 'SKIPPED' | 'TIMEOUT';
  data?: any;
  error?: string;
  queriedAt: string;
  durationMs: number;
}

export async function queryAllRegistries(
  code: string,
  searchField: 'edrpou' | 'ipn' | 'name' | 'plate' = 'edrpou',
  options: { concurrency?: number; timeoutMs?: number; categoriesFilter?: string[] } = {}
): Promise<RegistryQueryResult[]> {
  const { concurrency = 10, timeoutMs = 15000, categoriesFilter } = options;
  
  // Filter registries that support the given search field
  let registries = FULL_REGISTRY_CATALOG.filter(r => 
    r.isFree && r.isAutomatic && r.searchFields.includes(searchField)
  );
  
  if (categoriesFilter && categoriesFilter.length > 0) {
    registries = registries.filter(r => categoriesFilter.includes(r.category));
  }

  console.log(`[PREDATOR] Querying ${registries.length} registries for ${searchField}=${code.substring(0, 4)}***`);
  
  const results: RegistryQueryResult[] = [];
  
  // Process in batches to respect concurrency limits
  for (let i = 0; i < registries.length; i += concurrency) {
    const batch = registries.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (registry) => {
        const startTime = Date.now();
        try {
          const result = await fetchCkanResource(registry, code);
          const duration = Date.now() - startTime;
          
          if (result.ok) {
            return {
              registryId: registry.id,
              registryName: registry.name,
              category: registry.category,
              status: 'OK' as const,
              data: result.data,
              queriedAt: new Date().toISOString(),
              durationMs: duration,
            };
          } else if (result.ok === false) {
            const error = result.error;
            return {
              registryId: registry.id,
              registryName: registry.name,
              category: registry.category,
              status: 'NO_DATA' as const,
              error: error.message,
              queriedAt: new Date().toISOString(),
              durationMs: duration,
            };
          }

          throw new Error('Unexpected data source response');
        } catch (err: any) {
          return {
            registryId: registry.id,
            registryName: registry.name,
            category: registry.category,
            status: 'ERROR' as const,
            error: err?.message || String(err),
            queriedAt: new Date().toISOString(),
            durationMs: Date.now() - startTime,
          };
        }
      })
    );

    batchResults.forEach(r => {
      if (r.status === 'fulfilled') {
        results.push(r.value);
      } else {
        results.push({
          registryId: 'unknown',
          registryName: 'Невідомий реєстр',
          category: 'UNKNOWN',
          status: 'ERROR',
          error: r.reason?.message || String(r.reason),
          queriedAt: new Date().toISOString(),
          durationMs: 0,
        });
      }
    });
  }

  const okCount = results.filter(r => r.status === 'OK').length;
  const noDataCount = results.filter(r => r.status === 'NO_DATA').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  console.log(`[PREDATOR] Query complete: ${okCount} OK, ${noDataCount} NO_DATA, ${errorCount} ERRORS out of ${results.length} registries`);
  
  return results;
}
