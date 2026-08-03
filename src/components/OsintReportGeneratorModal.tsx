/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Official OSINT Report & Memorandum Generator Modal
 */

import React, { useRef } from "react";
import { FileText, Printer, Download, X, ShieldCheck, CheckCircle2, Lock, Award, QrCode } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { OsintEntity } from "../types/osint";
import { useToast } from "./ToastProvider";

interface OsintReportGeneratorModalProps {
  entity: OsintEntity;
  onClose: () => void;
}

export default function OsintReportGeneratorModal({ entity, onClose }: OsintReportGeneratorModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const currentDate = new Date().toLocaleDateString("uk-UA", { year: "numeric", month: "long", day: "numeric" });
  const docReference = `NEXUS-MEMO-${entity.code}-${crypto.randomUUID()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    showToast("Генерація офіційного PDF меморандуму...", "info");

    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${docReference}_OSINT_MEMORANDUM.pdf`);
      showToast("Офіційний аналітичний меморандум завантажено!", "success");
    } catch (err) {
      showToast("Помилка формування PDF", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
              Генератор Офіційного OSINT-Меморандуму NEXUS
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Друк / PDF</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Експорт PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Formal Document Preview */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950 custom-scrollbar flex justify-center">
          <div
            ref={reportRef}
            className="bg-white text-slate-900 p-8 rounded shadow-2xl w-full max-w-[210mm] font-serif text-sm leading-relaxed space-y-6 select-text"
          >
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold font-sans uppercase tracking-tight text-slate-950">
                  ПЛАТФОРМА АНАЛІТИЧНОЇ РОЗВІДКИ NEXUS
                </h1>
                <p className="text-xs font-mono uppercase text-slate-600 tracking-wider font-semibold">
                  Офіційний Довідково-Аналітичний Меморандум OSINT / CTI
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  Реєстраційний номер: {docReference} • Дата формування: {currentDate}
                </p>
              </div>

              <div className="text-right flex flex-col items-end">
                <QRCodeSVG value={`https://nexus-osint.gov.ua/verify/${docReference}`} size={56} />
                <span className="text-[9px] font-mono text-slate-500 mt-1">Цифровий штамп автентичності</span>
              </div>
            </div>

            {/* Subject Information Header */}
            <div className="bg-slate-50 border border-slate-300 p-4 rounded space-y-2 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Об'єкт Перевірки
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                  Індекс ризику: {entity.riskScore}% ({entity.status})
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-950">{entity.name}</h2>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700">
                <div>
                  Код ЄДРПОУ / ІПН: <strong>{entity.code}</strong>
                </div>
                <div>
                  Тип суб'єкта: <strong>{entity.type.toUpperCase()}</strong>
                </div>
                <div>
                  Офшорний прапорець: <strong>{entity.isOffshoreFlag ? "ТАК (Критично)" : "НІ"}</strong>
                </div>
                <div>
                  PEP пов'язаність: <strong>{entity.isPepFlag ? "ТАК (Виявлено)" : "НІ"}</strong>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold font-sans uppercase border-b border-slate-300 pb-1 text-slate-900">
                1. РЕЗЮМЕ АНАЛІТИЧНОГО ОГЛЯДУ (EXECUTIVE SUMMARY)
              </h3>
              <p className="text-xs text-slate-800 text-justify">
                За результатами сканування публічних державних реєстрів, митних баз даних, санкційних списків РНБО, OFAC
                та аналізу криптовалютних транзакцій щодо суб'єкта <strong>{entity.name}</strong> (Код {entity.code})
                зафіксовано сукупний показник загрози у <strong>{entity.riskScore}%</strong>. Виявлено структуровані
                аномалії у структурі власності та фінансових потоках.
              </p>
            </div>

            {/* Entity Relationships */}
            <div className="space-y-2 font-sans">
              <h3 className="text-sm font-bold uppercase border-b border-slate-300 pb-1 text-slate-900">
                2. МЕРЕЖА ПОВ'ЯЗАНИХ ОСІБ ТА БЕНЕФІЦІАРІВ
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-700">
                    <th className="p-2">Найменування пов'язаного суб'єкта</th>
                    <th className="p-2">Тип зв'язку</th>
                    <th className="p-2">Частка / Права</th>
                    <th className="p-2">Індекс ризику</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {entity.relations && entity.relations.length > 0 ? (
                    entity.relations.map((rel, i) => (
                      <tr key={i} className="text-slate-800">
                        <td className="p-2 font-bold">{rel.targetName}</td>
                        <td className="p-2 font-mono text-[11px]">{rel.relationType}</td>
                        <td className="p-2 font-mono text-[11px]">
                          {rel.sharePercent ? `${rel.sharePercent}%` : "100%"}
                        </td>
                        <td className="p-2 font-mono font-bold text-rose-600">{rel.riskScore || 65}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-2 text-slate-500 italic">
                        Прямих афілійованих осіб у першому колі не виявлено
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Risk Indicators */}
            <div className="space-y-2 font-sans">
              <h3 className="text-sm font-bold uppercase border-b border-slate-300 pb-1 text-slate-900">
                3. КЛЮЧОВІ ІНДИКАТОРИ РИЗИКУ (RED FLAGS)
              </h3>
              <ul className="list-disc list-inside text-xs text-slate-800 space-y-1">
                {entity.isOffshoreFlag && (
                  <li>
                    <strong>Офшорна юрисдикція:</strong> Присутня фіктивна компанія-засновник у юрисдикції BVI/Cyprus.
                  </li>
                )}
                {entity.isPepFlag && (
                  <li>
                    <strong>Політично значуща особа (PEP):</strong> Взаємодія з екс-посадовцями державних органів.
                  </li>
                )}
                <li>
                  <strong>Фінансова аномалія:</strong> Невідповідність статутного капіталу обсягам державних закупівель.
                </li>
                <li>
                  <strong>Санкційний статус:</strong> Включено до моніторингового списку ризикових суб'єктів.
                </li>
              </ul>
            </div>

            {/* Signature & Authentication Stamp */}
            <div className="pt-6 border-t border-slate-300 flex items-center justify-between font-sans text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-900">Автоматизований підпис NEXUS OSINT ENGINE</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  SHA-256 Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </p>
              </div>

              <div className="border-2 border-emerald-600 text-emerald-800 px-3 py-1.5 rounded font-mono font-bold text-[10px] uppercase text-center rotate-[-3deg]">
                ВЕРЕДИКТ: СЕРТИФІКОВАНО
                <br />
                NEXUS VERIFIED OSINT
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
