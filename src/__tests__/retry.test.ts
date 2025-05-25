import { withRetry, calculateBackoff } from '../utils/retry';

describe('Retry Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withRetry', () => {
    it('should execute function successfully on first try', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const retryFn = withRetry(mockFn);
      
      const result = await retryFn();
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');
      
      const retryFn = withRetry(mockFn, { 
        maxRetries: 3,
        baseDelay: 10
      });
      
      const result = await retryFn();
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exceeded', async () => {
      const error = new Error('network error');
      const mockFn = jest.fn().mockRejectedValue(error);
      
      const retryFn = withRetry(mockFn, {
        maxRetries: 2,
        baseDelay: 10
      });
      
      await expect(retryFn()).rejects.toThrow('network error');
      expect(mockFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const error = new Error('syntax error');
      const mockFn = jest.fn().mockRejectedValue(error);
      
      const retryFn = withRetry(mockFn, {
        maxRetries: 3,
        baseDelay: 10,
        isRetryable: (err: unknown) => false
      });
      
      await expect(retryFn()).rejects.toThrow('syntax error');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on 429 errors', async () => {
      const error = { status: 429, message: 'Too Many Requests' };
      const mockFn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const retryFn = withRetry(mockFn, { 
        maxRetries: 3,
        baseDelay: 10
      });
      
      const result = await retryFn();
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on 5xx errors', async () => {
      const error = { status: 503, message: 'Service Unavailable' };
      const mockFn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const retryFn = withRetry(mockFn, { 
        maxRetries: 3,
        baseDelay: 10
      });
      
      const result = await retryFn();
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx errors except 429 and 408', async () => {
      const error = { status: 404, message: 'Not Found' };
      const mockFn = jest.fn().mockRejectedValue(error);
      
      const retryFn = withRetry(mockFn, {
        maxRetries: 3,
        baseDelay: 10
      });
      
      await expect(retryFn()).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to wrapped function', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const retryFn = withRetry(mockFn);
      
      await retryFn('arg1', 'arg2', 123);
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff', () => {
      const options = {
        maxRetries: 5,
        baseDelay: 100,
        backoffFactor: 2
      };
      
      // First retry (attempt 0)
      const delay0 = calculateBackoff(0, options);
      expect(delay0).toBeGreaterThanOrEqual(100);
      expect(delay0).toBeLessThan(120); // 100 + 20% jitter
      
      // Second retry (attempt 1)
      const delay1 = calculateBackoff(1, options);
      expect(delay1).toBeGreaterThanOrEqual(200);
      expect(delay1).toBeLessThan(240); // 200 + 20% jitter
      
      // Third retry (attempt 2)
      const delay2 = calculateBackoff(2, options);
      expect(delay2).toBeGreaterThanOrEqual(400);
      expect(delay2).toBeLessThan(480); // 400 + 20% jitter
    });

    it('should cap delay at maxDelay', () => {
      const options = {
        maxRetries: 5,
        baseDelay: 1000,
        backoffFactor: 10,
        maxDelay: 5000
      };
      
      // This would be 100,000 without cap
      const delay = calculateBackoff(5, options);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should add jitter to delays', () => {
      const options = {
        maxRetries: 5,
        baseDelay: 1000
      };
      
      // Generate multiple delays for same attempt
      const delays = Array(10).fill(0).map(() => calculateBackoff(1, options));
      
      // All should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
      
      // All should be within expected range
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(2000);
        expect(delay).toBeLessThan(2400); // 2000 + 20% jitter
      });
    });
  });
});