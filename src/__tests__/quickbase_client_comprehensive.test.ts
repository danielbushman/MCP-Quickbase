import { QuickbaseClient } from '../client/quickbase';
import { QuickbaseConfig } from '../types/config';

// Mock dependencies
jest.mock('../utils/cache');
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })
}));

// Mock node-fetch
const mockFetch = jest.fn();
jest.mock('node-fetch', () => mockFetch);

describe('QuickbaseClient Comprehensive', () => {
  let client: QuickbaseClient;
  let config: QuickbaseConfig;

  beforeEach(() => {
    config = {
      realmHost: 'test.quickbase.com',
      userToken: 'QB-USER-TOKEN_test123',
      appId: 'bqp9xre8k'
    };
    
    client = new QuickbaseClient(config);
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with valid config', () => {
      expect(client).toBeDefined();
      expect(client.getConfig()).toEqual(config);
    });

    it('should handle config without app ID', () => {
      const configWithoutApp: QuickbaseConfig = {
        realmHost: 'test.quickbase.com',
        userToken: 'QB-USER-TOKEN_test123'
      };
      
      const clientWithoutApp = new QuickbaseClient(configWithoutApp);
      expect(clientWithoutApp.getConfig()).toEqual(configWithoutApp);
    });

    it('should normalize realm host', () => {
      const configWithProtocol: QuickbaseConfig = {
        realmHost: 'https://test.quickbase.com',
        userToken: 'QB-USER-TOKEN_test123'
      };
      
      const normalizedClient = new QuickbaseClient(configWithProtocol);
      expect(normalizedClient.getConfig().realmHost).toBe('test.quickbase.com');
    });
  });

  describe('Request Methods', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ data: 'test' })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'GET',
        path: '/apps'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.quickbase.com/v1/apps',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'QB-Realm-Hostname': 'test.quickbase.com',
            'Authorization': 'QB-USER-TOKEN QB-USER-TOKEN_test123',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should make successful POST request with body', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: '123' })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'POST',
        path: '/records',
        body: { to: 'bp8uqvy64', data: [{ '6': { value: 'test' } }] }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.quickbase.com/v1/records',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ to: 'bp8uqvy64', data: [{ '6': { value: 'test' } }] }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle query parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue([])
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'GET',
        path: '/fields',
        params: { tableId: 'bp8uqvy64', includeFieldPerms: 'true' }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.quickbase.com/v1/fields?tableId=bp8uqvy64&includeFieldPerms=true',
        expect.any(Object)
      );
    });

    it('should handle 4xx client errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({
          message: 'Bad Request',
          description: 'Invalid field ID'
        })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'GET',
        path: '/records/query'
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(400);
      expect(result.error?.message).toBe('Bad Request');
    });

    it('should handle 5xx server errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({
          message: 'Internal Server Error'
        })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'GET',
        path: '/apps'
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(500);
      expect(result.error?.message).toBe('Internal Server Error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await client.request({
        method: 'GET',
        path: '/apps'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });

    it('should handle non-JSON responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        headers: new Map([['content-type', 'text/html']]),
        json: jest.fn().mockRejectedValue(new Error('Not JSON')),
        text: jest.fn().mockResolvedValue('<html>Not Found</html>')
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'GET',
        path: '/nonexistent'
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(404);
    });

    it('should handle empty response body', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue(null)
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'DELETE',
        path: '/records/123'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('Upload File', () => {
    it('should upload file successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({
          fileName: 'test.pdf',
          version: 1
        })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.uploadFile({
        tableId: 'bp8uqvy64',
        recordId: '123',
        fieldId: '10',
        filename: 'test.pdf',
        data: 'base64data'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        fileName: 'test.pdf',
        version: 1
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.quickbase.com/v1/files/bp8uqvy64/123/10',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            fileName: 'test.pdf',
            data: 'base64data'
          })
        })
      );
    });

    it('should handle upload errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({
          message: 'File too large'
        })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.uploadFile({
        tableId: 'bp8uqvy64',
        recordId: '123',
        fieldId: '10',
        filename: 'large.pdf',
        data: 'very-large-base64-data'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('File too large');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        headers: new Map([
          ['content-type', 'application/json'],
          ['retry-after', '60']
        ]),
        json: jest.fn().mockResolvedValue({
          message: 'Rate limit exceeded'
        })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request({
        method: 'GET',
        path: '/apps'
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(429);
    });
  });

  describe('Request Options', () => {
    it('should respect skip cache option', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ data: 'test' })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'GET',
        path: '/apps',
        skipCache: true
      });

      // Cache should not be used (implementation-dependent verification)
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle custom headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ data: 'test' })
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'GET',
        path: '/apps',
        headers: {
          'Custom-Header': 'custom-value'
        }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'custom-value'
          })
        })
      );
    });
  });

  describe('URL Construction', () => {
    it('should construct URLs correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({})
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'GET',
        path: '/tables/bp8uqvy64/fields'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.quickbase.com/v1/tables/bp8uqvy64/fields',
        expect.any(Object)
      );
    });

    it('should handle paths with leading slash', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({})
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'GET',
        path: '/apps' // Leading slash
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.quickbase.com/v1/apps',
        expect.any(Object)
      );
    });

    it('should handle paths without leading slash', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({})
      };
      
      mockFetch.mockResolvedValue(mockResponse);

      await client.request({
        method: 'GET',
        path: 'apps' // No leading slash
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.quickbase.com/v1/apps',
        expect.any(Object)
      );
    });
  });
});