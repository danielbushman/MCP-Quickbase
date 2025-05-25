import { jest } from '@jest/globals';
import { ConfigureCacheTool } from '../../tools/configure_cache.js';
import { QuickbaseClient } from '../../client/quickbase.js';
import { CacheService } from '../../utils/cache.js';

jest.mock('../../client/quickbase.js');
jest.mock('../../utils/cache.js');
jest.mock('../../utils/logger.js', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }),
}));

const mockClient = {
  request: jest.fn(),
} as unknown as jest.Mocked<QuickbaseClient>;

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  isEnabled: jest.fn(),
  getTtl: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  setTtl: jest.fn(),
  getSize: jest.fn(),
  getHitRate: jest.fn(),
} as unknown as jest.Mocked<CacheService>;

describe('ConfigureCacheTool Enhanced Coverage', () => {
  let tool: ConfigureCacheTool;

  beforeEach(() => {
    jest.clearAllMocks();
    tool = new ConfigureCacheTool(mockClient, mockCache);
  });

  describe('enable cache scenarios', () => {
    it('should enable cache when currently disabled', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.enable.mockReturnValue(undefined);

      const result = await tool.execute({ enabled: true });

      expect(result.success).toBe(true);
      expect(mockCache.enable).toHaveBeenCalled();
      expect(result.data?.enabled).toBe(true);
    });

    it('should handle enabling already enabled cache', async () => {
      mockCache.isEnabled.mockReturnValue(true);

      const result = await tool.execute({ enabled: true });

      expect(result.success).toBe(true);
      expect(mockCache.enable).not.toHaveBeenCalled();
      expect(result.data?.enabled).toBe(true);
    });

    it('should enable cache with custom TTL', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getTtl.mockReturnValue(7200);

      const result = await tool.execute({ 
        enabled: true,
        ttl: 7200 
      });

      expect(result.success).toBe(true);
      expect(mockCache.enable).toHaveBeenCalled();
      expect(mockCache.setTtl).toHaveBeenCalledWith(7200);
    });
  });

  describe('disable cache scenarios', () => {
    it('should disable cache when currently enabled', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.disable.mockReturnValue(undefined);

      const result = await tool.execute({ enabled: false });

      expect(result.success).toBe(true);
      expect(mockCache.disable).toHaveBeenCalled();
      expect(result.data?.enabled).toBe(false);
    });

    it('should handle disabling already disabled cache', async () => {
      mockCache.isEnabled.mockReturnValue(false);

      const result = await tool.execute({ enabled: false });

      expect(result.success).toBe(true);
      expect(mockCache.disable).not.toHaveBeenCalled();
      expect(result.data?.enabled).toBe(false);
    });
  });

  describe('TTL configuration scenarios', () => {
    it('should update TTL when cache is enabled', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(1800);

      const result = await tool.execute({ ttl: 1800 });

      expect(result.success).toBe(true);
      expect(mockCache.setTtl).toHaveBeenCalledWith(1800);
      expect(result.data?.ttl).toBe(1800);
    });

    it('should update TTL when cache is disabled', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getTtl.mockReturnValue(900);

      const result = await tool.execute({ ttl: 900 });

      expect(result.success).toBe(true);
      expect(mockCache.setTtl).toHaveBeenCalledWith(900);
      expect(result.data?.ttl).toBe(900);
    });

    it('should handle very large TTL values', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(86400); // 24 hours

      const result = await tool.execute({ ttl: 86400 });

      expect(result.success).toBe(true);
      expect(mockCache.setTtl).toHaveBeenCalledWith(86400);
    });

    it('should handle minimum TTL values', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(1);

      const result = await tool.execute({ ttl: 1 });

      expect(result.success).toBe(true);
      expect(mockCache.setTtl).toHaveBeenCalledWith(1);
    });
  });

  describe('clear cache scenarios', () => {
    it('should clear cache when enabled', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getSize.mockReturnValue(0);
      mockCache.clear.mockReturnValue(undefined);

      const result = await tool.execute({ clear: true });

      expect(result.success).toBe(true);
      expect(mockCache.clear).toHaveBeenCalled();
      expect(result.data?.cleared).toBe(true);
    });

    it('should clear cache when disabled', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getSize.mockReturnValue(0);
      mockCache.clear.mockReturnValue(undefined);

      const result = await tool.execute({ clear: true });

      expect(result.success).toBe(true);
      expect(mockCache.clear).toHaveBeenCalled();
      expect(result.data?.cleared).toBe(true);
    });

    it('should handle clearing empty cache', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getSize.mockReturnValue(0);

      const result = await tool.execute({ clear: true });

      expect(result.success).toBe(true);
      expect(mockCache.clear).toHaveBeenCalled();
    });
  });

  describe('combined operations', () => {
    it('should enable cache, set TTL, and clear in one operation', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.getSize.mockReturnValue(0);

      const result = await tool.execute({
        enabled: true,
        ttl: 3600,
        clear: true,
      });

      expect(result.success).toBe(true);
      expect(mockCache.enable).toHaveBeenCalled();
      expect(mockCache.setTtl).toHaveBeenCalledWith(3600);
      expect(mockCache.clear).toHaveBeenCalled();
      expect(result.data?.enabled).toBe(true);
      expect(result.data?.ttl).toBe(3600);
      expect(result.data?.cleared).toBe(true);
    });

    it('should disable cache and clear in one operation', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.getSize.mockReturnValue(0);

      const result = await tool.execute({
        enabled: false,
        clear: true,
      });

      expect(result.success).toBe(true);
      expect(mockCache.disable).toHaveBeenCalled();
      expect(mockCache.clear).toHaveBeenCalled();
      expect(result.data?.enabled).toBe(false);
      expect(result.data?.cleared).toBe(true);
    });

    it('should only update TTL without changing enabled state', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(7200);

      const result = await tool.execute({ ttl: 7200 });

      expect(result.success).toBe(true);
      expect(mockCache.enable).not.toHaveBeenCalled();
      expect(mockCache.disable).not.toHaveBeenCalled();
      expect(mockCache.setTtl).toHaveBeenCalledWith(7200);
    });
  });

  describe('cache statistics', () => {
    it('should return comprehensive cache status', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.getSize.mockReturnValue(150);
      mockCache.getHitRate.mockReturnValue(0.85);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(true);
      expect(result.data?.ttl).toBe(3600);
      expect(result.data?.size).toBe(150);
      expect(result.data?.hitRate).toBe(0.85);
    });

    it('should handle cache with zero entries', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.getSize.mockReturnValue(0);
      mockCache.getHitRate.mockReturnValue(0);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.size).toBe(0);
      expect(result.data?.hitRate).toBe(0);
    });

    it('should handle disabled cache statistics', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.getSize.mockReturnValue(0);
      mockCache.getHitRate.mockReturnValue(0);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(false);
      expect(result.data?.size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle cache enable errors', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.enable.mockImplementation(() => {
        throw new Error('Failed to enable cache');
      });

      const result = await tool.execute({ enabled: true });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to enable cache');
    });

    it('should handle cache disable errors', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.disable.mockImplementation(() => {
        throw new Error('Failed to disable cache');
      });

      const result = await tool.execute({ enabled: false });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to disable cache');
    });

    it('should handle TTL setting errors', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.setTtl.mockImplementation(() => {
        throw new Error('Invalid TTL value');
      });

      const result = await tool.execute({ ttl: -1 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid TTL value');
    });

    it('should handle cache clear errors', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.clear.mockImplementation(() => {
        throw new Error('Failed to clear cache');
      });

      const result = await tool.execute({ clear: true });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to clear cache');
    });

    it('should handle statistics retrieval errors', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.getSize.mockImplementation(() => {
        throw new Error('Failed to get cache size');
      });

      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to get cache size');
    });
  });

  describe('edge cases', () => {
    it('should handle empty configuration object', async () => {
      mockCache.isEnabled.mockReturnValue(true);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.getSize.mockReturnValue(50);
      mockCache.getHitRate.mockReturnValue(0.75);

      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(true);
      expect(result.data?.ttl).toBe(3600);
    });

    it('should handle null parameters gracefully', async () => {
      mockCache.isEnabled.mockReturnValue(false);
      mockCache.getTtl.mockReturnValue(3600);
      mockCache.getSize.mockReturnValue(0);
      mockCache.getHitRate.mockReturnValue(0);

      const result = await tool.execute({
        enabled: null as any,
        ttl: null as any,
        clear: null as any,
      });

      expect(result.success).toBe(true);
      // Should ignore null values and return current state
      expect(result.data?.enabled).toBe(false);
    });

    it('should handle undefined cache service methods', async () => {
      const incompleteMockCache = {
        isEnabled: jest.fn().mockReturnValue(true),
        // Missing other methods
      } as any;

      const toolWithIncompleteCache = new ConfigureCacheTool(mockClient, incompleteMockCache);

      const result = await toolWithIncompleteCache.execute({});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('TypeError');
    });
  });
});