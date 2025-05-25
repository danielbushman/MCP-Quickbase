import { CreateAppTool } from '../../tools/apps/create_app';
import { UpdateAppTool } from '../../tools/apps/update_app';
import { ListTablesTool } from '../../tools/apps/list_tables';
import { QuickbaseClient } from '../../client/quickbase';
import { ApiResponse } from '../../types/api';

describe('App Tools', () => {
  let mockClient: jest.Mocked<QuickbaseClient>;

  beforeEach(() => {
    mockClient = {
      request: jest.fn()
    } as any;
  });

  describe('CreateAppTool', () => {
    let tool: CreateAppTool;

    beforeEach(() => {
      tool = new CreateAppTool(mockClient);
    });

    it('should create an app with minimal parameters', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 'bqp9xre8k',
          name: 'Test App',
          created: '2024-01-01T00:00:00Z'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({ name: 'Test App' });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/apps',
        body: {
          name: 'Test App'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should create an app with all parameters', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 'bqp9xre8k',
          name: 'Full App',
          description: 'Test description'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const params = {
        name: 'Full App',
        description: 'Test description',
        options: {
          assignToken: false,
          generateUniqueName: true
        }
      };

      const result = await tool.execute(params);

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/apps',
        body: {
          name: 'Full App',
          description: 'Test description',
          assignToken: false,
          generateUniqueName: true
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 403,
          message: 'User does not have permission to create apps'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      const result = await tool.execute({ name: 'Test App' });

      expect(result).toEqual(mockError);
    });
  });

  describe('UpdateAppTool', () => {
    let tool: UpdateAppTool;

    beforeEach(() => {
      tool = new UpdateAppTool(mockClient);
    });

    it('should update app name', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 'bqp9xre8k',
          name: 'Updated App'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({
        app_id: 'bqp9xre8k',
        name: 'Updated App'
      });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/apps/bqp9xre8k',
        body: {
          name: 'Updated App'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should update multiple app properties', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          id: 'bqp9xre8k',
          name: 'Updated App',
          description: 'Updated description'
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const params = {
        app_id: 'bqp9xre8k',
        name: 'Updated App',
        description: 'Updated description',
        options: {
          variables: [
            { name: 'var1', value: 'newValue' }
          ]
        }
      };

      const result = await tool.execute(params);

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/apps/bqp9xre8k',
        body: {
          name: 'Updated App',
          description: 'Updated description',
          variables: [
            { name: 'var1', value: 'newValue' }
          ]
        }
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('ListTablesTool', () => {
    let tool: ListTablesTool;

    beforeEach(() => {
      tool = new ListTablesTool(mockClient);
    });

    it('should list tables for default app', async () => {
      mockClient = {
        request: jest.fn(),
        config: { appId: 'default-app' }
      } as any;
      
      tool = new ListTablesTool(mockClient);

      const mockResponse: ApiResponse<any> = {
        success: true,
        data: [
          { id: 'bp8uqvy64', name: 'Customers' },
          { id: 'bp8uqvy65', name: 'Orders' }
        ]
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({});

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/tables',
        params: {
          appId: 'default-app'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should list tables for specified app', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: [
          { id: 'bp8uqvy64', name: 'Projects' }
        ]
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({ app_id: 'custom-app' });

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/tables',
        params: {
          appId: 'custom-app'
        }
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle empty table list', async () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: []
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await tool.execute({ app_id: 'empty-app' });

      expect(result).toEqual(mockResponse);
    });

    it('should handle error when app not found', async () => {
      const mockError: ApiResponse<any> = {
        success: false,
        error: {
          code: 404,
          message: 'Application not found'
        }
      };

      mockClient.request.mockResolvedValue(mockError);

      const result = await tool.execute({ app_id: 'nonexistent' });

      expect(result).toEqual(mockError);
    });
  });
});