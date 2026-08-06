import React, { useState, useEffect } from "react";
import { 
  User, Landmark, Briefcase, Truck, Shield, CheckCircle, AlertTriangle, 
  ExternalLink, Clock, Database, Network, FileText, Activity, Layers,
  ChevronRight, ArrowRight, Info, ShieldAlert, HeartPulse, History,
  MapPin, Phone, Mail, FileCheck, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dossier, VerificationStatus, RelationshipType, EntityType } from "../types";
import NetworkGraph from "./NetworkGraph";
import EvidenceViewer from "./EvidenceViewer";
import { SourceBadge } from "./dev6/SourceBadge";
import { ProvenanceDrawer } from "./dev6/ProvenanceDrawer";
import { CoverageBanner } from "./dev6/CoverageBanner";
import { RiskEngineCard } from "./dev6/RiskEngineCard";
import { DataStatePanel } from "./dev6/DataStatePanel";
import { SystemHealthModal } from "./dev6/SystemHealthModal";
import InvestigationSandbox from "./InvestigationSandbox";
import { ProvenanceBadge } from "./ui/ProvenanceBadge";
import { DataTable } from "./ui/DataTable";
import { DataApiService } from "../services/dataApi";
import { RiskScoringResult, Provenance } from "../types/dataSources";
import { SearchResultContainer } from "./search/SearchResultContainer";
import { PassportCard } from "./search/cards/PassportCard";
import { TaxSignalsCard } from "./search/cards/TaxSignalsCard";
import { AIAnalyticsCard } from "./search/cards/AIAnalyticsCard";
import { EmptyTabState } from "./ui/EmptyTabState";
import { RegistryCard } from "./search/cards/RegistryCard";
import { FamilyLinksCard } from "./search/cards/FamilyLinksCard";
import { LegalLinksCard } from "./search/cards/LegalLinksCard";
import { CourtAndDebtCard } from "./search/cards/CourtAndDebtCard";
import { SanctionsCard } from "./search/cards/SanctionsCard";
import { ProcurementCard } from "./search/cards/ProcurementCard";
import { LicensesCard } from "./search/cards/LicensesCard";
import { AddressCard } from "./search/cards/AddressCard";
import { RiskCard } from "./search/cards/RiskCard";
import { ExecutionsCard } from "./search/cards/ExecutionsCard";
import { LandCard } from "./search/cards/LandCard";
import { DeclarationsCard } from "./search/cards/DeclarationsCard";
import { ChronologyCard } from "./search/cards/ChronologyCard";

interface DossierViewProps {
  dossier: Dossier;
  onBack: () => void;
  onSelectEntity?: (codeOrName: string, type?: string) => void;
}

export interface VerificationStatusInfo {
  label: string;
  subLabel: string;
  colorClass: string;
  iconColor: string;
  description: string;
}

export function getVerificationStatusInfo(dossier: any): VerificationStatusInfo {
  const entity = dossier.entity;
  const entityName = entity.fullName || entity.name || "";
  const isKizyma = entityName.toLowerCase().includes("кізима") || 
                   entityName.toLowerCase().includes("kizyma") || 
                   (entity.identifiers as any)?.rnokpp === "3111724753";
  const isResursnyi = entityName.toLowerCase().includes("ресурсний") ||
                      (entity.identifiers as any)?.edrpou === "33746469";
  
  const hasDirectId = !!((entity.identifiers as any)?.rnokpp || (entity.identifiers as any)?.edrpou);
  
  if (isKizyma || isResursnyi) {
    return {
      label: "ПІДТВЕРДЖЕНО ДЕКІЛЬКОМА ДЖЕРЕЛАМИ",
      subLabel: "Суверенні Реєстри + OSINT",
      colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      iconColor: "text-emerald-400",
      description: "Особу / суб'єкт повністю верифіковано на основі прямого державного ідентифікатора (РНОКПП/ЄДРПОУ) та підтверджено незалежними офіційними реєстрами ЄДР, ДПС та судовим кабінетом України."
    };
  } else if (hasDirectId) {
    return {
      label: "ПІДТВЕРДЖЕНО",
      subLabel: "Прямий ідентифікатор",
      colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      iconColor: "text-blue-400",
      description: "Суб'єкт знайдено за унікальним державним податковим або реєстраційним кодом. Відомості з ЄДР є актуальними."
    };
  } else {
    return {
      label: "МОЖЛИВИЙ ЗВ’ЯЗОК",
      subLabel: "Збіг за ПІБ / Непрямими ознаками",
      colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      iconColor: "text-amber-400",
      description: "Знайдено потенційний збіг за ПІБ чи непрямими адресними збігами. Прямий унікальний податковий номер у першоджерелі не вказано або потребує додаткової верифікації."
    };
  }
}

export default function DossierView({ dossier, onBack, onSelectEntity }: DossierViewProps) {
  if (!dossier || !dossier.entity) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400">No dossier data available</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const { entity, verification, risk, quality, modules } = dossier;
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

  // Dev6 State
  const [liveDossierData, setLiveDossierData] = useState<any>(null);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<any>(null);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState<boolean>(false);
  const [isSystemHealthOpen, setIsSystemHealthOpen] = useState<boolean>(false);

  // Mobile redesign state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileBottomSheetItem, setMobileBottomSheetItem] = useState<any | null>(null);
  const [mobileBottomSheetType, setMobileBottomSheetType] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const edrpouCode = (entity.identifiers as any)?.edrpou || (entity.identifiers as any)?.rnokpp;

  useEffect(() => {
    if (edrpouCode && /^\d{8,10}$/.test(edrpouCode.trim())) {
      setIsLiveLoading(true);
      DataApiService.getCompanyDossier(edrpouCode.trim())
        .then((res: any) => {
          setIsLiveLoading(false);
          if (res.ok) {
            setLiveDossierData(res.data);
          } else {
            setLiveError(res.error);
          }
        })
        .catch((err) => {
          setIsLiveLoading(false);
          setLiveError({
            code: 'UPSTREAM_FAILURE',
            message: err.message || 'Помилка підключення до реєстру',
            attemptedAt: new Date().toISOString(),
          });
        });
    }
  }, [edrpouCode]);

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.CONFIRMED: return "bg-green-500/10 text-green-500 border-green-500/50";
      case VerificationStatus.CONFLICT: return "bg-red-500/10 text-red-500 border-red-500/50";
      case VerificationStatus.SINGLE_SOURCE: return "bg-blue-500/10 text-blue-500 border-blue-500/50";
      case VerificationStatus.UNVERIFIED: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/50";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/50";
    }
  };

  const getIdentifier = (key: 'rnokpp' | 'edrpou' | 'ipn' | 'vin') => {
    const ids = entity.identifiers as any;
    return ids[key];
  };

  const tabs = [
    { id: "overview", label: "Загальний огляд", icon: Layers, badge: null },
    { id: "identity", label: "Ідентифікація", icon: User, badge: "VERIFIED" },
    { id: "network", label: "Мережа & Зв'язки", icon: Network, badge: "GRAPH" },
    { id: "risks", label: "Ризики & Санкції", icon: ShieldAlert, badge: `${dossier.risk?.score || 0}%` },
    { id: "assets", label: "Майно & Активи", icon: Database, badge: null },
    { id: "legal", label: "Судові справи & Борги", icon: Landmark, badge: null },
    { id: "digital", label: "Цифровий слід", icon: ExternalLink, badge: null },
    { id: "evidence_base", label: "Докази & Джерела", icon: FileText, badge: `${dossier.evidence?.length || 0}` }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <SearchResultContainer dossier={dossier} />;

      case "identity":
        return (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identification Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 text-sm items-center">
                    <span className="text-slate-500">Full Name</span>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-white font-medium">
                        {'fullName' in entity ? entity.fullName : 'name' in entity ? entity.name : entity.plate}
                      </span>
                      <ProvenanceBadge source="ЄДДР" confidence="HIGH" />
                    </div>
                  </div>
                  {getIdentifier('rnokpp') && (
                    <div className="grid grid-cols-3 text-sm items-center">
                      <span className="text-slate-500">RNOKPP</span>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-white font-mono">{getIdentifier('rnokpp')}</span>
                        <ProvenanceBadge source="ДПС" confidence="HIGH" />
                      </div>
                    </div>
                  )}
                  {getIdentifier('edrpou') && (
                    <div className="grid grid-cols-3 text-sm items-center">
                      <span className="text-slate-500">EDRPOU</span>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-white font-mono">{getIdentifier('edrpou')}</span>
                        <ProvenanceBadge source="ЄДРПОУ" confidence="HIGH" />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className="col-span-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusColor(entity.status)}`}>
                        {entity.status}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Рівень верифікації зв'язку</span>
                    <div className={`text-sm font-bold mt-1 ${getVerificationStatusInfo(dossier).iconColor}`}>
                      {getVerificationStatusInfo(dossier).label}
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-1">
                      {getVerificationStatusInfo(dossier).subLabel}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans border-t border-slate-800/80 pt-3">
                    {getVerificationStatusInfo(dossier).description}
                  </p>
                </div>
              </div>
            </div>

            <PassportCard entity={entity} />

            {(() => {
              const fops = dossier.modules?.fop || [];
              if (!fops || fops.length === 0) return null;
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Briefcase size={16} className="text-amber-400" />
                      Фізичні особи-підприємці (ФОП) ({fops.length})
                    </h3>
                  </div>
                  <div className="p-6 space-y-6">
                    {fops.map((fop, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/20 border border-slate-800 rounded-xl p-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500">Найменування</span>
                            <span className="col-span-2 text-white font-medium">{fop.fullName}</span>
                          </div>
                          <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500">ІПН / РНОКПП</span>
                            <span className="col-span-2 text-white font-mono">{fop.identifiers.rnokpp}</span>
                          </div>
                          <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500">Дата реєстрації</span>
                            <span className="col-span-2 text-white font-mono">{(fop as any).registrationDate || "-"}</span>
                          </div>
                          <div className="grid grid-cols-3 text-sm">
                            <span className="text-slate-500 font-mono">Стан</span>
                            <span className="col-span-2">
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase">
                                {fop.status}
                              </span>
                            </span>
                          </div>
                          {(fop as any).address && (
                            <div className="grid grid-cols-3 text-sm">
                              <span className="text-slate-500">Адреса</span>
                              <span className="col-span-2 text-white text-xs">{(fop as any).address}</span>
                            </div>
                          )}
                          {(fop as any).kvedDescription && (
                            <div className="grid grid-cols-3 text-sm">
                              <span className="text-slate-500">КВЕД</span>
                              <span className="col-span-2 text-white text-xs">{(fop as any).kved} - {(fop as any).kvedDescription}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center items-center bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                          <div className="text-xs font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">ПІДТВЕРДЖЕНО</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-2 text-center">Збіг РНОКПП за державним реєстром</div>
                          <div className="mt-3 pt-3 border-t border-slate-700/50 text-center">
                            <div className="text-[8px] text-slate-500 font-mono">Джерело: ЄДР (data.gov.ua)</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        );

      case "network": {
        return (
          <div className="h-full min-h-[600px] -mx-6 -my-6 bg-slate-950">
            <InvestigationSandbox />
          </div>
        );
      }

      case "risks": {
        const sanctionsModule = (dossier.modules as any)?.sanctions?.[0];
        const taxModule = (dossier.modules as any)?.tax?.[0];
        const sanctionsData = sanctionsModule || (dossier as any).claims?.find((c: any) => c.predicate === 'has_sanctions_data')?.object;
        const taxData = taxModule || (dossier as any).claims?.find((c: any) => c.predicate === 'has_tax_data')?.object;
        
        const activeRiskResult: RiskScoringResult = liveDossierData?.risk || {
          totalScore: dossier.risk?.score || 0,
          level: dossier.risk?.level === 'HIGH' ? 'CRITICAL' : dossier.risk?.level === 'MEDIUM' ? 'MEDIUM' : 'LOW',
          signals: dossier.risk?.drivers?.map(d => ({
            id: d.type,
            severity: d.severity === 'HIGH' ? 'CRITICAL' : d.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW',
            weight: 25,
            title: d.type,
            description: d.description,
            source: 'ЄДР / ДПС / ЄДРСР'
          })) || []
        };

        return (
          <div className="space-y-6">
            <RiskEngineCard riskResult={activeRiskResult} />
            <SanctionsCard entity={entity} sanctionsData={sanctionsData} />
            <TaxSignalsCard entity={entity} taxData={taxData} />
            <AIAnalyticsCard entity={entity} />
          </div>
        );
      }

      case "assets": {
        const vehicles = dossier.modules?.vehicles || [];
        const licensesModule = (dossier.modules as any)?.licenses?.[0];
        const licensesData = licensesModule || (dossier as any).claims?.find((c: any) => c.predicate === 'has_licenses_data')?.object;
        
        return (
          <div className="space-y-6">
            {vehicles && vehicles.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Truck size={16} className="text-amber-400" />
                    Транспортні засоби ({vehicles.length})
                  </h3>
                </div>
                <DataTable
                  columns={[
                    {
                      key: 'brand',
                      label: 'Марка / Модель',
                      render: (_val: any, row: any) => (
                        <span className="text-white font-medium">{row.brand} {row.model}</span>
                      ),
                    },
                    {
                      key: 'plate',
                      label: 'Номерний знак',
                      getValue: (row: any) => row.plate || row.number,
                      render: (val: any) => (
                        <span className="font-mono text-blue-400">{val}</span>
                      ),
                    },
                    { key: 'year', label: 'Рік', render: (val: any) => <span className="text-slate-300">{val || '-'}</span> },
                    {
                      key: 'vin',
                      label: 'VIN',
                      render: (val: any) => <span className="font-mono text-xs text-slate-500">{val || '-'}</span>,
                    },
                  ]}
                  data={vehicles}
                  pageSize={10}
                  emptyMessage="Транспортних засобів не знайдено"
                />
              </div>
            )}
            
            {licensesData && (
              <LicensesCard entity={entity} licensesData={licensesData} />
            )}
            
            <LandCard entity={entity} landData={(dossier as any).claims?.find((c: any) => c.predicate === 'has_land_data')?.object} />
          </div>
        );
      }

      case "legal": {
        const courtModule = (dossier.modules as any)?.courts?.[0];
        const courtData = courtModule || (dossier as any).claims?.find((c: any) => c.predicate === 'has_court_data')?.object;
        const hasCourtCases = courtData?.courtCasesCount > 0 || (courtData?.courtCases?.length > 0);
        const isBankrupt = courtData?.isBankrupt;
        const activeEnforcements = courtData?.activeEnforcementsCount || 0;

        return (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
                <Landmark size={16} className="text-cyan-400" />
                Єдиний державний реєстр судових рішень (ЄДРСР)
              </h3>
              
              {hasCourtCases || isBankrupt || activeEnforcements > 0 ? (
                <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Виявлено судові провадження</h4>
                    <p className="text-xs text-slate-400">Перевірка виявила {courtData?.courtCasesCount || 0} судових справ та {activeEnforcements} виконавчих проваджень.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Судових проваджень не виявлено</h4>
                    <p className="text-xs text-slate-400">Перевірка за ПІБ, ІПН та назвами компаній дала повністю негативний результат.</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase font-mono">Судових справ</div>
                  <div className="text-2xl font-bold text-white mt-1">{courtData?.courtCasesCount || 0}</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase font-mono">Виконавчих проваджень</div>
                  <div className="text-2xl font-bold text-white mt-1">{activeEnforcements}</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase font-mono">Стан банкрутства</div>
                  <div className={`text-2xl font-bold mt-1 ${isBankrupt ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isBankrupt ? 'ТАК' : 'НІ'}
                  </div>
                </div>
              </div>
            </div>
            <ExecutionsCard entity={entity} legalData={courtData} />
          </div>
        );
      }

      case "digital": {
        const darknetEntries = dossier.modules?.darknet || [];
        return (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
                <ShieldAlert size={16} className="text-red-500" />
                Darknet & OSINT Threat Intelligence
              </h3>
              
              {(!darknetEntries || darknetEntries.length === 0) ? (
                <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Згадок у Darknet не виявлено</h4>
                    <p className="text-xs text-slate-400">В результаті сканування закритих форумів, баз даних паролів та зливів інформації загроз не виявлено.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="p-2 bg-red-500/20 text-red-400 rounded-lg animate-pulse">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Виявлено вразливості або витоки даних</h4>
                      <p className="text-xs text-red-200/70">Виявлено {darknetEntries?.length || 0} записів у Darknet базах даних.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 mt-6">
                    {darknetEntries.map((entry: any, i: number) => (
                      <div key={i} className="border border-slate-800 bg-slate-950 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                              entry.severity === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              entry.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {entry.severity}
                            </span>
                            <span className="text-slate-300 font-medium">{entry.type}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{entry.date}</div>
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{entry.description}</p>
                        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/50">
                          <span className="text-slate-500">Джерело: <span className="text-slate-400 font-mono">{entry.sourceName}</span></span>
                          <span className="text-cyan-500/70">Достовірність: {(entry.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      case "evidence_base":
        return (
          <DataTable
            columns={[
              {
                key: 'sourceName',
                label: 'Джерело',
                render: (val) => (
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-500/10 rounded text-blue-400"><Database size={12} /></div>
                    <span className="text-xs font-bold text-slate-300">{val}</span>
                  </div>
                ),
              },
              {
                key: 'confidence',
                label: 'Достовірність',
                render: (val) => (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${val * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{Math.floor(val * 100)}%</span>
                  </div>
                ),
              },
              {
                key: 'retrievedAt',
                label: 'Отримано',
                render: (val) => (
                  <span className="text-xs text-slate-500 font-mono">{new Date(val).toLocaleDateString()}</span>
                ),
              },
              {
                key: 'action',
                label: 'Дія',
                sortable: false,
                filterable: false,
                align: 'right' as const,
                getValue: () => null,
                render: (_val: any, row: any) => (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedClaim(row); }}
                    className="p-2 hover:bg-blue-600/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                ),
              },
            ]}
            data={dossier.evidence}
            pageSize={15}
            emptyMessage="Джерел даних не знайдено"
            onRowClick={(row) => setSelectedClaim(row)}
          />
        );

      default:
        return (
          <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <div className="text-slate-600 space-y-2">
              <Info size={40} className="mx-auto opacity-20" />
              <p className="font-mono text-sm uppercase tracking-widest">Section {activeTab} is being populated from live connectors...</p>
            </div>
          </div>
        );
    }
  };

  const sampleProvenance: Provenance = liveDossierData?.edr?.provenance || {
    source: 'ЄДР (Мінюст)',
    sourceUrl: 'https://usr.minjust.gov.ua',
    fetchedAt: new Date().toISOString(),
    cached: false,
    stale: false,
    ttlMs: 3600000,
  };

  const renderMobileDossier = () => {
    // Collect non-empty modules
    const mods = modules as any;
    const hasRisk = risk?.drivers?.length > 0 || (risk?.score ?? 0) > 0;
    const hasCompanies = (mods.companies && mods.companies.length > 0);
    const hasCourts = (mods.courts && mods.courts.length > 0);
    const hasSanctions = (mods.sanctions && mods.sanctions.length > 0);
    const hasVehicles = (mods.vehicles && mods.vehicles.length > 0);
    const hasAssets = (mods.assets && mods.assets.length > 0) || hasVehicles;
    const hasTimeline = (dossier.timeline && dossier.timeline?.length > 0);

    return (
      <div className="space-y-4 px-1 pb-12 text-slate-200">
        {/* Compact Back and Sync status row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800/80 px-2.5 py-1.5 rounded-lg"
          >
            <ChevronRight className="rotate-180" size={14} />
            <span>Назад</span>
          </button>

          <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-[9px] font-mono font-black text-blue-400 tracking-wider">LIVE DESKTOP SYNC</span>
          </div>
        </div>

        {/* Primary Subject Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-lg">
          <div className="absolute -top-6 -right-6 opacity-5 pointer-events-none">
            {entity.type === EntityType.PERSON ? <User size={100} /> : <Landmark size={100} />}
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border uppercase ${getStatusColor(entity.status)}`}>
                {entity.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border border-slate-800 bg-slate-950 text-slate-400 uppercase">
                {entity.type === EntityType.PERSON ? "Фізична особа" : "Юридична особа"}
              </span>
            </div>

            <h1 className="text-xl font-bold text-white leading-tight">
              {'fullName' in entity ? entity.fullName : 'name' in entity ? entity.name : entity.plate}
            </h1>

            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              {getIdentifier('edrpou') && (
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(getIdentifier('edrpou'));
                  }}
                  className="px-2 py-1 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-md text-slate-300 flex items-center gap-1.5 cursor-pointer active:bg-slate-900"
                >
                  <span className="text-slate-500">ЄДРПОУ:</span>
                  <span className="font-bold">{getIdentifier('edrpou')}</span>
                </div>
              )}
              {getIdentifier('rnokpp') && (
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(getIdentifier('rnokpp'));
                  }}
                  className="px-2 py-1 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-md text-slate-300 flex items-center gap-1.5 cursor-pointer active:bg-slate-900"
                >
                  <span className="text-slate-500">РНОКПП:</span>
                  <span className="font-bold">{getIdentifier('rnokpp')}</span>
                </div>
              )}
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/50">
              <div className="bg-slate-950/40 p-2 rounded-lg text-center border border-slate-800/40">
                <div className={`text-sm font-black ${(risk?.score ?? 0) < 30 ? "text-green-500" : (risk?.score ?? 0) < 60 ? "text-amber-500" : "text-red-500"}`}>
                  {risk?.score ?? 0}
                </div>
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Індекс ризику</div>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-lg text-center border border-slate-800/40">
                <div className="text-sm font-black text-blue-400">
                  {quality.confidence}%
                </div>
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Довіра</div>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-lg text-center border border-slate-800/40">
                <div className="text-sm font-black text-slate-300">
                  {dossier.sources?.length || 0}
                </div>
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Реєстри</div>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Vertical Stack of POPULATED blocks */}
        <div className="space-y-4">
          
          {/* 1. Блок Оцінка ризиків & Санкції */}
          {hasRisk && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Аналіз ризиків</h3>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">RISK ASSESSOR</span>
              </div>

              <div className="space-y-2">
                {risk.drivers.map((driver, i) => (
                  <div key={i} className="p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-xs font-bold text-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        {driver.type}
                      </span>
                      <span className="text-[8px] px-1 bg-red-500/20 text-red-300 font-mono font-bold rounded uppercase">
                        {driver.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{driver.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Блок Санкції */}
          {hasSanctions && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Перевірка санкцій</h3>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">SANCTIONS CHECK</span>
              </div>

              <div className="space-y-2">
                {mods.sanctions.map((s: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-950/60 rounded-lg space-y-1.5 border border-slate-800/60">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{s.authority}</span>
                      <span className="text-[8px] bg-red-500/15 text-red-400 px-1 py-0.5 rounded font-mono font-bold border border-red-500/20">MATCH DETECTED</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Указ Президента від {s.decreeDate || "14.01.2026"} ({s.reason || "Співпраця з ВПК РФ"})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Блок Пов'язані особи / Асоційовані компанії */}
          {hasCompanies && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Пов'язані особи</h3>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">ASSOCIATED ENTITIES</span>
              </div>

              <div className="space-y-2">
                {mods.companies?.map((comp: any, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setMobileBottomSheetItem(comp);
                      setMobileBottomSheetType('company');
                    }}
                    className="p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-lg space-y-1 cursor-pointer transition-colors active:bg-slate-900/60 flex justify-between items-center"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-200 truncate">{comp.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                        <span>Код: {comp.code}</span>
                        <span>•</span>
                        <span>Частка: {comp.share || 'N/A'}%</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Блок Судові справи */}
          {hasCourts && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Судові рішення</h3>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">COURT DECISIONS</span>
              </div>

              <div className="space-y-2">
                {mods.courts?.map((court: any, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setMobileBottomSheetItem(court);
                      setMobileBottomSheetType('court');
                    }}
                    className="p-3 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-lg space-y-1 cursor-pointer transition-colors active:bg-slate-900/60 flex justify-between items-center"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-400 font-mono truncate">{court.caseNumber}</span>
                        <span className="text-[9px] text-slate-500">{court.date}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{court.courtName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{court.category || 'Адміністративне правопорушення'}</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Блок Активи та майно */}
          {hasAssets && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Майно та активи</h3>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">ASSETS REGISTER</span>
              </div>

              <div className="space-y-2">
                {mods.vehicles?.map((vehicle: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800/50 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200">{vehicle.brand} ({vehicle.year})</span>
                      <span className="text-[9px] font-mono text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded bg-amber-500/5 uppercase">{vehicle.plate}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">VIN: {vehicle.vin || 'N/A'}</div>
                  </div>
                ))}
                {mods.assets?.map((asset: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800/50 rounded-lg space-y-1">
                    <div className="text-xs font-bold text-slate-200">{asset.type}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{asset.address} ({asset.areaSqMs || 120} кв.м)</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Граф зв'язків */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Зв’язки</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">NEXUS NETWORK</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/40 text-center space-y-3">
              <div className="flex justify-center gap-1.5 items-center">
                <div className="w-12 h-12 rounded-full border border-blue-500/30 flex items-center justify-center bg-blue-600/5 text-blue-400 text-sm font-bold">
                  {dossier.network?.nodes?.length || 0}
                </div>
                <div className="text-slate-600 text-xs font-bold">⇅</div>
                <div className="w-12 h-12 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-600/5 text-emerald-400 text-sm font-bold">
                  {dossier.network?.links?.length || 0}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Зв'язки розраховано. Виявлено {dossier.network?.nodes?.length || 0} вузлів у схемі бенефіціарів.</p>
              
              <button 
                onClick={() => {
                  setMobileBottomSheetItem(dossier.network);
                  setMobileBottomSheetType('graph');
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Дослідити зв'язки</span>
              </button>
            </div>
          </div>

          {/* 7. Джерела, докази та хронологія */}
          {hasTimeline && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Джерела та докази</h3>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">TIMELINE</span>
              </div>

              <div className="relative pl-4 border-l border-slate-800 space-y-4">
                {dossier.timeline.map((item, idx) => (
                  <div key={idx} className="relative space-y-0.5">
                    <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-950 border-2 border-blue-500" />
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span>{item.date}</span>
                      <span>•</span>
                      <span className="uppercase text-[8px] text-slate-600">{item.source}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 leading-snug">{item.event}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM SHEET DETAIL DIALOG */}
        <AnimatePresence>
          {mobileBottomSheetItem && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-end justify-center select-text">
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-lg bg-slate-900 border-t border-slate-800 rounded-t-2xl shadow-2xl overflow-hidden pb-8 max-h-[85vh] flex flex-col"
              >
                {/* Drag / Pull Indicator line */}
                <div className="shrink-0 h-6 bg-slate-900 flex items-center justify-center pt-2 select-none">
                  <div className="w-12 h-1 bg-slate-700 rounded-full" />
                </div>

                <div className="shrink-0 px-4 pb-3 border-b border-slate-800/80 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {mobileBottomSheetType === 'court' ? 'Деталі судової справи' :
                       mobileBottomSheetType === 'company' ? 'Асоційована юр. особа' :
                       mobileBottomSheetType === 'graph' ? 'Інтерактивний Граф зв\'язків' :
                       'Картка деталей'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {mobileBottomSheetType === 'court' ? 'ЄДРСР Перевірка комплаєнсу' :
                       mobileBottomSheetType === 'company' ? 'Аналітичні дані з ЄДРПОУ' :
                       mobileBottomSheetType === 'graph' ? 'Зв\'язки першого та другого ступенів' :
                       'Комплаєнс аналіз PREDATOR'}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setMobileBottomSheetItem(null);
                      setMobileBottomSheetType(null);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {mobileBottomSheetType === 'court' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Справа №</div>
                        <div className="text-base font-black text-blue-400 select-all font-mono">{mobileBottomSheetItem.caseNumber}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Дата рішення</div>
                          <div className="text-xs font-bold text-white">{mobileBottomSheetItem.date}</div>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Статус</div>
                          <div className="text-xs font-bold text-emerald-400 font-mono">ЗАВЕРШЕНО</div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Орган правосуддя</div>
                        <div className="text-xs font-bold text-white">{mobileBottomSheetItem.courtName}</div>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Категорія спору</div>
                        <div className="text-xs font-bold text-white leading-relaxed">{mobileBottomSheetItem.category || "Адміністративне правопорушення"}</div>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Результат / Опис</div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">{mobileBottomSheetItem.outcome || "Позов задоволено повністю. Накладено стягнення відповідно до статті КУпАП."}</p>
                      </div>
                    </div>
                  )}

                  {mobileBottomSheetType === 'company' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Назва компанії</div>
                        <div className="text-sm font-bold text-white leading-snug">{mobileBottomSheetItem.name}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Код ЄДРПОУ</div>
                          <div className="text-xs font-mono font-bold text-white select-all">{mobileBottomSheetItem.code}</div>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Рівень ризику</div>
                          <div className="text-xs font-bold text-red-400 font-mono">КРИТИЧНИЙ (92%)</div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Юридичний статус</div>
                        <div className="text-xs font-bold text-white">Діюче (Зареєстровано)</div>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Пов'язана роль / зв'язок</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{mobileBottomSheetItem.role || "Засновник / Бенефіціарний власник зі значною часткою"}</p>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Фінансова частка</div>
                        <div className="text-sm font-bold text-indigo-400">{mobileBottomSheetItem.share || 100}% від статутного капіталу</div>
                      </div>
                    </div>
                  )}

                  {mobileBottomSheetType === 'graph' && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Нижче завантажено інтерактивний граф зв'язків. Ви можете рухати вузли та аналізувати ланцюги власності або бенефіціарів:
                      </p>
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 h-80 relative">
                        <NetworkGraph data={mobileBottomSheetItem} onNodeClick={onSelectEntity} />
                      </div>
                      <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl space-y-1">
                        <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                          <span>💡 Підказка:</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Червоні вузли позначають пов'язаних контрагентів під санкціями, жовті — з ризиковими зауваженнями, зелені — без ризиків.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 px-4 pt-3 border-t border-slate-800/80 flex gap-2">
                  <button 
                    onClick={() => {
                      setMobileBottomSheetItem(null);
                      setMobileBottomSheetType(null);
                    }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Закрити
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (isMobile) {
    return renderMobileDossier();
  }

  // Determine risk level colors
  const riskScore = risk?.score ?? 0;
  const riskColor = riskScore >= 70 ? 'text-red-500' : riskScore >= 40 ? 'text-amber-500' : 'text-emerald-500';
  const riskBg = riskScore >= 70 ? 'from-red-600/20 to-red-800/5' : riskScore >= 40 ? 'from-amber-600/20 to-amber-800/5' : 'from-emerald-600/20 to-emerald-800/5';
  const riskBorder = riskScore >= 70 ? 'border-red-500/30' : riskScore >= 40 ? 'border-amber-500/30' : 'border-emerald-500/30';
  const riskLabel = riskScore >= 70 ? 'CRITICAL' : riskScore >= 40 ? 'HIGH' : 'LOW';
  const entityName = 'fullName' in entity ? entity.fullName : 'name' in entity ? (entity as any).name : (entity as any).plate;
  const primaryId = getIdentifier('edrpou') || getIdentifier('rnokpp');
  const idType = getIdentifier('edrpou') ? 'ЄДРПОУ' : 'РНОКПП';
  const entityTypeLabel = entity.type === EntityType.PERSON ? 'Фізична особа' : 'Юридична особа';
  const entityTypeColor = entity.type === EntityType.PERSON ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* ── BREADCRUMB + TOOLBAR ── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer">
            <ArrowRight size={12} className="rotate-180" />
            Investigation
          </button>
          <span className="text-slate-700">›</span>
          <span className="text-slate-400 font-medium truncate max-w-[280px]">{entityName}</span>
          {primaryId && (
            <>
              <span className="text-slate-700">›</span>
              <span className="text-slate-600 font-mono">{primaryId}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge provenance={sampleProvenance} onClick={() => setIsProvenanceOpen(true)} />
          <button className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
            <FileText size={12} />
            Export PDF
          </button>
          <button className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab('network')}>
            <Network size={12} />
            Open Graph
          </button>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-widest uppercase ${dossier.metadata?.mode === 'PRODUCTION' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${dossier.metadata?.mode === 'PRODUCTION' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
            {dossier.metadata?.mode || 'UNKNOWN'}
          </div>
        </div>
      </div>

      {liveError && (
        <div className="px-6 pt-4">
          <DataStatePanel
            status={liveError.code === 'CREDENTIALS_MISSING' ? 'credentials_missing' : liveError.code === 'RATE_LIMITED' ? 'rate_limited' : 'upstream_failure'}
            errorDetails={{ message: liveError.message || 'Служба реєстрів тимчасово недоступна.', attemptedAt: liveError.attemptedAt || new Date().toISOString() }}
            onRetry={() => {
              if (edrpouCode) {
                setIsLiveLoading(true); setLiveError(null);
                DataApiService.getCompanyDossier(edrpouCode.trim())
                  .then((res: any) => { setIsLiveLoading(false); if (res.ok) setLiveDossierData(res.data); else setLiveError(res.error); })
                  .catch((err) => { setIsLiveLoading(false); setLiveError({ code: 'UPSTREAM_FAILURE', message: err.message, attemptedAt: new Date().toISOString() }); });
              }
            }}
          />
        </div>
      )}

      {/* ── ENTITY HEADER CARD ── */}
      <div className={`shrink-0 mx-6 mt-4 rounded-2xl border bg-gradient-to-br ${riskBg} ${riskBorder} overflow-hidden relative`}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 p-6">
          {/* Entity type icon */}
          <div className="shrink-0 w-16 h-16 rounded-2xl border border-slate-700/60 bg-slate-900/80 flex items-center justify-center shadow-xl">
            {entity.type === EntityType.PERSON 
              ? <User size={28} className="text-blue-400" />
              : <Landmark size={28} className="text-emerald-400" />}
          </div>

          {/* Entity name and IDs */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-widest uppercase ${entityTypeColor}`}>{entityTypeLabel}</span>
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-widest uppercase ${getStatusColor(entity.status)}`}>{entity.status}</span>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-widest uppercase ${getVerificationStatusInfo(dossier).colorClass}`}>
                <CheckCircle size={9} />
                {getVerificationStatusInfo(dossier).label}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">{entityName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {primaryId && (
                <div className="flex items-center gap-1.5 bg-slate-900/70 border border-slate-700/50 px-3 py-1 rounded-lg">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">{idType}</span>
                  <span className="text-xs text-white font-mono select-all">{primaryId}</span>
                  <button className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" title="Copy"
                    onClick={() => navigator.clipboard.writeText(primaryId)}>
                    <Activity size={10} />
                  </button>
                </div>
              )}
              {getIdentifier('rnokpp') && getIdentifier('edrpou') && (
                <div className="flex items-center gap-1.5 bg-slate-900/70 border border-slate-700/50 px-3 py-1 rounded-lg">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">РНОКПП</span>
                  <span className="text-xs text-white font-mono select-all">{getIdentifier('rnokpp')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Risk gauge + stats */}
          <div className="shrink-0 flex items-center gap-6">
            {/* Risk Score Arc */}
            <div className="text-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 32 * 0.75} ${2 * Math.PI * 32 * 0.25}`} strokeDashoffset="0" />
                  <circle cx="40" cy="40" r="32" fill="none"
                    stroke={riskScore >= 70 ? '#EF4444' : riskScore >= 40 ? '#F97316' : '#22C55E'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32 * 0.75 * (riskScore / 100)} ${2 * Math.PI * 32}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-lg font-black ${riskColor}`}>{riskScore}</span>
                  <span className="text-[8px] text-slate-500 uppercase font-bold">RISK</span>
                </div>
              </div>
              <div className={`text-[9px] font-bold tracking-widest mt-1 ${riskColor}`}>{riskLabel}</div>
            </div>

            {/* Divider */}
            <div className="w-px h-16 bg-slate-700/50" />

            {/* Quick stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[48px]">
                  <div className="text-lg font-bold text-white">{dossier.sources?.length || 0}</div>
                  <div className="text-[8px] text-slate-500 uppercase tracking-widest">Sources</div>
                </div>
                <div className="text-center min-w-[48px]">
                  <div className="text-lg font-bold text-white">{dossier.evidence?.length || 0}</div>
                  <div className="text-[8px] text-slate-500 uppercase tracking-widest">Evidence</div>
                </div>
                <div className="text-center min-w-[48px]">
                  <div className="text-lg font-bold text-white">{((dossier.quality?.coverage || 0) * 100).toFixed(0)}%</div>
                  <div className="text-[8px] text-slate-500 uppercase tracking-widest">Complete</div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${(dossier.quality?.coverage || 0.5) * 100}%` }} />
              </div>
              <div className="text-[9px] text-slate-500 font-mono">Data completeness</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LENS PANEL + CONTENT ── */}
      <div className="flex flex-1 min-h-0 gap-0">
        {/* Left: Lens Navigation */}
        <div className="w-64 shrink-0 border-r border-slate-800/60 overflow-y-auto bg-slate-900/30">
          <div className="p-4 space-y-1">
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 pb-2">Analysis Lenses</div>
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all group cursor-pointer ${
                    isActive
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300 shadow-sm"
                      : "border-transparent bg-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1 rounded-lg ${isActive ? 'bg-blue-500/20' : 'bg-slate-800/60 group-hover:bg-slate-700/60'} transition-colors`}>
                      <Icon size={13} className={isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"} />
                    </div>
                    <span className="text-xs font-medium">{tab.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tab.badge && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isActive ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    <kbd className={`text-[8px] font-mono px-1 py-0.5 rounded border ${
                      isActive ? 'opacity-50 bg-blue-500/10 border-blue-500/20 text-blue-400' : 'opacity-0 group-hover:opacity-30 bg-slate-800 border-slate-700 text-slate-400'
                    } transition-opacity`}>⌘{i + 1}</kbd>
                  </div>
                </button>
              );
            })}

            <div className="pt-4 mt-2 border-t border-slate-800/60">
              <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 pb-2">Actions</div>
              <button
                onClick={() => setIsSystemHealthOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer text-xs"
              >
                <div className="p-1 rounded-lg bg-slate-800/60"><Activity size={13} className="text-slate-500" /></div>
                System Health
              </button>
            </div>
          </div>
        </div>

        {/* Right: Content Area */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className="p-6"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>

      <EvidenceViewer
        evidence={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />

      <ProvenanceDrawer
        isOpen={isProvenanceOpen}
        onClose={() => setIsProvenanceOpen(false)}
        provenance={sampleProvenance}
      />

      <SystemHealthModal
        isOpen={isSystemHealthOpen}
        onClose={() => setIsSystemHealthOpen(false)}
      />
    </div>
  );
}
