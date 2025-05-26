import { QuickbaseConfig } from '../types/config';
import { ApiError, ApiResponse, RequestOptions } from '../types/api';
import { CacheService } from '../utils/cache';
import { createLogger } from '../utils/logger';
import { withRetry, RetryOptions } from '../utils/retry';

const logger = createLogger('QuickbaseClient');

/**
 * Thread-safe rate limiter to prevent API overload
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private pending: Promise<void> = Promise.resolve();

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async wait(): Promise<void> {
    // Serialize all rate limit checks to prevent race conditions
    this.pending = this.pending.then(() => this.checkRateLimit());
    return this.pending;
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Remove requests outside the current window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time until oldest request expires
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 10; // +10ms buffer
      
      if (waitTime > 0) {
        logger.debug(`Rate limiting: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Re-check after waiting (recursive but bounded by maxRequests)
        return this.checkRateLimit();
      }
    }
    
    // Add this request to the window
    this.requests.push(Date.now());
  }
}

/**
 * Client for interacting with the Quickbase API
 */
export class QuickbaseClient {
  private config: QuickbaseConfig;
  private cache: CacheService;
  private baseUrl: string;
  private headers: Record<string, string>;
  private rateLimiter: RateLimiter;
  
  /**
   * Creates a new Quickbase client
   * @param config Client configuration
   */
  constructor(config: QuickbaseConfig) {
    // Validate and sanitize configuration
    const rateLimit = config.rateLimit !== undefined ? config.rateLimit : 10;
    const cacheTtl = config.cacheTtl !== undefined ? config.cacheTtl : 3600;
    const maxRetries = config.maxRetries !== undefined ? config.maxRetries : 3;
    const retryDelay = config.retryDelay !== undefined ? config.retryDelay : 1000;
    const requestTimeout = config.requestTimeout !== undefined ? config.requestTimeout : 30000;
    
    // Validate numeric values
    if (rateLimit < 1 || rateLimit > 100) {
      throw new Error('Rate limit must be between 1 and 100 requests per second');
    }
    if (cacheTtl < 0 || cacheTtl > 86400) { // Max 24 hours
      throw new Error('Cache TTL must be between 0 and 86400 seconds (24 hours)');
    }
    if (maxRetries < 0 || maxRetries > 10) {
      throw new Error('Max retries must be between 0 and 10');
    }
    if (retryDelay < 100 || retryDelay > 60000) {
      throw new Error('Retry delay must be between 100ms and 60 seconds');
    }
    if (requestTimeout < 1000 || requestTimeout > 300000) { // 1s to 5 minutes
      throw new Error('Request timeout must be between 1 second and 5 minutes');
    }
    
    this.config = {
      userAgent: 'QuickbaseMCPConnector/2.0',
      cacheEnabled: true,
      cacheTtl,
      maxRetries,
      retryDelay,
      requestTimeout,
      rateLimit,
      debug: false,
      ...config,
      // Ensure validated values are used
      rateLimit,
      cacheTtl,
      maxRetries,
      retryDelay,
      requestTimeout
    };
    
    if (!this.config.realmHost) {
      throw new Error('Realm hostname is required');
    }
    
    if (!this.config.userToken) {
      throw new Error('User token is required');
    }
    
    this.baseUrl = `https://api.quickbase.com/v1`;
    
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
    
    // Initialize rate limiter (10 requests per second by default)
    this.rateLimiter = new RateLimiter(
      this.config.rateLimit || 10,
      1000
    );
    
    logger.info('Quickbase client initialized', { 
      realmHost: this.config.realmHost,
      appId: this.config.appId,
      cacheEnabled: this.config.cacheEnabled,
      rateLimit: this.config.rateLimit || 10
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
   * Sends a request to the Quickbase API with retry logic
   * @param options Request options
   * @returns API response
   */
  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const makeRequest = async (): Promise<ApiResponse<T>> => {
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
      
      // Apply rate limiting before making the request
      await this.rateLimiter.wait();
      
      // Combine default headers with request-specific headers
      const requestHeaders = { ...this.headers, ...headers };
      
      // Log request (with redacted sensitive info)
      const redactedHeaders = { ...requestHeaders };
      if (redactedHeaders.Authorization) {
        redactedHeaders.Authorization = '***REDACTED***';
      }
      if (redactedHeaders['QB-Realm-Hostname']) {
        // Keep realm hostname structure for debugging but redact sensitive parts
        // Example: "company-name.quickbase.com" becomes "***.quickbase.com"
        redactedHeaders['QB-Realm-Hostname'] = redactedHeaders['QB-Realm-Hostname'].replace(/^[^.]+/, '***');
      }
      
      logger.debug('Sending API request', {
        url: url.replace(/[?&]userToken=[^&]*/g, '&userToken=***REDACTED***'), // Redact tokens in URL too
        method,
        headers: redactedHeaders,
        body: body ? JSON.stringify(body) : undefined
      });
      
      // Send request with timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout || 30000);
      
      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
      
      // Parse response safely
      let responseData: unknown;
      try {
        responseData = await response.json();
      } catch (error) {
        throw new Error(`Invalid JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Ensure responseData is an object
      if (typeof responseData !== 'object' || responseData === null) {
        throw new Error('API response is not a valid object');
      }

      const data = responseData as Record<string, unknown>;
      
      // Check for error response
      if (!response.ok) {
        const errorMessage = typeof data.message === 'string' ? data.message : response.statusText;
        const error: ApiError = {
          message: errorMessage,
          code: response.status,
          details: data
        };
        
        logger.error('API request failed', { 
          status: response.status, 
          error 
        });
        
        // Create error with proper metadata for retry logic
        const httpError = new Error(`HTTP Error ${response.status}: ${errorMessage}`);
        Object.assign(httpError, { status: response.status, data: responseData });
        
        // Always throw HTTP errors - let retry logic determine if they're retryable
        // The retry logic will check the status code and decide whether to retry
        throw httpError;
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
    };
    
    // Retry configuration
    const retryOptions: RetryOptions = {
      maxRetries: this.config.maxRetries || 3,
      baseDelay: this.config.retryDelay || 1000,
      isRetryable: (error: unknown) => {
        // Only retry certain HTTP errors and network errors
        if (!error) return false;
        
        // Handle HTTP errors
        if (typeof error === 'object' && error !== null && 'status' in error) {
          const httpError = error as { status: number };
          return httpError.status === 429 || // Too Many Requests
                 httpError.status === 408 || // Request Timeout
                 (httpError.status >= 500 && httpError.status < 600); // Server errors
        }
        
        // Handle network errors
        if (error instanceof Error) {
          return error.message.includes('network') || 
                 error.message.includes('timeout') || 
                 error.message.includes('connection');
        }
        
        return false;
      }
    };
    
    try {
      // Use withRetry to add retry logic to the request
      return await withRetry(makeRequest, retryOptions)();
    } catch (error) {
      // Handle errors that weren't handled by the retry logic
      logger.error('Request failed after retries', { error });
      
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'NetworkError'
        }
      };
    }
  }
}