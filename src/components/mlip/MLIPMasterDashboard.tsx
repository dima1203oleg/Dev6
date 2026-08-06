import React, { useState } from 'react';
import { Globe, Shield, Activity, Fingerprint, Image as ImageIcon, Users } from 'lucide-react';

import { OSIModule } from './OSIModule';
import { COMINTModule } from './COMINTModule';
import { TECHINTModule } from './TECHINTModule';
import { MEDINTModule } from './MEDINTModule';
import { SOCINTModule } from './SOCINTModule';
import { DARKINTModule } from './DARKINTModule';

export const MLIPMasterDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('OSI');

  const tabs = [
    { id: 'OSI', label: 'OSI (Open Web)', icon: Globe },
    { id: 'COMINT', label: 'COMINT (Breaches)', icon: Fingerprint },
    { id: 'TECHINT', label: 'TECHINT (Infra)', icon: Activity },
    { id: 'SOCINT', label: 'SOCINT (Social)', icon: Users },
    { id: 'MEDINT', label: 'MEDINT (Media)', icon: ImageIcon },
    { id: 'DARKINT', label: 'DARKINT (DarkNet)', icon: Shield },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'OSI': return <OSIModule />;
      case 'COMINT': return <COMINTModule />;
      case 'TECHINT': return <TECHINTModule />;
      case 'SOCINT': return <SOCINTModule />;
      case 'MEDINT': return <MEDINTModule />;
      case 'DARKINT': return <DARKINTModule />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sidebar for MLIP Modules */}
      <div className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-700">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold flex items-center">
            <Shield className="w-5 h-5 mr-2 text-indigo-400" />
            MLIP Control
          </h2>
          <p className="text-xs text-slate-400 mt-1">Multi-Layer Intelligence Platform</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-3" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50 relative">
        <div className="max-w-6xl mx-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
