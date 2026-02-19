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

    it("should pass groupBy with a single field to the API body", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [{ "1": { value: 1 }, "6": { value: "Grouped" } }],
          metadata: { totalRecords: 1, numRecords: 1 },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        groupBy: [{ fieldId: 6, grouping: "equal-values" as const }],
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "POST",
        path: "/records/query",
        body: {
          from: "test-table",
          groupBy: [{ fieldId: 6, grouping: "equal-values" }],
          options: {
            skip: 0,
            top: 1000,
          },
        },
      });
    });

    it("should pass groupBy with multiple fields to the API body", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [{ "1": { value: 1 }, "6": { value: "Grouped" } }],
          metadata: { totalRecords: 1, numRecords: 1 },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        groupBy: [
          { fieldId: 6, grouping: "equal-values" as const },
          { fieldId: 9, grouping: "first-word" as const },
        ],
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "POST",
        path: "/records/query",
        body: {
          from: "test-table",
          groupBy: [
            { fieldId: 6, grouping: "equal-values" },
            { fieldId: 9, grouping: "first-word" },
          ],
          options: {
            skip: 0,
            top: 1000,
          },
        },
      });
    });

    it("should not include groupBy in body when groupBy is omitted", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [{ "1": { value: 1 }, "6": { value: "Active" } }],
          metadata: { totalRecords: 1, numRecords: 1 },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        where: "{6.EX.'Active'}",
      };

      await tool.execute(params);

      const callArgs = mockClient.request.mock.calls[0][0];
      expect(callArgs.body).not.toHaveProperty("groupBy");
    });

    it("should not include groupBy in body when groupBy is an empty array", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [{ "1": { value: 1 }, "6": { value: "Grouped" } }],
          metadata: { totalRecords: 1, numRecords: 1 },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        groupBy: [] as any[],
      };

      await tool.execute(params);

      const callArgs = mockClient.request.mock.calls[0][0];
      expect(callArgs.body).not.toHaveProperty("groupBy");
    });

    it("should place groupBy at top level of body, not inside options, when combined with other params", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [{ "1": { value: 1 }, "6": { value: "Grouped" } }],
          metadata: { totalRecords: 1, numRecords: 1 },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        where: "{6.EX.'Active'}",
        select: ["1", "6"],
        orderBy: [{ fieldId: "6", order: "ASC" as const }],
        groupBy: [{ fieldId: 6, grouping: "equal-values" as const }],
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "POST",
        path: "/records/query",
        body: {
          from: "test-table",
          where: "{6.EX.'Active'}",
          select: ["1", "6"],
          sortBy: [{ fieldId: "6", order: "ASC" }],
          groupBy: [{ fieldId: 6, grouping: "equal-values" }],
          options: {
            skip: 0,
            top: 1000,
          },
        },
      });

      // Critical negative assertion: groupBy must NOT be inside options
      const callArgs = mockClient.request.mock.calls[0][0];
      expect(callArgs.body).toHaveProperty("groupBy");
      expect(callArgs.body!.options).not.toHaveProperty("groupBy");
    });

    it("should include groupBy in body and not trigger pagination when results fit in one page", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [
            { "6": { value: "Active" } },
            { "6": { value: "Closed" } },
            { "6": { value: "Pending" } },
          ],
          metadata: { totalRecords: 3, numRecords: 3 },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "test-table",
        groupBy: [{ fieldId: 6, grouping: "equal-values" as const }],
        paginate: true,
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      // Pagination should NOT have activated (only 3 records, well under the 1000 top)
      expect(mockClient.request).toHaveBeenCalledTimes(1);

      // The single call should include groupBy at the top level of body
      const callArgs = mockClient.request.mock.calls[0][0];
      expect(callArgs.body).toHaveProperty("groupBy");
      expect(callArgs.body!.groupBy).toEqual([
        { fieldId: 6, grouping: "equal-values" },
      ]);
    });

    it("should truncate pagination correctly without duplicates when final page exceeds limit", async () => {
      // Regression test: Previously, pageRecords were appended before checking
      // if total exceeded limit, causing duplicates when truncation occurred.
      //
      // Scenario: limit=1500, first page=1000, second page request=500 but returns 750
      // (edge case where API returns more records than requested `top`)
      // - First page: returns 1000 records, hasMore=true
      // - Second page: we request 500, but API returns 750 (more than top)
      // - Bug: would append 750, then check triggers and appends 500 more (duplicates)
      // - Fixed: check BEFORE appending, truncate to 500, no duplicates

      const createRecords = (start: number, count: number) =>
        Array.from({ length: count }, (_, i) => ({
          "3": { value: start + i }, // Record ID field
          "6": { value: `Record ${start + i}` },
        }));

      // First page: records 1-1000 (full page of 1000)
      const firstPageResponse = {
        success: true,
        data: {
          data: createRecords(1, 1000),
          metadata: { totalRecords: 2000, numRecords: 1000 },
        },
      };

      // Second page: we request 500 (top=500), but API returns 750 (edge case)
      // This triggers the truncation logic
      const secondPageResponse = {
        success: true,
        data: {
          data: createRecords(1001, 750),
          metadata: { totalRecords: 2000, numRecords: 750 },
        },
      };

      mockClient.request = jest
        .fn()
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const params = {
        table_id: "test-table",
        max_records: 1500,
        paginate: true,
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);

      // Should have exactly 1500 records (not 1750 or 2250 from duplicates)
      expect(result.data?.records).toHaveLength(1500);

      // Verify no duplicate record IDs
      const recordIds = result.data?.records.map(
        (r: Record<string, { value: number }>) => r["3"].value,
      );
      const uniqueIds = new Set(recordIds);
      expect(uniqueIds.size).toBe(1500);

      // Verify records are 1-1500 (first 1000 + first 500 of second page, truncated)
      expect(recordIds).toBeDefined();
      expect(recordIds![0]).toBe(1);
      expect(recordIds![999]).toBe(1000);
      expect(recordIds![1000]).toBe(1001);
      expect(recordIds![1499]).toBe(1500);

      // hasMore should be true since API returned more records than we needed
      expect(result.data?.hasMore).toBe(true);
    });
  });
});
