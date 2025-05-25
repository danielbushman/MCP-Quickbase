import { createLogger } from './logger';

const logger = createLogger('RetryUtil');

/**
 * Options for configuring retry behavior
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Base delay in milliseconds between retries
   */
  baseDelay: number;
  
  /**
   * Maximum delay in milliseconds between retries
   */
  maxDelay?: number;
  
  /**
   * Factor to multiply delay by after each retry attempt
   */
  backoffFactor?: number;
  
  /**
   * Function that determines if an error is retryable
   */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  isRetryable: (error: unknown) => {
    // Default logic for determining if an error is retryable
    if (!error) return false;
    
    // Handle fetch response errors
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const httpError = error as { status: number };
      // Retry 429 (Too Many Requests), 408 (Request Timeout), and 5xx errors
      return httpError.status === 429 || 
             httpError.status === 408 || 
             (httpError.status >= 500 && httpError.status < 600);
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

/**
 * Calculates the delay time for a retry attempt with exponential backoff
 * @param attempt Retry attempt number (0-based)
 * @param options Retry options
 * @returns Delay time in milliseconds
 */
export function calculateBackoff(attempt: number, options: RetryOptions): number {
  const { baseDelay, backoffFactor = 2, maxDelay = 10000 } = options;
  
  // Use exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt);
  const jitter = Math.random() * 0.2 * exponentialDelay; // 20% jitter
  const delay = exponentialDelay + jitter;
  
  // Ensure delay doesn't exceed maximum
  return Math.min(delay, maxDelay);
}

/**
 * Wrapper function that adds retry logic to any async function
 * @param fn Function to add retry logic to
 * @param options Retry options
 * @returns Function with retry logic
 */
export function withRetry<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  options: Partial<RetryOptions> = {}
): (...args: Args) => Promise<T> {
  const fullOptions: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  return async function retryWrapper(...args: Args): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= fullOptions.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(`Retry attempt ${attempt} of ${fullOptions.maxRetries}`);
        }
        
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        const shouldRetry = attempt < fullOptions.maxRetries && 
                            fullOptions.isRetryable && 
                            fullOptions.isRetryable(error);
        
        if (!shouldRetry) {
          logger.debug('Error not retryable or max retries reached', { error });
          throw error;
        }
        
        const delay = calculateBackoff(attempt, fullOptions);
        logger.debug(`Retrying after ${delay}ms due to error`, { error });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached due to the loop structure,
    // but TypeScript requires it for type safety
    throw lastError;
  };
}