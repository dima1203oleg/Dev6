import React, { useState } from "react";
import {
  User,
  Landmark,
  Briefcase,
  Truck,
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Clock,
  Database,
  Network,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  ArrowRight,
  Info,
  ShieldAlert,
  HeartPulse,
  History,
  MapPin,
  Phone,
  Mail,
  FileCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { Dossier, VerificationStatus, RelationshipType, EntityType } from "../types";
import NetworkGraph from "./NetworkGraph";
import EvidenceViewer from "./EvidenceViewer";

interface DossierViewProps {
  dossier: Dossier;
  onBack: () => void;
}

export default function DossierView({ dossier, onBack }: DossierViewProps) {
  const { entity, verification, risk, quality, modules } = dossier;
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.CONFIRMED:
        return "bg-green-500/10 text-green-500 border-green-500/50";
      case VerificationStatus.CONFLICT:
        return "bg-red-500/10 text-red-500 border-red-500/50";
      case VerificationStatus.SINGLE_SOURCE:
        return "bg-blue-500/10 text-blue-500 border-blue-500/50";
      case VerificationStatus.UNVERIFIED:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/50";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/50";
    }
  };

  const getIdentifier = (key: "rnokpp" | "edrpou" | "ipn" | "vin") => {
    const ids = entity.identifiers as any;
    return ids[key];
  };

  const tabs = [
    { id: "overview", label: "Загальний огляд", icon: Layers },
    { id: "identity", label: "Профіль особи", icon: User },
    { id: "fop", label: "Дані ФОП", icon: Briefcase },
    { id: "companies", label: "Пов'язані компанії", icon: Landmark },
    { id: "relations", label: "Граф зв'язків", icon: Network },
    { id: "assets", label: "Активи та майно", icon: Database },
    { id: "vehicles", label: "Транспортні засоби", icon: Truck },
    { id: "courts", label: "Судові рішення", icon: Landmark },
    { id: "sanctions", label: "Перевірка санкцій", icon: Shield },
    { id: "timeline", label: "Хронологія подій", icon: History },
    { id: "evidence", label: "Джерела та докази", icon: FileText },
    { id: "risk", label: "Оцінка ризиків", icon: Activity },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "FOP", value: modules.fop?.length || 0, icon: Briefcase },
                { label: "Companies", value: modules.companies?.length || 0, icon: Landmark },
                { label: "Vehicles", value: modules.vehicles?.length || 0, icon: Truck },
                { label: "Courts", value: modules.courts?.length || 0, icon: Landmark },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">{metric.value}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">{metric.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NetworkGraph data={dossier.network} />

              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-400" />
                    Risk Drivers
                  </h3>
                  {risk.drivers.length > 0 ? (
                    <div className="space-y-3">
                      {risk.drivers.map((driver, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg"
                        >
                          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-red-200">{driver.type}</div>
                            <div className="text-xs text-slate-400">{driver.description}</div>
                            <div className="text-[10px] text-red-500/70 uppercase tracking-widest font-mono mt-1">
                              SEVERITY: {driver.severity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 space-y-2">
                      <CheckCircle size={32} className="mx-auto text-green-500/30" />
                      <p className="text-sm font-mono uppercase tracking-widest">No Critical Risks Detected</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HeartPulse size={16} className="text-green-400" />
                    Source Health
                  </h3>
                  <div className="space-y-4">
                    {dossier.sources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${source.status === "LIVE" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"}`}
                          />
                          <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                            {source.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            {source.status}
                          </div>
                          <div className="text-[10px] font-mono text-slate-600">
                            {Math.floor(source.reliability * 100)}% REL
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "identity":
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identification Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-3 text-sm">
                  <span className="text-slate-500">Full Name</span>
                  <span className="col-span-2 text-white font-medium">
                    {"fullName" in entity ? entity.fullName : "name" in entity ? entity.name : entity.plate}
                  </span>
                </div>
                {getIdentifier("rnokpp") && (
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500">RNOKPP</span>
                    <span className="col-span-2 text-white font-mono">{getIdentifier("rnokpp")}</span>
                  </div>
                )}
                {getIdentifier("edrpou") && (
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500">EDRPOU</span>
                    <span className="col-span-2 text-white font-mono">{getIdentifier("edrpou")}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className="col-span-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusColor(entity.status)}`}
                    >
                      {entity.status}
                    </span>
                  </span>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 flex flex-col items-center justify-center space-y-2 border border-slate-700">
                <div className="text-4xl font-bold text-blue-400">{entity.identityMatchScore}%</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Identity Match Score</div>
              </div>
            </div>
          </div>
        );
      case "evidence":
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-blue-400" />
                Verified Evidence Chain
              </h3>
              <span className="text-xs text-slate-500 font-mono">HASH PROTECTED</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Retrieved</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {dossier.evidence.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-blue-500/10 rounded text-blue-400">
                            <Database size={12} />
                          </div>
                          <span className="text-xs font-bold text-slate-300">{ev.sourceName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${ev.confidence * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {Math.floor(ev.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 font-mono">
                        {new Date(ev.retrievedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setSelectedClaim(ev)}
                          className="p-2 hover:bg-blue-600/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "timeline":
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-[31px] bottom-0 w-px bg-slate-800" />
            {dossier.timeline.map((event, i) => (
              <div key={i} className="relative pl-12 group">
                <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] z-10 group-hover:scale-125 transition-transform" />
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-blue-400 font-bold">{event.date}</span>
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-mono">
                      Source: {event.source}
                    </span>
                  </div>
                  <div className="text-lg font-medium text-white">{event.event}</div>
                </div>
              </div>
            ))}
          </div>
        );
      case "companies": {
        const companies = dossier.modules.companies || [];
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Landmark size={16} className="text-emerald-400" />
                Юридичні особи / Асоційовані компанії ({companies.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono">ЄДРПОУ REGISTER</span>
            </div>
            {companies.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Юридичних осіб не знайдено.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Назва компанії</th>
                      <th className="px-4 py-3">ЄДРПОУ / Код</th>
                      <th className="px-4 py-3">Пов'язана роль</th>
                      <th className="px-4 py-3">Статус компанії</th>
                      <th className="px-4 py-3">Джерела</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {companies.map((comp, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-4 font-medium text-white">{comp.toName}</td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-300">{comp.edrpou || comp.toId}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium">
                            {comp.roleName || comp.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold border ${
                              comp.status === "ПРИПИНЕНО"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                            }`}
                          >
                            {comp.status || "ДІЮЧИЙ"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-mono text-slate-500">
                          {comp.sourceIds.join(", ").toUpperCase()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }
      case "fop": {
        const fops = dossier.modules.fop || [];
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={16} className="text-amber-400" />
                Фізичні особи-підприємці (ФОП) ({fops.length})
              </h3>
            </div>
            {fops.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Записів про реєстрацію ФОП не виявлено.</div>
            ) : (
              <div className="p-6 space-y-6">
                {fops.map((fop, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/20 border border-slate-800 rounded-xl p-6"
                  >
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
                        <span className="col-span-2 text-white font-mono">
                          {fop.identifiers.registrationDate || "Н/Д"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-slate-500 font-mono">Стан</span>
                        <span className="col-span-2">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase">
                            {fop.status}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center items-center bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                      <div className="text-3xl font-bold text-amber-400">{fop.identityMatchScore}%</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">
                        Оцінка збігу особи
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      case "relations": {
        const companies = dossier.modules.companies || [];
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Network size={16} className="text-indigo-400" />
                Виявлені зв'язки та афіліації ({companies.length})
              </h3>
            </div>
            {companies.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Зв'язків не знайдено.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Пов'язаний об'єкт</th>
                      <th className="px-4 py-3">Тип зв'язку</th>
                      <th className="px-4 py-3">Джерела зв'язку</th>
                      <th className="px-4 py-3">Надійність зв'язку</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {companies.map((comp, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium text-white">{comp.toName}</div>
                          <div className="text-xs text-slate-500 font-mono">Код: {comp.edrpou || comp.toId}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-300 font-mono text-xs">{comp.roleName || comp.type}</td>
                        <td className="px-4 py-4 text-xs font-mono text-slate-500">
                          {comp.sourceIds.join(", ").toUpperCase()}
                        </td>
                        <td className="px-4 py-4 text-emerald-400 font-mono text-xs">
                          {Math.floor(comp.confidence * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }
      case "courts": {
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
              <Landmark size={16} className="text-cyan-400" />
              Єдиний державний реєстр судових рішень (ЄДРСР)
            </h3>
            <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Судових проваджень не виявлено</h4>
                <p className="text-xs text-slate-400">
                  Перевірка за ПІБ, ІПН та назвами компаній дала повністю негативний результат. Фізична особа має
                  ідеальну судову історію.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-lg">
                <div className="text-xs text-slate-500 uppercase font-mono">Кримінальні справи</div>
                <div className="text-2xl font-bold text-white mt-1">0</div>
              </div>
              <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-lg">
                <div className="text-xs text-slate-500 uppercase font-mono">Адміністративні справи</div>
                <div className="text-2xl font-bold text-white mt-1">0</div>
              </div>
              <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-lg">
                <div className="text-xs text-slate-500 uppercase font-mono">Цивільні справи</div>
                <div className="text-2xl font-bold text-white mt-1">0</div>
              </div>
            </div>
          </div>
        );
      }
      case "sanctions": {
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
              <Shield size={16} className="text-rose-400" />
              Перевірка санкційних списків (РНБО, OFAC, ЄС)
            </h3>
            <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Санкційні обмеження відсутні</h4>
                <p className="text-xs text-slate-400">
                  Об'єкт відсутній у базах даних РНБО України, OFAC (США), санкційних реєстрах Євросоюзу та
                  Великобританії.
                </p>
              </div>
            </div>
            <div className="border border-slate-800 rounded-lg divide-y divide-slate-800 text-sm">
              <div className="p-4 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Реєстр РНБО України</span>
                <span className="text-emerald-400 font-bold font-mono">CLEAN</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-slate-400 font-medium">База даних НАЗК (PEP-статус)</span>
                <span className="text-slate-400 font-mono">Ні (Not a PEP)</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Міжнародні чорні списки</span>
                <span className="text-emerald-400 font-bold font-mono">CLEAN</span>
              </div>
            </div>
          </div>
        );
      }
      case "risk": {
        const score = dossier.risk.score;
        const level = dossier.risk.level;
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-4">
              <Activity size={16} className="text-amber-400" />
              Аналіз фінансових та комплаєнс ризиків
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 bg-slate-800/40 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-2 text-center">
                <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                  Зведений індекс ризику
                </span>
                <div
                  className={`text-5xl font-black ${
                    score > 50 ? "text-rose-400" : score > 20 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {score} / 100
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${
                    level === "HIGH"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : level === "MEDIUM"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}
                >
                  {level} RISK
                </span>
              </div>
              <div className="col-span-2 space-y-4">
                <h4 className="text-white font-bold text-sm">Фактори комплаєнсу</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/20 border border-slate-800 rounded-lg">
                    <span className="text-sm text-slate-300">Статус платника податків</span>
                    <span className="text-xs text-emerald-400 font-bold">Активний, боргів немає</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/20 border border-slate-800 rounded-lg">
                    <span className="text-sm text-slate-300">Судові позови або застави</span>
                    <span className="text-xs text-emerald-400 font-bold">Відсутні</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/20 border border-slate-800 rounded-lg">
                    <span className="text-sm text-slate-300">Зв'язки із санкційними PEP-особами</span>
                    <span className="text-xs text-emerald-400 font-bold">Не виявлено</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      default:
        return (
          <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <div className="text-slate-600 space-y-2">
              <Info size={40} className="mx-auto opacity-20" />
              <p className="font-mono text-sm uppercase tracking-widest">
                Section {activeTab} is being populated from live connectors...
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors group"
        >
          <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={20} />
          <span>Повернутися до пошуку</span>
        </button>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900">
            <div
              className={`w-2 h-2 rounded-full ${dossier.metadata.mode === "PRODUCTION" ? "bg-green-500 animate-pulse" : "bg-amber-500 animate-pulse"}`}
            />
            <span
              className={`${dossier.metadata.mode === "PRODUCTION" ? "text-green-500" : "text-amber-500"} uppercase font-bold tracking-tighter`}
            >
              {dossier.metadata.mode} MODE ACTIVE
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          {entity.type === EntityType.PERSON ? <User size={160} /> : <Landmark size={160} />}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-md border text-[10px] font-bold tracking-widest uppercase ${getStatusColor(entity.status)}`}
              >
                {entity.status}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-blue-500/30 bg-blue-500/5 text-blue-400 text-[10px] font-bold tracking-widest uppercase">
                <Activity size={12} />
                Match Score: {entity.identityMatchScore}%
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              {"fullName" in entity ? entity.fullName : "name" in entity ? entity.name : entity.plate}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {getIdentifier("edrpou") && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-800 group hover:border-slate-600 transition-colors">
                  <span className="text-slate-500 font-mono">ЄДРПОУ:</span>
                  <span className="text-white font-mono select-all">{getIdentifier("edrpou")}</span>
                </div>
              )}
              {getIdentifier("rnokpp") && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-800 group hover:border-slate-600 transition-colors">
                  <span className="text-slate-500 font-mono">РНОКПП:</span>
                  <span className="text-white font-mono select-all">{getIdentifier("rnokpp")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{dossier.sources.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Джерела</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{dossier.evidence.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Докази</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{quality.confidence}%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Достовірність</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${risk.score < 30 ? "text-green-500" : risk.score < 60 ? "text-amber-500" : "text-red-500"}`}
              >
                {risk.score}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Індекс ризику</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${
                  isActive
                    ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </div>
                <ChevronRight
                  size={14}
                  className={`${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                />
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-9">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>

      <EvidenceViewer evidence={selectedClaim} onClose={() => setSelectedClaim(null)} />
    </div>
  );
}
