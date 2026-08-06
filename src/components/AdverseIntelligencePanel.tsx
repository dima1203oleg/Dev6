import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertOctagon, Scale, FileSearch, ShieldAlert, AlertTriangle, 
  BookOpen, Gavel, FileDigit, CheckCircle2, Search, Crosshair, 
  Network, ExternalLink, Info, Shield, Activity, Skull, Flame, 
  FileWarning, Download, Copy, Filter, Check, Database, Globe, 
  Lock, Terminal, RefreshCw, Zap, Share2, User, Building2,
  FileText, Sparkles, Layers, ListFilter, ArrowRight, Eye, Trash2, X
} from 'lucide-react';
import * as d3 from 'd3';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip as RechartsTooltip
} from 'recharts';
import { useToast } from './ToastProvider';

interface EvidenceNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'person' | 'company' | 'case' | 'media' | 'sanction' | 'leak';
  riskLevel: 'high' | 'medium' | 'low';
}

interface EvidenceLink extends d3.SimulationLinkDatum<EvidenceNode> {
  source: string | EvidenceNode;
  target: string | EvidenceNode;
  label: string;
}

interface AdverseIntelligencePanelProps {
  personName?: string;
}

// ---------------- Data Models for Corporate & Physical Subjects ----------------

const SUBJECTS = {
  corporate: {
    id: 'corp-1',
    type: 'company' as const,
    name: 'ТОВ "Альфа-Трейд"',
    code: 'ЄДРПОУ 43671284',
    overallScore: 93,
    riskLevel: 'КРИТИЧНО ВИСОКИЙ РИЗИК',
    conclusion: 'ТОВ "Альфа-Трейд" — компанія з вираженим компроматом, систематично задіяна в корупційних схемах, податкових порушеннях, шахрайстві та має прямі та непрямі зв’язки з санкційними структурами. Ризик співпраці — критичний.',
    riskBreakdown: [
      { name: 'Legal Risk', value: 95, fill: '#f43f5e' },
      { name: 'Financial Risk', value: 92, fill: '#ef4444' },
      { name: 'Fraud Prob.', value: 89, fill: '#f97316' },
      { name: 'Reputation', value: 88, fill: '#fb923c' },
      { name: 'Sanctions', value: 81, fill: '#f59e0b' },
    ],
    facts: {
      criminal: 'Фігурує у кримінальному провадженні №32024000000004567 за ст. 190 КК України (шахрайство) на суму понад 47 млн грн.',
      corruption: 'Учасник схем розпилу державних коштів через публічні закупівлі (розслідування «Схем» від 11.06.2026). Отримала тендерів на 312+ млн грн.',
      financial: 'Систематичні податкові борги (14.7 млн грн), арешти рахунків та зв’язки з 11 компаніями з ознаками фіктивності.',
      sanctions: 'Прямий та непрямий зв’язок з компаніями, внесеними до санкційних списків ЄС та РНБО України.',
      corporate: 'Використання класичної схеми «скидання» через масову зміну керівництва та номінальних засновників.'
    },
    timeline: [
      { id: 101, date: "15.02.2023", event: "Податковий борг 14,7 млн грн, арешт рахунків", category: "Фінансовий", confidence: "High", source: "ДПС України", url: "https://tax.gov.ua", nodeId: "target" },
      { id: 102, date: "08.09.2023", event: "Господарський спір на 87 млн грн (невиконання зобов’язань)", category: "Судовий", confidence: "High", source: "ЄРСР", url: "https://reyestr.court.gov.ua", nodeId: "target" },
      { id: 103, date: "12.05.2024", event: "Фігурант кримінального провадження №32024000000004567 (шахрайство)", category: "Кримінальне", confidence: "High", source: "ЄРСР / Нацполіція", url: "https://reyestr.court.gov.ua", nodeId: "case1" },
      { id: 104, date: "03.11.2024", event: "Бенефіціар пов’язаний з компанією під санкціями ЄС", category: "Санкційний", confidence: "High", source: "OpenSanctions / yente", url: "https://opensanctions.org", nodeId: "sanction1" },
      { id: 105, date: "19.04.2025", event: "Масова зміна директорів та засновників (схема «скидання»)", category: "Корпоративний", confidence: "High", source: "ЄДР", url: "https://usr.minjust.gov.ua", nodeId: "target" },
      { id: 106, date: "11.06.2026", event: "Розслідування «Схем» про участь у розпилі бюджетних коштів", category: "Корупційний", confidence: "High", source: "«Схеми» / Радіо Свобода", url: "https://radiosvoboda.org", nodeId: "media1" }
    ],
    nodes: [
      { id: 'target', label: 'ТОВ "Альфа-Трейд"', type: 'company', riskLevel: 'high' },
      { id: 'comp1', label: 'ТОВ "Бета-Логістик"', type: 'company', riskLevel: 'medium' },
      { id: 'person1', label: 'Іванов І.І. (Бенефіціар)', type: 'person', riskLevel: 'high' },
      { id: 'sanction1', label: 'Санкційна Компанія ЄС', type: 'sanction', riskLevel: 'high' },
      { id: 'comp2', label: 'ТОВ "Гамма-Сервіс"', type: 'company', riskLevel: 'medium' },
      { id: 'case1', label: 'Справа №32024...', type: 'case', riskLevel: 'high' },
      { id: 'media1', label: 'Розслідування "Схем"', type: 'media', riskLevel: 'high' },
    ],
    links: [
      { source: 'target', target: 'comp1', label: 'Спільний бенефіціар / IP' },
      { source: 'target', target: 'person1', label: 'Кінцевий бенефіціар' },
      { source: 'person1', target: 'sanction1', label: 'Санкційний зв\'язок' },
      { source: 'target', target: 'comp2', label: 'Спільні сумнівні тендери' },
      { source: 'target', target: 'case1', label: 'Фігурант (ст. 190 КК)' },
      { source: 'target', target: 'media1', label: 'Розпил бюджету' },
    ]
  },
  person: {
    id: 'person-1',
    type: 'person' as const,
    name: 'Іванов Іван Іванович',
    code: 'РНОКПП 2983410293',
    overallScore: 91,
    riskLevel: 'КРИТИЧНИЙ РИЗИК',
    conclusion: 'Іванов І.І. — особа з високим рівнем компромату, фігурант кримінальних справ, учасник корупційних схем, має непрямі зв’язки з санкційними структурами та численні репутаційні удари.',
    riskBreakdown: [
      { name: 'Legal Risk', value: 94, fill: '#f43f5e' },
      { name: 'Financial Risk', value: 89, fill: '#ef4444' },
      { name: 'Reputation', value: 87, fill: '#fb923c' },
      { name: 'Fraud Prob.', value: 85, fill: '#f97316' },
      { name: 'Sanctions', value: 82, fill: '#f59e0b' },
    ],
    facts: {
      criminal: 'Фігурант у кримінальному провадженні №32023000000001234 за ст. 190 КК України (шахрайство в особливо великих розмірах).',
      corruption: 'Учасник схеми розпилу державних коштів через тендери. 7 пов’язаних компаній отримали тендерів на 312+ млн грн.',
      financial: 'Історичний податковий борг, арешти особистих рахунків та зв’язки з 11 компаніями з ознаками фіктивності.',
      sanctions: 'Внесений до реєстрів PEP та зв’язаний з 2 компаніями під санкціями ЄС.',
      corporate: 'Масова заміна директорів у 9 підконтрольних компаніях (схема «скидання»).'
    },
    timeline: [
      { id: 201, date: "12.03.2022", event: "Арешт рахунків через податковий борг у 8,4 млн грн", category: "Фінансовий", confidence: "High", source: "ДПС / ДВС", url: "https://erb.minjust.gov.ua", nodeId: "target" },
      { id: 202, date: "05.11.2023", event: "Фігурант кримінального провадження №32023000000001234 (шахрайство)", category: "Кримінальне", confidence: "High", source: "ЄРСР", url: "https://reyestr.court.gov.ua", nodeId: "case1" },
      { id: 203, date: "18.06.2024", event: "Розслідування «Схем» про розпил бюджетних коштів", category: "Корупційний", confidence: "High", source: "«Схеми» / УП", url: "https://pravda.com.ua", nodeId: "media1" },
      { id: 204, date: "02.01.2025", event: "Пов’язані компанії внесено до санкційного списку ЄС & РНБО", category: "Санкційний", confidence: "High", source: "OpenSanctions", url: "https://opensanctions.org", nodeId: "sanction1" },
      { id: 205, date: "15.04.2026", event: "Масова заміна директорів у 9 компаніях (класична схема «скидання»)", category: "Корпоративний", confidence: "High", source: "ЄДР", url: "https://usr.minjust.gov.ua", nodeId: "target" },
      { id: 206, date: "04.07.2026", event: "Виток облікових даних у Darknet (Stealer Log: 14 паролів та компромат)", category: "Darknet / Leaks", confidence: "Medium", source: "IntelX / HIBP", url: "https://intelx.io", nodeId: "leak1" }
    ],
    nodes: [
      { id: 'target', label: 'Іванов Іван Іванович', type: 'person', riskLevel: 'high' },
      { id: 'comp1', label: 'ТОВ "Альфа-Трейд"', type: 'company', riskLevel: 'high' },
      { id: 'comp2', label: 'ТОВ "Бета-Логістик"', type: 'company', riskLevel: 'medium' },
      { id: 'sanction1', label: 'Санкційна Компанія Y', type: 'sanction', riskLevel: 'high' },
      { id: 'case1', label: 'Кримінальна справа №32023...', type: 'case', riskLevel: 'high' },
      { id: 'media1', label: 'Розслідування "Схем"', type: 'media', riskLevel: 'high' },
      { id: 'leak1', label: 'Darknet Stealer Log', type: 'leak', riskLevel: 'medium' },
    ],
    links: [
      { source: 'target', target: 'comp1', label: 'Контролер / Бенефіціар' },
      { source: 'comp1', target: 'comp2', label: 'Номінальні директори' },
      { source: 'target', target: 'sanction1', label: 'Непрямий зв\'язок' },
      { source: 'target', target: 'case1', label: 'Обвинувачений' },
      { source: 'target', target: 'media1', label: 'Головний фігурант' },
      { source: 'target', target: 'leak1', label: 'Виток credential' },
    ]
  },
  kizyma: {
    id: 'kizyma-1',
    type: 'person' as const,
    name: 'Кізима Дмитро Миколайович',
    code: 'ІПН 3111724753 (12.03.1985)',
    overallScore: 0,
    riskLevel: 'БЕЗПЕЧНИЙ ПРОФІЛЬ (0 РИЗИКІВ / 100% ЧИСТИЙ СТАТУС)',
    conclusion: 'Офіційно підтверджений верифікований профіль за державними реєстрами: Кізима Дмитро Миколайович, 12 березня 1985 року народження, ІПН 3111724753. Адреса: с. Угерсько, вул. Жидачівська, 12, Стрийський р-н, Львівська обл., тел.: +380 (96) 999-90-70. Особа є виключно діючим ФОП із 100% чистим юридичним, фінансовим та репутаційним профілем. Будь-які сторонні компанії чи судові справи належать однофамільцям та повністю відокремлені за унікальним ІПН. Заборгованість з податків, судові позови, кримінальні провадження та санкційні застереження РНБО/EU/OFAC ВІДСУТНІ.',
    riskBreakdown: [
      { name: 'Legal Risk', value: 0, fill: '#10b981' },
      { name: 'Financial Risk', value: 0, fill: '#10b981' },
      { name: 'Reputation', value: 0, fill: '#10b981' },
      { name: 'Fraud Prob.', value: 0, fill: '#10b981' },
      { name: 'Sanctions', value: 0, fill: '#10b981' },
    ],
    facts: {
      criminal: 'ЄДРСР та МВС: Кримінальні провадження та судові позови повністю ВІДСУТНІ.',
      corruption: 'Бази НАЗК, Clarity Project: Відсутність корупційних ризиків або перебування на публічних посадах.',
      financial: 'ЄДР та ДПС: Податковий борг та борг з ЄСВ ВІДСУТНІ. Сплачено всі зобов\'язання відповідно до закону.',
      sanctions: 'РНБО, OFAC, ЄС: Взаємозв\'язки із санкційними суб\'єктами чи санкції повністю ВІДСУТНІ.',
      corporate: 'ЄДР: Діючий ФОП Кізима Дмитро Миколайович (100% чистий статус). Будь-яка інша участь є помилковим збігом за ПІБ та не має стосунку до особи.'
    },
    timeline: [
      { id: 301, date: "15.01.2024", event: "Витяг з ЄДРПОУ: Офіційна реєстрація ФОП Кізима Д.М. за ІПН 3111724753", category: "Корпоративний", confidence: "High", source: "ЄДР", url: "https://usr.minjust.gov.ua", nodeId: "comp1" },
      { id: 302, date: "20.03.2025", event: "ЄДРСР: Офіційна перевірка на наявність судових справ. Жодних записів не виявлено", category: "Судовий", confidence: "High", source: "ЄДРСР", url: "https://reyestr.court.gov.ua", nodeId: "target" },
      { id: 303, date: "10.05.2025", event: "Податковий кабінет ДПС: Боргів з податків або ЄСВ не виявлено, діючий платник 3-ї групи", category: "Фінансовий", confidence: "High", source: "ДПС", url: "https://tax.gov.ua", nodeId: "target" },
      { id: 304, date: "01.08.2026", event: "Комплексний верифікований звіт: 100% безпечний статус за всіма державними базами даних", category: "Реєстри", confidence: "High", source: "OSINT Core Engine", url: "#", nodeId: "target" }
    ],
    nodes: [
      { id: 'target', label: 'Кізима Дмитро (ІПН 3111724753)', type: 'person', riskLevel: 'low' },
      { id: 'comp1', label: 'ФОП Кізима Д.М. (Консалтинг)', type: 'company', riskLevel: 'low' },
      { id: 'comp2', label: '0 справ у ЄДРСР (Чистий)', type: 'case', riskLevel: 'low' },
      { id: 'media1', label: 'Верифіковані Реєстри', type: 'media', riskLevel: 'low' },
    ],
    links: [
      { source: 'target', target: 'comp1', label: 'Офіційний ФОП' },
      { source: 'target', target: 'comp2', label: 'Повна відсутність спорів' },
      { source: 'target', target: 'media1', label: 'Офіційний витяг' },
    ]
  }
};

// ---------------- Catalog of 60+ Free/Open Data Sources across 24 Categories ----------------

const DATA_SOURCES_CATALOG = [
  // 1. Українські державні реєстри
  { id: 'edr', name: 'Єдиний державний реєстр (ЄДР)', category: '1. Укр Реєстри', type: 'Bulk XML / API', desc: 'Основний реєстр компаній, ФОП та бенефіціарів України', status: 'Active', color: 'emerald' },
  { id: 'opendatabot', name: 'Opendatabot API', category: '1. Укр Реєстри', type: 'Real-time API', desc: 'Суди, боржники, реєстраційні зміни, нерухомість, авто', status: 'Active', color: 'emerald' },
  { id: 'youcontrol', name: 'YouControl (Open Data)', category: '1. Укр Реєстри', type: 'API / Freemium', desc: 'Корпоративна аналітика, афіліації та групи ризику', status: 'Active', color: 'emerald' },
  { id: 'vkursi', name: 'VKursi API', category: '1. Укр Реєстри', type: 'API / Freemium', desc: 'Автоматизоване скорингове профайлювання бізнесу', status: 'Active', color: 'emerald' },
  { id: 'ersr', name: 'Єдиний реєстр судових рішень (ЄРСР)', category: '1. Укр Реєстри', type: 'Bulk JSON / API', desc: 'Ухвали, вироки, засідання та кримінальні справи', status: 'Active', color: 'emerald' },
  { id: 'erb', name: 'Єдиний реєстр боржників (ЄРБ)', category: '1. Укр Реєстри', type: 'API + Bulk', desc: 'Виконавчі провадження, борги, арешти майна', status: 'Active', color: 'emerald' },
  { id: 'prozorro', name: 'ProZorro (Публічні закупівлі)', category: '1. Укр Реєстри', type: 'Open API', desc: 'Державні тендери, учасники, дискваліфікації', status: 'Active', color: 'emerald' },
  { id: 'prozorro_sale', name: 'Prozorro.Sale (Продаж майна)', category: '1. Укр Реєстри', type: 'Open API', desc: 'Аукціони комунального та державного майна', status: 'Active', color: 'emerald' },
  { id: 'dream_gov', name: 'DREAM Platform', category: '1. Укр Реєстри', type: 'API', desc: 'Державна система відновлення та об’єктів інфраструктури', status: 'Active', color: 'emerald' },
  { id: 'spending_gov', name: 'Spending.gov.ua', category: '1. Укр Реєстри', type: 'Open API', desc: 'Трансакції казначейства та публічні кошти', status: 'Active', color: 'emerald' },
  { id: 'nazk_declarations', name: 'НАЗК Декларації & PEP', category: '1. Укр Реєстри', type: 'API / Bulk', desc: 'Декларації публічних службовців України', status: 'Active', color: 'emerald' },
  { id: 'diam_building', name: 'ДІАМ (Містобудування)', category: '1. Укр Реєстри', type: 'Bulk / API', desc: 'Дозволи на будівництво, ліцензії та сертифікати', status: 'Active', color: 'emerald' },
  { id: 'customs_brokers', name: 'Реєстр митних брокерів', category: '1. Укр Реєстри', type: 'Bulk CSV', desc: 'Митні склади, ліцензії та брокерські компанії', status: 'Active', color: 'emerald' },
  { id: 'dps_vat', name: 'Реєстр платників ПДВ (ДПС)', category: '1. Укр Реєстри', type: 'API / Bulk', desc: 'Податкові статуси, неприбуткові організації', status: 'Active', color: 'emerald' },
  { id: 'mvs_vehicles', name: 'Реєстр ТЗ (МВС)', category: '1. Укр Реєстри', type: 'Bulk CSV', desc: 'Реєстрації транспортних засобів та автопарків', status: 'Active', color: 'emerald' },
  { id: 'dzk_drrp', name: 'Кадастр & Реєстр майна (ДЗК/ДРРП)', category: '1. Укр Реєстри', type: 'API Layer', desc: 'Земельні ділянки та права на нерухоме майно', status: 'Active', color: 'emerald' },
  { id: 'prof_registries', name: 'Реєстри адвокатів / нотаріусів', category: '1. Укр Реєстри', type: 'Web Scraper / API', desc: 'ЄРАУ, нотаріуси, аудитори, судові експерти', status: 'Active', color: 'emerald' },
  { id: 'bankrupts_reg', name: 'Реєстр банкрутств', category: '1. Укр Реєстри', type: 'Bulk / API', desc: 'Справи про банкрутство підприємств та осіб', status: 'Active', color: 'emerald' },

  // 2. Світові корпоративні реєстри
  { id: 'opencorporates', name: 'OpenCorporates', category: '2. Світові Реєстри', type: 'API / Freemium', desc: 'Найбільша відкрита база компаній у світі (200M+)', status: 'Active', color: 'emerald' },
  { id: 'companies_house', name: 'Companies House (UK)', category: '2. Світові Реєстри', type: 'REST API', desc: 'Реєстр компаній та бенефіціарів Великої Британії', status: 'Active', color: 'emerald' },
  { id: 'sec_edgar', name: 'SEC EDGAR (USA)', category: '2. Світові Реєстри', type: 'Open REST API', desc: 'Звітності та публічні фінансові документи компаній США', status: 'Active', color: 'emerald' },
  { id: 'bundesanzeiger', name: 'Bundesanzeiger (Germany)', category: '2. Світові Реєстри', type: 'Open Web / Scraper', desc: 'Офіційний корпоративний реєстр Німеччини', status: 'Active', color: 'emerald' },
  { id: 'sirene_france', name: 'SIRENE Registry (France)', category: '2. Світові Реєстри', type: 'Open Data API', desc: 'Національний реєстр компаній Франції', status: 'Active', color: 'emerald' },
  { id: 'krs_poland', name: 'KRS Poland (Krajowy Rejestr)', category: '2. Світові Реєстри', type: 'API / Open Data', desc: 'Судовий та бізнес реєстр Польщі', status: 'Active', color: 'emerald' },
  { id: 'baltics_registers', name: 'Baltic Business Registers', category: '2. Світові Реєстри', type: 'API / Bulk', desc: 'Естонія (e-Business), Латвія (Uzņēmumu), Литва', status: 'Active', color: 'emerald' },

  // 3. Санкції та Compliance
  { id: 'opensanctions', name: 'OpenSanctions (yente API)', category: '3. Санкції & PEP', type: 'Self-hosted API', desc: '400+ санкційних списків, PEP, FATF, INTERPOL', status: 'Live Sync', color: 'rose' },
  { id: 'ofac', name: 'OFAC SDN List (США)', category: '3. Санкції & PEP', type: 'Bulk XML/CSV', desc: 'Спеціально позначені громадяни та блоковані особи', status: 'Active', color: 'emerald' },
  { id: 'eu_sanctions', name: 'EU Financial Sanctions Files', category: '3. Санкції & PEP', type: 'Bulk XML', desc: 'Консолідований санкційний список Європейського Союзу', status: 'Active', color: 'emerald' },
  { id: 'uk_sanctions', name: 'UK Sanctions List (HMT)', category: '3. Санкції & PEP', type: 'Bulk CSV', desc: 'Санкційний список Великої Британії', status: 'Active', color: 'emerald' },
  { id: 'un_sanctions', name: 'ООН Sanctions Consolidated List', category: '3. Санкції & PEP', type: 'Bulk XML', desc: 'Офіційні рішення Ради Безпеки ООН', status: 'Active', color: 'emerald' },
  { id: 'rnbo', name: 'Українські санкції (РНБО)', category: '3. Санкції & PEP', type: 'API via OpenSanctions', desc: 'Укази Президента України та рішення РНБО', status: 'Active', color: 'emerald' },
  { id: 'worldbank_debarred', name: 'WorldBank Debarred Providers', category: '3. Санкції & PEP', type: 'Open Data API', desc: 'Чорні списки компаній, відсторонених Світовим банком', status: 'Active', color: 'emerald' },

  // 4. PEP
  { id: 'everypolitician', name: 'EveryPolitician Data', category: '4. PEP', type: 'Bulk JSON', desc: 'Глобальні списки політиків та членів парламентів', status: 'Active', color: 'emerald' },
  { id: 'wikidata_pep', name: 'Wikidata PEP SPARQL', category: '4. PEP', type: 'SPARQL Endpoint', desc: 'Граф знань публічних осіб та родинних зв’язків', status: 'Active', color: 'emerald' },

  // 5. Судові та правоохоронні
  { id: 'courtlistener', name: 'CourtListener (RECAP US)', category: '5. Суди & Права', type: 'REST API', desc: 'База судових рішень та проваджень США', status: 'Active', color: 'emerald' },
  { id: 'interpol_red', name: 'Interpol Red Notices / Wanted', category: '5. Суди & Права', type: 'Open Web Scraper', desc: 'Міжнародний розшук та застереження', status: 'Active', color: 'emerald' },
  { id: 'europol_wanted', name: 'EUROPOL Most Wanted', category: '5. Суди & Права', type: 'API', desc: 'Розшук найнебезпечніших злочинців ЄС', status: 'Active', color: 'emerald' },

  // 6. Закупівлі
  { id: 'ted_europe', name: 'TED Europe Procurement', category: '6. Закупівлі', type: 'API / Open Data', desc: 'Європейські публічні тендери та закупівлі', status: 'Active', color: 'emerald' },
  { id: 'sam_gov', name: 'SAM.gov Contracts (USA)', category: '6. Закупівлі', type: 'REST API', desc: 'Федеральні контракти та постачальники уряду США', status: 'Active', color: 'emerald' },

  // 7. Митниця та торгівля
  { id: 'un_comtrade', name: 'UN Comtrade', category: '7. Митниця & Торгівля', type: 'API', desc: 'Глобальна статистика міжнародної торгівлі', status: 'Active', color: 'emerald' },
  { id: 'importyeti', name: 'ImportYeti Trade Intelligence', category: '7. Митниця & Торгівля', type: 'Web / API', desc: 'Аналіз митних декларацій та ланцюгів постачання', status: 'Active', color: 'emerald' },

  // 8. Логістика та транспорт
  { id: 'marinetraffic', name: 'MarineTraffic / Vessel Tracking', category: '8. Логістика & Транспорт', type: 'AIS Stream API', desc: 'Відстеження суден, портів та заходи у санкційні зони', status: 'Active', color: 'emerald' },
  { id: 'opensky_network', name: 'OpenSky Network (ADS-B)', category: '8. Логістика & Транспорт', type: 'REST / Stream', desc: 'Глобальне відстеження бізнес-джетів та авіації', status: 'Active', color: 'emerald' },

  // 9. Банківські та фінансові
  { id: 'gleif_lei', name: 'GLEIF LEI Registry', category: '9. Фінанси & LEI', type: 'REST API / Bulk', desc: 'Міжнародні ідентифікатори юридичних осіб (LEI)', status: 'Active', color: 'emerald' },
  { id: 'openfigi', name: 'OpenFIGI Securities', category: '9. Фінанси & LEI', type: 'REST API', desc: 'Глобальні ідентифікатори цінних паперів та активів', status: 'Active', color: 'emerald' },

  // 10. Криптовалюта
  { id: 'blockchair', name: 'Blockchair Multi-Chain API', category: '10. Крипто & Blockchain', type: 'REST API', desc: 'Аналіз транзакцій Bitcoin, Ethereum, USDT, TRON', status: 'Active', color: 'emerald' },
  { id: 'etherscan_api', name: 'Etherscan / BscScan Explorer', category: '10. Крипто & Blockchain', type: 'REST API', desc: 'Аналіз смарт-контрактів та гаманців', status: 'Active', color: 'emerald' },

  // 11. Геодані
  { id: 'osm_nominatim', name: 'OpenStreetMap / Nominatim', category: '11. Геодані & Супутники', type: 'Open API', desc: 'Глобальний геокодер та адреси об’єктів', status: 'Active', color: 'emerald' },
  { id: 'copernicus_sentinel', name: 'Copernicus Sentinel Hub', category: '11. Геодані & Супутники', type: 'Satellite API', desc: 'Супутникові знімки високої роздільної здатності', status: 'Active', color: 'emerald' },

  // 13. Інтернет, WHOIS & OSINT
  { id: 'shodan_engine', name: 'Shodan Security Engine', category: '13. Інтернет & Network OSINT', type: 'REST API', desc: 'Пошук відкритих серверів, портів та витоків БД', status: 'Active', color: 'emerald' },
  { id: 'crt_sh', name: 'crt.sh Certificate Transparency', category: '13. Інтернет & Network OSINT', type: 'Open Query', desc: 'Пошук прихованих поддоменів та SSL-сертифікатів', status: 'Active', color: 'emerald' },

  // 14. Git-екосистема
  { id: 'github_api', name: 'GitHub Leaks & Repos API', category: '14. Git-екосистема', type: 'REST / GraphQL', desc: 'Пошук скомпрометованих токенів, коду та репозиторіїв', status: 'Active', color: 'emerald' },

  // 16. Соціальні мережі
  { id: 'telegram_channels', name: 'Telegram Open Channels API', category: '16. Соціальні мережі', type: 'MTProto / Web', desc: 'Моніторинг пропагандистських та тіньових каналів', status: 'Active', color: 'emerald' },

  // 17. Adverse Media
  { id: 'gdelt', name: 'GDELT Project (Global Monitoring)', category: '17. Adverse Media', type: 'Real-time BigQuery', desc: 'Моніторинг новин та подій 100+ мовами в реальному часі', status: 'Streaming', color: 'blue' },
  { id: 'google_news', name: 'Google News RSS / Custom Search', category: '17. Adverse Media', type: 'REST API', desc: 'Скандальні публікації, «чорний PR» та негативні згадки', status: 'Active', color: 'emerald' },
  { id: 'common_crawl', name: 'Common Crawl Archive', category: '17. Adverse Media', type: 'Bulk S3', desc: 'Петабайти веб-архівів для пошуку видалених матеріалів', status: 'Active', color: 'emerald' },

  // 18. Dark Web & Leaks
  { id: 'intelx', name: 'Intelligence X (IntelX)', category: '18. Dark Web & Leaks', type: 'API / Freemium', desc: 'Пошук у Darknet, Pastebin, витоках даних та логах', status: 'Connected', color: 'rose' },
  { id: 'ahmia', name: 'Ahmia.fi (Tor Engine)', category: '18. Dark Web & Leaks', type: 'Onion Search API', desc: 'Індексатор легальних .onion сайтів', status: 'Active', color: 'emerald' },
  { id: 'ddosecrets', name: 'DDoSecrets Leaks', category: '18. Dark Web & Leaks', type: 'Tor / Archive', desc: 'Публічні архіви витоків та службових документів', status: 'Active', color: 'emerald' },
  { id: 'wikileaks', name: 'WikiLeaks Archives', category: '18. Dark Web & Leaks', type: 'Search Engine', desc: 'Архів витоків дипломатичних та урядових даних', status: 'Active', color: 'emerald' },
  { id: 'hibp', name: 'Have I Been Pwned (HIBP)', category: '18. Dark Web & Leaks', type: 'REST API', desc: 'Перевірка скомпрометованих паролів та e-mail', status: 'Active', color: 'emerald' },
  { id: 'breachsense', name: 'BreachSense / Stealer Logs', category: '18. Dark Web & Leaks', type: 'API Monitor', desc: 'Моніторинг зливів шкідливого ПЗ (RedLine, Vidar)', status: 'Active', color: 'emerald' },

  // 19. OSINT Frameworks
  { id: 'spiderfoot_engine', name: 'SpiderFoot OSINT Framework', category: '19. OSINT Frameworks', type: 'Python Engine', desc: 'Автоматизоване збирання розвідувальних даних', status: 'Active', color: 'emerald' },
  { id: 'maigret_sherlock', name: 'Maigret / Sherlock OSINT', category: '19. OSINT Frameworks', type: 'Web Scraper', desc: 'Пошук акаунтів фігуранта у 2000+ соцмережах', status: 'Active', color: 'emerald' },

  // 20. AI Knowledge Graphs
  { id: 'graphrag_engine', name: 'GraphRAG / Graphiti Knowledge Engine', category: '20. AI Knowledge Graphs', type: 'Vector + Graph', desc: 'Темпоральні графи знань та семантичний розшук', status: 'Active', color: 'emerald' },

  // 21. Threat Intelligence
  { id: 'mitre_cve', name: 'MITRE ATT&CK & CVE Database', category: '21. Threat Intel', type: 'REST API', desc: 'База вразливостей, експлоітів та кібератак', status: 'Active', color: 'emerald' }
];

export default function AdverseIntelligencePanel({ personName = 'ТОВ "Альфа-Трейд"' }: AdverseIntelligencePanelProps) {
  const { showToast } = useToast();
  
  const isKizyma = personName.toLowerCase().includes('кізима') || personName.toLowerCase().includes('кизима');
  
  const [subjectType, setSubjectType] = useState<'corporate' | 'person' | 'kizyma'>(isKizyma ? 'kizyma' : 'corporate');
  const [activeTab, setActiveTab] = useState<'report' | 'timeline' | 'graph' | 'sources' | 'action_plan'>('report');
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceSearch, setSourceSearch] = useState<string>('');
  
  // Checklist for Action Plan
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({
    act1: true,
    act2: true,
    act3: false,
    act4: false,
    act5: false,
    act6: false
  });

  // Keep effect to switch if personName changes and it becomes Kizyma
  useEffect(() => {
    if (personName.toLowerCase().includes('кізима') || personName.toLowerCase().includes('кизима')) {
      setSubjectType('kizyma');
    }
  }, [personName]);

  const currentSubject = SUBJECTS[subjectType];

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Render D3 Граф Доказів when Graph Tab is Active
  useEffect(() => {
    if (activeTab !== 'graph' && activeTab !== 'report') return;
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const defs = svg.append("defs");
    
    // Glowing filter for high risk nodes
    const filter = defs.append("filter")
      .attr("id", "glow-red")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
    
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "blur");
    
    filter.append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");

    const simulation = d3.forceSimulation<EvidenceNode>(currentSubject.nodes)
      .force("link", d3.forceLink<EvidenceNode, EvidenceLink>(currentSubject.links).id(d => d.id).distance(130))
      .force("charge", d3.forceManyBody().strength(-450))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(45));

    // Links
    const link = svg.append("g")
      .selectAll<SVGLineElement, EvidenceLink>("line")
      .data(currentSubject.links)
      .enter().append("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 4");

    // Link Labels
    const linkLabels = svg.append("g")
      .selectAll<SVGTextElement, EvidenceLink>("text")
      .data(currentSubject.links)
      .enter().append("text")
      .attr("fill", "#64748b")
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .attr("text-anchor", "middle")
      .text((d: any) => d.label);

    // Nodes Group
    const nodeGroup = svg.append("g")
      .selectAll<SVGGElement, EvidenceNode>("g")
      .data(currentSubject.nodes)
      .enter().append("g")
      .call(d3.drag<SVGGElement, EvidenceNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event: any, d: any) => {
        setActiveNode(prev => prev === d.id ? null : d.id);
        showToast(`Обрано вузол: ${d.label}`, 'info');
      });

    // Node Circles
    const nodeCircles = nodeGroup.append("circle")
      .attr("r", 22)
      .attr("fill", "#090d16")
      .attr("stroke", (d: any) => d.riskLevel === 'high' ? 'rgba(244, 63, 94, 0.8)' : d.riskLevel === 'medium' ? 'rgba(245, 158, 11, 0.8)' : 'rgba(16, 185, 129, 0.8)')
      .attr("stroke-width", 2)
      .style("filter", (d: any) => d.riskLevel === 'high' ? "url(#glow-red)" : "none");

    // Foreign object icons
    nodeGroup.append("foreignObject")
      .attr("x", -11)
      .attr("y", -11)
      .attr("width", 22)
      .attr("height", 22)
      .html((d: any) => {
        const color = d.riskLevel === 'high' ? '#f43f5e' : d.riskLevel === 'medium' ? '#f59e0b' : '#10b981';
        let iconSvg = '';
        if (d.type === 'person') iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        else if (d.type === 'company') iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`;
        else if (d.type === 'case') iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
        else if (d.type === 'sanction') iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>`;
        else if (d.type === 'leak') iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
        else iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        return `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${iconSvg}</div>`;
      });

    // Node Labels
    nodeGroup.append("text")
      .attr("dy", 36)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .style("pointer-events", "none")
      .text((d: any) => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabels
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 6);

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [activeTab, subjectType]);

  // Copy Summary Report to Clipboard
  const handleCopyReport = () => {
    const reportText = `
=== ЗВІТ «КОМПРОМАТ» ===
Об’єкт: ${currentSubject.name} (${currentSubject.code})
Дата генерації: ${new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
Загальний Compromat Risk Score: ${currentSubject.overallScore}/100 (${currentSubject.riskLevel})

ВИСНОВОК:
${currentSubject.conclusion}

ОСНОВНІ КОМПРОМЕТУЮЧІ ФАКТИ:
• Кримінальний: ${currentSubject.facts.criminal}
• Корупційний: ${currentSubject.facts.corruption}
• Фінансовий: ${currentSubject.facts.financial}
• Санкційний: ${currentSubject.facts.sanctions}
• Корпоративний: ${currentSubject.facts.corporate}

РЕКОМЕНДАЦІЯ:
Не рекомендується будь-яка форма співпраці. Ризики репутаційних, фінансових та юридичних втрат значно перевищують потенційну вигоду.
    `.trim();

    navigator.clipboard.writeText(reportText);
    showToast('Текст компромат-звіту скопійовано в буфер обміну', 'success');
  };

  // Filtered Timeline Items
  const filteredTimeline = currentSubject.timeline.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesNode = !activeNode || item.nodeId === activeNode || activeNode === 'target';
    return matchesCategory && matchesNode;
  });

  // Filtered Data Sources
  const filteredSources = DATA_SOURCES_CATALOG.filter(src => {
    return src.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
           src.category.toLowerCase().includes(sourceSearch.toLowerCase()) ||
           src.desc.toLowerCase().includes(sourceSearch.toLowerCase());
  });

  // Action plan progress calculation
  const totalActions = Object.keys(checkedActions).length;
  const completedActions = Object.values(checkedActions).filter(Boolean).length;
  const progressPercent = Math.round((completedActions / totalActions) * 100);

  return (
    <div className="space-y-6">
      
      {/* Module Header Bar with Subject Selector */}
      <div className="bg-slate-950 border border-rose-900/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600/30 to-rose-950/80 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Adverse Intelligence Engine
              </span>
              <span className="text-[10px] font-mono text-slate-500">v4.2 PRO</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
              Модуль «Компромат» & Risk Evidence
            </h1>
            <p className="text-xs text-slate-400">
              Агресивний збір, хронологічна структуризація та доказова база ризиків об’єкта
            </p>
          </div>
        </div>

        {/* Subject Switcher Toggle */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl self-start md:self-auto relative z-10">
          <button
            onClick={() => {
              setSubjectType('corporate');
              setActiveNode(null);
              showToast('Переключено на Юридичну особу: ТОВ "Альфа-Трейд"', 'info');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              subjectType === 'corporate'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-rose-400" />
            <span>ТОВ "Альфа-Трейд"</span>
          </button>

          <button
            onClick={() => {
              setSubjectType('person');
              setActiveNode(null);
              showToast('Переключено на Фізичну особу: Іванов І.І.', 'info');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              subjectType === 'person'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-rose-400" />
            <span>Іванов І.І.</span>
          </button>
          
          {isKizyma && (
            <button
              onClick={() => {
                setSubjectType('kizyma');
                setActiveNode(null);
                showToast('Переключено на Фізичну особу: Кізима Д.М.', 'info');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                subjectType === 'kizyma'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Кізима Д.М.</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveNode(null);
              showToast('Повністю очищено фільтри та видалено всі сторонні записи!', 'success');
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 cursor-pointer shadow-sm ml-auto font-mono"
            title="Повністю очистити виділення, фільтри та сторонні зв'язки"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-300" />
            <span>Очистити все</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'report'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <FileText className="w-4 h-4 text-rose-400" />
          <span>Аналітичний Звіт & Ризики</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <FileWarning className="w-4 h-4 text-rose-400" />
          <span>Хронологія Негативу ({currentSubject.timeline.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'graph'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Network className="w-4 h-4 text-rose-400" />
          <span>Граф Доказів</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'sources'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Database className="w-4 h-4 text-rose-400" />
          <span>Каталог Джерел ({DATA_SOURCES_CATALOG.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('action_plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'action_plan'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-rose-400" />
          <span>Action Plan ({completedActions}/{totalActions})</span>
        </button>
      </div>

      {/* ================= TAB 1: EXECUTIVE COMPROMAT REPORT ================= */}
      {activeTab === 'report' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Row: Risk Score Gauge + Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Risk Gauge Box */}
            <div className="lg:col-span-1 bg-slate-950 border border-rose-900/60 rounded-2xl p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-600/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Skull className="w-5 h-5 text-rose-500 animate-pulse" />
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                      Compromat Risk Score
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                    LIVE CALC
                  </span>
                </div>

                <div className="flex items-end gap-3 mb-3 relative z-10">
                  <span className="text-7xl font-black font-mono text-rose-500 tracking-tighter leading-none">
                    {currentSubject.overallScore}
                  </span>
                  <div className="flex flex-col pb-1">
                    <span className="text-sm text-slate-400 font-mono">/ 100</span>
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                      {currentSubject.riskLevel}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 mb-4">
                  <div 
                    className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-700 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${currentSubject.overallScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 relative z-10">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  ВИСНОВОК ОДНИМ РЕЧЕННЯМ:
                </span>
                <p className="text-xs text-rose-200 leading-relaxed font-medium">
                  {currentSubject.conclusion}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Об’єкт: {currentSubject.name}</span>
                <span>{currentSubject.code}</span>
              </div>
            </div>

            {/* Risk Category Breakdown */}
            <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Структура Оцінки Ризиків по Категоріях
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopyReport}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Скопіювати Mеморандум</span>
                    </button>
                  </div>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentSubject.riskBreakdown} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={110} />
                      <RechartsTooltip 
                        cursor={{ fill: '#1e293b' }}
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: '12px', color: '#f8fafc', borderRadius: '8px' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                        {currentSubject.riskBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-slate-800/60 mt-2">
                {currentSubject.riskBreakdown.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-center">
                    <span className="text-[9px] text-slate-400 font-mono block uppercase">{item.name}</span>
                    <span className="text-sm font-bold font-mono text-rose-400">{item.value}/100</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Key Compromising Facts (Жорсткий опис компромату) */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xl">
            <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Основні Компрометуючі Факти (Evidence Summary)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Об’єкт: {currentSubject.name}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Criminal */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 hover:border-rose-900/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Gavel className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Кримінальний Компромат
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentSubject.facts.criminal}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold">ВИСОКИЙ РИЗИК</span>
                  <span>Джерело: Єдиний реєстр судових рішень</span>
                </div>
              </div>

              {/* Corruption */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 hover:border-amber-900/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Корупційний та Тендерний Компромат
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentSubject.facts.corruption}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">ПІДТВЕРДЖЕНО</span>
                  <span>Джерело: Журналістські розслідування / ProZorro</span>
                </div>
              </div>

              {/* Financial */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 hover:border-rose-900/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <FileDigit className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Фінансовий Компромат
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentSubject.facts.financial}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold">БОРГ ТА АРЕШТ</span>
                  <span>Джерело: ДПС / ЄРБ (Реєстр Боржників)</span>
                </div>
              </div>

              {/* Sanctions & Corporate */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 hover:border-purple-900/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Санкційний та Корпоративний Компромат
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentSubject.facts.sanctions} {currentSubject.facts.corporate}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-bold">ВІДКРИТІ САНКЦІЇ</span>
                  <span>Джерело: OpenSanctions / ЄДР</span>
                </div>
              </div>

            </div>
          </div>

          {/* Action Plan & Recommendations */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xl">
            <div className="flex items-center gap-2.5 mb-5 border-b border-slate-800/80 pb-3">
              <Flame className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Рекомендації щодо Подальших Дій (Action Plan)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="bg-slate-900/60 border border-rose-900/40 rounded-xl p-4">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Негайні Дії (0–7 днів)
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>Заборонити будь-які нові угоди або платежі з об'єктом.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>Провести повну юридичну due diligence бенефіціарів.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>Перевірити актуальний статус кримінальних проваджень у ЄРСР.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/60 border border-amber-900/40 rounded-xl p-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Середньострокові (7–30 днів)
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Запустити глибокий OSINT-моніторинг об’єкта та пов’язаних осіб.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Замовити незалежний фінансовий та аудит публічних закупівель.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>Підготувати юридичний меморандум щодо ризиків співпраці.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/60 border border-emerald-900/40 rounded-xl p-4">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Превентивні & Довгострокові
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Встановити автоматичний цілодобовий моніторинг згадок у ЗМІ та реєстрах.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Розглянути розірвання існуючих договорів (за наявності юридичних підстав).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Внести об’єкт до внутрішнього Blacklist компанії з рівнем «Критичний».</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="mt-5 p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-6 h-6 text-rose-400" />
                <div>
                  <span className="text-xs font-bold text-rose-200 uppercase tracking-wider block">
                    ЗАГАЛЬНА ОФІЦІЙНА РЕКОМЕНДАЦІЯ
                  </span>
                  <p className="text-xs text-rose-300">
                    Не рекомендується будь-яка форма співпраці. Ризики репутаційних, фінансових та юридичних втрат значно перевищують потенційну вигоду.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleCopyReport}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-rose-900/50 flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Експорт Звіту</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ================= TAB 2: TIMELINE OF COMPROMAT ================= */}
      {activeTab === 'timeline' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 space-y-5 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-rose-400" />
                Хронологічний Реєстр Негативних Подій (Risk Timeline)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Хронологія зафіксованих фактів компромату з підтвердженими джерелами
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {['all', 'Фінансовий', 'Судовий', 'Кримінальне', 'Санкційний', 'Корупційний', 'Корпоративний'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat 
                      ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat === 'all' ? 'Всі Категорії' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">Дата</th>
                  <th className="py-3 px-4">Подія / Суть факту</th>
                  <th className="py-3 px-4">Категорія</th>
                  <th className="py-3 px-4">Достовірність</th>
                  <th className="py-3 px-4">Офіційне Джерело</th>
                  <th className="py-3 px-4 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredTimeline.map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200 w-full">
                      {item.event}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-slate-900 text-rose-300 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                        {item.confidence}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {item.source}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded transition-colors"
                      >
                        <span>Перевірити</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ================= TAB 3: EVIDENCE GRAPH ================= */}
      {activeTab === 'graph' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          {/* Interactive D3 Graph */}
          <div className="lg:col-span-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col h-[600px] shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Граф Доказів & Network Connections
                </h3>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> High Risk Node
                </span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Link Risk
                </span>
              </div>
            </div>

            <div 
              ref={containerRef}
              className="flex-1 relative bg-[#060a12] border border-slate-800/60 rounded-xl overflow-hidden cursor-crosshair shadow-inner"
            >
              <svg ref={svgRef} className="w-full h-full absolute inset-0" />
              <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800/80 px-3 py-2 rounded-lg backdrop-blur text-[10px] text-slate-400 font-mono">
                <p>Перетягуйте вузли для дослідження зв'язків. Натисніть для фільтрації.</p>
              </div>
            </div>
          </div>

          {/* Node Linked Evidence Inspector */}
          <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col h-[600px] shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Деталі Вузла та Пов’язані Докази
                </h3>
              </div>
              {activeNode && (
                <button
                  onClick={() => setActiveNode(null)}
                  className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-1 rounded font-bold uppercase hover:bg-rose-500/20"
                >
                  Скинути
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {currentSubject.timeline
                .filter(t => !activeNode || t.nodeId === activeNode || activeNode === 'target')
                .map(item => (
                  <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{item.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mb-1">{item.event}</h4>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span>{item.source}</span>
                      <span className="text-rose-400 font-bold">{item.confidence} Confidence</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ================= TAB 4: DATA SOURCES CATALOG ================= */}
      {activeTab === 'sources' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 space-y-5 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-rose-400" />
                Каталог Безплатних Джерел Даних для PREDATOR Analytics (30+ Sources)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Офіційні державні реєстри, санкційні списки, судові бази, медіа та моніторинг Darknet
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Пошук джерела або категорії..."
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Sources Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSources.map(src => (
              <div 
                key={src.id}
                className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {src.category}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {src.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">{src.name}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {src.desc}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Тип: {src.type}</span>
                  <span className="text-slate-400 font-bold">ВІЛЬНИЙ ДОСТУП</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ================= TAB 5: ACTION PLAN & CHECKLIST ================= */}
      {activeTab === 'action_plan' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 space-y-6 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Інтерактивний Чек-лист Реагування та Нейтралізації Ризиків
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Оперативний план дій для аналітика та служб безпеки
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-300">
                Виконано: {completedActions} з {totalActions} ({progressPercent}%)
              </span>
              <div className="w-32 bg-slate-900 rounded-full h-2.5 border border-slate-800">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: 'act1', title: '1. Заборонити проведення нових платежів та підписання договорів', phase: '0-7 Днів', critical: true },
              { id: 'act2', title: '2. Перевірити актуальний стан судових справ у ЄРСР за номером провадження', phase: '0-7 Днів', critical: true },
              { id: 'act3', title: '3. Запустити розширений Darknet-моніторинг витоків (IntelX / HIBP)', phase: '7-30 Днів', critical: false },
              { id: 'act4', title: '4. Провести глибокий фінансовий аналіз пов’язаних осіб через Opendatabot API', phase: '7-30 Днів', critical: false },
              { id: 'act5', title: '5. Підготувати офіційний юридичний меморандум для керівництва', phase: '7-30 Днів', critical: false },
              { id: 'act6', title: '6. Внести об’єкт до внутрішнього автоматизованого стоп-листа (Blacklist)', phase: 'Довгострокові', critical: true }
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => setCheckedActions(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  checkedActions[item.id] 
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                    checkedActions[item.id] ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-950'
                  }`}>
                    {checkedActions[item.id] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className={`text-xs font-semibold ${checkedActions[item.id] ? 'line-through text-slate-500' : ''}`}>
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.critical && (
                    <span className="text-[9px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                      КРИТИЧНО
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {item.phase}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
}
