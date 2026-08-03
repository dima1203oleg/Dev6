/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSourceSolution } from "./types";

export const SOLUTIONS: OpenSourceSolution[] = [
  {
    id: "s1",
    name: "Core Intelligence",
    description: "Base intelligence services",
    url: "#",
    category: "Core",
    techStack: ["Node.js", "TypeScript"],
    compatibilityScore: 95,
    advantages: ["Fast", "Reliable"],
    disadvantages: ["Complex"],
    role: "Backend",
    securityRating: "A",
    licenseType: "Permissive",
    productionReady: "Tak",
    license: "Apache-2.0",
  },
  {
    id: "s2",
    name: "Network Analysis",
    description: "Relationship graph services",
    url: "#",
    category: "Analytics",
    techStack: ["D3.js", "React"],
    compatibilityScore: 88,
    advantages: ["Visual", "Intuitive"],
    disadvantages: ["High RAM"],
    role: "Frontend",
    securityRating: "B",
    licenseType: "Permissive",
    productionReady: "Tak",
    license: "MIT",
  },
];

export const GAP_ITEMS = [];
export const ROADMAP_PHASES = [
  {
    id: "phase1",
    title: "Етап 1: Базова інтеграція реєстрів та нормалізація",
    timeframe: "Місяці 1 - 3",
    focus:
      "Підключення живих коннекторів YouScore та Opendatabot, створення єдиної схеми даних та нормалізація ідентифікаторів (РНОКПП, ЄДРПОУ).",
    components: ["YouScoreConnector", "OpendatabotConnector", "NormalizationEngine", "CircuitBreaker"],
    milestones: [
      { text: "Реалізація живих коннекторів API YouScore & Opendatabot", done: true },
      { text: "Впровадження схеми дводжерельної верифікації Level 1 / Level 2", done: true },
      { text: "Автоматичний роутинг помилок та Circuit Breaker", done: true },
      { text: "Приховування API ключів у backend runtime", done: true },
    ],
    risks: ["Тимчасова недоступність зовнішніх реєстрів", "Обмеження лімітів запитів (Rate limit 429)"],
    gpuRequirements: "Не потрібно (базовий backend API)",
  },
  {
    id: "phase2",
    title: "Етап 2: Розширене Entity Resolution & Граф зв’язків",
    timeframe: "Місяці 4 - 6",
    focus:
      "Побудова повноцінного графу зв’язків між контрагентами, запобігання помилковому об’єднанню гомонімів за ПІБ, виявлення непрямих зв’язків.",
    components: ["EntityResolutionEngine", "InteractiveGraphVisualizer", "ProvenanceAuditLogger"],
    milestones: [
      { text: "Розділення статусів MATCH, POSSIBLE_MATCH, MANUAL_REVIEW", done: true },
      { text: "Побудова графа зв’язків Компанія-ФОП-Особа-Авто", done: true },
      { text: "Модуль доказів (Evidence/Provenance modal)", done: true },
      { text: "Деталізовані картки судовищ та виконавчих проваджень", done: true },
    ],
    risks: ["Недостатність однозначних ідентифікаторів у гомонімів", "Складні циклічні зв’язки у великих корпораціях"],
    gpuRequirements: "2GB VRAM для векторного пошуку графу",
  },
  {
    id: "phase3",
    title: "Етап 3: ШІ-Аналітика та RAG Пошук по досьє",
    timeframe: "Місяці 7 - 9",
    focus:
      "Впровадження Gemini API та локальних LLM для автоматичного виявлення аномалій, ризиків та генерації комплаєнс-висновків без галюцинацій.",
    components: ["GeminiRAGService", "AnomalyDetector", "RiskScoringEngine"],
    milestones: [
      { text: "Інтеграція Gemini для узагальнення фактів з джерел", done: true },
      { text: "Вимога чітких посилань на джерела у ШІ висновках", done: true },
      { text: "Аналіз тексту судових рішень та санкційних списків", done: true },
      { text: "Локальний кєш аналітичних звітів з контролем свіжості", done: true },
    ],
    risks: [
      "Ризик некоректної інтерпретації юр. термінів ШІ-моделлю",
      "Високі затримки при обробці великих векторних індексів",
    ],
    gpuRequirements: "16GB VRAM (Llama 3 / Gemini proxy)",
  },
  {
    id: "phase4",
    title: "Етап 4: Автоматичний моніторинг та алертинг",
    timeframe: "Місяці 10 - 11",
    focus:
      "Підписка на зміни в реєстрах щодо відстежуваних суб’єктів, Push/Webhook сповіщення про нові судові справи, боги або зміну власників.",
    components: ["ChangeTrackerEngine", "NotificationHub", "AuditTrailExporter"],
    milestones: [
      { text: "Автоматичне періодичне оновлення даних у фоновому режимі", done: true },
      { text: "Сповіщення про появу нових виконавчих проваджень або штрафів", done: true },
      { text: "Експорт звітів у STX 2.1 та PDF з цифровим підписом", done: true },
      { text: "Фіксація журналів аудиту дій користувачів", done: true },
    ],
    risks: ["Високе навантаження на зовнішні API при масштабуванні списку моніторингу"],
    gpuRequirements: "Не потрібно",
  },
  {
    id: "phase5",
    title: "Етап 5: Повний Enterprise Production & Сканування медіа",
    timeframe: "Місяць 12",
    focus:
      "Аналіз мультимедіа та OSINT матеріалів, розгортання високодоступного кластера та проходження безпекового аудиту.",
    components: ["MediaForensicsPipeline", "EnterpriseHACluster", "SecurityShield"],
    milestones: [
      { text: "Модуль Media Forensics (аналіз автентичності зображень та документів)", done: true },
      { text: "Пентест та перевірка на витік секретів та API-ключів", done: true },
      { text: "Проходження повного циклу розгортання у Cloud Run / K8s", done: true },
      { text: "Підключення SLA моніторингу (P99, RPS, Error rate alerts)", done: true },
    ],
    risks: ["Необхідність регулярного оновлення моделей двобою з глибокими фейками"],
    gpuRequirements: "24GB - 48GB VRAM (docTR + faster-whisper + Media Pipeline)",
  },
];

export const LICENSE_MATRIX = [];
export const VOLUMES = [];

export const ARCHITECTURE_NODES = [];
export const ARCHITECTURE_EDGES = [];
