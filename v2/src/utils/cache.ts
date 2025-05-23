import NodeCache from 'node-cache';
import { createLogger } from './logger';

const logger = createLogger('cache');

/**
 * Cache service for API responses
 */
export class CacheService {
  private cache: NodeCache;
  private enabled: boolean;
  private static instances: Set<CacheService> = new Set();
  private static cleanupHandlerInstalled = false;
  private operationLock: Promise<void> = Promise.resolve();

  /**
   * Creates a new cache service
   * @param ttl Default TTL in seconds (default: 3600)
   * @param enabled Whether caching is enabled (default: true)
   */
  constructor(ttl: number = 3600, enabled: boolean = true) {
    this.cache = new NodeCache({ stdTTL: ttl, checkperiod: ttl * 0.2 });
    this.enabled = enabled;
    
    // Register this instance for cleanup
    CacheService.instances.add(this);
    
    // Install cleanup handlers once
    if (!CacheService.cleanupHandlerInstalled) {
      CacheService.installCleanupHandlers();
      CacheService.cleanupHandlerInstalled = true;
    }
    
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

    if (typeof ttl === 'number') {
      this.cache.set(key, value, ttl);
    } else {
      this.cache.set(key, value);
    }
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

  /**
   * Checks if a key exists in the cache
   * @param key Cache key
   * @returns True if the key exists, false otherwise
   */
  has(key: string): boolean {
    if (!this.enabled) {
      return false;
    }
    return this.cache.has(key);
  }

  /**
   * Removes a value from the cache (alias for del)
   * @param key Cache key
   */
  delete(key: string): void {
    this.del(key);
  }

  /**
   * Gets cache statistics
   * @returns Cache statistics
   */
  getStats(): { hits: number; misses: number; keys: number } {
    const stats = this.cache.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      keys: this.cache.keys().length
    };
  }

  /**
   * Sets a new default TTL
   * @param ttl New TTL in seconds
   */
  setTtl(ttl: number): void {
    // Serialize TTL changes to prevent corruption
    this.operationLock = this.operationLock.then(async () => {
      await this.safeTtlUpdate(ttl);
    });
  }

  private async safeTtlUpdate(ttl: number): Promise<void> {
    // Wait a brief moment to allow in-flight operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const oldCache = this.cache;
    
    // Create new cache with updated TTL
    const newCache = new NodeCache({ stdTTL: ttl, checkperiod: ttl * 0.2 });
    
    // Migrate existing data to new cache (if any)
    try {
      const keys = oldCache.keys();
      for (const key of keys) {
        const value = oldCache.get(key);
        if (value !== undefined) {
          newCache.set(key, value);
        }
      }
    } catch (error) {
      logger.warn('Error migrating cache data during TTL update', { error });
    }
    
    // Replace the cache atomically
    this.cache = newCache;
    
    // Clean up old cache
    try {
      oldCache.flushAll();
      oldCache.close();
    } catch (error) {
      logger.warn('Error closing old cache instance', { error });
    }
    
    logger.info(`Cache TTL updated to ${ttl} seconds`);
  }

  /**
   * Cleanup this cache instance
   */
  cleanup(): void {
    try {
      this.cache.flushAll();
      this.cache.close();
      logger.debug('Cache instance cleaned up');
    } catch (error) {
      logger.error('Error cleaning up cache', { error });
    }
  }

  /**
   * Install process cleanup handlers (called once)
   */
  private static installCleanupHandlers(): void {
    const cleanup = () => {
      logger.info('Cleaning up all cache instances');
      for (const instance of CacheService.instances) {
        instance.cleanup();
      }
      CacheService.instances.clear();
    };

    process.on('exit', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('uncaughtException', cleanup);
    process.on('unhandledRejection', cleanup);
  }

  /**
   * Get cleanup statistics
   */
  static getStats(): { instances: number } {
    return { instances: CacheService.instances.size };
  }
}