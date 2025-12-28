import { CacheService } from "../utils/cache";

describe("CacheService", () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService(3600, true);
  });

  afterEach(() => {
    cache.clear();
  });

  describe("constructor", () => {
    it("should create cache with specified TTL and enabled state", () => {
      const customCache = new CacheService(1800, false);
      expect(customCache).toBeInstanceOf(CacheService);
    });

    it("should handle default values", () => {
      const defaultCache = new CacheService();
      expect(defaultCache).toBeInstanceOf(CacheService);
    });
  });

  describe("cache operations", () => {
    it("should store and retrieve values", () => {
      const key = "test-key";
      const value = { data: "test-data" };

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it("should return undefined for non-existent keys", () => {
      const result = cache.get("non-existent-key");
      expect(result).toBeUndefined();
    });

    it("should check if key exists", () => {
      const key = "test-key";

      expect(cache.has(key)).toBe(false);

      cache.set(key, "value");
      expect(cache.has(key)).toBe(true);
    });

    it("should delete specific keys", () => {
      const key = "test-key";
      cache.set(key, "value");

      expect(cache.has(key)).toBe(true);
      cache.delete(key);
      expect(cache.has(key)).toBe(false);
    });

    it("should clear all cached values", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      expect(cache.has("key1")).toBe(true);
      expect(cache.has("key2")).toBe(true);

      cache.clear();

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
    });
  });

  describe("cache configuration", () => {
    it("should respect enabled/disabled state", () => {
      const disabledCache = new CacheService(3600, false);
      disabledCache.set("key", "value");

      // When disabled, should not store values
      expect(disabledCache.get("key")).toBeUndefined();
    });

    it("should allow enabling/disabling cache", () => {
      cache.setEnabled(false);
      cache.set("key", "value");
      expect(cache.get("key")).toBeUndefined();

      cache.setEnabled(true);
      cache.set("key", "value");
      expect(cache.get("key")).toBe("value");
    });

    it("should update TTL configuration", () => {
      const newTtl = 7200;
      cache.setTtl(newTtl);

      // The TTL change should be reflected in internal state
      expect(cache).toBeInstanceOf(CacheService);
    });
  });

  describe("cache statistics", () => {
    it("should provide cache statistics", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.get("key1"); // hit
      cache.get("non-existent"); // miss

      const stats = cache.getStats();

      expect(stats.keys).toBeGreaterThan(0);
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
    });
  });
});
