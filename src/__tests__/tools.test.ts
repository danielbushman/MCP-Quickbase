import { toolRegistry } from "../tools/registry";
import { QuickbaseClient } from "../client/quickbase";
import { CacheService } from "../utils/cache";
import { initializeTools } from "../tools";

// Mock the QuickbaseClient
jest.mock("../client/quickbase");
jest.mock("../utils/cache");

describe("Tool Registry", () => {
  let mockClient: jest.Mocked<QuickbaseClient>;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    // Clear the registry before each test
    toolRegistry["tools"].clear();

    // Create mock instances
    mockClient = new QuickbaseClient({
      realmHost: "test.quickbase.com",
      userToken: "test-token",
    }) as jest.Mocked<QuickbaseClient>;

    mockCache = new CacheService(3600, true) as jest.Mocked<CacheService>;
  });

  describe("initializeTools", () => {
    it("should register all expected tools", () => {
      initializeTools(mockClient, mockCache);

      const toolNames = toolRegistry.getToolNames();

      // Verify all expected tools are registered
      expect(toolNames).toContain("test_connection");
      expect(toolNames).toContain("configure_cache");
      expect(toolNames).toContain("create_app");
      expect(toolNames).toContain("update_app");
      expect(toolNames).toContain("list_tables");
      expect(toolNames).toContain("create_table");
      expect(toolNames).toContain("update_table");
      expect(toolNames).toContain("get_table_fields");
      expect(toolNames).toContain("create_field");
      expect(toolNames).toContain("get_field");
      expect(toolNames).toContain("update_field");
      expect(toolNames).toContain("delete_field");
      expect(toolNames).toContain("query_records");
      expect(toolNames).toContain("create_record");
      expect(toolNames).toContain("update_record");
      expect(toolNames).toContain("bulk_create_records");
      expect(toolNames).toContain("bulk_update_records");
      expect(toolNames).toContain("upload_file");
      expect(toolNames).toContain("download_file");
      expect(toolNames).toContain("run_report");

      // Verify total count
      expect(toolNames.length).toBe(20);
    });

    it("should register tools in correct categories", () => {
      initializeTools(mockClient, mockCache);

      const allTools = toolRegistry.getAllTools();

      // Check that we have tools from all categories
      const appTools = allTools.filter((tool) =>
        ["create_app", "update_app", "list_tables"].includes(tool.name),
      );
      const tableTools = allTools.filter((tool) =>
        ["create_table", "update_table", "get_table_fields"].includes(
          tool.name,
        ),
      );
      const fieldTools = allTools.filter((tool) =>
        ["create_field", "get_field", "update_field", "delete_field"].includes(
          tool.name,
        ),
      );
      const recordTools = allTools.filter((tool) =>
        tool.name.includes("record"),
      );
      const fileTools = allTools.filter((tool) => tool.name.includes("file"));
      const reportTools = allTools.filter((tool) =>
        tool.name.includes("report"),
      );

      expect(appTools.length).toBe(3);
      expect(tableTools.length).toBe(3);
      expect(fieldTools.length).toBe(4);
      expect(recordTools.length).toBe(5);
      expect(fileTools.length).toBe(2);
      expect(reportTools.length).toBe(1);
    });
  });

  describe("tool registry functionality", () => {
    it("should be able to retrieve specific tools", () => {
      initializeTools(mockClient, mockCache);

      const testTool = toolRegistry.getTool("test_connection");
      expect(testTool).toBeDefined();
      expect(testTool?.name).toBe("test_connection");
    });

    it("should return undefined for non-existent tools", () => {
      const nonExistentTool = toolRegistry.getTool("non_existent_tool");
      expect(nonExistentTool).toBeUndefined();
    });

    it("should track tool count correctly", () => {
      expect(toolRegistry.getToolCount()).toBe(0);

      initializeTools(mockClient, mockCache);

      expect(toolRegistry.getToolCount()).toBe(20);
    });
  });
});
