import React from "react";
import CatalogTab from "./components/CatalogTab";
import LicenseTab from "./components/LicenseTab";
import ArchitectureTab from "./components/ArchitectureTab";
import RoadmapTab from "./components/RoadmapTab";
import VolumesTab from "./components/VolumesTab";
import AdvisorTab from "./components/AdvisorTab";
import ProcurementAnalyticsTab from "./components/ProcurementAnalyticsTab";
import OpenDataAnalyticsTab from "./components/OpenDataAnalyticsTab";
import EntityProfileTab from "./components/EntityProfileTab";
import SourceStatusTab from "./components/SourceStatusTab";
import { MediaForensicsTab } from "./components/MediaForensicsTab";
import YouScoreTab from "./components/YouScoreTab";
import OpendatabotTab from "./components/OpendatabotTab";
import MasterSpecificationViewer from "./components/MasterSpecificationViewer";
import { SIDEBAR_GROUPS } from "./components/SidebarGroups";
import DashboardView from "./components/DashboardView";

type TabId =
  | "dashboard"
  | "procurement"
  | "open-data"
  | "entity-profile"
  | "source-status"
  | "advisor"
  | "media-forensics"
  | "opendatabot"
  | "youscore"
  | "architecture"
  | "catalog"
  | "license"
  | "master-specification"
  | "roadmap"
  | "volumes";

function Sidebar({ activeTab, onSelect }: { activeTab: TabId; onSelect: (tab: TabId) => void }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950/90 p-4 md:block">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">Predator Analytics</p>
        <p className="mt-1 text-xs text-slate-500">Enterprise Intelligence OS</p>
      </div>
      <nav className="space-y-6">
        {SIDEBAR_GROUPS.map((group) => (
          <section key={group.id}>
            <h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{group.label}</h2>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id as TabId)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    activeTab === item.id ? "bg-blue-600/20 text-blue-200" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && <span className="ml-2 text-[9px] text-slate-500">{item.badge}</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}

function TabContent({
  activeTab,
  selectedTenderId,
  onSelectTab,
}: {
  activeTab: TabId;
  selectedTenderId?: string;
  onSelectTab: (tab: string) => void;
}) {
  switch (activeTab) {
    case "dashboard":
      return <DashboardView onSelectTab={onSelectTab} onSelectEntity={() => onSelectTab("entity-profile")} />;
    case "procurement":
      return <ProcurementAnalyticsTab tenderId={selectedTenderId} />;
    case "open-data":
      return <OpenDataAnalyticsTab />;
    case "entity-profile":
      return <EntityProfileTab onSelectTab={onSelectTab} />;
    case "source-status":
      return <SourceStatusTab />;
    case "advisor":
      return <AdvisorTab />;
    case "media-forensics":
      return <MediaForensicsTab />;
    case "opendatabot":
      return <OpendatabotTab />;
    case "youscore":
      return <YouScoreTab />;
    case "architecture":
      return <ArchitectureTab />;
    case "catalog":
      return <CatalogTab />;
    case "license":
      return <LicenseTab />;
    case "master-specification":
      return <MasterSpecificationViewer />;
    case "roadmap":
      return <RoadmapTab />;
    case "volumes":
      return <VolumesTab />;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = React.useState<TabId>("dashboard");
  const [selectedTenderId, setSelectedTenderId] = React.useState<string>();
  const selectTab = React.useCallback((tab: string) => {
    if (tab.startsWith("tender:")) {
      setSelectedTenderId(tab.slice("tender:".length));
      setActiveTab("procurement");
      return;
    }
    setSelectedTenderId(undefined);
    setActiveTab((tab === "osint" ? "entity-profile" : tab) as TabId);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      <Sidebar activeTab={activeTab} onSelect={selectTab} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur md:px-8">
          <p className="text-xs uppercase tracking-widest text-slate-500">NEXUS / {activeTab}</p>
        </header>
        <React.Suspense fallback={<div className="p-8 text-slate-400">Завантаження модуля…</div>}>
          <TabContent activeTab={activeTab} selectedTenderId={selectedTenderId} onSelectTab={selectTab} />
        </React.Suspense>
      </main>
    </div>
  );
}
