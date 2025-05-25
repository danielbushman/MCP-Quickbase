import { jest } from '@jest/globals';
import fetch, { Response } from 'node-fetch';
import { QuickbaseClient } from '../../client/quickbase.js';
import { QuickbaseConfig } from '../../types/config.js';

jest.mock('node-fetch');

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('QuickbaseClient Enhanced Coverage', () => {
  let client: QuickbaseClient;
  let config: QuickbaseConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    config = {
      realmHost: 'test.quickbase.com',
      userToken: 'test-token',
      appId: 'test-app',
      cacheEnabled: true,
      cacheTtl: 3600,
      debug: false,
    };
    
    client = new QuickbaseClient(config);
  });

  describe('advanced request scenarios', () => {
    it('should handle requests with custom headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'POST',
        path: '/test',
        headers: {
          'Custom-Header': 'test-value',
          'Another-Header': 'another-value',
        },
        body: { test: 'data' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.quickbase.com/v1/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'test-value',
            'Another-Header': 'another-value',
            'QB-Realm-Hostname': 'test.quickbase.com',
            Authorization: 'QB-USER-TOKEN test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle GET requests with query parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'GET',
        path: '/test',
        query: {
          limit: '10',
          offset: '0',
          filter: 'active',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.quickbase.com/v1/test?limit=10&offset=0&filter=active',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle HEAD requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        text: jest.fn().mockResolvedValue(''),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'HEAD',
        path: '/test',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.quickbase.com/v1/test',
        expect.objectContaining({
          method: 'HEAD',
        })
      );
    });

    it('should handle DELETE requests', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        text: jest.fn().mockResolvedValue(''),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'DELETE',
        path: '/test/123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.quickbase.com/v1/test/123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle PUT requests with body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ updated: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const body = { name: 'Updated Name', value: 42 };

      await client.request({
        method: 'PUT',
        path: '/test/123',
        body,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.quickbase.com/v1/test/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
        })
      );
    });

    it('should handle PATCH requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ patched: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const body = { value: 'updated' };

      await client.request({
        method: 'PATCH',
        path: '/test/123',
        body,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.quickbase.com/v1/test/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle 401 unauthorized errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({
          description: 'Invalid user token',
          details: 'The provided user token is invalid or expired',
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        client.request({
          method: 'GET',
          path: '/test',
        })
      ).rejects.toThrow('API request failed');
    });

    it('should handle 429 rate limit errors', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({
          description: 'Rate limit exceeded',
          details: 'Too many requests in a short period',
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        client.request({
          method: 'GET',
          path: '/test',
        })
      ).rejects.toThrow('API request failed');
    });

    it('should handle server errors with HTML response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
        text: jest.fn().mockResolvedValue('<html><body>Server Error</body></html>'),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        client.request({
          method: 'GET',
          path: '/test',
        })
      ).rejects.toThrow('API request failed');
    });

    it('should handle malformed JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValue('{ invalid json }'),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        client.request({
          method: 'GET',
          path: '/test',
        })
      ).rejects.toThrow('Failed to parse response');
    });
  });

  describe('configuration variations', () => {
    it('should work with minimal configuration', () => {
      const minimalConfig: QuickbaseConfig = {
        realmHost: 'minimal.quickbase.com',
        userToken: 'minimal-token',
      };

      const minimalClient = new QuickbaseClient(minimalConfig);
      expect(minimalClient).toBeInstanceOf(QuickbaseClient);
    });

    it('should work with debug mode enabled', async () => {
      const debugConfig: QuickbaseConfig = {
        realmHost: 'debug.quickbase.com',
        userToken: 'debug-token',
        debug: true,
      };

      const debugClient = new QuickbaseClient(debugConfig);

      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ debug: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await debugClient.request({
        method: 'GET',
        path: '/debug',
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle custom app ID in config', async () => {
      const customConfig: QuickbaseConfig = {
        realmHost: 'custom.quickbase.com',
        userToken: 'custom-token',
        appId: 'custom-app-123',
      };

      const customClient = new QuickbaseClient(customConfig);

      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ appId: 'custom-app-123' }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await customClient.request({
        method: 'GET',
        path: '/apps/custom-app-123',
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('special response scenarios', () => {
    it('should handle empty response bodies', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        text: jest.fn().mockResolvedValue(''),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'DELETE',
        path: '/test/123',
      });

      expect(result).toEqual('');
    });

    it('should handle non-JSON response types', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('text/plain'),
        },
        text: jest.fn().mockResolvedValue('Plain text response'),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'GET',
        path: '/test/plain',
      });

      expect(result).toBe('Plain text response');
    });

    it('should handle XML response types', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/xml'),
        },
        text: jest.fn().mockResolvedValue('<?xml version="1.0"?><root><data>test</data></root>'),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'GET',
        path: '/test/xml',
      });

      expect(result).toBe('<?xml version="1.0"?><root><data>test</data></root>');
    });
  });

  describe('network error scenarios', () => {
    it('should handle network timeout errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      await expect(
        client.request({
          method: 'GET',
          path: '/test',
        })
      ).rejects.toThrow('Network timeout');
    });

    it('should handle DNS resolution errors', async () => {
      mockFetch.mockRejectedValue(new Error('ENOTFOUND'));

      await expect(
        client.request({
          method: 'GET',
          path: '/test',
        })
      ).rejects.toThrow('ENOTFOUND');
    });

    it('should handle connection refused errors', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        client.request({
          method: 'GET',
          path: '/test',
        })
      ).rejects.toThrow('ECONNREFUSED');
    });
  });
});