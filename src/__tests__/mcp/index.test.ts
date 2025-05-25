import { jest } from '@jest/globals';

jest.mock('../mcp/server.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

const mockCreateMCPServer = jest.fn();
const mockServer = {
  connect: jest.fn(),
  close: jest.fn(),
};
const mockTransport = {
  start: jest.fn(),
  close: jest.fn(),
};

const mockStdioServerTransport = jest.fn().mockImplementation(() => mockTransport);

jest.doMock('../../mcp/server.js', () => ({
  createMCPServer: mockCreateMCPServer,
}));

jest.doMock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: mockStdioServerTransport,
}));

describe('MCP Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateMCPServer.mockResolvedValue(mockServer);
    
    delete process.env.DEBUG;
    
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start MCP server successfully', async () => {
    const { default: startServer } = await import('../../mcp/index.js');
    
    await expect(startServer()).resolves.toBeUndefined();
    
    expect(mockCreateMCPServer).toHaveBeenCalled();
    expect(mockStdioServerTransport).toHaveBeenCalled();
    expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
  });

  it('should handle server startup errors', async () => {
    mockCreateMCPServer.mockRejectedValue(new Error('Server creation failed'));
    
    const { default: startServer } = await import('../../mcp/index.js');
    
    await expect(() => startServer()).rejects.toThrow('process.exit called');
    
    expect(console.error).toHaveBeenCalledWith('Error starting MCP server:', expect.any(Error));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle transport connection errors', async () => {
    mockServer.connect.mockRejectedValue(new Error('Connection failed'));
    
    const { default: startServer } = await import('../../mcp/index.js');
    
    await expect(() => startServer()).rejects.toThrow('process.exit called');
    
    expect(console.error).toHaveBeenCalledWith('Error starting MCP server:', expect.any(Error));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle debug mode', async () => {
    process.env.DEBUG = 'true';
    
    const { default: startServer } = await import('../../mcp/index.js');
    
    await expect(startServer()).resolves.toBeUndefined();
    
    expect(console.log).toHaveBeenCalledWith('Starting Quickbase MCP Server in debug mode...');
  });

  it('should handle production mode', async () => {
    process.env.DEBUG = 'false';
    
    const { default: startServer } = await import('../../mcp/index.js');
    
    await expect(startServer()).resolves.toBeUndefined();
    
    expect(console.log).toHaveBeenCalledWith('Starting Quickbase MCP Server...');
  });
});