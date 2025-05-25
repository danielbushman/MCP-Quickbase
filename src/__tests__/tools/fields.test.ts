import { CreateFieldTool } from '../../tools/fields/create_field';
import { UpdateFieldTool } from '../../tools/fields/update_field';
import { QuickbaseClient } from '../../client/quickbase';
import { ApiResponse } from '../../types/api';

describe('Field Tools', () => {
  let mockClient: jest.Mocked<QuickbaseClient>;

  beforeEach(() => {
    mockClient = {
      request: jest.fn()
    } as any;
  });

  describe('CreateFieldTool', () => {
    let tool: CreateFieldTool;

    beforeEach(() => {
      tool = new CreateFieldTool(mockClient);
    });

    it('should create a text field', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 6,
          label: 'Customer Name',
          type: 'text'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        field_name: 'Customer Name',
        field_type: 'text'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/fields?tableId=bp8uqvy64',
        body: {
          label: 'Customer Name',
          fieldType: 'text'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should create a numeric field with properties', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 7,
          label: 'Amount',
          type: 'numeric',
          properties: {
            numberFormat: 2,
            doesTotal: true
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        field_name: 'Amount',
        field_type: 'numeric',
        options: {
          numberFormat: 2,
          doesTotal: true
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/fields?tableId=bp8uqvy64',
        body: {
          label: 'Amount',
          fieldType: 'numeric',
          properties: {
            numberFormat: 2,
            doesTotal: true
          }
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should create a lookup field', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 8,
          label: 'Customer Info',
          type: 'lookup'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        field_name: 'Customer Info',
        field_type: 'lookup',
        options: {
          sourceFieldId: '3',
          targetTableId: 'bp8uqvy65',
          targetFieldId: '6'
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/fields?tableId=bp8uqvy64',
        body: {
          label: 'Customer Info',
          fieldType: 'lookup',
          properties: {
            sourceFieldId: '3',
            targetTableId: 'bp8uqvy65',
            targetFieldId: '6'
          }
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 400,
          message: 'Invalid field type: invalid_type'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        field_name: 'Bad Field',
        field_type: 'invalid_type'
      })).rejects.toThrow('Invalid field type: invalid_type');
    });

    it('should handle missing response data', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: null
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        field_name: 'Test Field',
        field_type: 'text'
      })).rejects.toThrow('Failed to create field');
    });

    it('should handle response without success flag', async () => {
      const mockResponse: ApiResponse<any> = {
        success: false,
        error: undefined
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        field_name: 'Test Field',
        field_type: 'text'
      })).rejects.toThrow('Failed to create field');
    });
  });

  describe('UpdateFieldTool', () => {
    let tool: UpdateFieldTool;

    beforeEach(() => {
      tool = new UpdateFieldTool(mockClient);
    });

    it('should update field label', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 6,
          label: 'Updated Customer Name'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        field_id: '6',
        name: 'Updated Customer Name'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/fields/6?tableId=bp8uqvy64',
        body: {
          label: 'Updated Customer Name'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should update field properties', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 7,
          label: 'Amount',
          properties: {
            numberFormat: 3,
            doesTotal: false
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        field_id: '7',
        options: {
          properties: {
            numberFormat: 3,
            doesTotal: false
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/fields/7?tableId=bp8uqvy64',
        body: {
          properties: {
            numberFormat: 3,
            doesTotal: false
          }
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should update field permissions', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 6,
          permissions: [
            { roleId: 1, permissionType: 'view' },
            { roleId: 2, permissionType: 'modify' }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        field_id: '6',
        options: {
          permissions: [
            { roleId: 1, permissionType: 'view' },
            { roleId: 2, permissionType: 'modify' }
          ]
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/fields/6?tableId=bp8uqvy64',
        body: {
          permissions: [
            { roleId: 1, permissionType: 'view' },
            { roleId: 2, permissionType: 'modify' }
          ]
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle field not found error', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 404,
          message: 'Field 999 not found'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        field_id: '999',
        name: 'Update Name'
      })).rejects.toThrow('Field 999 not found');
    });

    it('should handle missing response data', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: null
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        field_id: '6',
        name: 'Updated Name'
      })).rejects.toThrow('Failed to update field');
    });

    it('should handle response without success flag', async () => {
      const mockResponse: ApiResponse<any> = {
        success: false,
        error: undefined
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        field_id: '6',
        name: 'Updated Name'
      })).rejects.toThrow('Failed to update field');
    });
  });
});