import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';

// Mock all dependencies
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('dotenv');
jest.mock('../utils/logger');
jest.mock('../client/quickbase');
jest.mock('../utils/cache');
jest.mock('../tools');
jest.mock('../utils/validation');

describe('MCP Stdio Server', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockTransport: jest.Mocked<StdioServerTransport>;
  let originalEnv: NodeJS.ProcessEnv;
  let processExitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };
    
    // Clear module cache to allow fresh imports
    jest.resetModules();
    jest.clearAllMocks();
    
    // Mock process.exit
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Setup McpServer mock
    mockServer = {
      connect: jest.fn().mockResolvedValue(undefined),
      tool: jest.fn()
    } as any;
    
    (McpServer as jest.MockedClass<typeof McpServer>).mockImplementation(() => mockServer);
    
    // Setup StdioServerTransport mock
    mockTransport = {} as any;
    (StdioServerTransport as jest.MockedClass<typeof StdioServerTransport>).mockImplementation(() => mockTransport);
    
    // Mock dotenv
    (dotenv.config as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should initialize server with correct configuration', async () => {
    process.env.QUICKBASE_REALM_HOST = 'test.quickbase.com';
    process.env.QUICKBASE_USER_TOKEN = 'test-token';
    process.env.QUICKBASE_APP_ID = 'test-app';
    process.env.QUICKBASE_CACHE_ENABLED = 'true';
    process.env.QUICKBASE_CACHE_TTL = '7200';
    process.env.DEBUG = 'false';
    
    // Import and run the server
    await import('../mcp-stdio-server');
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(McpServer).toHaveBeenCalledWith({
      name: 'Quickbase MCP Connector',
      version: '2.0.0'
    });
    
    expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
  });

  it('should fail if required environment variables are missing', async () => {
    process.env.QUICKBASE_REALM_HOST = '';
    process.env.QUICKBASE_USER_TOKEN = '';
    
    try {
      await import('../mcp-stdio-server');
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Expected to throw
    }
    
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should validate realm host format', async () => {
    process.env.QUICKBASE_REALM_HOST = 'invalid-host';
    process.env.QUICKBASE_USER_TOKEN = 'test-token';
    
    try {
      await import('../mcp-stdio-server');
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Expected to throw
    }
    
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should validate cache TTL', async () => {
    process.env.QUICKBASE_REALM_HOST = 'test.quickbase.com';
    process.env.QUICKBASE_USER_TOKEN = 'test-token';
    process.env.QUICKBASE_CACHE_TTL = 'invalid';
    
    try {
      await import('../mcp-stdio-server');
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Expected to throw
    }
    
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle SIGTERM signal', async () => {
    process.env.QUICKBASE_REALM_HOST = 'test.quickbase.com';
    process.env.QUICKBASE_USER_TOKEN = 'test-token';
    
    await import('../mcp-stdio-server');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Trigger SIGTERM
    process.emit('SIGTERM', 'SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle SIGINT signal', async () => {
    process.env.QUICKBASE_REALM_HOST = 'test.quickbase.com';
    process.env.QUICKBASE_USER_TOKEN = 'test-token';
    
    await import('../mcp-stdio-server');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Trigger SIGINT
    process.emit('SIGINT', 'SIGINT');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle server connection failure', async () => {
    process.env.QUICKBASE_REALM_HOST = 'test.quickbase.com';
    process.env.QUICKBASE_USER_TOKEN = 'test-token';
    
    mockServer.connect.mockRejectedValue(new Error('Connection failed'));
    
    try {
      await import('../mcp-stdio-server');
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Expected to throw
    }
    
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});