import React, { useState } from 'react';
import { CommandBar } from '../CommandBar';
import { Dossier } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
  onSelectEntity: (dossier: Dossier) => void;
}

export function AppLayout({ children, sidebar, header, onSelectEntity }: AppLayoutProps) {
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandBarOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden text-slate-800 dark:text-slate-100">
      {/* Sidebar */}
      {sidebar}
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        {header}
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>

      <CommandBar 
        isOpen={commandBarOpen} 
        onClose={() => setCommandBarOpen(false)} 
        onSelectEntity={(entity) => {
          onSelectEntity(entity);
          setCommandBarOpen(false);
        }} 
      />
    </div>
  );
}
