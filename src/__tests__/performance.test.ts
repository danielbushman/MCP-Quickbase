import { QuickbaseClient } from "../client/quickbase";
import { CacheService } from "../utils/cache";
import { initializeTools, toolRegistry } from "../tools";
import { QuickbaseConfig } from "../types/config";

describe("Performance Tests", () => {
  let client: QuickbaseClient;
  let cache: CacheService;

  beforeEach(() => {
    // Clear registry before each test
    toolRegistry["tools"].clear();

    const config: QuickbaseConfig = {
      realmHost: "test.quickbase.com",
      userToken: "test-token",
      appId: "test-app-id",
      cacheEnabled: true,
      cacheTtl: 3600,
    };

    client = new QuickbaseClient(config);
    cache = new CacheService(3600, true);
  });

  describe("Tool initialization performance", () => {
    it("should initialize all tools within performance target", () => {
      const startTime = Date.now();

      initializeTools(client, cache);

      const endTime = Date.now();
      const initializationTime = endTime - startTime;

      // Should initialize all 18 tools in under 100ms
      expect(initializationTime).toBeLessThan(100);
      expect(toolRegistry.getToolCount()).toBe(18);
    });

    it("should handle concurrent tool registrations efficiently", () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        toolRegistry["tools"].clear();

        const startTime = Date.now();
        initializeTools(client, cache);
        const endTime = Date.now();

        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      // Average should be under 50ms, max under 100ms
      expect(averageTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(100);
    });
  });

  describe("Cache performance", () => {
    it("should cache operations efficiently", () => {
      const cache = new CacheService(3600, true);
      const key = "test-key";
      const value = { data: "test-data" };

      // Measure set operation
      const setStart = Date.now();
      cache.set(key, value);
      const setTime = Date.now() - setStart;

      // Measure get operation
      const getStart = Date.now();
      const retrieved = cache.get(key);
      const getTime = Date.now() - getStart;

      // Cache operations should be very fast
      expect(setTime).toBeLessThan(10);
      expect(getTime).toBeLessThan(10);
      expect(retrieved).toEqual(value);
    });

    it("should handle large cache volumes efficiently", () => {
      const cache = new CacheService(3600, true);
      const itemCount = 1000;

      // Measure bulk cache operations
      const bulkSetStart = Date.now();
      for (let i = 0; i < itemCount; i++) {
        cache.set(`key-${i}`, { data: `value-${i}` });
      }
      const bulkSetTime = Date.now() - bulkSetStart;

      // Measure bulk retrieval
      const bulkGetStart = Date.now();
      for (let i = 0; i < itemCount; i++) {
        cache.get(`key-${i}`);
      }
      const bulkGetTime = Date.now() - bulkGetStart;

      // Should handle 1000 operations efficiently
      expect(bulkSetTime).toBeLessThan(100);
      expect(bulkGetTime).toBeLessThan(50);
    });

    it("should provide fast cache operations", () => {
      const cache = new CacheService(3600, true);

      // Add some data
      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      // Measure clear operation
      const clearStart = Date.now();
      cache.clear();
      const clearTime = Date.now() - clearStart;

      expect(clearTime).toBeLessThan(10);
      expect(cache.isEnabled()).toBe(true);
    });
  });

  describe("Client performance", () => {
    it("should create client instances quickly", () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const config: QuickbaseConfig = {
          realmHost: "test.quickbase.com",
          userToken: "test-token",
          cacheEnabled: false,
        };

        const startTime = Date.now();
        new QuickbaseClient(config);
        const endTime = Date.now();

        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      // Client creation should be very fast
      expect(averageTime).toBeLessThan(5);
      expect(maxTime).toBeLessThan(20);
    });

    it("should validate configuration efficiently", () => {
      const validConfigs = [
        { realmHost: "test.quickbase.com", userToken: "token1" },
        {
          realmHost: "another.quickbase.com",
          userToken: "token2",
          appId: "app123",
        },
        {
          realmHost: "third.quickbase.com",
          userToken: "token3",
          cacheEnabled: true,
        },
      ];

      const startTime = Date.now();

      validConfigs.forEach((config) => {
        new QuickbaseClient(config);
      });

      const totalTime = Date.now() - startTime;

      // Should validate multiple configs quickly
      expect(totalTime).toBeLessThan(50);
    });
  });

  describe("Memory usage", () => {
    it("should not leak memory during repeated operations", () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const iterations = 1000;

      // Perform many cache operations
      for (let i = 0; i < iterations; i++) {
        const tempCache = new CacheService(3600, true);
        tempCache.set(`key-${i}`, { data: `value-${i}` });
        tempCache.get(`key-${i}`);
        tempCache.clear();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it("should clean up resources properly", () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and destroy many clients
      for (let i = 0; i < 100; i++) {
        new QuickbaseClient({
          realmHost: "test.quickbase.com",
          userToken: "test-token",
        });

        // Simulate some usage
        const cache = new CacheService(3600, true);
        cache.set("test", "data");
        cache.clear();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Should not significantly increase memory
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });
  });

  describe("Scalability", () => {
    it("should handle tool registry scaling", () => {
      // Test with multiple parallel initializations
      const promises = Array.from({ length: 10 }, () => {
        return new Promise<number>((resolve) => {
          const startTime = Date.now();
          toolRegistry["tools"].clear();
          initializeTools(client, cache);
          resolve(Date.now() - startTime);
        });
      });

      return Promise.all(promises).then((times) => {
        const maxTime = Math.max(...times);
        const averageTime = times.reduce((a, b) => a + b, 0) / times.length;

        // Parallel operations should complete reasonably quickly
        expect(maxTime).toBeLessThan(200);
        expect(averageTime).toBeLessThan(100);
      });
    });

    it("should maintain performance with large parameter objects", async () => {
      initializeTools(client, cache);
      const testTool = toolRegistry.getTool("test_connection");
      expect(testTool).toBeDefined();

      // Create large parameter object
      const largeParams: any = {};
      for (let i = 0; i < 1000; i++) {
        largeParams[`param_${i}`] = `value_${i}`;
      }

      const startTime = Date.now();

      // Test parameter validation directly with large params
      try {
        // Call validateParams directly (protected method, so we cast to access it)
        (testTool as any).validateParams(largeParams);
      } catch (error) {
        // Expected to fail validation since test_connection takes no parameters
      }

      const validationTime = Date.now() - startTime;

      // Parameter validation should be fast even for large objects
      expect(validationTime).toBeLessThan(10); // Much more reasonable expectation for validation
    });
  });
});
