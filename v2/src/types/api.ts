/**
 * Common API interfaces for Quickbase client
 */

/**
 * Base API response
 */
export interface ApiResponse<T> {
  /**
   * Whether the request was successful
   */
  success: boolean;
  
  /**
   * Response data (present if success is true)
   */
  data?: T;
  
  /**
   * Error information (present if success is false)
   */
  error?: ApiError;
}

/**
 * API error structure
 */
export interface ApiError {
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code
   */
  code?: number;
  
  /**
   * Error type
   */
  type?: string;
  
  /**
   * Additional error details
   */
  details?: Record<string, any>;
}

/**
 * HTTP request options
 */
export interface RequestOptions {
  /**
   * HTTP method
   */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /**
   * Path to the API endpoint
   */
  path: string;
  
  /**
   * Request body
   */
  body?: Record<string, any>;
  
  /**
   * Query parameters
   */
  params?: Record<string, string>;
  
  /**
   * Additional headers
   */
  headers?: Record<string, string>;
  
  /**
   * Whether to skip caching
   */
  skipCache?: boolean;
}