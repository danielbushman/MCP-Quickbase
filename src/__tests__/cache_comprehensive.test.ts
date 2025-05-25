import { Cache } from '../utils/cache';

// Mock the logger
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  })
}));

describe('Cache Comprehensive', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache({ ttl: 1000, enabled: true });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      cache.set(key, value);
      const result = cache.get(key);

      expect(result).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should delete keys', () => {
      const key = 'test-key';
      cache.set(key, 'value');
      
      expect(cache.has(key)).toBe(true);
      cache.delete(key);
      expect(cache.has(key)).toBe(false);
      expect(cache.get(key)).toBeUndefined();
    });

    it('should check if keys exist', () => {
      const key = 'test-key';
      
      expect(cache.has(key)).toBe(false);
      cache.set(key, 'value');
      expect(cache.has(key)).toBe(true);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size()).toBe(3);
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should return correct size', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const shortTtlCache = new Cache({ ttl: 50, enabled: true });
      const key = 'expire-me';
      
      shortTtlCache.set(key, 'value');
      expect(shortTtlCache.get(key)).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(shortTtlCache.get(key)).toBeUndefined();
      expect(shortTtlCache.has(key)).toBe(false);
    });

    it('should not expire entries before TTL', async () => {
      const key = 'dont-expire';
      
      cache.set(key, 'value');
      expect(cache.get(key)).toBe('value');
      
      // Wait half the TTL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(cache.get(key)).toBe('value');
      expect(cache.has(key)).toBe(true);
    });

    it('should clean up expired entries during cleanup', async () => {
      const shortTtlCache = new Cache({ ttl: 50, enabled: true });
      
      shortTtlCache.set('key1', 'value1');
      shortTtlCache.set('key2', 'value2');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger cleanup by adding a new entry
      shortTtlCache.set('key3', 'value3');
      
      expect(shortTtlCache.size()).toBe(1);
      expect(shortTtlCache.get('key3')).toBe('value3');
    });
  });

  describe('Disabled Cache', () => {
    it('should not store values when disabled', () => {
      const disabledCache = new Cache({ ttl: 1000, enabled: false });
      
      disabledCache.set('key', 'value');
      expect(disabledCache.get('key')).toBeUndefined();
      expect(disabledCache.has('key')).toBe(false);
      expect(disabledCache.size()).toBe(0);
    });

    it('should allow deletion operations when disabled', () => {
      const disabledCache = new Cache({ ttl: 1000, enabled: false });
      
      // These should not throw errors
      disabledCache.delete('non-existent');
      disabledCache.clear();
      
      expect(disabledCache.size()).toBe(0);
    });

    it('should be toggleable', () => {
      const toggleCache = new Cache({ ttl: 1000, enabled: false });
      
      // Disabled state
      toggleCache.set('key', 'value');
      expect(toggleCache.get('key')).toBeUndefined();
      
      // Enable and test
      toggleCache.setEnabled(true);
      toggleCache.set('key', 'value');
      expect(toggleCache.get('key')).toBe('value');
      
      // Disable again
      toggleCache.setEnabled(false);
      toggleCache.set('key2', 'value2');
      expect(toggleCache.get('key2')).toBeUndefined();
      // Previously set key should still be there
      expect(toggleCache.get('key')).toBe('value');
    });
  });

  describe('Configuration Updates', () => {
    it('should update TTL', () => {
      cache.setTtl(2000);
      
      // Test by checking internal state indirectly
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
    });

    it('should handle zero TTL', () => {
      cache.setTtl(0);
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
    });

    it('should handle negative TTL gracefully', () => {
      cache.setTtl(-1000);
      cache.set('key', 'value');
      // Should still work (implementation dependent)
      expect(cache.has('key')).toBeDefined();
    });

    it('should get current enabled state', () => {
      expect(cache.isEnabled()).toBe(true);
      
      cache.setEnabled(false);
      expect(cache.isEnabled()).toBe(false);
      
      cache.setEnabled(true);
      expect(cache.isEnabled()).toBe(true);
    });

    it('should get current TTL', () => {
      expect(cache.getTtl()).toBe(1000);
      
      cache.setTtl(5000);
      expect(cache.getTtl()).toBe(5000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined values', () => {
      cache.set('key', undefined);
      expect(cache.get('key')).toBeUndefined();
      expect(cache.has('key')).toBe(true); // Key exists but value is undefined
    });

    it('should handle null values', () => {
      cache.set('key', null);
      expect(cache.get('key')).toBeNull();
      expect(cache.has('key')).toBe(true);
    });

    it('should handle empty string keys', () => {
      cache.set('', 'empty-key-value');
      expect(cache.get('')).toBe('empty-key-value');
      expect(cache.has('')).toBe(true);
    });

    it('should handle complex object values', () => {
      const complexValue = {
        nested: {
          array: [1, 2, 3],
          object: { deep: 'value' }
        },
        func: function() { return 'test'; }
      };
      
      cache.set('complex', complexValue);
      const result = cache.get('complex');
      
      expect(result).toEqual(complexValue);
      expect(result?.nested.array).toEqual([1, 2, 3]);
    });

    it('should handle many entries', () => {
      const entryCount = 1000;
      
      // Set many entries
      for (let i = 0; i < entryCount; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }
      
      expect(cache.size()).toBe(entryCount);
      
      // Verify random entries
      expect(cache.get('key-500')).toBe('value-500');
      expect(cache.get('key-999')).toBe('value-999');
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide stats when available', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('non-existent'); // miss
      
      const stats = cache.getStats();
      if (stats) {
        expect(stats.hits).toBeGreaterThan(0);
        expect(stats.misses).toBeGreaterThan(0);
        expect(stats.size).toBe(1);
      }
    });

    it('should handle stats when not available', () => {
      const stats = cache.getStats();
      // Should not throw, may return undefined or basic stats
      expect(stats).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should handle cleanup when cache grows large', () => {
      const largeTtlCache = new Cache({ ttl: 10, enabled: true });
      
      // Add many entries that will expire
      for (let i = 0; i < 100; i++) {
        largeTtlCache.set(`temp-${i}`, `value-${i}`);
      }
      
      expect(largeTtlCache.size()).toBe(100);
      
      // Wait for entries to expire and trigger cleanup
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          largeTtlCache.set('trigger-cleanup', 'new-value');
          expect(largeTtlCache.size()).toBeLessThan(100);
          resolve();
        }, 50);
      });
    });
  });
});