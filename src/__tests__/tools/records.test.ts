import {
  CreateRecordTool,
  UpdateRecordTool,
  QueryRecordsTool,
} from "../../tools/records";
import { QuickbaseClient } from "../../client/quickbase";
import { QuickbaseConfig } from "../../types/config";

// Mock the QuickbaseClient
jest.mock("../../client/quickbase");

describe("Record Tools", () => {
  let mockClient: jest.Mocked<QuickbaseClient>;

  beforeEach(() => {
    const config: QuickbaseConfig = {
      realmHost: "test.quickbase.com",
      userToken: "test-token",
      appId: "test-app-id",
    };

    mockClient = new QuickbaseClient(config) as jest.Mocked<QuickbaseClient>;
  });

  describe("CreateRecordTool", () => {
    let tool: CreateRecordTool;

    beforeEach(() => {
      tool = new CreateRecordTool(mockClient);
    });

    it("should have correct properties", () => {
      expect(tool.name).toBe("create_record");
      expect(tool.description).toBeTruthy();
      expect(tool.paramSchema).toBeDefined();
    });

    it("should create record successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          metadata: {
            createdRecordIds: ["123"],
            totalNumberOfRecordsProcessed: 1,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        data: {
          "6": "Test Record",
          "7": "Test Description",
        },
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "POST",
        path: "/records",
        body: {
          to: "test-table",
          data: [
            {
              "6": { value: "Test Record" },
              "7": { value: "Test Description" },
            },
          ],
        },
      });
    });

    it("should handle validation errors", async () => {
      // Mock the request to return an error for empty table_id
      mockClient.request.mockResolvedValueOnce({
        success: false,
        error: {
          message: "Invalid table ID",
          type: "validation_error",
          code: 400,
        },
      });

      const params = {
        table_id: "", // Missing required field
        data: { "6": { value: "test" } }, // Valid data to pass data validation
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("UpdateRecordTool", () => {
    let tool: UpdateRecordTool;

    beforeEach(() => {
      tool = new UpdateRecordTool(mockClient);
    });

    it("should have correct properties", () => {
      expect(tool.name).toBe("update_record");
      expect(tool.description).toBeTruthy();
      expect(tool.paramSchema).toBeDefined();
    });

    it("should update record successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          metadata: {
            totalNumberOfRecordsProcessed: 1,
            unchangedRecordIds: [],
            lineErrors: [],
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        record_id: "123",
        data: {
          "6": "Updated Record",
        },
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "POST",
        path: "/records",
        body: {
          to: "test-table",
          data: [
            {
              id: "123",
              "6": { value: "Updated Record" },
            },
          ],
        },
      });
    });
  });

  describe("QueryRecordsTool", () => {
    let tool: QueryRecordsTool;

    beforeEach(() => {
      tool = new QueryRecordsTool(mockClient);
    });

    it("should have correct properties", () => {
      expect(tool.name).toBe("query_records");
      expect(tool.description).toBeTruthy();
      expect(tool.paramSchema).toBeDefined();
    });

    it("should query records successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [{ "1": { value: 1 }, "6": { value: "Test Record" } }],
          metadata: {
            totalRecords: 1,
            numRecords: 1,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        where: "{6.EX.'Test'}",
        select: ["1", "6"],
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(1);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "POST",
        path: "/records/query",
        body: {
          from: "test-table",
          where: "{6.EX.'Test'}",
          select: ["1", "6"],
          options: {
            skip: 0,
            top: 1000,
          },
        },
      });
    });

    it("should handle pagination options", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          metadata: { totalRecords: 0, numRecords: 0 },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        options: {
          top: 100,
          skip: 50,
          orderBy: [{ fieldId: "6", order: "ASC" }],
        },
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "POST",
        path: "/records/query",
        body: {
          from: "test-table",
          options: {
            top: 100,
            skip: 50,
            orderBy: [{ fieldId: "6", order: "ASC" }],
          },
        },
      });
    });
  });
});
