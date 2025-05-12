/**
 * Configuration interface for the Quickbase connector
 */
export interface QuickbaseConfig {
  /**
   * Quickbase realm hostname
   */
  realmHost: string;
  
  /**
   * Quickbase user token for authentication
   */
  userToken: string;
  
  /**
   * Application ID
   */
  appId?: string;
  
  /**
   * User agent string
   */
  userAgent?: string;
  
  /**
   * Enable caching of API responses
   */
  cacheEnabled?: boolean;
  
  /**
   * Cache time-to-live in seconds
   */
  cacheTtl?: number;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Retry delay in milliseconds
   */
  retryDelay?: number;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
}