import { QuickbaseConfig } from '../types/config';
import { ApiError, ApiResponse, RequestOptions } from '../types/api';
import { CacheService } from '../utils/cache';
import { createLogger } from '../utils/logger';

const logger = createLogger('QuickbaseClient');

/**
 * Client for interacting with the Quickbase API
 */
export class QuickbaseClient {
  private config: QuickbaseConfig;
  private cache: CacheService;
  private baseUrl: string;
  private headers: Record<string, string>;
  
  /**
   * Creates a new Quickbase client
   * @param config Client configuration
   */
  constructor(config: QuickbaseConfig) {
    this.config = {
      userAgent: 'QuickbaseMCPConnector/2.0',
      cacheEnabled: true,
      cacheTtl: 3600,
      maxRetries: 3,
      retryDelay: 1000,
      debug: false,
      ...config
    };
    
    if (!this.config.realmHost) {
      throw new Error('Realm hostname is required');
    }
    
    if (!this.config.userToken) {
      throw new Error('User token is required');
    }
    
    this.baseUrl = `https://${this.config.realmHost}/api/v1`;
    
    this.headers = {
      'QB-Realm-Hostname': this.config.realmHost,
      'Authorization': `QB-USER-TOKEN ${this.config.userToken}`,
      'Content-Type': 'application/json',
      'User-Agent': this.config.userAgent || 'QuickbaseMCPConnector/2.0'
    };
    
    this.cache = new CacheService(
      this.config.cacheTtl,
      this.config.cacheEnabled
    );
    
    logger.info('Quickbase client initialized', { 
      realmHost: this.config.realmHost,
      appId: this.config.appId,
      cacheEnabled: this.config.cacheEnabled
    });
  }
  
  /**
   * Get the client configuration
   * @returns Current configuration
   */
  public getConfig(): QuickbaseConfig {
    return { ...this.config };
  }
  
  /**
   * Sends a request to the Quickbase API
   * @param options Request options
   * @returns API response
   */
  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const { method, path, body, params, headers = {}, skipCache = false } = options;
    
    // Build full URL with query parameters
    let url = `${this.baseUrl}${path}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });
      url += `?${searchParams.toString()}`;
    }
    
    // Check cache for GET requests
    const cacheKey = `${method}:${url}`;
    if (method === 'GET' && !skipCache) {
      const cachedResponse = this.cache.get<ApiResponse<T>>(cacheKey);
      if (cachedResponse) {
        logger.debug('Returning cached response', { url, method });
        return cachedResponse;
      }
    }
    
    // Combine default headers with request-specific headers
    const requestHeaders = { ...this.headers, ...headers };
    
    // Log request (with redacted sensitive info)
    logger.debug('Sending API request', {
      url,
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    });
    
    try {
      // Send request
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined
      });
      
      // Parse response
      const responseData = await response.json();
      
      // Check for error response
      if (!response.ok) {
        const error: ApiError = {
          message: responseData.message || response.statusText,
          code: response.status,
          details: responseData
        };
        
        logger.error('API request failed', { 
          status: response.status, 
          error 
        });
        
        return {
          success: false,
          error
        };
      }
      
      // Successful response
      const result: ApiResponse<T> = {
        success: true,
        data: responseData as T
      };
      
      // Cache successful GET responses
      if (method === 'GET' && !skipCache) {
        this.cache.set(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      // Network or parsing error
      logger.error('Request failed', { error });
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'NetworkError'
        }
      };
    }
  }
  
  // Additional methods for specific API operations will be added here
}