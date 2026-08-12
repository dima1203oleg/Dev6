/**
 * Predator Card View Component
 * Displays entity cards with field provenance and API integration
 */

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Clock, ChevronRight, ExternalLink, Copy } from 'lucide-react';

interface FieldProvenance {
  source_id: string;
  source_name: string;
  source_url: string;
  source_version: string;
  schema_version: string;
  parser_version: string;
  mapping_version: string;
  normalizer_version: string;
  entity_resolution_version: string;
  card_contract_version: string;
  source_timestamp: string;
  retrieved_at: string;
  verification_status: 'FACT' | 'DERIVED' | 'HYPOTHESIS' | 'UNKNOWN' | 'CONFLICTED';
  confidence: number;
  transformation_steps: string[];
  source_field_name?: string;
}

interface CardField {
  field_name: string;
  field_value: any;
  field_type: string;
  confidence: number;
  validation_status: 'PASS' | 'WARNING' | 'NO_DATA' | 'FAIL';
  created_at: string;
}

interface PredatorCard {
  card_id: string;
  card_type: string;
  entity_id: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  confidence: number;
  created_at: string;
  updated_at: string;
  fields: Record<string, CardField>;
  metadata?: any;
}

interface PredatorCardViewProps {
  card: PredatorCard;
  onFieldClick?: (fieldName: string) => void;
  showProvenance?: boolean;
}

export function PredatorCardView({ card, onFieldClick, showProvenance = true }: PredatorCardViewProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [fieldProvenance, setFieldProvenance] = useState<FieldProvenance | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFieldClick = async (fieldName: string) => {
    setSelectedField(fieldName);
    if (onFieldClick) {
      onFieldClick(fieldName);
    }
    
    if (showProvenance) {
      setLoading(true);
      try {
        const response = await fetch(`/api/v2/predator/cards/${card.card_id}/fields/${fieldName}/provenance`);
        if (response.ok) {
          const data = await response.json();
          setFieldProvenance(data.provenance);
        }
      } catch (error) {
        console.error('Failed to fetch field provenance:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getValidationIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'NO_DATA':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getVerificationBadge = (status: string) => {
    const colors = {
      FACT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      DERIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      HYPOTHESIS: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      UNKNOWN: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      CONFLICTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status as keyof typeof colors] || colors.UNKNOWN;
  };

  const formatFieldValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '-';
    if (type === 'date' && value) {
      return new Date(value).toLocaleDateString('uk-UA');
    }
    if (type === 'number' && value) {
      return value.toLocaleString('uk-UA');
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-lg font-semibold text-white">{card.card_type}</h3>
              <p className="text-sm text-indigo-100 dark:text-indigo-200">{card.card_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              card.status === 'PUBLISHED' ? 'bg-green-500 text-white' :
              card.status === 'DRAFT' ? 'bg-yellow-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {card.status}
            </span>
            <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium text-white">
              {(card.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(card.fields).map(([fieldName, field]) => (
            <div
              key={fieldName}
              onClick={() => handleFieldClick(fieldName)}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                selectedField === fieldName
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                  {fieldName.replace(/_/g, ' ')}
                </label>
                <div className="flex items-center gap-2">
                  {getValidationIcon(field.validation_status)}
                  <span className="text-xs text-slate-400">
                    {(field.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {formatFieldValue(field.field_value, field.field_type)}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                {new Date(field.created_at).toLocaleString('uk-UA')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field Provenance Panel */}
      {selectedField && showProvenance && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Provenance: {selectedField.replace(/_/g, ' ')}
            </h4>
            <button
              onClick={() => setSelectedField(null)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : fieldProvenance ? (
            <div className="space-y-4">
              {/* Source Information */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Source Information
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Source:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fieldProvenance.source_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Source ID:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fieldProvenance.source_id}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 dark:text-slate-400">URL:</span>
                    <a
                      href={fieldProvenance.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {fieldProvenance.source_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Version Tracking */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Version Tracking
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Source</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fieldProvenance.source_version}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Schema</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fieldProvenance.schema_version}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Parser</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fieldProvenance.parser_version}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Mapping</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fieldProvenance.mapping_version}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Normalizer</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fieldProvenance.normalizer_version}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Entity Resolution</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fieldProvenance.entity_resolution_version}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">Card Contract</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{fieldProvenance.card_contract_version}</p>
                  </div>
                </div>
              </div>

              {/* Verification & Confidence */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Verification & Confidence
                </h5>
                <div className="flex items-center gap-4 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVerificationBadge(fieldProvenance.verification_status)}`}>
                    {fieldProvenance.verification_status}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Confidence</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {(fieldProvenance.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${fieldProvenance.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Source Timestamp:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {new Date(fieldProvenance.source_timestamp).toLocaleString('uk-UA')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Retrieved At:</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {new Date(fieldProvenance.retrieved_at).toLocaleString('uk-UA')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transformation Steps */}
              {fieldProvenance.transformation_steps && fieldProvenance.transformation_steps.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Transformation Steps
                  </h5>
                  <div className="space-y-2">
                    {fieldProvenance.transformation_steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-indigo-500" />
                        <span className="text-slate-700 dark:text-slate-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Field Name */}
              {fieldProvenance.source_field_name && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-sm">Source Field:</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {fieldProvenance.source_field_name}
                      </p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(fieldProvenance.source_field_name)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No provenance data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
