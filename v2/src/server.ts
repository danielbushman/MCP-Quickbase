import express from 'express';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { QuickbaseClient } from './client/quickbase';
import { QuickbaseConfig } from './types/config';
import { CacheService } from './utils/cache';
import { initializeTools, toolRegistry } from './tools';
import { McpRequest } from './types/mcp';

// Load environment variables
dotenv.config();

const logger = createLogger('server');

// Initialize Express app
const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3000;

// Initialize Quickbase client
let quickbaseClient: QuickbaseClient | null = null;
let cacheService: CacheService | null = null;

// Track connector status
let connectorStatus = {
  status: 'disconnected',
  error: null as string | null
};

/**
 * Initialize Quickbase client from environment variables
 */
function initializeClient(): void {
  try {
    const config: QuickbaseConfig = {
      realmHost: process.env.QUICKBASE_REALM_HOST || '',
      userToken: process.env.QUICKBASE_USER_TOKEN || '',
      appId: process.env.QUICKBASE_APP_ID,
      cacheEnabled: process.env.QUICKBASE_CACHE_ENABLED !== 'false',
      cacheTtl: parseInt(process.env.QUICKBASE_CACHE_TTL || '3600', 10),
      debug: process.env.DEBUG === 'true'
    };
    
    quickbaseClient = new QuickbaseClient(config);
    cacheService = new CacheService(
      config.cacheTtl,
      config.cacheEnabled
    );
    
    // Initialize MCP tools
    initializeTools(quickbaseClient, cacheService);
    
    connectorStatus.status = 'connected';
    connectorStatus.error = null;
    
    logger.info('Quickbase client initialized successfully');
    logger.info(`Registered tools: ${toolRegistry.getToolNames().join(', ')}`);
  } catch (error) {
    connectorStatus.status = 'error';
    connectorStatus.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to initialize Quickbase client', { error });
  }
}

// MCP tool execution endpoint
app.post('/api/:tool', async (req, res) => {
  const toolName = req.params.tool;
  const params = req.body || {};
  
  logger.info(`Executing tool: ${toolName}`, { params });
  
  if (!quickbaseClient) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Quickbase client not initialized',
        type: 'ConfigurationError'
      }
    });
  }
  
  const tool = toolRegistry.getTool(toolName);
  
  if (!tool) {
    return res.status(404).json({
      success: false,
      error: {
        message: `Tool ${toolName} not found`,
        type: 'NotFoundError'
      }
    });
  }
  
  try {
    const result = await tool.execute(params);
    res.json(result);
  } catch (error) {
    logger.error(`Error executing tool ${toolName}`, { error });
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'UnknownError'
      }
    });
  }
});

// MCP batch tool execution
app.post('/api/batch', async (req, res) => {
  const requests = req.body.requests || [];
  
  if (!Array.isArray(requests) || requests.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid batch request format',
        type: 'ValidationError'
      }
    });
  }
  
  logger.info(`Executing batch request with ${requests.length} tools`);
  
  if (!quickbaseClient) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Quickbase client not initialized',
        type: 'ConfigurationError'
      }
    });
  }
  
  try {
    const results = await Promise.all(
      requests.map(async (request: McpRequest) => {
        const tool = toolRegistry.getTool(request.tool);
        
        if (!tool) {
          return {
            tool: request.tool,
            success: false,
            error: {
              message: `Tool ${request.tool} not found`,
              type: 'NotFoundError'
            }
          };
        }
        
        try {
          const result = await tool.execute(request.params || {});
          return {
            tool: request.tool,
            ...result
          };
        } catch (error) {
          return {
            tool: request.tool,
            success: false,
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              type: error instanceof Error ? error.name : 'UnknownError'
            }
          };
        }
      })
    );
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    logger.error('Error executing batch request', { error });
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'UnknownError'
      }
    });
  }
});

// MCP schema endpoint
app.get('/api/schema', (_req, res) => {
  if (!quickbaseClient) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Quickbase client not initialized',
        type: 'ConfigurationError'
      }
    });
  }
  
  const tools = toolRegistry.getAllTools().map(tool => ({
    name: tool.name,
    description: tool.description,
    schema: tool.paramSchema
  }));
  
  res.json({
    success: true,
    data: {
      tools
    }
  });
});

// Status route
app.get('/status', (_req, res) => {
  res.json({
    name: 'Quickbase MCP Connector',
    version: '2.0.0',
    status: connectorStatus.status,
    error: connectorStatus.error,
    tools: quickbaseClient ? toolRegistry.getToolNames() : []
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Quickbase MCP Connector v2 server running on port ${PORT}`);
  initializeClient();
});

// Export for testing
export default app;