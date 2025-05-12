import express from 'express';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { QuickbaseClient } from './client/quickbase';
import { QuickbaseConfig } from './types/config';

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
    connectorStatus.status = 'connected';
    connectorStatus.error = null;
    
    logger.info('Quickbase client initialized successfully');
  } catch (error) {
    connectorStatus.status = 'error';
    connectorStatus.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to initialize Quickbase client', { error });
  }
}

// Route for MCP: test_connection
app.post('/api/test_connection', async (_req, res) => {
  if (!quickbaseClient) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Quickbase client not initialized',
        type: 'ConfigurationError'
      }
    });
  }
  
  // Test the connection by making a simple API call
  const response = await quickbaseClient.request({
    method: 'GET',
    path: '/userinfo'
  });
  
  res.json(response);
});

// Route for MCP: configure_cache
app.post('/api/configure_cache', (req, res) => {
  const { enabled, clear } = req.body;
  
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
    // This is a placeholder - we'll need to implement cache configuration in the client
    res.json({
      success: true,
      data: {
        cacheEnabled: enabled !== undefined ? enabled : true,
        cacheCleared: !!clear
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'ConfigurationError'
      }
    });
  }
});

// Status route
app.get('/status', (_req, res) => {
  res.json({
    name: 'Quickbase MCP Connector',
    version: '2.0.0',
    status: connectorStatus.status,
    error: connectorStatus.error
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Quickbase MCP Connector v2 server running on port ${PORT}`);
  initializeClient();
});

// Export for testing
export default app;