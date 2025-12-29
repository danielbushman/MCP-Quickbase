import {
  GetRelationshipsTool,
  CreateRelationshipTool,
  UpdateRelationshipTool,
  DeleteRelationshipTool,
} from "../../tools/relationships";
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

  describe("CreateRelationshipTool", () => {
    let tool: CreateRelationshipTool;

    beforeEach(() => {
      tool = new CreateRelationshipTool(mockClient);
    });

    it("should have correct properties", () => {
      expect(tool.name).toBe("create_relationship");
      expect(tool.description).toBeTruthy();
      expect(tool.description).toContain("table-to-table relationship");
      expect(tool.description).toContain("SAFE");
      expect(tool.paramSchema).toBeDefined();
      expect(tool.paramSchema.required).toContain("table_id");
      expect(tool.paramSchema.required).toContain("parent_table_id");
    });

    it("should have conditional validation in schema", () => {
      expect(tool.paramSchema.if).toBeDefined();
      expect(tool.paramSchema.then).toBeDefined();
      expect(tool.paramSchema.if.required).toContain("summary_field_id");
      expect(tool.paramSchema.then.required).toContain(
        "summary_accumulation_type",
      );
    });

    // Happy Path Tests
    describe("Happy Path", () => {
      it("should create basic relationship (parent + child only)", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe(10);
        expect(result.data?.parentTableId).toBe("bqrparent123");
        expect(result.data?.childTableId).toBe("bqrchild456");
        expect(result.data?.foreignKeyField.id).toBe(10);
        expect(result.data?.lookupFields).toHaveLength(0);
        expect(result.data?.summaryFields).toHaveLength(0);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
          },
        });
      });

      it("should create relationship with custom foreign key label", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 11,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 11,
              label: "Customer Link",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          foreign_key_label: "Customer Link",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.foreignKeyField.label).toBe("Customer Link");
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
            foreignKeyField: {
              label: "Customer Link",
            },
          },
        });
      });

      it("should create relationship with lookup field IDs", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 12,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 12,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [
              { id: 20, label: "Parent Name", type: "text" },
              { id: 21, label: "Parent Email", type: "email" },
            ],
            summaryFields: [],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          lookup_field_ids: [6, 7],
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.lookupFields).toHaveLength(2);
        expect(result.data?.lookupFields[0].label).toBe("Parent Name");
        expect(result.data?.lookupFields[1].label).toBe("Parent Email");
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
            lookupFieldIds: [6, 7],
          },
        });
      });

      it("should create relationship with summary field using SUM", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 13,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 13,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [{ id: 30, label: "Total Amount", type: "numeric" }],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          summary_field_id: 8,
          summary_accumulation_type: "SUM" as const,
          summary_label: "Total Amount",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.summaryFields).toHaveLength(1);
        expect(result.data?.summaryFields[0].label).toBe("Total Amount");
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
            summaryFields: [
              {
                summaryFid: 8,
                accumulationType: "SUM",
                label: "Total Amount",
              },
            ],
          },
        });
      });

      it("should create relationship with summary field using COUNT", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 14,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 14,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [{ id: 31, label: "Child Count", type: "numeric" }],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          summary_field_id: 3,
          summary_accumulation_type: "COUNT" as const,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.summaryFields).toHaveLength(1);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
            summaryFields: [
              {
                summaryFid: 3,
                accumulationType: "COUNT",
              },
            ],
          },
        });
      });

      it("should create relationship with summary field using AVG", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 15,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 15,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [
              { id: 32, label: "Average Score", type: "numeric" },
            ],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          summary_field_id: 9,
          summary_accumulation_type: "AVG" as const,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
            summaryFields: [
              {
                summaryFid: 9,
                accumulationType: "AVG",
              },
            ],
          },
        });
      });

      it("should create relationship with summary field using MAX", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 16,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 16,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [{ id: 33, label: "Latest Date", type: "date" }],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          summary_field_id: 10,
          summary_accumulation_type: "MAX" as const,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
            summaryFields: [
              {
                summaryFid: 10,
                accumulationType: "MAX",
              },
            ],
          },
        });
      });

      it("should create relationship with summary field using MIN", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 17,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 17,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [{ id: 34, label: "Earliest Date", type: "date" }],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          summary_field_id: 11,
          summary_accumulation_type: "MIN" as const,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
            summaryFields: [
              {
                summaryFid: 11,
                accumulationType: "MIN",
              },
            ],
          },
        });
      });

      it("should create relationship with both lookup and summary fields", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 18,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 18,
              label: "Customer",
              type: "numeric",
            },
            lookupFields: [
              { id: 40, label: "Customer Name", type: "text" },
              { id: 41, label: "Customer Status", type: "text" },
            ],
            summaryFields: [{ id: 50, label: "Total Orders", type: "numeric" }],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          foreign_key_label: "Customer",
          lookup_field_ids: [6, 7],
          summary_field_id: 8,
          summary_accumulation_type: "COUNT" as const,
          summary_label: "Total Orders",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.foreignKeyField.label).toBe("Customer");
        expect(result.data?.lookupFields).toHaveLength(2);
        expect(result.data?.summaryFields).toHaveLength(1);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
            foreignKeyField: {
              label: "Customer",
            },
            lookupFieldIds: [6, 7],
            summaryFields: [
              {
                summaryFid: 8,
                accumulationType: "COUNT",
                label: "Total Orders",
              },
            ],
          },
        });
      });
    });

    // Error Cases
    describe("Error Cases", () => {
      it("should handle parent table not found error", async () => {
        const mockResponse = {
          success: false,
          error: {
            message: "Parent table not found",
            type: "NotFoundError",
            code: 404,
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrnonexistent",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("Parent table not found");
      });

      it("should handle invalid field IDs for lookups", async () => {
        const mockResponse = {
          success: false,
          error: {
            message: "Invalid field ID: 999",
            type: "ValidationError",
            code: 400,
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          lookup_field_ids: [999],
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("Invalid field ID");
      });

      it("should fail when summary_field_id provided without summary_accumulation_type", async () => {
        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          summary_field_id: 8,
          // Missing summary_accumulation_type
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("summary_accumulation_type");
        expect(result.error?.message).toContain("required");
      });

      it("should handle tables in different apps error", async () => {
        const mockResponse = {
          success: false,
          error: {
            message:
              "Cannot create relationship between tables in different applications",
            type: "ValidationError",
            code: 400,
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparentOtherApp",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("different applications");
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
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
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
          parent_table_id: "bqrparent123",
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
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("Network error");
      });
    });

    // Edge Cases
    describe("Edge Cases", () => {
      it("should handle creating relationship that already exists", async () => {
        const mockResponse = {
          success: false,
          error: {
            message: "A relationship between these tables already exists",
            type: "ConflictError",
            code: 409,
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("already exists");
      });

      it("should create relationship with summary field and WHERE filter", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 19,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 19,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [
              { id: 60, label: "Active Orders Total", type: "numeric" },
            ],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          summary_field_id: 8,
          summary_accumulation_type: "SUM" as const,
          summary_label: "Active Orders Total",
          summary_where: "{6.EX.'Active'}",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.summaryFields).toHaveLength(1);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
            summaryFields: [
              {
                summaryFid: 8,
                accumulationType: "SUM",
                label: "Active Orders Total",
                where: "{6.EX.'Active'}",
              },
            ],
          },
        });
      });

      it("should handle response with missing optional fields", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 20,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 20,
              label: "Related Parent",
              type: "numeric",
            },
            // Missing lookupFields and summaryFields
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.lookupFields).toEqual([]);
        expect(result.data?.summaryFields).toEqual([]);
      });

      it("should handle empty lookup_field_ids array", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 21,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 21,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
          lookup_field_ids: [],
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        // Empty array should not be included in the request body
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship",
          body: {
            parentTableId: "bqrparent123",
          },
        });
      });

      it("should handle response missing foreignKeyField", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 22,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            // Missing foreignKeyField
            lookupFields: [],
            summaryFields: [],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          parent_table_id: "bqrparent123",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        // Should provide default empty foreignKeyField
        expect(result.data?.foreignKeyField).toEqual({
          id: 0,
          label: "",
          type: "",
        });
      });
    });
  });

  describe("UpdateRelationshipTool", () => {
    let tool: UpdateRelationshipTool;

    beforeEach(() => {
      tool = new UpdateRelationshipTool(mockClient);
    });

    it("should have correct properties", () => {
      expect(tool.name).toBe("update_relationship");
      expect(tool.description).toBeTruthy();
      expect(tool.description).toContain("ADDITIVE ONLY");
      expect(tool.description).toContain("field deletion tools");
      expect(tool.paramSchema).toBeDefined();
      expect(tool.paramSchema.required).toContain("table_id");
      expect(tool.paramSchema.required).toContain("relationship_id");
    });

    it("should have conditional validation in schema", () => {
      expect(tool.paramSchema.if).toBeDefined();
      expect(tool.paramSchema.then).toBeDefined();
      expect(tool.paramSchema.if.required).toContain("summary_field_id");
      expect(tool.paramSchema.then.required).toContain(
        "summary_accumulation_type",
      );
    });

    // Happy Path Tests
    describe("Happy Path", () => {
      it("should add lookup fields to existing relationship", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [
              { id: 20, label: "Parent Name", type: "text" },
              { id: 21, label: "Parent Email", type: "email" },
            ],
            summaryFields: [],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          lookup_field_ids: [6, 7],
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe(10);
        expect(result.data?.lookupFields).toHaveLength(2);
        expect(result.data?.lookupFields[0].label).toBe("Parent Name");
        expect(result.data?.lookupFields[1].label).toBe("Parent Email");
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship/10",
          body: {
            lookupFieldIds: [6, 7],
          },
        });
      });

      it("should add summary field to existing relationship", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [{ id: 30, label: "Total Amount", type: "numeric" }],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          summary_field_id: 8,
          summary_accumulation_type: "SUM" as const,
          summary_label: "Total Amount",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.summaryFields).toHaveLength(1);
        expect(result.data?.summaryFields[0].label).toBe("Total Amount");
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship/10",
          body: {
            summaryFields: [
              {
                summaryFid: 8,
                accumulationType: "SUM",
                label: "Total Amount",
              },
            ],
          },
        });
      });

      it("should add both lookup and summary fields", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [{ id: 20, label: "Parent Name", type: "text" }],
            summaryFields: [{ id: 30, label: "Child Count", type: "numeric" }],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          lookup_field_ids: [6],
          summary_field_id: 3,
          summary_accumulation_type: "COUNT" as const,
          summary_label: "Child Count",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.lookupFields).toHaveLength(1);
        expect(result.data?.summaryFields).toHaveLength(1);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship/10",
          body: {
            lookupFieldIds: [6],
            summaryFields: [
              {
                summaryFid: 3,
                accumulationType: "COUNT",
                label: "Child Count",
              },
            ],
          },
        });
      });

      it("should add summary field with WHERE filter", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [
              { id: 60, label: "Active Orders Total", type: "numeric" },
            ],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          summary_field_id: 8,
          summary_accumulation_type: "SUM" as const,
          summary_label: "Active Orders Total",
          summary_where: "{6.EX.'Active'}",
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.summaryFields).toHaveLength(1);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship/10",
          body: {
            summaryFields: [
              {
                summaryFid: 8,
                accumulationType: "SUM",
                label: "Active Orders Total",
                where: "{6.EX.'Active'}",
              },
            ],
          },
        });
      });

      it("should add summary field with AVG accumulation", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [
              { id: 32, label: "Average Score", type: "numeric" },
            ],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          summary_field_id: 9,
          summary_accumulation_type: "AVG" as const,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship/10",
          body: {
            summaryFields: [
              {
                summaryFid: 9,
                accumulationType: "AVG",
              },
            ],
          },
        });
      });

      it("should add summary field with MAX accumulation", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [{ id: 33, label: "Latest Date", type: "date" }],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          summary_field_id: 11,
          summary_accumulation_type: "MAX" as const,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship/10",
          body: {
            summaryFields: [
              {
                summaryFid: 11,
                accumulationType: "MAX",
              },
            ],
          },
        });
      });

      it("should add summary field with MIN accumulation", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [{ id: 34, label: "Earliest Date", type: "date" }],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          summary_field_id: 12,
          summary_accumulation_type: "MIN" as const,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship/10",
          body: {
            summaryFields: [
              {
                summaryFid: 12,
                accumulationType: "MIN",
              },
            ],
          },
        });
      });
    });

    // Error Cases
    describe("Error Cases", () => {
      it("should handle relationship not found (404)", async () => {
        const mockResponse = {
          success: false,
          error: {
            message: "Relationship not found",
            type: "NotFoundError",
            code: 404,
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 999,
          lookup_field_ids: [6],
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("Relationship not found");
      });

      it("should handle invalid lookup field IDs", async () => {
        const mockResponse = {
          success: false,
          error: {
            message: "Invalid field ID: 999",
            type: "ValidationError",
            code: 400,
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          lookup_field_ids: [999],
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("Invalid field ID");
      });

      it("should fail when summary_field_id provided without summary_accumulation_type", async () => {
        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          summary_field_id: 8,
          // Missing summary_accumulation_type
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("summary_accumulation_type");
        expect(result.error?.message).toContain("required");
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
          table_id: "bqrchild456",
          relationship_id: 10,
          lookup_field_ids: [6],
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
          relationship_id: 10,
          lookup_field_ids: [6],
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
          table_id: "bqrchild456",
          relationship_id: 10,
          lookup_field_ids: [6],
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("Network error");
      });
    });

    // Edge Cases
    describe("Edge Cases", () => {
      it("should verify additive behavior - existing fields are preserved", async () => {
        // Response includes both existing and newly added fields
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [
              { id: 20, label: "Existing Lookup", type: "text" }, // Existing
              { id: 21, label: "New Lookup", type: "text" }, // Newly added
            ],
            summaryFields: [
              { id: 30, label: "Existing Summary", type: "numeric" }, // Existing
            ],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          lookup_field_ids: [7], // Adding only one new lookup
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        // Verify all fields (existing + new) are returned
        expect(result.data?.lookupFields).toHaveLength(2);
        expect(result.data?.summaryFields).toHaveLength(1);
        // Both existing and new fields should be present
        expect(result.data?.lookupFields[0].label).toBe("Existing Lookup");
        expect(result.data?.lookupFields[1].label).toBe("New Lookup");
      });

      it("should handle empty update (no fields to add)", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [{ id: 20, label: "Existing Lookup", type: "text" }],
            summaryFields: [],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          // No lookup_field_ids or summary_field_id provided
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        // Should still return current relationship state
        expect(result.data?.id).toBe(10);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship/10",
          body: {},
        });
      });

      it("should handle adding fields that already exist (API returns all fields)", async () => {
        // When adding a lookup field that already exists, API still succeeds
        // and returns all fields (existing behavior is additive/idempotent)
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [{ id: 20, label: "Existing Lookup", type: "text" }],
            summaryFields: [],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          lookup_field_ids: [6], // Same field that already exists
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        // API handles duplicates gracefully
        expect(result.data?.lookupFields).toHaveLength(1);
      });

      it("should handle empty lookup_field_ids array", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            foreignKeyField: {
              id: 10,
              label: "Related Parent",
              type: "numeric",
            },
            lookupFields: [],
            summaryFields: [],
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
          lookup_field_ids: [],
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        // Empty array should not be included in the request body
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "POST",
          path: "/tables/bqrchild456/relationship/10",
          body: {},
        });
      });

      it("should handle response with missing optional fields", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 10,
            parentTableId: "bqrparent123",
            childTableId: "bqrchild456",
            // Missing foreignKeyField, lookupFields, summaryFields
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.foreignKeyField).toEqual({
          id: 0,
          label: "",
          type: "",
        });
        expect(result.data?.lookupFields).toEqual([]);
        expect(result.data?.summaryFields).toEqual([]);
      });
    });
  });

  describe("DeleteRelationshipTool", () => {
    let tool: DeleteRelationshipTool;

    beforeEach(() => {
      tool = new DeleteRelationshipTool(mockClient);
    });

    it("should have correct properties", () => {
      expect(tool.name).toBe("delete_relationship");
      expect(tool.description).toBeTruthy();
      expect(tool.paramSchema).toBeDefined();
      expect(tool.paramSchema.required).toContain("table_id");
      expect(tool.paramSchema.required).toContain("relationship_id");
    });

    // Safety Warning Verification Tests
    describe("Safety Warnings", () => {
      it("should have WARNING in description", () => {
        expect(tool.description).toContain("WARNING");
      });

      it("should have DESTRUCTIVE in description", () => {
        expect(tool.description).toContain("DESTRUCTIVE");
      });

      it("should mention lookup fields deletion", () => {
        expect(tool.description).toContain("LOOKUP");
      });

      it("should mention summary fields deletion", () => {
        expect(tool.description).toContain("SUMMARY");
      });

      it("should mention data loss is permanent", () => {
        expect(tool.description).toContain("permanently");
        expect(tool.description).toContain("CANNOT be recovered");
      });

      it("should recommend get_relationships first", () => {
        expect(tool.description).toContain("get_relationships");
      });

      it("should recommend user confirmation", () => {
        expect(tool.description).toContain("Confirm with the user");
      });
    });

    // Happy Path Tests
    describe("Happy Path", () => {
      it("should delete relationship successfully", async () => {
        const mockResponse = {
          success: true,
          data: {},
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.relationshipId).toBe(10);
        expect(result.data?.deleted).toBe(true);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: "DELETE",
          path: "/tables/bqrchild456/relationship/10",
        });
      });

      it("should return deleted: true in result", async () => {
        const mockResponse = {
          success: true,
          data: {},
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqr123",
          relationship_id: 5,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.deleted).toBe(true);
      });
    });

    // Error Cases
    describe("Error Cases", () => {
      it("should handle relationship not found (404)", async () => {
        const mockResponse = {
          success: false,
          error: {
            message: "Relationship not found",
            type: "NotFoundError",
            code: 404,
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 999,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("Relationship not found");
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
          table_id: "bqrchild456",
          relationship_id: 10,
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
          relationship_id: 10,
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
          table_id: "bqrchild456",
          relationship_id: 10,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("Network error");
      });
    });

    // Edge Cases
    describe("Edge Cases", () => {
      it("should handle deleting relationship with many lookup/summary fields", async () => {
        // The API handles the deletion of associated fields internally
        // We just need to confirm the deletion succeeds
        const mockResponse = {
          success: true,
          data: {},
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10, // Relationship with many lookup/summary fields
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(true);
        expect(result.data?.deleted).toBe(true);
        expect(result.data?.relationshipId).toBe(10);
      });

      it("should preserve API error messages in response", async () => {
        const customErrorMessage =
          "Cannot delete relationship: active records depend on lookup fields";
        const mockResponse = {
          success: false,
          error: {
            message: customErrorMessage,
            type: "ValidationError",
            code: 400,
          },
        };

        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const params = {
          table_id: "bqrchild456",
          relationship_id: 10,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe(customErrorMessage);
      });

      it("should handle table not found error", async () => {
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
          relationship_id: 10,
        };

        const result = await tool.execute(params);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("Table not found");
      });
    });
  });
});
