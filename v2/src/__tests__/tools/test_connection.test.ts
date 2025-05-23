import { TestConnectionTool } from '../../tools/test_connection';
import { QuickbaseClient } from '../../client/quickbase';
import { QuickbaseConfig } from '../../types/config';

// Mock the QuickbaseClient
jest.mock('../../client/quickbase');

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
    it('should execute successfully with valid connection', async () => {
      // Mock successful connection test
      mockClient.request = jest.fn().mockResolvedValue({
        success: true,
        data: { id: 'test-realm-id', authenticated: true }
      });

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle connection errors gracefully', async () => {
      // Mock connection failure
      mockClient.request = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate parameters', async () => {
      // Test with invalid parameters (if any required)
      const result = await tool.execute({});
      
      // Since test_connection has no required parameters, this should not fail validation
      expect(result).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should call client with correct parameters', async () => {
      mockClient.request = jest.fn().mockResolvedValue({
        success: true,
        data: { id: 'test-realm-id', authenticated: true }
      });

      await tool.execute({});

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/auth/temporary'
      });
    });
  });
});