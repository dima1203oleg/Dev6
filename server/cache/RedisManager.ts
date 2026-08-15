/**
 * Redis Cache Manager for PREDATOR Analytics
 * Handles distributed caching for registry catalog, entity search, and API responses
 */

import Redis from 'ioredis';
import { logger } from '../middleware/observability';

interface CacheOptions {
  ttl?: number; // seconds
  prefix?: string;
}

class RedisManager {
  private redis: Redis;
  private isConnected = false;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly KEY_PREFIX = 'predator:';

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      enableReadyCheck: false,
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('[Redis] Connected to cache layer');
    });

    this.redis.on('error', (err) => {
      logger.error('[Redis] Connection error:', err);
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      logger.warn('[Redis] Reconnecting...');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const data = await this.redis.get(this.KEY_PREFIX + key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logger.error(`[Cache] Get error for ${key}:`, err);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      const ttl = options.ttl ?? this.DEFAULT_TTL;
      const prefixedKey = this.KEY_PREFIX + key;
      await this.redis.setex(prefixedKey, ttl, JSON.stringify(value));
      return true;
    } catch (err) {
      logger.error(`[Cache] Set error for ${key}:`, err);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      await this.redis.del(this.KEY_PREFIX + key);
      return true;
    } catch (err) {
      logger.error(`[Cache] Delete error for ${key}:`, err);
      return false;
    }
  }

  /**
   * Clear all cache keys (use with caution)
   */
  async clear(): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      const pattern = this.KEY_PREFIX + '*';
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (err) {
      logger.error('[Cache] Clear error:', err);
      return false;
    }
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected) return keys.map(() => null);
    try {
      const prefixedKeys = keys.map(k => this.KEY_PREFIX + k);
      const data = await this.redis.mget(...prefixedKeys);
      return data.map(d => (d ? JSON.parse(d) : null));
    } catch (err) {
      logger.error('[Cache] Mget error:', err);
      return keys.map(() => null);
    }
  }

  /**
   * Batch set multiple keys
   */
  async mset<T>(entries: Array<[string, T]>, ttl = this.DEFAULT_TTL): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      const pipeline = this.redis.pipeline();
      for (const [key, value] of entries) {
        const prefixedKey = this.KEY_PREFIX + key;
        pipeline.setex(prefixedKey, ttl, JSON.stringify(value));
      }
      await pipeline.exec();
      return true;
    } catch (err) {
      logger.error('[Cache] Mset error:', err);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount = 1): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      const prefixedKey = this.KEY_PREFIX + key;
      return await this.redis.incrby(prefixedKey, amount);
    } catch (err) {
      logger.error(`[Cache] Increment error for ${key}:`, err);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      const prefixedKey = this.KEY_PREFIX + key;
      const result = await this.redis.exists(prefixedKey);
      return result === 1;
    } catch (err) {
      logger.error(`[Cache] Exists error for ${key}:`, err);
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected) return -1;
    try {
      const prefixedKey = this.KEY_PREFIX + key;
      return await this.redis.ttl(prefixedKey);
    } catch (err) {
      logger.error(`[Cache] TTL error for ${key}:`, err);
      return -1;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (err) {
      return false;
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

export const cacheManager = new RedisManager();
