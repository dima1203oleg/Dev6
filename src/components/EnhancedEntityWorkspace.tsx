/**
 * Enhanced Entity Workspace Component
 * Integrates with Predator API for real data display
 */

import React, { useState } from 'react';
import { Search, Filter, Download, Share, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PredatorCardView } from './PredatorCardView';

interface PredatorCard {
  card_id: string;
  card_type: string;
  entity_id: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  confidence: number;
  created_at: string;
  updated_at: string;
  fields: Record<string, any>;
  metadata?: any;
}

interface Entity {
  entity_id: string;
  entity_type: string;
  confidence: number;
  data: any;
}

interface EnhancedEntityWorkspaceProps {
  onBack?: () => void;
}

export function EnhancedEntityWorkspace({ onBack }: EnhancedEntityWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedCard, setSelectedCard] = useState<PredatorCard | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [cards, setCards] = useState<PredatorCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Search entities
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/predator/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, entityType: 'AUTO' })
      });
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      setEntities(data.results || []);
      
      if (data.results && data.results.length > 0) {
        setSelectedEntity(data.results[0]);
        loadCardsForEntity(data.results[0].entity_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load cards for entity
  const loadCardsForEntity = async (entityId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v2/predator/cards?entity_id=${encodeURIComponent(entityId)}`);
      if (!response.ok) {
        throw new Error(`Failed to load cards: ${response.status}`);
      }
      
      const data = await response.json();
      setCards(data.data || []);
      
      if (data.data && data.data.length > 0) {
        setSelectedCard(data.data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
      console.error('Load cards error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key in search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Filter cards by type
  const filteredCards = filterType === 'ALL' 
    ? cards 
    : cards.filter(card => card.card_type === filterType);

  const cardTypes = Array.from(new Set(cards.map(c => c.card_type)));

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              PREDATOR Entity Workspace
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-2 transition-colors">
              <Share className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by EDRPOU, IPN, name, or identifier..."
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Search
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Entity List */}
        <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Entities ({entities.length})
            </h2>
          </div>
          {entities.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No entities found</p>
              <p className="text-sm mt-2">Enter a search query to find entities</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {entities.map((entity) => (
                <button
                  key={entity.entity_id}
                  onClick={() => {
                    setSelectedEntity(entity);
                    loadCardsForEntity(entity.entity_id);
                  }}
                  className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    selectedEntity?.entity_id === entity.entity_id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {entity.entity_type}
                    </span>
                    <span className="text-xs text-slate-500">
                      {(entity.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {entity.entity_id}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Area - Cards */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Card Filter */}
          <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">All Cards</option>
                {cardTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {filteredCards.length} cards
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredCards.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No cards available</p>
                  <p className="text-sm mt-2">Select an entity to view its cards</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCards.map((card) => (
                  <div
                    key={card.card_id}
                    onClick={() => setSelectedCard(card)}
                    className={`cursor-pointer transition-all ${
                      selectedCard?.card_id === card.card_id
                        ? 'ring-2 ring-indigo-500 ring-offset-2'
                        : 'hover:shadow-xl'
                    }`}
                  >
                    <PredatorCardView
                      card={card}
                      onFieldClick={(fieldName) => console.log('Field clicked:', fieldName)}
                      showProvenance={selectedCard?.card_id === card.card_id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
