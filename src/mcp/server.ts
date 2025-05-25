/**
 * MCP Server implementation using the official Model Context Protocol SDK
 */
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createLogger } from '../utils/logger';
import { toolRegistry } from '../tools';
import { createMcpZodSchema } from '../utils/validation';

const logger = createLogger('mcp-server');

/**
 * Create and configure an MCP server instance
 */
export function createMcpServer(): McpServer {
  // Initialize the MCP server with our app info
  const server = new McpServer({
    name: 'Quickbase MCP Connector',
    version: '2.0.0',
  });

  logger.info('MCP Server created');
  
  return server;
}

/**
 * Register tools with an existing MCP server
 */
export function registerMcpTools(server: McpServer): void {
  registerTools(server);
}

/**
 * Register all tools with the MCP server
 */
function registerTools(server: McpServer): void {
  const tools = toolRegistry.getAllTools();
  
  tools.forEach(tool => {
    // Create a Zod schema from our tool's parameter schema
    const schema = createMcpZodSchema(tool.paramSchema);
    
    // Register the tool with the MCP server
    server.tool(
      tool.name, 
      tool.description,
      schema, 
      async (params: Record<string, unknown>) => {
        try {
          logger.info(`Executing MCP tool: ${tool.name}`);
          const apiResponse = await tool.execute(params);
          
          // Handle API response - only return the data if successful
          if (!apiResponse.success || apiResponse.error) {
            const errorMessage = apiResponse.error?.message || 'Tool execution failed';
            logger.error(`Tool ${tool.name} failed`, { error: apiResponse.error });
            throw new Error(errorMessage);
          }
          
          // Ensure proper JSON formatting by using a standardized response structure
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(apiResponse.data, null, 2)
            }]
          };
        } catch (error) {
          logger.error(`Error executing MCP tool ${tool.name}`, { error });
          throw error;
        }
      }
    );
    
    logger.info(`Registered MCP tool: ${tool.name}`);
  });
  
  logger.info(`Registered ${tools.length} tools with MCP Server`);
}


/**
 * Create an HTTP transport for the MCP server
 */
export function createHttpTransport(): StreamableHTTPServerTransport {
  // Create a new transport with proper session management
  // Following the TypeScript SDK examples for HTTP transport
  return new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true
  });
}

/**
 * Handle an MCP request via HTTP
 */
export async function handleMcpRequest(
  server: McpServer, 
  transport: StreamableHTTPServerTransport, 
  req: Request, 
  res: Response
): Promise<void> {
  try {
    logger.info('Handling MCP request');
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error('Error handling MCP request', { error });
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      id: req.body?.id || null
    });
  }
}