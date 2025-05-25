import { ConfigureCacheTool } from '../../tools/configure_cache';
import { QuickbaseClient } from '../../client/quickbase';
import { Cache } from '../../utils/cache';

// Mock dependencies
jest.mock('../../utils/cache');
jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })
}));

describe('ConfigureCacheTool Comprehensive', () => {
  let tool: ConfigureCacheTool;
  let mockClient: jest.Mocked<QuickbaseClient>;
  let mockCache: jest.Mocked<Cache>;

  beforeEach(() => {
    mockClient = {
      getCache: jest.fn()
    } as any;

    mockCache = {
      setEnabled: jest.fn(),
      setTtl: jest.fn(),
      clear: jest.fn(),
      isEnabled: jest.fn(),
      getTtl: jest.fn(),
      size: jest.fn(),
      getStats: jest.fn()
    } as any;

    mockClient.getCache.mockReturnValue(mockCache);
    tool = new ConfigureCacheTool(mockClient);
  });

  describe('Tool Properties', () => {
    it('should have correct tool name', () => {
      expect(tool.name).toBe('configure_cache');
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

  describe('Enable Cache', () => {
    it('should enable cache when enabled is true', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(0);

      const result = await tool.execute({
        enabled: true
      });

      expect(mockCache.setEnabled).toHaveBeenCalledWith(true);
      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(true);
    });

    it('should disable cache when enabled is false', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(10);

      const result = await tool.execute({
        enabled: false
      });

      expect(mockCache.setEnabled).toHaveBeenCalledWith(false);
      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(false);
    });
  });

  describe('Set TTL', () => {
    it('should set TTL when provided', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(7200);
      mockCache.size.mockReturnValue(5);

      const result = await tool.execute({
        ttl: 7200
      });

      expect(mockCache.setTtl).toHaveBeenCalledWith(7200);
      expect(result.success).toBe(true);
      expect(result.data?.ttl).toBe(7200);
    });

    it('should handle zero TTL', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(0);
      mockCache.size.mockReturnValue(3);

      const result = await tool.execute({
        ttl: 0
      });

      expect(mockCache.setTtl).toHaveBeenCalledWith(0);
      expect(result.success).toBe(true);
      expect(result.data?.ttl).toBe(0);
    });

    it('should handle large TTL values', async () => {
      const largeTtl = 86400; // 24 hours
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(largeTtl);
      mockCache.size.mockReturnValue(100);

      const result = await tool.execute({
        ttl: largeTtl
      });

      expect(mockCache.setTtl).toHaveBeenCalledWith(largeTtl);
      expect(result.success).toBe(true);
      expect(result.data?.ttl).toBe(largeTtl);
    });
  });

  describe('Clear Cache', () => {
    it('should clear cache when clear is true', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(0); // Size after clearing

      const result = await tool.execute({
        clear: true
      });

      expect(mockCache.clear).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.cleared).toBe(true);
    });

    it('should not clear cache when clear is false', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(15);

      const result = await tool.execute({
        clear: false
      });

      expect(mockCache.clear).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should not clear cache when clear is not provided', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(8);

      const result = await tool.execute({});

      expect(mockCache.clear).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('Combined Operations', () => {
    it('should handle multiple parameters together', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(7200);
      mockCache.size.mockReturnValue(0);

      const result = await tool.execute({
        enabled: true,
        ttl: 7200,
        clear: true
      });

      expect(mockCache.setEnabled).toHaveBeenCalledWith(true);
      expect(mockCache.setTtl).toHaveBeenCalledWith(7200);
      expect(mockCache.clear).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(true);
      expect(result.data?.ttl).toBe(7200);
      expect(result.data?.cleared).toBe(true);
    });

    it('should enable cache and set TTL in one operation', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(1800);
      mockCache.size.mockReturnValue(0);

      const result = await tool.execute({
        enabled: true,
        ttl: 1800
      });

      expect(mockCache.setEnabled).toHaveBeenCalledWith(true);
      expect(mockCache.setTtl).toHaveBeenCalledWith(1800);
      expect(result.success).toBe(true);
    });

    it('should disable cache and clear in one operation', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(0);

      const result = await tool.execute({
        enabled: false,
        clear: true
      });

      expect(mockCache.setEnabled).toHaveBeenCalledWith(false);
      expect(mockCache.clear).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('Status Information', () => {
    it('should return current cache status', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(25);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(true);
      expect(result.data?.ttl).toBe(3600);
      expect(result.data?.size).toBe(25);
    });

    it('should include cache statistics when available', async () => {
      const mockStats = {
        hits: 100,
        misses: 25,
        hitRate: 0.8,
        size: 15
      };

      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(15);
      mockCache.getStats.mockReturnValue(mockStats);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.stats).toEqual(mockStats);
    });

    it('should handle missing cache statistics gracefully', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(5);
      mockCache.getStats.mockReturnValue(undefined);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.stats).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty parameters object', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(0);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(false);
      expect(result.data?.ttl).toBe(3600);
      expect(result.data?.size).toBe(0);
    });

    it('should handle negative TTL values gracefully', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600); // Assuming implementation handles negative values
      mockCache.size.mockReturnValue(0);

      const result = await tool.execute({
        ttl: -1000
      });

      expect(mockCache.setTtl).toHaveBeenCalledWith(-1000);
      expect(result.success).toBe(true);
    });

    it('should handle very large cache sizes', async () => {
      const largeSize = 1000000;
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(largeSize);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.size).toBe(largeSize);
    });
  });

  describe('Error Handling', () => {
    it('should handle cache operation errors gracefully', async () => {
      mockCache.setEnabled.mockImplementation(() => {
        throw new Error('Cache operation failed');
      });

      const result = await tool.execute({
        enabled: true
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cache operation failed');
    });

    it('should handle missing cache gracefully', async () => {
      mockClient.getCache.mockReturnValue(undefined as any);

      const result = await tool.execute({
        enabled: true
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
    });
  });

  describe('Parameter Validation', () => {
    it('should accept all valid parameter combinations', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(0);

      // All valid combinations should work
      const validParams = [
        { enabled: true },
        { enabled: false },
        { ttl: 1000 },
        { ttl: 0 },
        { clear: true },
        { clear: false },
        { enabled: true, ttl: 2000 },
        { enabled: false, clear: true },
        { ttl: 5000, clear: true },
        { enabled: true, ttl: 3000, clear: true }
      ];

      for (const params of validParams) {
        const result = await tool.execute(params);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical cache enablement flow', async () => {
      // Initially disabled cache
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(0);

      // Enable cache with custom TTL
      const result1 = await tool.execute({
        enabled: true,
        ttl: 7200
      });

      expect(result1.success).toBe(true);
      expect(mockCache.setEnabled).toHaveBeenCalledWith(true);
      expect(mockCache.setTtl).toHaveBeenCalledWith(7200);

      // Later, check status
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(7200);
      mockCache.size.mockReturnValue(50);

      const result2 = await tool.execute({});
      expect(result2.success).toBe(true);
      expect(result2.data?.enabled).toBe(true);
      expect(result2.data?.ttl).toBe(7200);
      expect(result2.data?.size).toBe(50);
    });

    it('should handle cache maintenance scenario', async () => {
      // Cache is enabled and has entries
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(100);

      // Clear cache for maintenance
      const result = await tool.execute({
        clear: true
      });

      mockCache.size.mockReturnValue(0); // After clearing

      expect(result.success).toBe(true);
      expect(mockCache.clear).toHaveBeenCalled();
      expect(result.data?.cleared).toBe(true);
    });

    it('should handle cache disabling for debugging', async () => {
      // Cache is enabled
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.size.mockReturnValue(25);

      // Disable for debugging and clear existing entries
      const result = await tool.execute({
        enabled: false,
        clear: true
      });

      mockCache.isEnabled.mockReturnValue(false);
      mockCache.size.mockReturnValue(0);

      expect(result.success).toBe(true);
      expect(mockCache.setEnabled).toHaveBeenCalledWith(false);
      expect(mockCache.clear).toHaveBeenCalled();
    });
  });
});