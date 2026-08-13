/**
 * Система локалізації PREDATOR Analytics
 * Підтримка української мови
 */

export type Language = 'uk' | 'en';

export interface Translations {
  // Загальні
  common: {
    search: string;
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    view: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    open: string;
    submit: string;
    refresh: string;
    download: string;
    upload: string;
    export: string;
    import: string;
    filter: string;
    sort: string;
    clear: string;
    select: string;
    deselect: string;
    all: string;
    none: string;
    yes: string;
    no: string;
    or: string;
    and: string;
    of: string;
    to: string;
    from: string;
    at: string;
    in: string;
    on: string;
    by: string;
    with: string;
    for: string;
  };
  
  // Навігація
  navigation: {
    dashboard: string;
    liveAnalyticalCenter: string;
    osintWorkbench: string;
    personProfiler: string;
    architecture: string;
    gapAnalysis: string;
    roadmap: string;
    volumes: string;
    advisor: string;
    sandbox: string;
    mediaForensics: string;
    dataIngestion: string;
    adminBackOffice: string;
    autonomousFactory: string;
    predatorControl: string;
    investigationWorkspace: string;
    auditLog: string;
    masterSpecification: string;
    mlipModules: string;
    predatorIntel: string;
    ckanExplorer: string;
    maps: string;
    catalog: string;
    license: string;
  };
  
  // Дашборд
  dashboard: {
    title: string;
    subtitle: string;
    overview: string;
    statistics: string;
    recentActivity: string;
    quickActions: string;
    alerts: string;
    systemStatus: string;
    performance: string;
    security: string;
    compliance: string;
  };
  
  // OSINT
  osint: {
    title: string;
    searchPlaceholder: string;
    searchResults: string;
    noResults: string;
    entityDetails: string;
    riskLevel: string;
    sanctions: string;
    connections: string;
    timeline: string;
    documents: string;
    assets: string;
    addresses: string;
    licenses: string;
    courtCases: string;
    procurement: string;
    taxDeclarations: string;
    aiAnalysis: string;
  };
  
  // Ризики
  risk: {
    title: string;
    high: string;
    medium: string;
    low: string;
    critical: string;
    riskScore: string;
    riskFactors: string;
    mitigation: string;
    recommendation: string;
  };
  
  // Санкції
  sanctions: {
    title: string;
    sanctioned: string;
    notSanctioned: string;
    underReview: string;
    sanctionedBy: string;
    sanctionDate: string;
    sanctionReason: string;
    sanctionType: string;
  };
  
  // Аудит
  audit: {
    title: string;
    log: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
    status: string;
  };
  
  // Адміністрування
  admin: {
    title: string;
    users: string;
    roles: string;
    permissions: string;
    settings: string;
    configuration: string;
    monitoring: string;
    logs: string;
    backup: string;
    restore: string;
  };
  
  // Специфікація
  specification: {
    title: string;
    version: string;
    status: string;
    components: string;
    requirements: string;
    implementation: string;
    testing: string;
    deployment: string;
  };
  
  // Повідомлення
  messages: {
    welcome: string;
    loadingData: string;
    noDataAvailable: string;
    operationSuccess: string;
    operationFailed: string;
    confirmDelete: string;
    confirmAction: string;
    unsavedChanges: string;
    networkError: string;
    serverError: string;
    permissionDenied: string;
    sessionExpired: string;
  };
  
  // Часові періоди
  time: {
    today: string;
    yesterday: string;
    thisWeek: string;
    thisMonth: string;
    thisYear: string;
    lastWeek: string;
    lastMonth: string;
    lastYear: string;
    custom: string;
  };
  
  // Статуси
  status: {
    active: string;
    inactive: string;
    pending: string;
    completed: string;
    failed: string;
    cancelled: string;
    processing: string;
    queued: string;
  };
}

export const translations: Record<Language, Translations> = {
  uk: {
    common: {
      search: 'Пошук',
      loading: 'Завантаження...',
      error: 'Помилка',
      success: 'Успішно',
      cancel: 'Скасувати',
      save: 'Зберегти',
      delete: 'Видалити',
      edit: 'Редагувати',
      view: 'Переглянути',
      back: 'Назад',
      next: 'Далі',
      previous: 'Попередній',
      close: 'Закрити',
      open: 'Відкрити',
      submit: 'Надіслати',
      refresh: 'Оновити',
      download: 'Завантажити',
      upload: 'Завантажити',
      export: 'Експортувати',
      import: 'Імпортувати',
      filter: 'Фільтр',
      sort: 'Сортування',
      clear: 'Очистити',
      select: 'Вибрати',
      deselect: 'Скасувати вибір',
      all: 'Всі',
      none: 'Жоден',
      yes: 'Так',
      no: 'Ні',
      or: 'або',
      and: 'та',
      of: 'з',
      to: 'до',
      from: 'від',
      at: 'о',
      in: 'в',
      on: 'на',
      by: 'за',
      with: 'з',
      for: 'для',
    },
    navigation: {
      dashboard: 'Дашборд',
      liveAnalyticalCenter: 'Живе ШІ-Ядро',
      osintWorkbench: 'OSINT Робочий Стіл',
      personProfiler: 'Перевірка та Досьє Осіб',
      architecture: 'Граф архітектури',
      gapAnalysis: 'Аналіз прогалин та ризиків',
      roadmap: 'Дорожня карта',
      volumes: 'Томи ТЗ',
      advisor: 'ШІ-Архітектор',
      sandbox: 'Аналітична пісочниця',
      mediaForensics: 'Аналіз медіа',
      dataIngestion: 'Завантаження даних',
      adminBackOffice: 'Адмін-консоль',
      autonomousFactory: 'Автономна фабрика',
      predatorControl: 'Панель PREDATOR',
      investigationWorkspace: 'Робочий простір розслідування',
      auditLog: 'Журнал аудиту',
      masterSpecification: 'Майстер-специфікація',
      mlipModules: 'MLIP Intelligence',
      predatorIntel: 'PREDATOR Intelligence',
      ckanExplorer: 'Державні реєстри',
      maps: 'Геопросторова карта',
      catalog: 'Каталог рішень',
      license: 'Сумісність ліцензій',
    },
    dashboard: {
      title: 'Інтерактивний Дашборд',
      subtitle: 'Огляд системи PREDATOR Analytics',
      overview: 'Огляд',
      statistics: 'Статистика',
      recentActivity: 'Остання активність',
      quickActions: 'Швидкі дії',
      alerts: 'Сповіщення',
      systemStatus: 'Стан системи',
      performance: 'Продуктивність',
      security: 'Безпека',
      compliance: 'Комплаєнс',
    },
    osint: {
      title: 'OSINT Робочий Стіл',
      searchPlaceholder: 'Введіть назву компанії, код ЄДРПОУ або особи...',
      searchResults: 'Результати пошуку',
      noResults: 'Результатів не знайдено',
      entityDetails: 'Деталі об\'єкта',
      riskLevel: 'Рівень ризику',
      sanctions: 'Санкції',
      connections: 'Зв\'язки',
      timeline: 'Хронологія',
      documents: 'Документи',
      assets: 'Активи',
      addresses: 'Адреси',
      licenses: 'Ліцензії',
      courtCases: 'Судові справи',
      procurement: 'Державні закупівлі',
      taxDeclarations: 'Податкові декларації',
      aiAnalysis: 'ШІ-аналіз',
    },
    risk: {
      title: 'Аналіз ризиків',
      high: 'Високий',
      medium: 'Середній',
      low: 'Низький',
      critical: 'Критичний',
      riskScore: 'Оцінка ризику',
      riskFactors: 'Фактори ризику',
      mitigation: 'Пом\'якшення',
      recommendation: 'Рекомендація',
    },
    sanctions: {
      title: 'Санкції',
      sanctioned: 'Під санкціями',
      notSanctioned: 'Не під санкціями',
      underReview: 'На розгляді',
      sanctionedBy: 'Санкції накладені',
      sanctionDate: 'Дата санкції',
      sanctionReason: 'Причина санкції',
      sanctionType: 'Тип санкції',
    },
    audit: {
      title: 'Журнал аудиту',
      log: 'Журнал',
      timestamp: 'Час',
      user: 'Користувач',
      action: 'Дія',
      details: 'Деталі',
      status: 'Статус',
    },
    admin: {
      title: 'Адміністрування',
      users: 'Користувачі',
      roles: 'Ролі',
      permissions: 'Дозволи',
      settings: 'Налаштування',
      configuration: 'Конфігурація',
      monitoring: 'Моніторинг',
      logs: 'Журнали',
      backup: 'Резервне копіювання',
      restore: 'Відновлення',
    },
    specification: {
      title: 'Специфікація',
      version: 'Версія',
      status: 'Статус',
      components: 'Компоненти',
      requirements: 'Вимоги',
      implementation: 'Реалізація',
      testing: 'Тестування',
      deployment: 'Розгортання',
    },
    messages: {
      welcome: 'Вітаємо в PREDATOR Analytics',
      loadingData: 'Завантаження даних...',
      noDataAvailable: 'Дані недоступні',
      operationSuccess: 'Операція виконана успішно',
      operationFailed: 'Операція не вдалася',
      confirmDelete: 'Ви впевнені, що хочете видалити?',
      confirmAction: 'Підтвердити дію?',
      unsavedChanges: 'Є незбережені зміни',
      networkError: 'Помилка мережі',
      serverError: 'Помилка сервера',
      permissionDenied: 'Доступ заборонено',
      sessionExpired: 'Сесія закінчилася',
    },
    time: {
      today: 'Сьогодні',
      yesterday: 'Вчора',
      thisWeek: 'Цього тижня',
      thisMonth: 'Цього місяця',
      thisYear: 'Цього року',
      lastWeek: 'Минулого тижня',
      lastMonth: 'Минулого місяця',
      lastYear: 'Минулого року',
      custom: 'Власний період',
    },
    status: {
      active: 'Активний',
      inactive: 'Неактивний',
      pending: 'Очікує',
      completed: 'Завершено',
      failed: 'Не вдалося',
      cancelled: 'Скасовано',
      processing: 'Обробка',
      queued: 'У черзі',
    },
  },
  en: {
    common: {
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      open: 'Open',
      submit: 'Submit',
      refresh: 'Refresh',
      download: 'Download',
      upload: 'Upload',
      export: 'Export',
      import: 'Import',
      filter: 'Filter',
      sort: 'Sort',
      clear: 'Clear',
      select: 'Select',
      deselect: 'Deselect',
      all: 'All',
      none: 'None',
      yes: 'Yes',
      no: 'No',
      or: 'or',
      and: 'and',
      of: 'of',
      to: 'to',
      from: 'from',
      at: 'at',
      in: 'in',
      on: 'on',
      by: 'by',
      with: 'with',
      for: 'for',
    },
    navigation: {
      dashboard: 'Dashboard',
      liveAnalyticalCenter: 'Live AI Core',
      osintWorkbench: 'OSINT Workbench',
      personProfiler: 'Person Profiler',
      architecture: 'Architecture Graph',
      gapAnalysis: 'Gap Analysis',
      roadmap: 'Roadmap',
      volumes: 'Volumes',
      advisor: 'AI Architect',
      sandbox: 'Investigation Sandbox',
      mediaForensics: 'Media Forensics',
      dataIngestion: 'Data Ingestion',
      adminBackOffice: 'Admin Console',
      autonomousFactory: 'Autonomous Factory',
      predatorControl: 'PREDATOR Control',
      investigationWorkspace: 'Investigation Workspace',
      auditLog: 'Audit Log',
      masterSpecification: 'Master Specification',
      mlipModules: 'MLIP Intelligence',
      predatorIntel: 'PREDATOR Intelligence',
      ckanExplorer: 'CKAN Explorer',
      maps: 'Geospatial Map',
      catalog: 'Solution Catalog',
      license: 'License Compatibility',
    },
    dashboard: {
      title: 'Interactive Dashboard',
      subtitle: 'PREDATOR Analytics System Overview',
      overview: 'Overview',
      statistics: 'Statistics',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      alerts: 'Alerts',
      systemStatus: 'System Status',
      performance: 'Performance',
      security: 'Security',
      compliance: 'Compliance',
    },
    osint: {
      title: 'OSINT Workbench',
      searchPlaceholder: 'Enter company name, EDRPOU code or person...',
      searchResults: 'Search Results',
      noResults: 'No results found',
      entityDetails: 'Entity Details',
      riskLevel: 'Risk Level',
      sanctions: 'Sanctions',
      connections: 'Connections',
      timeline: 'Timeline',
      documents: 'Documents',
      assets: 'Assets',
      addresses: 'Addresses',
      licenses: 'Licenses',
      courtCases: 'Court Cases',
      procurement: 'Procurement',
      taxDeclarations: 'Tax Declarations',
      aiAnalysis: 'AI Analysis',
    },
    risk: {
      title: 'Risk Analysis',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      critical: 'Critical',
      riskScore: 'Risk Score',
      riskFactors: 'Risk Factors',
      mitigation: 'Mitigation',
      recommendation: 'Recommendation',
    },
    sanctions: {
      title: 'Sanctions',
      sanctioned: 'Sanctioned',
      notSanctioned: 'Not Sanctioned',
      underReview: 'Under Review',
      sanctionedBy: 'Sanctioned By',
      sanctionDate: 'Sanction Date',
      sanctionReason: 'Sanction Reason',
      sanctionType: 'Sanction Type',
    },
    audit: {
      title: 'Audit Log',
      log: 'Log',
      timestamp: 'Timestamp',
      user: 'User',
      action: 'Action',
      details: 'Details',
      status: 'Status',
    },
    admin: {
      title: 'Administration',
      users: 'Users',
      roles: 'Roles',
      permissions: 'Permissions',
      settings: 'Settings',
      configuration: 'Configuration',
      monitoring: 'Monitoring',
      logs: 'Logs',
      backup: 'Backup',
      restore: 'Restore',
    },
    specification: {
      title: 'Specification',
      version: 'Version',
      status: 'Status',
      components: 'Components',
      requirements: 'Requirements',
      implementation: 'Implementation',
      testing: 'Testing',
      deployment: 'Deployment',
    },
    messages: {
      welcome: 'Welcome to PREDATOR Analytics',
      loadingData: 'Loading data...',
      noDataAvailable: 'No data available',
      operationSuccess: 'Operation successful',
      operationFailed: 'Operation failed',
      confirmDelete: 'Are you sure you want to delete?',
      confirmAction: 'Confirm action?',
      unsavedChanges: 'There are unsaved changes',
      networkError: 'Network error',
      serverError: 'Server error',
      permissionDenied: 'Permission denied',
      sessionExpired: 'Session expired',
    },
    time: {
      today: 'Today',
      yesterday: 'Yesterday',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisYear: 'This Year',
      lastWeek: 'Last Week',
      lastMonth: 'Last Month',
      lastYear: 'Last Year',
      custom: 'Custom Period',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      processing: 'Processing',
      queued: 'Queued',
    },
  },
};

// React Context для локалізації
import { createContext, useContext, useState, ReactNode } from 'react';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('uk');

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

// Хук для зручного доступу до перекладів
export function useTranslation() {
  const { t } = useI18n();
  return t;
}
