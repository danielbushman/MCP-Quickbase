import { TestConnectionTool } from '../../tools/test_connection';
import { QuickbaseClient } from '../../client/quickbase';
import { QuickbaseConfig } from '../../types/config';
import { ApiResponse } from '../../types/api';

// Mock the QuickbaseClient
jest.mock('../../client/quickbase');
jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })
}));

describe('TestConnectionTool', () => {
  let tool: TestConnectionTool;
  let mockClient: jest.Mocked<QuickbaseClient>;

  beforeEach(() => {
    const config: QuickbaseConfig = {
      realmHost: 'test.quickbase.com',
      userToken: 'test-token',
      appId: 'test-app-id'
    };

    mockClient = new QuickbaseClient(config) as jest.Mocked<QuickbaseClient>;
    mockClient.getConfig = jest.fn().mockReturnValue(config);
    tool = new TestConnectionTool(mockClient);
  });

  describe('tool properties', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('test_connection');
    });

    it('should have description', () => {
      expect(tool.description).toBeTruthy();
      expect(typeof tool.description).toBe('string');
    });

    it('should have parameter schema', () => {
      expect(tool.paramSchema).toBeDefined();
      expect(typeof tool.paramSchema).toBe('object');
    });
  });

  describe('execute', () => {
    it('should execute successfully with valid connection and app ID', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: { 
          id: 'test-app-id',
          name: 'Test App',
          created: '2024-01-01T00:00:00Z'
        }
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.connected).toBe(true);
      expect(result.data?.realmInfo?.hostname).toBe('test.quickbase.com');
      expect(result.data?.realmInfo?.appName).toBe('Test App');
    });

    it('should execute successfully without app ID', async () => {
      const config: QuickbaseConfig = {
        realmHost: 'test.quickbase.com',
        userToken: 'test-token'
        // No appId
      };

      mockClient.getConfig = jest.fn().mockReturnValue(config);
      
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: [
          { id: 'app1', name: 'App 1' },
          { id: 'app2', name: 'App 2' }
        ]
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const result = await tool.execute({});

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/apps'
      });

      expect(result.success).toBe(true);
      expect(result.data?.connected).toBe(true);
      expect(result.data?.realmInfo?.id).toBe('no-app-specified');
    });

    it('should handle connection errors gracefully', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('Unauthorized'));

      const result = await tool.execute({});
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unauthorized');
    });

    it('should handle network errors', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('Failed to connect to Quickbase'));

      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to connect to Quickbase');
    });

    it('should provide specific error for 401', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('401 Unauthorized'));

      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Authentication failed');
    });

    it('should provide specific error for 404', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('404 Not Found'));

      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('App not found');
    });

    it('should provide specific error for 403', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('403 Forbidden'));

      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Access denied');
    });

    it('should provide specific error for network issues', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('ENOTFOUND'));

      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });

    it('should handle missing error response', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: undefined
      };

      mockClient.request = jest.fn().mockResolvedValue(mockError);

      await expect(tool.execute({})).rejects.toThrow('Failed to connect to Quickbase');
    });

    it('should validate parameters', async () => {
      // Test with invalid parameters (if any required)
      const result = await tool.execute({});
      
      // Since test_connection has no required parameters, this should not fail validation
      expect(result).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should call client with correct parameters for app-specific test', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: { 
          id: 'test-app-id',
          name: 'Test App'
        }
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      await tool.execute({});

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/apps/test-app-id'
      });
    });
  });
});