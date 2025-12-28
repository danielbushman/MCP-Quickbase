import { GetRelationshipsTool } from "../../tools/relationships";
import { QuickbaseClient } from "../../client/quickbase";
import { QuickbaseConfig } from "../../types/config";

// Mock the QuickbaseClient
jest.mock("../../client/quickbase");

describe("Relationship Tools", () => {
  let mockClient: jest.Mocked<QuickbaseClient>;

  beforeEach(() => {
    const config: QuickbaseConfig = {
      realmHost: "test.quickbase.com",
      userToken: "test-token",
      appId: "test-app-id",
    };

    mockClient = new QuickbaseClient(config) as jest.Mocked<QuickbaseClient>;
  });

  describe("GetRelationshipsTool", () => {
    let tool: GetRelationshipsTool;

    beforeEach(() => {
      tool = new GetRelationshipsTool(mockClient);
    });

    it("should have correct properties", () => {
      expect(tool.name).toBe("get_relationships");
      expect(tool.description).toBeTruthy();
      expect(tool.description).toContain("table-to-table relationships");
      expect(tool.paramSchema).toBeDefined();
      expect(tool.paramSchema.required).toContain("table_id");
    });

    it("should get relationships successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          relationships: [
            {
              id: 6,
              parentTableId: "bqr123abc",
              childTableId: "bqr456def",
              foreignKeyField: {
                id: 6,
                label: "Related Parent",
                type: "numeric",
              },
              isCrossApp: false,
              lookupFields: [
                {
                  id: 7,
                  label: "Parent Name",
                  type: "text",
                },
              ],
              summaryFields: [
                {
                  id: 8,
                  label: "Total Amount",
                  type: "numeric",
                },
              ],
            },
          ],
          metadata: {
            totalRelationships: 1,
            numRelationships: 1,
            skip: 0,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqr456def",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.relationships).toHaveLength(1);
      expect(result.data?.relationships[0].id).toBe(6);
      expect(result.data?.relationships[0].parentTableId).toBe("bqr123abc");
      expect(result.data?.relationships[0].childTableId).toBe("bqr456def");
      expect(result.data?.relationships[0].foreignKeyField.id).toBe(6);
      expect(result.data?.relationships[0].lookupFields).toHaveLength(1);
      expect(result.data?.relationships[0].summaryFields).toHaveLength(1);
      expect(result.data?.metadata.totalRelationships).toBe(1);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "GET",
        path: "/tables/bqr456def/relationships",
        params: undefined,
      });
    });

    it("should return empty array for table with no relationships", async () => {
      const mockResponse = {
        success: true,
        data: {
          relationships: [],
          metadata: {
            totalRelationships: 0,
            numRelationships: 0,
            skip: 0,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqr789xyz",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.relationships).toHaveLength(0);
      expect(result.data?.metadata.totalRelationships).toBe(0);
    });

    it("should handle pagination with skip parameter", async () => {
      const mockResponse = {
        success: true,
        data: {
          relationships: [
            {
              id: 10,
              parentTableId: "bqr111",
              childTableId: "bqr222",
              foreignKeyField: {
                id: 10,
                label: "Related Record",
                type: "numeric",
              },
              isCrossApp: false,
              lookupFields: [],
              summaryFields: [],
            },
          ],
          metadata: {
            totalRelationships: 15,
            numRelationships: 1,
            skip: 10,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqr222",
        skip: 10,
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.relationships).toHaveLength(1);
      expect(result.data?.metadata.skip).toBe(10);
      expect(result.data?.metadata.totalRelationships).toBe(15);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "GET",
        path: "/tables/bqr222/relationships",
        params: { skip: "10" },
      });
    });

    it("should handle table with many relationships", async () => {
      const manyRelationships = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        parentTableId: `bqrparent${i}`,
        childTableId: "bqrchild",
        foreignKeyField: {
          id: i + 1,
          label: `Related ${i}`,
          type: "numeric",
        },
        isCrossApp: false,
        lookupFields: [{ id: 100 + i, label: `Lookup ${i}`, type: "text" }],
        summaryFields: [],
      }));

      const mockResponse = {
        success: true,
        data: {
          relationships: manyRelationships,
          metadata: {
            totalRelationships: 25,
            numRelationships: 25,
            skip: 0,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqrchild",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.relationships).toHaveLength(25);
      expect(result.data?.metadata.totalRelationships).toBe(25);
    });

    it("should handle cross-app relationships", async () => {
      const mockResponse = {
        success: true,
        data: {
          relationships: [
            {
              id: 15,
              parentTableId: "bqrother123",
              childTableId: "bqrlocal456",
              foreignKeyField: {
                id: 15,
                label: "Cross-App Link",
                type: "numeric",
              },
              isCrossApp: true,
              lookupFields: [],
              summaryFields: [],
            },
          ],
          metadata: {
            totalRelationships: 1,
            numRelationships: 1,
            skip: 0,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqrlocal456",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.relationships[0].isCrossApp).toBe(true);
    });

    it("should handle 404 table not found error", async () => {
      const mockResponse = {
        success: false,
        error: {
          message: "Table not found",
          type: "NotFoundError",
          code: 404,
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqrnonexistent",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Table not found");
    });

    it("should handle 401 unauthorized error", async () => {
      const mockResponse = {
        success: false,
        error: {
          message: "Unauthorized",
          type: "UnauthorizedError",
          code: 401,
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqr123",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Unauthorized");
    });

    it("should handle 403 forbidden error", async () => {
      const mockResponse = {
        success: false,
        error: {
          message: "Access denied to this table",
          type: "ForbiddenError",
          code: 403,
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqrrestricted",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Access denied");
    });

    it("should handle network error", async () => {
      mockClient.request = jest
        .fn()
        .mockRejectedValue(new Error("Network error: connection refused"));

      const params = {
        table_id: "bqr123",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Network error");
    });

    it("should handle API response missing relationships array", async () => {
      const mockResponse = {
        success: true,
        data: {
          // Missing 'relationships' array
          metadata: {
            totalRelationships: 0,
            numRelationships: 0,
            skip: 0,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqr123",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("relationships array");
    });

    it("should handle relationship with missing optional fields", async () => {
      const mockResponse = {
        success: true,
        data: {
          relationships: [
            {
              id: 5,
              parentTableId: "bqrparent",
              childTableId: "bqrchild",
              foreignKeyField: {
                id: 5,
                label: "Parent Link",
                type: "numeric",
              },
              // Missing isCrossApp, lookupFields, summaryFields
            },
          ],
          // Missing metadata
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqrchild",
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(result.data?.relationships[0].isCrossApp).toBe(false);
      expect(result.data?.relationships[0].lookupFields).toEqual([]);
      expect(result.data?.relationships[0].summaryFields).toEqual([]);
      // Metadata should fall back to calculated values
      expect(result.data?.metadata.numRelationships).toBe(1);
      expect(result.data?.metadata.totalRelationships).toBe(1);
    });

    it("should handle zero skip value correctly", async () => {
      const mockResponse = {
        success: true,
        data: {
          relationships: [],
          metadata: {
            totalRelationships: 0,
            numRelationships: 0,
            skip: 0,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqr123",
        skip: 0,
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      // skip: 0 should not be included in query params
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "GET",
        path: "/tables/bqr123/relationships",
        params: undefined,
      });
    });

    it("should include skip in params when greater than zero", async () => {
      const mockResponse = {
        success: true,
        data: {
          relationships: [],
          metadata: {
            totalRelationships: 0,
            numRelationships: 0,
            skip: 5,
          },
        },
      };

      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        table_id: "bqr123",
        skip: 5,
      };

      const result = await tool.execute(params);

      expect(result.success).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: "GET",
        path: "/tables/bqr123/relationships",
        params: { skip: "5" },
      });
    });
  });
});
