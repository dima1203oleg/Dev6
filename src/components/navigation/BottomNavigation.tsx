/**
 * BottomNavigation — Mobile-only navigation bar
 * 
 * Displayed only on phone-class devices. Uses CSS .phone-bottom-nav
 * which is hidden on tablet+ via media queries.
 * 
 * Respects iOS safe-area-inset-bottom for home indicator clearance.
 */
import React from 'react';
import { Search, Users, Network, Bell, User } from 'lucide-react';

export type MobileTab = 'search' | 'entities' | 'graph' | 'alerts' | 'profile';

interface BottomNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  alertCount?: number;
}

const tabs: { id: MobileTab; label: string; icon: React.ElementType }[] = [
  { id: 'search', label: 'Пошук', icon: Search },
  { id: 'entities', label: "Об'єкти", icon: Users },
  { id: 'graph', label: 'Граф', icon: Network },
  { id: 'alerts', label: 'Сповіщення', icon: Bell },
  { id: 'profile', label: 'Профіль', icon: User },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  alertCount = 0,
}) => {
  return (
    <nav className="bottom-nav phone-bottom-nav" role="navigation" aria-label="Головна навігація">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {tab.id === 'alerts' && alertCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
