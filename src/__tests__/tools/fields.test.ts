import { GetFieldTool } from "../../tools/fields/get_field";
import { DeleteFieldTool } from "../../tools/fields/delete_field";
import { CreateFieldTool } from "../../tools/fields/create_field";
import { UpdateFieldTool } from "../../tools/fields/update_field";
import { QuickbaseClient } from "../../client/quickbase";

// Mock the logger
jest.mock("../../utils/logger", () => ({
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe("Field Tools", () => {
  let mockClient: {
    request: jest.Mock;
    invalidateCache: jest.Mock;
  };

  beforeEach(() => {
    mockClient = {
      request: jest.fn(),
      invalidateCache: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // Mock field responses for different field types
  const mockTextField = {
    id: "6",
    label: "Customer Name",
    fieldType: "text",
    required: false,
    unique: false,
    description: "Customer full name",
    properties: { maxLength: 255 },
  };

  const mockNumericField = {
    id: "7",
    label: "Order Total",
    fieldType: "numeric",
    required: true,
    unique: false,
    description: "Total order amount",
    properties: { precision: 2 },
  };

  const mockDateField = {
    id: "8",
    label: "Order Date",
    fieldType: "date",
    required: false,
    unique: false,
    description: "Date of the order",
    properties: { format: "MM/DD/YYYY" },
  };

  const mockCheckboxField = {
    id: "9",
    label: "Is Active",
    fieldType: "checkbox",
    required: false,
    unique: false,
    description: "Whether the item is active",
    properties: {},
  };

  describe("GetFieldTool", () => {
    let tool: GetFieldTool;

    beforeEach(() => {
      tool = new GetFieldTool(mockClient as unknown as QuickbaseClient);
    });

    describe("properties", () => {
      it("should have correct name", () => {
        expect(tool.name).toBe("get_field");
      });

      it("should have correct description", () => {
        expect(tool.description).toContain("Retrieves detailed information");
        expect(tool.description).toContain("single field");
      });

      it("should have correct parameter schema", () => {
        expect(tool.paramSchema).toBeDefined();
        expect(tool.paramSchema.type).toBe("object");
        expect(tool.paramSchema.properties).toHaveProperty("table_id");
        expect(tool.paramSchema.properties).toHaveProperty("field_id");
        expect(tool.paramSchema.required).toContain("table_id");
        expect(tool.paramSchema.required).toContain("field_id");
      });
    });

    describe("execute", () => {
      describe("success cases", () => {
        it("should retrieve text field by ID", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: mockTextField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.fieldId).toBe("6");
          expect(result.data?.label).toBe("Customer Name");
          expect(result.data?.fieldType).toBe("text");
          expect(result.data?.tableId).toBe("btable123");

          expect(mockClient.request).toHaveBeenCalledWith({
            method: "GET",
            path: "/fields/6?tableId=btable123",
          });
        });

        it("should retrieve numeric field by ID", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: mockNumericField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "7",
          });

          expect(result.success).toBe(true);
          expect(result.data?.fieldType).toBe("numeric");
          expect(result.data?.properties?.precision).toBe(2);
        });

        it("should retrieve date field by ID", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: mockDateField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "8",
          });

          expect(result.success).toBe(true);
          expect(result.data?.fieldType).toBe("date");
          expect(result.data?.properties?.format).toBe("MM/DD/YYYY");
        });

        it("should include all field properties in response", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: mockTextField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(true);
          expect(result.data?.description).toBe("Customer full name");
          expect(result.data?.required).toBe(false);
          expect(result.data?.unique).toBe(false);
        });
      });

      describe("error cases", () => {
        it("should handle field not found (404)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Field not found",
              code: 404,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "999",
          });

          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error?.message).toContain("Field not found");
        });

        it("should handle bad request (400)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Invalid field ID format",
              code: 400,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "invalid",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Invalid field ID format");
        });

        it("should handle unauthorized error (401)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Unauthorized access",
              code: 401,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Unauthorized");
        });

        it("should handle rate limit error (429)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Rate limit exceeded",
              code: 429,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Rate limit exceeded");
        });

        it("should handle server error (500)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Internal server error",
              code: 500,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Internal server error");
        });

        it("should handle network error", async () => {
          mockClient.request.mockRejectedValue(new Error("Network error"));

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Network error");
        });

        it("should handle empty response data", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: null,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        });
      });
    });
  });

  describe("DeleteFieldTool", () => {
    let tool: DeleteFieldTool;

    beforeEach(() => {
      tool = new DeleteFieldTool(mockClient as unknown as QuickbaseClient);
    });

    describe("properties", () => {
      it("should have correct name", () => {
        expect(tool.name).toBe("delete_field");
      });

      it("should have correct description", () => {
        expect(tool.description).toContain("Deletes a field");
        expect(tool.description).toContain("WARNING");
        expect(tool.description).toContain("destructive");
      });

      it("should have correct parameter schema", () => {
        expect(tool.paramSchema).toBeDefined();
        expect(tool.paramSchema.type).toBe("object");
        expect(tool.paramSchema.properties).toHaveProperty("table_id");
        expect(tool.paramSchema.properties).toHaveProperty("field_id");
        expect(tool.paramSchema.properties).toHaveProperty("confirm_deletion");
        expect(tool.paramSchema.required).toContain("table_id");
        expect(tool.paramSchema.required).toContain("field_id");
      });
    });

    describe("execute", () => {
      describe("success cases", () => {
        it("should delete single field successfully", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: { deletedFieldId: "6" },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.deletedFieldId).toBe("6");
          expect(result.data?.tableId).toBe("btable123");
          expect(result.data?.message).toContain("successfully deleted");

          // Quickbase API uses DELETE /fields?tableId=... with fieldIds array in body
          expect(mockClient.request).toHaveBeenCalledWith({
            method: "DELETE",
            path: "/fields?tableId=btable123",
            body: {
              fieldIds: [6],
            },
          });
        });

        it("should delete text field", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: { deletedFieldId: "6" },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(true);
        });

        it("should delete numeric field", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: { deletedFieldId: "7" },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "7",
          });

          expect(result.success).toBe(true);
        });

        it("should delete date field", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: { deletedFieldId: "8" },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "8",
          });

          expect(result.success).toBe(true);
        });

        it("should invalidate cache after deletion", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: { deletedFieldId: "6" },
          });

          await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(mockClient.invalidateCache).toHaveBeenCalledWith(
            "fields:btable123",
          );
          expect(mockClient.invalidateCache).toHaveBeenCalledWith(
            "field:btable123:6",
          );
          expect(mockClient.invalidateCache).toHaveBeenCalledTimes(2);
        });
      });

      describe("system field protection", () => {
        it("should reject system field deletion for ID 1 (Record ID)", async () => {
          const result = await tool.execute({
            table_id: "btable123",
            field_id: "1",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain(
            "Cannot delete system fields",
          );
          expect(result.error?.message).toContain(
            "Field IDs 1-5 are protected",
          );
          expect(mockClient.request).not.toHaveBeenCalled();
        });

        it("should reject system field deletion for ID 2 (Date Created)", async () => {
          const result = await tool.execute({
            table_id: "btable123",
            field_id: "2",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain(
            "Cannot delete system fields",
          );
          expect(mockClient.request).not.toHaveBeenCalled();
        });

        it("should reject system field deletion for ID 3 (Date Modified)", async () => {
          const result = await tool.execute({
            table_id: "btable123",
            field_id: "3",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain(
            "Cannot delete system fields",
          );
          expect(mockClient.request).not.toHaveBeenCalled();
        });

        it("should reject system field deletion for ID 4 (Record Owner)", async () => {
          const result = await tool.execute({
            table_id: "btable123",
            field_id: "4",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain(
            "Cannot delete system fields",
          );
          expect(mockClient.request).not.toHaveBeenCalled();
        });

        it("should reject system field deletion for ID 5 (Last Modified By)", async () => {
          const result = await tool.execute({
            table_id: "btable123",
            field_id: "5",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain(
            "Cannot delete system fields",
          );
          expect(mockClient.request).not.toHaveBeenCalled();
        });
      });

      describe("error cases", () => {
        it("should handle field not found (404)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Field not found",
              code: 404,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "999",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Field not found");
        });

        it("should handle permission denied (403)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Permission denied",
              code: 403,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Permission denied");
        });

        it("should handle unauthorized error (401)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Unauthorized",
              code: 401,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Unauthorized");
        });

        it("should handle rate limit error (429)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Rate limit exceeded",
              code: 429,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Rate limit exceeded");
        });

        it("should handle server error (500)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Internal server error",
              code: 500,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Internal server error");
        });

        it("should handle network error", async () => {
          mockClient.request.mockRejectedValue(new Error("Network error"));

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Network error");
        });
      });
    });
  });

  describe("CreateFieldTool", () => {
    let tool: CreateFieldTool;

    beforeEach(() => {
      tool = new CreateFieldTool(mockClient as unknown as QuickbaseClient);
    });

    describe("properties", () => {
      it("should have correct name", () => {
        expect(tool.name).toBe("create_field");
      });

      it("should have correct description", () => {
        expect(tool.description).toContain("Creates a new field");
      });

      it("should have correct parameter schema", () => {
        expect(tool.paramSchema).toBeDefined();
        expect(tool.paramSchema.type).toBe("object");
        expect(tool.paramSchema.properties).toHaveProperty("table_id");
        expect(tool.paramSchema.properties).toHaveProperty("field_name");
        expect(tool.paramSchema.properties).toHaveProperty("field_type");
        expect(tool.paramSchema.properties).toHaveProperty("description");
        expect(tool.paramSchema.properties).toHaveProperty("options");
        expect(tool.paramSchema.required).toContain("table_id");
        expect(tool.paramSchema.required).toContain("field_name");
        expect(tool.paramSchema.required).toContain("field_type");
      });
    });

    describe("execute", () => {
      describe("success cases", () => {
        it("should create text field successfully", async () => {
          const createdField = {
            id: "10",
            label: "New Text Field",
            fieldType: "text",
            fieldHelp: "A new text field",
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: createdField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "New Text Field",
            field_type: "text",
            description: "A new text field",
          });

          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.data?.fieldId).toBe("10");
          expect(result.data?.label).toBe("New Text Field");
          expect(result.data?.fieldType).toBe("text");
          expect(result.data?.tableId).toBe("btable123");

          // Description maps to fieldHelp at root level (Quickbase API requirement)
          expect(mockClient.request).toHaveBeenCalledWith({
            method: "POST",
            path: "/fields?tableId=btable123",
            body: {
              label: "New Text Field",
              fieldType: "text",
              fieldHelp: "A new text field",
            },
          });
        });

        it("should create numeric field successfully", async () => {
          const createdField = {
            id: "11",
            label: "Price",
            fieldType: "numeric",
            fieldHelp: "Product price",
            properties: { precision: 2 },
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: createdField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "Price",
            field_type: "numeric",
            description: "Product price",
            options: { precision: 2 },
          });

          expect(result.success).toBe(true);
          expect(result.data?.fieldType).toBe("numeric");

          // Description maps to fieldHelp at root level, options go to properties
          expect(mockClient.request).toHaveBeenCalledWith({
            method: "POST",
            path: "/fields?tableId=btable123",
            body: {
              label: "Price",
              fieldType: "numeric",
              fieldHelp: "Product price",
              properties: { precision: 2 },
            },
          });
        });

        it("should create date field successfully", async () => {
          const createdField = {
            id: "12",
            label: "Due Date",
            fieldType: "date",
            description: "Task due date",
            properties: { format: "MM/DD/YYYY" },
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: createdField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "Due Date",
            field_type: "date",
            description: "Task due date",
            options: { format: "MM/DD/YYYY" },
          });

          expect(result.success).toBe(true);
          expect(result.data?.fieldType).toBe("date");
        });

        it("should create checkbox field successfully", async () => {
          const createdField = {
            id: "13",
            label: "Completed",
            fieldType: "checkbox",
            description: "Task completion status",
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: createdField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "Completed",
            field_type: "checkbox",
            description: "Task completion status",
          });

          expect(result.success).toBe(true);
          expect(result.data?.fieldType).toBe("checkbox");
        });

        it("should create field without description", async () => {
          const createdField = {
            id: "14",
            label: "Simple Field",
            fieldType: "text",
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: createdField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "Simple Field",
            field_type: "text",
          });

          expect(result.success).toBe(true);
          // No properties object when no description or options provided
          expect(mockClient.request).toHaveBeenCalledWith({
            method: "POST",
            path: "/fields?tableId=btable123",
            body: {
              label: "Simple Field",
              fieldType: "text",
            },
          });
        });

        it("should create field with options", async () => {
          const createdField = {
            id: "15",
            label: "Formatted Text",
            fieldType: "text",
            properties: {
              maxLength: 500,
              appearsByDefault: true,
            },
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: createdField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "Formatted Text",
            field_type: "text",
            options: {
              maxLength: 500,
              appearsByDefault: true,
            },
          });

          expect(result.success).toBe(true);
          // Options are passed through as properties
          expect(mockClient.request).toHaveBeenCalledWith({
            method: "POST",
            path: "/fields?tableId=btable123",
            body: {
              label: "Formatted Text",
              fieldType: "text",
              properties: {
                maxLength: 500,
                appearsByDefault: true,
              },
            },
          });
        });
      });

      describe("error cases", () => {
        it("should handle validation error - invalid field type", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Invalid field type",
              code: 400,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "Bad Field",
            field_type: "invalid_type",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Invalid field type");
        });

        it("should handle duplicate field name error", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "A field with this name already exists",
              code: 400,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "Existing Field",
            field_type: "text",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("already exists");
        });

        it("should handle unauthorized error (401)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Unauthorized",
              code: 401,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "New Field",
            field_type: "text",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Unauthorized");
        });

        it("should handle permission denied (403)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Permission denied to create fields",
              code: 403,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "New Field",
            field_type: "text",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Permission denied");
        });

        it("should handle table not found (404)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Table not found",
              code: 404,
            },
          });

          const result = await tool.execute({
            table_id: "nonexistent",
            field_name: "New Field",
            field_type: "text",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Table not found");
        });

        it("should handle rate limit error (429)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Rate limit exceeded",
              code: 429,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "New Field",
            field_type: "text",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Rate limit exceeded");
        });

        it("should handle server error (500)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Internal server error",
              code: 500,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "New Field",
            field_type: "text",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Internal server error");
        });

        it("should handle network error", async () => {
          mockClient.request.mockRejectedValue(new Error("Network error"));

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "New Field",
            field_type: "text",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Network error");
        });

        it("should handle empty response data", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: null,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_name: "New Field",
            field_type: "text",
          });

          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        });
      });
    });
  });

  describe("UpdateFieldTool", () => {
    let tool: UpdateFieldTool;

    beforeEach(() => {
      tool = new UpdateFieldTool(mockClient as unknown as QuickbaseClient);
    });

    describe("properties", () => {
      it("should have correct name", () => {
        expect(tool.name).toBe("update_field");
      });

      it("should have correct description", () => {
        expect(tool.description).toContain("Updates an existing field");
      });

      it("should have correct parameter schema", () => {
        expect(tool.paramSchema).toBeDefined();
        expect(tool.paramSchema.type).toBe("object");
        expect(tool.paramSchema.properties).toHaveProperty("table_id");
        expect(tool.paramSchema.properties).toHaveProperty("field_id");
        expect(tool.paramSchema.properties).toHaveProperty("name");
        expect(tool.paramSchema.properties).toHaveProperty("description");
        expect(tool.paramSchema.properties).toHaveProperty("options");
        // Note: field_type is not supported by Quickbase API for updates
        expect(tool.paramSchema.properties).not.toHaveProperty("field_type");
        expect(tool.paramSchema.required).toContain("table_id");
        expect(tool.paramSchema.required).toContain("field_id");
      });
    });

    describe("execute", () => {
      describe("success cases", () => {
        it("should update field name successfully", async () => {
          const updatedField = {
            id: "6",
            label: "Updated Name",
            fieldType: "text",
            description: "Original description",
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: updatedField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            name: "Updated Name",
          });

          expect(result.success).toBe(true);
          expect(result.data?.label).toBe("Updated Name");
          expect(result.data?.tableId).toBe("btable123");

          expect(mockClient.request).toHaveBeenCalledWith({
            method: "POST",
            path: "/fields/6?tableId=btable123",
            body: {
              label: "Updated Name",
            },
          });
        });

        it("should update field description successfully", async () => {
          const updatedField = {
            id: "6",
            label: "Customer Name",
            fieldType: "text",
            fieldHelp: "Updated description",
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: updatedField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            description: "Updated description",
          });

          expect(result.success).toBe(true);
          expect(result.data?.fieldHelp).toBe("Updated description");

          // Description maps to fieldHelp at root level (Quickbase API requirement)
          expect(mockClient.request).toHaveBeenCalledWith({
            method: "POST",
            path: "/fields/6?tableId=btable123",
            body: {
              fieldHelp: "Updated description",
            },
          });
        });

        // Note: field_type updates are not supported by Quickbase API
        // To change field type, delete and recreate the field

        it("should update multiple fields at once", async () => {
          const updatedField = {
            id: "6",
            label: "New Name",
            fieldType: "text",
            fieldHelp: "New description",
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: updatedField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            name: "New Name",
            description: "New description",
          });

          expect(result.success).toBe(true);
          // Label and fieldHelp both at root level
          expect(mockClient.request).toHaveBeenCalledWith({
            method: "POST",
            path: "/fields/6?tableId=btable123",
            body: {
              label: "New Name",
              fieldHelp: "New description",
            },
          });
        });

        it("should update field with options", async () => {
          const updatedField = {
            id: "6",
            label: "Field",
            fieldType: "text",
            description: "",
            properties: { maxLength: 1000 },
          };

          mockClient.request.mockResolvedValue({
            success: true,
            data: updatedField,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            options: { maxLength: 1000 },
          });

          expect(result.success).toBe(true);
          expect(mockClient.request).toHaveBeenCalledWith({
            method: "POST",
            path: "/fields/6?tableId=btable123",
            body: {
              properties: { maxLength: 1000 },
            },
          });
        });
      });

      describe("error cases", () => {
        it("should reject when no update fields provided", async () => {
          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("At least one update field");
          expect(mockClient.request).not.toHaveBeenCalled();
        });

        it("should reject when only empty options provided", async () => {
          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            options: {},
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("At least one update field");
          expect(mockClient.request).not.toHaveBeenCalled();
        });

        it("should handle field not found (404)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Field not found",
              code: 404,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "999",
            name: "New Name",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Field not found");
        });

        it("should handle bad request (400)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Invalid field name",
              code: 400,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            name: "Invalid@Name#$%",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Invalid field name");
        });

        it("should handle unauthorized error (401)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Unauthorized",
              code: 401,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            name: "New Name",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Unauthorized");
        });

        it("should handle permission denied (403)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Permission denied",
              code: 403,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            name: "New Name",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Permission denied");
        });

        it("should handle rate limit error (429)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Rate limit exceeded",
              code: 429,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            name: "New Name",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Rate limit exceeded");
        });

        it("should handle server error (500)", async () => {
          mockClient.request.mockResolvedValue({
            success: false,
            error: {
              message: "Internal server error",
              code: 500,
            },
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            name: "New Name",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Internal server error");
        });

        it("should handle network error", async () => {
          mockClient.request.mockRejectedValue(new Error("Network error"));

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            name: "New Name",
          });

          expect(result.success).toBe(false);
          expect(result.error?.message).toContain("Network error");
        });

        it("should handle empty response data", async () => {
          mockClient.request.mockResolvedValue({
            success: true,
            data: null,
          });

          const result = await tool.execute({
            table_id: "btable123",
            field_id: "6",
            name: "New Name",
          });

          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        });

        // Note: field_type conversion test removed - Quickbase API doesn't support field type changes
      });
    });
  });
});
