/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * STIX 2.1 & GraphML Export Modal Component
 */

import React, { useState } from 'react';
import { FileCode, Download, Copy, Check, X, Share2, Layers, Shield, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { OsintEntity } from '../osintData';
import { convertEntityToStix21, convertEntityToGraphML, downloadFile } from '../utils/stixGraphmlExporter';
import { useToast } from './ToastProvider';

interface StixExporterModalProps {
  entity: OsintEntity;
  onClose: () => void;
}

export default function StixExporterModal({ entity, onClose }: StixExporterModalProps) {
  const [activeFormat, setActiveFormat] = useState<'stix' | 'graphml'>('stix');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const stixData = convertEntityToStix21(entity);
  const stixJsonString = JSON.stringify(stixData, null, 2);
  const graphmlXmlString = convertEntityToGraphML(entity);

  const handleCopy = () => {
    const textToCopy = activeFormat === 'stix' ? stixJsonString : graphmlXmlString;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast(`Скопійовано ${activeFormat.toUpperCase()} у буфер обміну`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (activeFormat === 'stix') {
      downloadFile(stixJsonString, `NEXUS_STIX21_${entity.code}_${entity.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`, 'application/json');
      showToast('Завантажено STIX 2.1 JSON специфікацію', 'success');
    } else {
      downloadFile(graphmlXmlString, `NEXUS_GRAPHML_${entity.code}_${entity.name.replace(/[^a-zA-Z0-9]/g, '_')}.graphml`, 'application/xml');
      showToast('Завантажено GraphML граф для Gephi/Maltego', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
                Експорт Графу & Інтелігенції у Стандарти CTI
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Суб'єкт: <span className="text-slate-200 font-bold">{entity.name}</span> ({entity.code})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Switcher */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveFormat('stix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFormat === 'stix'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>STIX 2.1 JSON</span>
            </button>

            <button
              onClick={() => setActiveFormat('graphml')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFormat === 'graphml'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>GraphML XML (Gephi / Maltego)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Скопійовано' : 'Копіювати'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Завантажити {activeFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Code Preview Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar">
          <pre className="whitespace-pre-wrap break-all text-[11px] text-blue-300/90 selection:bg-blue-900">
            {activeFormat === 'stix' ? stixJsonString : graphmlXmlString}
          </pre>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
          <span>Специфікація: OASIS CTI STIX 2.1 Standard / GraphML Specification</span>
          <span className="text-emerald-400 font-bold">100% Валідовано для аналітичних систем</span>
        </div>
      </motion.div>
    </div>
  );
}
