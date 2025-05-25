import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { jest } from '@jest/globals';
import { createMCPServer } from '../../mcp/server.js';
import { toolRegistry } from '../../tools/registry.js';

jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('../../tools/registry.js');

const mockServer = {
  setRequestHandler: jest.fn(),
  connect: jest.fn(),
  close: jest.fn(),
} as any;

const mockTransport = {
  start: jest.fn(),
  close: jest.fn(),
} as any;

const mockToolRegistry = {
  getAllTools: jest.fn(),
  getTool: jest.fn(),
} as any;

describe('MCP Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Server as jest.MockedClass<typeof Server>).mockImplementation(() => mockServer);
    (StdioServerTransport as jest.MockedClass<typeof StdioServerTransport>).mockImplementation(() => mockTransport);
    (toolRegistry as any) = mockToolRegistry;
  });

  describe('createMCPServer', () => {
    it('should create server with correct server info', async () => {
      const mockTools = [
        {
          name: 'test_connection',
          description: 'Test connection',
          paramSchema: { type: 'object', properties: {} },
        },
        {
          name: 'create_record',
          description: 'Create record',
          paramSchema: { type: 'object', properties: { table_id: { type: 'string' } } },
        },
      ];

      mockToolRegistry.getAllTools.mockReturnValue(mockTools);

      const server = await createMCPServer();

      expect(Server).toHaveBeenCalledWith(
        {
          name: 'quickbase-mcp-connector',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
      expect(server).toBe(mockServer);
    });

    it('should handle list_tools request', async () => {
      const mockTools = [
        {
          name: 'test_connection',
          description: 'Test connection',
          paramSchema: { type: 'object', properties: {} },
        },
        {
          name: 'create_record',
          description: 'Create record',
          paramSchema: { type: 'object', properties: { table_id: { type: 'string' } } },
        },
      ];

      mockToolRegistry.getAllTools.mockReturnValue(mockTools);

      await createMCPServer();

      const listToolsHandler = mockServer.setRequestHandler.mock.calls.find(
        call => call[1] === 'tools/list'
      )?.[2];

      expect(listToolsHandler).toBeDefined();

      const result = await listToolsHandler();

      expect(result).toEqual({
        tools: [
          {
            name: 'test_connection',
            description: 'Test connection',
            inputSchema: { type: 'object', properties: {} },
          },
          {
            name: 'create_record',
            description: 'Create record',
            inputSchema: { type: 'object', properties: { table_id: { type: 'string' } } },
          },
        ],
      });
    });

    it('should handle call_tool request with valid tool', async () => {
      const mockTool = {
        name: 'test_connection',
        execute: jest.fn().mockResolvedValue({
          success: true,
          data: { connected: true },
        }),
      };

      mockToolRegistry.getAllTools.mockReturnValue([mockTool]);
      mockToolRegistry.getTool.mockReturnValue(mockTool);

      await createMCPServer();

      const callToolHandler = mockServer.setRequestHandler.mock.calls.find(
        call => call[1] === 'tools/call'
      )?.[2];

      expect(callToolHandler).toBeDefined();

      const request = {
        params: {
          name: 'test_connection',
          arguments: {},
        },
      };

      const result = await callToolHandler(request);

      expect(mockTool.execute).toHaveBeenCalledWith({});
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: { connected: true },
            }, null, 2),
          },
        ],
      });
    });

    it('should handle call_tool request with tool that returns error', async () => {
      const mockTool = {
        name: 'test_connection',
        execute: jest.fn().mockResolvedValue({
          success: false,
          error: { message: 'Connection failed', code: 500 },
        }),
      };

      mockToolRegistry.getAllTools.mockReturnValue([mockTool]);
      mockToolRegistry.getTool.mockReturnValue(mockTool);

      await createMCPServer();

      const callToolHandler = mockServer.setRequestHandler.mock.calls.find(
        call => call[1] === 'tools/call'
      )?.[2];

      const request = {
        params: {
          name: 'test_connection',
          arguments: {},
        },
      };

      const result = await callToolHandler(request);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: { message: 'Connection failed', code: 500 },
            }, null, 2),
          },
        ],
        isError: true,
      });
    });

    it('should handle call_tool request with unknown tool', async () => {
      mockToolRegistry.getAllTools.mockReturnValue([]);
      mockToolRegistry.getTool.mockReturnValue(null);

      await createMCPServer();

      const callToolHandler = mockServer.setRequestHandler.mock.calls.find(
        call => call[1] === 'tools/call'
      )?.[2];

      const request = {
        params: {
          name: 'unknown_tool',
          arguments: {},
        },
      };

      await expect(callToolHandler(request)).rejects.toThrow('Tool unknown_tool not found');
    });

    it('should handle call_tool request with tool execution exception', async () => {
      const mockTool = {
        name: 'test_connection',
        execute: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      };

      mockToolRegistry.getAllTools.mockReturnValue([mockTool]);
      mockToolRegistry.getTool.mockReturnValue(mockTool);

      await createMCPServer();

      const callToolHandler = mockServer.setRequestHandler.mock.calls.find(
        call => call[1] === 'tools/call'
      )?.[2];

      const request = {
        params: {
          name: 'test_connection',
          arguments: {},
        },
      };

      await expect(callToolHandler(request)).rejects.toThrow('Unexpected error');
    });

    it('should handle malformed call_tool request', async () => {
      mockToolRegistry.getAllTools.mockReturnValue([]);

      await createMCPServer();

      const callToolHandler = mockServer.setRequestHandler.mock.calls.find(
        call => call[1] === 'tools/call'
      )?.[2];

      const request = {
        params: {
          // Missing name
          arguments: {},
        },
      };

      await expect(callToolHandler(request)).rejects.toThrow();
    });
  });
});