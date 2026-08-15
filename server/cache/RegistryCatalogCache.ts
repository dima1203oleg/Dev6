/**
 * Cached Registry Catalog Service
 * Handles caching and retrieval of 170+ Ukrainian registry sources
 */

import { cacheManager } from './RedisManager';
import { FULL_REGISTRY_CATALOG, getRegistryStats } from '../datasources/registries/universalCatalog';
import { logger } from '../middleware/observability';

interface CachedRegistryStats {
  totalSources: number;
  activeSources: number;
  totalCategories: number;
  lastUpdated: string;
}

class RegistryCatalogCache {
  private readonly CATALOG_CACHE_KEY = 'registry:catalog:full';
  private readonly STATS_CACHE_KEY = 'registry:stats';
  private readonly MATRIX_CACHE_KEY = 'registry:matrix';
  private readonly CATALOG_TTL = 3600; // 1 hour
  private readonly STATS_TTL = 600; // 10 minutes

  /**
   * Get full registry catalog with caching
   */
  async getCatalog() {
    try {
      // Try to get from cache first
      const cached = await cacheManager.get(this.CATALOG_CACHE_KEY);
      if (cached) {
        logger.debug('[RegistryCache] Catalog hit from Redis');
        return cached;
      }

      // Cache miss - compute and store
      logger.debug('[RegistryCache] Catalog miss - computing from source');
      const catalog = FULL_REGISTRY_CATALOG.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        owner: s.owner,
        isFree: s.isFree,
        isAutomatic: s.isAutomatic,
        searchFields: s.searchFields,
        provides: s.provides,
        url: s.url,
      }));

      // Store in cache
      await cacheManager.set(this.CATALOG_CACHE_KEY, catalog, {
        ttl: this.CATALOG_TTL,
      });

      return catalog;
    } catch (err) {
      logger.error('[RegistryCache] Catalog error:', err);
      // Fallback to direct computation
      return FULL_REGISTRY_CATALOG;
    }
  }

  /**
   * Get cached registry statistics
   */
  async getStats(): Promise<CachedRegistryStats> {
    try {
      const cached = await cacheManager.get<CachedRegistryStats>(this.STATS_CACHE_KEY);
      if (cached) {
        logger.debug('[RegistryCache] Stats hit from Redis');
        return cached;
      }

      // Compute stats
      const stats = getRegistryStats();
      const result: CachedRegistryStats = {
        totalSources: stats.totalSources,
        activeSources: stats.activeSources,
        totalCategories: stats.totalCategories,
        lastUpdated: new Date().toISOString(),
      };

      await cacheManager.set(this.STATS_CACHE_KEY, result, {
        ttl: this.STATS_TTL,
      });

      return result;
    } catch (err) {
      logger.error('[RegistryCache] Stats error:', err);
      return {
        totalSources: FULL_REGISTRY_CATALOG.length,
        activeSources: FULL_REGISTRY_CATALOG.length,
        totalCategories: new Set(FULL_REGISTRY_CATALOG.map(s => s.category)).size,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get compatibility matrix with caching
   */
  async getCompatibilityMatrix() {
    try {
      const cached = await cacheManager.get(this.MATRIX_CACHE_KEY);
      if (cached) {
        logger.debug('[RegistryCache] Matrix hit from Redis');
        return cached;
      }

      // Compute matrix - expensive operation
      const matrix = FULL_REGISTRY_CATALOG.map(source => ({
        id: source.id,
        name: source.name,
        supports: {
          webhook: source.isAutomatic,
          oauth: source.supportsOAuth || false,
          apiKey: source.supportsAPIKey || true,
          basicAuth: source.supportsBasicAuth || false,
        },
        rateLimit: source.rateLimit || 'unlimited',
        avgResponseTime: source.avgResponseTime || '500ms',
      }));

      await cacheManager.set(this.MATRIX_CACHE_KEY, matrix, {
        ttl: this.CATALOG_TTL,
      });

      return matrix;
    } catch (err) {
      logger.error('[RegistryCache] Matrix error:', err);
      return [];
    }
  }

  /**
   * Cache entity search results
   */
  async cacheEntitySearch(query: string, identifierType: string, results: any[]) {
    const cacheKey = `entity:search:${identifierType}:${query}`;
    try {
      await cacheManager.set(cacheKey, results, { ttl: 1800 }); // 30 min
    } catch (err) {
      logger.error('[RegistryCache] Entity cache error:', err);
    }
  }

  /**
   * Get cached entity search results
   */
  async getEntitySearch(query: string, identifierType: string) {
    const cacheKey = `entity:search:${identifierType}:${query}`;
    try {
      return await cacheManager.get(cacheKey);
    } catch (err) {
      logger.error('[RegistryCache] Entity retrieve error:', err);
      return null;
    }
  }

  /**
   * Invalidate catalog cache (call after updates)
   */
  async invalidateCatalog() {
    try {
      await Promise.all([
        cacheManager.delete(this.CATALOG_CACHE_KEY),
        cacheManager.delete(this.STATS_CACHE_KEY),
        cacheManager.delete(this.MATRIX_CACHE_KEY),
      ]);
      logger.info('[RegistryCache] Catalog cache invalidated');
    } catch (err) {
      logger.error('[RegistryCache] Invalidation error:', err);
    }
  }
}

export const registryCatalogCache = new RegistryCatalogCache();
