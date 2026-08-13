/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Dynamic Card Registry with auto-discovery
 */

import { CardDefinition } from '../cardRegistry';
import { DynamicCardRegistry, DiscoveredCard, CardCategoryHierarchy } from './types';

export class DynamicCardRegistryManager {
  private static instance: DynamicCardRegistryManager;
  private registry: DynamicCardRegistry;
  private discoveredCards: Map<string, DiscoveredCard> = new Map();

  private constructor() {
    this.registry = {
      version: '2.0.0',
      lastUpdated: new Date().toISOString(),
      categories: [],
      totalCards: 0,
      autoDiscovered: false,
    };
  }

  static getInstance(): DynamicCardRegistryManager {
    if (!DynamicCardRegistryManager.instance) {
      DynamicCardRegistryManager.instance = new DynamicCardRegistryManager();
    }
    return DynamicCardRegistryManager.instance;
  }

  /**
   * Initialize dynamic registry with hierarchical structure
   */
  async initializeRegistry(baseCards: CardDefinition[]): Promise<void> {
    const categories = this.buildHierarchicalCategories(baseCards);
    
    this.registry = {
      version: '2.0.0',
      lastUpdated: new Date().toISOString(),
      categories,
      totalCards: baseCards.length,
      autoDiscovered: true,
    };
  }

  /**
   * Build hierarchical category structure
   */
  private buildHierarchicalCategories(cards: CardDefinition[]): CardCategoryHierarchy[] {
    const categoryMap = new Map<string, CardCategoryHierarchy>();

    // Define category hierarchy
    const hierarchy = [
      {
        id: 'general',
        name: 'General',
        description: 'General information cards',
        parent: undefined,
        cardTypes: ['general'],
      },
      {
        id: 'personal',
        name: 'Personal',
        description: 'Personal information cards',
        parent: undefined,
        cardTypes: ['passport', 'address', 'family', 'relatives', 'children'],
      },
      {
        id: 'assets',
        name: 'Assets',
        description: 'Asset-related cards',
        parent: undefined,
        cardTypes: ['real_estate', 'transport', 'ownership'],
      },
      {
        id: 'companies',
        name: 'Companies',
        description: 'Company-related cards',
        parent: undefined,
        cardTypes: ['legal_entities', 'beneficial', 'business_connections'],
      },
      {
        id: 'courts',
        name: 'Courts',
        description: 'Court and legal cards',
        parent: undefined,
        cardTypes: ['court_cases', 'enforcement'],
      },
      {
        id: 'tax',
        name: 'Tax',
        description: 'Tax-related cards',
        parent: undefined,
        cardTypes: ['tax'],
      },
      {
        id: 'risks',
        name: 'Risks',
        description: 'Risk assessment cards',
        parent: undefined,
        cardTypes: ['sanctions', 'risks'],
      },
      {
        id: 'communications',
        name: 'Communications',
        description: 'Communication cards',
        parent: undefined,
        cardTypes: ['phones', 'email', 'social_media'],
      },
      {
        id: 'ai',
        name: 'AI Generated',
        description: 'AI-generated cards',
        parent: undefined,
        cardTypes: ['ai_analytics'],
      },
      {
        id: 'custom',
        name: 'Custom Cards',
        description: 'Custom plugin cards',
        parent: undefined,
        cardTypes: [],
      },
    ];

    // Build category map
    hierarchy.forEach(cat => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parent: cat.parent,
        children: [],
        cards: [],
      });
    });

    // Assign cards to categories
    cards.forEach(card => {
      const category = hierarchy.find(cat => cat.cardTypes.includes(card.id));
      if (category) {
        const catEntry = categoryMap.get(category.id);
        if (catEntry) {
          catEntry.cards.push(card);
        }
      }
    });

    // Build parent-child relationships
    categoryMap.forEach((cat, _id) => {
      if (cat.parent) {
        const parent = categoryMap.get(cat.parent);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(cat);
        }
      }
    });

    return Array.from(categoryMap.values());
  }

  /**
   * Discover new cards from UI
   */
  async discoverCards(): Promise<DiscoveredCard[]> {
    const discovered: DiscoveredCard[] = [];

    // DOM Scan (simulated - in production would use actual DOM scanning)
    const domCards = await this.scanDOM();
    discovered.push(...domCards);

    // Component Scan
    const componentCards = await this.scanComponents();
    discovered.push(...componentCards);

    // Route Scan
    const routeCards = await this.scanRoutes();
    discovered.push(...routeCards);

    // Feature Flags
    const featureFlagCards = await this.scanFeatureFlags();
    discovered.push(...featureFlagCards);

    // Update registry
    discovered.forEach(card => {
      this.discoveredCards.set(card.id, card);
    });

    // Merge discovered cards into registry
    this.mergeDiscoveredCards();

    return discovered;
  }

  /**
   * Scan DOM for card components
   */
  private async scanDOM(): Promise<DiscoveredCard[]> {
    // In production, this would use Playwright or similar to scan the actual DOM
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Scan React components for card definitions
   */
  private async scanComponents(): Promise<DiscoveredCard[]> {
    // In production, this would scan the component tree
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Scan routes for card endpoints
   */
  private async scanRoutes(): Promise<DiscoveredCard[]> {
    // In production, this would scan the routing configuration
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Scan feature flags for conditional cards
   */
  private async scanFeatureFlags(): Promise<DiscoveredCard[]> {
    // In production, this would check feature flag configuration
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Merge discovered cards into registry
   */
  private mergeDiscoveredCards(): void {
    this.discoveredCards.forEach((discovered, cardId) => {
      // Check if card already exists in registry
      let found = false;
      
      for (const category of this.registry.categories) {
        const existing = category.cards.find(c => c.id === cardId);
        if (existing) {
          found = true;
          // Update existing card with discovery info
          break;
        }
      }

      if (!found) {
        // Add as new card to appropriate category
        const category = this.determineCategory(discovered);
        if (category) {
          category.cards.push({
            id: discovered.id,
            name: discovered.name,
            category: this.mapToCardCategory(category.id),
            componentPath: discovered.componentPath,
            requiredFields: [],
            optionalFields: [],
            critical: false,
          });
          this.registry.totalCards++;
        }
      }
    });

    this.registry.lastUpdated = new Date().toISOString();
  }

  /**
   * Determine category for discovered card
   */
  private determineCategory(card: DiscoveredCard): CardCategoryHierarchy | undefined {
    // Simple heuristic based on card name
    const name = card.name.toLowerCase();
    
    if (name.includes('паспорт') || name.includes('document')) {
      return this.registry.categories.find(c => c.id === 'personal');
    }
    if (name.includes('компанія') || name.includes('юридична')) {
      return this.registry.categories.find(c => c.id === 'companies');
    }
    if (name.includes('суд') || name.includes('виконавче')) {
      return this.registry.categories.find(c => c.id === 'courts');
    }
    if (name.includes('податок') || name.includes('tax')) {
      return this.registry.categories.find(c => c.id === 'tax');
    }
    if (name.includes('санкція') || name.includes('ризик')) {
      return this.registry.categories.find(c => c.id === 'risks');
    }
    if (name.includes('нерухомість') || name.includes('транспорт')) {
      return this.registry.categories.find(c => c.id === 'assets');
    }
    
    // Default to custom
    return this.registry.categories.find(c => c.id === 'custom');
  }

  /**
   * Map category ID to CardCategory type
   */
  private mapToCardCategory(categoryId: string): any {
    const mapping: Record<string, any> = {
      'general': 'general',
      'personal': 'passport',
      'assets': 'real_estate',
      'companies': 'legal_entities',
      'courts': 'court_cases',
      'tax': 'tax',
      'risks': 'sanctions',
      'communications': 'phones',
      'ai': 'ai_analytics',
      'custom': 'general',
    };
    return mapping[categoryId] || 'general';
  }

  /**
   * Get current registry
   */
  getRegistry(): DynamicCardRegistry {
    return this.registry;
  }

  /**
   * Get card by ID
   */
  getCard(cardId: string): CardDefinition | undefined {
    for (const category of this.registry.categories) {
      const card = category.cards.find(c => c.id === cardId);
      if (card) return card;
    }
    return undefined;
  }

  /**
   * Get all cards
   */
  getAllCards(): CardDefinition[] {
    const allCards: CardDefinition[] = [];
    this.registry.categories.forEach(category => {
      allCards.push(...category.cards);
    });
    return allCards;
  }

  /**
   * Get cards by category
   */
  getCardsByCategory(categoryId: string): CardDefinition[] {
    const category = this.registry.categories.find(c => c.id === categoryId);
    return category?.cards || [];
  }

  /**
   * Force registry refresh
   */
  async refresh(): Promise<void> {
    await this.discoverCards();
    this.registry.lastUpdated = new Date().toISOString();
  }
}
