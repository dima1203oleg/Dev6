export const SIDEBAR_GROUPS = [
  {
    id: "analytics",
    label: "Аналітика (реальні дані)",
    items: [
      { id: "dashboard", label: "Аналітичний дашборд", badge: "НАЖИВО", badgeColor: "emerald" },
      { id: "procurement", label: "Публічні закупівлі", badge: "НАЖИВО", badgeColor: "emerald" },
      { id: "open-data", label: "Відкриті дані", badge: "НАЖИВО", badgeColor: "emerald" },
      { id: "entity-profile", label: "Досьє суб'єкта", badge: "НАЖИВО", badgeColor: "emerald" },
      { id: "source-status", label: "Стан джерел", badge: "НАЖИВО", badgeColor: "emerald" },
    ],
  },
  {
    id: "integrations",
    label: "Інтеграції (потребують ключів)",
    items: [
      { id: "advisor", label: "AI-радник (GEMINI_API_KEY)", badge: "КЛЮЧ", badgeColor: "indigo" },
      { id: "media-forensics", label: "Медіа-форензика (GEMINI_API_KEY)", badge: "КЛЮЧ", badgeColor: "indigo" },
      { id: "opendatabot", label: "Opendatabot (OPENDATABOT_API_KEY)", badge: "КЛЮЧ", badgeColor: "indigo" },
      { id: "youscore", label: "YouScore (YOUSCORE_API_KEY)", badge: "КЛЮЧ", badgeColor: "indigo" },
    ],
  },
  {
    id: "documentation",
    label: "Документація",
    items: [
      { id: "architecture", label: "Архітектура", badge: "", badgeColor: "" },
      { id: "catalog", label: "Каталог", badge: "", badgeColor: "" },
      { id: "license", label: "Ліцензії", badge: "", badgeColor: "" },
      { id: "master-specification", label: "Майстер-специфікація", badge: "", badgeColor: "" },
      { id: "roadmap", label: "Дорожня карта", badge: "", badgeColor: "" },
      { id: "volumes", label: "Обсяги", badge: "", badgeColor: "" },
    ],
  },
];
