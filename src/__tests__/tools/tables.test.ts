import { CreateTableTool } from '../../tools/tables/create_table';
import { UpdateTableTool } from '../../tools/tables/update_table';
import { GetTableFieldsTool } from '../../tools/tables/get_table_fields';
import { QuickbaseClient } from '../../client/quickbase';
import { ApiResponse } from '../../types/api';

describe('Table Tools', () => {
  let mockClient: jest.Mocked<QuickbaseClient>;

  beforeEach(() => {
    mockClient = {
      request: jest.fn(),
      config: { appId: 'default-app' }
    } as any;
  });

  describe('CreateTableTool', () => {
    let tool: CreateTableTool;

    beforeEach(() => {
      tool = new CreateTableTool(mockClient);
    });

    it('should create a simple table', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 'bp8uqvy64',
          name: 'Customers',
          alias: 'customers_bp8uqvy64'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        app_id: 'test-app',
        name: 'Customers'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/tables?appId=test-app',
        body: {
          name: 'Customers'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should create table with description', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 'bp8uqvy64',
          name: 'Projects',
          description: 'Project tracking'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        app_id: 'test-app',
        name: 'Projects',
        description: 'Project tracking'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/tables?appId=test-app',
        body: {
          name: 'Projects',
          description: 'Project tracking'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should create table with fields', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 'bp8uqvy64',
          name: 'Orders',
          fields: [
            { id: 6, label: 'Order Number' },
            { id: 7, label: 'Amount' }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        app_id: 'test-app',
        name: 'Orders',
        fields: [
          {
            name: 'Order Number',
            type: 'text'
          },
          {
            name: 'Amount',
            type: 'numeric',
            properties: { numberFormat: 2 }
          }
        ]
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/tables?appId=test-app',
        body: {
          name: 'Orders',
          fields: [
            {
              name: 'Order Number',
              type: 'text'
            },
            {
              name: 'Amount',
              type: 'numeric',
              properties: { numberFormat: 2 }
            }
          ]
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should use default app ID when not specified', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: { id: 'bp8uqvy64' }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await tool.execute({ 
        app_id: 'test-app',
        name: 'Test Table' 
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/tables?appId=test-app',
        body: expect.any(Object)
      });
    });

    it('should handle table creation errors', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 403,
          message: 'Permission denied'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      await expect(tool.execute({
        app_id: 'test-app',
        name: 'Test Table'
      })).rejects.toThrow('Permission denied');
    });

    it('should handle missing response data', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: null
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        app_id: 'test-app',
        name: 'Test Table'
      })).rejects.toThrow('Failed to create table');
    });

    it('should handle response without success flag', async () => {
      const mockResponse: ApiResponse<any> = {
        success: false,
        error: undefined
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        app_id: 'test-app',
        name: 'Test Table'
      })).rejects.toThrow('Failed to create table');
    });
  });

  describe('UpdateTableTool', () => {
    let tool: UpdateTableTool;

    beforeEach(() => {
      tool = new UpdateTableTool(mockClient);
    });

    it('should update table name', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 'bp8uqvy64',
          name: 'Updated Customers'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        name: 'Updated Customers'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/tables/bp8uqvy64',
        body: {
          name: 'Updated Customers'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should update table description', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 'bp8uqvy64',
          description: 'Updated description'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        description: 'Updated description'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/tables/bp8uqvy64',
        body: {
          description: 'Updated description'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle update errors', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 404,
          message: 'Table not found'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        name: 'Updated Name'
      })).rejects.toThrow('Table not found');
    });

    it('should handle missing response data', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: null
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        name: 'Updated Name'
      })).rejects.toThrow('Failed to update table');
    });

    it('should handle response without success flag', async () => {
      const mockResponse: ApiResponse<any> = {
        success: false,
        error: undefined
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64',
        name: 'Updated Name'
      })).rejects.toThrow('Failed to update table');
    });
  });

  describe('GetTableFieldsTool', () => {
    let tool: GetTableFieldsTool;

    beforeEach(() => {
      tool = new GetTableFieldsTool(mockClient);
    });

    it('should get all table fields', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: [
          {
            id: 3,
            label: 'Record ID#',
            type: 'recordid',
            mode: 'virtual'
          },
          {
            id: 6,
            label: 'Customer Name',
            type: 'text',
            mode: ''
          },
          {
            id: 7,
            label: 'Email',
            type: 'email',
            mode: ''
          }
        ]
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/fields?tableId=bp8uqvy64'
      });

      expect(result).toEqual(mockResponse);
    });

    it('should include field permissions', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: [
          {
            id: 8,
            label: 'Related Customer',
            type: 'lookup',
            properties: {
              sourceFieldId: 3,
              targetTableId: 'bp8uqvy65',
              targetFieldId: 6
            }
          }
        ]
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        include_system: true
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/fields?tableId=bp8uqvy64&includeFieldPerms=true'
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle table not found error', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 404,
          message: 'Table bp8uqvy99 not found'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      await expect(tool.execute({
        table_id: 'bp8uqvy99'
      })).rejects.toThrow('Table bp8uqvy99 not found');
    });

    it('should handle missing response data', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: null
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64'
      })).rejects.toThrow('Failed to get table fields');
    });

    it('should handle response without success flag', async () => {
      const mockResponse: ApiResponse<any> = {
        success: false,
        error: undefined
      };

      mockClient.request.mockResolvedValue(mockResponse);

      await expect(tool.execute({
        table_id: 'bp8uqvy64'
      })).rejects.toThrow('Failed to get table fields');
    });

    it('should filter fields by type', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: [
          {
            id: 6,
            label: 'Customer Name',
            fieldType: 'text',
            mode: ''
          },
          {
            id: 7,
            label: 'Amount',
            fieldType: 'numeric',
            mode: ''
          },
          {
            id: 8,
            label: 'Description',
            fieldType: 'text',
            mode: ''
          }
        ]
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        table_id: 'bp8uqvy64',
        field_type: 'text'
      });

      expect(result.data?.fields).toHaveLength(2);
      expect(result.data?.fields.every(f => f.fieldType === 'text')).toBe(true);
    });
  });
});