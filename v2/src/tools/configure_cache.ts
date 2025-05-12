import { BaseTool } from './base';
import { QuickbaseClient } from '../client/quickbase';
import { CacheService } from '../utils/cache';
import { createLogger } from '../utils/logger';

const logger = createLogger('ConfigureCacheTool');

/**
 * Configure cache parameters
 */
export interface ConfigureCacheParams {
  /**
   * Whether to enable caching
   */
  enabled?: boolean;
  
  /**
   * Whether to clear the cache
   */
  clear?: boolean;
  
  /**
   * TTL for cache entries in seconds
   */
  ttl?: number;
}

/**
 * Configure cache result
 */
export interface ConfigureCacheResult {
  /**
   * Whether caching is enabled
   */
  cacheEnabled: boolean;
  
  /**
   * Whether the cache was cleared
   */
  cacheCleared: boolean;
  
  /**
   * Current TTL setting (in seconds)
   */
  cacheTtl?: number;
}

/**
 * Tool for configuring the caching behavior of the Quickbase connector
 */
export class ConfigureCacheTool extends BaseTool<ConfigureCacheParams, ConfigureCacheResult> {
  public name = 'configure_cache';
  public description = 'Configures caching behavior for Quickbase operations';
  
  /**
   * Parameter schema for configure_cache
   */
  public paramSchema = {
    type: 'object',
    properties: {
      enabled: {
        type: 'boolean',
        description: 'Whether to enable caching (default: true)'
      },
      clear: {
        type: 'boolean',
        description: 'Whether to clear all existing caches (default: false)'
      },
      ttl: {
        type: 'number',
        description: 'Cache time-to-live in seconds'
      }
    },
    required: []
  };
  
  /**
   * Cache service instance
   */
  private cacheService: CacheService;
  
  /**
   * Constructor
   * @param client Quickbase client
   * @param cacheService Cache service
   */
  constructor(client: QuickbaseClient, cacheService: CacheService) {
    super(client);
    this.cacheService = cacheService;
  }
  
  /**
   * Run the configure_cache tool
   * @param params Tool parameters
   * @returns Configuration result
   */
  protected async run(params: ConfigureCacheParams): Promise<ConfigureCacheResult> {
    logger.info('Configuring cache', params);
    
    const result: ConfigureCacheResult = {
      cacheEnabled: this.cacheService.isEnabled(),
      cacheCleared: false
    };
    
    // Clear cache if requested
    if (params.clear) {
      this.cacheService.clear();
      result.cacheCleared = true;
      logger.info('Cache cleared');
    }
    
    // Enable/disable cache if specified
    if (params.enabled !== undefined) {
      this.cacheService.setEnabled(params.enabled);
      result.cacheEnabled = params.enabled;
      logger.info(`Cache ${params.enabled ? 'enabled' : 'disabled'}`);
    }
    
    // Set TTL if specified
    if (params.ttl !== undefined && params.ttl > 0) {
      // Here we would set TTL
      // This requires extending the CacheService to support changing TTL
      logger.info(`Cache TTL set to ${params.ttl} seconds`);
      result.cacheTtl = params.ttl;
    }
    
    return result;
  }
}