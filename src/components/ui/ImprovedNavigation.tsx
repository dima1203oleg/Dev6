/**
 * Покращена навігація PREDATOR Analytics
 * Кращий UX, інтуїтивно зрозумілий інтерфейс
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Shield,
  Cpu,
  Search,
  UserCheck,
  Network,
  Map,
  Database,
  Settings,
  ShieldAlert,
  Activity,
  ChevronRight,
  ChevronDown,
  Globe,
  Bot,
  FileText,
  Calendar,
  Wrench,
  Layers,
  BookOpen,
  Briefcase,
  Truck,
  TrendingUp,
  Users,
  Terminal,
  Camera,
  Sparkles,
  HelpCircle,
  X,
  Menu,
  Lock,
  Radio,
} from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number;
  description?: string;
  category?: string;
}

interface NavCategory {
  id: string;
  label: string;
  items: NavItem[];
}

interface ImprovedNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  ecosystem: 'user' | 'admin';
  onEcosystemChange: (ecosystem: 'user' | 'admin') => void;
  mobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
}

export default function ImprovedNavigation({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  ecosystem,
  onEcosystemChange,
  mobileMenuOpen,
  onMobileMenuClose,
}: ImprovedNavigationProps) {
  const t = useTranslation();
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set(['main', 'search', 'analysis']));

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const userNavCategories: NavCategory[] = [
    {
      id: 'main',
      label: 'Головне',
      items: [
        {
          id: 'dashboard',
          label: t.navigation.dashboard,
          icon: LayoutDashboard,
          description: 'Огляд системи та статистика',
        },
        {
          id: 'mlip-modules',
          label: t.navigation.mlipModules,
          icon: Shield,
          badge: 'NEW',
          description: 'MLIP Intelligence модулі',
        },
        {
          id: 'live-analytical-center',
          label: t.navigation.liveAnalyticalCenter,
          icon: Cpu,
          description: 'Живе ШІ-ядро NEXUS',
        },
      ],
    },
    {
      id: 'search',
      label: 'Інструменти пошуку',
      items: [
        {
          id: 'predator-intel',
          label: t.navigation.predatorIntel,
          icon: ShieldAlert,
          badge: '★',
          description: 'PREDATOR Intelligence',
        },
        {
          id: 'ckan-explorer',
          label: t.navigation.ckanExplorer,
          icon: Database,
          description: 'Державні реєстри України',
        },
        {
          id: 'osint',
          label: t.navigation.osintWorkbench,
          icon: Search,
          description: 'Глобальний пошук OSINT',
        },
        {
          id: 'person-profiler',
          label: t.navigation.personProfiler,
          icon: UserCheck,
          description: 'Перевірка та досьє осіб',
        },
        {
          id: 'media-forensics',
          label: t.navigation.mediaForensics,
          icon: Camera,
          description: 'Аналіз медіа контенту',
        },
      ],
    },
    {
      id: 'analysis',
      label: 'Аналіз та зв\'язки',
      items: [
        {
          id: 'sandbox',
          label: t.navigation.sandbox,
          icon: Network,
          description: 'Граф зв\'язків',
        },
        {
          id: 'maps',
          label: t.navigation.maps,
          icon: Map,
          description: 'Геопросторова карта',
        },
        {
          id: 'gap',
          label: t.navigation.gapAnalysis,
          icon: Wrench,
          description: 'Аналіз прогалин та ризиків',
        },
      ],
    },
    {
      id: 'docs',
      label: 'Документація',
      items: [
        {
          id: 'architecture',
          label: t.navigation.architecture,
          icon: Layers,
          description: 'Граф архітектури',
        },
        {
          id: 'roadmap',
          label: t.navigation.roadmap,
          icon: Calendar,
          description: 'Дорожня карта',
        },
        {
          id: 'volumes',
          label: t.navigation.volumes,
          icon: FileText,
          description: 'Томи ТЗ',
        },
        {
          id: 'advisor',
          label: t.navigation.advisor,
          icon: Bot,
          description: 'ШІ-архітектор',
        },
        {
          id: 'catalog',
          label: t.navigation.catalog,
          icon: BookOpen,
          description: 'Каталог рішень',
        },
        {
          id: 'license',
          label: t.navigation.license,
          icon: ShieldAlert,
          description: 'Сумісність ліцензій',
        },
      ],
    },
    {
      id: 'enterprise',
      label: 'Enterprise Certification',
      items: [
        {
          id: 'enterprise-dashboard',
          label: 'Enterprise Dashboard',
          icon: Lock,
          badge: 'v2.0',
          description: 'Continuous Production Certification',
        },
        {
          id: 'live-monitoring',
          label: 'Live Monitoring',
          icon: Radio,
          description: 'Real-time system monitoring',
        },
      ],
    },
  ];

  const adminNavCategories: NavCategory[] = [
    {
      id: 'admin',
      label: 'Адміністрування',
      items: [
        {
          id: 'admin-back-office',
          label: t.navigation.adminBackOffice,
          icon: Settings,
          description: 'Back Office консоль',
        },
        {
          id: 'predator-control',
          label: t.navigation.predatorControl,
          icon: ShieldAlert,
          description: 'Панель PREDATOR',
        },
        {
          id: 'data-ingestion',
          label: t.navigation.dataIngestion,
          icon: Database,
          description: 'Завантаження даних',
        },
        {
          id: 'audit-log',
          label: t.navigation.auditLog,
          icon: Activity,
          description: 'Журнал аудиту',
        },
        {
          id: 'autonomous-factory',
          label: t.navigation.autonomousFactory,
          icon: Cpu,
          description: 'Автономна фабрика',
        },
      ],
    },
    {
      id: 'infra',
      label: 'Інфраструктура',
      items: [
        {
          id: 'architecture',
          label: t.navigation.architecture,
          icon: Layers,
          description: 'Граф залежностей',
        },
        {
          id: 'gap',
          label: t.navigation.gapAnalysis,
          icon: Wrench,
          description: 'Аналіз прогалин',
        },
        {
          id: 'roadmap',
          label: t.navigation.roadmap,
          icon: Calendar,
          description: 'Дорожня карта',
        },
        {
          id: 'catalog',
          label: t.navigation.catalog,
          icon: BookOpen,
          description: 'Каталог рішень',
        },
        {
          id: 'license',
          label: t.navigation.license,
          icon: ShieldAlert,
          description: 'Сумісність ліцензій',
        },
        {
          id: 'volumes',
          label: t.navigation.volumes,
          icon: FileText,
          description: 'Томи ТЗ',
        },
        {
          id: 'advisor',
          label: t.navigation.advisor,
          icon: Bot,
          description: 'ШІ-архітектор',
        },
      ],
    },
  ];

  const categories = ecosystem === 'user' ? userNavCategories : adminNavCategories;

  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <motion.button
        key={item.id}
        onClick={() => {
          onTabChange(item.id);
          if (isMobile) onMobileMenuClose();
        }}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full text-left group relative overflow-hidden rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          isActive
            ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 text-blue-400'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
        }`}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative flex items-center gap-3 px-3 py-2.5">
          <div className={`relative shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} aria-hidden="true">
            <Icon className="w-5 h-5" />
            {item.badge && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-blue-500 text-white rounded-full" aria-label={`Badge: ${item.badge}`}>
                {item.badge}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{item.label}</div>
            {!collapsed && item.description && (
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.description}</div>
            )}
          </div>
          {isActive && !collapsed && (
            <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
          )}
        </div>
      </motion.button>
    );
  };

  const renderCategory = (category: NavCategory, isMobile: boolean = false) => {
    const isExpanded = expandedCategories.has(category.id);
    const Icon = isExpanded ? ChevronDown : ChevronRight;

    return (
      <div key={category.id} className="space-y-1">
        <button
          onClick={() => toggleCategory(category.id)}
          aria-expanded={isExpanded}
          aria-controls={`category-${category.id}`}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg"
        >
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{category.label}</span>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              id={`category-${category.id}`}
              role="group"
              aria-label={`${category.label} items`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-0.5 pl-2"
            >
              {category.items.map((item) => renderNavItem(item, isMobile))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Mobile drawer
  if (mobileMenuOpen) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onMobileMenuClose}
          className="fixed inset-0 bg-black z-50"
        />
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 bottom-0 w-[320px] bg-slate-900 border-r border-slate-800 shadow-2xl z-50 flex flex-col overflow-y-auto"
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center font-bold text-white text-lg">
                P
              </div>
              <div>
                <h2 className="text-base font-bold tracking-wide text-slate-200">
                  PREDATOR
                </h2>
                <p className="text-xs text-slate-500">Analytics Platform</p>
              </div>
            </div>
            <button
          onClick={onMobileMenuClose}
          aria-label="Close menu"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <X className="w-5 h-5" />
        </button>
          </div>

          <div className="p-4 space-y-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Простір управління
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onEcosystemChange('user');
                  onTabChange('live-analytical-center');
                }}
                aria-pressed={ecosystem === 'user'}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  ecosystem === 'user'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Користувач
              </button>
              <button
                onClick={() => {
                  onEcosystemChange('admin');
                  onTabChange('admin-back-office');
                }}
                aria-pressed={ecosystem === 'admin'}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  ecosystem === 'admin'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Адміністратор
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {categories.map((category) => renderCategory(category, true))}
          </div>

          <div className="p-4 border-t border-slate-800">
            <button 
              aria-label="Help"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
              <span>Довідка</span>
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={`flex flex-col bg-slate-900/95 backdrop-blur-md border-r border-slate-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/25">
              P
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide text-slate-200">
                PREDATOR
              </h2>
              <p className="text-[10px] text-slate-500">Analytics Platform</p>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/25 mx-auto">
            P
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Ecosystem Selector */}
      {!collapsed && (
        <div className="p-4 space-y-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Простір управління
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onEcosystemChange('user');
                onTabChange('live-analytical-center');
              }}
              aria-pressed={ecosystem === 'user'}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                ecosystem === 'user'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Користувач
            </button>
            <button
              onClick={() => {
                onEcosystemChange('admin');
                onTabChange('admin-back-office');
              }}
              aria-pressed={ecosystem === 'admin'}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                ecosystem === 'admin'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Адмін
            </button>
          </div>
        </div>
      )}

      {/* Navigation Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {categories.map((category) => renderCategory(category))}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <button 
            aria-label="Help"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
            <span>Довідка</span>
          </button>
        </div>
      )}
    </aside>
  );
}
