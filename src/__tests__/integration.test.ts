import { QuickbaseClient } from "../client/quickbase";
import { CacheService } from "../utils/cache";
import { initializeTools, toolRegistry } from "../tools";
import { QuickbaseConfig } from "../types/config";

describe("Integration Tests", () => {
  let client: QuickbaseClient;
  let cache: CacheService;

  beforeEach(() => {
    // Clear registry before each test
    toolRegistry["tools"].clear();

    const config: QuickbaseConfig = {
      realmHost: "test.quickbase.com",
      userToken: "test-token",
      appId: "test-app-id",
      cacheEnabled: false, // Disable cache for testing
    };

    client = new QuickbaseClient(config);
    cache = new CacheService(3600, false);
  });

  describe("Full system integration", () => {
    it("should initialize all tools successfully", () => {
      expect(toolRegistry.getToolCount()).toBe(0);

      initializeTools(client, cache);

      expect(toolRegistry.getToolCount()).toBe(18);

      // Verify all expected tools are present
      const expectedTools = [
        "test_connection",
        "configure_cache",
        "create_app",
        "update_app",
        "list_tables",
        "create_table",
        "update_table",
        "get_table_fields",
        "create_field",
        "update_field",
        "query_records",
        "create_record",
        "update_record",
        "bulk_create_records",
        "bulk_update_records",
        "upload_file",
        "download_file",
        "run_report",
      ];

      expectedTools.forEach((toolName) => {
        const tool = toolRegistry.getTool(toolName);
        expect(tool).toBeDefined();
        expect(tool?.name).toBe(toolName);
      });
    });

    it("should handle tool execution lifecycle", async () => {
      initializeTools(client, cache);

      const testTool = toolRegistry.getTool("test_connection");
      expect(testTool).toBeDefined();

      // Mock the client request for this test
      jest.spyOn(client, "request").mockResolvedValue({
        success: true,
        data: { connected: true },
      });

      const result = await testTool!.execute({});
      expect(result.success).toBe(true);
    });

    it("should handle cache integration", () => {
      const enabledCache = new CacheService(3600, true);

      // Test cache operations
      enabledCache.set("test-key", { data: "test" });
      expect(enabledCache.get("test-key")).toEqual({ data: "test" });

      // Test cache with client
      const clientWithCache = new QuickbaseClient({
        realmHost: "test.quickbase.com",
        userToken: "test-token",
        cacheEnabled: true,
      });

      expect(clientWithCache).toBeInstanceOf(QuickbaseClient);
    });
  });

  describe("Error handling integration", () => {
    it("should handle client initialization errors gracefully", () => {
      expect(() => {
        new QuickbaseClient({
          realmHost: "",
          userToken: "test-token",
        });
      }).toThrow("Realm hostname is required");

      expect(() => {
        new QuickbaseClient({
          realmHost: "test.quickbase.com",
          userToken: "",
        });
      }).toThrow("User token is required");
    });

    it("should handle tool registration errors", () => {
      initializeTools(client, cache);

      // Attempting to get non-existent tool should return undefined
      const nonExistentTool = toolRegistry.getTool("non_existent_tool");
      expect(nonExistentTool).toBeUndefined();
    });
  });

  describe("Configuration integration", () => {
    it("should respect configuration options", () => {
      const customConfig: QuickbaseConfig = {
        realmHost: "custom.quickbase.com",
        userToken: "custom-token",
        appId: "custom-app",
        cacheEnabled: true,
        cacheTtl: 7200,
        debug: true,
        maxRetries: 5,
        retryDelay: 2000,
      };

      const customClient = new QuickbaseClient(customConfig);
      expect(customClient).toBeInstanceOf(QuickbaseClient);

      const customCache = new CacheService(7200, true);
      expect(customCache).toBeInstanceOf(CacheService);
    });
  });
});
