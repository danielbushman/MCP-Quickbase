import NodeCache from 'node-cache';
import { createLogger } from './logger';

const logger = createLogger('cache');

/**
 * Cache service for API responses
 */
export class CacheService {
  private cache: NodeCache;
  private enabled: boolean;

  /**
   * Creates a new cache service
   * @param ttl Default TTL in seconds (default: 3600)
   * @param enabled Whether caching is enabled (default: true)
   */
  constructor(ttl: number = 3600, enabled: boolean = true) {
    this.cache = new NodeCache({ stdTTL: ttl, checkperiod: ttl * 0.2 });
    this.enabled = enabled;
    logger.info(`Cache initialized with TTL of ${ttl} seconds, enabled: ${enabled}`);
  }

  /**
   * Gets a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    if (!this.enabled) {
      return undefined;
    }

    const value = this.cache.get<T>(key);
    if (value) {
      logger.debug(`Cache hit for key: ${key}`);
    } else {
      logger.debug(`Cache miss for key: ${key}`);
    }
    return value;
  }

  /**
   * Sets a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl TTL in seconds (optional, uses default if not specified)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    if (!this.enabled) {
      return;
    }

    this.cache.set(key, value, ttl);
    logger.debug(`Cache set for key: ${key}`);
  }

  /**
   * Removes a value from the cache
   * @param key Cache key
   */
  del(key: string): void {
    this.cache.del(key);
    logger.debug(`Cache entry deleted for key: ${key}`);
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    this.cache.flushAll();
    logger.info('Cache cleared');
  }

  /**
   * Enables or disables the cache
   * @param enabled Whether the cache should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Cache ${enabled ? 'enabled' : 'disabled'}`);
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Returns whether the cache is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}